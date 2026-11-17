import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("QuietHoursEditor preserves its schedule and explains overnight and equal times", async ({ page }, info) => {
  await page.goto("/components/quiet-hours-editor");
  const stage = page.locator(".preview-stage");
  const active = stage.getByRole("switch", { name: "Quiet hours" });
  const monday = stage.getByRole("checkbox", { name: "Mon", exact: true });
  const until = stage.getByRole("button", { name: "Choose time: Until" });
  const overnight = stage.getByText("Ends the following day.");
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "QuietHoursEditor prop narrow" }).check();
    await chooseSelectOption(page.getByRole("combobox", { name: "QuietHoursEditor prop surface" }), "overlay");
  }
  await expect(active).toHaveAccessibleDescription("New York time");
  await expect(overnight).toBeVisible();
  await expect(monday).toBeChecked();
  await page.evaluate(() => document.fonts.ready);
  const weekdayRows = await stage.getByRole("group", { name: "Starts on" }).locator("label").evaluateAll(labels => {
    const counts = new Map<number, number>();
    for (const label of labels) {
      const top = Math.round(label.getBoundingClientRect().top);
      counts.set(top, (counts.get(top) ?? 0) + 1);
    }
    return [...counts.values()];
  });
  expect(weekdayRows).toEqual(info.project.name === "mobile" ? [4, 3] : [7]);
  await stage.screenshot({ path: info.outputPath("quiet-hours-editor.png"), animations: "disabled" });

  await monday.press("Space");
  await expect(monday).not.toBeChecked();
  await active.press("Space");
  await expect(monday).toBeDisabled();
  await expect(until).toBeDisabled();
  await expect(overnight).toHaveCount(0);
  await active.press("Space");
  await expect(monday).toBeEnabled();
  await expect(monday).not.toBeChecked();
  await expect(overnight).toBeVisible();

  await until.click();
  await page.getByRole("option", { name: "22:00", exact: true }).click();
  await expect(stage.getByRole("alert")).toHaveText("Choose a different end time.");
  await expect(overnight).toHaveCount(0);
  await until.click();
  await page.getByRole("option", { name: "23:00", exact: true }).click();
  await expect(stage.getByRole("alert")).toHaveCount(0);
  await expect(overnight).toHaveCount(0);
  for (const day of ["Tue", "Wed", "Thu", "Sun"]) {
    await stage.getByRole("checkbox", { name: day, exact: true }).uncheck();
  }
  await expect(stage.getByRole("alert")).toHaveText("Choose at least one day.");
});
