import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { chooseSelectOption, selectBridge } from "./select-helpers";

test("custom Select preserves its native form bridge and validation", async ({ page }) => {
  await page.goto("/components/select");
  const select = page.locator(".preview-stage").getByRole("combobox", { name: "Project visibility" });
  const bridge = selectBridge(select);
  await expect(select).toHaveJSProperty("tagName", "BUTTON");
  await expect(bridge).toHaveValue("private");
  await expect(bridge.locator("option")).toHaveText(["Private", "Team", "Public"]);
  await page.getByRole("button", { name: "Focus control", exact: true }).click();
  await expect(select).toBeFocused();
  await chooseSelectOption(select, "public");
  const submitted = await bridge.evaluate((node: HTMLSelectElement) => {
    const form = document.createElement("form");
    form.id = "native-select-owner";
    node.closest(".preview-stage")!.append(form);
    node.setAttribute("form", form.id);
    const value = new FormData(form).get("visibility");
    form.reset();
    return { value, reset: node.value, owner: node.form === form };
  });
  expect(submitted).toEqual({ value: "public", reset: "private", owner: true });
  await bridge.evaluate((node: HTMLSelectElement) => {
    node.add(new Option("Choose visibility", ""), 0);
    node.required = true;
    node.value = "";
  });
  expect(await bridge.evaluate((node: HTMLSelectElement) => node.checkValidity())).toBe(false);
  await chooseSelectOption(select, "team");
  expect(await bridge.evaluate((node: HTMLSelectElement) => node.checkValidity())).toBe(true);
  await expect(page.locator("#usage .site-code-block code")).toContainText("Select");
});

