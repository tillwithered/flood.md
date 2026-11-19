import { expect, test, type Locator } from "@playwright/test";

function markGeometry(row: Locator) {
  return row.locator(".flood-span-row__mark").first().evaluate(node => {
    const mark = node.getBoundingClientRect();
    const plot = node.parentElement!.getBoundingClientRect();
    return { offset: mark.x - plot.x, width: mark.width };
  });
}

test("TraceWaterfall preserves the shared scale when a branch is collapsed", async ({ page }, info) => {
  await page.goto("/components/trace-waterfall");
  const trace = page.locator(".preview-stage .flood-trace-waterfall");
  const branch = trace.getByRole("button", { name: "Collapse Read workspace files", exact: true });
  const root = trace.locator(".flood-span-row").first();
  const axis = trace.locator(".flood-trace-waterfall__ticks");
  const cache = trace.locator(".flood-span-row__name .flood-truncated-text").filter({ hasText: "Cache lookup" });
  await expect(cache).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const initial = await markGeometry(root);
  const ticks = await axis.textContent();
  await branch.press("Enter");
  await expect(cache).toBeHidden();
  const expand = trace.getByRole("button", { name: "Expand Read workspace files", exact: true });
  await expect(expand).toBeFocused();
  expect(await markGeometry(root)).toEqual(initial);
  expect(await axis.textContent()).toBe(ticks);
  await expand.press("Space");
  await expect(cache).toBeVisible();

  await page.getByRole("checkbox", { name: "TraceWaterfall prop storageWindow" }).check();
  await expect(axis).toContainText("564 ms");
  await expect(axis).not.toContainText("770 ms");
  await expect(trace.locator(".flood-span-row__name .flood-truncated-text").filter({ hasText: "Send trace archive" })).toBeVisible();
  expect((await markGeometry(root)).width).toBeGreaterThan(initial.width);
  await trace.screenshot({ path: info.outputPath("trace-window.png") });
});

test("SpanRow clips a mark at the domain and still exposes the measured time", async ({ page }) => {
  await page.goto("/components/span-row");
  const row = page.locator(".preview-stage .flood-span-row");
  const start = row.locator(".flood-span-row__value .flood-visually-hidden");
  const duration = row.locator(".flood-span-row__value .flood-truncated-text");
  await expect(start).toHaveText("Start: 102 ms.");
  await expect(duration).toHaveText("93 ms");
  expect((await markGeometry(row)).offset).toBeGreaterThan(0);
  const clip = page.getByRole("checkbox", { name: "SpanRow prop clipStart" });
  await clip.check();
  expect((await markGeometry(row)).offset).toBeCloseTo(0);
  await expect(start).toHaveText("Start: 102 ms.");
  await expect(duration).toHaveText("93 ms");
  await clip.uncheck();
  await page.getByRole("checkbox", { name: "SpanRow prop instant" }).check();
  expect((await markGeometry(row)).width).toBeGreaterThan(0);
  await expect(start).toHaveText("Start: 102 ms.");
  await expect(duration).toHaveText("0 ms");
});

test("TraceWaterfall zooms a span and restores the original domain without moving the rows", async ({ page }, info) => {
  await page.goto("/components/trace-waterfall");
  const trace = page.locator(".preview-stage .flood-trace-waterfall");
  const axis = trace.locator(".flood-trace-waterfall__ticks");
  const zoom = trace.getByRole("button", { name: "Zoom to Cache lookup", exact: true });
  const reset = trace.getByRole("button", { name: "Reset zoom", exact: true });
  const storage = trace.getByRole("button", { name: "Collapse Read workspace files", exact: true });
  await page.getByRole("checkbox", { name: "TraceWaterfall prop storageWindow" }).check();
  await expect(axis).toContainText("564 ms");
  await expect(reset).toBeDisabled();
  await page.evaluate(() => document.fonts.ready);
  const viewport = trace.locator(".flood-trace-waterfall__viewport");
  const originalHeight = await viewport.evaluate(node => node.scrollHeight);
  await zoom.press("Enter");
  await expect(zoom).toHaveAttribute("aria-pressed", "true");
  await expect(zoom).toBeFocused();
  await expect(axis).toContainText("102 ms");
  await expect(axis).toContainText("195 ms");
  await expect(trace.getByRole("status")).toHaveText("102 ms – 195 ms");
  expect(await viewport.evaluate(node => node.scrollHeight)).toBe(originalHeight);
  await trace.screenshot({ path: info.outputPath("trace-span-zoom.png") });
  await storage.press("Enter");
  await expect(zoom).toBeHidden();
  await expect(axis).toContainText("195 ms");
  await reset.press("Enter");
  await expect(reset).toBeDisabled();
  await expect(reset).toBeFocused();
  await expect(axis).toContainText("564 ms");
  await expect(trace.getByRole("button", { name: "Expand Read workspace files", exact: true })).toBeVisible();
});
