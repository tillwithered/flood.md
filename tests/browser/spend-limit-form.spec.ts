import {expect, test} from "@playwright/test";

test("spending alerts and hard limits remain independent exact amounts", async ({page}) => {
  await page.goto("/components/spend-limit-form");
  const form = page.getByRole("form", {name:"Save limits"});
  const threshold = form.getByRole("textbox", {name:"Spending alert"});
  const cap = form.getByRole("textbox", {name:"Hard limit"});
  const save = form.getByRole("button", {name:"Save limits"});
  const outcome = page.getByText("Limits saved.", {exact:true});

  await expect(cap).toHaveAccessibleDescription(/Pauses compute workloads/);
  await threshold.fill("125.00");
  await save.click();
  await expect(threshold).toBeFocused();
  await expect(form.getByRole("alert")).toHaveText("Set the spending alert below the hard limit.");
  await expect(outcome).not.toBeVisible();

  await threshold.fill("9007199254740992.00");
  await cap.fill("9007199254740992.01");
  await save.click();
  await expect(form.getByRole("alert")).toHaveCount(0);
  await expect(outcome).toBeVisible();

  await cap.fill("");
  await threshold.fill("0");
  await save.click();
  await expect(outcome).toBeVisible();
  await expect(threshold).toHaveValue("0.00");
  await expect(cap).toHaveValue("");

  await page.getByRole("combobox", {name:/scenario/i}).click();
  await page.getByRole("option", {name:"Saving",exact:true}).click();
  await expect(form).toHaveAttribute("aria-busy", "true");
  await expect(threshold).toHaveAttribute("readonly", "");
  await expect(save).toHaveAttribute("aria-disabled", "true");
});
