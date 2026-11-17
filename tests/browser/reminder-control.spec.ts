import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("ReminderControl keeps the record and focus through scheduling, refusal and cancellation", async ({page}, info) => {
  await page.goto("/components/reminder-control");
  const panel = page.locator(".preview-stage .flood-surface");
  const heading = panel.getByRole("heading",{name:"Review export permissions"});
  const add = panel.getByRole("button",{name:/^Remind me:/});
  const edit = panel.getByRole("button",{name:/^Edit reminder:/});
  const timestamp = panel.locator("time");
  const accept = page.getByRole("checkbox",{name:"ReminderControl prop accept"});

  await add.press("Enter");
  await page.getByRole("menuitem",{name:"Tomorrow morning"}).click();
  await expect(timestamp).toHaveAttribute("datetime","2026-11-18T09:00:00Z");
  await expect(edit).toBeFocused();
  await expect(heading).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("reminder-control.png")});

  await accept.uncheck();
  await edit.click();
  await page.getByRole("menuitem",{name:"Later today"}).click();
  await expect(timestamp).toHaveAttribute("datetime","2026-11-18T09:00:00Z");
  await expect(edit).toBeFocused();

  await accept.check();
  await page.getByRole("checkbox",{name:"ReminderControl prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox",{name:"ReminderControl prop surface"}),"overlay");
  await edit.click();
  await expect(page.getByRole("menuitem",{name:"Cancel reminder"})).toBeVisible();
  await page.screenshot({path:info.outputPath("reminder-control-menu.png")});
  await page.getByRole("menuitem",{name:"Cancel reminder"}).click();
  await expect(add).toBeFocused();
  await expect(timestamp).toHaveCount(0);
  await expect(heading).toBeVisible();
});
