import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("LineChart exposes gaps and exact values by keyboard and pointer", async ({ page }) => {
  await page.goto("/components/line-chart");
  const plot = page.getByRole("slider", { name: "Daily visits", exact: true });
  await expect(page.locator(".flood-line-chart__readout")).toHaveCount(0);
  await expect(plot).toHaveAttribute("aria-valuetext", /Sun, This week: 87, Last week: 58/);
  await expect(plot.locator(".flood-line-chart__area")).toHaveCount(1);
  await plot.focus();
  await plot.press("Home");
  await expect(plot).toHaveAttribute("aria-valuetext", /Mon, This week: 38/);
  await plot.press("ArrowRight");
  await expect(plot).toHaveAttribute("aria-valuetext", /Tue, This week: 55/);
  await expect(plot.locator(".flood-line-chart__tooltip")).toContainText("55");
  await expect(plot.locator(".flood-line-chart__tooltip")).toContainText("Last week");
  const bounds = await plot.boundingBox();
  const tooltip = await plot.locator(".flood-line-chart__tooltip").boundingBox();
  expect(tooltip!.x).toBeGreaterThanOrEqual(bounds!.x - 1);
  expect(tooltip!.x + tooltip!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width + 1);
  await plot.hover({ position: { x: 1, y: 30 } });
  await expect(plot).toHaveAttribute("aria-valuetext", /Mon, This week: 38/);
  const guide = plot.locator(".flood-line-chart__cursor");
  const start = (await guide.boundingBox())!.x;
  await plot.hover({ position: { x: 8, y: 30 } });
  expect((await guide.boundingBox())!.x - start).toBeGreaterThan(5);
  await expect(plot).toHaveAttribute("aria-valuetext", /Mon, This week: 38/);
  const plotBox = (await plot.boundingBox())!;
  const tip = plot.locator(".flood-line-chart__tooltip");
  await expect(tip).not.toContainText("Mon");
  const initialTipY = (await tip.boundingBox())!.y;
  await plot.hover({ position: { x: Math.floor(plotBox.width / 2) - 2, y: 30 } });
  const beforeCenter = (await tip.boundingBox())!.x;
  await plot.hover({ position: { x: Math.floor(plotBox.width / 2) + 2, y: 30 } });
  expect(Math.abs((await tip.boundingBox())!.x - beforeCenter)).toBeLessThan(6);
  expect(Math.abs((await tip.boundingBox())!.y - initialTipY)).toBeGreaterThan(12);
  await plot.hover({ position: { x: Math.floor(plotBox.width) - 2, y: 30 } });
  const edgeTip = (await tip.boundingBox())!;
  expect(edgeTip.x + edgeTip.width).toBeLessThanOrEqual(plotBox.x + plotBox.width + 1);
  expect(edgeTip.y).toBeGreaterThanOrEqual(plotBox.y);
  expect(edgeTip.y + edgeTip.height).toBeLessThanOrEqual(plotBox.y + plotBox.height + 1);
  const edgeMarker = (await plot.locator(".flood-line-chart__marker").first().boundingBox())!;
  expect(edgeTip.y + edgeTip.height < edgeMarker.y || edgeTip.y > edgeMarker.y + edgeMarker.height).toBe(true);
  await chooseSelectOption(page.getByRole("combobox", { name: "LineChart prop data", exact: true }), "gap");
  const mainLine = plot.locator('g[data-series="0"] .flood-line-chart__stroke');
  await expect(mainLine).toHaveAttribute("d", /^M[^M]+M[^M]+$/);
  await plot.focus();
  await plot.press("Home");
  for (let i = 0; i < 3; i++) await plot.press("ArrowRight");
  await expect(plot).toHaveAttribute("aria-valuetext", /Thu, This week: No value, Last week: 52/);
  await expect(plot.locator(".flood-line-chart__marker").first()).toHaveCSS("opacity", "0");
  await expect(plot.locator(".flood-line-chart__highlight path").first()).toHaveAttribute("d", (await mainLine.getAttribute("d"))!);
  await chooseSelectOption(page.getByRole("combobox", { name: "LineChart prop data", exact: true }), "month");
  await expect(plot).toHaveAttribute("aria-valuemax", "30");
  await plot.focus();
  await plot.press("End");
  await expect(plot).toHaveAttribute("aria-valuetext", /Jun 30, This month: 101, Last month: 83/);
  await chooseSelectOption(page.getByRole("combobox", { name: "LineChart prop data", exact: true }), "single");
  await expect(page.getByRole("img", { name: /Mon, This week: 38/ })).toBeVisible();
  await chooseSelectOption(page.getByRole("combobox", { name: "LineChart prop data", exact: true }), "empty");
  await expect(page.getByRole("group", { name: "Daily visits", exact: true })).toHaveText("No data");
});

