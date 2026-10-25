import {test, expect, type Page} from "@playwright/test";
import {build} from "vite";
import {resolve} from "node:path";
import {mkdir, writeFile} from "node:fs/promises";
import {chooseSelectOption} from "./select-helpers";

let bundle: Promise<string>;
async function fixture() {
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll("\\","/"));
  const directory=resolve(`.artifacts/segments-${process.pid}`),entry=resolve(directory,"entry.mjs");
  await mkdir(directory,{recursive:true});
  await writeFile(entry,`import React,{useState,createRef}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,SegmentedControl}from ${file("packages/react/dist/index.js")};
import ${file("packages/react/dist/styles.css")};
const h=React.createElement,options=[{value:'day',label:'Day'},{value:'week',label:'Week',disabled:true},{value:'month',label:'Month'}],ref=createRef();
function App(){const[value,setValue]=useState('day'),[cancel,setCancel]=useState(false),[count,setCount]=useState(0);
return h(FloodRoot,null,h('form',{id:'owner',onReset:e=>{if(cancel)e.preventDefault()}},
h(SegmentedControl,{ref,label:'Local',name:'local',options,defaultValue:'day',onValueChange:()=>setCount(n=>n+1)}),
h(SegmentedControl,{label:'Controlled',name:'controlled',options,value,onValueChange:setValue}),
h(SegmentedControl,{label:'Frozen',name:'frozen',options,value:'day'}),
h(SegmentedControl,{label:'Disabled',name:'disabled',options,disabled:true,defaultValue:'day'}),
h('button',{type:'reset'},'Reset'),h('button',{type:'button',onClick:()=>setCancel(v=>!v)},'Cancel reset'),
h('button',{type:'button',onClick:()=>ref.current.querySelector('input').focus()},'Focus ref'),
h('output',{'aria-label':'Changes'},String(count))),
h('form',{id:'external'}),h(SegmentedControl,{label:'External',name:'externalChoice',form:'external',options,defaultValue:'month'}),
h('form',{id:'required'},h(SegmentedControl,{label:'Required',name:'requiredChoice',options,required:true})))
}createRoot(document.getElementById('app')).render(h(App));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("production")},build:{write:false,minify:true,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"SegmentFixture"}}});
  const outputs=(Array.isArray(result)?result:[result]).flatMap(item=>"output" in item?item.output:[]);
  const js=outputs.filter(item=>item.type==="chunk").map(item=>item.type==="chunk"?item.code:"").join("\n");
  const css=outputs.filter(item=>item.type==="asset"&&item.fileName.endsWith(".css")).map(item=>item.type==="asset"?String(item.source):"").join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css}</style></head><body><main id="app"></main><script>${js.replace(/<\/script/gi,"<\\/script")}</script></body></html>`;
}
async function open(page:Page){bundle??=fixture();const html=await bundle;await page.route("**/__segments.html",route=>route.fulfill({contentType:"text/html",body:html}));await page.goto("/__segments.html")}

test("SegmentedControl retains controlled/native form, reset and external ownership",async({page})=>{
  await open(page);
  const local=page.getByRole("radiogroup",{name:"Local",exact:true}),controlled=page.getByRole("radiogroup",{name:"Controlled",exact:true});
  await local.getByRole("radio",{name:"Month",exact:true}).check();
  await controlled.getByRole("radio",{name:"Month",exact:true}).check();
  await page.getByRole("radiogroup",{name:"Frozen",exact:true}).getByRole("radio",{name:"Month",exact:true}).click();
  await expect(page.getByRole("radiogroup",{name:"Frozen",exact:true}).getByRole("radio",{name:"Day",exact:true})).toBeChecked();
  expect(await page.locator("#owner").evaluate(node=>Object.fromEntries(new FormData(node as HTMLFormElement)))).toEqual({local:"month",controlled:"month",frozen:"day"});
  expect(await page.locator("#external").evaluate(node=>new FormData(node as HTMLFormElement).get("externalChoice"))).toBe("month");
  expect(await page.locator("#required").evaluate(node=>(node as HTMLFormElement).checkValidity())).toBe(false);
  await page.getByRole("button",{name:"Reset",exact:true}).click();
  await expect(local.getByRole("radio",{name:"Day",exact:true})).toBeChecked();
  await expect(controlled.getByRole("radio",{name:"Month",exact:true})).toBeChecked();
  await expect(page.getByLabel("Changes")).toHaveText("1");
  await local.getByRole("radio",{name:"Month",exact:true}).check();
  await page.getByRole("button",{name:"Cancel reset",exact:true}).click();await page.getByRole("button",{name:"Reset",exact:true}).click();
  await expect(local.getByRole("radio",{name:"Month",exact:true})).toBeChecked();
  await page.getByRole("button",{name:"Focus ref",exact:true}).click();await expect(local.getByRole("radio",{name:"Day",exact:true})).toBeFocused();
});

