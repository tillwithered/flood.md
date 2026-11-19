import {expect, test} from "@playwright/test";

test("outstanding invitations preserve status and recover focus after revoke", async ({page}) => {
  await page.goto("/components/pending-invitation-list");
  const list = page.getByRole("list", {name:"Outstanding invitations"});
  await expect(list.getByRole("listitem")).toHaveCount(3);
  for (const status of ["Awaiting acceptance", "Expired", "Delivery failed"]) {
    await expect(list.getByText(status, {exact:true}).filter({visible:true})).toBeVisible();
  }

  const resend = list.getByRole("button", {name:"Resend invitation to sam.rivera@example.test"});
  await resend.click();
  await expect(resend).toBeFocused();
  await expect(page.getByText("Invitation resent to sam.rivera@example.test.", {exact:true})).toBeVisible();
  await expect(list.getByRole("listitem")).toHaveCount(3);

  const revoke = list.getByRole("button", {name:"Revoke invitation for alex@example.test"});
  const dialog = page.getByRole("alertdialog", {name:"Revoke this invitation?"});
  await revoke.focus();
  await page.keyboard.press("Enter");
  await expect(dialog.getByRole("button", {name:"Cancel"})).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(revoke).toBeFocused();
  await expect(list.getByRole("listitem")).toHaveCount(3);

  await page.keyboard.press("Enter");
  await dialog.getByRole("button", {name:"Revoke invitation"}).click();
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await expect(page.getByText("Invitation revoked for alex@example.test.", {exact:true})).toBeVisible();
  await expect(page.locator("#invitation-review-preview")).toBeFocused();

  await page.getByRole("combobox", {name:/scenario/i}).click();
  await page.getByRole("option", {name:"Empty",exact:true}).click();
  await expect(page.getByText("No outstanding invitations.", {exact:true})).toBeVisible();
  await expect(list).not.toBeVisible();
});
