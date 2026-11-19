import { expect, test, type Locator } from "@playwright/test";

function positions(items: Locator) {
  return items.evaluateAll(elements => elements.map(element => {
    const {x, y, width} = element.getBoundingClientRect();
    return {x: Math.round(x), y: Math.round(y), width: Math.round(width), fragments: element.getClientRects().length};
  }));
}

test("Masonry preserves source order, image proportions and focus when columns reflow", async ({ page }, info) => {
  await page.setViewportSize({width:1440, height:940});
  await page.goto("/components/masonry");
  const stage = page.locator(".preview-stage");
  const gallery = stage.getByRole("list", {name:"Flood visual library"});
  const items = gallery.getByRole("listitem");
  const links = gallery.getByRole("link");
  await expect(items).toHaveCount(4);
  await expect.poll(() => gallery.locator("img").evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  const ltr = await positions(items);
  expect(new Set(ltr.map(item => item.x)).size).toBe(2);
  expect(ltr.map(item => item.x)).toEqual(ltr.map(item => item.x).sort((left, right) => left - right));
  expect(new Set(ltr.map(item => item.width)).size).toBe(1);
  expect(ltr.every(item => item.fragments === 1)).toBe(true);
  const ratios = await gallery.locator("img").evaluateAll(images => images.map(node => {
    const image = node as HTMLImageElement;
    return Math.abs(image.clientWidth / image.clientHeight - image.naturalWidth / image.naturalHeight);
  }));
  expect(Math.max(...ratios)).toBeLessThan(0.03);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("masonry-wide.png") });

  await links.first().focus();
  for (let index = 1; index < 4; index++) {
    await page.keyboard.press("Tab");
    await expect(links.nth(index)).toBeFocused();
  }
  await page.setViewportSize({width:390, height:844});
  await expect(links.last()).toBeFocused();
  const narrow = await positions(items);
  expect(new Set(narrow.map(item => item.x)).size).toBe(1);
  expect(narrow.map(item => item.y)).toEqual(narrow.map(item => item.y).sort((top, bottom) => top - bottom));
  await expect.poll(() => gallery.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await links.first().scrollIntoViewIfNeeded();
  await stage.screenshot({ path: info.outputPath("masonry-narrow.png") });

  await page.setViewportSize({width:1440, height:940});
  await page.getByRole("checkbox", {name:"Masonry prop rtl"}).check();
  const rtl = await positions(items);
  expect(new Set(rtl.map(item => item.x)).size).toBe(2);
  expect(rtl.map(item => item.x)).toEqual(rtl.map(item => item.x).sort((left, right) => right - left));
});
