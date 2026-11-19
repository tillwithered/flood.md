import {expect, test} from "@playwright/test";

test("pause and resume preserve the same keyboard target", async ({page}) => {
  await page.goto("/components/live-follow-control");
  const stage = page.locator(".preview-stage");
  const action = stage.getByRole("button", {name:"Pause",exact:true});
  await action.press("Enter");
  const followLatest = stage.getByRole("button", {name:"Follow latest",exact:true});
  await expect(followLatest).toBeFocused();
  await followLatest.press("Space");
  await page.getByRole("combobox", {name:/queued/i}).click();
  await page.getByRole("option", {name:"12",exact:true}).click();
  await action.press("Enter");
  const resume = stage.getByRole("button", {name:"Show 12 new",exact:true});
  await expect(resume).toBeFocused();
  await expect(stage.getByText("Paused", {exact:true}).filter({visible:true})).toBeVisible();
  await resume.press("Space");
  await expect(action).toBeFocused();
  await expect(stage.getByText("Following", {exact:true}).filter({visible:true})).toBeVisible();

  await page.getByRole("checkbox", {name:/disabled/i}).check();
  await expect(action).toBeDisabled();
});
