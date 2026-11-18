import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("search finds a recipe from a task and opens it from the keyboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.keyboard.press("Control+k");
  const search = page.getByRole("dialog", { name: "Search Flood" });
  const input = search.getByRole("combobox");
  await expect(input).toBeFocused();
  await input.fill("DataTable");
  await expect(search.getByRole("option").first()).toContainText("DataTable");
  await input.fill("DataTabel");
  await expect(search.getByRole("option").first()).toContainText("DataTable");
  await input.fill("nothing matches 8093");
  await expect(search.getByRole("option")).toContainText("No results.");
  await input.fill("bulk edit");
  await expect(search.getByRole("option").first()).toContainText("Table bulk actions");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Search Flood" })).toBeFocused();
  await page.getByRole("button", { name: "Search Flood" }).click();
  await input.fill("массовое редактирование");
  await expect(search.getByRole("option").first()).toContainText("Table bulk actions");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/docs\/recipes\/table-bulk-actions$/);

  await page.getByRole("button", { name: "Copy for agent" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("/components/data-table.md");
  const live = page.getByRole("region", { name: "Live example" });
  await live.getByRole("checkbox", { name: /Design system/ }).check();
  await live.getByRole("button", { name: "Archive projects" }).click();
  const confirmation = page.getByRole("alertdialog", { name: "Archive selected projects?" });
  await confirmation.getByRole("button", { name: "Keep projects" }).click();
  await expect(live.getByText("Design system", { exact: true })).toBeVisible();
  await live.getByRole("button", { name: "Archive projects" }).click();
  await confirmation.getByRole("button", { name: "Archive selected" }).click();
  await expect(live.getByText("Design system", { exact: true })).toHaveCount(0);
});

test("recipes and agent setup are discoverable from stable navigation routes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Explore recipes", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Recipes", exact: true })).toBeVisible();
  await page.getByRole("link", { name: /^E-commerce / }).click();
  await expect(page).toHaveURL(/\/recipes\/e-commerce$/);
  await expect(page.getByRole("heading", { name: "E-commerce", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Table bulk actions / })).toBeVisible();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "For agents" }).click();
  await expect(page.getByRole("heading", { name: "Flood for coding agents" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Connect Flood MCP/ })).toHaveAttribute("href", "/docs/mcp");
});
