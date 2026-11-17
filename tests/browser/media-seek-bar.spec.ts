import { expect, test } from "@playwright/test";

test("MediaSeekBar seeks across buffer gaps and stays synchronized with transcript cues", async ({ page }, info) => {
  await page.goto("/components/media-seek-bar");
  const stage = page.locator(".preview-stage");
  const slider = stage.getByRole("slider", { name: "Playback position" });
  const rail = stage.locator(".flood-slider__rail");
  const buffered = stage.locator(".flood-slider__segment");
  const cue = stage.getByRole("button", { name: /Open a failing request/ });

  await expect(slider).toHaveAttribute("aria-valuetext", "0:12 / 1:24");
  await expect(buffered).toHaveCount(2);
  const [first, second] = await Promise.all([buffered.first().boundingBox(), buffered.last().boundingBox()]);
  expect(first!.x + first!.width).toBeLessThan(second!.x);

  await slider.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuetext", "0:13 / 1:24");
  await expect(slider).toBeFocused();
  await slider.press("End");
  await expect(slider).toHaveValue("84.5");
  await slider.press("Home");
  await expect(slider).toHaveValue("0");

  await cue.click();
  await expect(slider).toHaveValue("24");
  await expect(cue).toHaveAttribute("aria-current", "time");
  const bounds = await rail.boundingBox();
  await rail.click({ position: { x: bounds!.width * .45, y: 2 } });
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(28);
  await expect.poll(async () => Number(await slider.inputValue())).toBeLessThan(45);
  await slider.press("ArrowRight");
  await expect(stage.getByRole("button", { name: /Copy the request ID/ })).toHaveAttribute("aria-current", "time");

  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("media-seek-bar.png") });
  await page.getByRole("checkbox", { name: "MediaSeekBar prop rtl" }).check();
  await expect(slider).toHaveCSS("direction", "ltr");
  await page.getByRole("checkbox", { name: "MediaSeekBar prop loading" }).check();
  await expect(slider).toBeDisabled();
  await expect(buffered).toHaveCount(0);
});
