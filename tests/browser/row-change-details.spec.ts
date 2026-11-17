import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("RowChangeDetails distinguishes captured null, partial coverage and unavailable snapshots", async ({ page }, info) => {
  await page.goto("/components/row-change-details");
  const stage = page.locator(".preview-stage");
  const surface = stage.locator(".flood-surface").filter({ has: page.getByText("public.exports", { exact:true }) });
  const before = stage.getByRole("tab", { name:"Before", exact:true });
  const after = stage.getByRole("tab", { name:"After", exact:true });
  const scenario = page.getByRole("combobox", { name:"Scenario", exact:true });
  await expect(after).toHaveAttribute("aria-selected", "true");
  await expect(stage.getByRole("tabpanel", { name:"After" })).toContainText("ready");
  await page.evaluate(() => document.fonts.ready);
  await surface.screenshot({ path: info.outputPath("row-change-details.png") });

  await before.press("Enter");
  await expect(before).toHaveAttribute("aria-selected", "true");
  const beforePanel = stage.getByRole("tabpanel", { name:"Before" });
  await expect(beforePanel).toContainText("queued");
  await expect(beforePanel.getByText("null", { exact:true })).toBeVisible();

  await chooseSelectOption(scenario, "Partial before");
  await before.click();
  await expect(beforePanel.getByText("Partial capture")).toBeVisible();
  await expect(beforePanel).toContainText("exp_1042");
  await expect(beforePanel).not.toContainText("finished_at");
  await page.getByRole("checkbox", { name:"RowChangeDetails prop narrow" }).check();
  await chooseSelectOption(page.getByRole("combobox", { name:"RowChangeDetails prop surface" }), "overlay");
  await expect.poll(() => surface.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await surface.screenshot({ path: info.outputPath("row-change-details-narrow.png") });

  await chooseSelectOption(scenario, "Missing before");
  await before.click();
  await expect(beforePanel.getByText("Snapshot unavailable.")).toBeVisible();
  await expect(beforePanel.getByRole("group", { name:"Before" })).toHaveCount(0);
  await chooseSelectOption(scenario, "Insert");
  await expect(stage.getByRole("tab")).toHaveCount(0);
  await expect(stage.getByRole("group", { name:"After", exact:true })).toContainText("ready");
  await chooseSelectOption(scenario, "Delete");
  await expect(stage.getByRole("tab")).toHaveCount(0);
  await expect(stage.getByRole("group", { name:"Before", exact:true })).toContainText("exp_1042");
});
