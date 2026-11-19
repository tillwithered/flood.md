import {expect, test} from "@playwright/test";
import {chooseSelectOption, selectBridge} from "./select-helpers";

test("DatabaseWebhookForm keeps a draft while validating its destination and table", async ({page}, info) => {
  await page.goto("/components/database-webhook-form");
  const panel = page.locator(".preview-stage .flood-surface");
  const form = panel.getByRole("form",{name:"New database webhook"});
  const table = form.getByRole("combobox",{name:"Table"});
  const update = form.getByRole("checkbox",{name:"UPDATE"});
  const insert = form.getByRole("checkbox",{name:"INSERT"});
  const endpoint = form.getByRole("textbox",{name:"Destination URL"});
  const submit = form.getByRole("button",{name:"Create webhook"});
  const catalog = page.getByRole("combobox",{name:"DatabaseWebhookForm prop catalog"});
  await expect(update).toBeChecked();
  await expect(selectBridge(table)).toHaveValue("exports");
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("database-webhook-form.png"),animations:"disabled"});

  await update.uncheck();
  await expect(submit).toBeDisabled();
  await expect(form.getByText("Choose at least one event.")).toBeVisible();
  await insert.check();
  await update.check();
  await endpoint.fill("https://user@events.example/exports");
  await submit.click();
  await expect(form.getByRole("alert")).toHaveText("Enter an HTTP or HTTPS URL without credentials.");
  await expect(endpoint).toBeFocused();
  await expect(endpoint).toHaveAttribute("aria-invalid","true");
  await endpoint.fill("https://events.example/exports");
  await expect(form.getByRole("alert")).toHaveCount(0);

  await chooseSelectOption(catalog,"Table removed");
  await expect(selectBridge(table)).toHaveValue("");
  await expect(submit).toBeDisabled();
  await expect(insert).toBeChecked();
  await expect(update).toBeChecked();
  await chooseSelectOption(table,"jobs");
  await submit.click();
  await expect(panel.getByRole("status")).toHaveText("Export updates · INSERT, UPDATE");

  await page.getByRole("checkbox",{name:"DatabaseWebhookForm prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox",{name:"DatabaseWebhookForm prop surface"}),"overlay");
  await page.getByRole("checkbox",{name:"DatabaseWebhookForm prop fail"}).check();
  await submit.click();
  await expect(form.getByRole("alert")).toHaveText("This destination is blocked by the project’s outbound policy.");
  await expect(selectBridge(table)).toHaveValue("jobs");
  await expect(update).toBeChecked();
  await expect(endpoint).toHaveValue("https://events.example/exports");
  expect(await panel.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("database-webhook-form-narrow.png"),animations:"disabled"});

  await page.getByRole("checkbox",{name:"DatabaseWebhookForm prop pending"}).check();
  await expect(form).toHaveAttribute("aria-busy","true");
  await expect(insert).toBeDisabled();
  await expect(endpoint).toHaveAttribute("readonly","");
});
