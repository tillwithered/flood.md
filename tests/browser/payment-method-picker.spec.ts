import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("PaymentMethodPicker compares quotes and omits a method that becomes unavailable", async ({page}, info) => {
  await page.goto("/components/payment-method-picker");
  const panel = page.locator(".preview-stage .flood-surface");
  const form = panel.getByRole("form",{name:"Payment setup"});
  const standard = form.getByRole("radio",{name:/Standard ACH/});
  const priority = form.getByRole("radio",{name:/Priority ACH/});
  const wire = form.getByRole("radio",{name:/Domestic wire/});
  const scenario = page.getByRole("combobox",{name:"Scenario",exact:true});
  const selected = () => form.evaluate(node=>new FormData(node as HTMLFormElement).get("method"));
  await expect(standard).toBeChecked();
  await expect(wire).toBeDisabled();
  await expect(form.getByText("Recipient routing details missing")).toBeVisible();
  await expect(form.getByText("$0.00 fee",{exact:true})).toBeVisible();
  await expect(form.getByText("$8.00 fee",{exact:true})).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  await panel.screenshot({path:info.outputPath("payment-method-picker.png"),animations:"disabled"});

  await chooseSelectOption(scenario,"Method unavailable");
  await expect(standard).toBeDisabled();
  await expect(standard).not.toBeChecked();
  await expect(priority).not.toBeChecked();
  await expect.poll(selected).toBeNull();
  await expect(form.getByText("Bank account verification required")).toBeVisible();
  await priority.press("Space");
  await expect.poll(selected).toBe("priority");

  await chooseSelectOption(scenario,"Missing quote");
  await expect(form.getByText("Arrival not available")).toBeVisible();
  await expect(form.getByText("Fee unavailable")).toBeVisible();
  await expect(form.getByText("$0.00 fee",{exact:true})).toBeVisible();
  await expect.poll(selected).toBe("priority");
  await page.getByRole("checkbox",{name:"PaymentMethodPicker prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox",{name:"PaymentMethodPicker prop surface"}),"overlay");
  expect(await panel.evaluate(node=>node.scrollWidth-node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("payment-method-picker-narrow.png"),animations:"disabled"});
  await chooseSelectOption(scenario,"Empty");
  await expect(form.getByText("No payment methods available.")).toBeVisible();
  await expect.poll(selected).toBeNull();
});
