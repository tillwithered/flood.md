import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("RecordRelationSuggestion keeps the record and decision paths independent", async ({ page }, info) => {
  await page.goto("/components/record-relation-suggestion");
  const stage = page.locator(".preview-stage");
  const item = stage.getByRole("list", { name: "Suggested relationships" }).getByRole("listitem");
  const link = item.getByRole("link", { name: "Delayed warehouse callbacks" });
  const accept = item.getByRole("button", { name: "Accept" });
  const dismiss = item.getByRole("button", { name: "Dismiss" });
  const scenario = page.getByRole("region", { name: "Preview properties" })
    .getByRole("combobox", { name: "Scenario", exact: true });

  if (info.project.name === "mobile") {
    await chooseSelectOption(page.getByRole("combobox", { name: "RecordRelationSuggestion prop surface" }), "overlay");
    await page.getByRole("checkbox", { name: "RecordRelationSuggestion prop narrow" }).check();
  }

  await expect(link).toHaveAttribute("href", "/components/record-relations");
  await expect(item.getByText("Both reports mention carrier callbacks timing out after a retry.")).toBeVisible();
  await expect.poll(() => item.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("record-relation-suggestion.png"), animations: "disabled" });

  await link.focus();
  await page.keyboard.press("Tab");
  await expect(accept).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Relationship accepted.", { exact: true })).toBeVisible();
  await dismiss.click();
  await expect(page.getByText("Suggestion dismissed.", { exact: true })).toBeVisible();

  await chooseSelectOption(scenario, "Pending");
  await expect(accept).toHaveAttribute("aria-busy", "true");
  await expect(accept).toBeDisabled();
  await expect(dismiss).toBeDisabled();
  await accept.focus();
  await expect(accept).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Relationship accepted.", { exact: true })).toHaveCount(0);
  await expect(link).toBeEnabled();

  await chooseSelectOption(scenario, "Refused");
  await expect(item.getByRole("alert")).toContainText("This issue moved to another team.");
  await expect(accept).toBeEnabled();
  await stage.screenshot({ path: info.outputPath("record-relation-suggestion-refused.png"), animations: "disabled" });
  await link.click();
  await expect(page).toHaveURL(/\/components\/record-relations$/);
});
