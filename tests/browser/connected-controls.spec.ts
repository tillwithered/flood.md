import { test, expect } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("connected actions retain Tab order, visible end corners and RTL/vertical seams", async ({ page }) => {
  await page.goto("/components/button-group");
  const group = page.locator(".preview-stage").getByRole("group", { name: "Editing actions" });
  const buttons = group.getByRole("button", { includeHidden: true });
  await buttons.nth(0).focus(); await page.keyboard.press("ArrowRight");
  await expect(buttons.nth(0)).toBeFocused();
  await page.keyboard.press("Tab"); await expect(buttons.nth(1)).toBeFocused();
  await buttons.nth(1).click();
  await expect(page.locator(".preview-stage").getByRole("status")).toHaveText("Redo selected.");
  const seam = async () => { const boxes = await buttons.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON())); return boxes[1].x - boxes[0].right; };
  expect(await seam()).toBeCloseTo(0, 1);
  await group.evaluate(node => { node.setAttribute("dir", "rtl"); });
  expect((await buttons.nth(0).boundingBox())!.x).toBeGreaterThan((await buttons.nth(2).boundingBox())!.x);
  await expect(buttons.nth(0)).toHaveCSS("border-top-left-radius", "0px");
  await expect(buttons.nth(0)).toHaveCSS("border-top-right-radius", "16px");
  await group.evaluate(node => { node.removeAttribute("dir"); (node.firstElementChild as HTMLElement).hidden = true; });
  await expect(buttons.nth(0)).toBeHidden();
  await expect(buttons.nth(1)).toHaveCSS("border-top-left-radius", "16px");
  await group.evaluate(node => { (node.firstElementChild as HTMLElement).hidden = false; });
  await chooseSelectOption(page.getByRole("combobox", { name: "ButtonGroup prop orientation", exact: true }), "vertical");
  const first = (await buttons.nth(0).boundingBox())!, second = (await buttons.nth(1).boundingBox())!;
  expect(second.y - first.y - first.height).toBeCloseTo(0, 1);
  expect(first.width).toBeCloseTo(second.width, 1);
});

test("InputGroup has one perimeter, stable focus geometry and real form/readonly behavior", async ({ page }, info) => {
  await page.goto("/components/input-group");
  const stage = page.locator(".preview-stage"), shell = stage.locator(".flood-input-group"), input = stage.getByRole("textbox", { name: "Website" });
  await expect(input).toHaveValue("example.com");
  await expect(input).toHaveCSS("border-top-width", "0px");
  await expect(shell).toHaveCSS("border-top-width", "1px");
  const before = (await shell.boundingBox())!;
  await input.focus();
  await expect(shell).toHaveCSS("border-top-width", "2px");
  expect((await shell.boundingBox())!.height).toBeCloseTo(before.height, 1);
  expect((await shell.boundingBox())!.width).toBeCloseTo(before.width, 1);
  await input.fill("flood.md");
  expect(await shell.evaluate(node => {
    const form = document.createElement("form"); form.id = "website-form"; node.before(form);
    const input = node.querySelector("input")!; input.setAttribute("form", form.id);
    const value = new FormData(form).get("website"); input.removeAttribute("form"); form.remove(); return value;
  })).toBe("flood.md");
  await stage.getByRole("button", { name: "Open", exact: true }).click();
  await expect(stage.getByRole("status")).toHaveText("Opened locally.");
  await expect(stage.getByRole("button", { name: "Open", exact: true })).toBeFocused();
  await page.getByRole("checkbox", { name: "InputGroup prop readOnly", exact: true }).check();
  await expect(input).toHaveAttribute("readonly", "");
  await input.focus(); await input.pressSequentially("changed");
  await expect(input).toHaveValue("flood.md");
  await page.getByRole("checkbox", { name: "InputGroup prop disabled", exact: true }).check();
  await expect(input).toBeDisabled();
  await expect(stage.getByRole("button", { name: "Open", exact: true })).toBeDisabled();
  await page.screenshot({ path: `.artifacts/input-group-${info.project.name}.png` });
});

test("connected constructs reflow with long content and enlarged text", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  for (const slug of ["button-group", "input-group"]) {
    await page.goto(`/components/${slug}`);
    await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (slug === "button-group") {
      await page.locator(".preview-stage .flood-button").first().evaluate(node => { node.textContent = "A considerably longer action name"; });
      const group = page.locator(".preview-stage .flood-button-group");
      expect(await group.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    }
  }
});

test("InputGroup keeps logical slots, forced-color focus and coarse-pointer targets", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: "http://127.0.0.1:4173", hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage(); await page.goto("/components/input-group");
    const shell = page.locator(".preview-stage .flood-input-group"), input = shell.getByRole("textbox");
    const action = shell.getByRole("button", { name: "Open" });
    expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await shell.evaluate(node => { node.setAttribute("dir", "rtl"); });
    const start = (await shell.locator(".flood-input-group__addon").first().boundingBox())!;
    const end = (await shell.locator(".flood-input-group__addon").last().boundingBox())!;
    expect(start.x).toBeGreaterThan(end.x + end.width);
    await page.emulateMedia({ forcedColors: "active" });
    await input.focus();
    await expect(shell).toHaveCSS("border-top-width", "2px");
    await expect(input).toHaveCSS("border-top-width", "0px");
    await expect(input).toBeFocused();
  } finally { await context.close(); }
});


