import { expect, test } from "@playwright/test";

test("VersionHistory separates preview selection from restoring a checkpoint", async ({ page }, info) => {
  await page.goto("/components/version-history");
  const stage = page.locator(".preview-stage");
  const list = stage.getByRole("listbox", { name: "Launch notes versions" });
  const current = list.getByRole("option", { name: /Handoff confirmed Current/ });
  const review = list.getByRole("option", { name: /Support review/ });
  const restore = stage.getByRole("button", { name: "Restore version", exact: true });

  await expect(current).toHaveAttribute("aria-selected", "true");
  await expect(restore).toHaveCount(0);
  await list.press("ArrowDown");
  await expect(current).toHaveAttribute("aria-selected", "true");
  await list.press("Enter");
  await expect(review).toHaveAttribute("aria-selected", "true");
  await expect(list).toBeFocused();
  await expect(stage.getByRole("region", { name: "Support review" })).toBeVisible();

  await restore.click();
  const dialog = page.getByRole("alertdialog", { name: "Restore this version?" });
  await expect(dialog).toContainText("Support review");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(restore).toBeFocused();
  await expect(review).toHaveAttribute("aria-selected", "true");

  await restore.click();
  await dialog.getByRole("button", { name: "Request restore" }).click();
  await expect(page.getByText("Restore requested for Support review.", { exact: true })).toBeVisible();
  await expect(current).toHaveAttribute("aria-selected", "false");

  await page.getByRole("checkbox", { name: "VersionHistory prop narrow" }).check();
  const preview = stage.getByRole("region", { name: "Support review" });
  await expect.poll(async () => (await preview.boundingBox())!.y - (await list.boundingBox())!.y)
    .toBeGreaterThan(100);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("version-history-narrow.png") });

  await page.getByRole("checkbox", { name: "VersionHistory prop allowRestore" }).uncheck();
  await expect(restore).toHaveCount(0);
  await page.getByRole("checkbox", { name: "VersionHistory prop empty" }).check();
  await expect(stage.getByText("No versions yet.", { exact: true })).toBeVisible();
  await expect(list).toHaveCount(0);
});
