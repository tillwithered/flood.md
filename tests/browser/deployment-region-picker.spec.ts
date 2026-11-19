import { expect, test } from "@playwright/test";

test("region draft selection stays separate from the deployed region", async ({ page }, info) => {
  await page.goto("/components/deployment-region-picker");
  const stage = page.locator(".preview-stage");
  const form = stage.locator("form");
  const current = stage.getByText("Current", { exact: true });
  const europe = stage.getByRole("radio", { name: /^Europe/ });
  const frankfurt = stage.getByRole("radio", { name: /^Frankfurt/ });
  const apply = stage.getByRole("button", { name: "Apply region" });
  const exact = page.getByRole("checkbox", { name: "DeploymentRegionPicker prop exact" });

  await expect(frankfurt).toBeChecked();
  await expect(apply).toBeDisabled();
  await expect(stage.getByRole("radio", { name: /^Singapore/ })).toBeDisabled();
  await frankfurt.press("ArrowLeft");
  await expect(europe).toBeChecked();
  await expect(europe).toBeFocused();
  await expect(current.locator("xpath=ancestor::label")).toContainText("Frankfurt");
  await expect.poll(() => form.evaluate(node => new FormData(node).get("region"))).toBe("europe");

  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "DeploymentRegionPicker prop narrow" }).check();
  }
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("deployment-region-picker.png") });
  await exact.check();
  await expect(europe).toBeDisabled();
  await expect(europe).not.toBeChecked();
  await expect(apply).toBeDisabled();
  await expect(stage.getByText(/Choose a specific location/)).toBeVisible();
  await expect.poll(() => form.evaluate(node => new FormData(node).get("region"))).toBe(null);
  await exact.uncheck();
  await expect(apply).toBeEnabled();
  await apply.click();
  await expect(current.locator("xpath=ancestor::label")).toContainText("Europe");
  await expect(apply).toBeDisabled();
  await page.getByRole("checkbox", { name: "DeploymentRegionPicker prop empty" }).check();
  await expect(stage.getByText("No deployment regions available.")).toBeVisible();
});
