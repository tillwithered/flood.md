import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("RestrictionSummary keeps policy scope with the list it governs", async ({ page }, info) => {
  await page.goto("/components/restriction-summary");
  const panel = page.locator(".preview-stage .flood-surface");
  const rules = panel.getByRole("list", { name: "Spending restrictions" });
  const groups = rules.locator(":scope > li");
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });

  await expect(groups).toHaveCount(2);
  await expect(groups.nth(0)).toContainText("This card");
  await expect(groups.nth(0)).toContainText("Only these allowed");
  await expect(groups.nth(0)).toContainText("Linear");
  await expect(groups.nth(1)).toContainText("Company policy");
  await expect(groups.nth(1)).toContainText("Blocked");
  await expect(groups.nth(1)).toContainText("BrightDesk");
  await expect(rules.getByRole("button")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({ path: info.outputPath("restriction-summary-layered.png") });

  await page.getByRole("checkbox", { name: "RestrictionSummary prop narrow" }).check();
  await chooseSelectOption(page.getByRole("combobox", { name: "RestrictionSummary prop surface" }), "overlay");
  await chooseSelectOption(scenario, "category allowlist");
  await expect(groups).toHaveCount(1);
  await expect(groups.first().getByText("Software and subscriptions", { exact: true })).toBeVisible();
  expect(await rules.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({ path: info.outputPath("restriction-summary-narrow.png") });

  await chooseSelectOption(scenario, "unrestricted");
  await expect(groups.first()).toContainText("No restrictions");
  await expect(groups.first().getByRole("list")).toHaveCount(0);
});
