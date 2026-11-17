import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("DeadlineStatus exposes the exact instant across all clock states", async ({ page }) => {
  await page.goto("/components/deadline-status");
  const deadline = page.locator(".preview-stage .flood-deadline-status");
  const exact = deadline.locator("time");
  await expect(deadline).toHaveAttribute("data-state", "due-soon");
  await expect(exact).toHaveAttribute("datetime", "2026-11-16T12:00:00Z");
  await expect(exact).not.toContainText("2026");
  await exact.focus();
  await expect(page.getByRole("tooltip").filter({hasText:/2026/})).toBeVisible();
  for (const [option, state, label] of [
    ["remaining", "remaining", /left/],
    ["due now", "due-now", /Due now/],
    ["overdue", "overdue", /overdue/],
    ["paused", "paused", /Paused/],
  ] as const) {
    await chooseSelectOption(page.getByRole("combobox", { name: "DeadlineStatus prop state" }), option);
    await expect(deadline).toHaveAttribute("data-state", state);
    await expect(deadline.locator(".flood-status-indicator")).toHaveText(label);
    await expect(exact).toHaveAttribute("datetime", "2026-11-16T12:00:00Z");
  }
  await page.getByRole("checkbox", { name: "DeadlineStatus prop showDeadline" }).uncheck();
  await expect(deadline.locator(".flood-visually-hidden time")).toHaveAttribute("datetime", "2026-11-16T12:00:00Z");
});

test("RelativeTimeRangePicker keeps drafts and presets reachable across modes", async ({ page }, info) => {
  await page.goto("/components/relative-time-range-picker");
  const range = page.locator(".preview-stage").getByRole("group", { name: "Time range", exact: true });
  const absolute = range.getByRole("radio", { name: "Absolute", exact: true });
  const relative = range.getByRole("radio", { name: "Relative", exact: true });
  const lastWeek = range.getByRole("button", { name: "Last 7 days", exact: true });
  const amount = range.getByRole("spinbutton", { name: "Amount", exact: true });
  await lastWeek.click();
  await expect(lastWeek).toHaveAttribute("aria-pressed", "true");
  await expect(amount).toHaveValue("7");
  await chooseSelectOption(range.getByRole("combobox", { name: "Time zone", exact: true }), "Europe/Berlin");

  await absolute.press("Space");
  await expect(absolute).toBeFocused();
  const endHour = range.getByRole("spinbutton", { name: "End time, Hour", exact: true });
  await endHour.fill("19");
  await expect(endHour).toHaveValue("19");
  await relative.click();
  await expect(amount).toHaveValue("7");
  await expect(lastWeek).toHaveAttribute("aria-pressed", "true");
  await expect(range.getByRole("combobox", { name: "Time zone", exact: true })).toContainText("Europe/Berlin");
  const presets = range.getByRole("group", { name: "Quick ranges" });
  expect(await presets.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await page.evaluate(() => document.fonts.ready);
  await range.screenshot({ path: info.outputPath("relative-range.png") });
  await absolute.click();
  await expect(endHour).toHaveValue("19");
});