test("SegmentedControl keyboard selects, skips disabled, wraps and follows RTL",async({page})=>{
  await open(page);const group=page.getByRole("radiogroup",{name:"Local",exact:true}),day=group.getByRole("radio",{name:"Day",exact:true}),month=group.getByRole("radio",{name:"Month",exact:true});
  await day.focus();await page.keyboard.press("ArrowRight");await expect(month).toBeChecked();await expect(month).toBeFocused();
  await page.keyboard.press("Space");await expect(month).toBeChecked();
  await page.keyboard.press("ArrowDown");await expect(day).toBeChecked();
  await page.keyboard.press("End");await expect(month).toBeChecked();
  await page.keyboard.press("Home");await expect(day).toBeChecked();
  await group.evaluate(node=>node.setAttribute("dir","rtl"));await page.keyboard.press("ArrowLeft");await expect(month).toBeChecked();
  await page.keyboard.press("Tab");await expect(page.getByRole("radiogroup",{name:"Controlled",exact:true}).getByRole("radio",{name:"Day",exact:true})).toBeFocused();
});

test("SegmentedControl geometry is concentric and remains stable across choices and sizes",async({page},info)=>{
  await page.goto("/components/segmented-control");const stage=page.locator(".preview-stage"),group=stage.getByRole("radiogroup"),shell=group.locator(".flood-choice-group");
  for(const size of ["sm","md","lg","xl"]){
    await chooseSelectOption(page.getByRole("combobox",{name:"SegmentedControl prop controlSize",exact:true}),size);
    const first=(await group.getByRole("radio",{name:"Day",exact:true}).locator("..").boundingBox())!,outer=(await shell.boundingBox())!;
    expect(first.x-outer.x).toBeCloseTo(first.y-outer.y,1);expect(first.y-outer.y).toBeCloseTo(4,1);
    const before=(await shell.boundingBox())!;await group.getByRole("radio",{name:"Week",exact:true}).check();
    expect((await shell.boundingBox())!.height).toBeCloseTo(before.height,1);expect((await shell.boundingBox())!.y).toBeCloseTo(before.y,1);
  }
  await chooseSelectOption(page.getByRole("combobox",{name:"SegmentedControl prop controlSize",exact:true}),"md");
  await page.locator(".component-workbench").screenshot({path:`.artifacts/segmented-${info.project.name}.png`});
  await page.getByRole("checkbox",{name:"SegmentedControl prop fullWidth",exact:true}).check();
  const labels=await shell.locator(".flood-choice").evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().width));
  expect(labels[0]).toBeCloseTo(labels[2],1);
  await chooseSelectOption(page.getByRole("combobox",{name:"SegmentedControl prop content",exact:true}),"icons");
  await expect(group.getByRole("radio",{name:"Month",exact:true})).toHaveCount(1);
  await chooseSelectOption(page.getByRole("combobox",{name:"SegmentedControl prop orientation",exact:true}),"vertical");
  await expect(shell).toHaveCSS("flex-direction","column");
  await expect(page.locator("#usage .site-code-block code")).toContainText("CalendarDays");
  await page.setViewportSize({width:320,height:900});await page.evaluate(()=>{document.documentElement.style.fontSize="24px"});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("SegmentedControl preserves touch targets and forced-color selection",async({browser})=>{
  const context=await browser.newContext({baseURL:(process.env.FLOOD_WEBSITE_TEST_URL ?? "http://127.0.0.1:4173"),hasTouch:true,isMobile:true,viewport:{width:390,height:844}});
  try{const page=await context.newPage();await page.goto("/components/segmented-control");
    const group=page.locator(".preview-stage").getByRole("radiogroup");
    for(const radio of await group.getByRole("radio").all()){const box=(await radio.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44)}
    await page.emulateMedia({forcedColors:"active"});const day=group.getByRole("radio",{name:"Day",exact:true});await day.focus();
    await expect(day.locator("..")).toHaveCSS("outline-width","2px");
    const selected=await day.locator("..").evaluate(node=>getComputedStyle(node).backgroundColor);
    const other=await group.getByRole("radio",{name:"Month",exact:true}).locator("..").evaluate(node=>getComputedStyle(node).backgroundColor);
    expect(selected).not.toBe(other);
  }finally{await context.close()}
});
