import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("KeyRotationSummary distinguishes immediate and deferred retirement", async ({ page }, info) => {
  await page.goto("/components/key-rotation-summary");
  const preview = page.locator(".preview-stage");
  const summary = preview.locator("dl");
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  const cutoff = summary.locator("dd").last();

  await expect(summary.getByText("Current key", { exact: true })).toBeVisible();
  await expect(summary.getByText("Replacement key", { exact: true })).toBeVisible();
  await expect(summary.locator("dd").nth(0)).toContainText("7f2a");
  await expect(summary.locator("dd").nth(1)).toContainText("a4c8");
  await expect(cutoff.locator("time")).toHaveAttribute("datetime", "2026-11-19T16:45:00Z");
  await expect(cutoff).toContainText(/4:45:00 PM GMT/);
  await page.evaluate(() => document.fonts.ready);
  await preview.locator(".flood-section").screenshot({ path: info.outputPath("key-rotation-scheduled.png") });

  await chooseSelectOption(scenario, "Immediate");
  await expect(cutoff).toHaveText("On rotation");
  await expect(cutoff.locator("time")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "KeyRotationSummary prop narrow" }).check();
  await expect(cutoff.getByText("On rotation")).toBeVisible();
  expect(await summary.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await preview.locator(".flood-section").screenshot({ path: info.outputPath("key-rotation-immediate.png") });

  await chooseSelectOption(scenario, "Manual");
  await expect(cutoff).toHaveText("When manually revoked");
  await expect(cutoff.locator(".flood-status-indicator")).toHaveCount(0);
});
