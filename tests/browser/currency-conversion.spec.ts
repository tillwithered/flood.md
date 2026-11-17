import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("currency conversion preserves the source, reported rate and settlement state", async ({page}, info) => {
  await page.goto("/components/currency-conversion");
  const conversion = page.locator('dl[aria-label="Currency conversion"]');
  const stage = page.locator(".preview-stage");
  const labels = conversion.locator("dt");
  const values = conversion.locator("dd");
  await expect(labels).toHaveText(["Original amount","Statement amount","Exchange rate"]);
  await expect(values).toHaveText(["240.00 CAD","175.87 USD","1 CAD = 0.7328 USD"]);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({path:info.outputPath("currency-conversion.png")});

  const state = page.getByRole("combobox", {name:"CurrencyConversion prop state"});
  await chooseSelectOption(state, "Estimated");
  await expect(labels.nth(1)).toHaveText("Estimated amount");
  await expect(values.nth(1)).toHaveText("175.63 USD");

  await chooseSelectOption(state, "Pending");
  await expect(labels).toHaveText(["Original amount","Statement amount"]);
  await expect(values.nth(0)).toHaveText("240.00 CAD");
  await expect(values.nth(1)).toContainText(/Pending\s*USD/);

  await chooseSelectOption(state, "Refund");
  await chooseSelectOption(page.getByRole("combobox", {name:"CurrencyConversion prop surface"}), "overlay");
  await page.getByRole("checkbox", {name:"CurrencyConversion prop narrow"}).check();
  await expect(values).toHaveText(["−60.00 CAD","−43.97 USD"]);
  await expect.poll(() => conversion.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.screenshot({path:info.outputPath("currency-conversion-mobile.png")});
});
