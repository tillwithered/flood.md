import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("ScheduledRunHistory distinguishes observed executions from skipped time slots", async ({page}, info) => {
  await page.goto("/components/scheduled-run-history");
  const stage = page.locator(".preview-stage");
  const history = stage.getByRole("list", {name:"Export runs"});
  const row = (label: string) => history.getByRole("listitem").filter({hasText:label});

  const running = row("Running");
  await expect(running).toContainText("Manual");
  await expect(running).toContainText("Elapsed");
  await expect(running.locator("data")).toHaveAttribute("value", "26000");
  const skipped = row("Skipped");
  await expect(skipped).toContainText("Scheduled for");
  await expect(skipped).toContainText("The previous run was still active.");
  await expect(skipped.locator("time")).toHaveAttribute("datetime","2026-11-17T09:00:00Z");
  await expect(skipped.locator("data")).toHaveCount(0);
  await expect(row("Failed")).toContainText("The export connection timed out.");
  await expect(row("Succeeded").locator("data")).toHaveAttribute("value", "42000");
  await page.evaluate(() => document.fonts.ready);
  await stage.locator(".flood-surface").screenshot({path:info.outputPath("scheduled-run-history.png")});

  await chooseSelectOption(page.getByRole("combobox", {name:"ScheduledRunHistory prop timeZone"}), "America/New_York");
  await expect(skipped.locator("time")).toContainText("4:00");
  await expect(skipped.locator("time")).toContainText("EST");
  await expect(skipped.locator("time")).toHaveAttribute("datetime","2026-11-17T09:00:00Z");
  await page.getByRole("checkbox", {name:"ScheduledRunHistory prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox", {name:"ScheduledRunHistory prop surface"}), "overlay");
  await expect.poll(() => history.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.locator(".flood-surface").screenshot({path:info.outputPath("scheduled-run-history-narrow.png")});

  await chooseSelectOption(page.getByRole("combobox", {name:"Scenario",exact:true}), "Empty");
  await expect(history).toHaveText("No runs yet.");
});
