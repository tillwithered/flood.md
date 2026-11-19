import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("LogExportForm scopes the export and preserves choices after a failed request", async ({page}, info) => {
  await page.goto("/components/log-export-form");
  const panel = page.locator(".preview-stage .flood-surface");
  const format = panel.getByRole("combobox", {name:"Format"});
  const limit = panel.getByRole("combobox", {name:"Row limit"});
  const range = panel.getByRole("combobox", {name:"Time range"});
  const submit = panel.getByRole("button", {name:"Download logs"});

  await expect(panel.getByText("Nov 16 · 09:00–12:00 UTC")).toBeVisible();
  await expect(range).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("log-export-form.png"), animations:"disabled"});

  await chooseSelectOption(page.getByRole("combobox", {name:"LogExportForm prop range"}), "Recent");
  await page.getByRole("checkbox", {name:"LogExportForm prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox", {name:"LogExportForm prop surface"}), "overlay");
  await chooseSelectOption(range, "21600");
  await chooseSelectOption(format, "json");
  await chooseSelectOption(limit, "1000");
  await page.getByRole("checkbox", {name:"LogExportForm prop fail"}).check();
  await submit.click();
  await expect(panel.getByRole("alert")).toHaveText("Couldn’t download logs. Try again.");
  await expect(format).toHaveText("JSON");
  await expect(limit).toHaveText("1,000");
  await expect(range).toHaveText("Last 6 hours");
  expect(await panel.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("log-export-form-narrow.png"), animations:"disabled"});

  await page.getByRole("checkbox", {name:"LogExportForm prop fail"}).uncheck();
  await submit.click();
  await expect(panel.getByRole("status")).toHaveText("Export requested");
  await expect(panel.getByRole("alert")).toHaveCount(0);
  await page.getByRole("checkbox", {name:"LogExportForm prop pending"}).check();
  await expect(panel.locator("form")).toHaveAttribute("aria-busy", "true");
  await expect(format).toBeDisabled();
});
