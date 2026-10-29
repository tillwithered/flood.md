import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { componentSlugs } from "../../apps/website/routes.mjs";
import { chooseSelectOption } from "./select-helpers";
import { catalogCohort } from "../../scripts/ci-cohort.mjs";

// Whole-catalog geometry complements component-specific interaction regressions.
// A preview may scroll locally; the documentation page must not overflow globally.
for (const enlarged of [false, true]) {
  for (const slug of catalogCohort(componentSlugs)) {
  test(`foundation milestone catalog matrix: ${enlarged ? "enlarged text and RTL" : "default geometry"}: ${slug}`, async ({page}, info) => {
    const mobile = info.project.name === "mobile";
    const mode = `${info.project.name}-${enlarged ? "enlarged" : "default"}`;
    const directory = `.artifacts/foundations-milestone/${mode}`;
    await mkdir(directory, {recursive:true});
    const dimensions = enlarged ? (mobile ? {width:390,height:1000} : {width:320,height:1000}) : (mobile ? {width:390,height:844} : {width:1440,height:1000});
    await page.setViewportSize(dimensions);
    const results: Array<Record<string, unknown>> = [];
      await page.goto(`/components/${slug}`);
      const stage = page.locator(".workbench-stage");
      await expect(stage, slug).toBeVisible();
      await page.evaluate(async ({size,rtl}) => {document.documentElement.style.fontSize=`${size}px`;document.documentElement.dir=rtl?"rtl":"ltr";await document.fonts.ready;}, {size:enlarged?(mobile?32:24):16,rtl:enlarged&&mobile});
      // Font/direction changes schedule ScrollArea ResizeObserver work. Capture
      // settled geometry rather than a stale rail or a still-reflowing document.
      await page.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        {message:"The settled document must contain overflow in its local reading regions"}).toBe(true);
      await stage.scrollIntoViewIfNeeded();
      results.push(await stage.evaluate((node, slug) => {
        const box=node.getBoundingClientRect(), style=getComputedStyle(node), root=document.documentElement;
        return {slug, viewport:innerWidth, pageWidth:root.scrollWidth, stageWidth:box.width, stageHeight:box.height, localScrollWidth:node.scrollWidth, localScrollHeight:node.scrollHeight, localOverflowX:style.overflowX, localOverflowY:style.overflowY};
      }, slug));
      await stage.screenshot({animations:"disabled",path:`${directory}/${slug}.png`});
    await writeFile(`${directory}/${slug}.geometry.json`,JSON.stringify(results,null,2));
    expect(results.filter(row => Number(row.pageWidth)>Number(row.viewport)+1), "Global overflow is not an acceptable replacement for a local scroll region").toEqual([]);
  });
  }
}

test("served Switch keeps its thumb inside both writing directions independent of language", async ({page},info) => {
  await page.goto("/components/switch");
  const control=page.locator(".workbench-stage").getByRole("switch");
  for(const size of [16,32]) for(const direction of ["ltr","rtl"]) {
    await page.evaluate(({size,direction})=>{document.documentElement.lang="en";document.documentElement.style.fontSize=`${size}px`;document.documentElement.dir=direction;}, {size,direction});
    await control.check();
    await expect.poll(()=>control.evaluate(el=>{
      const style=getComputedStyle(el),thumb=getComputedStyle(el,"::before"),width=el.getBoundingClientRect().width;
      const translate=thumb.transform === "none"?0:new DOMMatrix(thumb.transform).m41;
      const thumbWidth=parseFloat(thumb.width);
      const left=thumb.position === "absolute" ? parseFloat(style.borderLeftWidth)+parseFloat(thumb.left)+translate : (style.direction === "rtl"?width-parseFloat(style.borderRightWidth)-parseFloat(style.paddingRight)-thumbWidth:parseFloat(style.borderLeftWidth)+parseFloat(style.paddingLeft))+translate;
      return Number.isFinite(left)&&left>=0&&left+thumbWidth<=width;
    }),`Thumb bounds at root ${size}px ${direction}`).toBe(true);
  }
  await page.locator(".workbench-stage").screenshot({animations:"disabled",path:`.artifacts/foundations-milestone/switch-final-${info.project.name}.png`});
});

test("served controls preserve feedback and focus under forced colors and reduced motion",async({page},info)=>{
  await page.emulateMedia({forcedColors:"active",reducedMotion:"reduce"});
  await page.goto("/components/button");await page.getByRole("checkbox",{name:"Button prop loading",exact:true}).check();
  const stage=page.locator(".workbench-stage"),button=stage.getByRole("button",{name:"Save changes",exact:true});
  await expect(button).toBeDisabled();await expect(button).toHaveAttribute("aria-busy","true");await expect(stage.locator(".flood-spinner")).toHaveCSS("animation-name","none");
  await stage.screenshot({animations:"disabled",path:`.artifacts/foundations-milestone/forced-loading-${info.project.name}.png`});
  await page.goto("/components/input");const input=page.locator(".workbench-stage").getByRole("textbox");await page.keyboard.press("Tab");await input.focus();
  const focus=await input.evaluate(el=>{const s=getComputedStyle(el);return{width:parseFloat(s.borderTopWidth),style:s.borderTopStyle};});expect(focus.width).toBeGreaterThanOrEqual(2);expect(focus.style).toBe("solid");
  await page.locator(".workbench-stage").screenshot({animations:"disabled",path:`.artifacts/foundations-milestone/forced-focus-${info.project.name}.png`});
  await page.goto("/components/skeleton");await expect(page.locator(".workbench-stage .flood-skeleton")).toHaveCSS("animation-name","none");
});

