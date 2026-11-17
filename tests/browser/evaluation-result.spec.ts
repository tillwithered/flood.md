import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("EvaluationResult distinguishes a failed assertion from an execution error", async ({ page }, info) => {
  await page.goto("/components/evaluation-result");
  const panel = page.locator(".preview-stage .flood-surface");
  const result = panel.getByRole("region", { name: "Route a refund request" });
  const verdict = result.locator(".flood-section__header .flood-status-indicator");
  const fields = result.locator("dl dd");
  const checks = result.getByRole("list", { name: "Assertion checks" });
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });

  await expect(result.getByText("Failed", { exact: true }).first()).toBeVisible();
  await expect(fields.nth(0)).toHaveText('{"queue": "billing"}');
  await expect(fields.nth(1)).toHaveText('{"queue": "general"}');
  await expect(checks.getByText("Refund requests belong in Billing.")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({ path: info.outputPath("evaluation-result.png") });

  await page.getByRole("checkbox", { name: "EvaluationResult prop narrow" }).check();
  const expected = (await fields.nth(0).boundingBox())!;
  const actual = (await fields.nth(1).boundingBox())!;
  expect(actual.y).toBeGreaterThanOrEqual(expected.y + expected.height);
  expect(await result.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({ path: info.outputPath("evaluation-result-narrow.png") });

  await chooseSelectOption(scenario, "execution error");
  await expect(result.getByText("Execution error", { exact: true })).toBeVisible();
  await expect(result.getByText("The provider timed out.")).toBeVisible();
  await expect(fields.nth(1)).toHaveText("No output");
  await expect(checks).toHaveCount(0);
  await chooseSelectOption(scenario, "passed");
  await expect(fields.nth(1)).toHaveText('{"queue": "billing"}');
  await expect(checks.locator(".flood-status-indicator")).toHaveText(["Passed", "Passed"]);
  await expect(verdict).toHaveText("Passed");
  await chooseSelectOption(scenario, "pending");
  await expect(result.getByText("Pending", { exact: true })).toBeVisible();
  await expect(checks).toHaveCount(0);
});
