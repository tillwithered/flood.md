import { expect, test } from "@playwright/test";

test("BackupPicker excludes unavailable backups from the draft restore target", async ({ page }, info) => {
  await page.goto("/components/backup-picker");
  const stage = page.locator(".preview-stage");
  const form = stage.locator("form");
  const group = stage.getByRole("radiogroup", { name: "Choose a backup" });
  const daily = group.getByRole("radio", { name: "Daily backup" });
  const manual = group.getByRole("radio", { name: "Before schema migration" });
  const expired = group.getByRole("radio", { name: "Weekly backup" });
  const selected = () => form.evaluate(form => new FormData(form as HTMLFormElement).get("backup"));
  await expect(expired).toBeDisabled();
  await expect(expired).toHaveAccessibleDescription(/Retention period ended/);
  await expect(group.locator("time").first()).toHaveAttribute("datetime", "2026-11-16T06:00:00Z");
  expect(await selected()).toBeNull();
  expect(await form.evaluate(form => (form as HTMLFormElement).checkValidity())).toBe(false);

  await daily.focus();
  await daily.press("Space");
  await expect(daily).toBeChecked();
  expect(await selected()).toBe("daily");
  expect(await form.evaluate(form => (form as HTMLFormElement).checkValidity())).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("backup-picker-selected.png") });

  await page.getByRole("checkbox", { name: "BackupPicker prop expireLatest" }).check();
  await expect(daily).toBeDisabled();
  await expect(daily).not.toBeChecked();
  expect(await selected()).toBeNull();
  await page.getByRole("combobox", { name: "BackupPicker prop surface" }).click();
  await page.getByRole("option", { name: "overlay", exact: true }).click();
  await page.getByRole("checkbox", { name: "BackupPicker prop narrow" }).check();
  await manual.focus();
  await manual.press("Space");
  await expect(manual).toBeChecked();
  expect(await selected()).toBe("manual");
  await expect.poll(() => group.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.screenshot({ path: info.outputPath("backup-picker-unavailable.png") });

  await page.getByRole("checkbox", { name: "BackupPicker prop empty" }).check();
  await expect(stage.getByText("No backups available.")).toBeVisible();
  await expect(stage.getByRole("radio")).toHaveCount(0);
  expect(await selected()).toBeNull();
});
