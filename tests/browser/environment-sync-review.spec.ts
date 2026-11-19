import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("EnvironmentSyncReview names the direction and exposes planned destination removals", async ({ page }, info) => {
  await page.goto("/components/environment-sync-review");
  const review = page.locator(".preview-stage").getByRole("group", { name:"Environment sync review", exact:true });
  const scenario = page.getByRole("combobox", { name:"Scenario", exact:true });
  await expect(review.locator("dt")).toHaveText(["Source", "Destination"]);
  await expect(review.locator("dd")).toHaveText(["Production", "Staging"]);
  await expect(review.getByText("1 removal in the destination")).toBeVisible();
  await expect(review.getByText("Will add", { exact:true })).toBeVisible();
  const worker = review.getByRole("button", { name:"Queue worker" });
  await worker.focus();
  await worker.press("Enter");
  await expect(worker).toHaveAttribute("aria-expanded", "false");
  await expect(review.getByText("1 removal in the destination")).toBeVisible();
  await worker.press("Enter");
  await expect(review.getByText("Will remove", { exact:true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const panel = review.locator("../..");
  await worker.blur();
  await panel.screenshot({ path:info.outputPath("environment-sync-review.png"), animations:"disabled" });

  await page.getByRole("checkbox", { name:"EnvironmentSyncReview prop narrow" }).check();
  await chooseSelectOption(page.getByRole("combobox", { name:"EnvironmentSyncReview prop surface" }), "overlay");
  await expect(review.getByText("Staging · European integration")).toBeVisible();
  await expect.poll(() => review.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({ path:info.outputPath("environment-sync-review-narrow.png"), animations:"disabled" });

  await chooseSelectOption(scenario, "No changes");
  await expect(review.getByText("No changes to sync.")).toBeVisible();
  await expect(worker).toHaveCount(0);
  await expect(review.getByText("1 removal in the destination")).toHaveCount(0);
  await chooseSelectOption(scenario, "Unavailable");
  await expect(review.getByText("Sync plan unavailable.")).toBeVisible();
  await expect(review.getByText("No changes to sync.")).toHaveCount(0);
  await expect(review.getByRole("group", { name:"Planned changes" })).toHaveCount(0);
});
