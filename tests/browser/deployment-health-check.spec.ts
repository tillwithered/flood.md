import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("DeploymentHealthCheck distinguishes the rollout decision from the latest HTTP probe", async ({ page }, info) => {
  await page.goto("/components/deployment-health-check");
  const stage = page.locator(".preview-stage");
  const panel = stage.getByRole("region", { name: "Deployment health check" });
  const state = panel.locator(".flood-status-indicator__label");
  const progress = panel.getByRole("progressbar", { name: "Elapsed time" });
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });

  await expect(state).toHaveText("Checking");
  await expect(panel.getByText("503", { exact: false })).toBeVisible();
  await expect(progress).toHaveAttribute("aria-valuenow", "28");
  await expect(progress).toHaveAttribute("aria-valuemax", "60");
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "DeploymentHealthCheck prop narrow" }).check();
    await chooseSelectOption(page.getByRole("combobox", { name: "DeploymentHealthCheck prop surface" }), "overlay");
  }
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("deployment-health-check.png") });

  await chooseSelectOption(scenario, "Passed");
  await expect(state).toHaveText("Passed");
  await expect(panel.getByText("204", { exact: false })).toBeVisible();
  await expect(progress).toHaveCount(0);
  await chooseSelectOption(scenario, "Timeout");
  await expect(state).toHaveText("Failed");
  await expect(panel.getByText("60 s / 60 s")).toBeVisible();
  await expect(panel.getByText("The endpoint did not become ready before the timeout.")).toBeVisible();
  await chooseSelectOption(scenario, "No response");
  await expect(state).toHaveText("Failed");
  await expect(panel.getByText("Connection refused")).toBeVisible();
  await expect(panel.locator(".flood-http-status")).toHaveCount(0);
  await chooseSelectOption(scenario, "Not configured");
  await expect(state).toHaveText("Not configured");
  await expect(panel.locator("dl")).toHaveCount(0);
});
