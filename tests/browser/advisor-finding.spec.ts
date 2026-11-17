import {expect, test} from "@playwright/test";

test("a finding keeps the impact and next step available while evidence opens and closes", async ({page}) => {
  await page.goto("/components/advisor-finding");
  const preview = page.getByRole("region", {name:"AdvisorFinding live playground"});
  const evidence = preview.getByRole("button", {name:"Evidence", exact:true});
  const detail = preview.getByText("The invoice_id foreign key has no supporting index.", {exact:true});
  const impact = preview.getByText("Deleting an invoice can scan invoice lines for references.", {exact:true});
  const remedy = preview.getByRole("link", {name:"Remediation guide"});
  await expect(impact).toBeVisible();
  await expect(remedy).toBeVisible();
  await expect(detail).toBeHidden();
  await evidence.focus();
  await page.keyboard.press("Enter");
  await expect(evidence).toBeFocused();
  await expect(evidence).toHaveAttribute("aria-expanded", "true");
  await expect(detail).toBeInViewport({ratio:1});
  await expect(remedy).toBeInViewport({ratio:1});
  await page.keyboard.press("Space");
  await expect(detail).toBeHidden();
  await expect(remedy).toBeVisible();
  await preview.getByRole("checkbox", {name:"AdvisorFinding prop evidence", exact:true}).uncheck();
  await expect(evidence).toHaveCount(0);
  await expect(remedy).toBeVisible();
});
