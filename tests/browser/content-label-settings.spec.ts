import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("ContentLabelSettings keeps accepted choices and explains policy-fixed rows", async ({ page }, info) => {
  await page.goto("/components/content-label-settings");
  const stage = page.locator(".preview-stage");
  const provider = stage.getByRole("region", { name: "Community Moderation" });
  const spoilers = provider.getByRole("combobox", { name: "Spoilers" });
  const automated = provider.getByRole("combobox", { name: "Automated posts" });
  const accept = page.getByRole("checkbox", { name: "ContentLabelSettings prop accept" });
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "ContentLabelSettings prop narrow" }).check();
    await chooseSelectOption(page.getByRole("combobox", { name: "ContentLabelSettings prop surface" }), "overlay");
  }
  await expect(spoilers).toHaveAccessibleDescription("Reveals a story or result.");
  await expect(spoilers).toContainText("Warn");
  await expect(automated).toContainText("Show");
  await expect(provider.getByText("Set by your workspace.")).toBeVisible();
  const locked = provider.locator(".flood-setting-row").filter({ hasText: "Graphic imagery" });
  const fixedValue = locked.getByText("Hide", { exact: true });
  await expect(fixedValue).toBeVisible();
  await expect(provider.getByRole("combobox", { name: "Graphic imagery" })).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  const selectBox = (await spoilers.boundingBox())!;
  expect((await fixedValue.boundingBox())!.x).toBeCloseTo(selectBox.x, 0);
  if (info.project.name === "desktop") expect(selectBox.width).toBeLessThanOrEqual(192);
  await stage.screenshot({ path: info.outputPath("content-label-settings.png"), animations: "disabled" });

  await chooseSelectOption(spoilers, "hide");
  await expect(spoilers).toContainText("Hide");
  await expect(automated).toContainText("Show");
  await accept.uncheck();
  await spoilers.click();
  await page.getByRole("option", { name: "Show", exact: true }).click();
  await expect(spoilers).toHaveAttribute("aria-expanded", "false");
  await expect(spoilers).toBeFocused();
  await expect(spoilers).toContainText("Hide");
  await accept.check();
  await chooseSelectOption(automated, "warn");
  await expect(automated).toContainText("Warn");
  await expect(spoilers).toContainText("Hide");

  await page.getByRole("checkbox", { name: "ContentLabelSettings prop empty" }).check();
  await expect(provider.getByText("No content labels.")).toBeVisible();
  await expect(provider.getByRole("combobox")).toHaveCount(0);
});
