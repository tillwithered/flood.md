import { expect, test } from "@playwright/test";

test("Questionnaire validates, preserves answers on back, and completes", async ({ page }, info) => {
  await page.goto("/components/questionnaire");
  const preview = page.locator(".preview-stage");
  await preview.getByRole("button", { name: "Next" }).click();
  await expect(preview.getByText("Choose an answer.")).toBeVisible();
  await preview.getByRole("radio", { name: "Other" }).check();
  await preview.getByRole("textbox", { name: "Other" }).fill("Documentation site");
  await preview.getByRole("button", { name: "Next" }).click();
  await expect(preview.getByRole("heading", { name: "What do you need first?" })).toBeFocused();
  await preview.getByRole("checkbox", { name: "Forms" }).check();
  await preview.getByRole("button", { name: "Back" }).click();
  await expect(preview.getByRole("textbox", { name: "Other" })).toHaveValue("Documentation site");
  await preview.screenshot({ path: info.outputPath("questionnaire.png") });
  await preview.getByRole("button", { name: "Next" }).click();
  await expect(preview.getByRole("checkbox", { name: "Forms" })).toBeChecked();
  await preview.getByRole("button", { name: "Submit" }).click();
  await expect(preview.getByRole("heading", { name: "Complete" })).toBeFocused();
});

test("EventCalendar exposes overflow details and moves between months", async ({ page }, info) => {
  await page.goto("/components/event-calendar");
  const preview = page.locator(".preview-stage");
  await expect(preview.getByRole("table", { name: "Team events" })).toBeVisible();
  await preview.screenshot({ path: info.outputPath("event-calendar.png") });
  const overflow = preview.getByRole("button", { name: /\+1 more|3 events/ });
  await overflow.click();
  await page.getByRole("button", { name: "Retro", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Retro", exact: true })).toBeFocused();
  await expect(page.getByText("15:00–15:45 · Engineering", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("button", { name: "Retro", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(overflow).toBeFocused();
  await preview.getByRole("button", { name: "Next month" }).click();
  await expect(preview.getByRole("heading", { name: "November 2026" })).toBeVisible();
  await expect(preview.getByRole("button", { name: "Project kickoff" })).toHaveCount(0);
});

test("EditableGrid mounts a window and edits a record across a virtual jump", async ({ page }, info) => {
  await page.goto("/components/editable-grid");
  const setting = page.getByRole("checkbox", { name: "EditableGrid prop virtualRows" });
  await setting.check();
  const grid = page.getByRole("grid", { name: "Inventory quantities" });
  await expect(grid).toHaveAttribute("aria-rowcount", "1205");
  expect(await grid.getByRole("row").count()).toBeLessThan(30);
  const notebook = grid.getByRole("gridcell", { name: "Notebook", exact: true });
  await notebook.focus();
  await notebook.press("Control+End");
  const bottom = grid.getByRole("row").filter({ hasText: "Inventory item 1200" }).getByRole("gridcell").last();
  await expect(bottom).toBeFocused();
  await expect(bottom).toBeInViewport();
  await bottom.press("Enter");
  const editor = grid.getByRole("textbox", { name: "Edit Reserved, Inventory item 1200" });
  await editor.fill("123");
  await editor.press("Enter");
  await expect(bottom).toBeFocused();
  await expect(bottom).toHaveText("123");
  await page.locator(".preview-stage").screenshot({ path: info.outputPath("virtual-editable-grid.png") });
  await bottom.press("Control+Home");
  await expect(notebook).toBeFocused();
  const resize = grid.getByRole("separator", { name: "Resize In stock column" });
  const width = Number(await resize.getAttribute("aria-valuenow"));
  await resize.press("ArrowRight");
  await expect(resize).toHaveAttribute("aria-valuenow", String(width + 8));
});

test("Inventory Grid filters thousands of rows and recalculates the summary", async ({ page }) => {
  await page.goto("/playground/inventory-grid");
  const grid = page.getByRole("grid", { name: "Inventory", exact: true });
  await expect(grid).toHaveAttribute("aria-rowcount", "1601");
  const filter = page.getByRole("searchbox", { name: "Filter products" });
  await filter.fill("Notebook 1");
  await expect(page.getByRole("status")).toContainText("111 products");
  await filter.fill("Notebook 400");
  await expect(grid).toHaveAttribute("aria-rowcount", "2");
  const stock = grid.getByRole("row").nth(1).getByRole("gridcell").nth(1);
  await stock.press("Enter");
  const editor = grid.getByRole("textbox", { name: "Edit In stock, Notebook 400" });
  await editor.fill("300");
  await editor.press("Enter");
  await expect(page.getByRole("status")).toHaveText("1 product · 300 units in stock");
});

test("DualListSelector transfers an item between independently filtered panes", async ({ page }) => {
  await page.goto("/components/dual-list-selector");
  const preview = page.locator(".preview-stage");
  await preview.getByRole("searchbox", { name: "Search available" }).fill("Mira");
  await preview.getByRole("option", { name: "Mira Chen" }).click();
  await preview.getByRole("button", { name: "Add selected" }).click();
  const assigned = preview.getByRole("listbox", { name: "Assigned" });
  await expect(assigned.getByRole("option", { name: "Mira Chen" })).toBeVisible();
  await assigned.getByRole("option", { name: "Mira Chen" }).click();
  await preview.getByRole("button", { name: "Remove selected" }).click();
  await expect(assigned.getByRole("option", { name: "Mira Chen" })).toHaveCount(0);
});
