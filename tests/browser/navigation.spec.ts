import {test,expect,type Page} from "@playwright/test";
import {build} from "vite";
import {resolve} from "node:path";
import {mkdir,writeFile} from "node:fs/promises";
import {chooseSelectOption,chooseStudioSheetOption} from "./select-helpers";
let bundle:Promise<string>;

test("Tabs keeps the exact count accessible and reveals the focused tab in a narrow rail", async ({page}, info) => {
  await page.goto("/components/tabs");
  const list = page.getByRole("tablist",{name:"Project sections"});
  await page.getByRole("checkbox",{name:"Tabs prop showCounts"}).check();
  const activity = list.getByRole("tab",{name:"Activity",exact:true});
  const settings = list.getByRole("tab",{name:"Settings",exact:true});
  await expect(activity).toHaveAccessibleDescription("137");
  await expect(activity.locator("bdi")).toHaveText("99+");
  await expect(settings.locator("bdi")).toHaveText("0");
  await activity.press("ArrowRight");
  await expect(settings).toBeFocused();
  await page.getByRole("checkbox",{name:"Tabs prop narrow"}).check();
  await expect(settings).toHaveAttribute("aria-selected","true");
  const rail = page.locator(".preview-stage .flood-tabs__scroll");
  await expect.poll(async ()=>{
    const [outer,tab] = await Promise.all([rail.boundingBox(),settings.boundingBox()]);
    return outer!.x <= tab!.x + 1 && outer!.x + outer!.width >= tab!.x + tab!.width - 1;
  }).toBe(true);
  await page.locator(".preview-stage .flood-tabs").screenshot({path:info.outputPath("tab-counts.png")});
});

async function fixture(){
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll("\\","/"));
  const directory=resolve(`.artifacts/navigation-${process.pid}`),entry=resolve(directory,"entry.mjs");await mkdir(directory,{recursive:true});
  await writeFile(entry,`import React,{useState,useEffect,createRef}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,Tabs,Breadcrumb,Pagination,CursorPagination}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};
const h=React.createElement,ref=createRef(),items=[{value:'alpha',label:'Alpha',content:h('input',{'aria-label':'Alpha input',defaultValue:'retained'})},{value:'beta',label:'Beta',content:'Beta',disabled:true},{value:'gamma',label:'Gamma',content:'Gamma content'}];
function App(){const[value,setValue]=useState('alpha'),[page,setPage]=useState(5),[requests,setRequests]=useState(0),[cursor,setCursor]=useState('idle');
useEffect(()=>{window.switchFloodTab=()=>setValue('gamma')},[]);
useEffect(()=>{window.completeCursor=()=>setCursor('ready')},[]);
return h(FloodRoot,null,h(Tabs,{label:'Automatic',items}),h(Tabs,{label:'Manual',items,activationMode:'manual'}),
h(Tabs,{ref,label:'Controlled',items,value,onValueChange:setValue}),h(Tabs,{label:'Frozen',items,value:'alpha',onValueChange:()=>setRequests(n=>n+1)}),
h(Breadcrumb,{items:[{label:'Workspace',href:'/workspace'},{label:'Current'}]}),
h(Pagination,{label:'Local pages',page,pageCount:20,onPageChange:setPage}),h('output',{'aria-label':'Page state'},String(page)),
h(Pagination,{label:'Route pages',page:5,pageCount:20,getHref:p=>'?page='+p,onPageChange:()=>setRequests(n=>n+1)}),
h(CursorPagination,{label:'Cursor pages',position:cursor==='ready'?'26–50':'1–25',previous:{href:'#earlier'},
  next:{onSelect:()=>{setRequests(n=>n+1);setCursor('pending')}},pending:cursor==='pending'?'next':undefined}),
h('button',{onClick:()=>ref.current.querySelector('[role=tab]').focus()},'Focus tabs ref'),h('output',{'aria-label':'Requests'},String(requests)))}
createRoot(document.getElementById('app')).render(h(App));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("production")},build:{write:false,minify:true,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"NavigationFixture"}}});
  const outputs=(Array.isArray(result)?result:[result]).flatMap(item=>"output" in item?item.output:[]);
  const js=outputs.filter(item=>item.type==="chunk").map(item=>item.type==="chunk"?item.code:"").join("\n");
  const css=outputs.filter(item=>item.type==="asset"&&item.fileName.endsWith(".css")).map(item=>item.type==="asset"?String(item.source):"").join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body><main id="app"></main><script>${js.replace(/<\/script/gi,"<\\/script")}</script></body></html>`;
}
async function open(page:Page){bundle??=fixture();const html=await bundle;await page.route("**/__navigation.html",route=>route.fulfill({contentType:"text/html",body:html}));await page.goto("/__navigation.html")}

