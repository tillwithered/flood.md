import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("ContentReportForm validates a reason and preserves details through a refused report", async ({ page }, info) => {
  await page.goto("/components/content-report-form");
  const stage = page.locator(".preview-stage");
  const form = stage.locator("form");
  const submit = form.getByRole("button", { name: "Submit report" });
  const details = form.getByRole("textbox", { name: /Details/ });
  const other = form.getByRole("radio", { name: "Something else" });
  const accept = page.getByRole("checkbox", { name: "ContentReportForm prop accept" });
  const pending = page.getByRole("checkbox", { name: "ContentReportForm prop pending" });
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "ContentReportForm prop narrow" }).check();
    await chooseSelectOption(page.getByRole("combobox", { name: "ContentReportForm prop surface" }), "overlay");
  }
  await expect(stage.getByText("Post by @jules.example")).toBeVisible();
  await expect(submit).toBeDisabled();
  await other.press("Space");
  await submit.press("Enter");
  await expect(details).toBeFocused();
  await expect(details).toHaveAccessibleDescription(/Add details for this reason/);

  await details.fill("Repeated links to a fake project page.");
  await expect(form.getByRole("alert")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  const panelBox = (await stage.locator(".flood-surface").boundingBox())!;
  const stageBox = (await stage.boundingBox())!;
  expect(panelBox.y).toBeGreaterThan(stageBox.y);
  expect(panelBox.y + panelBox.height).toBeLessThan(stageBox.y + stageBox.height);
  await stage.screenshot({ path: info.outputPath("content-report-form.png"), animations: "disabled" });

  await pending.check();
  await expect(form).toHaveAttribute("aria-busy", "true");
  await expect(submit).toBeDisabled();
  await expect(details).toBeDisabled();
  await pending.uncheck();
  await accept.uncheck();
  await submit.click();
  await expect(form.getByRole("alert")).toHaveText("Report could not be sent. Try again.");
  await expect(details).toHaveValue("Repeated links to a fake project page.");
  await expect(other).toBeChecked();
  await accept.check();
  await submit.click();
  await expect(stage.getByText("Report submitted", { exact: true })).toBeVisible();
});
