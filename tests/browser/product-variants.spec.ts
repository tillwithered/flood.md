import {expect, test, type Locator} from "@playwright/test";

function paste(cell: Locator, data: string) {
  return cell.evaluate((node, value) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", value);
    node.dispatchEvent(new ClipboardEvent("paste", {clipboardData, bubbles:true, cancelable:true}));
  }, data);
}

test("Product variants validates the whole SKU and price batch before committing a draft", async ({page}, info) => {
  await page.goto("/playground/product-variants");
  const grid = page.getByRole("grid", {name:"Product variants"});
  const rows = grid.getByRole("row");
  const firstSku = rows.nth(1).getByRole("gridcell").nth(2);
  const secondSku = rows.nth(2).getByRole("gridcell").nth(2);
  const firstPrice = rows.nth(1).getByRole("gridcell").nth(3);
  const firstStock = rows.nth(1).getByRole("gridcell").nth(4);
  const save = page.getByRole("button", {name:"Save variants"});
  const discard = page.getByRole("button", {name:"Discard changes"});
  await expect(save).toBeDisabled();
  await firstSku.focus();
  await paste(firstSku,"ct-slate-m\t72.5\t5");
  await expect(page.getByRole("status").filter({hasText:"SKU CT-SLATE-M is already used by another variant."})).toBeVisible();
  await expect(firstPrice).toHaveText("38.00");
  await expect(firstStock).toHaveText("18");
  await expect(firstSku).toBeFocused();

  await paste(firstSku,"ct-slate-m\t72.5\t005\nct-slate-s\t23\t17");
  await expect(firstSku).toHaveText("CT-SLATE-M");
  await expect(secondSku).toHaveText("CT-SLATE-S");
  await expect(firstPrice).toHaveText("72.50");
  await expect(firstStock).toHaveText("5");
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.getByRole("status").filter({hasText:"Changes saved"})).toBeVisible();

  await firstStock.focus();
  await paste(firstStock,"6");
  await expect(firstStock).toHaveText("6");
  await discard.click();
  await expect(firstStock).toHaveText("5");
  await expect(save).toBeDisabled();
  await page.screenshot({path: info.outputPath("product-variants.png")});
});

test("Variant options regenerate the matrix and prevent editing incompatible offers", async ({page}, info) => {
  await page.goto("/playground/product-variants");
  const size = page.getByRole("textbox", {name:"Sizes"});
  await size.fill("XL");
  await size.press("Enter");
  const grid = page.getByRole("grid", {name:"Product variants"});
  const compatible = grid.getByRole("row").filter({hasText:"CT-SLATE-XL"});
  await expect(compatible).toBeVisible();
  const incompatible = grid.getByRole("row").filter({hasText:"XL · unavailable"});
  const price = incompatible.getByRole("gridcell").nth(3);
  await expect(price).toHaveAttribute("aria-readonly", "true");
  await expect(price).toHaveText("—");
  await price.focus();
  await paste(price,"40");
  await expect(grid.getByRole("textbox")).toHaveCount(0);
  await expect(price).toHaveText("—");
  await expect(page.getByRole("status").filter({hasText:"The selection includes a read-only cell."})).toBeVisible();
  await page.screenshot({path:info.outputPath("product-variant-dimensions.png")});
  await page.getByRole("button", {name:"Discard changes"}).click();
  await expect(incompatible).toHaveCount(0);
  await expect(compatible).toHaveCount(0);
});
