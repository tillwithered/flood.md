import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("CollectionImportReview distinguishes assessed exclusions, zero eligibility and unavailable assessment", async ({page}, info) => {
  await page.goto("/components/collection-import-review");
  const panel = page.locator(".preview-stage .flood-surface");
  const scenario = page.getByRole("combobox",{name:"Scenario",exact:true});
  const exclusions = panel.getByRole("list",{name:"Skip reasons"});

  await expect(panel.getByText("Editorial references",{exact:true})).toBeVisible();
  await expect(panel.getByText("Studio archive",{exact:true})).toBeVisible();
  await expect(panel.getByText("48 to import",{exact:true})).toBeVisible();
  await expect(panel.getByText("11 will be skipped",{exact:true})).toBeVisible();
  await expect(exclusions.getByRole("listitem").filter({hasText:"Unsupported videos"}).locator("data")).toHaveText("8");
  await expect(exclusions.getByRole("listitem").filter({hasText:"Text-only posts"}).locator("data")).toHaveText("3");
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("collection-import-review.png")});

  await page.getByRole("checkbox",{name:"CollectionImportReview prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox",{name:"CollectionImportReview prop surface"}),"overlay");
  expect(await panel.evaluate(node => node.scrollWidth-node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("collection-import-review-narrow.png")});
  await chooseSelectOption(scenario,"All eligible");
  await expect(exclusions).toHaveCount(0);
  await chooseSelectOption(scenario,"None eligible");
  await expect(panel.getByText("0 to import",{exact:true})).toBeVisible();
  await expect(exclusions).toBeVisible();
  await chooseSelectOption(scenario,"Unavailable");
  await expect(panel.getByText("The source collection could not be read.")).toBeVisible();
  await expect(panel.getByText("0 to import",{exact:true})).toHaveCount(0);
  await expect(exclusions).toHaveCount(0);
});
