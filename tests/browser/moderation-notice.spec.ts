import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("ModerationNotice separates the effective restriction from the appeal lifecycle", async ({ page }, info) => {
  await page.goto("/components/moderation-notice");
  const stage = page.locator(".preview-stage");
  const notice = stage.getByRole("article", { name: "Posting restriction" });
  const appeal = notice.getByRole("button", { name: "Appeal decision" });
  const surface = page.getByRole("combobox", { name: "ModerationNotice prop surface" });
  const scenario = page.getByRole("region", { name: "Preview properties" })
    .getByRole("combobox", { name: "Scenario", exact: true });
  await chooseSelectOption(surface, "canvas");
  await expect(appeal).toBeVisible();
  await chooseSelectOption(surface, info.project.name === "mobile" ? "overlay" : "raised");
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "ModerationNotice prop narrow" }).check();
  }
  await expect(notice.locator("time").first()).toHaveAttribute("datetime", "2026-11-17T12:00:00Z");
  await expect(notice.locator("time").last()).toHaveAttribute("datetime", "2026-11-23T12:00:00Z");
  await expect.poll(() => notice.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await page.evaluate(() => document.fonts.ready);
  const panel = (await stage.locator(".flood-surface").boundingBox())!;
  const canvas = (await stage.boundingBox())!;
  expect(panel.y).toBeGreaterThan(canvas.y);
  expect(panel.y + panel.height).toBeLessThan(canvas.y + canvas.height);
  await stage.screenshot({ path: info.outputPath("moderation-notice.png"), animations: "disabled" });
  await appeal.press("Enter");
  await expect(page.getByRole("dialog", { name: "Appeal decision" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(appeal).toBeFocused();

  for (const status of ["Appeal submitted", "Decision upheld", "Appeal accepted", "Expired"]) {
    await chooseSelectOption(scenario, status);
    await expect(appeal).toHaveCount(0);
    await expect(notice.getByText(status, { exact: true })).toBeVisible();
    await expect(notice.locator("time")).toHaveCount(status === "Appeal submitted" || status === "Decision upheld" ? 1 : 0);
  }
});
