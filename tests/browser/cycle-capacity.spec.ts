import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("CycleCapacity preserves the plan and forecast across above, below, equal and unknown states", async ({page}, info) => {
  await page.goto("/components/cycle-capacity");
  const panel = page.locator(".preview-stage .flood-surface");
  const scenario = page.getByRole("combobox",{name:"Scenario",exact:true});
  const meter = panel.getByRole("meter",{name:"Planned work"});
  await expect(meter).toHaveAttribute("aria-valuenow","42");
  await expect(meter).toHaveAttribute("aria-valuemax","42");
  await expect(panel.getByText("Estimated capacity · 36 pts")).toBeVisible();
  await expect(panel.getByText("6 pts above estimate")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("cycle-capacity.png")});

  await page.getByRole("checkbox",{name:"CycleCapacity prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox",{name:"CycleCapacity prop surface"}),"overlay");
  await chooseSelectOption(scenario,"Below estimate");
  await expect(meter).toHaveAttribute("aria-valuemax","36");
  await expect(panel.getByText("8 pts below estimate")).toBeVisible();
  expect(await panel.evaluate(node => node.scrollWidth-node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("cycle-capacity-narrow.png"),animations:"disabled"});

  await chooseSelectOption(scenario,"Matches estimate");
  await expect(panel.getByText("Matches estimate",{exact:true})).toBeVisible();
  await chooseSelectOption(scenario,"Zero capacity");
  await expect(panel.getByText("Estimated capacity · 0 pts")).toBeVisible();
  await expect(panel.getByText("42 pts above estimate")).toBeVisible();
  await chooseSelectOption(scenario,"Unavailable");
  await expect(meter).toHaveCount(0);
  await expect(panel.getByText("42 pts",{exact:true})).toBeVisible();
  await expect(panel.getByText("Capacity estimate unavailable.")).toBeVisible();
});
