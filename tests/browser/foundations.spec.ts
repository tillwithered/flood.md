import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const url = "http://127.0.0.1:3001/foundations";

test("dark foundations hydrate with the bundled Inter font and accessible primitives", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  const root = page.locator("#foundation-root");
  await expect(root).toHaveAttribute("data-flood-theme", "dark");
  await expect(root).toHaveCSS("background-color", "rgb(24, 24, 24)");
  await expect(page.getByRole("heading", { name: "Dark foundations", level: 1 })).toBeVisible();
  const fonts = await page.evaluate(async () => {
    const faces = await document.fonts.load('400 16px "Inter"', "Flood Ёжик");
    return faces.map((face) => ({ family: face.family, status: face.status }));
  });
  expect(fonts.length).toBeGreaterThan(0);
  expect(fonts.every((face) => face.status === "loaded")).toBe(true);
  await expect(page.getByRole("button", { name: "Add item", exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `.artifacts/foundations-${testInfo.project.name}.png`, fullPage: true });
});

test("foundation form retains native values, keyboard choices and reset", async ({ page }) => {
  await page.goto(url);
  const name = page.getByRole("textbox", { name: "Project name" });
  const checkbox = page.getByRole("checkbox", { name: "Email updates" });
  const toggle = page.getByRole("switch", { name: "Public preview" });
  await expect(name).toHaveValue("Flood");
  await expect(checkbox).toBeChecked();
  await expect(toggle).not.toBeChecked();
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toBeChecked();
  await page.getByRole("radio", { name: "Personal", exact: true }).check();
  await expect(page.getByRole("radio", { name: "Team", exact: true })).not.toBeChecked();
  await name.fill("Flood team");
  await page.getByRole("textbox", { name: "Project description" }).fill("A small original system");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved Flood team" })).toBeVisible();
  const data = JSON.parse(await page.getByTestId("form-data").innerText());
  expect(Object.values(data)).toContain("Flood team");
  expect(Object.values(data)).toContain("A small original system");
  expect(data).not.toHaveProperty("updates");
  await page.getByRole("button", { name: "Reset form", exact: true }).click();
  await expect(name).toHaveValue("Flood");
  await expect(checkbox).toBeChecked();
  await expect(toggle).not.toBeChecked();
  await expect(page.getByRole("radio", { name: "Team", exact: true })).toBeChecked();
});

test("field focus follows its contour without moving layout and survives invalid state", async ({ page }) => {
  await page.goto(url);
  const input = page.getByRole("textbox", { name: "Project name" });
  const before = await input.boundingBox();
  await input.focus();
  await expect(input).toHaveCSS("border-top-width", "2px");
  await expect(input).toHaveCSS("outline-offset", "0px");
  expect(await input.boundingBox()).toEqual(before);
  await input.fill("");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(page.locator("#foundation-root").getByRole("alert")).toHaveText("Required project name");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS("border-top-width", "2px");
  const associated = await input.evaluate((node: HTMLInputElement) => ({
    required: node.required,
    text: (node.getAttribute("aria-describedby") ?? "").split(/\s+/).map((id) => document.getElementById(id)?.textContent).join(" "),
  }));
  expect(associated.required).toBe(true);
  expect(associated.text).toContain("Visible to your team");
  expect(associated.text).toContain("Required project name");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("control scale uses the agreed rem heights and disabled actions stay inert", async ({ page }) => {
  await page.goto(url);
  for (const [size, height] of Object.entries({ "2xs": 24, xs: 28, sm: 32, md: 40, lg: 44, xl: 48, "2xl": 56 })) {
    const box = await page.getByTestId(`size-${size}`).boundingBox();
    expect(box?.height).toBeCloseTo(height, 0);
  }
  for (const label of ["Disabled", "Working"]) {
    await expect(page.getByRole("button", { name: label, exact: true })).toBeDisabled();
  }
  await expect(page.getByRole("button", { name: "Working", exact: true })).toHaveAttribute("aria-busy", "true");
  await page.getByRole("button", { name: "Add item", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("form-data")).toBeEmpty();
});

test("foundation layout reflows at 320px and increased root font size", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(url);
  await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; });
  await expect(page.getByTestId("size-md")).toHaveCSS("min-height", "60px");
  await expect(page.getByRole("heading", { name: "Dark foundations" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const input = page.getByRole("textbox", { name: "Project name" });
  await input.fill("Длинное название пространства с кириллицей");
  await expect(input).toHaveValue("Длинное название пространства с кириллицей");
  await expect(page.getByRole("button", { name: "Save project", exact: true })).toBeVisible();
  await page.addStyleTag({ content: "#foundation-root * { line-height:1.5!important; letter-spacing:.12em!important; word-spacing:.16em!important; } #foundation-root p { margin-bottom:2em!important; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const save = page.getByRole("button", { name: "Save project", exact: true });
  expect(await save.evaluate((node) => node.scrollHeight <= node.clientHeight)).toBe(true);
});

test("secondary containers remain visible on surfaces and selected state persists", async ({ page }) => {
  await page.goto(url);
  const secondary = page.getByRole("button", { name: "Reset form", exact: true });
  await expect(secondary).toHaveCSS("background-color", "rgb(48, 48, 48)");
  const pin = page.getByRole("button", { name: "Pin project", exact: true });
  await pin.click();
  await expect(pin).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(0, 0);
  await expect(pin).toHaveCSS("background-color", "rgb(56, 56, 56)");
  await pin.click();
  await expect(pin).toHaveAttribute("aria-pressed", "false");
});

test("forced colors preserve native controls and reduced motion preserves loading meaning", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto(url);
  const toggle = page.getByRole("switch", { name: "Public preview" });
  await expect(toggle).toHaveCSS("appearance", "auto");
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toBeChecked();
  await expect(toggle).toHaveCSS("outline-width", "2px");
  const loading = page.getByRole("button", { name: "Working", exact: true });
  await expect(loading).toHaveAttribute("aria-busy", "true");
  await expect(loading.locator(".flood-spinner")).toHaveCSS("animation-name", "none");
  await expect(loading).toHaveCSS("transition-duration", "0s");
  await expect(page.getByRole("checkbox", { name: "Email updates" })).toBeVisible();
});

test("coarse pointer targets expand and switch geometry follows RTL", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(url);
    const tiny = await page.getByTestId("size-2xs").boundingBox();
    expect(tiny!.height).toBeGreaterThanOrEqual(44);
    expect(await page.getByRole("textbox", { name: "Project name" }).evaluate((node) => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
    await page.locator("#foundation-root").evaluate((node) => node.setAttribute("dir", "rtl"));
    const toggle = page.getByRole("switch", { name: "Public preview" });
    await toggle.check();
    await expect.poll(() => toggle.evaluate((node) => getComputedStyle(node, "::before").transform)).toBe("matrix(1, 0, 0, 1, -14, 0)");
    const box = await toggle.boundingBox();
    expect(box!.width).toBe(36);
    expect(box!.height).toBe(22);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await context.close(); }
});
