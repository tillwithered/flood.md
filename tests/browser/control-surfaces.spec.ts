import { test, expect } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";
import { openSelectFixture } from "./select-fixture";

test("ordinary control outlines share the quiet container tone while selected states remain distinct", async ({ page }) => {
  for (const slug of ["input", "textarea", "select", "checkbox", "radio", "switch", "button"]) {
    await page.goto(`/components/${slug}`);
    const stage = page.locator(".preview-stage");
    await expect(stage).toBeVisible();
    if (["checkbox", "switch"].includes(slug)) await page.getByRole("checkbox", { name: `${slug === "checkbox" ? "Checkbox" : "Switch"} prop checked`, exact: true }).uncheck();
    if (slug === "button") await chooseSelectOption(page.getByRole("combobox", { name: "Button prop variant", exact: true }), "outline");
    const control = slug === "radio" ? stage.getByRole("radio", { name: "Public", exact: true }) : stage.locator(slug === "checkbox" ? ".flood-check" : slug === "switch" ? ".flood-switch-input" : slug === "button" ? ".flood-button" : ".flood-input").first();
    await expect(control).toHaveCSS("border-color", "rgb(56, 56, 56)");
    await expect(page.locator(".component-workbench")).toHaveCSS("border-color", "rgb(56, 56, 56)");
    if (slug === "checkbox") {
      await control.check();
      await expect(control).toBeChecked();
      await expect(control).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await expect(control).toHaveCSS("border-color", "rgb(255, 255, 255)");
    }
  }
});

test("menu option radii follow the outer radius minus padding and stroke at different root sizes", async ({ page }) => {
  await openSelectFixture(page);
  const trigger = page.getByRole("combobox", { name: "Locked choice", exact: true });
  for (const root of [16, 20, 24]) {
    await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px`; }, root);
    await trigger.evaluate(node => node.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await trigger.click();
    const menu = page.getByRole("listbox");
    await expect(menu).toBeVisible();
    const radii = await menu.evaluate(node => {
      const outer = getComputedStyle(node), inner = getComputedStyle(node.querySelector('[role="option"]')!);
      return { outer: parseFloat(outer.borderTopLeftRadius), inner: parseFloat(inner.borderTopLeftRadius), padding: parseFloat(outer.paddingTop), border: parseFloat(outer.borderTopWidth) };
    });
    expect(radii.outer).toBe(root);
    expect(radii.inner).toBeCloseTo(root - root / 4 - 1, 4);
    expect(radii.inner + radii.padding + radii.border).toBeCloseTo(radii.outer, 4);
    await page.keyboard.press("Escape");
  }
  await page.locator(".flood-root").evaluate(node => (node as HTMLElement).style.setProperty("--flood-sys-radius-field", "0.125rem"));
  await trigger.click();
  await expect(page.getByRole("listbox").getByRole("option").first()).toHaveCSS("border-top-left-radius", "0px");
});

test("strong boundaries are an explicit semantic override and preserve the independent accent focus", async ({ page }) => {
  await page.goto("/components/input");
  const input = page.locator(".preview-stage").getByRole("textbox");
  await expect(input).toHaveCSS("border-color", "rgb(56, 56, 56)");
  await page.locator(".preview-stage > .flood-root").evaluate(node => (node as HTMLElement).style.setProperty("--flood-sys-color-field-border", "var(--flood-sys-color-field-boundary)"));
  await expect(input).toHaveCSS("border-color", "rgb(138, 138, 138)");
  const ratio = await input.evaluate(node => {
    const css = getComputedStyle(node);
    const luminance = (color: string) => color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(byte => { const n = byte / 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; }).reduce((sum, n, i) => sum + n * [.2126,.7152,.0722][i], 0);
    const border = luminance(css.borderTopColor), fill = luminance(css.backgroundColor);
    return (Math.max(border, fill) + .05) / (Math.min(border, fill) + .05);
  });
  expect(ratio).toBeGreaterThanOrEqual(3);
  await page.keyboard.press("Tab");
  await input.focus();
  await expect(input).toHaveCSS("border-color", "rgb(255, 92, 168)");
  await expect(input).toHaveCSS("border-width", "2px");
});
