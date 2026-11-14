import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { docPages, componentSlugs } from "../../apps/website/routes.mjs";
import { catalogCohort } from "../../scripts/ci-cohort.mjs";

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
  await expect(page.getByRole("button", { name: "Copy for agent", exact: true })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Page format" })).toHaveCount(0);
});

for (const doc of docPages) test(`published guide loads directly: ${doc.path}`, async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
    expect((await page.goto(doc.path))?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(doc.label);
    await expect(page.locator(".markdown-content:visible").first()).not.toBeEmpty();
  expect(errors).toEqual([]);
});

test("the chart guide opens a shared latency example and inspects values by keyboard", async ({ page }) => {
  await page.goto("/docs/charts");
  await page.getByRole("link", { name: "Try the three latency charts" }).click();
  await expect(page).toHaveURL(/#latency-example$/);
  const example = page.getByRole("region", { name: "Request latency example" });
  await example.getByRole("radio", { name: "Search", exact: true }).check();
  const plot = example.getByRole("slider", { name: "Daily median latency" });
  await plot.focus();
  await plot.press("Home");
  await expect(plot).toHaveAttribute("aria-valuetext", "Mon, Median: 203 ms");
  await expect(example.getByRole("group", { name: "Request latency distribution" })).toBeVisible();
  await expect(example.getByRole("img", { name: /Latency spread by service.*Search/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const slug of catalogCohort(componentSlugs)) test(`published component loads directly: ${slug}`, async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
    expect((await page.goto(`/components/${slug}`))?.status()).toBe(200);
    await expect(page.locator(".component-workbench")).toBeVisible();
    await expect(page.locator(".preview-stage > .flood-scroll-area__content > .flood-root > *").first()).toBeVisible();
    await page.getByRole("button", { name: "Reference Alt R", exact: true }).click();
    await expect(page.getByRole("heading", { name: "API reference", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("missing documentation stays 404 and the GitHub mark is served as SVG", async ({ request }) => {
  for (const path of ["/docs/missing", "/components/missing", "/agent/missing.md"]) expect((await request.get(path)).status()).toBe(404);
  expect((await request.get("/github-mark.svg")).headers()["content-type"]).toContain("image/svg+xml");
});

test("component code, clipboard, local interactions and mobile navigation work", async ({ page }, info) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/components/button");
  await expect(page).toHaveTitle("Button — flood.md");
  await expect(page.locator("#usage .site-code-block code")).toContainText('from "@flood-md/react"');
  await expect(page.getByRole("button", { name: "Copy for agent", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Reference Alt R", exact: true }).click();
  await page.getByRole("dialog", { name: "Component reference" }).getByRole("button", { name: "Copy for agent", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("# Button");
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(new URL("/agent/SKILL.md", page.url()).href);
  await page.locator("#usage").getByRole("button", { name: "Copy code" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("export function Example()");
  await page.keyboard.press("Escape");
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "Components", exact: true }).click();
    await page.getByRole("dialog", { name: "Components" }).getByRole("link", { name: "Checkbox", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Checkbox");
  }
  await page.goto("/components/icon-button");
  await page.getByRole("button", { name: "Add idea", exact: true }).click();
  await expect(page.locator(".workbench-feedback")).toContainText("Action completed locally.");
  await page.goto("/components/field");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Project name" })).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("checkbox", { name: "Field prop error", exact: true }).uncheck();
  await expect(page.getByRole("alert")).toHaveCount(0);
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

test("studio properties leave component names readable at tablet widths", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/components/date-range-picker");
  const heading = page.getByRole("heading", { name: "DateRangePicker", exact: true });
  await expect(heading).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => heading.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await expect(page.getByRole("region", { name: "Preview properties" })).toBeVisible();

  await page.goto("/components/app-shell");
  const properties = page.getByRole("region", { name: "Preview properties" });
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => properties.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  const showFooter = properties.getByRole("checkbox", { name: "AppShell prop showFooter" });
  await expect(showFooter).toBeInViewport({ ratio: 1 });
  await showFooter.check();
  await expect(page.getByRole("region", { name: "Preview canvas" }).getByText("All changes saved", { exact: true })).toBeVisible();
});

test("phone previews show the component before its wrapping properties", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/components/overflow-actions");
  const preview = page.getByRole("region", { name: "Preview canvas" });
  const properties = page.getByRole("region", { name: "Preview properties" });
  const reference = page.getByRole("button", { name: "Reference Alt R" });
  await expect(preview.getByRole("button", { name: "More actions" })).toBeVisible();
  const [canvas, referenceButton, controls] = await Promise.all([preview.boundingBox(), reference.boundingBox(), properties.boundingBox()]);
  expect(canvas!.y + canvas!.height).toBeLessThan(referenceButton!.y);
  expect(referenceButton!.y + referenceButton!.height).toBeLessThan(controls!.y);
  expect(await properties.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await reference.click();
  await expect(page.getByRole("dialog", { name: "Component reference" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(reference).toBeFocused();
  const catalog = page.getByRole("button", { name: "Components", exact: true });
  await catalog.click();
  const panel = page.getByRole("dialog", { name: "Components" });
  await expect.poll(() => panel.evaluate(node => node.contains(document.activeElement))).toBe(true);
  await expect(panel.getByRole("searchbox", { name: "Search components" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(catalog).toBeFocused();
});
