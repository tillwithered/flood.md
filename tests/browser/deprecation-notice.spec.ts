import { expect, test } from "@playwright/test";

test("DeprecationNotice keeps the lifecycle and migration path readable in both appearances", async ({ page }, info) => {
  await page.goto("/components/deprecation-notice");
  const stage = page.locator(".preview-stage");
  const notice = stage.locator(".flood-alert");
  const replacement = notice.getByRole("link", { name: "/v2/exports" });
  await expect(notice.getByText("Deprecated", { exact: true })).toBeVisible();
  await expect(notice.locator("time")).toHaveAttribute("datetime", "2026-12-01");
  await expect(replacement).toHaveAttribute("href", "/components/endpoint-label");
  await expect(notice).not.toHaveAttribute("role", /alert|status/);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("deprecation-notice-banner.png") });

  await page.getByRole("combobox", { name: "DeprecationNotice prop state" }).click();
  await page.getByRole("option", { name: "retired", exact: true }).click();
  await page.getByRole("combobox", { name: "DeprecationNotice prop appearance" }).click();
  await page.getByRole("option", { name: "inline", exact: true }).click();
  await page.getByRole("checkbox", { name: "DeprecationNotice prop narrow" }).check();
  await expect(notice.getByText("Retired", { exact: true })).toBeVisible();
  await expect(notice.getByText("Retired on", { exact: true })).toBeVisible();
  await expect(notice.locator("time")).toHaveAttribute("datetime", "2026-11-12");
  await expect.poll(() => notice.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.screenshot({ path: info.outputPath("deprecation-notice-inline.png") });

  await page.getByRole("checkbox", { name: "DeprecationNotice prop showCutoff" }).uncheck();
  await page.getByRole("checkbox", { name: "DeprecationNotice prop showReplacement" }).uncheck();
  await expect(notice.locator("dl")).toHaveCount(0);
  await expect(notice.getByText("Requests to the v1 endpoint now fail.")).toBeVisible();
});