test("LineChart keeps the inspection position while fading out", async ({ page }) => {
  await page.goto("/components/line-chart");
  const plot = page.getByRole("slider", { name: "Daily visits", exact: true });
  const bounds = (await plot.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width * .27, bounds.y + 30);
  await expect(plot).toHaveAttribute("aria-valuetext", /Wed, This week: 48/);
  const guide = plot.locator(".flood-line-chart__cursor");
  const tooltip = plot.locator(".flood-line-chart__tooltip");
  const before = await Promise.all([guide.boundingBox(), tooltip.boundingBox()]);
  await page.mouse.move(bounds.x + bounds.width * .27, bounds.y - 2);
  await expect(plot).not.toHaveAttribute("data-inspecting");
  expect(await Promise.all([guide.boundingBox(), tooltip.boundingBox()])).toEqual(before);
  await expect(tooltip).toContainText("48");
  await expect(tooltip).toBeHidden();
});

test("BarChart compares groups, preserves missing slots, and shares a signed zero", async ({ page }) => {
  await page.goto("/components/bar-chart");
  const plot = page.getByRole("slider", { name: "Hours by team", exact: true });
  await expect(page.locator(".flood-line-chart__readout")).toHaveCount(0);
  const groups = plot.locator(".flood-bar-chart__group");
  await groups.nth(2).hover();
  await expect(plot).toHaveAttribute("aria-valuetext", "Growth, Actual: 46, Plan: 40");
  await expect(plot.locator(".flood-bar-chart__tooltip")).toContainText("Plan");
  await plot.focus();
  await plot.press("End");
  await expect(plot).toHaveAttribute("aria-valuetext", "Platform, Actual: 54, Plan: 48");
  const data = page.getByRole("combobox", { name: "BarChart prop data", exact: true });
  await chooseSelectOption(data, "missing");
  const missing = groups.nth(2).locator('[data-series="0"]');
  await expect(missing).toHaveCount(1);
  await expect(missing.locator(".flood-bar-chart__bar")).toHaveCount(0);
  await groups.nth(2).hover();
  await expect(plot).toHaveAttribute("aria-valuetext", "Growth, Actual: No value, Plan: 40");
  await chooseSelectOption(data, "signed");
  const signed = page.getByRole("slider", { name: "Budget change by team", exact: true });
  const negative = signed.locator(".flood-bar-chart__bar[data-negative]").first();
  const positive = signed.locator(".flood-bar-chart__bar").first();
  await expect(signed.locator(".flood-bar-chart__bar[data-zero]")).toBeVisible();
  const a = (await positive.boundingBox())!;
  const b = (await negative.boundingBox())!;
  expect(Math.abs(a.y + a.height - b.y)).toBeLessThan(1);
  await chooseSelectOption(data, "empty");
  await expect(page.getByRole("group", { name: "Hours by team", exact: true })).toHaveText("No data");
});

test("BarChart stacks additive series and keeps signed totals on their own side of zero", async ({ page }) => {
  await page.goto("/components/bar-chart");
  await chooseSelectOption(page.getByRole("combobox", { name: "BarChart prop layout", exact: true }), "stacked");
  const plot = page.getByRole("slider", { name: "Requests by channel", exact: true });
  const first = plot.locator(".flood-bar-chart__group").first().locator(".flood-bar-chart__bar");
  const lower = (await first.nth(0).boundingBox())!;
  const upper = (await first.nth(1).boundingBox())!;
  expect(upper.x).toBe(lower.x);
  expect(upper.y + upper.height).toBeCloseTo(lower.y, 0);
  await plot.press("Home");
  await expect(plot).toHaveAttribute("aria-valuetext", "Week 1, Web: 38, Email: 32");
  await chooseSelectOption(page.getByRole("combobox", { name: "BarChart prop data", exact: true }), "signed");
  const negatives = page.getByRole("slider", { name: "Change in requests by channel" }).locator(".flood-bar-chart__bar[data-negative]");
  await expect(negatives).toHaveCount(2);
  const near = (await negatives.nth(0).boundingBox())!;
  const far = (await negatives.nth(1).boundingBox())!;
  expect(near.y + near.height).toBeCloseTo(far.y, 0);
});