test("Select sizing, invalid, focus and disabled states share the field geometry", async ({ page }) => {
  await page.goto("/components/select");
  const select = page.locator(".preview-stage").getByRole("combobox");
  const size = page.getByRole("combobox", { name: "Select prop controlSize", exact: true });
  for (const rootSize of [16, 20, 24]) {
    await page.evaluate((value) => { document.documentElement.style.fontSize = `${value}px`; }, rootSize);
    for (const [key, height] of Object.entries({ sm: 32, md: 40, lg: 44, xl: 48 })) {
      await chooseSelectOption(size, key);
      expect((await select.boundingBox())!.height).toBeCloseTo(height * rootSize / 16, 1);
    }
    const layoutBox = () => select.evaluate(node => {
      const rect = node.getBoundingClientRect();
      return { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height };
    });
    const before = await layoutBox();
    await page.keyboard.press("Tab");
    await select.focus();
    await expect(select).toHaveCSS("border-width", "2px");
    await expect(select).toHaveCSS("outline-offset", "0px");
    expect(await layoutBox()).toEqual(before);
  }
  await page.getByRole("checkbox", { name: "Select prop invalid", exact: true }).check();
  await expect(select).toHaveAttribute("aria-invalid", "true");
  await expect(select).toHaveCSS("border-color", "rgb(255, 138, 138)");
  await page.keyboard.press("Tab");
  await select.focus();
  await expect(select).toHaveCSS("border-color", "rgb(255, 92, 168)");
  await page.getByRole("checkbox", { name: "Select prop disabled", exact: true }).check();
  await expect(select).toBeDisabled();
  await expect(select).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(select).toBeEnabled();
  await expect(selectBridge(select)).toHaveValue("private");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("custom checkbox and radio glyphs stay fixed when labels grow and remain keyboard operable", async ({ page }) => {
  for (const kind of ["checkbox", "radio"] as const) {
    await page.goto(`/components/${kind}`);
    const control = page.locator(".preview-stage").getByRole(kind).first();
    await expect(control).toHaveCSS("appearance", "none");
    await expect(control).toBeChecked();
    for (const rootSize of [16, 20, 24]) {
      await page.evaluate((size) => { document.documentElement.style.fontSize = `${size}px`; }, rootSize);
      const before = await control.boundingBox();
      expect(before!.width).toBeCloseTo(18 * rootSize / 16, 1);
      expect(before!.height).toBeCloseTo(before!.width, 1);
      const glyph = await control.evaluate((node) => {
        const css = getComputedStyle(node, "::before");
        return { width: css.width, height: css.height, opacity: css.opacity, color: css.color };
      });
      expect(glyph.opacity).toBe("1");
      for (const labelSize of [12, 48]) {
        await control.evaluate((node, value) => { node.closest("label")!.style.fontSize = `${value}px`; }, labelSize);
        const after = await control.boundingBox();
        expect(after!.width).toBeCloseTo(before!.width, 1);
        expect(after!.height).toBeCloseTo(before!.height, 1);
        const afterGlyph = await control.evaluate((node) => { const css = getComputedStyle(node, "::before"); return { width: css.width, height: css.height }; });
        expect(afterGlyph).toEqual({ width: glyph.width, height: glyph.height });
      }
    }
    await control.focus();
    if (kind === "checkbox") {
      await page.keyboard.press("Space");
      await expect(control).not.toBeChecked();
      expect(await control.evaluate(node => getComputedStyle(node, "::before").opacity)).toBe("0");
      await control.evaluate((node: HTMLInputElement) => { node.indeterminate = true; });
      expect(await control.evaluate(node => getComputedStyle(node, "::before").opacity)).toBe("1");
    } else {
      await page.keyboard.press("ArrowDown");
      await expect(page.locator(".preview-stage").getByRole("radio", { name: "Public", exact: true })).toBeChecked();
      await expect(control).not.toBeChecked();
    }
    await page.getByRole("checkbox", { name: `${kind === "checkbox" ? "Checkbox" : "Radio"} prop disabled`, exact: true }).check();
    await expect(control).toBeDisabled();
  }
});

test("buttons stay intrinsic as direct Stack children while sibling actions share deliberate gaps", async ({ page }) => {
  await page.goto("/components/stack");
  const button = page.locator(".preview-stage").getByRole("button", { name: "Try an action", exact: true });
  const geometry = await button.evaluate((node) => ({ width: node.getBoundingClientRect().width, parentWidth: node.parentElement!.getBoundingClientRect().width, directStack: node.parentElement!.classList.contains("flood-stack") }));
  expect(geometry.directStack).toBe(true);
  expect(geometry.width).toBeLessThan(geometry.parentWidth - 16);
  await button.click();
  await expect(page.locator(".preview-stage").getByRole("status")).toHaveText("Action completed locally.");
});

test("workbench knobs use Flood controls with 8px inner and 16px group rhythm", async ({ page }) => {
  await page.goto("/components/button");
  const controls = page.locator(".workbench-controls").first();
  await expect(controls.getByRole("combobox")).toHaveCount(2);
  for (const rootSize of [16, 20]) {
    await page.evaluate((size) => { document.documentElement.style.fontSize = `${size}px`; }, rootSize);
    await expect(controls).toHaveCSS("column-gap", `${rootSize}px`);
    await expect(controls).toHaveCSS("row-gap", `${rootSize}px`);
    const toggle = controls.getByRole("checkbox", { name: "Button prop disabled", exact: true });
    const grouping = await toggle.evaluate(node => {
      const label = node.closest("label")!;
      const text = label.querySelector("span")!;
      const inputBox = node.getBoundingClientRect(), textBox = text.getBoundingClientRect();
      return { gap: getComputedStyle(label).columnGap, delta: Math.abs(inputBox.y + inputBox.height / 2 - textBox.y - textBox.height / 2) };
    });
    expect(grouping.gap).toBe(`${rootSize / 2}px`);
    expect(grouping.delta).toBeLessThanOrEqual(1);
    const select = controls.getByRole("combobox", { name: "Button prop size", exact: true });
    await expect(select).toHaveClass(/flood-select__control/);
    const selectBox = (await select.boundingBox())!, toggleBox = (await toggle.boundingBox())!;
    // Only compare shared rows: narrow layouts deliberately wrap whole groups.
    if (Math.abs(selectBox.y - toggleBox.y) < selectBox.height) {
      expect(Math.abs(selectBox.y + selectBox.height / 2 - toggleBox.y - toggleBox.height / 2)).toBeLessThanOrEqual(1);
    }
  }
  await controls.getByRole("checkbox", { name: "Button prop disabled", exact: true }).check();
  await expect(page.locator(".preview-stage").getByRole("button", { name: "Save changes" })).toBeDisabled();
});

test("forced colors keep custom Select usable and restore native choice rendering", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  for (const kind of ["select", "checkbox", "radio"] as const) {
    await page.goto(`/components/${kind}`);
    const control = page.locator(".preview-stage").getByRole(kind === "select" ? "combobox" : kind).first();
    if (kind !== "select") await expect(control).toHaveCSS("appearance", "auto");
    await control.focus();
    await expect(control).toBeFocused();
    await expect(control).toHaveCSS(kind === "select" ? "border-width" : "outline-width", "2px");
    if (kind !== "select") expect(await control.evaluate(node => getComputedStyle(node, "::before").display)).toBe("none");
    else {
      await chooseSelectOption(control, "team");
      await expect(selectBridge(control)).toHaveValue("team");
    }
  }
});
