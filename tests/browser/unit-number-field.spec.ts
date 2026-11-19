import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("UnitNumberField keeps the amount when the unit changes and reflows", async ({page}, info) => {
  await page.goto("/components/unit-number-field");
  const field = page.getByRole("group", {name:"Package weight"});
  const amount = field.getByRole("spinbutton", {name:"Amount"});
  const amountControl = field.locator(".flood-input-group");
  const unit = field.getByRole("combobox", {name:"Unit"});
  await expect(amount).toBeVisible();
  await expect(unit).toHaveText("g");
  await amount.fill("12.5");
  await chooseSelectOption(unit, "kg");
  await expect(amount).toHaveValue("12.5");
  await expect(unit).toHaveText("kg");
  await expect.poll(async () => (await amountControl.boundingBox())!.y - (await unit.boundingBox())!.y).toBe(0);
  expect((await amountControl.boundingBox())!.width).toBeGreaterThan((await unit.boundingBox())!.width);
  await field.screenshot({path:info.outputPath("unit-number-field-wide.png")});

  await field.evaluate(node => { (node as HTMLElement).style.inlineSize = "12rem"; });
  expect((await unit.boundingBox())!.y).toBeGreaterThan((await amountControl.boundingBox())!.y);
  await field.screenshot({path:info.outputPath("unit-number-field-narrow.png")});
  await page.getByRole("checkbox", {name:"UnitNumberField prop readOnly"}).check();
  await expect(amount).toHaveAttribute("readonly");
  await expect(field.getByRole("textbox", {name:"Unit"})).toHaveValue("kg");
});
