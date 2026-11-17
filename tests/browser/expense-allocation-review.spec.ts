import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("ExpenseAllocationReview keeps recorded lines when the source total changes", async ({page}, info) => {
  await page.goto("/components/expense-allocation-review");
  const stage = page.locator(".preview-stage");
  const review = stage.getByRole("group", {name:"Expense allocation",exact:true});
  const scenario = page.getByRole("combobox", {name:"Scenario",exact:true});
  const status = (label: string) => review.getByText(label,{exact:true}).filter({visible:true});
  const surface = stage.locator(".flood-surface");
  await expect(review.locator("dd")).toHaveText(["$60.15","$39.85","$120.01"]);
  await expect(status("$20.01 unallocated")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await surface.screenshot({path:info.outputPath("expense-allocation-review.png")});

  await chooseSelectOption(scenario,"Balanced");
  await expect(review.locator("dd")).toHaveText(["$60.15","$39.85","$100.00"]);
  await expect(status("$20.01 unallocated")).toHaveCount(0);
  await chooseSelectOption(scenario,"Overallocated");
  await expect(review.locator("dd")).toHaveText(["$60.15","$39.85","$90.00"]);
  await expect(status("$10.00 over the expense total")).toBeVisible();
  await page.getByRole("checkbox", {name:"ExpenseAllocationReview prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox", {name:"ExpenseAllocationReview prop surface"}),"overlay");
  await expect.poll(() => surface.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await surface.screenshot({path:info.outputPath("expense-allocation-review-narrow.png")});

  await chooseSelectOption(scenario,"No split");
  await expect(status("No allocation recorded.")).toBeVisible();
  await expect(review.locator("dd")).toHaveText(["$100.00"]);
  await expect(review.locator(".flood-status-indicator")).toHaveCount(0);
});
