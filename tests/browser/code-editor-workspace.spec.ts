import { expect, test } from "@playwright/test";

test("query workspace runs the host adapter, resizes and retains results after errors", async ({ page }, info) => {
  await page.setViewportSize({ width: 1360, height: 960 });
  await page.goto("/playground/code-editor");
  const editor = page.getByRole("textbox",{name:"SQL query",exact:true});
  await expect(editor).toBeVisible();
  await editor.press("Control+Enter");
  const results = page.getByRole("table",{name:"Query results",exact:true});
  await expect(results.getByText("REQ-1042")).toBeVisible();
  await expect(editor).toBeFocused();
  await page.evaluate(()=>document.fonts.ready);
  await page.locator("main").screenshot({path:info.outputPath("query-workspace-results.png")});

  await page.getByRole("radio",{name:"Side by side",exact:true}).check();
  const separator = page.getByRole("separator",{name:"Resize editor and results",exact:true});
  await expect(separator).toHaveAttribute("aria-valuenow","49");
  await separator.press("ArrowRight");
  await expect(separator).toHaveAttribute("aria-valuenow","50");
  await expect(results.getByText("REQ-1042")).toBeVisible();
  await editor.fill("SELECT * FROM missing");
  await editor.press("Control+Enter");
  await expect(page.getByRole("alert")).toContainText("Query failed");
  await expect(results.getByText("REQ-1042")).toBeVisible();
  await expect(editor).toHaveValue("SELECT * FROM missing");
  await page.locator("main").screenshot({path:info.outputPath("query-workspace-error.png")});
});
