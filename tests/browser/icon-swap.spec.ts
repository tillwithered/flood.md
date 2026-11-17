import { expect, test } from "@playwright/test";

test("IconSwap reverses without moving the control or delaying its state", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/components/icon-swap");
  const stage = page.locator(".preview-stage");
  const button = stage.getByRole("button", { name: "Mute notifications" });
  const glyphs = button.locator(".flood-icon-swap__glyph");
  await expect(glyphs.first()).toHaveCSS("opacity", "1");
  await expect(glyphs.last()).toHaveCSS("opacity", "0");
  const before = await button.boundingBox();
  expect(await glyphs.first().evaluate(node => node.getAnimations().length)).toBe(0);

  const moving = await button.evaluate(async node => {
    node.click();
    await new Promise(requestAnimationFrame);
    const layer = node.querySelector(".flood-icon-swap__glyph:last-child")!;
    return getComputedStyle(layer).transitionDuration !== "0s" && layer.getAnimations().length > 0;
  });
  expect(moving).toBe(true);
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await button.evaluate(node => node.click());
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(glyphs.first()).toHaveCSS("opacity", "1");
  await expect(glyphs.last()).toHaveCSS("opacity", "0");
  expect(await button.boundingBox()).toEqual(before);

  await page.getByRole("checkbox", { name: "IconSwap prop reduceMotion" }).check();
  await button.press("Space");
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(button).toBeFocused();
  await expect(glyphs.last()).toHaveCSS("transition-duration", "0s");
  await expect(glyphs.last()).toHaveCSS("opacity", "1");
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("icon-swap-muted.png") });

  await page.getByRole("checkbox", { name: "IconSwap prop reduceMotion" }).uncheck();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await button.press("Space");
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(glyphs.first()).toHaveCSS("transition-duration", "0s");
  await expect(glyphs.first()).toHaveCSS("opacity", "1");
});
