import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("MediaCredit keeps source confidence with the media caption", async ({ page }, info) => {
  await page.goto("/components/media-credit");
  const figure = page.locator(".preview-stage figure");
  const credit = figure.locator("figcaption");
  const asset = figure.getByRole("img", { name: "Weekly visits with a smooth area plot" });
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  await expect(asset).toBeVisible();
  await asset.evaluate(node => (node as HTMLImageElement).decode());
  await expect(credit).toContainText("Flood Studio");
  await expect(credit.getByRole("link", { name: "Chart documentation" })).toHaveAttribute("href", "/docs/charts");
  await expect(credit.locator("time")).toHaveAttribute("datetime", "2026-11-16");
  await page.evaluate(() => document.fonts.ready);
  await figure.screenshot({ path: info.outputPath("media-credit.png") });

  await page.getByRole("checkbox", { name: "MediaCredit prop narrow" }).check();
  await chooseSelectOption(scenario, "unverified");
  await expect(credit.getByRole("link", { name: "Design reference archive" })).toBeVisible();
  await expect(credit.getByText("Unverified source")).toBeVisible();
  await expect(credit.locator("time")).toHaveCount(0);
  expect(await credit.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await figure.screenshot({ path: info.outputPath("media-credit-narrow.png") });

  await chooseSelectOption(scenario, "creator only");
  await expect(credit).toHaveText("Flood Studio");
  await expect(credit.getByRole("link")).toHaveCount(0);
  await expect(asset).toBeVisible();
});
