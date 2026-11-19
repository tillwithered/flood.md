import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("SharingPanel keeps draft visibility separate from accepted access and its link", async ({page}, info) => {
  await page.goto("/components/sharing-panel");
  const panel = page.locator(".preview-stage .flood-surface");
  const scope = panel.getByRole("combobox", {name:"General access"});
  const apply = panel.getByRole("button", {name:"Apply access"});
  const copy = panel.getByRole("button", {name:"Copy link"});
  const reject = page.getByRole("checkbox", {name:"SharingPanel prop fail"});
  const members = panel.getByRole("list", {name:"People with access"});
  await expect(members.getByText("Sam Rivera")).toBeVisible();
  await expect(apply).toBeDisabled();
  await expect(copy).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("sharing-panel.png"),animations:"disabled"});

  await chooseSelectOption(scope, "public");
  await expect(panel.getByText("Current access: Restricted")).toBeVisible();
  await expect(copy).toHaveCount(0);
  await reject.check();
  await apply.click();
  await expect(panel.getByRole("alert")).toHaveText("Access couldn’t be updated. Try again.");
  await expect(scope).toHaveText("Public");
  await expect(panel.getByText("Current access: Restricted")).toBeVisible();
  await page.getByRole("checkbox", {name:"SharingPanel prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox", {name:"SharingPanel prop surface"}), "overlay");
  expect(await panel.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("sharing-panel-narrow.png"),animations:"disabled"});

  await reject.uncheck();
  await apply.click();
  await expect(apply).toBeFocused();
  await expect(apply).toBeDisabled();
  await expect(panel.getByRole("alert")).toHaveCount(0);
  await expect(panel.getByText("Current access: Restricted")).toHaveCount(0);
  await expect(copy).toBeEnabled();
  await chooseSelectOption(scope, "restricted");
  await expect(copy).toBeDisabled();
  await expect(panel.getByText("Current access: Public")).toBeVisible();
  const pending = page.getByRole("checkbox", {name:"SharingPanel prop pending"});
  await pending.check();
  await expect(scope).toBeDisabled();
  await expect(apply).toHaveAttribute("aria-busy","true");
  await pending.uncheck();
  await apply.click();
  await expect(copy).toHaveCount(0);
  await expect(members.getByText("Sam Rivera")).toBeVisible();
});
