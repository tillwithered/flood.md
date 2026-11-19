import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("NumericValue keeps neighboring text steady across a digit boundary", async ({ page }, info) => {
  await page.goto("/components/numeric-value");
  const stage = page.locator(".preview-stage");
  const figure = stage.locator("data.flood-numeric-value");
  const visible = figure.locator("bdi:not([aria-hidden])");
  const reserve = figure.locator("bdi[aria-hidden]");
  const neighbor = stage.getByText("credits remaining", { exact:true });
  const value = page.getByRole("combobox", { name:"NumericValue prop value" });
  const locale = page.getByRole("combobox", { name:"NumericValue prop locale" });

  await expect(visible).toHaveText("999");
  await expect(reserve).toHaveCSS("visibility", "hidden");
  await expect(figure).toHaveCSS("font-variant-numeric", "tabular-nums");
  await page.evaluate(() => document.fonts.ready);
  const initial = (await figure.boundingBox())!.width;
  const initialNeighbor = (await neighbor.boundingBox())!.x;
  await stage.locator(".flood-surface").screenshot({ path: info.outputPath("numeric-value.png") });
  await chooseSelectOption(value, "1000");
  await expect(visible).toHaveText("1,000");
  await expect(figure).toHaveAttribute("value", "1000");
  expect((await figure.boundingBox())!.width).toBe(initial);
  expect((await neighbor.boundingBox())!.x).toBe(initialNeighbor);
  await chooseSelectOption(page.getByRole("combobox", { name:"NumericValue prop align" }), "start");
  expect((await visible.boundingBox())!.x).toBe((await figure.boundingBox())!.x);
  expect((await neighbor.boundingBox())!.x).toBe(initialNeighbor);

  await chooseSelectOption(locale, "fr-FR");
  await expect(visible).toHaveText("1 000");
  await chooseSelectOption(value, "-1000");
  await expect(visible).toHaveText("-1 000");
  await chooseSelectOption(locale, "ar-EG");
  await expect(visible).toHaveText("؜-١٬٠٠٠");
  await chooseSelectOption(page.getByRole("combobox", { name:"NumericValue prop surface" }), "overlay");
  await stage.locator(".flood-surface").screenshot({ path: info.outputPath("numeric-value-localized.png") });

  await chooseSelectOption(locale, "en");
  await chooseSelectOption(value, "100000");
  await expect(visible).toHaveText("100,000");
  expect((await figure.boundingBox())!.width).toBeGreaterThan(initial);
  await page.getByRole("checkbox", { name:"NumericValue prop reserve" }).uncheck();
  await expect(reserve).toHaveCount(0);
});
