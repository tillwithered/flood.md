import { expect, test } from "@playwright/test";

test("UptimeHistory inspection keeps the strip in place", async ({ page }, info) => {
  await page.goto("/components/uptime-history");
  const plot = page.locator(".flood-uptime-history");
  const list = plot.getByRole("list", { name: "Export API" });
  const items = list.getByRole("listitem");
  const tip = plot.locator(".flood-chart__tooltip");
  await expect(items).toHaveCount(30);
  const before = await list.boundingBox();
  await items.nth(8).hover();
  await expect(tip).toContainText("Outage");
  await expect(tip).toContainText("38 minutes");
  expect(await list.boundingBox()).toEqual(before);

  await items.nth(20).hover();
  await expect(tip).toContainText("No data");
  await page.mouse.move(0, 0);
  await expect(tip).toHaveCount(0);

  await list.locator('[tabindex="0"]').press("Home");
  await expect(items.first()).toBeFocused();
  await expect(tip).toContainText("Oct 18");
  await items.first().press("ArrowRight");
  await expect(items.nth(1)).toBeFocused();
  await items.nth(1).press("Escape");
  await expect(tip).toHaveCount(0);
  await expect(items.nth(1)).toBeFocused();

  await page.getByRole("checkbox", { name: "UptimeHistory prop narrow" }).check();
  await page.getByRole("combobox", { name: "UptimeHistory prop window" }).click();
  await page.getByRole("option", { name: "90", exact: true }).click();
  await expect(items).toHaveCount(90);
  await expect.poll(() => list.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await items.nth(80).hover();
  await expect(tip).toContainText("No data");
  await expect.poll(async () => {
    const strip = (await list.boundingBox())!;
    const detail = (await tip.boundingBox())!;
    return Math.max(strip.x - detail.x, detail.x + detail.width - strip.x - strip.width);
  }).toBeLessThanOrEqual(1);
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".preview-stage").screenshot({ path: info.outputPath("uptime-history-inspection.png") });
});

test.describe("touch inspection", () => {
  test.use({ hasTouch: true });
  test("UptimeHistory shows the tapped period until it is tapped again", async ({ page }) => {
    await page.goto("/components/uptime-history");
    const plot = page.locator(".flood-uptime-history");
    const item = plot.getByRole("listitem").nth(8);
    const tip = plot.locator(".flood-chart__tooltip");
    await item.tap();
    await expect(tip).toContainText("Outage");
    await item.tap();
    await expect(tip).toHaveCount(0);
  });
});
