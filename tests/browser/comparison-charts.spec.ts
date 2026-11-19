import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("comparison charts expose their last values and dismiss inspection from the keyboard", async ({ page }) => {
  const charts = [
    ["combo-chart", "Subscriptions and churn", "Apr, Subscriptions: 118, Churn: 3"],
    ["funnel-chart", "Trial conversion", "Paid, Value: 160, Of initial stage: 11.9%"],
    ["radar-chart", "Service health", "Adoption, This month: 91, Last month: 85"],
    ["sankey-chart", "Cash flow", "Cash inflow → Reserve, Flow: 55"],
  ];
  for (const [slug, label, expected] of charts) {
    await page.goto("/components/" + slug);
    const plot = page.getByRole("slider", { name: label, exact: true });
    await plot.focus();
    const bounds = await plot.boundingBox();
    if (slug === "combo-chart") {
      const centers = async (selector: string) => plot.locator(selector).evaluateAll(nodes =>
        nodes.map(node => {
          const { left, width } = node.getBoundingClientRect();
          return left + width / 2;
        }));
      const ticks = await centers(".flood-comparison-chart__categories > *");
      const bars = await centers(".flood-comparison-chart__bar");
      expect(ticks).toHaveLength(bars.length);
      ticks.forEach((tick, i) => expect(Math.abs(tick - bars[i])).toBeLessThan(1));
    }
    await plot.press("End");
    await expect(plot).toHaveAttribute("aria-valuetext", expected);
    await expect(plot.locator(".flood-comparison-chart__inspection")).toBeVisible();
    await plot.press("Escape");
    await expect(plot.locator(".flood-comparison-chart__inspection")).toHaveCount(0);
    await expect(plot).toBeFocused();
    expect(await plot.evaluate(node => getComputedStyle(node, "::after").borderBlockStartWidth)).toBe("2px");
    expect(await plot.boundingBox()).toEqual(bounds);
  }
});

test("touch inspection toggles at the same stage and pointer can inspect another stage", async ({ page }) => {
  await page.goto("/components/funnel-chart");
  const plot = page.getByRole("slider", { name: "Trial conversion", exact: true });
  const stages = plot.locator("[data-chart-hit]");
  const readout = plot.locator(".flood-comparison-chart__inspection");
  const trials = stages.nth(1);
  const bounds = (await trials.boundingBox())!;
  await trials.dispatchEvent("pointerup", { pointerType: "touch", clientX: bounds.x + 10 });
  await expect(readout).toContainText("Trials");
  await trials.dispatchEvent("pointerup", { pointerType: "touch", clientX: bounds.x + 10 });
  await expect(readout).toHaveCount(0);
  await stages.nth(2).hover();
  await expect(readout).toContainText("Activated");
});

test("LineChart can fill each series and switch to normalized area bands", async ({ page }) => {
  await page.goto("/components/line-chart");
  const plot = page.getByRole("slider", { name: "Daily visits", exact: true });
  const layers = plot.locator(".flood-line-chart__area");
  await expect(layers).toHaveCount(1);
  const control = page.getByRole("combobox", { name: "LineChart prop areaLayout", exact: true });
  await chooseSelectOption(control, "overlay");
  await expect(layers).toHaveCount(2);
  await chooseSelectOption(control, "percent");
  await plot.focus();
  await plot.press("End");
  await expect(plot).toHaveAttribute("aria-valuetext", /Sun, This week: 87, Last week: 58/);
  await expect(layers).toHaveCount(2);
});

test("ScatterChart keeps sizes proportional and includes cohort and size in inspection", async ({ page }) => {
  await page.goto("/components/scatter-chart");
  const control = page.getByRole("combobox", { name: "ScatterChart prop data", exact: true });
  await chooseSelectOption(control, "bubble");
  const plot = page.getByRole("slider", { name: "Response time by traffic", exact: true });
  const bubbles = plot.locator(".flood-scatter-chart__point[data-proportional]");
  await expect(bubbles).toHaveCount(14);
  await expect(plot.locator(".flood-scatter-chart__legend")).toHaveCount(0);
  await expect(page.locator(".flood-scatter-chart__legend")).toContainText("Production");
  await expect(page.locator(".flood-scatter-chart__legend")).toContainText("Preview");
  expect((await bubbles.last().boundingBox())!.width).toBeGreaterThan((await bubbles.first().boundingBox())!.width * 3);
  await plot.focus();
  await plot.press("End");
  await expect(plot).toHaveAttribute("aria-valuetext", /Run 14, Preview, .*104.*301.*Concurrent sessions: 225/);
});
