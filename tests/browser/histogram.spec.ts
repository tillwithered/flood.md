import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("Histogram keeps numeric bins contiguous and exposes counts for zero bins", async ({ page }) => {
  await page.goto("/components/histogram");
  const chart = page.getByRole("group", { name: "Request latency distribution", exact: true });
  const plot = chart.getByRole("slider");
  const tip = chart.locator(".flood-histogram__tooltip");
  await expect(plot).toHaveAttribute("aria-valuemax", "10");
  await plot.press("Home");
  await expect(plot).toHaveAttribute("aria-valuetext", "Latency (ms): 0–50, Requests: 5");
  await plot.press("End");
  await expect(plot).toHaveAttribute("aria-valuetext", "Latency (ms): 450–500, Requests: 0");
  await expect(tip).toContainText("450–500");
  await plot.press("Escape");
  await expect(tip).toHaveCount(0);

  const bins = plot.locator(".flood-histogram__bin");
  const first = (await bins.first().boundingBox())!;
  const second = (await bins.nth(1).boundingBox())!;
  expect(first.x + first.width).toBeCloseTo(second.x);
  const y = first.y + first.height / 2;
  await page.mouse.move(second.x - 1, y);
  await expect(plot).toHaveAttribute("aria-valuetext", "Latency (ms): 0–50, Requests: 5");
  await page.mouse.move(second.x + 1, y);
  await expect(plot).toHaveAttribute("aria-valuetext", "Latency (ms): 50–100, Requests: 16");
  const bounds = (await plot.boundingBox())!;
  const readout = (await tip.boundingBox())!;
  expect(readout.x).toBeGreaterThanOrEqual(bounds.x - 1);
  expect(readout.x + readout.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);

  const data = page.getByRole("combobox", { name: "Histogram prop data", exact: true });
  await chooseSelectOption(data, "zero");
  await plot.press("Home");
  await expect(plot).toHaveAttribute("aria-valuetext", "Latency (ms): 0–50, Requests: 0");
  await chooseSelectOption(data, "empty");
  await expect(chart.getByText("No observations", { exact: true })).toBeVisible();
});
