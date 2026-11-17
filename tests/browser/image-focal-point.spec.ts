import { expect, test } from "@playwright/test";

test.use({ hasTouch: true });

test("ImageFocalPoint keeps the cover previews in sync with spatial and keyboard input", async ({ page }, info) => {
  await page.goto("/components/image-focal-point");
  const stage = page.locator(".preview-stage");
  const editor = stage.getByRole("group", { name: "Preview focal point" });
  const image = editor.getByRole("img", { name: "Weekly visits chart" });
  const horizontal = editor.getByRole("slider", { name: "Horizontal" });
  const vertical = editor.getByRole("slider", { name: "Vertical" });
  const crops = stage.locator('img[data-fit="cover"]');

  await expect(horizontal).toHaveAttribute("aria-valuetext", "74%");
  await expect(crops.first()).toHaveCSS("object-position", "74% 40%");
  const bounds = await image.boundingBox();
  expect(bounds).not.toBeNull();
  const position = { x: bounds!.width * .4, y: bounds!.height * .6 };
  if (info.project.name === "mobile") await image.tap({ position });
  else await image.click({ position });
  await expect(horizontal).toHaveAttribute("aria-valuetext", "40%");
  await expect(vertical).toHaveAttribute("aria-valuetext", "60%");
  await expect(crops.nth(1)).toHaveCSS("object-position", "40% 60%");
  await horizontal.press("ArrowRight");
  await expect(horizontal).toBeFocused();
  await expect(crops.first()).toHaveCSS("object-position", "41% 60%");

  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "ImageFocalPoint prop narrow" }).check();
    await expect.poll(() => editor.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  }
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("image-focal-point.png") });

  await page.getByRole("checkbox", { name: "ImageFocalPoint prop disabled" }).check();
  await expect(horizontal).toBeDisabled();
  await image.click();
  await expect(crops.first()).toHaveCSS("object-position", "41% 60%");
});
