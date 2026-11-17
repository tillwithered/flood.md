import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("ProjectHealth distinguishes an overdue report from its historical rating", async ({ page }, info) => {
  await page.goto("/components/project-health");
  const panel = page.locator(".preview-stage .flood-surface");
  const project = panel.getByRole("listitem").filter({ hasText: "Warehouse rollout" });
  const health = project.locator(".flood-project-health");
  const indicator = health.locator(".flood-status-indicator");
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  const dateLink = health.getByRole("link", { name: "Read update · Nov 14" });
  await expect(indicator).toHaveText("Update overdue");
  await expect(health.getByText("Last reported: At risk")).toBeVisible();
  await expect(dateLink).toHaveAttribute("href", "/components/project-update");
  await expect(dateLink.locator("time")).toHaveAttribute("datetime", "2026-11-14");
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({ path: info.outputPath("project-health.png") });

  await page.getByRole("checkbox", { name: "ProjectHealth prop narrow" }).check();
  expect(await health.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  const historicalRating = (await health.getByText("Last reported: At risk").boundingBox())!;
  expect(Math.abs((await dateLink.boundingBox())!.y - historicalRating.y)).toBeLessThan(4);
  await panel.screenshot({ path: info.outputPath("project-health-narrow.png") });
  await chooseSelectOption(scenario, "current");
  await expect(indicator).toHaveText("At risk");
  await expect(health.getByText("Last reported: At risk")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "ProjectHealth prop link" }).uncheck();
  await expect(health.getByRole("link")).toHaveCount(0);
  await expect(health.locator("time")).toHaveText("Nov 14");

  await chooseSelectOption(scenario, "missing");
  await expect(indicator).toHaveText("No update yet");
  await expect(health.locator("time")).toHaveCount(0);
  await chooseSelectOption(scenario, "not expected");
  await expect(indicator).toHaveText("No update expected");
});
