import {test,expect,type Page} from "@playwright/test";
import {build} from "vite";
import {resolve} from "node:path";
import {mkdir,writeFile} from "node:fs/promises";
import {chooseSelectOption} from "./select-helpers";

let bundle:Promise<string>;
async function fixture(){
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll("\\","/"));
  const directory=resolve(`.artifacts/disclosure-${process.pid}`),entry=resolve(directory,"entry.mjs");await mkdir(directory,{recursive:true});
  await writeFile(entry,`import React,{useState,useEffect,createRef}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,Collapsible,Accordion}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};
const h=React.createElement,ref=createRef(),items=[{value:'first',title:'First',content:h(Accordion,{label:'Nested',items:[{value:'a',title:'Nested A',content:'A'},{value:'b',title:'Nested B',content:'B'}]})},{value:'second',title:'Second',content:h('input',{'aria-label':'Second input',defaultValue:'retained'})},{value:'third',title:'Third',content:'Third',disabled:true}];
function App(){const[open,setOpen]=useState(true),[values,setValues]=useState([]),[count,setCount]=useState(0);
useEffect(()=>{window.closeFlood=()=>setOpen(false)},[]);
return h(FloodRoot,null,h(Collapsible,{title:'Local',ref,onOpenChange:()=>setCount(n=>n+1)},h('input',{'aria-label':'Local input',defaultValue:'draft'})),
h(Collapsible,{title:'Controlled',open,onOpenChange:setOpen},h('input',{'aria-label':'Controlled input',defaultValue:'saved'})),
h(Collapsible,{title:'Frozen',open:false},'Frozen'),h(Collapsible,{title:'Disabled',disabled:true},'Disabled'),
h(Accordion,{label:'Single',items,defaultValue:['first'],headingLevel:2}),
h(Accordion,{label:'Multiple',items,expansionMode:'multiple',value:values,onValueChange:setValues,headingLevel:2}),
h('button',{onClick:()=>ref.current.querySelector('button').focus()},'Focus ref'),h('output',{'aria-label':'Changes'},String(count)))}
createRoot(document.getElementById('app')).render(h(App));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("production")},build:{write:false,minify:true,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"DisclosureFixture"}}});
  const outputs=(Array.isArray(result)?result:[result]).flatMap(item=>"output" in item?item.output:[]);
  const js=outputs.filter(item=>item.type==="chunk").map(item=>item.type==="chunk"?item.code:"").join("\n");
  const css=outputs.filter(item=>item.type==="asset"&&item.fileName.endsWith(".css")).map(item=>item.type==="asset"?String(item.source):"").join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css}</style></head><body><main id="app"></main><script>${js.replace(/<\/script/gi,"<\\/script")}</script></body></html>`;
}
async function open(page:Page){bundle??=fixture();const html=await bundle;await page.route("**/__disclosure.html",route=>route.fulfill({contentType:"text/html",body:html}));await page.goto("/__disclosure.html")}

test("Collapsible keyboard, mounted state, controlled ownership and closing focus",async({page})=>{
  await open(page);const local=page.getByRole("button",{name:"Local",exact:true});
  await expect(local).toHaveAttribute("aria-expanded","false");await expect(page.getByRole("textbox",{name:"Local input",exact:true})).toHaveCount(0);
  await local.focus();await page.keyboard.press("Enter");await expect(local).toHaveAttribute("aria-expanded","true");
  await page.getByLabel("Local input").fill("kept draft");await local.focus();await page.keyboard.press("Space");
  await expect(page.locator('input[aria-label="Local input"]')).toHaveValue("kept draft");await expect(page.locator('input[aria-label="Local input"]')).toBeHidden();
  await page.keyboard.press("Tab");await expect(page.getByRole("button",{name:"Controlled",exact:true})).toBeFocused();
  await expect(page.getByLabel("Changes")).toHaveText("2");
  await page.getByRole("button",{name:"Frozen",exact:true}).click();await expect(page.getByRole("button",{name:"Frozen",exact:true})).toHaveAttribute("aria-expanded","false");
  await expect(page.getByRole("button",{name:"Disabled",exact:true})).toBeDisabled();
  await page.getByLabel("Controlled input").focus();await page.evaluate(()=>{(window as unknown as {closeFlood:()=>void}).closeFlood()});
  await expect(page.getByRole("button",{name:"Controlled",exact:true})).toBeFocused();await expect(page.getByLabel("Controlled input")).toBeHidden();
  await page.getByRole("button",{name:"Focus ref",exact:true}).click();await expect(local).toBeFocused();
});

