import {expect, test} from "@playwright/test";

test("access requests preserve the draft on failure and route focus to the accepted outcome", async ({page}) => {
  await page.goto("/components/access-request-form");
  const form = page.getByRole("form", {name:"Request access"});
  const message = form.getByRole("textbox", {name:"Message"});
  const submit = form.getByRole("button", {name:"Request access"});
  const scenario = page.getByRole("combobox", {name:/scenario/i});
  const changeScenario = async (name: string) => {
    await scenario.click();
    await page.getByRole("option", {name,exact:true}).click();
  };

  await expect(form.getByText("Release roadmap", {exact:true})).toBeVisible();
  await expect(form.getByText("maya@example.test", {exact:true})).toBeVisible();
  await changeScenario("Unavailable");
  await expect(form.getByRole("status")).toHaveText("This project only allows invitations from its owners.");
  await expect(submit).toHaveCount(0);

  await changeScenario("Ready");
  await message.fill("I’m preparing the launch notes.");
  await changeScenario("Sending");
  await expect(form).toHaveAttribute("aria-busy", "true");
  await expect(submit).toHaveAttribute("aria-disabled", "true");
  await expect(message).toHaveAttribute("readonly", "");
  await expect(message).toHaveValue("I’m preparing the launch notes.");

  await changeScenario("Failed");
  await expect(form.getByRole("alert")).toContainText("Try again.");
  await expect(message).toHaveValue("I’m preparing the launch notes.");
  await submit.focus();
  await page.keyboard.press("Enter");
  const result = form.getByRole("status");
  await expect(result).toHaveText("Request sent. Waiting for approval.");
  await expect(result).toBeFocused();
  await expect(submit).toHaveCount(0);
});
