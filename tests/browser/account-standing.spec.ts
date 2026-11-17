import {expect, test} from "@playwright/test";
import {chooseSelectOption, chooseStudioSheetOption} from "./select-helpers";

test("account standing distinguishes zero strikes from missing information and opens history", async ({page}) => {
  await page.goto("/components/account-standing");
  const preview = page.getByRole("region", {name:"AccountStanding live playground"});
  const state = preview.locator(".flood-status-indicator__label");
  const count = preview.getByText("Active strikes", {exact:true});
  const expiry = preview.locator('time[datetime="2026-12-01"]');
  await expect(state).toHaveText("At risk");
  await expect(count).toBeVisible();
  await expect(expiry).toBeVisible();
  const history = preview.getByRole("button", {name:"View history",exact:true});
  await history.focus();
  await page.keyboard.press("Enter");
  const drawer = page.getByRole("dialog", {name:"Moderation history"});
  await expect(drawer.getByRole("heading", {name:"Posting restriction"})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(history).toBeFocused();

  const scenario = preview.getByRole("combobox", {name:"Scenario",exact:true});
  const choose = async (value: string) => {
    if (await scenario.isVisible()) await chooseSelectOption(scenario,value);
    else await chooseStudioSheetOption(page,"Scenario",value);
  };
  await choose("Good standing");
  await expect(state).toHaveText("Good standing");
  await expect(count).toBeVisible();
  await expect(preview.getByText("0", {exact:true})).toBeVisible();
  await expect(expiry).toHaveCount(0);
  await choose("Unavailable");
  await expect(state).toHaveText("Unavailable");
  await expect(count).toHaveCount(0);
  await expect(expiry).toHaveCount(0);
});
