import { expect, test } from "@playwright/test";
import { chooseSelectOption, chooseStudioSheetOption } from "./select-helpers";

test("RetrySchedule distinguishes future recovery from the unchanged delivery history", async ({ page }, info) => {
  await page.goto("/components/retry-schedule");
  const preview = page.locator(".preview-stage");
  const label = preview.locator(".flood-status-indicator__label");
  const scheduled = preview.locator("time[datetime='2026-11-16T12:06:00Z']");
  const history = preview.getByRole("list", { name: "Invoice webhook delivery attempts" });
  const details = page.getByRole("checkbox", { name: /^Show schedule details$|^RetrySchedule prop showDetails$/ });

  await expect(label.filter({ hasText: "Automatic retry scheduled" })).toBeVisible();
  await expect(scheduled).toHaveText("in 2 min.");
  await expect(preview.getByText("2 attempts left")).toBeVisible();
  await expect(history.getByRole("listitem")).toHaveCount(2);
  await page.evaluate(() => document.fonts.ready);
  await preview.screenshot({ path: info.outputPath("retry-schedule.png") });
  await scheduled.focus();
  await expect(page.getByRole("tooltip").filter({ hasText: "UTC" })).toBeVisible();
  await scheduled.blur();

  await details.uncheck();
  await expect(label.filter({ hasText: "Automatic retry scheduled" })).toBeVisible();
  await expect(scheduled).toHaveCount(0);
  await expect(preview.getByText("2 attempts left")).toHaveCount(0);
  await details.check();

  await page.getByRole("checkbox", { name: /^Narrow width$|^RetrySchedule prop narrow$/ }).check();
  expect(await scheduled.locator("..").evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  const state = page.getByRole("combobox", { name: /^State$|^RetrySchedule prop state$/ });
  if (await state.isVisible()) await chooseSelectOption(state, "exhausted");
  else await chooseStudioSheetOption(page, "State", "exhausted");
  await expect(label.filter({ hasText: "Automatic retries exhausted" })).toBeVisible();
  await expect(scheduled).toHaveCount(0);
  await expect(history.getByRole("listitem")).toHaveCount(2);
  await preview.screenshot({ path: info.outputPath("retry-schedule-narrow.png") });
});
