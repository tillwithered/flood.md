import { expect, test } from "@playwright/test";

test("BatchResult retries eligible failures only and keeps the other results", async ({ page }, info) => {
  await page.goto("/components/batch-result");
  const panel = page.getByRole("region", { name: "Purchase order import" });
  const retry = panel.getByRole("button", { name: "Retry (1)", exact: true });
  const eligible = panel.getByRole("listitem").filter({ hasText: "PO-189" });
  const blocked = panel.getByRole("listitem").filter({ hasText: "PO-190" });
  const skipped = panel.getByRole("listitem").filter({ hasText: "PO-191" });
  await expect(panel.getByText("3 succeeded", { exact: true })).toBeVisible();
  await expect(eligible.getByText("Can retry", { exact: true })).toBeVisible();
  await expect(blocked.getByText("Failed", { exact: true })).toBeVisible();
  await expect(skipped.getByText("Skipped", { exact: true })).toBeVisible();
  await expect(panel.getByText("PO-186 · Field equipment", { exact: true })).toHaveCount(0);

  await retry.click();
  await expect(page.getByText("Retry requested for PO-189.", { exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: "BatchResult prop pending" }).check();
  await expect(retry).toHaveAttribute("aria-disabled", "true");
  await expect(panel.getByText("3 succeeded", { exact: true })).toBeVisible();

  await page.getByRole("checkbox", { name: "BatchResult prop showSucceeded" }).check();
  await expect(panel.getByText("PO-186 · Field equipment", { exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: "BatchResult prop showSucceeded" }).uncheck();
  await page.getByRole("checkbox", { name: "BatchResult prop narrow" }).check();
  await expect.poll(() => panel.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({ path: info.outputPath("batch-result-narrow.png") });

  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  await scenario.click();
  await page.getByRole("option", { name: "Succeeded", exact: true }).click();
  await expect(retry).toHaveCount(0);
  await expect(panel.getByRole("list")).toHaveCount(0);
  await scenario.click();
  await page.getByRole("option", { name: "Empty", exact: true }).click();
  await expect(panel.getByText("No item results yet.", { exact: true })).toBeVisible();
});
