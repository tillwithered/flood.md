import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("PasskeyList distinguishes usage states and confirms removal by name", async ({ page }, info) => {
  await page.goto("/components/passkey-list");
  const stage = page.locator(".preview-stage");
  const list = stage.getByRole("list", { name: "Registered passkeys" });
  const work = list.getByRole("listitem").filter({ hasText: "Work laptop" });
  const backup = list.getByRole("listitem").filter({ hasText: "Backup security key" });
  const phone = list.getByRole("listitem").filter({ hasText: "iPhone" });
  await expect(work).toContainText("Windows Hello");
  await expect(work).toContainText("Last used Nov 16");
  await expect(work.locator("time").last()).toHaveAttribute("datetime", "2026-11-16");
  await expect(backup).toContainText("Never used");
  await expect(phone).not.toContainText(/Never used|Last used/);
  await page.evaluate(() => document.fonts.ready);
  await list.locator("xpath=ancestor::*[contains(@class, 'flood-surface')][1]").screenshot({ path: info.outputPath("passkey-list.png") });

  const removeBackup = backup.getByRole("button", { name: "Remove Backup security key" });
  await removeBackup.press("Enter");
  const dialog = page.getByRole("alertdialog", { name: "Remove Backup security key?" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(removeBackup).toBeFocused();
  await removeBackup.click();
  await dialog.getByRole("button", { name: "Remove passkey", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Removal requested for Backup security key." })).toBeVisible();

  await page.getByRole("checkbox", { name: "PasskeyList prop narrow" }).check();
  await chooseSelectOption(page.getByRole("combobox", { name: "PasskeyList prop surface" }), "overlay");
  await expect.poll(() => list.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await expect.poll(() => backup.evaluate(row => {
    const title = row.querySelector(".flood-data-list-item__title")!.getBoundingClientRect();
    const button = row.querySelector("button")!.getBoundingClientRect();
    return button.left >= title.right && button.top < row.getBoundingClientRect().bottom - button.height;
  })).toBe(true);
  await list.screenshot({ path: info.outputPath("passkey-list-narrow.png") });

  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  await chooseSelectOption(scenario, "Read only");
  await expect(list.getByRole("listitem")).toHaveCount(3);
  await expect(list.getByRole("button")).toHaveCount(0);
  await chooseSelectOption(scenario, "Empty");
  await expect(stage.getByText("No passkeys added.")).toBeVisible();
  await expect(list).toHaveCount(0);
});
