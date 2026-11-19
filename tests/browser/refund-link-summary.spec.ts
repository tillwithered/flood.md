import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("RefundLinkSummary keeps the individual refund and accepted purchase distinct", async ({page}, info) => {
  await page.goto("/components/refund-link-summary");
  const panel = page.locator(".preview-stage .flood-surface");
  const valueFor = (label: string) => panel.getByText(label, {exact:true}).locator("..").locator("dd");
  const scenario = page.getByRole("combobox", {name:"Scenario",exact:true});

  await expect(valueFor("Purchase")).toContainText("Northstar Supply");
  await expect(valueFor("Charge")).toHaveText("186.40 USD");
  await expect(valueFor("This refund")).toHaveText("42.00 USD");
  await expect(valueFor("Purchase").locator("time")).toHaveAttribute("datetime","2026-11-12");
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("refund-link-summary.png")});

  await chooseSelectOption(scenario,"Synced");
  await page.getByRole("checkbox", {name:"RefundLinkSummary prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox", {name:"RefundLinkSummary prop surface"}),"overlay");
  await expect(panel.getByText(/locked because the refund has synced/)).toBeVisible();
  await expect(valueFor("Charge")).toHaveText("186.40 USD");
  expect(await panel.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("refund-link-summary-narrow.png")});

  await chooseSelectOption(scenario,"Unlinked");
  await expect(panel.getByText("No purchase linked.")).toBeVisible();
  await expect(valueFor("Charge")).toHaveCount(0);
  await chooseSelectOption(scenario,"Unavailable");
  await expect(panel.getByText("Link details unavailable.")).toBeVisible();
  await expect(valueFor("This refund")).toHaveText("42.00 USD");
});
