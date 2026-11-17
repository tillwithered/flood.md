import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("ServiceLevelTargets distinguishes open deadlines and recorded outcomes", async ({ page }, info) => {
  await page.goto("/components/service-level-targets");
  const stage = page.locator(".preview-stage");
  const targets = stage.getByRole("list", { name: "Response and resolution" });
  const response = targets.getByRole("listitem").filter({ hasText: "First response" });
  const resolution = targets.getByRole("listitem").filter({ hasText: "Resolution" });
  const surface = page.getByRole("combobox", { name: "ServiceLevelTargets prop surface" });
  const scenario = page.getByRole("region", { name: "Preview properties" })
    .getByRole("combobox", { name: "Scenario", exact: true });

  await chooseSelectOption(surface, "canvas");
  await expect(resolution.locator(".flood-status-indicator__label")).toHaveText("Due in 11 min");
  await chooseSelectOption(surface, info.project.name === "mobile" ? "overlay" : "raised");
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "ServiceLevelTargets prop narrow" }).check();
  }
  await expect(response.getByText("Met", { exact: true })).toBeVisible();
  await expect(response.locator("time")).toHaveAttribute("datetime", "2026-11-16T10:42:00Z");
  await expect(resolution.locator(".flood-data-list-item__details time")).toHaveAttribute("datetime", "2026-11-16T12:00:00Z");
  await expect.poll(() => targets.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("service-level-targets.png"), animations: "disabled" });

  await chooseSelectOption(scenario, "Paused");
  await expect(resolution.getByText("Paused", { exact: true })).toBeVisible();
  await expect(resolution.getByText("Waiting for the customer to share a receipt.")).toBeVisible();
  await expect(resolution.locator("time")).toHaveCount(0);
  await chooseSelectOption(scenario, "Overdue");
  await expect(resolution.locator(".flood-status-indicator__label")).toHaveText("19 min overdue");
  await chooseSelectOption(scenario, "Completed late");
  await expect(resolution.getByText("Missed", { exact: true })).toBeVisible();
  await expect(resolution.getByText("Completed", { exact: true })).toBeVisible();
  await expect(resolution.locator("time")).toHaveAttribute("datetime", "2026-11-16T11:44:00Z");
  await expect(response.getByText("Met", { exact: true })).toBeVisible();
});
