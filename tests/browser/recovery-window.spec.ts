import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("RecoveryWindow distinguishes inclusive bounds from an unavailable candidate", async ({ page }, info) => {
  await page.goto("/components/recovery-window");
  const preview = page.locator(".preview-stage");
  const window = preview.locator(".flood-recovery-window");
  const point = window.locator(".flood-recovery-window__point");
  const rail = window.locator(".flood-recovery-window__rail");
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  const latest = window.locator('time[datetime="2026-11-16T16:42:18Z"]').first();
  const position = async () => {
    const bounds = (await rail.boundingBox())!;
    const marker = (await point.boundingBox())!;
    return (marker.x + marker.width / 2 - bounds.x) / bounds.width;
  };
  await expect(point).toBeVisible();
  expect(await position()).toBeCloseTo(0.57, 2);
  await expect(latest).toContainText("4:42:18 PM");
  await page.evaluate(() => document.fonts.ready);
  await preview.screenshot({ path: info.outputPath("recovery-window.png") });

  await chooseSelectOption(scenario, "outside window");
  await expect(point).toHaveCount(0);
  await expect(window.getByText("Outside recovery window")).toBeVisible();
  await page.getByRole("checkbox", { name: "RecoveryWindow prop narrow" }).check();
  await chooseSelectOption(page.getByRole("combobox", { name: "RecoveryWindow prop surface" }), "overlay");
  await chooseSelectOption(page.getByRole("combobox", { name: "RecoveryWindow prop timeZone" }), "America/New_York");
  await expect(latest).toContainText("11:42:18 AM");
  await expect(window.getByText("New York time")).toBeVisible();
  await expect(window.getByText("Outside recovery window")).toBeVisible();
  expect(await window.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await preview.screenshot({ path: info.outputPath("recovery-window-narrow.png") });

  await chooseSelectOption(scenario, "latest point");
  await expect(window.getByText("Outside recovery window")).toHaveCount(0);
  expect(await position()).toBeCloseTo(1, 2);
  await chooseSelectOption(scenario, "single point");
  expect(await position()).toBeCloseTo(0.5, 2);
  await chooseSelectOption(scenario, "no selection");
  await expect(point).toHaveCount(0);
  await expect(window.locator("time")).toHaveCount(2);
});
