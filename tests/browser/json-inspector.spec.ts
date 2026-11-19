import { expect, test } from "@playwright/test";

test("search opens the matching JSON branch and copies the selected scalar", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (text: string) => document.documentElement.setAttribute("data-test-copy", text) },
    });
  });
  await page.goto("/components/json-inspector");
  const inspector = page.locator(".preview-stage .flood-json-inspector");
  const search = inspector.getByRole("searchbox", { name: "Search JSON" });
  const response = inspector.getByRole("treeitem", { name: /response object/ });
  await expect(response).toHaveAttribute("aria-expanded", "false");
  await search.fill("Flood");
  const item = inspector.getByRole("treeitem", { name: /0 string.*Flood/ });
  await expect(item).toBeVisible();
  await item.press("Enter");
  await expect(item).toHaveAttribute("aria-selected", "true");
  await inspector.getByRole("button", { name: "Selected value" }).click();
  await expect(inspector.getByLabel("JSON Pointer")).toHaveText('"/response/items/0"');
  await inspector.getByRole("button", { name: "Copy selected JSON" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-test-copy", '"Flood"');
  await page.evaluate(() => document.fonts.ready);
  await inspector.screenshot({ path: info.outputPath("json-inspector-selected.png") });

  await search.fill("no-matching-property");
  await expect(inspector.getByText("No matching keys or values.")).toBeVisible();
  await expect(inspector.getByRole("button", { name: "Copy selected JSON" })).toHaveCount(0);
  await search.fill("response");
  await expect(response).toHaveAttribute("aria-expanded", "false");
  await response.press("ArrowRight");
  await expect(response).toHaveAttribute("aria-expanded", "true");
  await expect(inspector.getByRole("treeitem", { name: /status number.*200/ })).toBeVisible();
  await search.fill("");
  await expect(response).toHaveAttribute("aria-expanded", "false");
});
