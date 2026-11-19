import {expect, test} from "@playwright/test";

test("Merge records preserves review choices and focuses the survivor", async ({page}, info) => {
  await page.goto("/playground/merge-records");
  const review = page.getByRole("button", {name:"Review merge"});
  const contact = page.getByRole("combobox", {name:"Contact ID"});
  const email = page.getByRole("combobox", {name:"Email", exact:true});
  const title = page.getByRole("combobox", {name:"Job title", exact:true});
  await expect(review).toBeDisabled();
  await email.click();
  await page.getByRole("option", {name:"ajordan@northwind.example · C-218"}).click();
  await title.click();
  await page.getByRole("option", {name:"Design lead · C-104"}).click();
  await contact.click();
  await page.getByRole("option", {name:"C-218", exact:true}).click();
  await expect(email).toHaveText("ajordan@northwind.example · C-218");
  await expect(title).toHaveText("Design lead · C-104");
  await page.screenshot({path:info.outputPath("merge-review.png")});

  await review.click();
  const confirmation = page.getByRole("dialog", {name:"Merge contacts into C-218?"});
  await expect(confirmation).toContainText("Contact C-104 will be removed.");
  await expect(confirmation.getByText("ajordan@northwind.example", {exact:true})).toBeVisible();
  await expect(confirmation.getByText("Design lead", {exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath("merge-confirmation.png")});
  const cancel = confirmation.getByRole("button", {name:"Cancel"});
  await expect(cancel).toBeFocused();
  await cancel.click();
  await expect(review).toBeFocused();
  await expect(title).toHaveText("Design lead · C-104");
  await review.click();
  await confirmation.getByRole("button", {name:"Merge contacts"}).click();
  const result = page.getByRole("heading", {name:"Contact C-218 merged"});
  await expect(result).toBeFocused();
  await expect(page.getByText("ajordan@northwind.example", {exact:true})).toBeVisible();
  await expect(page.getByText("Design lead", {exact:true})).toBeVisible();
  await expect(review).toHaveCount(0);
});
