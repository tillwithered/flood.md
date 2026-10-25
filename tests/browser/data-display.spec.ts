import {test, expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {chooseSelectOption} from "./select-helpers";

test("DescriptionList responds to its container and keeps tight term/value grouping",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("/components/description-list");
  const list=page.locator(".workbench-stage dl");
  await expect(list.locator("dt")).toHaveText(["Project","Version","Owner"]);
  const rects=()=>list.evaluate(el=>{const dt=el.querySelector('dt')!.getBoundingClientRect(),dd=el.querySelector('dd')!.getBoundingClientRect(),next=el.querySelectorAll('dt')[1].getBoundingClientRect();return{termTop:dt.top,termBottom:dt.bottom,valueTop:dd.top,pitch:next.top-dt.top};});
  const inline=await rects();expect(inline.valueTop).toBeCloseTo(inline.termTop,1);
  await chooseSelectOption(page.getByRole("combobox",{name:"DescriptionList prop density"}),"comfortable");
  expect((await rects()).pitch).toBeGreaterThan(inline.pitch+6);
  await list.evaluate(el=>{el.style.width="18rem";});
  const stacked=await rects();expect(stacked.valueTop-stacked.termBottom).toBeCloseTo(4,1);
  await list.evaluate(el=>{el.style.width="100%";});
  await chooseSelectOption(page.getByRole("combobox",{name:"DescriptionList prop layout"}),"stacked");
  expect((await rects()).valueTop).toBeGreaterThan((await rects()).termBottom);
  await page.getByRole("checkbox",{name:"DescriptionList prop longValue"}).check();
  await page.setViewportSize({width:320,height:900});
  await page.evaluate(()=>{document.documentElement.style.fontSize="24px";document.documentElement.dir="rtl";});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("Table preserves its caption, native headers and keyboard horizontal scrolling",async({page})=>{
  await page.setViewportSize({width:390,height:900});
  await page.goto("/components/table");
  const stage=page.locator(".workbench-stage"),table=stage.getByRole("table",{name:"Workspace projects",exact:true});
  const viewport=stage.getByRole("region",{name:"Workspace projects",exact:true});
  await expect(table.getByRole("columnheader")).toHaveCount(4);
  await expect(table.getByRole("rowheader",{name:"Flood",exact:true})).toHaveAttribute("scope","row");
  await expect.poll(()=>viewport.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);
  await viewport.focus();await page.keyboard.press("ArrowRight");
  await expect.poll(()=>viewport.evaluate(el=>Math.abs(el.scrollLeft))).toBeGreaterThan(0);
  await page.getByRole("checkbox",{name:"Table prop hideCaption"}).check();
  await expect(table).toBeVisible();
  await expect(table.locator("caption")).toHaveClass("flood-visually-hidden");
  await page.getByRole("checkbox",{name:"Table prop empty"}).check();
  await expect(table.getByRole("cell",{name:"No projects yet."})).toHaveAttribute("colspan","4");
  await expect(table.locator("tfoot")).toHaveCount(0);
  await page.getByRole("checkbox",{name:"Table prop empty"}).uncheck();
  await expect(table.getByRole("cell",{name:"50 GB",exact:true})).toBeAttached();
  await chooseSelectOption(page.getByRole("combobox",{name:"Table prop density"}),"compact");
  await page.evaluate(()=>{document.documentElement.style.fontSize="24px";document.documentElement.dir="rtl";});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(table.locator('[data-numeric]').first()).toHaveCSS("text-align","end");
});

test("data examples are accessible and use the shared scroll area without page overflow",async({page},info)=>{
  await page.goto("/playground/content#data");
  const section=page.locator("#data");
  await expect(section.locator("dl dt")).toHaveCount(5);
  await expect(section.getByRole("table",{name:"Workspace projects",exact:true})).toBeVisible();
  await expect(section.getByRole("link",{name:"Design team",exact:true})).toBeVisible();
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.setViewportSize({width:320,height:900});
  await page.evaluate(()=>{document.documentElement.style.fontSize="24px";});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.emulateMedia({forcedColors:"active"});
  await expect(section.getByRole("table").getByRole("columnheader").first()).toHaveCSS("border-bottom-style","solid");
  await page.emulateMedia({forcedColors:"none"});
  await page.setViewportSize(info.project.name==="desktop"?{width:1440,height:1000}:{width:390,height:844});
  await page.evaluate(()=>{document.documentElement.style.fontSize="";});
  await section.screenshot({path:`.artifacts/data-display-${info.project.name}.png`});
});
