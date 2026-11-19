import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("TemporarySpendLimit keeps the requested increase distinct from a currently enforced limit", async ({page}, info) => {
  await page.goto("/components/temporary-spend-limit");
  const panel = page.locator(".preview-stage .flood-surface");
  const scenario = page.getByRole("combobox",{name:"Scenario",exact:true});
  await expect(panel.getByRole("heading",{name:"Events card"})).toBeVisible();
  await expect(panel.getByText("Active",{exact:true})).toBeVisible();
  await expect(panel.getByText("$3,000.00",{exact:true})).toBeVisible();
  await expect(panel.getByText("$1,500.00",{exact:true})).toBeVisible();
  await expect(panel.getByText("$4,500.00",{exact:true})).toBeVisible();
  await expect(panel.locator("time")).toHaveAttribute("datetime","2026-12-01T05:00:00Z");
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("temporary-spend-limit.png"),animations:"disabled"});

  await chooseSelectOption(scenario,"Requested");
  await expect(panel.getByText("Awaiting approval")).toBeVisible();
  await expect(panel.getByText("Expected reset")).toBeVisible();
  await expect(panel.getByText("Effective limit")).toHaveCount(0);
  await expect(panel.getByText("$4,500.00",{exact:true})).toHaveCount(0);

  await page.getByRole("checkbox",{name:"TemporarySpendLimit prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox",{name:"TemporarySpendLimit prop surface"}),"overlay");
  await expect(panel.getByText("Expected reset")).toBeVisible();
  expect(await panel.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("temporary-spend-limit-narrow.png"),animations:"disabled"});

  await chooseSelectOption(scenario,"Declined");
  await expect(panel.getByText("Use the venue’s existing purchase order.")).toBeVisible();
  await expect(panel.locator("time")).toHaveCount(0);
  await chooseSelectOption(scenario,"Expired");
  await expect(panel.getByText("Ended on")).toBeVisible();
  await expect(panel.getByText("Effective limit")).toHaveCount(0);
  await expect(panel.getByText("$3,000.00",{exact:true})).toBeVisible();
  await expect(panel.locator("time")).toHaveAttribute("datetime","2026-12-01T05:00:00Z");
});
