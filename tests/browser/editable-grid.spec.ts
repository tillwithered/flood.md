import {expect, test, type Locator} from "@playwright/test";

const paste = (cell: Locator, value: string) => cell.evaluate((node, value)=>{
  const clipboard = new DataTransfer();
  clipboard.setData("text/plain",value);
  node.dispatchEvent(new ClipboardEvent("paste",{clipboardData:clipboard,bubbles:true,cancelable:true}));
},value);

const copy = (cell: Locator) => cell.evaluate(node=>{
  const clipboard = new DataTransfer();
  node.dispatchEvent(new ClipboardEvent("copy",{clipboardData:clipboard,bubbles:true,cancelable:true}));
  return clipboard.getData("text/plain");
});

test("EditableGrid separates active-cell navigation from a validated edit",async ({page},info)=>{
  await page.goto("/components/editable-grid");
  const grid = page.getByRole("grid",{name:"Inventory quantities"});
  const notebook = grid.getByRole("row").nth(1);
  const product = notebook.getByRole("gridcell").nth(0);
  const stock = notebook.getByRole("gridcell").nth(1);
  const reserved = notebook.getByRole("gridcell").nth(2);
  await expect(grid.locator('[tabindex="0"]')).toHaveCount(1);
  await expect(grid.locator('[aria-selected="true"]')).toHaveCount(0);
  await grid.evaluate(node=>{
    const previous = document.createElement("button");
    previous.textContent = "Before the grid";
    node.closest(".flood-table-container")!.before(previous);
  });
  const previous = page.getByRole("button",{name:"Before the grid"});
  await previous.focus();
  await previous.press("Tab");
  await expect(product).toBeFocused();
  await previous.evaluate(node=>node.remove());
  await product.press("Enter");
  await expect(grid.getByRole("textbox")).toHaveCount(0);
  await product.press("ArrowRight");
  await expect(stock).toBeFocused();
  await stock.press("Enter");
  const editor = grid.getByRole("textbox",{name:"Edit In stock, Notebook"});
  await expect(editor).toBeFocused();
  const cellBounds = (await stock.boundingBox())!;
  const editorBounds = (await editor.boundingBox())!;
  expect(editorBounds.height).toBeLessThan(cellBounds.height);
  expect(editorBounds.width).toBeLessThan(cellBounds.width);
  expect(editorBounds.x + editorBounds.width).toBeGreaterThan(cellBounds.x + cellBounds.width - 10);
  await page.locator(".preview-stage").screenshot({path:info.outputPath("editable-grid-inset-editor.png")});
  await editor.fill("no");
  await editor.press("Enter");
  await expect(editor).toBeFocused();
  await expect(editor).toHaveAttribute("aria-invalid","true");
  const error = page.getByRole("status").filter({hasText:"Enter a whole number of units."});
  await expect(error).toBeVisible();
  await expect(error).toBeInViewport({ratio:1});
  await page.locator(".preview-stage").screenshot({path:info.outputPath("editable-grid-invalid.png")});
  await editor.press("Escape");
  await expect(stock).toHaveText("36");
  await expect(stock).toBeFocused();

  const before = (await reserved.boundingBox())!;
  await stock.press("F2");
  await editor.fill("1200");
  await editor.press("ArrowLeft");
  await expect(editor).toBeFocused();
  expect(await reserved.boundingBox()).toEqual(before);
  await editor.press("Tab");
  await expect(stock).toHaveText("1200");
  await expect(reserved).toBeFocused();
  await expect(grid.locator('[tabindex="0"]')).toHaveCount(1);
});

test("EditableGrid copies a range and accepts or rejects paste as one batch",async ({page},info)=>{
  await page.goto("/components/editable-grid");
  const grid = page.getByRole("grid",{name:"Inventory quantities"});
  const cell = (row:number,column:number) => grid.getByRole("row").nth(row).getByRole("gridcell").nth(column);
  const start=cell(1,1), end=cell(2,2);
  await start.click();
  await start.press("Shift+ArrowRight");
  await cell(1,2).press("Shift+ArrowDown");
  await expect(end).toBeFocused();
  await expect(grid.locator('[aria-selected="true"]')).toHaveCount(4);
  expect(await copy(end)).toBe("36\t4\n124\t32");
  await page.locator(".preview-stage").screenshot({path:info.outputPath("editable-grid-range.png")});
  await paste(end,"18\t3\r\n27\t9\r\n");
  await expect(end).toHaveText("9");
  await expect(start).toHaveText("18");
  await paste(end,"81\t3\n8\tnot a number");
  await expect(end).toHaveText("9");
  await expect(start).toHaveText("18");
  await paste(end,"12");
  await expect(end).toHaveText("12");
  await expect(start).toHaveText("12");
  await cell(1,0).click();
  await paste(cell(1,0),"Replacement\t4");
  await expect(cell(1,0)).toHaveText("Notebook");
  await expect(start).toHaveText("12");
  await expect(page.getByRole("status").filter({hasText:"read-only cell"})).toBeVisible();
  await end.click();
  await paste(end,"1\t2");
  await expect(end).toHaveText("12");
  await expect(page.getByRole("status").filter({hasText:"do not fit"})).toBeVisible();
});
