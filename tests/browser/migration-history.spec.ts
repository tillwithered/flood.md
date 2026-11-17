import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("MigrationHistory distinguishes missing history from unavailable evidence", async ({ page }, info) => {
  await page.goto("/components/migration-history");
  const stage = page.locator(".preview-stage");
  const table = stage.getByRole("table", { name: "Migration history" });
  const invoice = table.getByRole("row").filter({ has: page.getByRole("rowheader", { name: /Add invoice index/ }) });
  const scrollport = stage.locator(".flood-table-container .flood-scroll-area__viewport");
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  const staging = page.getByRole("checkbox", { name: "MigrationHistory prop staging" });

  if (info.project.name === "mobile") {
    await chooseSelectOption(page.getByRole("combobox", { name: "MigrationHistory prop surface" }), "overlay");
    await page.getByRole("checkbox", { name: "MigrationHistory prop narrow" }).check();
  }
  await expect(table.getByRole("columnheader")).toHaveText(["Migration", "Repository", "Production"]);
  await expect(invoice.getByRole("rowheader")).toContainText("20261116091500");
  await expect(invoice.getByRole("cell")).toHaveText(["Recorded", "Missing"]);
  await expect.poll(() => scrollport.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => table.getByRole("columnheader", { name: "Production" }).evaluate(node => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getClientRects().length;
  })).toBe(1);
  await stage.screenshot({ path: info.outputPath("migration-history.png"), animations: "disabled" });

  await staging.check();
  await expect(invoice.getByRole("cell")).toHaveText(["Recorded", "Recorded", "Missing"]);
  if (info.project.name === "mobile") {
    const pinned = invoice.getByRole("rowheader");
    const x = (await pinned.boundingBox())!.x;
    await scrollport.evaluate(node => { node.scrollLeft = node.scrollWidth; });
    await expect.poll(() => scrollport.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
    await expect.poll(async () => Math.abs((await pinned.boundingBox())!.x - x)).toBeLessThanOrEqual(1);
  }

  await chooseSelectOption(scenario, "In sync");
  await expect(invoice.getByRole("cell")).toHaveText(["Recorded", "Recorded", "Recorded"]);
  await chooseSelectOption(scenario, "Production unavailable");
  await expect(invoice.getByRole("cell")).toHaveText(["Recorded", "Recorded", "Unknown"]);
  await expect(table.getByText("Missing", { exact: true })).toHaveCount(0);
  await chooseSelectOption(scenario, "Empty");
  await expect(table.getByText("No migrations recorded.")).toBeVisible();
});
