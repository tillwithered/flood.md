import { expect, test } from "@playwright/test";

test("MediaTrimRange keeps the source axis fixed and enforces the retained length", async ({ page }, info) => {
  await page.goto("/components/media-trim-range");
  const stage = page.locator(".preview-stage");
  const start = stage.getByRole("slider", { name: "Start" });
  const end = stage.getByRole("slider", { name: "End" });
  const waveform = stage.locator(".flood-media-trim__waveform");

  await expect(start).toHaveAttribute("aria-valuetext", "0:08.500");
  await expect(stage.getByText("0:23.500", { exact: true })).toBeVisible();
  await start.press("Shift+ArrowRight");
  await expect(start).toHaveAttribute("aria-valuetext", "0:08.501");
  await start.press("End");
  await expect(start).toHaveAttribute("aria-valuetext", "0:31.500");
  await end.press("Home");
  await expect(end).toHaveAttribute("aria-valuetext", "0:32.000");
  await expect(end).toHaveAttribute("aria-valuemin", "32000");
  await expect(stage.getByText("0:00.500", { exact: true })).toBeVisible();
  await start.press("Home");
  await end.press("End");
  await expect(end).toHaveAttribute("aria-valuetext", "0:42.500");

  const bounds = (await waveform.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width * .22, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * .30, bounds.y + bounds.height / 2);
  await page.mouse.up();
  await expect.poll(async () => Number(await start.inputValue())).toBeGreaterThan(12000);
  await expect(end).toHaveAttribute("aria-valuetext", "0:42.500");
  expect(await waveform.boundingBox()).toEqual(bounds);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("media-trim-range.png") });

  await page.getByRole("checkbox", { name: "MediaTrimRange prop waveform" }).uncheck();
  await expect(waveform).toHaveCount(0);
  await page.getByRole("checkbox", { name: "MediaTrimRange prop rtl" }).check();
  await expect(start).toHaveCSS("direction", "ltr");
  await page.getByRole("checkbox", { name: "MediaTrimRange prop disabled" }).check();
  await expect(start).toBeDisabled();
  await expect(end).toBeDisabled();
});
