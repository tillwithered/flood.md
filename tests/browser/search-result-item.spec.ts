import { expect, test } from "@playwright/test";
import { chooseSelectOption, chooseStudioSheetOption } from "./select-helpers";

test("SearchResultItem shows the matching field and opens its original location", async ({ page }, info) => {
  await page.goto("/components/search-result-item");
  const preview = page.locator(".preview-stage");
  const results = preview.getByRole("list", { name: "Documentation results" });
  const motion = results.getByRole("listitem").filter({ has: page.getByRole("link", { name: "Motion", exact: true }) });
  const reply = results.getByRole("listitem").filter({ hasText: "Reply in the right channel" });
  const retry = results.getByRole("link", { name: "RetrySchedule" });
  await expect(motion.getByText("Component states")).toBeVisible();
  await expect(motion.locator("mark")).toHaveText("retry");
  await expect(reply.locator("mark")).toHaveText("retrying");
  await expect(retry.locator("mark")).toHaveText("Retry");
  await page.evaluate(() => document.fonts.ready);
  await preview.screenshot({ path: info.outputPath("search-result-item.png") });

  await page.getByRole("checkbox", { name: /^Narrow width$|^SearchResultItem prop narrow$/ }).check();
  const surface = page.getByRole("combobox", { name: /^Surface$|^SearchResultItem prop surface$/ });
  if (await surface.isVisible()) await chooseSelectOption(surface, "overlay");
  else await chooseStudioSheetOption(page, "Surface", "overlay");
  await expect(motion.locator("mark")).toBeVisible();
  expect(await results.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await expect(retry).toBeInViewport({ ratio: 1 });
  await preview.screenshot({ path: info.outputPath("search-result-item-narrow.png") });

  await page.getByRole("checkbox", { name: /^Show excerpts$|^SearchResultItem prop showExcerpts$/ }).uncheck();
  await expect(motion.locator("mark")).toHaveCount(0);
  await expect(retry.locator("mark")).toHaveText("Retry");
  await motion.getByRole("link", { name: "Motion", exact: true }).press("Enter");
  await expect(page).toHaveURL(/\/docs\/motion#component-states$/);
  await expect(page.getByRole("heading", { name: "Component states" })).toBeVisible();
});
