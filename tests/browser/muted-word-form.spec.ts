import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("MutedWordForm submits the draft and preserves it when the host rejects or pauses the request", async ({ page }, info) => {
  await page.goto("/components/muted-word-form");
  const stage = page.locator(".preview-stage");
  const form = stage.locator("form");
  const term = form.getByRole("textbox", { name: /Word, phrase or tag/ });
  const scope = form.getByRole("combobox", { name: "Match in" });
  const duration = form.getByRole("combobox", { name: "Duration" });
  const exception = form.getByRole("checkbox", { name: "Except accounts you follow" });
  const submit = form.getByRole("button", { name: "Add mute" });
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "MutedWordForm prop narrow" }).check();
    await chooseSelectOption(page.getByRole("combobox", { name: "MutedWordForm prop surface" }), "overlay");
  }
  await expect(submit).toBeDisabled();
  await term.fill("   ");
  await expect(submit).toBeDisabled();
  await term.fill("  season finale  ");
  await chooseSelectOption(scope, "tags-only");
  await chooseSelectOption(duration, "7-days");
  await exception.check();
  await term.press("Enter");
  await expect(term).toHaveAccessibleDescription("This phrase is already muted.");
  await expect(term).toHaveValue("  season finale  ");
  await expect(scope).toContainText("Tags only");
  await expect(duration).toContainText("7 days");
  await expect(exception).toBeChecked();
  await page.evaluate(() => document.fonts.ready);
  await expect(form).toHaveCSS("text-align", "start");
  const buttonBox = (await submit.boundingBox())!;
  const stageBox = (await stage.boundingBox())!;
  expect(buttonBox.y + buttonBox.height).toBeLessThan(stageBox.y + stageBox.height);
  await stage.screenshot({ path: info.outputPath("muted-word-form.png"), animations: "disabled" });

  const pending = page.getByRole("checkbox", { name: "MutedWordForm prop pending" });
  await pending.check();
  await expect(form).toHaveAttribute("aria-busy", "true");
  await expect(term).toBeDisabled();
  await expect(submit).toBeDisabled();
  await pending.uncheck();
  await expect(term).toHaveValue("  season finale  ");
  await term.fill("  award winners  ");
  await expect(form.getByRole("alert")).toHaveCount(0);
  await submit.click();
  await expect(stage.getByRole("status")).toHaveText("Muted “award winners”.");
  await expect(term).toHaveValue("");
  await expect(submit).toBeDisabled();
});
