import { expect, test, type Locator } from "@playwright/test";

async function relativeCenter(image: Locator, point: Locator) {
  const [artwork, target] = await Promise.all([image.boundingBox(), point.boundingBox()]);
  return {
    x: (target!.x + target!.width / 2 - artwork!.x) / artwork!.width,
    y: (target!.y + target!.height / 2 - artwork!.y) / artwork!.height,
  };
}

test("ImageAnnotations keep selected points anchored when artwork resizes or changes direction", async ({ page }, info) => {
  await page.goto("/components/image-annotations");
  const stage = page.locator(".preview-stage");
  const group = stage.getByRole("group", { name: "Chart review" });
  const image = group.getByRole("img");
  const first = group.getByRole("button", { name: "1. Visit count" });
  const peak = group.getByRole("button", { name: "2. Weekend peak" });
  const last = group.getByRole("button", { name: "3. Last tick" });
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await first.focus();
  await page.keyboard.press("Tab");
  await expect(peak).toBeFocused();
  await peak.press("Enter");
  await expect(peak).toHaveAttribute("aria-pressed", "true");
  await expect(peak).toBeFocused();
  await expect(stage.getByRole("article", { name: "Weekend peak" })).toContainText("What ran on Saturday?");
  const wide = await relativeCenter(image, peak);
  expect(wide.x).toBeCloseTo(0.81, 2);
  expect(wide.y).toBeCloseTo(0.39, 2);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("image-annotations-review.png") });

  await page.getByRole("checkbox", { name: "ImageAnnotations prop narrow" }).check();
  await page.getByRole("checkbox", { name: "ImageAnnotations prop rtl" }).check();
  const narrow = await relativeCenter(image, peak);
  expect(narrow.x).toBeCloseTo(wide.x, 2);
  expect(narrow.y).toBeCloseTo(wide.y, 2);
  await expect(peak).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("checkbox", { name: "ImageAnnotations prop edgePoint" }).check();
  const edge = await relativeCenter(image, last);
  expect(edge.x).toBeCloseTo(1, 2);
  expect(edge.y).toBeCloseTo(1, 2);
  await expect.poll(() => group.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await last.click();
  await expect(stage.getByRole("article", { name: "Last tick" })).toContainText("same inset as the first one");
  await stage.screenshot({ path: info.outputPath("image-annotations-edge.png") });
});
