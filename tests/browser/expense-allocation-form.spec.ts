import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("ExpenseAllocationForm keeps a draft and reconciles the changed total exactly", async ({ page }, info) => {
  await page.goto("/components/expense-allocation-form");
  const stage = page.locator(".preview-stage");
  const form = stage.getByRole("form", { name: "Split expense" });
  const operations = form.getByRole("textbox", { name: "Operations" });
  const growth = form.getByRole("textbox", { name: "Growth" });
  const submit = form.getByRole("button", { name: "Save split" });
  const total = page.getByRole("combobox", { name: "ExpenseAllocationForm prop total" });
  const accept = page.getByRole("checkbox", { name: "ExpenseAllocationForm prop accept" });
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "ExpenseAllocationForm prop narrow" }).check();
    await chooseSelectOption(page.getByRole("combobox", { name: "ExpenseAllocationForm prop surface" }), "overlay");
  }
  await expect(submit).toBeEnabled();
  await operations.fill("60.15x");
  await submit.click();
  await expect(stage.getByText("Split saved", { exact: true })).toHaveCount(0);
  await operations.fill("60.15");
  await chooseSelectOption(total, "90.00");
  await expect(form.getByText("Over by", { exact: true })).toBeVisible();
  await expect(form.getByText("$10.00", { exact: true })).toBeVisible();
  await expect(submit).toBeDisabled();
  await chooseSelectOption(total, "120.01");
  await expect(operations).toHaveValue("60.15");
  await expect(growth).toHaveValue("39.85");
  await expect(form.getByText("$20.01", { exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const panel = (await stage.locator(".flood-surface").boundingBox())!;
  const canvas = (await stage.boundingBox())!;
  expect(panel.y).toBeGreaterThan(canvas.y);
  expect(panel.y + panel.height).toBeLessThan(canvas.y + canvas.height);
  await stage.screenshot({ path: info.outputPath("expense-allocation-form.png"), animations: "disabled" });

  await growth.fill("59.86");
  await expect(form.getByText("$0.00", { exact: true })).toBeVisible();
  await accept.uncheck();
  await submit.press("Enter");
  await expect(form.getByRole("alert")).toHaveText("The split could not be saved. Try again.");
  await expect(growth).toHaveValue("59.86");
  await accept.check();
  await submit.click();
  await expect(stage.getByText("Split saved", { exact: true })).toBeVisible();
});
