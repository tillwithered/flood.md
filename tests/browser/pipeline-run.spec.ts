import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("PipelineRun distinguishes failed and skipped work and keeps diagnostics reachable", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/pipeline-run");
  const run = page.locator(".preview-stage .flood-pipeline-run");
  const stages = run.getByRole("list", { name: "Production deployment stages" });
  const migration = stages.getByRole("listitem").filter({ hasText: "Apply migrations" });
  const deploy = stages.getByRole("listitem").filter({ hasText: "Deploy service" });
  const logs = migration.getByRole("button", { name: "Migration logs" });
  const logContent = migration.getByText("Column project_id is missing from release_events.", { exact: false });
  await expect(migration.getByText("Failed", { exact: true })).toBeVisible();
  await expect(deploy.getByText("Skipped", { exact: true })).toBeVisible();
  await expect(migration.getByText("The release database is missing a required column.")).toBeVisible();
  await expect(logContent).toBeHidden();
  await logs.press("Enter");
  await expect(logs).toHaveAttribute("aria-expanded", "true");
  await expect(logContent).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".preview-stage").screenshot({ path: info.outputPath("pipeline-run-context.png") });

  await page.getByRole("checkbox", { name: "PipelineRun prop narrow" }).check();
  await expect(logContent).toBeVisible();
  await expect.poll(() => run.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await run.screenshot({ path: info.outputPath("pipeline-run-narrow.png") });
  await logs.press("Space");
  await expect(logs).toBeFocused();
  await expect(logContent).toBeHidden();

  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  await chooseSelectOption(scenario, "Running");
  await expect(migration.getByText("Running", { exact: true })).toBeVisible();
  await expect(deploy.getByText("Queued", { exact: true })).toBeVisible();
  await expect(logs).toHaveCount(0);
  await chooseSelectOption(scenario, "Succeeded");
  await expect(deploy.getByText("Succeeded", { exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: "PipelineRun prop empty" }).check();
  await expect(stages).toHaveCount(0);
  await expect(run.getByText("No stages to show.")).toBeVisible();
});
