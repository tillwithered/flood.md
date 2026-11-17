import { expect, test } from "@playwright/test";

test("MediaChapterList shares accepted playback time with the chapter marks and seek bar", async ({ page }, info) => {
  await page.goto("/components/media-chapter-list");
  const stage = page.locator(".preview-stage");
  const list = stage.getByRole("list", { name: "Chapters" });
  const overview = list.getByRole("button", { name: /Read the overview/ });
  const compare = list.getByRole("button", { name: /Compare two periods/ });
  const final = list.getByRole("button", { name: /Investigate the busiest days/ });
  const position = stage.getByRole("slider", { name: "Playback position" });
  const marks = stage.locator(".flood-slider__marker");

  await expect(marks).toHaveCount(2);
  await expect(overview).toHaveAttribute("aria-current", "time");
  await compare.press("Enter");
  await expect(compare).toBeFocused();
  await expect(compare).toHaveAttribute("aria-current", "time");
  await expect(position).toHaveValue("29.5");
  await expect(overview).not.toHaveAttribute("aria-current");
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("media-chapter-list.png") });

  await position.press("ArrowLeft");
  await expect(overview).toHaveAttribute("aria-current", "time");
  await position.press("End");
  await expect(final).toHaveAttribute("aria-current", "time");
  await page.getByRole("checkbox", { name: "MediaChapterList prop thumbnails" }).uncheck();
  await expect(list.locator("img")).toHaveCount(0);
  await expect(final).toHaveAttribute("aria-current", "time");
  await page.getByRole("checkbox", { name: "MediaChapterList prop rtl" }).check();
  await expect(position).toHaveCSS("direction", "ltr");
  await expect(list).toHaveCSS("direction", "rtl");
  await page.getByRole("checkbox", { name: "MediaChapterList prop disabled" }).check();
  await expect(compare).toBeDisabled();
  await expect(position).toBeDisabled();
});
