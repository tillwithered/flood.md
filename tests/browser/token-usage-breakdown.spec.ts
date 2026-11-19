import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("TokenUsageBreakdown keeps subsets out of the total and distinguishes zero from unknown", async ({ page }, info) => {
  await page.goto("/components/token-usage-breakdown");
  const stage = page.locator(".preview-stage");
  const surface = stage.locator(".flood-surface");
  const metric = stage.locator(".flood-metric").filter({ hasText: "Total tokens" }).locator("data");
  const counts = (label: string) => stage.getByText(label, { exact: true }).locator("..").locator("dd data");
  const scenario = page.getByRole("combobox", { name:"Scenario", exact:true });
  await expect(metric).toHaveText("5,900");
  await expect(counts("Input")).toHaveText(["5,000", "1,500"]);
  await expect(counts("Output")).toHaveText(["900", "200"]);
  await page.evaluate(() => document.fonts.ready);
  await surface.screenshot({ path: info.outputPath("token-usage-breakdown.png") });

  await page.getByRole("checkbox", { name:"TokenUsageBreakdown prop narrow" }).check();
  await chooseSelectOption(page.getByRole("combobox", { name:"TokenUsageBreakdown prop surface" }), "overlay");
  await expect.poll(() => surface.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await surface.screenshot({ path: info.outputPath("token-usage-breakdown-narrow.png") });

  await chooseSelectOption(scenario, "Totals only");
  await expect(metric).toHaveText("5,900");
  await expect(counts("Input")).toHaveText(["5,000"]);
  await expect(counts("Output")).toHaveText(["900"]);
  await expect(stage.getByText("Cached", { exact:true })).toHaveCount(0);
  await expect(stage.getByText("Reasoning", { exact:true })).toHaveCount(0);
  await chooseSelectOption(scenario, "Zero");
  await expect(metric).toHaveText("0");
  await expect(counts("Input")).toHaveText(["0", "0"]);
  await expect(counts("Output")).toHaveText(["0", "0"]);
  await chooseSelectOption(scenario, "Unavailable");
  await expect(stage.getByText("Token usage unavailable.")).toBeVisible();
  await expect(stage.locator("data")).toHaveCount(0);
});