test("Accordion expansion modes and nested keyboard scopes stay independent",async({page})=>{
  await open(page);const single=page.getByRole("group",{name:"Single",exact:true}),multiple=page.getByRole("group",{name:"Multiple",exact:true});
  const first=single.getByRole("button",{name:"First",exact:true}),second=single.getByRole("button",{name:"Second",exact:true});
  await first.focus();await page.keyboard.press("ArrowDown");await expect(second).toBeFocused();await expect(first).toHaveAttribute("aria-expanded","true");
  await page.keyboard.press("Enter");await expect(second).toHaveAttribute("aria-expanded","true");await expect(first).toHaveAttribute("aria-expanded","false");
  await page.keyboard.press("End");await expect(second).toBeFocused();await page.keyboard.press("ArrowDown");await expect(first).toBeFocused();
  await first.click();const nested=single.getByRole("group",{name:"Nested",exact:true});
  await nested.getByRole("button",{name:"Nested A",exact:true}).focus();await page.keyboard.press("ArrowDown");await expect(nested.getByRole("button",{name:"Nested B",exact:true})).toBeFocused();
  await multiple.getByRole("button",{name:"First",exact:true}).click();await multiple.getByRole("button",{name:"Second",exact:true}).click();
  await expect(multiple.getByRole("button",{name:"First",exact:true})).toHaveAttribute("aria-expanded","true");await expect(multiple.getByRole("button",{name:"Second",exact:true})).toHaveAttribute("aria-expanded","true");
  await multiple.getByRole("button",{name:"First",exact:true}).click();await expect(multiple.getByRole("button",{name:"First",exact:true})).toHaveAttribute("aria-expanded","false");
});

test("Disclosure previews preserve frame geometry, heading semantics and reduced motion",async({page},info)=>{
  for(const slug of ["collapsible","accordion"]){
    await page.setViewportSize(info.project.name==="mobile"?{width:390,height:844}:{width:1440,height:1000});
    await page.goto(`/components/${slug}`);const stage=page.locator(".preview-stage"),box=(await stage.boundingBox())!,trigger=stage.getByRole("button").first();
    const header=(await trigger.boundingBox())!,item=(await stage.locator(".flood-disclosure").first().boundingBox())!;
    expect(header.width).toBeGreaterThanOrEqual(item.width-2.1);
    expect((await trigger.locator(".flood-disclosure__indicator").boundingBox())!.x).toBeGreaterThan(header.x+header.width*.75);
    await trigger.click();await expect(trigger).toHaveAttribute("aria-expanded","true");
    expect((await stage.boundingBox())!.height).toBeCloseTo(box.height,1);
    await page.locator(".component-workbench").screenshot({path:`.artifacts/${slug}-${info.project.name}.png`});
    await page.emulateMedia({reducedMotion:"reduce"});await expect(trigger.locator(".flood-disclosure__indicator")).toHaveCSS("transition-duration","0s");
    if(slug==="accordion"){
      await expect(stage.getByRole("heading",{level:2})).toHaveCount(3);
      await chooseSelectOption(page.getByRole("combobox",{name:"Accordion prop expansionMode",exact:true}),"multiple");
      await stage.getByRole("button").nth(0).click();await stage.getByRole("button").nth(1).click();
      await expect(stage.locator('button[aria-expanded="true"]')).toHaveCount(2);
    }
    await page.setViewportSize({width:320,height:900});await page.evaluate(()=>{document.documentElement.style.fontSize="24px"});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});
