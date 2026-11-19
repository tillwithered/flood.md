import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("ReplicationStatus keeps reported health separate from measured or missing lag", async ({page}, info) => {
  await page.goto("/components/replication-status");
  const panel = page.locator(".preview-stage .flood-surface");
  const list = panel.getByRole("list",{name:"Database nodes"});
  const primary = list.getByRole("listitem").filter({hasText:"Frankfurt"});
  const virginia = list.getByRole("listitem").filter({hasText:"Northern Virginia"});
  const singapore = list.getByRole("listitem").filter({hasText:"Singapore"});
  const scenario = page.getByRole("combobox",{name:"Scenario",exact:true});

  await expect(primary).toContainText("Primary");
  await expect(primary.getByText("Replication lag")).toHaveCount(0);
  await expect(virginia).toContainText("Read replica");
  await expect(virginia).toContainText("0 sec");
  await expect(singapore).toContainText("Behind");
  await expect(singapore.locator("data")).toHaveText("8.4 sec");
  const statusBounds = await singapore.getByText("Behind").boundingBox();
  const lagBounds = await singapore.getByText("Replication lag").boundingBox();
  expect(statusBounds!.y).toBeLessThan(lagBounds!.y);
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("replication-status.png")});

  await page.getByRole("checkbox",{name:"ReplicationStatus prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox",{name:"ReplicationStatus prop surface"}),"overlay");
  await chooseSelectOption(scenario,"Unavailable");
  await expect(list.getByText("Unavailable",{exact:true})).toHaveCount(2);
  await expect(list.getByText("Available",{exact:true})).toHaveCount(3);
  await expect(list.locator("data")).toHaveCount(0);
  expect(await list.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("replication-status-narrow.png")});

  await chooseSelectOption(scenario,"Empty");
  await expect(list).toHaveCount(0);
  await expect(panel.getByText("No database nodes to display.")).toBeVisible();
});
