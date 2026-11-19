import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("maintenance window keeps the published phase and disambiguates both endpoints", async ({page}, info) => {
  await page.goto("/components/maintenance-window");
  const window = page.getByRole("article", {name:"Connection pool upgrade"});
  const stage = page.locator(".preview-stage");
  const times = window.locator("time");
  await expect(window.getByText("Scheduled", {exact:true})).toBeVisible();
  await expect(window).toContainText("Shared pooler · Production");
  await expect(times.nth(0)).toHaveAttribute("datetime", "2026-11-30T13:00:00Z");
  await expect(times.nth(1)).toContainText("3:00 PM UTC");
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({path:info.outputPath("maintenance-window.png")});

  const timing = page.getByRole("combobox", {name:"MaintenanceWindow prop timing"});
  await chooseSelectOption(timing, "Clock change");
  await expect(times.nth(0)).toContainText(/1:30 AM GMT[−-]4/);
  await expect(times.nth(1)).toContainText(/1:30 AM GMT[−-]5/);
  await expect(window.getByText("Scheduled", {exact:true})).toBeVisible();

  await chooseSelectOption(timing, "Across midnight");
  await chooseSelectOption(page.getByRole("combobox", {name:"MaintenanceWindow prop phase"}), "in-progress");
  await chooseSelectOption(page.getByRole("combobox", {name:"MaintenanceWindow prop surface"}), "overlay");
  await page.getByRole("checkbox", {name:"MaintenanceWindow prop narrow"}).check();
  await expect(times.nth(0)).toContainText("Nov 30");
  await expect(times.nth(1)).toContainText("Dec 1");
  await expect(window.getByText("In progress", {exact:true})).toBeVisible();
  await expect.poll(() => window.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.screenshot({path:info.outputPath("maintenance-window-mobile.png")});
});
