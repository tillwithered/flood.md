import {test,expect,type Page} from "@playwright/test";
import {build} from "vite";
import {resolve} from "node:path";
import {mkdir,writeFile} from "node:fs/promises";
import {chooseSelectOption} from "./select-helpers";
let bundle:Promise<string>;
async function fixture(){
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll("\\","/"));
  const directory=resolve(`.artifacts/navigation-${process.pid}`),entry=resolve(directory,"entry.mjs");await mkdir(directory,{recursive:true});
  await writeFile(entry,`import React,{useState,useEffect,createRef}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,Tabs,Breadcrumb,Pagination}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};
const h=React.createElement,ref=createRef(),items=[{value:'alpha',label:'Alpha',content:h('input',{'aria-label':'Alpha input',defaultValue:'retained'})},{value:'beta',label:'Beta',content:'Beta',disabled:true},{value:'gamma',label:'Gamma',content:'Gamma content'}];
function App(){const[value,setValue]=useState('alpha'),[page,setPage]=useState(5),[requests,setRequests]=useState(0);
useEffect(()=>{window.switchFloodTab=()=>setValue('gamma')},[]);
return h(FloodRoot,null,h(Tabs,{label:'Automatic',items}),h(Tabs,{label:'Manual',items,activationMode:'manual'}),
h(Tabs,{ref,label:'Controlled',items,value,onValueChange:setValue}),h(Tabs,{label:'Frozen',items,value:'alpha',onValueChange:()=>setRequests(n=>n+1)}),
h(Breadcrumb,{items:[{label:'Workspace',href:'/workspace'},{label:'Current'}]}),
h(Pagination,{label:'Local pages',page,pageCount:20,onPageChange:setPage}),h('output',{'aria-label':'Page state'},String(page)),
h(Pagination,{label:'Route pages',page:5,pageCount:20,getHref:p=>'?page='+p,onPageChange:()=>setRequests(n=>n+1)}),
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

test("Navigation playgrounds reflow, expose valid recipes and preserve panel behavior",async({page},info)=>{
  for(const slug of ["tabs","breadcrumb","pagination"]){
    await page.setViewportSize(info.project.name==="mobile"?{width:390,height:844}:{width:1440,height:1000});await page.goto(`/components/${slug}`);
    const stage=page.locator(".preview-stage");
    if(slug==="tabs"){
      await chooseSelectOption(page.getByRole("combobox",{name:"Tabs prop orientation",exact:true}),"vertical");
      await stage.getByRole("tab",{name:"Overview"}).focus();await page.keyboard.press("ArrowDown");await expect(stage.getByRole("tab",{name:"Activity"})).toHaveAttribute("aria-selected","true");
      await page.getByRole("checkbox",{name:"Tabs prop disabled",exact:true}).check();await expect(stage.getByRole("tabpanel",{name:"Activity"})).toBeVisible();await page.getByRole("checkbox",{name:"Tabs prop disabled",exact:true}).uncheck();
      await chooseSelectOption(page.getByRole("combobox",{name:"Tabs prop orientation",exact:true}),"horizontal");
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
  const context=await browser.newContext({baseURL:"http://127.0.0.1:4173",hasTouch:true,isMobile:true,viewport:{width:390,height:844}});
  try{const page=await context.newPage();await open(page);
    const list=page.getByRole("tablist",{name:"Automatic"}),first=list.getByRole("tab",{name:"Alpha"});
    expect((await first.boundingBox())!.height).toBeGreaterThanOrEqual(43.99);
    const crumbs=page.getByRole("navigation",{name:"Breadcrumb"}),link=crumbs.getByRole("link").first();
    await link.evaluate(node=>{node.textContent="A"});const box=(await link.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(43.99);expect(box.height).toBeGreaterThanOrEqual(43.99);
    const pages=page.getByRole("navigation",{name:"Local pages"});for(const button of await pages.getByRole("button").all()){const bounds=(await button.boundingBox())!;expect(bounds.width).toBeGreaterThanOrEqual(43.99);expect(bounds.height).toBeGreaterThanOrEqual(43.99)}
    await page.emulateMedia({forcedColors:"active"});
    const selected=await first.evaluate(node=>getComputedStyle(node).backgroundColor),other=await list.getByRole("tab",{name:"Gamma"}).evaluate(node=>getComputedStyle(node).backgroundColor);expect(selected).not.toBe(other);
    await page.goto("/components/pagination");await chooseSelectOption(page.getByRole("combobox",{name:"Pagination prop siblingCount",exact:true}),"0");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }finally{await context.close()}
});