test("BarChart percent mode normalizes each group and keeps raw values in the readout", async ({ page }) => {
  await page.goto("/components/bar-chart");
  await chooseSelectOption(page.getByRole("combobox", { name: "BarChart prop layout", exact: true }), "percent");
  const plot = page.getByRole("slider", { name: "Request share by channel", exact: true });
  await plot.press("Home");
  await expect(plot).toHaveAttribute("aria-valuetext", "Week 1, Web: 38% · 380, Email: 32% · 320, Chat: 30% · 300");
  const groups = plot.locator(".flood-bar-chart__group");
  const top = async (index: number) => (await groups.nth(index).locator(".flood-bar-chart__bar").last().boundingBox())!.y;
  expect(await top(0)).toBeCloseTo(await top(1), 0);
  const data = page.getByRole("combobox", { name: "BarChart prop data", exact: true });
  await chooseSelectOption(data, "zero");
  await groups.nth(2).hover();
  await expect(groups.nth(2).locator(".flood-bar-chart__bar")).toHaveCount(0);
  await expect(plot).toHaveAttribute("aria-valuetext", "Week 3, Web: 0, Email: 0, Chat: 0");
  await chooseSelectOption(data, "missing");
  await groups.nth(2).hover();
  await expect(plot).toHaveAttribute("aria-valuetext", "Week 3, Web: No value, Email: 28.6% · 40, Chat: 71.4% · 100");
});

test("DonutChart keeps the total, inspected share, and zero state distinct", async ({ page }) => {
  await page.goto("/components/donut-chart");
  const ring = page.getByRole("slider", { name: "Traffic sources", exact: true });
  const readout = ring.locator(".flood-donut-chart__readout");
  await expect(readout).toContainText("13,000");
  await expect(page.locator(".flood-line-chart__readout")).toHaveCount(0);
  await ring.focus();
  await ring.press("End");
  await expect(ring).toHaveAttribute("aria-valuetext", "Social, 900, 6.9%");
  await expect(readout).toContainText("6.9%");
  await ring.press("Escape");
  await expect(readout).toContainText("13,000");
  const data = page.getByRole("combobox", { name: "DonutChart prop data", exact: true });
  await chooseSelectOption(data, "zero");
  await expect(ring.locator(".flood-donut-chart__segment")).toHaveCount(0);
  await expect(readout).toContainText("0");
  await ring.press("Home");
  await expect(ring).toHaveAttribute("aria-valuetext", "Direct, 0");
  await chooseSelectOption(data, "single");
  await expect(page.getByRole("img", { name: /Direct, 6,420, 100%/ })).toBeVisible();
  await chooseSelectOption(data, "empty");
  await expect(page.getByRole("img", { name: "Traffic sources. No data" })).toBeVisible();
});

