import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

const storageKey = "flood:settings-workspace:v1";

test("settings validate, discard drafts and save both sections across reloads", async ({ page }) => {
  await page.goto("/playground/settings");
  const form = page.getByRole("form", { name: "Workspace settings" });
  const name = form.getByRole("textbox", { name: "Workspace name" });
  const timeZone = form.getByRole("combobox", { name: "Time zone" });
  const digest = form.getByRole("switch", { name: "Weekly summary" });
  const save = form.getByRole("button", { name: "Save settings" });
  const discard = form.getByRole("button", { name: "Discard changes" });

  await expect(name).toHaveValue("Studio North");
  await name.fill("   ");
  await save.click();
  await expect(name).toBeFocused();
  await expect(name).toHaveAccessibleDescription("Enter a workspace name.");
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();

  await chooseSelectOption(timeZone, "Asia/Tokyo");
  await digest.check();
  await discard.click();
  await expect(name).toHaveValue("Studio North");
  await expect(name).toBeFocused();
  await expect(timeZone).toContainText("UTC");
  await expect(digest).not.toBeChecked();
  await expect(discard).toBeDisabled();

  await name.fill("  Flood Workshop  ");
  await chooseSelectOption(timeZone, "Asia/Tokyo");
  await digest.check();
  await save.focus();
  await save.press("Enter");
  await expect(form.getByRole("status")).toHaveText("Settings saved.");
  await expect(save).toBeFocused();
  await expect(name).toHaveValue("Flood Workshop");

  await page.reload();
  await expect(name).toHaveValue("Flood Workshop");
  await expect(timeZone).toContainText("Asia/Tokyo");
  await expect(digest).toBeChecked();
});

test("settings retain a failed draft and leave a malformed snapshot untouched", async ({ page }) => {
  await page.goto("/playground/settings");
  const form = page.getByRole("form", { name: "Workspace settings" });
  const name = form.getByRole("textbox", { name: "Workspace name" });
  await name.fill("Retain this draft");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new Error("Write refused"); };
  });
  await form.getByRole("button", { name: "Save settings" }).click();
  await expect(form.getByText("Settings could not be saved. Try again.")).toBeVisible();
  await expect(name).toHaveValue("Retain this draft");
  await form.getByRole("button", { name: "Discard changes" }).click();
  await expect(name).toHaveValue("Studio North");
  await expect(form.getByText("Settings could not be saved. Try again.")).toHaveCount(0);

  await page.addInitScript(key => localStorage.setItem(key, "{malformed"), storageKey);
  await page.reload();
  await expect(page.getByText("Settings could not be loaded.")).toBeVisible();
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(form).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe("{malformed");
});
