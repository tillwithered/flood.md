import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("ColorContrast applies the unrounded threshold for the selected text size", async ({ page }, info) => {
  await page.goto("/components/color-contrast");
  const panel = page.locator(".preview-stage .flood-surface");
  const sample = panel.getByText("Your changes have been saved.", { exact: true });
  const indicator = panel.locator(".flood-status-indicator");
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  await expect(sample).toHaveCSS("color", "rgb(255, 71, 168)");
  await expect(sample).toHaveCSS("background-color", "rgb(38, 38, 38)");
  await expect(indicator).toHaveText("Meets AA for normal text");
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({ path: info.outputPath("color-contrast.png") });

  await chooseSelectOption(scenario, "gray on white");
  await expect(panel.getByText("4.47:1", { exact: true })).toBeVisible();
  await expect(indicator).toHaveText("Below AA for normal text");
  await page.getByRole("checkbox", { name: "ColorContrast prop narrow" }).check();
  await chooseSelectOption(page.getByRole("combobox", { name: "ColorContrast prop textSize" }), "large");
  await expect(sample).toHaveCSS("font-size", "24px");
  await expect(indicator).toHaveText("Meets AA for large text");
  expect(await panel.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({ path: info.outputPath("color-contrast-narrow.png") });

  await chooseSelectOption(scenario, "black on white");
  await expect(panel.getByText("21:1", { exact: true })).toBeVisible();
  await chooseSelectOption(scenario, "same color");
  await expect(panel.getByText("1:1", { exact: true })).toBeVisible();
  await expect(indicator).toHaveText("Below AA for large text");
});
