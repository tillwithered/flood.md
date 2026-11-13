import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("BoxPlot compares summaries and keeps inspection within the plot", async ({ page }) => {
  await page.goto("/components/box-plot");
  const plot = page.getByRole("slider", { name: "Request latency by service" });
  const tooltip = plot.locator(".flood-box-plot__tooltip");
  await plot.press("Home");
  await expect(plot).toHaveAttribute("aria-valuetext", /API.*42.*74.*96.*128.*176.*Outliers: 1/);
  await expect(tooltip).toContainText("74–128");
  await expect(tooltip).toContainText("42–176");
  for (const key of ["Home", "ArrowRight", "ArrowRight", "End"]) {
    await plot.press(key);
    await expect(tooltip).toBeVisible();
    const [bounds, readout] = await Promise.all([plot.boundingBox(), tooltip.boundingBox()]);
    expect(readout!.x).toBeGreaterThanOrEqual(bounds!.x);
    expect(readout!.y).toBeGreaterThanOrEqual(bounds!.y);
    expect(readout!.x + readout!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
    expect(readout!.y + readout!.height).toBeLessThanOrEqual(bounds!.y + bounds!.height);
    const marker = (await plot.locator("[data-active] .flood-box-plot__median").boundingBox())!;
    const center = marker.x + marker.width / 2;
    const gap = await tooltip.evaluate(node => parseFloat(getComputedStyle(node).columnGap));
    if (bounds!.x + bounds!.width - center >= readout!.width + 2 * gap) {
      expect(readout!.x - center).toBeCloseTo(gap, 0);
    } else if (center - bounds!.x >= readout!.width + 2 * gap) {
      expect(center - readout!.x - readout!.width).toBeCloseTo(gap, 0);
    }
  }
  await plot.press("Escape");
  await expect(tooltip).toHaveCount(0);
  const data = page.getByRole("combobox", { name: "BoxPlot prop data", exact: true });
  await chooseSelectOption(data, "gap");
  await plot.locator(".flood-box-plot__row").nth(2).hover();
  await expect(plot).toHaveAttribute("aria-valuetext", "Billing, No data");
  await expect(tooltip).toContainText("No data");
  await chooseSelectOption(data, "flat");
  await expect(plot.locator(".flood-box-plot__median")).toHaveCount(5);
  await chooseSelectOption(data, "empty");
  await expect(page.getByRole("group", { name: "Request latency by service" })).toHaveText("No observations");
});
