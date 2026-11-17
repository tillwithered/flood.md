import {expect, test} from "@playwright/test";

test("Import mapping keeps an invalid source row tied to its column and invalidates the checked revision", async ({page}, info) => {
  await page.goto("/playground/import-mapping");
  const check = page.getByRole("button", {name:"Check mapping"});
  const commit = page.getByRole("button", {name:"Import contacts"});
  const mainEmail = page.getByRole("combobox", {name:"Import Work email into"});
  const oldEmail = page.getByRole("combobox", {name:"Import Old email into"});
  await expect(commit).toBeDisabled();
  await check.click();
  await expect(commit).toBeEnabled();
  await mainEmail.click();
  await page.getByRole("option", {name:"Skip"}).click();
  await expect(commit).toBeDisabled();
  await oldEmail.click();
  await page.getByRole("option", {name:"Email", exact:true}).click();
  await check.click();
  await expect(commit).toBeDisabled();
  const issue = page.getByRole("link", {name:/Old email, row 2/});
  await expect(issue).toBeVisible();
  await issue.click();
  await expect(oldEmail).toBeFocused();
  await expect(oldEmail).toHaveAttribute("aria-invalid", "true");
  await page.screenshot({path:info.outputPath("import-source-error.png")});

  await oldEmail.click();
  await page.getByRole("option", {name:"Skip"}).click();
  await expect(issue).toHaveCount(0);
  await expect(commit).toBeDisabled();
  await check.click();
  await commit.click();
  await expect(page.getByRole("status").filter({hasText:"Import complete"})).toBeVisible();
});
