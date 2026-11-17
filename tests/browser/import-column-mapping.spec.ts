import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("column mapping keeps unassigned, skipped and unavailable destinations distinct", async ({page}, info) => {
  await page.goto("/components/import-column-mapping");
  const stage = page.locator(".preview-stage");
  const table = stage.getByRole("table", {name:"Map contact CSV"});
  const work = table.getByRole("combobox", {name:"Import Work email into"});
  const old = table.getByRole("combobox", {name:"Import Old email into"});
  await expect(work).toHaveText("Choose a field");
  await expect(old).toHaveText("Skip");
  await expect(table).toContainText("team@example.com");
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({path:info.outputPath("import-column-mapping.png")});
  await chooseSelectOption(work, "target:email");
  await expect(work).toHaveText("Email");
  await chooseSelectOption(work, "skip");
  await expect(work).toHaveText("Skip");

  const scenario = page.getByRole("combobox", {name:/^scenario$/i});
  await chooseSelectOption(scenario, "Field removed");
  await page.getByRole("checkbox", {name:"ImportColumnMapping prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox", {name:"ImportColumnMapping prop surface"}), "overlay");
  await expect(work).toHaveAttribute("aria-invalid", "true");
  await expect(work).toHaveText("Unavailable");
  await expect.poll(() => work.locator(".flood-select__value").evaluate(node => node.scrollWidth - node.clientWidth))
    .toBeLessThanOrEqual(1);
  await expect.poll(() => table.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.screenshot({path:info.outputPath("import-column-mapping-mobile.png")});
  await chooseSelectOption(work, "target:email");
  await expect(work).not.toHaveAttribute("aria-invalid", "true");
  await chooseSelectOption(scenario, "Empty");
  await expect(table.getByText("No source columns.")).toBeVisible();
});
