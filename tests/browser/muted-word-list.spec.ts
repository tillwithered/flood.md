import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("MutedWordList keeps matching context visible and returns focus after host removal", async ({ page }, info) => {
  await page.goto("/components/muted-word-list");
  const stage = page.locator(".preview-stage");
  const region = stage.getByRole("region", { name: "Muted words" });
  const list = region.getByRole("list", { name: "Active mute rules" });
  const rules = list.locator(":scope > li");
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "MutedWordList prop narrow" }).check();
    await chooseSelectOption(page.getByRole("combobox", { name: "MutedWordList prop surface" }), "overlay");
  }
  await expect(rules).toHaveCount(2);
  await expect(rules.first()).toContainText("Text and tags");
  await expect(rules.first()).toContainText("Except accounts you follow");
  await expect(rules.first().locator("time")).toHaveAttribute("datetime", "2026-11-30T16:00:00Z");
  await expect(rules.last()).toContainText("Tags only");
  await expect(rules.last().locator("time")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("muted-word-list.png"), animations: "disabled" });

  const first = region.getByRole("button", { name: "Remove mute for season finale" });
  const second = region.getByRole("button", { name: "Remove mute for #giveaway" });
  await first.press("Enter");
  await expect(rules).toHaveCount(1);
  await expect(second).toBeFocused();
  await second.press("Enter");
  await expect(list).toHaveCount(0);
  await expect(region.getByText("No muted words.")).toBeVisible();
  await expect(region).toBeFocused();
});
