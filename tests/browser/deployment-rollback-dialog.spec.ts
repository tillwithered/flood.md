import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("DeploymentRollbackDialog confirms the exact target and blocks unavailable builds", async ({ page }, info) => {
  await page.goto("/components/deployment-rollback-dialog");
  const trigger = page.getByRole("button", { name: "Review rollback" });
  const dialog = page.getByRole("alertdialog", { name: "Roll back deployment?" });
  const confirm = dialog.getByRole("button", { name: "Roll back", exact: true });
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  const feedback = page.getByRole("region", { name: "DeploymentRollbackDialog live playground" }).getByRole("status");

  await trigger.click();
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await expect(dialog.getByText("dep-1042")).toBeVisible();
  await expect(dialog.getByText("dep-1038")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await dialog.screenshot({ path: info.outputPath("deployment-rollback-dialog.png") });
  await page.screenshot({ path: info.outputPath("deployment-rollback-scene.png") });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(feedback).toHaveText("");

  await trigger.click();
  await confirm.click();
  await expect(dialog).toBeHidden();
  await expect(feedback).toHaveText("Rollback requested: dep-1042 → dep-1038");

  await chooseSelectOption(scenario, "Expired");
  await trigger.click();
  await expect(confirm).toBeDisabled();
  await expect(dialog).toHaveAccessibleDescription(/past its retention window/);
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();

  await chooseSelectOption(scenario, "Already live");
  await trigger.click();
  await expect(confirm).toBeDisabled();
  await expect(dialog).toHaveAccessibleDescription(/already live/);
});
