import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { docPages, componentSlugs } from "../../apps/website/routes.mjs";

test("home stays focused and navigation exposes documentation and GitHub", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Good interfaces");
  await expect(page.getByRole("form")).toHaveCount(0);
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("link", { name: "Docs", exact: true })).toHaveAttribute("href", "/docs");
  const github = nav.getByRole("link", { name: "GitHub", exact: true });
  await expect(github).toHaveAttribute("href", "https://github.com/tillwithered/flood.md");
  await expect.poll(() => github.locator("img").evaluate((node: HTMLImageElement) => node.naturalWidth)).toBe(16);
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await page.screenshot({ path: `.artifacts/docs-home-${info.project.name}.png`, fullPage: true });
  await nav.getByRole("link", { name: "Docs", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Introduction");
  await expect(page.getByRole("link", { name: "Edit on GitHub" })).toHaveAttribute("href", /\/edit\/main\/docs\/README.md$/);
});

test("every published guide and component has a directly loadable page", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const doc of docPages) {
    expect((await page.goto(doc.path))?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(doc.label);
    await expect(page.locator(".markdown-content")).not.toBeEmpty();
  }
  for (const slug of componentSlugs) {
    expect((await page.goto(`/components/${slug}`))?.status()).toBe(200);
    await expect(page.locator(".component-preview")).toBeVisible();
    await expect(page.locator(".preview-stage")).not.toBeEmpty();
    await expect(page.getByRole("heading", { name: "API reference", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  for (const path of ["/docs/missing", "/components/missing", "/agent/missing.md"]) expect((await request.get(path)).status()).toBe(404);
  expect((await request.get("/github-mark.svg")).headers()["content-type"]).toContain("image/svg+xml");
  expect(errors).toEqual([]);
});

test("component code, clipboard, local interactions and mobile navigation work", async ({ page }, info) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/components/button");
  await expect(page).toHaveTitle("Button — flood.md");
  await page.locator(".preview-code summary").click();
  await expect(page.locator(".preview-code code")).toContainText('from "@flood-md/react"');
  await page.getByRole("button", { name: "Copy page", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("# Button");
  await page.locator(".preview-code").getByRole("button", { name: "Copy code" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("export function Example()");
  if (info.project.name === "mobile") {
    await page.getByText("Browse documentation", { exact: true }).click();
    await page.locator(".mobile-navigation").getByRole("link", { name: "Checkbox", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Checkbox");
  }
  await page.goto("/components/icon-button");
  await page.getByRole("button", { name: "Add idea", exact: true }).click();
  await expect(page.locator(".preview-stage").getByRole("status")).toContainText("1 idea added locally.");
  await page.goto("/components/field");
  await page.getByRole("button", { name: "Check name" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Project name" })).toHaveAttribute("aria-invalid", "true");
  await page.screenshot({ path: `.artifacts/docs-field-${info.project.name}.png`, fullPage: true });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto("/docs/theming");
  await page.getByRole("link", { name: "migration instructions", exact: true }).click();
  await expect(page.locator("#updates-from-011")).toBeInViewport();
});

test("docs reflow with enlarged text and retain active-page and heading semantics", async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 900 });
  for (const path of ["/docs/installation", "/components/button", "/components"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; });
    await page.addStyleTag({ content: ".site-root * { line-height:1.5!important; letter-spacing:.12em!important; word-spacing:.16em!important; }" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize(info.project.name === "desktop" ? { width: 1440, height: 1000 } : { width: 390, height: 844 });
  await page.goto("/components/button");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Button");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `.artifacts/docs-button-${info.project.name}.png`, fullPage: true });
  await page.screenshot({ path: `.artifacts/docs-button-viewport-${info.project.name}.png` });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto("/docs/installation");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Installation");
  await expect(page.locator(".markdown-content a[href='/components']").first()).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