test("Tabs separates automatic/manual activation and keeps one roving stop with RTL",async({page})=>{
  await open(page);const auto=page.getByRole("tablist",{name:"Automatic"}),manual=page.getByRole("tablist",{name:"Manual"});
  await auto.getByRole("tab",{name:"Alpha"}).focus();await page.keyboard.press("ArrowRight");await expect(auto.getByRole("tab",{name:"Gamma"})).toBeFocused();await expect(auto.getByRole("tab",{name:"Gamma"})).toHaveAttribute("aria-selected","true");
  await page.keyboard.press("Home");await expect(auto.getByRole("tab",{name:"Alpha"})).toHaveAttribute("aria-selected","true");
  await auto.evaluate(node=>node.setAttribute("dir","rtl"));await page.keyboard.press("ArrowLeft");await expect(auto.getByRole("tab",{name:"Gamma"})).toBeFocused();
  await manual.getByRole("tab",{name:"Alpha"}).focus();await page.keyboard.press("End");await expect(manual.getByRole("tab",{name:"Gamma"})).toBeFocused();
  await expect(manual.getByRole("tab",{name:"Alpha"})).toHaveAttribute("aria-selected","true");await page.keyboard.press("Space");await expect(manual.getByRole("tab",{name:"Gamma"})).toHaveAttribute("aria-selected","true");
  await expect(manual.locator('[tabindex="0"]')).toHaveCount(1);await page.keyboard.press("Tab");await expect(page.getByRole("tabpanel",{name:"Gamma",exact:true}).filter({hasText:"Gamma content"}).last()).toBeFocused();
});

test("Tabs retains panel values, respects controlled owners and restores hidden-panel focus",async({page})=>{
  await open(page);const controlled=page.getByRole("tablist",{name:"Controlled"}),root=page.locator(".flood-tabs").filter({has:page.getByRole("tablist",{name:"Controlled"})});
  const input=root.getByRole("textbox",{name:"Alpha input"});await input.fill("saved edit");await controlled.getByRole("tab",{name:"Gamma"}).click();
  await expect(root.getByRole("textbox",{name:"Alpha input"})).toHaveCount(0);await expect(root.locator('input[aria-label="Alpha input"]')).toHaveValue("saved edit");
  await controlled.getByRole("tab",{name:"Alpha"}).click();await input.focus();await page.evaluate(()=>{(window as unknown as {switchFloodTab:()=>void}).switchFloodTab()});
  await expect(controlled.getByRole("tab",{name:"Gamma"})).toBeFocused();
  const frozen=page.getByRole("tablist",{name:"Frozen"});await frozen.getByRole("tab",{name:"Gamma"}).click();await expect(frozen.getByRole("tab",{name:"Alpha"})).toHaveAttribute("aria-selected","true");
  await expect(page.getByLabel("Requests")).toHaveText("1");
  await page.getByRole("button",{name:"Focus tabs ref"}).click();await expect(controlled.getByRole("tab",{name:"Alpha"})).toBeFocused();
});

test("Breadcrumb and Pagination retain link/current/disabled semantics and host ownership",async({page})=>{
  await open(page);const crumbs=page.getByRole("navigation",{name:"Breadcrumb"});
  await expect(crumbs.getByRole("link",{name:"Workspace"})).toHaveAttribute("href","/workspace");await expect(crumbs.locator('[aria-current="page"]')).toHaveText("Current");
  const local=page.getByRole("navigation",{name:"Local pages"}),links=page.getByRole("navigation",{name:"Route pages"});
  await local.getByRole("button",{name:"Next page",exact:true}).click();await expect(page.getByLabel("Page state")).toHaveText("6");
  await local.getByRole("button",{name:"Page 20",exact:true}).click();await expect(local.getByRole("button",{name:"Next page",exact:true})).toBeDisabled();
  await local.getByRole("button",{name:"Page 1",exact:true}).click();await expect(local.getByRole("button",{name:"Previous page",exact:true})).toBeDisabled();
  await expect(links.getByRole("link",{name:"Page 6",exact:true})).toHaveAttribute("href","?page=6");
  await links.getByRole("link",{name:"Page 6",exact:true}).click({modifiers:["Control"]});await expect(page).toHaveURL(/__navigation\.html$/);
  await expect(page.getByLabel("Requests")).toHaveText("0");await expect(links.locator('[aria-current="page"]')).toHaveText("5");
});

