import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("DependencySchedule distinguishes overlaps, equal dates and missing evidence", async ({page}, info) => {
  await page.goto("/components/dependency-schedule");
  const stage = page.locator(".preview-stage");
  const schedule = stage.getByRole("group", {name:"Dependency schedule"});
  const scenario = page.getByRole("combobox", {name:"Scenario",exact:true});
  const status = (label: string) => schedule.getByText(label,{exact:true}).filter({visible:true});
  await expect(schedule.locator("dt")).toHaveText(["Forecast finish","Dependent start"]);
  await expect(schedule.locator("time").nth(0)).toHaveAttribute("datetime","2026-11-20");
  await expect(schedule.locator("time").nth(1)).toHaveAttribute("datetime","2026-11-17");
  await expect(status("Starts 3 days before the prerequisite finishes")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const surface = stage.locator(".flood-surface");
  await surface.screenshot({path:info.outputPath("dependency-schedule.png")});

  await page.getByRole("checkbox", {name:"DependencySchedule prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox", {name:"DependencySchedule prop surface"}),"overlay");
  await expect.poll(() => surface.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await surface.screenshot({path:info.outputPath("dependency-schedule-narrow.png")});

  await chooseSelectOption(scenario,"Same day");
  await expect(status("Dates align")).toBeVisible();
  await expect(schedule.locator("dt").first()).toHaveText("Prerequisite finish");
  await chooseSelectOption(scenario,"Missing finish");
  await expect(status("Dates needed to check the dependency")).toBeVisible();
  await expect(status("Date unavailable")).toBeVisible();
  await expect(schedule.locator("time")).toHaveCount(1);
  await chooseSelectOption(scenario,"No conflict");
  await expect(status("Dates align")).toBeVisible();
});