test("InputGroup nested actions keep equal edge insets across sizes, focus and RTL", async ({ page }) => {
  await page.goto("/components/input-group");
  const shell = page.locator(".preview-stage .flood-input-group");
  const action = shell.getByRole("button", { name: "Open", exact: true });
  const checkInsets = async (rtl = false) => {
    const outer = (await shell.boundingBox())!, inner = (await action.boundingBox())!;
    const top = inner.y - outer.y, bottom = outer.y + outer.height - inner.y - inner.height;
    const edge = rtl ? inner.x - outer.x : outer.x + outer.width - inner.x - inner.width;
    expect(top).toBeGreaterThanOrEqual(4);
    expect(top).toBeCloseTo(bottom, 1); expect(edge).toBeCloseTo(top, 1);
    const radius = await action.evaluate(node => parseFloat(getComputedStyle(node).borderTopRightRadius));
    const outerRadius = await shell.evaluate(node => parseFloat(getComputedStyle(node).borderTopRightRadius));
    expect(radius + top).toBeCloseTo(outerRadius, 1);
  };
  for (const size of ["sm", "md", "lg", "xl"]) {
    await chooseSelectOption(page.getByRole("combobox", { name: "InputGroup prop controlSize", exact: true }), size);
    await checkInsets(); await shell.getByRole("textbox").focus(); await checkInsets();
    await shell.evaluate(node => { node.setAttribute("dir", "rtl"); }); await checkInsets(true);
    await shell.evaluate(node => { node.removeAttribute("dir"); });
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; }); await checkInsets();
});

test("ButtonGroup supports icon-only and mixed actions with full separators", async ({ page }, info) => {
  await page.goto("/components/button-group");
  const stage = page.locator(".preview-stage"), group = stage.getByRole("group", { name: "Editing actions" });
  for (const content of ["icons", "mixed"]) {
    await chooseSelectOption(page.getByRole("combobox", { name: "ButtonGroup prop content", exact: true }), content);
    await expect(group.getByRole("button")).toHaveCount(3);
    await group.getByRole("button", { name: "History", exact: true }).click();
    await expect(stage.getByRole("status")).toHaveText("History selected.");
    const icon = group.locator(".flood-icon-button").last(), bounds = (await icon.boundingBox())!;
    expect(bounds.width).toBeGreaterThanOrEqual(bounds.height);
    await expect(icon).toHaveCSS("border-left-width", "1px");
    await expect(icon).not.toHaveCSS("border-left-color", "rgba(0, 0, 0, 0)");
    await expect(page.locator("#usage .site-code-block code")).toContainText("IconButton");
    await expect(page.locator("#usage .site-code-block code")).toContainText("lucide-react");
  }
  await page.locator(".component-workbench").screenshot({ path: `.artifacts/mixed-group-${info.project.name}.png` });
  await chooseSelectOption(page.getByRole("combobox", { name: "ButtonGroup prop content", exact: true }), "icons");
  await chooseSelectOption(page.getByRole("combobox", { name: "ButtonGroup prop orientation", exact: true }), "vertical");
  for (const button of await group.getByRole("button").all()) {
    const box = (await button.boundingBox())!; expect(box.width).toBeCloseTo(box.height, 1);
  }
});

test("InputGroup independently composes subdued labels and named actions at both edges", async ({ page }, info) => {
  await page.goto("/components/input-group");
  const shell = page.locator(".preview-stage .flood-input-group"), input = shell.getByRole("textbox");
  const start = page.getByRole("combobox", { name: "InputGroup prop start", exact: true });
  const end = page.getByRole("combobox", { name: "InputGroup prop end", exact: true });
  expect(await shell.locator(".flood-input-group__addon--start").evaluate(node => getComputedStyle(node).color)).not.toBe(await input.evaluate(node => getComputedStyle(node).color));
  for (const prefix of ["+7", "@", "$"]) {
    await chooseSelectOption(start, prefix); await expect(shell.locator(".flood-input-group__addon--start")).toHaveText(prefix);
    await expect(input).toHaveValue(prefix === "+7" ? "999 123 45 67" : prefix === "@" ? "flood" : "100");
  }
  await chooseSelectOption(start, "action"); await chooseSelectOption(end, "icon-action");
  for (const name of ["Add", "Open"]) {
    const action = shell.getByRole("button", { name, exact: true }); await action.click(); await expect(action).toBeFocused();
    const outer = (await shell.boundingBox())!, inner = (await action.boundingBox())!;
    const edge = name === "Add" ? inner.x - outer.x : outer.x + outer.width - inner.x - inner.width;
    expect(edge).toBeCloseTo(inner.y - outer.y, 1);
  }
  await expect(page.locator("#usage .site-code-block code")).toContainText("IconButton");
  await page.locator(".component-workbench").screenshot({ path: `.artifacts/two-actions-${info.project.name}.png` });
  for (const suffix of ["kg", "USD", "%", "@company.com"]) {
    await chooseSelectOption(end, suffix); await expect(shell.locator(".flood-input-group__addon--end")).toHaveText(suffix);
  }
  await chooseSelectOption(start, "none"); await chooseSelectOption(end, "none");
  await expect(shell.locator(".flood-input-group__addon")).toHaveCount(0); await expect(input).toBeEditable();
});