test("DonutChart follows the pointer across segment gaps and the wider hit area", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/components/donut-chart");
  const ring = page.getByRole("slider", { name: "Traffic sources", exact: true });
  const readout = ring.locator(".flood-donut-chart__readout");
  const segments = ring.locator(".flood-donut-chart__segment");
  const first = segments.nth(0);
  const second = segments.nth(1);
  const active = ring.locator(".flood-donut-chart__segment[data-active]");
  const firstIdle = await first.evaluate(node => {
    const style = getComputedStyle(node);
    return { fill: style.fill, stroke: style.stroke };
  });
  await expect(active).toHaveCount(0);
  const bounds = (await ring.locator("svg").boundingBox())!;
  const move = (turn: number, radius: number) => {
    const angle = (turn - .25) * 2 * Math.PI;
    return page.mouse.move(
      bounds.x + bounds.width * (.5 + radius * Math.cos(angle)),
      bounds.y + bounds.height * (.5 + radius * Math.sin(angle)),
    );
  };
  const boundary = 6420 / 13000;
  await move(boundary - .015, .34);
  await expect(readout).toContainText("6,420");
  await expect(active).toHaveAttribute("data-slice", "0");
  await expect(first).toHaveCSS("fill", firstIdle.fill);
  await expect(second).toHaveCSS("opacity", "1");
  await move(boundary - .003, .42);
  await expect(readout).toContainText("6,420");
  await move(boundary + .003, .42);
  await expect(readout).toContainText("3,720");
  await expect(active).toHaveAttribute("data-slice", "1");
  await expect(first).toHaveCSS("stroke", firstIdle.stroke);
  await expect(first).toHaveCSS("opacity", "1");
  await move(0, 0);
  await expect(readout).toContainText("13,000");
  await expect(active).toHaveCount(0);
});

test("Heatmap moves across both axes and keeps missing observations separate from zero", async ({ page }) => {
  await page.goto("/components/heatmap");
  const table = page.getByRole("table", { name: "Requests by hour" });
  const readout = page.locator(".flood-heatmap__tooltip");
  const first = table.getByRole("cell", { name: "4", exact: true }).first();
  await first.focus();
  await first.press("ArrowDown");
  await expect(readout).toHaveText(/Tue · 08:007/);
  await page.keyboard.press("ArrowRight");
  await expect(readout).toHaveText(/Tue · 10:0017/);
  await page.keyboard.press("Control+End");
  await expect(readout).toHaveText(/Sun · 18:000/);
  const tip = (await readout.boundingBox())!;
  const bounds = (await table.boundingBox())!;
  expect(tip.x + tip.width).toBeLessThanOrEqual(bounds.x + bounds.width);
  expect(tip.y + tip.height).toBeLessThanOrEqual(bounds.y + bounds.height);
  await chooseSelectOption(page.getByRole("combobox", { name: "Heatmap prop data" }), "gaps");
  const gap = table.getByRole("row").filter({ hasText: "Wed" }).getByRole("cell", { name: "No data", exact: true }).first();
  await gap.hover();
  await expect(readout).toContainText("Wed · 14:00");
  await expect(readout).toContainText("No data");
});

test("Heatmap inspects cells continuously through horizontal and vertical gutters", async ({ page }) => {
  await page.goto("/components/heatmap");
  const table = page.getByRole("table", { name: "Requests by hour" });
  const readout = page.locator(".flood-heatmap__tooltip");
  const cell = table.getByRole("cell", { name: "4", exact: true }).first();
  const bounds = (await cell.boundingBox())!;
  const tableBounds = await table.boundingBox();
  await expect(readout).toHaveCount(0);
  const right = bounds.x + bounds.width;
  const middleY = bounds.y + bounds.height / 2;
  const bottom = bounds.y + bounds.height;
  await page.mouse.move(right - 1, middleY);
  await expect(readout).toHaveText(/Mon · 08:004/);
  await page.mouse.move(right + 1, middleY);
  await expect(readout).toHaveText(/Mon · 10:0013/);
  await page.mouse.move(right + 1, bottom - 1);
  await expect(readout).toHaveText(/Mon · 10:0013/);
  await page.mouse.move(right + 1, bottom + 1);
  await expect(readout).toHaveText(/Tue · 10:0017/);
  expect(await table.boundingBox()).toEqual(tableBounds);
});

test("ScatterChart exposes both measures while inspecting an observation", async ({ page }) => {
  await page.goto("/components/scatter-chart");
  const plot = page.getByRole("slider", { name: "Response time by traffic" });
  await plot.press("End");
  await expect(plot).toHaveAttribute("aria-valuetext", /Run 14.*104.*301/);
  await expect(plot.locator(".flood-scatter-chart__tooltip")).toBeVisible();
  await plot.press("Escape");
  await expect(plot.locator(".flood-scatter-chart__tooltip")).toHaveCount(0);
  const point = (await plot.locator(".flood-scatter-chart__point").first().boundingBox())!;
  await page.mouse.move(point.x + point.width / 2, point.y + point.height / 2);
  await expect(plot).toHaveAttribute("aria-valuetext", /Run 1.*12.*110/);
});

