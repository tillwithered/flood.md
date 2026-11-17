import { expect, test } from "@playwright/test";

test("ZoomControl scales one viewport and preserves focus and layout at the limits", async ({ page }, info) => {
  await page.goto("/components/zoom-control");
  const stage = page.locator(".preview-stage");
  const view = stage.getByRole("region", { name: "Chart preview" });
  const image = view.getByRole("img", { name: "Weekly line chart" });
  const zoom = stage.getByRole("group", { name: "Image zoom" });
  const percent = zoom.getByRole("status");
  const increase = zoom.getByRole("button", { name: "Zoom in" });
  const decrease = zoom.getByRole("button", { name: "Zoom out" });
  const overflow = () => view.evaluate(node => node.scrollWidth - node.clientWidth);

  await expect(image).toBeVisible();
  await expect(percent).toHaveText("100%");
  await expect.poll(overflow).toBeLessThanOrEqual(1);
  await page.evaluate(() => document.fonts.ready);
  const initialControls = (await zoom.boundingBox())!;
  await stage.screenshot({ path: info.outputPath("zoom-control.png") });
  await increase.press("Enter");
  await expect(percent).toHaveText("150%");
  await expect.poll(overflow).toBeGreaterThan(0);
  await increase.press("Enter");
  await expect(percent).toHaveText("200%");
  await expect(increase).toHaveAttribute("aria-disabled", "true");
  await expect(increase).toBeFocused();
  await increase.press("Enter");
  await expect(percent).toHaveText("200%");
  expect((await zoom.boundingBox())!.width).toBeCloseTo(initialControls.width, 0);

  await page.getByRole("checkbox", { name: /^Narrow width$|^ZoomControl prop narrow$/ }).check();
  await expect(percent).toHaveText("200%");
  await expect.poll(overflow).toBeGreaterThan(0);
  await stage.screenshot({ path: info.outputPath("zoom-control-narrow.png") });
  await zoom.getByRole("button", { name: "Fit" }).click();
  await expect(percent).toHaveText("100%");
  await expect.poll(overflow).toBeLessThanOrEqual(1);
  await decrease.press("Enter");
  await decrease.press("Enter");
  await expect(percent).toHaveText("50%");
  await expect(decrease).toHaveAttribute("aria-disabled", "true");
  await expect(decrease).toBeFocused();
  await page.getByRole("checkbox", { name: /^Show fit$|^ZoomControl prop showFit$/ }).uncheck();
  await expect(zoom.getByRole("button", { name: "Fit" })).toHaveCount(0);
});
