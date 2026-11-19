import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("ColorFilter applies a valid draft without changing the text query", async ({ page }, info) => {
  await page.goto("/components/color-filter");
  const stage = page.locator(".preview-stage");
  const search = stage.getByRole("searchbox", { name: "Search images" });
  const opener = stage.getByRole("button", { name: /^Color/ });
  const disclosure = page.getByRole("dialog", { name: "Color", exact: true });
  const hex = disclosure.getByRole("textbox");

  if (info.project.name === "mobile") {
    await chooseSelectOption(page.getByRole("combobox", { name: "ColorFilter prop surface" }), "overlay");
    await page.getByRole("checkbox", { name: "ColorFilter prop narrow" }).check();
  }
  await search.fill("ceramics");
  await opener.click();
  await expect(hex).toBeFocused();
  await disclosure.getByRole("button", { name: "#758969" }).click();
  await expect(opener).toHaveAccessibleName("Color");
  await expect(hex).toHaveValue("#758969");
  await disclosure.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(opener).toHaveAccessibleName("Color #758969");
  await expect(opener).toBeFocused();
  await expect(search).toHaveValue("ceramics");
  await opener.blur();
  await expect.poll(async () => {
    const bounds = await Promise.all([search.boundingBox(), opener.boundingBox()]);
    const centers = bounds.map(box => box!.y + box!.height / 2);
    return Math.abs(centers[0] - centers[1]);
  }).toBeLessThanOrEqual(1);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("color-filter.png"), animations: "disabled" });

  await opener.click();
  await page.screenshot({ path: info.outputPath("color-filter-open.png"), animations: "disabled" });
  await hex.fill("#12");
  await hex.press("Enter");
  await expect(disclosure.getByRole("alert")).toBeVisible();
  await expect(opener).toHaveAccessibleName("Color #758969");
  await hex.press("Escape");
  await opener.click();
  await expect(hex).toHaveValue("#758969");
  await hex.fill("#fff");
  await search.click();
  await expect(disclosure).toBeHidden();
  await expect(search).toBeFocused();
  await expect(opener).toHaveAccessibleName("Color #758969");
  await opener.click();
  await hex.fill("#abc");
  await hex.press("Enter");
  await expect(opener).toHaveAccessibleName("Color #aabbcc");

  await opener.click();
  await disclosure.getByRole("button", { name: "Clear color" }).click();
  await expect(opener).toHaveAccessibleName("Color");
  await expect(search).toHaveValue("ceramics");
});
