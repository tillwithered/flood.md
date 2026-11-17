import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("RolloutAllocation keeps complementary shares through keyboard and read-only changes", async ({ page }, info) => {
  await page.goto("/components/rollout-allocation");
  const panel = page.locator(".preview-stage .flood-surface");
  const slider = panel.getByRole("slider", { name: "New checkout" });
  const shares = panel.locator(".flood-rollout-allocation__shares");
  await expect(slider).toHaveAttribute("aria-valuetext", "25%");
  await expect(shares).toContainText("75%");
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({ path: info.outputPath("rollout-allocation.png") });
  await slider.press("End");
  await expect(slider).toHaveValue("100");
  await expect(shares.locator("> div").last()).toContainText("0%");
  await slider.press("Home");
  await expect(slider).toHaveValue("0");
  await expect(shares.locator("> div").last()).toContainText("100%");

  await chooseSelectOption(page.getByRole("combobox", { name: "Scenario", exact: true }), "canary");
  await expect(slider).toHaveValue("0.125");
  await expect(slider).toHaveAttribute("aria-valuetext", "0.125%");
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue("0.126");
  await expect(shares.locator("> div").last()).toContainText("99.874%");
  await page.getByRole("checkbox", { name: "RolloutAllocation prop narrow" }).check();
  await page.getByRole("checkbox", { name: "RolloutAllocation prop readOnly" }).check();
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue("0.126");
  await expect(slider).toHaveAttribute("aria-readonly", "true");
  expect(await panel.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({ path: info.outputPath("rollout-allocation-narrow.png") });
});
