import { expect, test } from "@playwright/test";

test("FindBar navigates with the query focused, exposes regex errors, and applies replacement", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/find-bar");
  const preview = page.locator(".preview-stage");
  const find = preview.locator(".flood-find-bar");
  const field = find.getByRole("searchbox", { name: "Find", exact: true });
  const counter = find.getByRole("status");
  await expect(counter).toHaveText("1 of 3");
  await field.press("Enter");
  await expect(field).toBeFocused();
  await expect(counter).toHaveText("2 of 3");
  await field.press("Shift+Enter");
  await expect(counter).toHaveText("1 of 3");
  await find.getByRole("button", { name: "Match case", exact: true }).click();
  await expect(counter).toHaveText("1 of 2");
  await find.getByRole("button", { name: "Use regular expression", exact: true }).click();
  await field.fill("(");
  await expect(field).toHaveAccessibleDescription("Enter a valid regular expression.");
  await expect(find.getByRole("button", { name: "Next match" })).toBeDisabled();
  await page.evaluate(() => document.fonts.ready);
  await find.screenshot({ path: info.outputPath("find-bar-invalid.png") });

  await field.fill("project");
  await page.getByRole("checkbox", { name: "FindBar prop showReplace", exact: true }).check();
  await find.getByRole("textbox", { name: "Replace with", exact: true }).fill("workspace");
  const searchField = await find.locator(".flood-search-input").boundingBox();
  const replaceField = await find.getByRole("textbox", { name: "Replace with", exact: true }).boundingBox();
  expect(searchField).not.toBeNull();
  expect(replaceField).not.toBeNull();
  expect(Math.abs(searchField!.x + searchField!.width - replaceField!.x - replaceField!.width)).toBeLessThan(2);
  await find.screenshot({ path: info.outputPath("find-bar-replace.png") });
  await find.getByRole("button", { name: "Replace all", exact: true }).click();
  await expect(counter).toHaveText("No matches");
  await expect(preview.getByText("The Project brief opens after workspace setup. Review the workspace before sharing.")).toBeVisible();
});
