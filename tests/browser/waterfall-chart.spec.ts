import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("WaterfallChart shows signed changes, running totals and absolute checkpoints", async ({ page }) => {
  await page.goto("/components/waterfall-chart");
  const plot = page.getByRole("slider", { name: "Net revenue" });
  await plot.press("Home");
  await expect(plot).toHaveAttribute("aria-valuetext", "Gross, Total: $32,000");
  await plot.press("ArrowRight");
  await expect(plot).toHaveAttribute("aria-valuetext", "Upsells, Change: +$6,000, Total: $38,000");
  const up = plot.locator(".flood-waterfall-chart__bar[data-kind=increase]").first();
  const gross = plot.locator(".flood-waterfall-chart__bar[data-kind=total]").first();
  const upRect = (await up.boundingBox())!;
  const grossRect = (await gross.boundingBox())!;
  expect(Math.abs(upRect.y + upRect.height - grossRect.y)).toBeLessThan(1);

  const refunds = plot.locator(".flood-waterfall-chart__column").nth(2);
  await refunds.hover();
  await expect(plot).toHaveAttribute("aria-valuetext", "Refunds, Change: -$4,500, Total: $33,500");
  await expect(plot.locator(".flood-waterfall-chart__tooltip")).toContainText("$33,500");
  await plot.press("End");
  await expect(plot).toHaveAttribute("aria-valuetext", "Net, Total: $31,000");
  await plot.press("Escape");
  await expect(plot.locator(".flood-waterfall-chart__tooltip")).toHaveCount(0);

  const data = page.getByRole("combobox", { name: "WaterfallChart prop data" });
  await chooseSelectOption(data, "signed");
  const signed = page.getByRole("slider", { name: "Cash balance" });
  await signed.press("Home");
  await signed.press("ArrowRight");
  await expect(signed).toHaveAttribute("aria-valuetext", "Payroll, Change: -$11,000, Total: -$3,000");
  await signed.press("End");
  await expect(signed).toHaveAttribute("aria-valuetext", "Closing, Total: $2,000");
  await chooseSelectOption(data, "empty");
  await expect(page.getByRole("group", { name: "Net revenue" })).toHaveText("No steps");
});
