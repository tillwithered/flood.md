import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("ContentLanguagePicker searches endonyms and submits locale tags across display languages", async ({page}, info) => {
  await page.goto("/components/content-language-picker");
  const form = page.getByRole("form", {name:"Publication metadata"});
  const picker = form.getByRole("combobox", {name:"Post languages"});
  const submitted = () => form.evaluate(node => new FormData(node as HTMLFormElement).getAll("language"));
  await expect.poll(submitted).toEqual(["en","th"]);
  await picker.fill("日本語");
  const japanese = page.getByRole("option", {name:/Japanese/});
  await expect(japanese).toContainText("日本語");
  await page.evaluate(() => document.fonts.ready);
  const host = (await page.locator(".preview-stage .flood-surface").boundingBox())!;
  const popup = (await page.getByRole("listbox", {name:"Languages"}).boundingBox())!;
  const top = Math.min(host.y, popup.y);
  await page.screenshot({
    path:info.outputPath("content-language-picker.png"),
    animations:"disabled",
    clip:{x:host.x,y:top,width:host.width,height:Math.max(host.y + host.height, popup.y + popup.height + 6) - top},
  });
  await japanese.click();
  await expect.poll(submitted).toEqual(["en","th","ja"]);
  await picker.press("Escape");

  await chooseSelectOption(page.getByRole("combobox", {name:"ContentLanguagePicker prop locale"}), "fr");
  await expect(form.getByText("japonais", {exact:true})).toBeVisible();
  await expect.poll(submitted).toEqual(["en","th","ja"]);
  await page.getByRole("checkbox", {name:"ContentLanguagePicker prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox", {name:"ContentLanguagePicker prop surface"}), "overlay");
  const panel = page.locator(".preview-stage .flood-surface");
  expect(await panel.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("content-language-picker-narrow.png"), animations:"disabled"});
  await picker.fill("sr-Cyrl");
  const cyrillic = page.getByRole("option", {name:/cyrillique/});
  await expect(cyrillic).toBeVisible();
  await cyrillic.click();
  await expect.poll(submitted).toEqual(["en","th","ja","sr-Cyrl"]);
  await picker.press("Escape");
  await page.getByRole("checkbox", {name:"ContentLanguagePicker prop disabled"}).check();
  await expect(picker).toBeDisabled();
  await expect.poll(submitted).toEqual([]);
});
