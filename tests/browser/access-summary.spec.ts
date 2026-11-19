import { expect, test } from "@playwright/test";

test("AccessSummary keeps capability labels with their resources at narrow widths", async ({ page }, info) => {
  await page.goto("/components/access-summary");
  const summary = page.getByRole("region", { name: "Expense assistant" });
  const list = summary.getByRole("list", { name: "Permissions" });
  const notes = list.getByRole("listitem").filter({ hasText: "Review notes" });
  const payments = list.getByRole("listitem").filter({ hasText: "Payments" });
  await expect(summary.getByText("Maya Chen", { exact: true })).toBeVisible();
  await expect(notes.getByText("View and edit", { exact: true })).toBeVisible();
  await expect(payments.getByText("No access", { exact: true })).toBeVisible();

  await page.getByRole("checkbox", { name: "AccessSummary prop narrow" }).check();
  await expect.poll(() => summary.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await expect.poll(async () => {
    const name = await notes.getByText("Review notes", { exact: true }).boundingBox();
    const access = await notes.getByText("View and edit", { exact: true }).boundingBox();
    return Math.abs(name!.y - access!.y);
  }).toBeLessThan(5);
  await page.evaluate(() => document.fonts.ready);
  await summary.screenshot({ path: info.outputPath("access-summary-narrow.png") });

  const mode = page.getByRole("combobox", { name: "AccessSummary prop mode" });
  await mode.click();
  await page.getByRole("option", { name: "Read only", exact: true }).click();
  await expect(notes.getByText("View only", { exact: true })).toBeVisible();
  await expect(payments.getByText("No access", { exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: "AccessSummary prop delegated" }).uncheck();
  await expect(summary.getByText("Maya Chen", { exact: true })).toHaveCount(0);

  await mode.click();
  await page.getByRole("option", { name: "Empty", exact: true }).click();
  await expect(summary.getByText("No permissions to display.", { exact: true })).toBeVisible();
  await expect(list).toHaveCount(0);
});
