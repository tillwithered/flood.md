import { expect, test } from "@playwright/test";
import { chooseSelectOption, chooseStudioSheetOption } from "./select-helpers";

test("UsageForecast keeps the budget at a stable position and forecast separate from recorded spend", async ({page},info) => {
  await page.goto("/components/usage-forecast");
  const meter = page.getByRole("meter",{name:"Recorded spend"});
  const current = meter.locator(".flood-indicator__fill");
  const forecast = meter.locator(".flood-indicator__projection");
  const budget = meter.locator(".flood-indicator__reference");
  const budgetPosition = () => budget.evaluate(node => getComputedStyle(node).getPropertyValue("--flood-indicator-reference-position"));
  const scenario = page.getByRole("combobox",{name:/^Scenario$|^UsageForecast prop scenario$/});
  async function setScenario(next:string) {
    if (await scenario.isVisible()) await chooseSelectOption(scenario,next);
    else await chooseStudioSheetOption(page,"Scenario",next);
  }
  await expect(meter).toHaveAttribute("aria-valuetext","$72");
  await expect(meter).toHaveAccessibleDescription("Estimate by Nov 30 · $118 Budget · $100");
  const position = await budgetPosition();
  const solid = await current.boundingBox();
  const projected = await forecast.boundingBox();
  const marker = await budget.boundingBox();
  expect(projected!.x).toBeCloseTo(solid!.x + solid!.width,0);
  expect(projected!.x + projected!.width).toBeGreaterThan(marker!.x);
  expect(marker!.height).toBeGreaterThan(solid!.height);
  await page.evaluate(()=>document.fonts.ready);
  await page.locator(".preview-stage").screenshot({path:info.outputPath("usage-forecast.png")});

  await setScenario("within budget");
  const within = await forecast.boundingBox();
  expect(within!.x + within!.width).toBeLessThan((await budget.boundingBox())!.x);
  expect(await budgetPosition()).toBe(position);
  await setScenario("no forecast");
  await expect(forecast).toHaveCount(0);
  await expect(meter).toHaveAccessibleDescription("Budget · $100");
  expect(await budgetPosition()).toBe(position);

  await setScenario("already over");
  await expect(meter).toHaveAttribute("aria-valuenow","104");
  const surface = page.getByRole("combobox",{name:/^Surface$|^UsageForecast prop surface$/});
  if (await surface.isVisible()) await chooseSelectOption(surface,"overlay");
  else await chooseStudioSheetOption(page,"Surface","overlay");
  await page.getByRole("checkbox",{name:/^Narrow width$|^UsageForecast prop narrow$/}).check();
  await page.locator(".preview-stage").screenshot({path:info.outputPath("usage-forecast-overlay.png")});
  await page.emulateMedia({forcedColors:"active"});
  await expect(forecast).toHaveCSS("border-top-style","dashed");
});

test("UsageLimit distinguishes the policy boundary and preserves the actual overage", async ({ page }, info) => {
  await page.goto("/components/usage-limit");
  const meter = page.getByRole("meter", { name: "Compute spend" });
  const indicator = meter.locator("..");
  await expect(meter).toHaveAccessibleDescription("Email notification · $75");

  await page.getByRole("combobox", { name: "UsageLimit prop used" }).click();
  await page.getByRole("option", { name: "100", exact: true }).click();
  await expect(indicator).toHaveAttribute("data-tone", "error");

  const preview = page.locator(".preview-stage");
  const policy = page.getByRole("combobox", { name: "UsageLimit prop policy" });
  await policy.click();
  await page.getByRole("option", { name: "soft-budget", exact: true }).click();
  await expect(indicator).toHaveAttribute("data-tone", "warning");
  await expect(preview.getByText("Workloads keep running when spending reaches the budget.")).toBeVisible();

  await policy.click();
  await page.getByRole("option", { name: "allowance", exact: true }).click();
  await expect(indicator).toHaveAttribute("data-tone", "warning");
  await page.getByRole("checkbox", { name: "UsageLimit prop showNotification" }).uncheck();
  await expect(indicator).toHaveAttribute("data-tone", "neutral");
  await expect(meter).not.toHaveAttribute("aria-describedby");

  await page.getByRole("combobox", { name: "UsageLimit prop used" }).click();
  await page.getByRole("option", { name: "112", exact: true }).click();
  await expect(indicator).toHaveAttribute("data-tone", "warning");
  await expect(meter).toHaveAttribute("aria-valuenow", "100");
  await expect(meter).toHaveAttribute("aria-valuetext", "$112 / $100 included");
  await page.getByRole("checkbox", { name: "UsageLimit prop narrow" }).check();
  await expect.poll(() => indicator.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await expect(preview.getByText("Usage above the included amount is billed separately.")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await preview.screenshot({ path: info.outputPath("usage-limit-narrow.png") });
});