test("RangeChart reads exact bounds, optional median and missing data", async ({ page }) => {
  await page.goto("/components/range-chart");
  const plot = page.getByRole("slider", { name: "Daily response time in milliseconds" });
  await plot.press("Home");
  await expect(plot).toHaveAttribute("aria-valuetext", /Mon.*162.*119.*84/);
  await page.getByRole("checkbox", { name: "RangeChart prop midpoint" }).uncheck();
  await plot.press("Home");
  await expect(plot).toHaveAttribute("aria-valuetext", /Mon.*162.*84/);
  await expect(plot).not.toHaveAttribute("aria-valuetext", /119/);
  await chooseSelectOption(page.getByRole("combobox", { name: "RangeChart prop data" }), "gap");
  await plot.locator(".flood-range-chart__column").nth(2).hover();
  await expect(plot).toHaveAttribute("aria-valuetext", /Wed.*No data/);
});

test("DumbbellChart preserves endpoint identity across reversals, ties and missing values", async ({ page }) => {
  await page.goto("/components/dumbbell-chart");
  const plot = page.getByRole("slider", { name: "Response time before and after" });
  const rows = plot.locator(".flood-dumbbell-chart__row");
  await plot.press("Home");
  await expect(plot).toHaveAttribute("aria-valuetext", "API, Before: 242 ms, After: 164 ms");
  await rows.nth(2).hover();
  await expect(plot).toHaveAttribute("aria-valuetext", "Billing, Before: 153 ms, After: 190 ms");
  await plot.press("ArrowDown");
  await expect(plot).toHaveAttribute("aria-valuetext", "Auth, Before: 112 ms, After: 112 ms");
  const points = await rows.nth(3).locator(".flood-dumbbell-chart__point").evaluateAll(nodes =>
    nodes.map(node => node.getBoundingClientRect().left + node.getBoundingClientRect().width / 2));
  expect(points[0]).toBeCloseTo(points[1]);
  await chooseSelectOption(page.getByRole("combobox", { name: "DumbbellChart prop data" }), "missing");
  await rows.nth(2).hover();
  await expect(plot).toHaveAttribute("aria-valuetext", "Billing, Before: 153 ms, After: No data");
  await expect(rows.nth(2).locator(".flood-dumbbell-chart__point")).toHaveCount(1);
});

test("BulletChart uses one scale for actual and target", async ({ page }) => {
  await page.goto("/components/bullet-chart");
  const plot = page.getByRole("group", { name: "Resolved requests by channel" });
  const web = plot.getByRole("meter", { name: "Web" });
  await expect(web).toHaveAttribute("aria-valuemax", "100");
  await expect(web).toHaveAttribute("aria-valuetext", "Actual: 74, Target: 80");
  await expect(plot.locator(".flood-bullet-chart__target")).toHaveCount(3);
  await chooseSelectOption(page.getByRole("combobox", { name: "BulletChart prop data" }), "zero");
  await expect(web).toHaveAttribute("aria-valuetext", "Actual: 0, Target: 80");
});

test("BarList compares values on one scale and distinguishes zero from empty", async ({ page }) => {
  await page.goto("/components/bar-list");
  const bars = page.getByRole("group", { name: "Visits by page", exact: true });
  const overview = bars.getByRole("meter", { name: "Overview", exact: true });
  const components = bars.getByRole("meter", { name: "Components", exact: true });
  await expect(overview).toHaveAttribute("aria-valuemax", "214");
  await expect(components).toHaveAttribute("aria-valuemax", "214");
  await expect(components).toHaveAttribute("aria-valuetext", "136");
  await chooseSelectOption(page.getByRole("combobox", { name: "BarList prop data", exact: true }), "zero");
  await expect(components).toHaveAttribute("aria-valuetext", "0");
  await expect(components).toHaveAttribute("aria-valuemax", "1");
  await chooseSelectOption(page.getByRole("combobox", { name: "BarList prop data", exact: true }), "empty");
  await expect(bars).toHaveText("No data");
});
