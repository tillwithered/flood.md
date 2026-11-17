import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test.use({hasTouch:true,viewport:{width:1440,height:940},reducedMotion:"reduce"});

for (const {slug, name, scope, placeholder, action, square} of [
  {slug:"file-card-skeleton",name:"FileCardSkeleton",scope:".flood-file-card",placeholder:".flood-file-card__commands .flood-skeleton",action:".flood-file-card__commands .flood-icon-button",square:true},
  {slug:"card-skeleton",name:"CardSkeleton",scope:".flood-card",placeholder:".flood-card-skeleton__footer-action",action:".flood-card__footer .flood-button",square:false},
  {slug:"notification-inbox",name:"NotificationInbox",scope:".flood-notification-item",placeholder:".flood-notification-skeleton__action",action:"[data-notification-read-action]",square:true},
]) {
  test(`${name} reserves coarse-pointer action geometry during loading`, async ({page}) => {
    await page.goto(`/components/${slug}`);
    expect(await page.evaluate(()=>matchMedia("(pointer: coarse)").matches)).toBe(true);
    const toggle = (key:string) => page.getByRole("checkbox",{name:`${name} prop ${key}`,exact:true});
    const select = (key:string) => page.getByRole("combobox",{name:`${name} prop ${key}`,exact:true});
    const inbox = name === "NotificationInbox";
    if (inbox) {
      await chooseSelectOption(select("appearance"),"overlay");
      await toggle("constrainWidth").check();
      await chooseSelectOption(select("state"),"loading");
    } else await toggle("narrow").check();
    await page.evaluate(()=>document.fonts.ready);
    const row = page.locator(`.preview-stage ${scope}`).first();
    const measure = async (selector:string) => {
      const parent = (await row.boundingBox())!;
      const part = (await row.locator(selector).first().boundingBox())!;
      return {rowHeight:parent.height,width:part.width,height:part.height,top:part.y-parent.y};
    };
    const pending = await measure(placeholder);
    if (inbox) await chooseSelectOption(select("state"),"ready");
    else await toggle("loaded").check();
    const ready = await measure(action);
    expect(ready.height).toBeGreaterThan(32);
    expect(pending.height).toBeCloseTo(ready.height,1);
    expect(Math.abs(pending.top-ready.top)).toBeLessThan(1);
    expect(Math.abs(pending.rowHeight-ready.rowHeight)).toBeLessThan(1);
    if (square) expect(pending.width).toBeCloseTo(ready.width,1);
  });
}

test("mobile studio fits both versions of each card before the properties", async ({page}) => {
  for (const viewport of [{width:320,height:568},{width:390,height:844}]) {
    await page.setViewportSize(viewport);
    for (const [slug, name] of [["card","CardSkeleton"],["file-card","FileCardSkeleton"]]) {
      const heights: number[] = [];
      for (const route of [slug,`${slug}-skeleton`]) {
        await page.goto(`/components/${route}`);
        const canvas = page.getByRole("region",{name:"Preview canvas"});
        await expect(canvas.locator(".flood-card")).toBeVisible();
        await page.evaluate(()=>document.fonts.ready);
        const fit = async () => {
          const {height, overflow} = await canvas.evaluate(node=>({
            height:node.clientHeight, overflow:node.scrollHeight-node.clientHeight,
          }));
          expect(overflow).toBeLessThanOrEqual(1);
          return height;
        };
        heights.push(await fit());
        if (route.endsWith("-skeleton")) {
          await page.getByRole("checkbox",{name:`${name} prop loaded`,exact:true}).check();
          expect(await fit()).toBe(heights[heights.length-1]);
        }
      }
      expect(heights[0]).toBe(heights[1]);
    }
  }
});
