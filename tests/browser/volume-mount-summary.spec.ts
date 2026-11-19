import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("VolumeMountSummary keeps runtime attachment, exact path and observed usage distinct", async ({page,context}, info) => {
  await context.grantPermissions(["clipboard-read","clipboard-write"]);
  await page.goto("/components/volume-mount-summary");
  const panel = page.locator(".preview-stage .flood-surface");
  const scenario = page.getByRole("combobox",{name:"Scenario",exact:true});
  const copy = panel.getByRole("button",{name:"Copy mount path"});
  const meter = panel.getByRole("meter",{name:"Storage used"});

  await expect(panel.getByText("Mounted",{exact:true})).toBeVisible();
  await expect(meter).toHaveAttribute("aria-valuetext","4.2 / 5 GB");
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("volume-mount-summary.png")});
  await copy.click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("/var/lib/postgresql/data");

  await chooseSelectOption(scenario,"Detached");
  await expect(copy).toHaveCount(0);
  await expect(meter).toBeVisible();

  await chooseSelectOption(scenario,"Pending");
  await page.getByRole("checkbox",{name:"VolumeMountSummary prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox",{name:"VolumeMountSummary prop surface"}),"overlay");
  await expect(panel.getByText("Waiting to mount",{exact:true})).toBeVisible();
  await expect(panel.getByText("/var/lib/postgresql/data",{exact:true})).toBeVisible();
  expect(await panel.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("volume-mount-summary-narrow.png")});

  await chooseSelectOption(scenario,"Unknown");
  await expect(panel.getByText("Mount status unavailable",{exact:true})).toBeVisible();
  await expect(panel.getByText("Unavailable",{exact:true})).toBeVisible();
  await expect(meter).toHaveCount(0);
});
