import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("connected accounts distinguish provider identities and scope actions to the affected account", async ({page}, info) => {
  await page.goto("/components/connected-account-list");
  const stage = page.locator(".preview-stage");
  const list = stage.getByRole("list", {name:"Connected accounts"});
  const row = (text: string) => list.getByRole("listitem").filter({hasText:text});
  await expect(row("maya-work")).toContainText("Connected");
  await expect(row("maya-personal")).toContainText("Reconnect needed");
  const reconnect = row("maya-personal").getByRole("button", {name:"Reconnect maya-personal"});
  const manage = row("maya-work").getByRole("button", {name:"Manage maya-work"});
  await reconnect.click();
  const dialog = page.getByRole("dialog", {name:"Reconnect maya-personal"});
  await expect(dialog).toContainText("Reauthorize GitHub");
  await page.keyboard.press("Escape");
  await expect(reconnect).toBeFocused();
  await expect(manage).toBeVisible();
  await expect(row("Google Calendar")).toContainText("Not connected");
  await expect(row("Slack")).toContainText("Unavailable");
  await expect(row("Slack").getByRole("button")).toHaveCount(0);
  await expect(list.getByRole("link")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({path:info.outputPath("connected-account-list.png")});

  await page.getByRole("checkbox", {name:"ConnectedAccountList prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox", {name:"ConnectedAccountList prop surface"}), "overlay");
  await expect.poll(() => list.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.screenshot({path:info.outputPath("connected-account-list-mobile.png")});

  const scenario = page.getByRole("combobox", {name:/^scenario$/i});
  await chooseSelectOption(scenario, "View only");
  await expect(list.getByRole("button")).toHaveCount(0);
  await expect(row("maya-personal")).toContainText("Reconnect needed");
  await chooseSelectOption(scenario, "Empty");
  await expect(list).toHaveText("No connected accounts to show.");
});
