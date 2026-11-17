import { expect, test } from "@playwright/test";

test("SnoozeMenu keeps its opener stable and reflects only accepted schedules", async ({ page }, info) => {
  await page.goto("/components/snooze-menu");
  const stage = page.locator(".preview-stage");
  const opener = stage.getByRole("button", { name: /^Snooze export notification/ });
  const menu = page.getByRole("menu", { name: "Snooze export notification" });
  const returns = stage.getByRole("status");
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "SnoozeMenu prop narrow" }).check();
  }
  await page.evaluate(() => document.fonts.ready);
  const initialWidth = (await opener.boundingBox())!.width;
  await opener.press("Enter");
  await expect(menu.getByRole("menuitem", { name: "End snooze" })).toHaveCount(0);
  await expect(menu.getByRole("menuitem", { name: "In an hour" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(opener).toHaveAccessibleName("Snooze export notification: snoozed until Tomorrow, 09:00");
  await expect(returns).toHaveText("Tomorrow, 09:00");
  await expect(opener).toBeFocused();
  expect((await opener.boundingBox())!.width).toBeCloseTo(initialWidth, 0);

  await opener.press("Enter");
  await expect(menu.getByRole("menuitem", { name: "End snooze" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("snooze-menu.png"), animations: "disabled" });
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();

  await page.getByRole("checkbox", { name: "SnoozeMenu prop accept" }).uncheck();
  await opener.click();
  await menu.getByRole("menuitem", { name: "In an hour" }).click();
  await expect(returns).toHaveText("Tomorrow, 09:00");
  await page.getByRole("checkbox", { name: "SnoozeMenu prop accept" }).check();
  await opener.click();
  await menu.getByRole("menuitem", { name: "End snooze" }).click();
  await expect(returns).toHaveText("");
  await expect(opener).toHaveAccessibleName("Snooze export notification");
});