test("compact Breadcrumb keeps the current page on one line and earlier links operable", async ({page}, info) => {
  await page.goto("/components/breadcrumb");
  const crumbs = page.locator(".preview-stage").getByRole("navigation",{name:"Breadcrumb",exact:true});
  const knob = (name:string) => page.getByRole("checkbox",{name:`Breadcrumb prop ${name}`,exact:true});
  await knob("deepPath").check();
  await knob("longTitle").check();
  await knob("narrow").check();
  await crumbs.screenshot({path:info.outputPath("breadcrumb-wrap.png")});
  await chooseSelectOption(page.getByRole("combobox",{name:"Breadcrumb prop layout"}),"compact");
  const path = crumbs.locator(":scope > ol");
  const overflow = path.getByRole("button",{name:"Earlier pages",exact:true});
  const current = path.locator('[aria-current="page"]');
  await expect(current.locator(".flood-truncated-text")).toHaveText("November accessibility and interaction release notes");
  const root = path.getByRole("link",{name:"Workspace",exact:true});
  await expect(root).toBeVisible();
  expect(await root.locator(".flood-breadcrumb__clip").evaluate(node=>node.scrollWidth <= node.clientWidth)).toBe(true);
  await expect(path.getByRole("link",{name:"Projects",exact:true})).toHaveCount(0);
  await expect(path).toHaveCSS("flex-wrap","nowrap");
  expect(await path.evaluate(node=>node.scrollWidth)).toBeLessThanOrEqual(await path.evaluate(node=>node.clientWidth));
  await crumbs.screenshot({path:info.outputPath("breadcrumb-compact.png")});
  await overflow.press("Enter");
  const panel = page.getByRole("dialog",{name:"Earlier pages",exact:true});
  const earlier = panel.getByRole("link");
  await expect(earlier).toHaveText(["Projects","Design system","Releases"]);
  await expect(earlier.first()).toBeFocused();
  await expect(earlier.last()).toHaveAttribute("href","#releases");
  await panel.screenshot({path:info.outputPath("breadcrumb-earlier-pages.png")});
  await page.keyboard.press("Escape");
  await expect(overflow).toBeFocused();
  await overflow.press("Enter");
  await earlier.last().press("Enter");
  await expect(panel).toBeHidden();
  await knob("currentLink").check();
  const currentLink = path.getByRole("link",{name:"November accessibility and interaction release notes",exact:true});
  await currentLink.focus();
  await expect(page.getByRole("tooltip")).toHaveText("November accessibility and interaction release notes");
  await expect(currentLink).toHaveAttribute("href","#flood");
  await page.keyboard.press("Escape");
  await chooseSelectOption(page.getByRole("combobox",{name:"Breadcrumb prop maxVisibleItems"}),"3");
  await expect(path.getByRole("link",{name:"Releases",exact:true})).toBeVisible();
  await overflow.press("Enter");
  await expect(earlier).toHaveText(["Projects","Design system"]);
});

test("cursor pagination keeps the request button focused and retains native link behavior", async ({page}, info) => {
  await open(page);
  const nav = page.getByRole("navigation", {name:"Cursor pages"});
  const next = nav.getByRole("button", {name:"Next page"});
  const previous = nav.getByRole("link", {name:"Previous page"});
  await expect(previous).toHaveAttribute("href", "#earlier");
  const width = (await next.boundingBox())!.width;
  await next.press("Enter");
  await expect(next).toBeFocused();
  await expect(next).toHaveAttribute("aria-busy", "true");
  await expect(nav.getByRole("button", {name:"Previous page"})).toBeDisabled();
  expect((await next.boundingBox())!.width).toBeCloseTo(width);
  await next.press("Enter");
  await expect(page.getByLabel("Requests")).toHaveText("1");
  await page.evaluate(() => (window as unknown as {completeCursor:() => void}).completeCursor());
  await expect(nav).toContainText("26–50");
  await expect(next).toBeFocused();
  await expect(previous).toHaveAttribute("href", "#earlier");

  await page.goto("/components/cursor-pagination");
  const example = page.locator(".preview-stage").getByRole("navigation", {name:"Pagination"});
  const forward = example.getByRole("button", {name:"Next page"});
  await expect(example.getByRole("button", {name:"Previous page"})).toBeDisabled();
  await forward.click();
  await expect(example).toContainText("26–50");
  await page.getByRole("checkbox", {name:"CursorPagination prop rtl"}).check();
  await expect(example).toHaveAttribute("dir", "rtl");
  const back = example.getByRole("button", {name:"Previous page"});
  expect((await back.boundingBox())!.x).toBeGreaterThan((await forward.boundingBox())!.x);
  await forward.click();
  await expect(example).toContainText("51–64");
  await expect(forward).toBeDisabled();
  const positions = await example.getByText("51–64",{exact:true}).evaluate(node => {
    const range = document.createRange();
    return [0, 3].map(offset => {
      range.setStart(node.firstChild!, offset);
      range.setEnd(node.firstChild!, offset + 2);
      return range.getBoundingClientRect().left;
    });
  });
  expect(positions[0]).toBeLessThan(positions[1]);
  await example.screenshot({path:info.outputPath("cursor-end-rtl.png")});
});

