import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("NotificationChannelSettings pauses delivery while preserving accepted event choices", async ({ page }, info) => {
  await page.goto("/components/notification-channel-settings");
  const stage = page.locator(".preview-stage");
  const channel = stage.getByRole("switch", { name: "Email notifications", exact: true });
  const group = stage.getByRole("group", { name: "Notification types" });
  const assignments = group.getByRole("switch", { name: "New assignments" });
  const locked = group.getByRole("switch", { name: "Workspace announcements" });
  const accept = page.getByRole("checkbox", { name: "NotificationChannelSettings prop accept" });
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "NotificationChannelSettings prop narrow" }).check();
    await chooseSelectOption(page.getByRole("combobox", { name: "NotificationChannelSettings prop surface" }), "overlay");
  }
  await expect(channel).toBeChecked();
  await expect(assignments).not.toBeChecked();
  const channelBox = (await channel.boundingBox())!;
  const assignmentsBox = (await assignments.boundingBox())!;
  expect(channelBox.x).toBeCloseTo(assignmentsBox.x, 0);
  const panel = (await stage.locator(".flood-surface").boundingBox())!;
  expect(panel.x + panel.width - channelBox.x - channelBox.width).toBeGreaterThanOrEqual(16);
  await assignments.press("Space");
  await expect(assignments).toBeChecked();
  await expect(locked).toHaveAttribute("aria-readonly", "true");
  await expect(locked).toHaveAccessibleDescription("Set by your workspace.");
  await locked.press("Space");
  await expect(locked).toBeChecked();
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("notification-channel-settings.png"), animations: "disabled" });

  await channel.press("Space");
  await expect(channel).not.toBeChecked();
  await expect(channel).toBeFocused();
  await expect(assignments).toBeDisabled();
  await expect(assignments).toBeChecked();
  await stage.screenshot({ path: info.outputPath("notification-channel-paused.png"), animations: "disabled" });
  await channel.press("Space");
  await expect(assignments).toBeEnabled();
  await expect(assignments).toBeChecked();

  await accept.uncheck();
  await assignments.press("Space");
  await expect(assignments).toBeChecked();
  await channel.press("Space");
  await expect(channel).toBeChecked();
  await page.getByRole("checkbox", { name: "NotificationChannelSettings prop disabled" }).check();
  await expect(channel).toBeDisabled();
  await expect(assignments).toBeDisabled();
});
