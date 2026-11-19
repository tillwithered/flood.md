import {expect, test} from "@playwright/test";
import {chooseSelectOption, chooseStudioSheetOption} from "./select-helpers";

test("evidence receipt and acceptance remain separate while the row action retains focus", async ({page}) => {
  await page.goto("/components/evidence-checklist");
  const preview = page.getByRole("region", {name:"EvidenceChecklist live playground"});
  const list = preview.getByRole("list", {name:"Expense evidence"});
  const receipt = list.getByRole("listitem").filter({hasText:"Itemized receipt"});
  const state = receipt.locator(".flood-status-indicator__label");
  const action = receipt.getByRole("button", {name:"Request receipt"});
  await expect(state).toHaveText("Missing");
  const purposeState = list.getByRole("listitem").filter({hasText:"Business purpose"}).locator(".flood-status-indicator__label");
  const receiptBounds = await state.boundingBox();
  const purposeBounds = await purposeState.boundingBox();
  expect(receiptBounds).not.toBeNull();
  expect(receiptBounds?.x).toBe(purposeBounds?.x);
  await action.focus();
  await page.keyboard.press("Enter");
  await expect(state).toHaveText("Requested");
  await expect(receipt.getByRole("button", {name:"Cancel request"})).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(state).toHaveText("Missing");

  const scenario = preview.getByRole("combobox", {name:"Scenario",exact:true});
  const choose = async (value: string) => {
    if (await scenario.isVisible()) await chooseSelectOption(scenario,value);
    else await chooseStudioSheetOption(page,"Scenario",value);
  };
  await choose("Under review");
  await expect(state).toHaveText("Received");
  await choose("Complete");
  await expect(state).toHaveText("Accepted");
  await expect(list.locator(".flood-status-indicator__label").filter({hasText:"Waived"})).toBeVisible();
  await choose("No requirements");
  await expect(list.getByText("No evidence required")).toBeVisible();
});