test("Navigation playgrounds reflow, expose valid recipes and preserve panel behavior",async({page},info)=>{
  for(const slug of ["tabs","breadcrumb","pagination"]){
    await page.setViewportSize(info.project.name==="mobile"?{width:390,height:844}:{width:1440,height:1000});await page.goto(`/components/${slug}`);
    const stage=page.locator(".preview-stage");
    if(slug==="tabs"){
      await chooseSelectOption(page.getByRole("combobox",{name:"Tabs prop orientation",exact:true}),"vertical");
      await stage.getByRole("tab",{name:"Overview"}).focus();await page.keyboard.press("ArrowDown");await expect(stage.getByRole("tab",{name:"Activity"})).toHaveAttribute("aria-selected","true");
      const assertJoined=async(vertical:boolean)=>{
        const tab=await stage.getByRole("tab",{name:"Activity"}).boundingBox(),panel=await stage.getByRole("tabpanel",{name:"Activity"}).boundingBox();
        expect(Math.abs(vertical?tab!.x+tab!.width-panel!.x:tab!.y+tab!.height-panel!.y)).toBeLessThan(1);
      };
      await assertJoined(true);
      await page.locator(".component-workbench").screenshot({path:`.artifacts/tabs-vertical-${info.project.name}.png`});
      await page.getByRole("checkbox",{name:"Tabs prop disabled",exact:true}).check();await expect(stage.getByRole("tabpanel",{name:"Activity"})).toBeVisible();await page.getByRole("checkbox",{name:"Tabs prop disabled",exact:true}).uncheck();
      await chooseSelectOption(page.getByRole("combobox",{name:"Tabs prop orientation",exact:true}),"horizontal");
      await assertJoined(false);
      const variant = page.getByRole("combobox", { name: "Tabs prop variant", exact: true });
      const activity = stage.getByRole("tab", { name: "Activity" });
      await chooseSelectOption(variant, "pill");
      const pill = await activity.evaluate(tab => parseFloat(getComputedStyle(tab).borderTopLeftRadius));
      await chooseSelectOption(variant, "round");
      const round = await activity.evaluate(tab => parseFloat(getComputedStyle(tab).borderTopLeftRadius));
      expect(round).toBeGreaterThan(0);
      expect(round).toBeLessThan(pill);
      await expect(stage.getByRole("tabpanel", { name: "Activity" })).toBeVisible();
    }else if(slug==="pagination"){
      await stage.getByRole("button",{name:"Next page",exact:true}).click();await expect(stage).toContainText("Page 2 of 20");await expect(page.locator("#usage .site-code-block code")).toContainText("useState(2)");
      await page.getByRole("checkbox",{name:"Pagination prop links",exact:true}).check();await stage.getByRole("link",{name:"Next page",exact:true}).click();await expect(stage).toContainText("Page 3 of 20");
    }
    await page.locator(".component-workbench").screenshot({path:`.artifacts/${slug}-${info.project.name}.png`});
    await page.setViewportSize({width:320,height:900});await page.evaluate(()=>{document.documentElement.style.fontSize="24px"});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});

test("Navigation keeps touch targets and forced-color selection cues",async({browser})=>{
  const context=await browser.newContext({baseURL:(process.env.FLOOD_WEBSITE_TEST_URL ?? "http://127.0.0.1:4173"),hasTouch:true,isMobile:true,viewport:{width:390,height:844}});
  try{const page=await context.newPage();await open(page);
    const list=page.getByRole("tablist",{name:"Automatic"}),first=list.getByRole("tab",{name:"Alpha"});
    expect((await first.boundingBox())!.height).toBeGreaterThanOrEqual(43.99);
    const crumbs=page.getByRole("navigation",{name:"Breadcrumb"}),link=crumbs.getByRole("link").first();
    await link.evaluate(node=>{node.textContent="A"});const box=(await link.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(43.99);expect(box.height).toBeGreaterThanOrEqual(43.99);
    const pages=page.getByRole("navigation",{name:"Local pages"});for(const button of await pages.getByRole("button").all()){const bounds=(await button.boundingBox())!;expect(bounds.width).toBeGreaterThanOrEqual(43.99);expect(bounds.height).toBeGreaterThanOrEqual(43.99)}
    await page.emulateMedia({forcedColors:"active"});
    const selected=await first.evaluate(node=>getComputedStyle(node).backgroundColor),other=await list.getByRole("tab",{name:"Gamma"}).evaluate(node=>getComputedStyle(node).backgroundColor);expect(selected).not.toBe(other);
    await page.goto("/components/pagination");await chooseStudioSheetOption(page,"Sibling count","0");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }finally{await context.close()}
});

test("compact pagination keeps one row and preserves button and link semantics", async ({page}) => {
  await page.setViewportSize({width:1440,height:940});
  await page.goto("/components/pagination");
  const property = (name:string) => page.getByRole("combobox",{name:`Pagination prop ${name}`,exact:true});
  await chooseSelectOption(property("presentation"),"compact");
  await chooseSelectOption(property("pageCount"),"100");
  await page.getByRole("checkbox",{name:"Pagination prop narrow",exact:true}).check();
  const nav = page.locator(".preview-stage").getByRole("navigation",{name:"Pagination"});
  const current = nav.locator("[aria-current='page']");
  const previous = nav.getByRole("button",{name:"Previous page"});
  const next = nav.getByRole("button",{name:"Next page"});
  await expect(previous).toBeDisabled();
  await next.press("Enter");
  await expect(next).toBeFocused();
  await expect(current).toHaveText("Page 2 of 100");
  await expect(nav.getByRole("button")).toHaveCount(2);
  const boxes = await Promise.all([previous.boundingBox(),current.boundingBox(),next.boundingBox()]);
  const centers = boxes.map(box=>box!.y + box!.height / 2);
  expect(Math.max(...centers)-Math.min(...centers)).toBeLessThan(1);
  expect(await nav.evaluate(node=>node.scrollWidth <= node.clientWidth)).toBe(true);
  await page.getByRole("checkbox",{name:"Pagination prop links",exact:true}).check();
  await expect(nav.getByRole("link",{name:"Next page"})).toHaveAttribute("href","#page-3");
  await nav.getByRole("link",{name:"Next page"}).click();
  await expect(current).toHaveText("Page 3 of 100");
});

test("DataTable uses compact pagination in its existing footer", async ({page}) => {
  await page.goto("/components/data-table");
  await chooseSelectOption(page.getByRole("combobox",{name:"DataTable prop paginationPresentation",exact:true}),"compact");
  const footer = page.locator(".preview-stage .flood-data-table__footer");
  const nav = footer.getByRole("navigation",{name:"Pagination"});
  await expect(nav.locator("[aria-current='page']")).toHaveText("Page 1 of 2");
  await nav.getByRole("button",{name:"Next page"}).click();
  await expect(nav.locator("[aria-current='page']")).toHaveText("Page 2 of 2");
  await expect(nav.getByRole("button",{name:"Next page"})).toBeDisabled();
});

test("arrows pagination keeps position available and retains localized digits", async ({page}) => {
  await page.goto("/components/pagination");
  const property = (name:string) => page.getByRole("combobox",{name:`Pagination prop ${name}`,exact:true});
  const nav = page.locator(".preview-stage").getByRole("navigation",{name:"Pagination"});
  await page.getByRole("checkbox",{name:"Pagination prop localizedNumbers"}).check();
  await expect(nav.getByRole("button",{name:"Page ١",exact:true})).toHaveText("١");
  await chooseSelectOption(property("presentation"),"arrows");
  const position = nav.locator("[aria-current='page']");
  const next = nav.getByRole("button",{name:"Next page"});
  await expect(nav.getByRole("button")).toHaveCount(2);
  await expect(position.locator("..")).toHaveClass("flood-visually-hidden");
  await next.press("Enter");
  await expect(next).toBeFocused();
  await expect(position).toHaveText("Page ٢ of ٢٠");

  await page.goto("/components/data-table");
  await chooseSelectOption(page.getByRole("combobox",{name:"DataTable prop paginationPresentation"}),"arrows");
  const footer = page.locator(".preview-stage .flood-data-table__footer");
  const tableNav = footer.getByRole("navigation",{name:"Pagination"});
  await expect(tableNav.getByRole("button")).toHaveCount(2);
  await tableNav.getByRole("button",{name:"Next page"}).click();
  await expect(tableNav.locator("[aria-current='page']")).toHaveText("Page 2 of 2");
});
