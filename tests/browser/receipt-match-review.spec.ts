import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("ReceiptMatchReview keeps source values and reported discrepancies legible", async ({ page }, info) => {
  await page.goto("/components/receipt-match-review");
  const stage = page.locator(".preview-stage");
  const table = stage.getByRole("table", { name: "Receipt match" });
  const amount = table.getByRole("row").filter({ has: page.getByRole("rowheader", { name: /Amount/ }) });
  const scenario = page.getByRole("region", { name: "Preview properties" })
    .getByRole("combobox", { name: "Scenario", exact: true });

  if (info.project.name === "mobile") {
    await chooseSelectOption(page.getByRole("combobox", { name: "ReceiptMatchReview prop surface" }), "overlay");
    await page.getByRole("checkbox", { name: "ReceiptMatchReview prop narrow" }).check();
  }

  await expect(stage.getByText("Needs review", { exact: true })).toBeVisible();
  await expect(amount.getByRole("cell")).toHaveText(["$128.40", "$182.40"]);
  await expect(amount.getByRole("rowheader")).toHaveText(/Amount\s*Differs/);
  const viewport = stage.locator(".flood-table-container .flood-scroll-area__viewport");
  await expect.poll(() => viewport.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await page.evaluate(() => document.fonts.ready);
  const transactionHeading = table.getByRole("columnheader", { name: "Transaction" });
  await expect.poll(() => transactionHeading.evaluate(node => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getClientRects().length;
  })).toBe(1);
  await stage.screenshot({ path: info.outputPath("receipt-match-review.png"), animations: "disabled" });

  await chooseSelectOption(scenario, "Verified");
  await expect(stage.getByText("Verified", { exact: true })).toBeVisible();
  await expect(amount.getByRole("cell")).toHaveText(["$128.40", "$128.40"]);
  await expect(table.getByText("Differs", { exact: true })).toHaveCount(0);

  await chooseSelectOption(scenario, "Missing evidence");
  await expect(stage.getByText("Unverified", { exact: true })).toBeVisible();
  await expect(amount.getByRole("cell")).toHaveText(["Unavailable", "$182.40"]);
  await expect(table.getByText("Differs", { exact: true })).toHaveCount(0);
});
