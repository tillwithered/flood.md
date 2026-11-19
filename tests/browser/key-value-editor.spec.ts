import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("editing pairs preserves siblings and moves focus after accepted changes", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/key-value-editor");
  const editor = page.locator(".preview-stage .flood-key-value-editor");
  await page.getByRole("checkbox", { name: "KeyValueEditor prop showEnabled", exact: true }).check();
  const add = editor.getByRole("button", { name: "Add pair" });
  const first = editor.getByRole("group", { name: "Pair 1", exact: true });
  await expect(first.getByRole("textbox", { name: "Key", exact: true })).toHaveValue("Accept");
  await add.press("Space");
  const second = editor.getByRole("group", { name: "Pair 2", exact: true });
  const secondKey = second.getByRole("textbox", { name: "Key", exact: true });
  await expect(secondKey).toBeFocused();
  await secondKey.fill("Cache-Control");
  await second.getByRole("textbox", { name: "Value", exact: true }).fill("no-cache");
  await second.getByRole("switch", { name: "Enabled" }).press("Space");
  await expect(second.getByRole("switch", { name: "Enabled" })).not.toBeChecked();
  await expect(first.getByRole("textbox", { name: "Value", exact: true })).toHaveValue("application/json");

  await page.getByRole("checkbox", { name: "KeyValueEditor prop showError", exact: true }).check();
  await expect(first.getByRole("textbox", { name: "Value", exact: true })).toHaveAccessibleDescription("Use a valid media type.");
  await expect(second.getByRole("textbox", { name: "Value", exact: true })).toHaveValue("no-cache");
  await page.evaluate(() => document.fonts.ready);
  const switchBounds = (await first.getByRole("switch", { name: "Enabled" }).boundingBox())!;
  const inputBounds = (await first.getByRole("textbox", { name: "Key", exact: true }).boundingBox())!;
  expect(Math.abs(switchBounds.y + switchBounds.height / 2 - inputBounds.y - inputBounds.height / 2)).toBeLessThan(2);
  expect((await second.locator("label.flood-label").first().boundingBox())?.height).toBeLessThan(2);
  await editor.screenshot({ path: info.outputPath("key-value-editor-error.png") });
  await editor.evaluate(node => { node.style.inlineSize = "17rem"; });
  const narrowKeyBounds = (await first.getByRole("textbox", { name: "Key", exact: true }).boundingBox())!;
  const narrowValueBounds = (await first.getByRole("textbox", { name: "Value", exact: true }).boundingBox())!;
  expect(narrowValueBounds.y).toBeGreaterThan(narrowKeyBounds.y + narrowKeyBounds.height);
  expect(Math.abs(narrowKeyBounds.x - narrowValueBounds.x)).toBeLessThan(2);
  expect((await second.locator("label.flood-label").first().boundingBox())?.height).toBeGreaterThan(12);
  await editor.screenshot({ path: info.outputPath("key-value-editor-narrow.png") });
  await editor.evaluate(node => { node.style.removeProperty("inline-size"); });

  await first.getByRole("button", { name: "Remove pair 1", exact: true }).press("Enter");
  await expect(first.getByRole("textbox", { name: "Key", exact: true })).toBeFocused();
  await expect(first.getByRole("textbox", { name: "Key", exact: true })).toHaveValue("Cache-Control");
  await first.getByRole("button", { name: "Remove pair 1", exact: true }).press("Enter");
  await expect(add).toBeFocused();
});

test("the standalone pair preserves multiline values in read-only mode", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/key-value-row");
  const row = page.locator(".preview-stage .flood-key-value-row");
  await chooseSelectOption(page.getByRole("combobox", { name: "KeyValueRow prop valueMode", exact: true }), "multiline");
  const value = row.getByRole("textbox", { name: "Value", exact: true });
  await value.fill("application/json\ntext/plain");
  await page.getByRole("checkbox", { name: "KeyValueRow prop readOnly", exact: true }).check();
  await expect(value).toHaveValue("application/json\ntext/plain");
  await expect(value).toHaveAttribute("readonly", "");
  await expect(row.getByRole("textbox", { name: "Key", exact: true })).toHaveValue("Accept");
  await page.evaluate(() => document.fonts.ready);
  await row.screenshot({ path: info.outputPath("key-value-row-multiline.png") });
  await row.evaluate(node => { node.style.inlineSize = "17rem"; });
  const rowBounds = (await row.boundingBox())!;
  const valueBounds = (await value.boundingBox())!;
  expect(Math.abs(rowBounds.x + rowBounds.width - valueBounds.x - valueBounds.width)).toBeLessThan(2);
  await row.screenshot({ path: info.outputPath("key-value-row-narrow.png") });
});
