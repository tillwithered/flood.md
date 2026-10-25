import { test, expect } from "@playwright/test";

test("Breadcrumb keeps fitting labels whole and wraps items before breaking words", async ({ page }, info) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/components/pagination");
  const breadcrumb = page.getByRole("navigation", { name: "Page breadcrumb" });
  await page.evaluate(() => document.fonts.ready);
  const lineCounts = () => breadcrumb.locator("li > a, li > span:not([aria-hidden])").evaluateAll(nodes => nodes.map(node => {
    const range = document.createRange(); range.selectNodeContents(node);
    return new Set(Array.from(range.getClientRects()).map(rect => Math.round(rect.y))).size;
  }));
  await expect.poll(lineCounts).toEqual([1, 1, 1]);
  for (const zoom of [0.8, 1.1, 1.25, 1.5, 1.75, 2]) {
    await page.evaluate(value => { document.body.style.zoom=String(value); },zoom);
    await expect.poll(lineCounts).toEqual([1,1,1]);
  }
  await page.evaluate(() => { document.body.style.zoom=""; });
  // Exercise the actual primitive with a constrained host, independently of the page shell.
  await breadcrumb.evaluate(node => { node.style.width = "13rem"; node.style.flexShrink = "0"; });
  await expect.poll(lineCounts).toEqual([1, 1, 1]);
  for (const rtl of [false, true]) {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.evaluate(value => { document.documentElement.style.fontSize = "24px"; document.documentElement.dir = value ? "rtl" : "ltr"; }, rtl);
    await breadcrumb.evaluate(node => { node.style.width = "100%"; });
    await expect.poll(lineCounts).toEqual([1, 1, 1]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await breadcrumb.locator('li:last-child > span[aria-current]').evaluate(node => { node.textContent = "LongUnbrokenDestinationName".repeat(8); });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await breadcrumb.locator('li:last-child > span[aria-current]').evaluate(node => { node.textContent = "Pagination"; });
  }
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; document.documentElement.dir = "ltr"; });
  await breadcrumb.evaluate(node => { node.style.width = ""; node.style.flexShrink = ""; });
  await page.locator(".doc-breadcrumb").screenshot({ path: `.artifacts/breadcrumb-fixed-${info.project.name}.png` });
});
