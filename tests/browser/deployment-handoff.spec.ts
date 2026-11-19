import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("DeploymentHandoff preserves the release pair and reports which build is serving", async ({ page }, info) => {
  await page.goto("/components/deployment-handoff");
  const stage = page.locator(".preview-stage");
  const list = stage.getByRole("list", { name: "Production release pair" });
  const previous = list.getByRole("listitem").filter({ hasText: "Stabilize preview exports" });
  const replacement = list.getByRole("listitem").filter({ hasText: "Restrict export link access" });
  const scenario = page.getByRole("region", { name: "Preview properties" })
    .getByRole("combobox", { name: "Scenario", exact: true });
  const surface = page.getByRole("combobox", { name: "DeploymentHandoff prop surface" });
  await chooseSelectOption(surface, "canvas");
  await expect(replacement.getByText("Serving", { exact: true })).toBeVisible();
  await chooseSelectOption(surface, info.project.name === "mobile" ? "overlay" : "raised");
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "DeploymentHandoff prop narrow" }).check();
  }
  await expect(previous.getByText("Draining", { exact: true })).toBeVisible();
  await expect(previous.locator("time")).toHaveAttribute("datetime", "2026-11-16T14:32:00Z");
  await expect(replacement.locator("time")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  const panel = (await stage.locator(".flood-surface").boundingBox())!;
  const canvas = (await stage.boundingBox())!;
  expect(panel.y).toBeGreaterThan(canvas.y);
  expect(panel.y + panel.height).toBeLessThan(canvas.y + canvas.height);
  await expect.poll(() => list.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.screenshot({ path: info.outputPath("deployment-handoff.png"), animations: "disabled" });

  for (const [state, previousStatus, replacementStatus] of [
    ["Preparing", "Serving", "Preparing"],
    ["Overlapping", "Overlapping", "Serving"],
    ["Completed", "Stopped", "Serving"],
    ["Failed", "Serving", "Failed"],
  ]) {
    await chooseSelectOption(scenario, state);
    await expect(previous.getByText(previousStatus, { exact: true })).toBeVisible();
    await expect(replacement.getByText(replacementStatus, { exact: true })).toBeVisible();
    await expect(list.locator("time")).toHaveCount(0);
    await expect(list.getByRole("listitem").first()).toContainText("Stabilize preview exports");
  }
  await expect(replacement.getByText("The readiness endpoint timed out.")).toBeVisible();
});