test("coarse pointer controls retain usable adjacent targets in served pages",async({browser},info)=>{
  const context=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:844}});
  try{
    const page=await context.newPage();
    await page.goto((process.env.FLOOD_WEBSITE_TEST_URL ?? "http://127.0.0.1:4173") + "/components/button-group");
    const buttons=page.locator(".workbench-stage .flood-button-group > button");await expect(buttons).toHaveCount(3);
    const boxes=await buttons.evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}));
    for(const box of boxes)expect(box.h).toBeGreaterThanOrEqual(44);
    for(let i=1;i<boxes.length;i++)expect(boxes[i].x).toBeGreaterThanOrEqual(boxes[i-1].x+boxes[i-1].w-1);
    await chooseSelectOption(page.getByRole("combobox",{name:"ButtonGroup prop content",exact:true}),"icons");
    const iconBoxes=await page.locator(".workbench-stage .flood-icon-button").evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return{w:r.width,h:r.height};}));
    for(const box of iconBoxes){expect(box.w).toBeGreaterThanOrEqual(44);expect(box.h).toBeGreaterThanOrEqual(44);}
    await page.goto((process.env.FLOOD_WEBSITE_TEST_URL ?? "http://127.0.0.1:4173") + "/components/checkbox-group");
    const rows=page.locator(".workbench-stage .flood-choice-group > .flood-choice");
    const rowBoxes=await rows.evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return{y:r.y,h:r.height};}));
    for(const box of rowBoxes)expect(box.h).toBeGreaterThanOrEqual(44);
    for(let i=1;i<rowBoxes.length;i++)expect(rowBoxes[i].y).toBeGreaterThanOrEqual(rowBoxes[i-1].y+rowBoxes[i-1].h-1);
    await page.locator(".workbench-stage").screenshot({animations:"disabled",path:`.artifacts/foundations-milestone/coarse-choices-${info.project.name}.png`});
  }finally{await context.close()}
});

test("connected actions retain readable words at narrow enlarged widths",async({page},info)=>{
  await page.setViewportSize({width:320,height:1000});
  const enlarge=()=>page.evaluate(()=>{document.documentElement.style.fontSize="24px";});
  await page.goto("/components/button-group");await enlarge();const stage=page.locator(".workbench-stage"),buttons=stage.getByRole("button");
  const lineCounts=()=>buttons.evaluateAll(nodes=>nodes.map(node=>{const range=document.createRange();range.selectNodeContents(node);return new Set([...range.getClientRects()].filter(r=>r.width>0).map(rect=>Math.round(rect.y))).size;}));
  await expect.poll(lineCounts).toEqual([1,1,1]);
  await buttons.first().focus();await page.keyboard.press("Tab");await page.keyboard.press("Tab");await expect(buttons.last()).toBeFocused();
  expect.soft(await buttons.last().evaluate(node=>{let parent=node.parentElement;while(parent){const s=getComputedStyle(parent);if(parent.scrollWidth>parent.clientWidth+1&&["auto","scroll"].includes(s.overflowX)){const a=node.getBoundingClientRect(),b=parent.getBoundingClientRect();return a.left>=b.left-1&&a.right<=b.right+1;}parent=parent.parentElement;}return true;})).toBe(true);
  await stage.screenshot({animations:"disabled",path:`.artifacts/foundations-milestone/connected-actions-${info.project.name}.png`});
  await page.goto("/components/input-group");await enlarge();const action=page.locator(".workbench-stage").getByRole("button",{name:"Open",exact:true});
  expect(await action.evaluate(node=>{const r=document.createRange();r.selectNodeContents(node);return new Set([...r.getClientRects()].filter(v=>v.width>0).map(v=>Math.round(v.y))).size;})).toBe(1);
  expect(await page.locator(".workbench-stage input").evaluate(node=>node.clientWidth>=parseFloat(getComputedStyle(node).fontSize))).toBe(true);
  await page.locator(".workbench-stage").screenshot({animations:"disabled",path:`.artifacts/foundations-milestone/input-group-stress-${info.project.name}.png`});
});

test("CodeSnippet preserves reading width before allocating its copy action",async({page},info)=>{
  for(const mode of [{width:320,root:24,dir:"ltr"},{width:390,root:32,dir:"rtl"}]){
    await page.setViewportSize({width:mode.width,height:1000});await page.goto("/components/code-snippet");
    const stage=page.locator(".workbench-stage"),snippet=stage.locator(".flood-code-snippet"),code=snippet.locator("code");
    await expect(snippet).toBeVisible();await page.evaluate(({root,dir})=>{document.documentElement.style.fontSize=`${root}px`;document.documentElement.dir=dir;},mode);
    await expect(code).toHaveAttribute("dir","ltr");
    await expect.poll(()=>code.evaluate(node=>node.getBoundingClientRect().width/node.closest('.flood-code-snippet')!.getBoundingClientRect().width),"Code should retain useful width instead of breaking the command into single characters").toBeGreaterThanOrEqual(.5);
    await stage.screenshot({animations:"disabled",path:`.artifacts/foundations-milestone/code-readable-${info.project.name}-${mode.dir}.png`});
  }
});
