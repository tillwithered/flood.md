import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("PublicationPreview separates the article link and the controlled subscription", async ({ page }, info) => {
  await page.goto("/components/publication-preview");
  const preview = page.locator(".preview-stage .flood-publication-preview");
  const link = preview.getByRole("link", { name: "What's new in charts" });
  const subscribe = preview.getByRole("button", { name: "Subscribe to Flood release notes", exact:true });
  const unsubscribe = preview.getByRole("button", { name: "Unsubscribe from Flood release notes", exact:true });
  await expect(link).toHaveAttribute("href", "/docs/charts");
  await expect(link).toHaveAccessibleDescription("Flood release notes");
  await expect(link.getByRole("button")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await preview.screenshot({ path: info.outputPath("publication-preview.png") });

  const before = await subscribe.boundingBox();
  await subscribe.press("Enter");
  await expect(unsubscribe).toBeFocused();
  await expect(page).toHaveURL(/\/components\/publication-preview$/);
  expect(await unsubscribe.boundingBox()).toEqual(before);

  await page.getByRole("checkbox", { name:"PublicationPreview prop narrow" }).check();
  await chooseSelectOption(page.getByRole("combobox", { name:"PublicationPreview prop surface" }), "overlay");
  await expect.poll(() => preview.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await preview.screenshot({ path: info.outputPath("publication-preview-narrow.png") });

  const scenario = page.getByRole("combobox", { name:"Scenario", exact:true });
  await chooseSelectOption(scenario, "Pending");
  await expect(unsubscribe).toHaveAttribute("aria-disabled", "true");
  await unsubscribe.press("Enter");
  await expect(unsubscribe).toBeVisible();
  await chooseSelectOption(scenario, "Available");
  await unsubscribe.press("Enter");
  await expect(subscribe).toBeFocused();
  await chooseSelectOption(scenario, "Link only");
  await expect(preview.getByRole("button")).toHaveCount(0);
  await link.press("Enter");
  await expect(page).toHaveURL(/\/docs\/charts$/);
});
