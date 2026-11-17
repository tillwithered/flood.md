import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("ContentReportStatus keeps the report identity visible as the review changes", async ({ page }, info) => {
  await page.goto("/components/content-report-status");
  const stage = page.locator(".preview-stage");
  const record = stage.getByRole("article", { name: "Comment by @jules.example" });
  const phase = page.getByRole("combobox", { name: "ContentReportStatus prop phase" });
  const surface = page.getByRole("combobox", { name: "ContentReportStatus prop surface" });
  const decision = record.getByText("We removed the comment because it contained an unsolicited promotion.");

  await chooseSelectOption(surface, "canvas");
  await expect(record.getByText("Action taken", { exact: true })).toBeVisible();
  await expect(decision).toBeVisible();
  await chooseSelectOption(surface, info.project.name === "mobile" ? "overlay" : "raised");
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "ContentReportStatus prop narrow" }).check();
  }

  await page.evaluate(() => document.fonts.ready);
  await expect(record.getByText("Spam", { exact: true })).toBeVisible();
  await expect(record.locator("time")).toHaveAttribute("datetime", "2026-11-14");
  await expect.poll(() => record.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.screenshot({ path: info.outputPath("content-report-status.png"), animations: "disabled" });

  for (const status of ["Submitted", "In review", "No action taken"]) {
    await chooseSelectOption(phase, status);
    await expect(record.getByText(status, { exact: true })).toBeVisible();
    await expect(decision).toHaveCount(0);
    await expect(record.locator("time")).toHaveAttribute("datetime", "2026-11-14");
  }
  await expect(record.getByText("We reviewed the comment and found that it did not violate our spam policy.")).toBeVisible();
});
