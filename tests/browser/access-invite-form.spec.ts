import {expect, test} from "@playwright/test";

test("an invitation requires a valid address and an available role", async ({page}) => {
  await page.goto("/components/access-invite-form");
  const email = page.getByRole("textbox", {name:"Email address"});
  const role = page.getByRole("combobox", {name:"Role", exact:true});
  const submit = page.getByRole("button", {name:"Send invitation"});
  const scenario = page.getByRole("combobox", {name:/scenario/i});
  const outcome = page.getByText("Invitation sent to alex@example.test.", {exact:true});
  await expect(page.getByText("Customer portal", {exact:true})).toBeVisible();
  await expect(submit).toBeDisabled();
  await email.fill("alex");
  await expect(submit).toBeDisabled();

  await role.click();
  await page.getByRole("option", {name:"Contributor"}).click();
  await expect(role).toHaveAccessibleDescription("Can create and update issues in this project.");
  await submit.click();
  await expect(outcome).not.toBeVisible();
  await expect(email).toBeFocused();

  await email.fill("alex@example.test");
  await scenario.click();
  await page.getByRole("option", {name:"No roles"}).click();
  await expect(role).toBeDisabled();
  await expect(submit).toBeDisabled();
  await expect(email).toHaveValue("alex@example.test");

  await scenario.click();
  await page.getByRole("option", {name:"Sending"}).click();
  await expect(submit).toHaveAttribute("aria-disabled", "true");
  await expect(email).toHaveAttribute("readonly", "");
  await expect(outcome).not.toBeVisible();

  await scenario.click();
  await page.getByRole("option", {name:"Failed"}).click();
  await expect(page.getByText("Couldn’t send the invitation. Try again.", {exact:true})).toBeVisible();
  await expect(email).toHaveValue("alex@example.test");
  await expect(role).toHaveAccessibleDescription("Can create and update issues in this project.");
  await submit.click();
  await expect(outcome).toBeVisible();
});
