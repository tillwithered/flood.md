import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("RecordRelationForm changes eligible targets and preserves a refused draft", async ({ page }, info) => {
  await page.goto("/components/record-relation-form");
  const stage = page.locator(".preview-stage");
  const form = stage.getByRole("form", { name: "Add relationship" });
  const kind = form.getByRole("combobox", { name: /Relationship/ });
  const record = form.getByRole("combobox", { name: /Record/ });
  const submit = form.getByRole("button", { name: "Add relationship" });
  const accept = page.getByRole("checkbox", { name: "RecordRelationForm prop accept" });
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "RecordRelationForm prop narrow" }).check();
    await chooseSelectOption(page.getByRole("combobox", { name: "RecordRelationForm prop surface" }), "overlay");
  }
  await expect(submit).toBeDisabled();
  await record.fill("FUL-241");
  await expect(page.getByRole("option", { name: "No matching records", exact: true })).toBeVisible();
  await record.fill("FUL-212");
  await record.press("ArrowDown");
  await record.press("Enter");
  await expect(record).toHaveValue("Certify the carrier feed");
  await chooseSelectOption(kind, "related");
  await expect(record).toHaveValue("Certify the carrier feed");
  await chooseSelectOption(kind, "blocks");
  await expect(record).toHaveValue("");
  await expect(submit).toBeDisabled();
  await record.fill("FUL-248");
  await page.getByRole("option", { name: /Train warehouse support/ }).click();
  await accept.uncheck();
  await submit.press("Enter");
  await expect(form.getByRole("alert")).toHaveText("This relationship conflicts with an existing dependency.");
  await expect(record).toHaveValue("Train warehouse support");
  await expect(kind).toContainText("Blocking");
  await expect(submit).toBeFocused();
  await page.evaluate(() => document.fonts.ready);
  const panel = (await stage.locator(".flood-surface").boundingBox())!;
  const canvas = (await stage.boundingBox())!;
  expect(panel.y).toBeGreaterThan(canvas.y);
  expect(panel.y + panel.height).toBeLessThan(canvas.y + canvas.height);
  await stage.screenshot({ path: info.outputPath("record-relation-form.png"), animations: "disabled" });

  await accept.check();
  await submit.click();
  await expect(form).toHaveCount(0);
  await expect(stage.getByRole("list", { name: "Blocking" })).toContainText("Train warehouse support");
});
