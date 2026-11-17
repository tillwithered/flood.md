import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("ExpenseSettlement preserves payment direction and reports only confirmed settlement", async ({ page }, info) => {
  await page.goto("/components/expense-settlement");
  const stage = page.locator(".preview-stage");
  const surface = stage.locator(".flood-surface");
  const valueFor = (label: string) => stage.getByText(label, { exact: true }).locator("..").locator("dd");
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  await expect(stage.getByRole("heading", { name: "Reimbursement" })).toBeVisible();
  await expect(valueFor("From")).toHaveText("Studio North");
  await expect(valueFor("To")).toHaveText("Maya Chen");
  await expect(valueFor("Amount")).toHaveText("186.40 USD");
  await expect(stage.getByText("Awaiting payment", { exact: true })).toBeVisible();
  await expect(stage.locator("time")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await surface.screenshot({ path: info.outputPath("expense-settlement.png") });

  await chooseSelectOption(scenario, "Repayment");
  await expect(stage.getByRole("heading", { name: "Repayment", exact: true })).toBeVisible();
  await expect(valueFor("From")).toHaveText("Maya Chen");
  await expect(valueFor("To")).toHaveText("Studio North");
  await expect(valueFor("Amount")).toHaveText("24.00 USD");
  await expect(stage.getByText("Processing", { exact: true })).toBeVisible();

  await chooseSelectOption(scenario, "External payment");
  await page.getByRole("checkbox", { name:"ExpenseSettlement prop narrow" }).check();
  await chooseSelectOption(page.getByRole("combobox", { name:"ExpenseSettlement prop surface" }), "overlay");
  await expect(stage.getByText("Paid externally", { exact:true })).toBeVisible();
  await expect(valueFor("Paid on").locator("time")).toHaveAttribute("datetime", "2026-11-16");
  await expect.poll(() => surface.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await surface.screenshot({ path: info.outputPath("expense-settlement-narrow.png") });

  await chooseSelectOption(scenario, "Failed");
  await expect(stage.getByText("Payment failed", { exact:true })).toBeVisible();
  await expect(stage.getByText("The recipient bank rejected the transfer.")).toBeVisible();
  await expect(stage.locator("time")).toHaveCount(0);
});
