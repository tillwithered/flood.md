import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("FilteredImage preserves the frame while blurred and removes a hidden source", async ({page}, info) => {
  await page.goto("/components/filtered-image");
  const stage = page.locator(".preview-stage");
  const visibility = page.getByRole("combobox", {name:"FilteredImage prop visibility"});
  const image = stage.getByRole("img", {name:"Flagged image blurred"});
  await expect(image).toBeVisible();
  await expect(image.locator("img")).toHaveCSS("filter", /^blur\(/);
  await expect(stage.getByRole("img", {name:"Line chart showing two series"})).toHaveCount(0);
  await expect(stage.getByRole("img", {name:"Area chart showing two series"})).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await stage.locator(".flood-grid").screenshot({path:info.outputPath("filtered-image.png")});
  const before = await image.boundingBox();
  await chooseSelectOption(visibility,"show");
  const visibleImage = stage.getByRole("img", {name:"Line chart showing two series"});
  await expect(visibleImage).toBeVisible();
  const after = await visibleImage.boundingBox();
  expect(after!.width).toBeCloseTo(before!.width);
  expect(after!.height).toBeCloseTo(before!.height);

  await chooseSelectOption(visibility,"hide");
  await expect(stage.locator('img[src="/comparison-line.png"]')).toHaveCount(0);
  await expect(stage.getByRole("img", {name:"Area chart showing two series"})).toBeVisible();
});
