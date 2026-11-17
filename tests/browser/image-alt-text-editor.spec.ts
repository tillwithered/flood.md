import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("image alt text stays editable at the limit and stays separate from the preview name", async ({page}, info) => {
  await page.goto("/components/image-alt-text-editor");
  const stage = page.locator(".preview-stage");
  const editor = stage.locator(".flood-image-alt-text-editor");
  const input = editor.getByRole("textbox", {name:"Alt text"});
  const image = editor.getByRole("img", {name:"Weekly visits chart"});
  await expect(image).toBeVisible();
  await expect(input).toHaveValue(/current week/);
  await page.evaluate(() => document.fonts.ready);
  const fieldLabel = editor.locator("label");
  const labelHeight = await fieldLabel.evaluate(node => node.getBoundingClientRect().height);
  await stage.screenshot({path:info.outputPath("image-alt-text-editor.png")});

  await input.fill("Cats");
  await input.press("Home");
  await input.pressSequentially("Two ");
  await expect(input).toHaveValue("Two Cats");
  await input.fill("🚀".repeat(160));
  await expect(input).not.toHaveAttribute("aria-invalid", "true");
  await input.fill("🚀".repeat(161));
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(editor.locator("output")).toHaveText("161 / 160Over limit");
  await expect(image).toHaveAccessibleName("Weekly visits chart");
  await expect(input).toBeFocused();
  await input.fill("");
  await expect(input).toHaveValue("");
  await expect(input).not.toHaveAttribute("aria-invalid", "true");

  await chooseSelectOption(page.getByRole("combobox", {name:"ImageAltTextEditor prop image"}), "Brand mark");
  await expect(input).toHaveValue("Pink four-lobed Flood mark.");
  await expect.poll(() => fieldLabel.evaluate(node => node.getBoundingClientRect().height)).toBe(labelHeight);
  await page.getByRole("checkbox", {name:"ImageAltTextEditor prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox", {name:"ImageAltTextEditor prop surface"}), "overlay");
  await page.getByRole("checkbox", {name:"ImageAltTextEditor prop readOnly"}).check();
  await expect(input).toHaveAttribute("readonly", "");
  await expect.poll(async () => (await editor.getByRole("img", {name:"Flood brand mark"}).boundingBox())?.height).toBeLessThanOrEqual(192);
  await expect.poll(() => editor.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.screenshot({path:info.outputPath("image-alt-text-editor-mobile.png")});
});
