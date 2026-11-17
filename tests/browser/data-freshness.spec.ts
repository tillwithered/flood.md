import { expect, test } from "@playwright/test";
import { chooseSelectOption, chooseStudioSheetOption } from "./select-helpers";

test("DataFreshness distinguishes an update attempt from the age of the available data", async ({ page }, info) => {
  await page.goto("/components/data-freshness");
  const status = page.locator(".flood-status-indicator__label");
  const timestamp = page.locator("time[datetime='2026-11-16T08:10:00Z']");
  const state = page.getByRole("combobox", { name: /^State$|^DataFreshness prop state$/ });
  async function chooseState(value: string) {
    if (await state.isVisible()) await chooseSelectOption(state, value);
    else await chooseStudioSheetOption(page, "State", value);
  }

  await expect(status).toHaveText("Update delayed");
  await expect(timestamp).toHaveText("50 min. ago");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: info.outputPath("data-freshness.png") });
  await timestamp.focus();
  await expect(page.getByRole("tooltip").filter({ hasText: "UTC" })).toBeVisible();
  await timestamp.blur();

  await chooseState("refreshing");
  await expect(status).toHaveText("Updating");
  await expect(timestamp).toBeVisible();
  await chooseState("failed");
  await expect(status).toHaveText("Update failed");
  await expect(timestamp).toBeVisible();

  await page.getByRole("checkbox", { name: /^Narrow width$|^DataFreshness prop narrow$/ }).check();
  const freshness = timestamp.locator("xpath=../..");
  expect(await freshness.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: info.outputPath("data-freshness-narrow.png") });
  await chooseState("pending");
  await expect(status).toHaveText("Awaiting first update");
  await expect(timestamp).toHaveCount(0);
});
