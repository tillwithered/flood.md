import { expect, test } from "@playwright/test";

test("site navigation exposes real destinations and restores the disclosure trigger on Escape", async ({ page }, info) => {
  await page.goto("/components/navigation-menu");
  const navigation = page.getByRole("navigation", { name: "Site navigation", exact: true });
  const library = navigation.getByRole("button", { name: "Library" });
  const resources = navigation.getByRole("button", { name: "Resources" });
  const components = navigation.getByRole("link", { name: /Components Browse/ });
  await expect(navigation.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  await expect(components).toHaveCount(0);
  await library.press("Enter");
  await expect(library).toHaveAttribute("aria-expanded", "true");
  await expect(components).toHaveAttribute("href", "/components");
  await page.keyboard.press("Tab");
  await expect(components).toBeFocused();
  await page.screenshot({ path: info.outputPath("navigation-menu-open.png") });
  await page.keyboard.press("Escape");
  await expect(library).toBeFocused();
  await expect(components).toHaveCount(0);

  await library.click();
  await resources.click();
  await expect(library).toHaveAttribute("aria-expanded", "false");
  await expect(navigation.getByRole("link", { name: "Documentation" })).toHaveAttribute("aria-current", "page");
  await page.mouse.click(1, 1);
  await expect(resources).toHaveAttribute("aria-expanded", "false");
});

test("CodeBlock bounds its scroll area, wraps on demand and copies original source", async ({ page, context }, info) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/components/code-block");
  const block = page.getByRole("figure", { name: "Code example" });
  const viewport = block.getByRole("group", { name: "results.ts" });
  const original = await block.locator("pre code").textContent();
  expect(original).toContain("\n  { id: 1,");

  const narrow = page.getByRole("checkbox", { name: "CodeBlock prop narrow", exact: true });
  await narrow.check();
  await expect.poll(() => viewport.evaluate(node => node.scrollWidth - node.clientWidth)).toBeGreaterThan(0);
  await viewport.focus();
  await expect(viewport).toBeFocused();
  await page.screenshot({ path: info.outputPath("code-block-narrow.png") });
  await page.getByRole("checkbox", { name: "CodeBlock prop wrap", exact: true }).check();
  await expect.poll(() => viewport.evaluate(node => node.scrollWidth - node.clientWidth)).toBe(0);
  await block.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect.poll(async () => (await page.evaluate(() => navigator.clipboard.readText())).replaceAll("\r\n", "\n")).toBe(original);
  await page.getByRole("checkbox", { name: "CodeBlock prop showCopy", exact: true }).uncheck();
  await expect(block.getByRole("button")).toHaveCount(0);
});
