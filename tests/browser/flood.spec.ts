import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

const release = JSON.parse(await readFile("apps/website/src/release.json", "utf8")) as { version: string; published: boolean };

test("icon-only action scales its SVG and keeps it centered", async ({ page }) => {
  await page.goto("/");
  const button = page.getByRole("button", { name: "Add idea", exact: true });
  const icon = button.locator(".flood-icon");
  const svg = icon.locator("svg.lucide-plus");
  await expect(svg).toHaveCount(1);
  await expect(icon).toHaveAttribute("aria-hidden", "true");
  for (const rootSize of [16, 20, 24]) {
    await page.evaluate((size) => { document.documentElement.style.fontSize = `${size}px`; }, rootSize);
    const buttonBox = (await button.boundingBox())!;
    const svgBox = (await svg.boundingBox())!;
    expect(svgBox.width).toBeCloseTo(rootSize * 1.25, 1);
    expect(svgBox.height).toBeCloseTo(rootSize * 1.25, 1);
    expect(svgBox.x + svgBox.width / 2).toBeCloseTo(buttonBox.x + buttonBox.width / 2, 1);
    expect(svgBox.y + svgBox.height / 2).toBeCloseTo(buttonBox.y + buttonBox.height / 2, 1);
    expect(buttonBox.width).toBeCloseTo(rootSize * 2.5, 1);
    expect(buttonBox.height).toBeCloseTo(rootSize * 2.5, 1);
    await expect(button).toHaveAccessibleName("Add idea");
  }
});

test("selected landing renders real dark components and validates its workspace form", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize(testInfo.project.name === "desktop"
    ? { width: 1374, height: 1145 } : { width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Good interfaces",
  );
  await expect(page.locator(".site-root")).toHaveAttribute("data-flood-foundations", "neutral");
  await expect(page.locator(".site-root")).toHaveAttribute("data-flood-theme", "dark");
  expect(await page.evaluate(async () => {
    const faces = await document.fonts.load('400 16px Inter', 'Рабочее пространство Ёжик');
    return faces.length > 0 && faces.every((face) => face.status === "loaded");
  })).toBe(true);
  await page.screenshot({
    path: `.artifacts/landing-selected-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const workspace = page.getByRole("textbox", { name: "Workspace name" });
  const note = page.getByRole("textbox", { name: "Project note" });
  await expect(workspace).toHaveValue("My project");
  await expect(note).toHaveAttribute("maxlength", "500");
  await workspace.fill("");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("alert")).toHaveText("Give your workspace a name.");
  await expect(workspace).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(workspace).toBeFocused();
  await expect(workspace).toHaveAttribute("required", "");
  await workspace.fill("Flood test");
  await note.fill("A real component example");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("button", { name: /Saving/ })).toBeDisabled();
  await expect(page.getByRole("status").filter({ hasText: "Workspace saved locally. Nothing was sent." })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("idea showcase uses keyboard-operable choices and adds visible ideas", async ({ page }) => {
  await page.goto("/");
  const onboarding = page.getByRole("checkbox", { name: /^Onboarding flow/ });
  await expect(onboarding).not.toBeChecked();
  await onboarding.focus();
  await page.keyboard.press("Space");
  await expect(onboarding).toBeChecked();
  await page.getByRole("button", { name: "Add idea", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: /^New idea 4/ })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "New idea 4 added." })).toBeVisible();
  await page.getByRole("button", { name: "Add idea", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: /^New idea 5/ })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("installation follows the publication gate and exposes real documentation links", async ({ page }) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  const command = `npx @flood-md/cli@${release.version} init`;
  await expect(page.locator("code").filter({ hasText: command })).toBeVisible();
  const copy = page.getByRole("button", { name: "Copy installation command", exact: true });
  if (release.published) {
    await expect(copy).toBeEnabled();
    await copy.click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(command);
  } else {
    await expect(copy).toBeDisabled();
  }
  await expect(page.getByRole("link", { name: "Components", exact: true }).first()).toHaveAttribute("href", "https://github.com/tillwithered/flood.md/blob/main/docs/base-components.md");
  await expect(page.getByRole("link", { name: /For your agent/i })).toHaveAttribute("href", "/agent/DESIGN.md");
});

test("landing reflows at 320px with larger text and respects reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; });
  await page.addStyleTag({ content: ".site-root * { line-height:1.5!important; letter-spacing:.12em!important; word-spacing:.16em!important; } .site-root p { margin-bottom:2em!important; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const workspace = page.getByRole("textbox", { name: "Workspace name" });
  await workspace.fill("Длинное название рабочего пространства");
  await expect(workspace).toHaveValue("Длинное название рабочего пространства");
  const add = page.getByRole("button", { name: "Add idea", exact: true });
  await expect(add).toHaveCSS("transition-duration", "0s");
  const submit = page.getByRole("button", { name: "Save changes" });
  expect(await submit.evaluate((node) => node.scrollHeight <= node.clientHeight)).toBe(true);
});

test("native choices and disabled controls preserve semantics", async ({
  page,
}) => {
  await page.goto("/playground");
  await page.getByRole("tab", { name: "Choices" }).click();
  const checkbox = page.getByRole("checkbox", { name: "Leave room" });
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
  await page.getByRole("radio", { name: "Public", exact: true }).check();
  await expect(
    page.getByRole("radio", { name: "Private", exact: true }),
  ).not.toBeChecked();
  const updates = page.getByRole("switch", { name: "Email updates" });
  await updates.focus();
  await page.keyboard.press("Space");
  await expect(updates).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Disabled", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Working" })).toBeDisabled();
  await expect(
    page.getByRole("switch", { name: "Disabled switch" }),
  ).toBeDisabled();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("agent endpoints are actual text and missing files return 404", async ({
  request,
}) => {
  for (const path of [
    "/llms.txt",
    "/agent/DESIGN.md",
    "/agent/SKILL.md",
    "/schema/config.json",
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).not.toContain("text/html");
  }
  expect((await request.get("/agent/missing.md")).status()).toBe(404);
});
