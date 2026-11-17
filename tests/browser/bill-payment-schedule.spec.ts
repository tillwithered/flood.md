import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("BillPaymentSchedule separates the balance from payment state and unknown records", async ({page}, info) => {
  await page.goto("/components/bill-payment-schedule");
  const panel = page.locator(".preview-stage .flood-surface");
  const scenario = page.getByRole("combobox", {name:"Scenario",exact:true});
  const payments = panel.getByRole("list", {name:"Payments"});
  const first = payments.getByRole("listitem").filter({hasText:"First payment"});
  const second = payments.getByRole("listitem").filter({hasText:"Second payment"});
  await expect(panel.getByText("$2,400.00", {exact:true})).toBeVisible();
  await expect(panel.getByText("$1,600.00", {exact:true})).toBeVisible();
  await expect(panel.getByText(/\$400\.00 unscheduled/)).toBeVisible();
  await expect(first.getByText("Paid", {exact:true}).filter({visible:true})).toBeVisible();
  await expect(second.getByText("Scheduled", {exact:true}).filter({visible:true})).toBeVisible();
  await expect(second.locator("time")).toHaveAttribute("datetime","2026-11-24");
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("bill-payment-schedule.png"), animations:"disabled"});

  await chooseSelectOption(scenario, "Needs release");
  await page.getByRole("checkbox", {name:"BillPaymentSchedule prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox", {name:"BillPaymentSchedule prop surface"}), "overlay");
  await expect(second.getByText("Awaiting release",{exact:true}).filter({visible:true})).toBeVisible();
  await expect(panel.getByText("$1,600.00", {exact:true})).toBeVisible();
  expect(await panel.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  const summary = panel.getByRole("group", {name:"Bill amounts"});
  const summaryAmounts = summary.getByText(/^\$(1,600|2,400)\.00$/);
  const summaryEdges = await summaryAmounts.evaluateAll(nodes => nodes.map(node => {
    const text = document.createRange();
    text.selectNodeContents(node);
    const fragments = text.getClientRects();
    return {lines:fragments.length,right:fragments[0].right};
  }));
  expect(summaryEdges.map(({lines}) => lines)).toEqual([1,1]);
  expect(Math.abs(summaryEdges[0].right - summaryEdges[1].right)).toBeLessThanOrEqual(1);
  const amounts = payments.getByText(/^\$[\d,.]+$/);
  const edges = await amounts.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().right));
  expect(edges).toHaveLength(2);
  expect(Math.abs(edges[0] - edges[1])).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("bill-payment-schedule-narrow.png"), animations:"disabled"});

  await chooseSelectOption(scenario, "No payments");
  await expect(panel.getByText("No payments recorded.")).toBeVisible();
  await expect(payments).toHaveCount(0);
  await chooseSelectOption(scenario, "Paid");
  await expect(panel.getByText("$0.00", {exact:true})).toBeVisible();
  await expect(payments.getByText("Paid", {exact:true}).filter({visible:true})).toHaveCount(2);
  await chooseSelectOption(scenario, "Unavailable");
  await expect(panel.getByText("Payment details unavailable.")).toBeVisible();
  await expect(panel.getByText("Unavailable", {exact:true})).toBeVisible();
  await expect(panel.getByText("$0.00", {exact:true})).toHaveCount(0);
});
