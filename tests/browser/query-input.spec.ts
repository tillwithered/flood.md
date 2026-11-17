import { expect, test } from "@playwright/test";

test("QueryInput completes at the caret and removes a condition without changing draft text", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/query-input");
  const query = page.locator(".preview-stage .flood-query-input");
  const draft = query.getByRole("textbox", { name: "Search requests", exact: true });
  await page.getByRole("checkbox", { name: "QueryInput prop showTokenError", exact: true }).check();
  await expect(draft).toHaveAccessibleDescription("Queue: Imports: Choose a queue that exists.");
  await draft.fill("REQ-1042 stat pending");
  await draft.press("Home");
  for (let offset = 0; offset < 13; offset++) await draft.press("ArrowRight");
  const suggestions = page.getByRole("listbox", { name: "Request status" });
  await expect(suggestions.getByRole("option", { name: "Open requests status:open" })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: info.outputPath("query-input-suggestions.png") });
  await draft.press("Enter");
  await expect(draft).toHaveValue("REQ-1042 status:open pending");
  await expect(draft).toBeFocused();
  await expect(suggestions).toBeHidden();
  await query.getByRole("button", { name: "Remove Queue: Imports", exact: true }).click();
  await expect(draft).toHaveValue("REQ-1042 status:open pending");
  await expect(draft).toBeFocused();
  await expect(draft).toHaveAccessibleDescription("");
});
