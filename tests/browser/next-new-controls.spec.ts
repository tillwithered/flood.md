import { test, expect, type Page } from "@playwright/test";

const url = () => `${process.env.FLOOD_NEXT_TEST_URL ?? "http://127.0.0.1:3001"}/new-controls`;
async function open(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && /hydrat|server.render|did not match/i.test(message.text())) errors.push(message.text());
  });
  await page.goto(url());
  await expect(page.locator('main[data-hydrated="true"]')).toBeVisible();
  return errors;
}
const data = (page: Page) => page.locator("#new-controls-form").evaluate((form: HTMLFormElement) => [...new FormData(form)]);
const initial = [["delivery", "2026-10-26"], ["tripStart", "2026-10-10"], ["tripEnd", "2026-10-14"], ["project", "Flood"], ["topics", "Design"]];

test("Next server-renders and hydrates canonical new-control form values through submit and reset", async ({ page, request }) => {
  const response = await request.get(url());
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(html).toContain("New controls integration");
  expect(html).toMatch(/name="delivery"[^>]*value="2026-10-26"/);
  expect(html).toMatch(/name="tripStart"[^>]*value="2026-10-10"/);
  expect(html).toMatch(/name="topics"[^>]*value="Design"/);
  const errors = await open(page);
  expect(await data(page)).toEqual(initial);
  await page.getByRole("button", { name: "Choose delivery", exact: true }).click();
  const delivery = page.getByRole("dialog", { name: "Delivery calendar", exact: true });
  await delivery.locator('[data-calendar-date="2026-10-28"]').click();
  await expect(delivery).toBeHidden();
  await page.getByRole("button", { name: "Choose trip", exact: true }).click();
  const trip = page.getByRole("dialog", { name: "Trip calendar", exact: true });
  await trip.locator('[data-calendar-date="2026-10-20"]').click();
  await trip.locator('[data-calendar-date="2026-10-25"]').click();
  await expect(trip).toBeHidden();
  await page.locator("#integration-name").getByRole("button").click();
  const name = page.getByRole("textbox", { name: "Project name", exact: true });
  await name.fill("Next project"); await name.press("Enter");
  const tags = page.getByRole("textbox", { name: "Topics", exact: true });
  await tags.fill("React"); await tags.press("Enter");
  const changed = [["delivery", "2026-10-28"], ["tripStart", "2026-10-20"], ["tripEnd", "2026-10-25"], ["project", "Next project"], ["topics", "Design"], ["topics", "React"]];
  await page.getByRole("button", { name: "Save controls", exact: true }).click();
  await expect(page.getByRole("status", { name: "Submitted controls", exact: true })).toHaveText(JSON.stringify(changed));
  await page.getByRole("button", { name: "Reset controls", exact: true }).click();
  await expect.poll(() => data(page)).toEqual(initial);
  expect(errors).toEqual([]);
});

test("Next nested date and action layers restore focus without closing their parent dialog", async ({ page }) => {
  const errors = await open(page);
  const opener = page.getByRole("button", { name: "Open project editor", exact: true });
  await opener.click();
  const editor = page.getByRole("dialog", { name: "Project editor", exact: true });
  const trigger = editor.getByRole("button", { name: "Choose review", exact: true });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Review calendar", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Review calendar", exact: true })).toBeHidden();
  await expect(editor).toBeVisible(); await expect(trigger).toBeFocused();
  await editor.getByRole("button", { name: "Editor actions", exact: true }).click();
  const rootMenu = page.getByRole("menu", { name: "Editor actions", exact: true });
  await rootMenu.getByRole("menuitem", { name: "Export", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("menu", { name: "Export", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(rootMenu).toBeVisible();
  await page.keyboard.press("Escape"); await expect(rootMenu).toBeHidden();
  const source = editor.getByRole("button", { name: "Project document", exact: true });
  await source.focus(); await page.keyboard.press("Shift+F10");
  const context = page.getByRole("menu", { name: "Document actions", exact: true });
  await context.getByRole("menuitem", { name: "Export", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await page.getByRole("menu", { name: "Export", exact: true }).getByRole("menuitem", { name: "PDF", exact: true }).click();
  await expect(context).toBeHidden(); await expect(source).toBeFocused(); await expect(editor).toBeVisible();
  await expect(page.locator('output[aria-label="Invoked action"]')).toHaveText("pdf");
  await page.keyboard.press("Escape"); await expect(editor).toBeHidden(); await expect(opener).toBeFocused();
  expect(errors).toEqual([]);
});

test("Next hydrates selection hierarchy and native navigation with distinct semantics", async ({ page }) => {
  const errors = await open(page);
  const tree = page.getByRole("tree", { name: "Project files", exact: true });
  await tree.getByRole("treeitem", { name: "Source", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  const button = tree.getByRole("treeitem", { name: "Button", exact: true });
  await expect(button).toBeFocused(); await expect(button).not.toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Enter"); await expect(button).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("status", { name: "Selected file", exact: true })).toHaveText("button");
  const nav = page.getByRole("navigation", { name: "Integration navigation", exact: true });
  const link = nav.getByRole("link", { name: "Forms", exact: true });
  await expect(link).toHaveAttribute("aria-current", "page");
  await nav.getByRole("button", { name: "Collapse Guides", exact: true }).click(); await expect(link).toHaveCount(0);
  await nav.getByRole("button", { name: "Expand Guides", exact: true }).click();
  await link.click(); await expect(page).toHaveURL(/#integration-forms$/);
  expect(errors).toEqual([]);
});
