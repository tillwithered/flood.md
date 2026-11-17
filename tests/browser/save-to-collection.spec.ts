import {expect, test} from "@playwright/test";

test("personal saves and collection choices remain independent", async ({page}) => {
  await page.goto("/components/save-to-collection");
  const preview = page.getByRole("region", {name:"SaveToCollection live playground"});
  const save = preview.getByRole("button", {name:"Save", exact:true});
  const collections = preview.getByRole("button", {name:"Collections", exact:true});
  const menu = page.getByRole("menu", {name:"Collections"});
  await expect(save).toHaveAttribute("aria-pressed", "false");
  const width = (await save.boundingBox())?.width;
  await save.click();
  await expect(save).toHaveAttribute("aria-pressed", "true");
  expect((await save.boundingBox())?.width).toBe(width);

  await collections.click();
  const analytics = menu.getByRole("menuitemcheckbox", {name:"Analytics references"});
  const dashboard = menu.getByRole("menuitemcheckbox", {name:"Dashboard patterns"});
  await analytics.click();
  await expect(analytics).toHaveAttribute("aria-checked", "true");
  await expect(menu).toBeVisible();
  await dashboard.click();
  await expect(dashboard).toHaveAttribute("aria-checked", "true");
  await expect(menu.getByRole("menuitemcheckbox", {name:"Team archive"})).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(collections).toBeFocused();

  await save.click();
  await expect(save).toHaveAttribute("aria-pressed", "false");
  await collections.click();
  await expect(analytics).toHaveAttribute("aria-checked", "true");
  await expect(dashboard).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");
  await preview.getByRole("checkbox", {name:"SaveToCollection prop pending"}).check();
  await expect(save).toHaveAttribute("aria-disabled", "true");
  await expect(collections).toBeEnabled();
  await preview.getByRole("checkbox", {name:"SaveToCollection prop pending"}).uncheck();
  await preview.getByRole("checkbox", {name:"SaveToCollection prop empty"}).check();
  await expect(collections).toBeDisabled();
  await expect(save).toBeEnabled();
});

test("a split action with no alternatives keeps its default action available", async ({page}) => {
  await page.goto("/components/split-button");
  const preview = page.getByRole("region", {name:"SplitButton live playground"});
  await preview.getByRole("checkbox", {name:"SplitButton prop empty"}).check();
  await expect(preview.getByRole("button", {name:"Export formats"})).toBeDisabled();
  await preview.getByRole("button", {name:"Export PDF"}).click();
  await expect(preview.getByText("PDF export selected.")).toBeVisible();
});
