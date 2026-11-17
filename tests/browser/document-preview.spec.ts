import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("a document scrolls independently and accepts only valid finite page changes", async ({page}, info) => {
  await page.setViewportSize({width: info.project.name === "mobile" ? 390 : 1440, height: 640});
  await page.goto("/components/document-preview");
  const opener = page.getByRole("button", {name:"Preview document", exact:true});
  await opener.click();
  const dialog = page.getByRole("dialog", {name:"Statement of work", exact:true});
  const viewport = dialog.getByRole("region", {name:"Document page", exact:true});
  const navigation = dialog.getByRole("navigation", {name:"Document pages", exact:true});
  const previous = navigation.getByRole("button", {name:"Previous page"});
  const next = navigation.getByRole("button", {name:"Next page"});
  const jump = dialog.getByRole("textbox", {name:"Page number"});
  await expect(viewport.getByRole("heading", {name:"Delivery summary"})).toBeVisible();
  await expect(viewport).toBeFocused();
  await expect(previous).toBeDisabled();
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => viewport.evaluate(node => node.scrollHeight > node.clientHeight)).toBe(true);
  const originalControls = await navigation.boundingBox();
  await viewport.evaluate(node => {node.scrollTop = node.scrollHeight;});
  expect(await viewport.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  expect(await navigation.boundingBox()).toEqual(originalControls);
  expect(await dialog.evaluate(node => node.scrollHeight - node.clientHeight)).toBeLessThanOrEqual(1);
  await jump.fill("4");
  await jump.press("Enter");
  await expect(dialog.getByText("Enter a page from 1 to 3.")).toBeVisible();
  await expect(jump).toHaveAttribute("aria-invalid", "true");
  await expect(navigation).toHaveText("Page 1 of 3");
  await jump.fill("2");
  await jump.press("Enter");
  await expect(navigation).toHaveText("Page 2 of 3");
  await expect(viewport.getByRole("heading", {name:"Schedule and milestones"})).toBeVisible();
  await expect(viewport.getByRole("heading", {name:"Delivery summary"})).toHaveCount(0);
  await expect.poll(() => viewport.evaluate(node => node.scrollTop)).toBe(0);
  await next.focus();
  await next.press("Enter");
  await expect(next).toBeDisabled();
  await expect(viewport).toBeFocused();
  await expect(navigation).toHaveText("Page 3 of 3");
  await previous.click();
  await expect(navigation).toHaveText("Page 2 of 3");
  await dialog.screenshot({path:info.outputPath("document-preview.png"), animations:"disabled"});
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("the document preview handles alternate states and closes back to its drawer opener", async ({page}, info) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/components/document-preview");
  const state = page.getByRole("combobox", {name:"DocumentPreview prop pageState"});
  for (const [value, message] of [
    ["loading", "Loading page…"], ["error", "Could not load this page"], ["empty", "This document has no pages"],
  ]) {
    await chooseSelectOption(state, value);
    await page.getByRole("button", {name:"Preview document", exact:true}).click();
    const dialog = page.getByRole("dialog", {name:"Statement of work", exact:true});
    await expect(dialog.getByText(message, {exact:true})).toBeVisible();
    expect(await dialog.getByRole("navigation").count()).toBe(value === "empty" ? 0 : 1);
    if (value === "error") await dialog.screenshot({path:info.outputPath("document-preview-error.png"), animations:"disabled"});
    await dialog.getByRole("button", {name:"Close", exact:true}).click();
  }
  await chooseSelectOption(state, "ready");
  await page.getByRole("checkbox", {name:"DocumentPreview prop singlePage"}).check();
  await page.getByRole("checkbox", {name:"DocumentPreview prop inDrawer"}).check();
  if (info.project.name === "mobile") await page.setViewportSize({width:390,height:660});
  const launcher = page.getByRole("button", {name:"Open project documents"});
  await launcher.click();
  const drawer = page.getByRole("dialog", {name:"Project documents", exact:true});
  const opener = drawer.getByRole("button", {name:"Preview: Statement of work.pdf", exact:true});
  await opener.click();
  const nested = page.getByRole("dialog", {name:"Statement of work", exact:true});
  await expect(nested.getByText("Delivery summary")).toBeVisible();
  await expect(nested.getByRole("navigation")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(nested).toBeHidden();
  await expect(drawer).toBeVisible();
  await expect(opener).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(launcher).toBeFocused();
});
