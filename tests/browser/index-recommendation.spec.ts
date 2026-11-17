import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("IndexRecommendation separates planner estimates and copies the exact SQL", async ({ page, context }, info) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/components/index-recommendation");
  const stage = page.locator(".preview-stage");
  const recommendation = stage.getByRole("region", { name: "Index open orders by customer" });
  const surface = page.getByRole("combobox", { name: "IndexRecommendation prop surface" });
  const startup = page.getByRole("checkbox", { name: "IndexRecommendation prop showStartup" });
  await chooseSelectOption(surface, "canvas");
  await expect(recommendation.getByText("Estimated planner cost", { exact: true })).toBeVisible();
  await chooseSelectOption(surface, info.project.name === "mobile" ? "overlay" : "raised");
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "IndexRecommendation prop narrow" }).check();
  }
  await expect(recommendation.getByText("Total cost", { exact: true })).toBeVisible();
  await expect(recommendation.getByText("Startup cost", { exact: true })).toBeVisible();
  await expect(recommendation.getByText("0", { exact: true })).toBeVisible();
  await expect(recommendation.getByText("0.29", { exact: true })).toBeVisible();
  await expect.poll(() => recommendation.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await page.evaluate(() => document.fonts.ready);
  const panel = (await stage.locator(".flood-surface").boundingBox())!;
  const canvas = (await stage.boundingBox())!;
  expect(panel.y).toBeGreaterThan(canvas.y);
  expect(panel.y + panel.height).toBeLessThan(canvas.y + canvas.height);
  await stage.screenshot({ path: info.outputPath("index-recommendation.png"), animations: "disabled" });

  const copy = recommendation.getByRole("button", { name: "Copy SQL", exact: true });
  await copy.press("Enter");
  // Windows normalizes native clipboard line endings to CRLF.
  await expect.poll(async () => (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n"))
    .toBe("CREATE INDEX ON public.orders (customer_id)\nWHERE status = 'open';");
  await expect(recommendation.getByRole("button", { name: "Copied", exact: true })).toBeFocused();
  await startup.uncheck();
  await expect(recommendation.getByText("Startup cost", { exact: true })).toHaveCount(0);
  await expect(recommendation.getByText("Total cost", { exact: true })).toBeVisible();
});
