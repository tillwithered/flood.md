import {expect, test} from "@playwright/test";

test("Heading balances the same words without changing the heading level or measure", async ({page}, info) => {
  await page.goto("/components/heading");
  const heading = page.locator(".preview-stage").getByRole("heading", {level:2});
  await page.getByRole("checkbox", {name:"Heading prop multiline"}).check();
  await expect(heading).toHaveText("A quieter workspace for notes and ideas");
  await page.evaluate(() => document.fonts.ready);
  const measure = () => heading.evaluate(node => {
    const range = node.ownerDocument.createRange();
    range.selectNodeContents(node);
    const lines = Array.from(range.getClientRects(), rect => rect.width);
    return {width:node.getBoundingClientRect().width, spread:Math.max(...lines) - Math.min(...lines)};
  });
  const before = await measure();
  await heading.screenshot({path:info.outputPath("heading-natural-wrap.png")});
  await page.getByRole("checkbox", {name:"Heading prop balance"}).check();
  await expect(heading).toHaveCSS("text-wrap-style", "balance");
  const after = await measure();
  expect(after.width).toBeCloseTo(before.width);
  expect(after.spread).toBeLessThan(before.spread);
  await heading.screenshot({path:info.outputPath("heading-balanced-wrap.png")});
});

test("Text enables pretty wrapping only when requested", async ({page}, info) => {
  await page.goto("/components/text");
  const paragraph = page.locator(".preview-stage p.flood-text");
  await page.getByRole("checkbox", {name:"Text prop multiline"}).check();
  const content = "Invite your team to review the draft and add comments before Friday.";
  await expect(paragraph).toHaveText(content);
  await expect(paragraph).toHaveCSS("text-wrap-style", "auto");
  await page.evaluate(() => document.fonts.ready);
  const lastLineWidth = () => paragraph.evaluate(node => {
    const range = node.ownerDocument.createRange();
    range.selectNodeContents(node);
    return Array.from(range.getClientRects()).at(-1)!.width;
  });
  const before = await lastLineWidth();
  await paragraph.screenshot({path:info.outputPath("paragraph-natural-wrap.png")});
  await page.getByRole("checkbox", {name:"Text prop pretty"}).check();
  await expect(paragraph).toHaveCSS("text-wrap-style", "pretty");
  await expect(paragraph).toHaveText(content);
  expect(await lastLineWidth()).toBeGreaterThan(before);
  await paragraph.screenshot({path:info.outputPath("paragraph-pretty-wrap.png")});
});
