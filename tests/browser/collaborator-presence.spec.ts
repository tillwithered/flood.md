import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("collaborator presence labels a retained roster and distinguishes empty from unavailable", async ({page}, info) => {
  await page.goto("/components/collaborator-presence");
  const stage = page.locator(".preview-stage");
  const trigger = stage.getByRole("button", {name:/^In this document:/});
  const roster = page.getByRole("dialog", {name:"In this document"});
  await expect(trigger).toHaveAccessibleName("In this document: 5");
  await expect(trigger.getByRole("button")).toHaveCount(0);
  const scenario = page.getByRole("combobox", {name:/scenario/i});
  await trigger.focus();
  await trigger.press("Enter");
  await expect(roster).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(roster.locator(".flood-participant-popover__viewport")).toBeFocused();
  await expect(roster.getByRole("listitem")).toHaveCount(5);
  await expect(roster.getByRole("listitem").filter({hasText:"Maya Chen"})).toContainText("Editing");
  await expect(roster.getByRole("listitem").filter({hasText:"Sam Rivera"})).toContainText("Viewing");
  await page.evaluate(() => document.fonts.ready);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(roster).toBeVisible();
  await page.screenshot({path:info.outputPath("collaborator-presence.png")});
  await page.keyboard.press("Escape");

  await chooseSelectOption(scenario, "Empty");
  await expect(trigger).toHaveAccessibleName("In this document: Nobody else here");
  await trigger.click();
  await expect(roster.getByText("Nobody else here")).toBeVisible();
  await page.keyboard.press("Escape");
  await chooseSelectOption(scenario, "Unavailable");
  await trigger.click();
  await expect(roster.getByText("Presence unavailable")).toBeVisible();
  await expect(roster.getByRole("listitem")).toHaveCount(0);
  await page.keyboard.press("Escape");

  await chooseSelectOption(scenario, "Reconnecting");
  await chooseSelectOption(page.getByRole("combobox", {name:"CollaboratorPresence prop surface"}), "overlay");
  await page.getByRole("checkbox", {name:"CollaboratorPresence prop narrow"}).check();
  await expect(trigger).toContainText("Reconnecting");
  await trigger.click();
  await expect(roster.getByText("Last confirmed activity before the connection was lost.")).toBeVisible();
  await expect(roster.getByRole("listitem")).toHaveCount(5);
  await expect.poll(() => roster.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({path:info.outputPath("collaborator-presence-mobile.png")});
});
