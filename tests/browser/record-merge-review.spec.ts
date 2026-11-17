import {expect, test} from "@playwright/test";
import {chooseSelectOption, chooseStudioSheetOption} from "./select-helpers";

test("a merge review preserves the destination through pending and retry", async ({page}) => {
  await page.goto("/components/record-merge-review");
  const review = page.getByRole("region", {name:"RecordMergeReview live playground"});
  const merge = review.getByRole("button", {name:"Merge issue", exact:true});
  const cancel = review.getByRole("button", {name:"Cancel", exact:true});
  const destination = review.getByText("Invoice search drops the active query");
  const setScenario = async (value: string) => {
    const select = review.getByRole("combobox", {name:"Scenario", exact:true});
    if (await select.isVisible()) await chooseSelectOption(select, value);
    else await chooseStudioSheetOption(page, "Scenario", value);
  };

  await expect(merge).toHaveAccessibleDescription("Comments and attachments move to ENG-814.");
  await expect(review.getByText("Merge from", {exact:true})).toBeVisible();
  await expect(review.getByText("Keep", {exact:true})).toBeVisible();
  await setScenario("Pending");
  await expect(merge).toHaveAttribute("aria-disabled", "true");
  await expect(cancel).toBeDisabled();
  await expect(destination).toBeVisible();
  await setScenario("Failed");
  await expect(review.getByRole("alert")).toHaveText("Couldn’t merge. Try again.");
  await expect(destination).toBeVisible();
  await review.getByRole("checkbox", {name:"RecordMergeReview prop longTitles"}).check();
  await expect(review.getByText("Invoice search resets after refresh while viewing archived results")).toBeVisible();
  await expect(merge).toBeInViewport({ratio:1});
  await merge.focus();
  await page.keyboard.press("Enter");
  await expect(review.getByText("Merged into ENG-814", {exact:true})).toBeVisible();
});
