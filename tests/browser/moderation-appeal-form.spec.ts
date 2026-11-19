import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("ModerationAppealForm keeps the decision and explanation through a refused submission", async ({ page }, info) => {
  await page.goto("/components/moderation-appeal-form");
  const stage = page.locator(".preview-stage");
  const form = stage.getByRole("form", { name: "Appeal decision" });
  const explanation = form.getByRole("textbox", { name: /Why should we reconsider/ });
  const submit = form.getByRole("button", { name: "Submit appeal" });
  const pending = page.getByRole("checkbox", { name: "ModerationAppealForm prop pending" });
  const accept = page.getByRole("checkbox", { name: "ModerationAppealForm prop accept" });
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "ModerationAppealForm prop narrow" }).check();
    await chooseSelectOption(page.getByRole("combobox", { name: "ModerationAppealForm prop surface" }), "overlay");
  }
  await expect(form.getByText("Posting restriction")).toBeVisible();
  await expect(form.getByText(/unsolicited promotions/)).toBeVisible();
  await explanation.fill("   ");
  await expect(submit).toBeDisabled();
  const overLimit = "Evidence ".repeat(27);
  await explanation.fill(overLimit);
  await expect(explanation).toHaveValue(overLimit);
  await expect(explanation).toHaveAccessibleDescription(/Shorten your explanation/);
  await expect(submit).toBeDisabled();

  const draft = "The links were to event resources requested by the original poster.";
  await explanation.fill(draft);
  await expect(submit).toBeEnabled();
  await pending.check();
  await expect(form).toHaveAttribute("aria-busy", "true");
  await expect(explanation).not.toBeEditable();
  await expect(submit).toBeDisabled();
  await pending.uncheck();
  await accept.uncheck();
  await submit.press("Enter");
  await expect(form.getByRole("alert")).toHaveText("We couldn’t submit your appeal. Try again.");
  await expect(explanation).toHaveValue(draft);
  await expect(submit).toBeFocused();
  await page.evaluate(() => document.fonts.ready);
  const panel = (await stage.locator(".flood-surface").boundingBox())!;
  const canvas = (await stage.boundingBox())!;
  expect(panel.y).toBeGreaterThan(canvas.y);
  expect(panel.y + panel.height).toBeLessThan(canvas.y + canvas.height);
  await stage.screenshot({ path: info.outputPath("moderation-appeal-form.png"), animations: "disabled" });

  await accept.check();
  await submit.click();
  await expect(stage.getByText("Appeal submitted", { exact: true })).toBeVisible();
  await expect(form).toHaveCount(0);
});
