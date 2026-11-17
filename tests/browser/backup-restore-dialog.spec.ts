import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("BackupRestoreDialog identifies the exact restore point and blocks expired points", async ({ page }, info) => {
  await page.goto("/components/backup-restore-dialog");
  const trigger = page.getByRole("button", { name: "Review restore", exact: true });
  const dialog = page.getByRole("alertdialog", { name: "Restore database?" });
  const cancel = dialog.getByRole("button", { name: "Cancel" });
  const restore = dialog.getByRole("button", { name: "Restore database", exact: true });
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  const feedback = page.getByRole("region", { name: "BackupRestoreDialog live playground" }).getByRole("status");

  await trigger.press("Enter");
  await expect(cancel).toBeFocused();
  await expect(dialog).toHaveAccessibleDescription(/after this point will be lost.*Billing will be unavailable/s);
  await expect(dialog.locator("time")).toHaveAttribute("datetime", "2026-11-16T14:25:12Z");
  await expect(dialog.locator("time")).toContainText("2:25:12 PM UTC");
  await page.evaluate(() => document.fonts.ready);
  await dialog.screenshot({ path: info.outputPath("backup-restore-dialog.png") });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(feedback).toHaveText("");

  await chooseSelectOption(scenario, "Expired");
  await trigger.click();
  await expect(restore).toBeDisabled();
  await expect(dialog).toHaveAccessibleDescription(/outside the current recovery window/);
  await cancel.click();
  await expect(feedback).toHaveText("");

  await chooseSelectOption(scenario, "New project");
  const zone = page.getByRole("combobox", { name: "BackupRestoreDialog prop timeZone" });
  await chooseSelectOption(zone, "America/New_York");
  await trigger.click();
  await expect(dialog).toContainText("Billing recovery");
  await expect(dialog).toHaveAccessibleDescription(/creates a separate database.*Storage objects are excluded/s);
  await expect(dialog.locator("time")).toHaveAttribute("datetime", "2026-11-16T06:00:00Z");
  await expect(dialog.locator("time")).toContainText("1:00:00 AM EST");
  await expect.poll(() => dialog.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await dialog.screenshot({ path: info.outputPath("backup-restore-copy.png") });
  await dialog.getByRole("button", { name: "Create restored copy" }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(feedback).toHaveText("Restore requested for Billing recovery.");
});
