import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("TimeZoneSelect updates the offset and accepts an alias by keyboard", async ({ page }, info) => {
  await page.goto("/components/time-zone-select");
  const zone = page.locator(".preview-stage").getByRole("combobox", { name: "Time zone", exact: true });
  const summer = page.getByRole("checkbox", { name: "TimeZoneSelect prop summerReference" });
  await expect(zone).toHaveValue("New York · GMT-5");
  await summer.check();
  await expect(zone).toHaveValue("New York · GMT-4");
  await zone.fill("India");
  const option = page.getByRole("option", { name: /Kolkata.*GMT\+5:30/ });
  await expect(option).toBeVisible();
  await expect.poll(() => option.evaluate(node => getComputedStyle(node.closest("[popover]") ?? node).opacity)).toBe("1");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: info.outputPath("zone-search.png") });
  await zone.press("ArrowDown");
  await zone.press("Enter");
  await expect(zone).toHaveValue("Kolkata · GMT+5:30");
  await expect(zone).toBeFocused();
  await summer.uncheck();
  await expect(zone).toHaveValue("Kolkata · GMT+5:30");
});

test("RecurrenceEditor validates weekly days and preserves the end rule drafts", async ({ page }, info) => {
  await page.goto("/components/recurrence-editor");
  const stage = page.locator(".preview-stage");
  const schedule = stage.getByRole("group", { name: "Repeat", exact: true });
  const form = stage.locator("form");
  await expect(schedule.getByText("Every 2 weeks on Mon and Wed", { exact: true })).toBeVisible();
  await schedule.getByRole("checkbox", { name: "Mon", exact: true }).uncheck();
  await schedule.getByRole("checkbox", { name: "Wed", exact: true }).uncheck();
  expect(await form.evaluate(node => (node as HTMLFormElement).checkValidity())).toBe(false);
  await schedule.getByRole("checkbox", { name: "Fri", exact: true }).check();
  expect(await form.evaluate(node => (node as HTMLFormElement).checkValidity())).toBe(true);

  const ends = schedule.getByRole("combobox", { name: "Ends", exact: true });
  await chooseSelectOption(ends, "count");
  const occurrences = schedule.getByRole("spinbutton", { name: "Occurrences", exact: true });
  await occurrences.fill("4");
  await expect(schedule.getByText("Every 2 weeks on Fri for 4 occurrences", { exact: true })).toBeVisible();
  await chooseSelectOption(ends, "date");
  await expect(occurrences).toHaveCount(0);
  await expect(schedule.getByText("Every 2 weeks on Fri through Nov 21, 2026", { exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await schedule.screenshot({ path: info.outputPath("recurrence-date.png") });
  await chooseSelectOption(ends, "count");
  await expect(occurrences).toHaveValue("4");
  const submitted = await form.evaluate(node => [...new FormData(node as HTMLFormElement).entries()]);
  expect(submitted).toContainEqual(["day", "fri"]);
  expect(submitted).toContainEqual(["count", "4"]);
  expect(submitted.some(([name]) => name === "untilDate")).toBe(false);
});
