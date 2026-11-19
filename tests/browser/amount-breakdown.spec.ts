import { expect, test, type Locator } from "@playwright/test";

async function valueGeometry(breakdown: Locator) {
  return breakdown.locator("dd").evaluateAll(cells => cells.map(cell => {
    const value = cell.querySelector("bdi")!;
    const bounds = value.getBoundingClientRect();
    const singleLine = cell.getBoundingClientRect().height <= Number.parseFloat(getComputedStyle(cell).lineHeight) + 1;
    return { left: bounds.left, right: bounds.right, singleLine };
  }));
}

test("AmountBreakdown aligns the total with signed values in both directions", async ({ page }, info) => {
  await page.goto("/components/amount-breakdown");
  const stage = page.locator(".preview-stage");
  const breakdown = stage.locator("dl");
  const values = breakdown.locator("dd");
  await expect(values).toHaveText(["$12,000.00", "$960.00", "-$1,250.00", "$11,710.00"]);
  await page.evaluate(() => document.fonts.ready);
  const { x, width } = (await breakdown.boundingBox())!;
  for (const value of await valueGeometry(breakdown)) {
    expect(value.right).toBeCloseTo(x + width, 0);
    expect(value.singleLine).toBe(true);
  }
  await stage.screenshot({ path: info.outputPath("amount-breakdown-invoice.png") });

  await page.getByRole("checkbox", { name: "AmountBreakdown prop narrow" }).check();
  await page.getByRole("checkbox", { name: "AmountBreakdown prop rtl" }).check();
  await page.getByRole("combobox", { name: "AmountBreakdown prop surface" }).click();
  await page.getByRole("option", { name: "overlay", exact: true }).click();
  const rtlEdge = (await breakdown.boundingBox())!.x;
  for (const value of await valueGeometry(breakdown)) {
    expect(value.left).toBeCloseTo(rtlEdge, 0);
    expect(value.singleLine).toBe(true);
  }
  await expect.poll(() => breakdown.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.screenshot({ path: info.outputPath("amount-breakdown-rtl.png") });

  await page.getByRole("checkbox", { name: "AmountBreakdown prop rtl" }).uncheck();
  const example = page.getByRole("combobox", { name: /^(Example|AmountBreakdown prop example)$/ });
  await example.click();
  await page.getByRole("option", { name: "credit", exact: true }).click();
  await expect(values).toHaveText(["$240.00", "-$360.00", "-$120.00"]);
  await example.click();
  await page.getByRole("option", { name: "total only", exact: true }).click();
  await expect(values).toHaveText(["$0.00"]);
});
