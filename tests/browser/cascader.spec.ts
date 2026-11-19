import {expect, test} from "@playwright/test";

test("Cascader keeps branch navigation draft-only and commits a complete path", async ({page}, info) => {
  await page.goto("/components/cascader");
  const trigger = page.getByRole("button", {name: /^Region/});
  await expect(trigger).toContainText("Select an option");
  await trigger.click();
  const dialog = page.getByRole("dialog", {name: "Region"});
  const root = dialog.getByRole("listbox", {name: "Region", exact: true});
  await expect(root).toBeFocused();
  await root.press("ArrowRight");
  const europe = dialog.getByRole("listbox", {name: "Options in Europe"});
  await expect(europe).toBeFocused();
  await expect(trigger).toContainText("Select an option");
  await europe.press("Enter");
  const germany = dialog.getByRole("listbox", {name: "Options in Germany"});
  await expect(germany).toBeFocused();
  await expect(germany.getByRole("option", {name: "Berlin"})).toBeVisible();
  await page.screenshot({path: info.outputPath("cascader-branches.png")});
  await germany.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText("Select an option");
  await trigger.click();
  await dialog.getByRole("option", {name: /^Europe/}).click();
  await europe.getByRole("option", {name: /^Germany/}).click();
  await germany.getByRole("option", {name: "Berlin"}).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText("Europe / Germany / Berlin");
  await trigger.click();
  await expect(germany.getByRole("option", {name: "Berlin"})).toHaveAttribute("aria-selected", "true");
  if (info.project.name === "mobile") {
    await dialog.getByRole("button", {name: "Back"}).click();
    await expect(europe).toBeFocused();
    await expect(germany).toBeHidden();
  }
});
