import {test, expect, type Page} from "@playwright/test";
import {build} from "vite";
import {resolve} from "node:path";
import {mkdir, writeFile} from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";

let bundled: Promise<string>;
async function fixture() {
  const file = (path:string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  const directory=resolve(`.artifacts/tree-${process.pid}`),entry=resolve(directory,"entry.mjs");
  await mkdir(directory,{recursive:true});
  await writeFile(entry,`import React,{useState,StrictMode}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,Tree,Button,Input}from ${file("packages/react/dist/index.js")};
import ${file("packages/react/dist/styles.css")};const h=React.createElement;
const items=[{value:'src',label:'Source',selectable:false,children:[{value:'ui',label:'Components',selectable:false,children:[{value:'button',label:'Button',description:'Primary action'},{value:'input',label:'Input'}]},{value:'locked',label:'Locked',disabled:true},{value:'readonly',label:'Read only',readOnly:true}]},{value:'docs',label:'Documentation',children:[{value:'intro',label:'Introduction'}]},{value:'async',label:'Remote files',hasChildren:true,loading:true},{value:'readme',label:'README.md'}];
function App(){const[multiple,M]=useState(false),[readonly,R]=useState(false),[disabled,D]=useState(false),[refuse,F]=useState(false),[trim,T]=useState(false),[empty,E]=useState(false),[collapse,C]=useState(false),[requests,Q]=useState([]);
return h(FloodRoot,{style:{padding:'1rem',maxWidth:'26rem'}},h('h1',null,'Tree checks'),
h(Tree,{label:'Project files',items:empty?[]:trim?items.filter(item=>item.value!=='src'):items,multiple,readOnly:readonly,disabled,defaultExpandedValues:['src','ui'],expandedValues:collapse?[]:undefined,value:refuse?'button':undefined,onValueChange:value=>Q(old=>[...old,value])}),
h(Button,{onClick:()=>M(value=>!value)},'Multiple'),h(Button,{onClick:()=>R(value=>!value)},'Read only'),h(Button,{onClick:()=>D(value=>!value)},'Disable'),h(Button,{onClick:()=>F(value=>!value)},'Refuse'),h(Button,{onClick:()=>T(true)},'Remove source'),h(Button,{onClick:()=>E(true)},'Empty'),h(Button,{onClick:()=>C(true)},'Collapse all'),h(Input,{'aria-label':'Outside field'}),h('output',{'aria-label':'Selection requests'},JSON.stringify(requests)));}
createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("production")},build:{write:false,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"TreeFixture"}}});
  const output=Array.isArray(result)?result[0].output:result.output;
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tree checks</title><style>'+output.filter(x=>x.type==="asset"&&x.fileName.endsWith(".css")).map(x=>(x as any).source).join("")+'</style></head><body><main id="app"></main><script>'+output.filter(x=>x.type==="chunk").map(x=>(x as any).code).join("")+'</script></body></html>';
}
async function open(page:Page) {
  bundled??=fixture();
  await page.route("**/__tree.html",async route=>route.fulfill({contentType:"text/html",body:await bundled}));
  await page.goto("/__tree.html");
  await expect(page.getByRole("tree",{name:"Project files",exact:true})).toBeVisible();
}
const item=(page:Page,name:string)=>page.getByRole("treeitem",{name:name==="Button"?"Button Primary action":name,exact:true});

test("Tree keeps focus distinct from selection and follows visible hierarchy",async({page})=>{
  await open(page); const tree=page.getByRole("tree");
  await item(page,"Source").focus();
  await page.keyboard.press("ArrowDown");await expect(item(page,"Components")).toBeFocused();
  await page.keyboard.press("ArrowDown");await expect(item(page,"Button")).toBeFocused();
  await expect(tree.locator('[aria-selected="true"]')).toHaveCount(0);
  await page.keyboard.press("Enter");await expect(item(page,"Button")).toHaveAttribute("aria-selected","true");
  await page.keyboard.press("ArrowDown");await expect(item(page,"Input")).toBeFocused();
  await expect(item(page,"Button")).toHaveAttribute("aria-selected","true");
  await page.keyboard.press("Home");await expect(item(page,"Source")).toBeFocused();
  await page.keyboard.press("End");await expect(item(page,"README.md")).toBeFocused();
  await page.keyboard.press("d");await expect(item(page,"Documentation")).toBeFocused();
  await page.keyboard.press("ArrowRight");await expect(item(page,"Documentation")).toHaveAttribute("aria-expanded","true");
  await page.keyboard.press("ArrowRight");await expect(item(page,"Introduction")).toBeFocused();
  await page.keyboard.press("ArrowLeft");await expect(item(page,"Documentation")).toBeFocused();
  await page.keyboard.press("ArrowLeft");await expect(item(page,"Documentation")).toHaveAttribute("aria-expanded","false");
});

test("Tree multiple selection is explicit, independent and blocked for unavailable nodes",async({page})=>{
  await open(page);await page.getByRole("button",{name:"Multiple",exact:true}).click();
  await item(page,"Button").focus();await page.keyboard.press(" ");
  await page.keyboard.press("ArrowDown");await page.keyboard.press(" ");
  await expect(item(page,"Button")).toHaveAttribute("aria-selected","true");
  await expect(item(page,"Input")).toHaveAttribute("aria-selected","true");
  await item(page,"Locked").focus();await page.keyboard.press("Enter");
  await expect(item(page,"Locked")).toHaveAttribute("aria-disabled","true");
  await expect(item(page,"Locked")).not.toHaveAttribute("aria-selected","true");
  await item(page,"Read only").focus();await page.keyboard.press(" ");
  await expect(item(page,"Read only")).not.toHaveAttribute("aria-selected","true");
  await expect(page.getByRole("tree").locator('[aria-selected="true"]')).toHaveCount(2);
});

test("Tree controlled refusal and read-only preserve state while browsing remains possible",async({page})=>{
  await open(page);await page.getByRole("button",{name:"Refuse",exact:true}).click();
  await item(page,"Input").click();await expect(item(page,"Button")).toHaveAttribute("aria-selected","true");
  await expect(item(page,"Input")).not.toHaveAttribute("aria-selected","true");
  await expect(page.getByRole("status",{name:"Selection requests"})).toContainText('input');
  await page.getByRole("button",{name:"Read only",exact:true}).click();
  const before=await page.getByRole("status",{name:"Selection requests"}).textContent();
  await item(page,"Input").focus();await page.keyboard.press("Enter");
  await expect(page.getByRole("status",{name:"Selection requests"})).toHaveText(before!);
  await item(page,"Documentation").focus();await page.keyboard.press("ArrowRight");
  await expect(item(page,"Introduction")).toBeVisible();
});

test("Tree handles host collapse/removal, loading and empty data without stealing outside focus",async({page})=>{
  await open(page);await item(page,"Remote files").focus();await page.keyboard.press("ArrowRight");
  await expect(item(page,"Remote files")).toHaveAttribute("aria-busy","true");
  await page.getByRole("textbox",{name:"Outside field"}).focus();
  await page.getByRole("button",{name:"Collapse all",exact:true}).evaluate((node:HTMLButtonElement)=>node.click());
  await expect(page.getByRole("textbox",{name:"Outside field"})).toBeFocused();
  await page.getByRole("button",{name:"Remove source",exact:true}).click();
  await expect(item(page,"Source")).toHaveCount(0);
  await page.getByRole("button",{name:"Empty",exact:true}).click();
  await expect(page.getByRole("treeitem")).toHaveCount(0);
  await expect(page.getByRole("tree")).toBeVisible();
});

test("Tree logical arrows, enlarged text, long labels and forced colors retain operability",async({page})=>{
  await open(page);await page.setViewportSize({width:320,height:900});
  await page.evaluate(()=>{document.documentElement.dir='rtl';document.documentElement.style.fontSize='24px';});
  await item(page,"Documentation").focus();await page.keyboard.press("ArrowLeft");
  await expect(item(page,"Introduction")).toBeVisible();
  await page.keyboard.press("ArrowLeft");await expect(item(page,"Introduction")).toBeFocused();
  await page.keyboard.press("ArrowRight");await expect(item(page,"Documentation")).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.emulateMedia({forcedColors:"active"});await page.keyboard.press("Enter");
  await expect(item(page,"Documentation")).toBeFocused();
});

test("Tree structure has no automated accessibility violations",async({page})=>{
  await open(page); const result=await new AxeBuilder({page}).analyze();
  expect(result.violations).toEqual([]);
  await page.getByRole("button",{name:"Empty",exact:true}).click();
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});

test("Tree repairs an externally collapsed focused descendant to its visible ancestor",async({page})=>{
  await open(page);await item(page,"Button").focus();
  await page.getByRole("button",{name:"Collapse all",exact:true}).evaluate((node:HTMLButtonElement)=>node.click());
  await expect(item(page,"Source")).toBeFocused();
  await expect(item(page,"Button")).toHaveCount(0);
});

test("Tree preserves collapsed selections but excludes removed objects from later requests",async({page})=>{
  await open(page);await page.getByRole("button",{name:"Multiple",exact:true}).click();
  await item(page,"Button").click();await item(page,"Input").click();
  await page.getByRole("button",{name:"Collapse all",exact:true}).click();
  await item(page,"README.md").click();
  const requests=page.getByRole("status",{name:"Selection requests"});
  await expect(requests).toContainText('["button","input","readme"]');
  await page.getByRole("button",{name:"Remove source",exact:true}).click();
  await item(page,"README.md").click();
  expect(JSON.parse((await requests.textContent())!)).toEqual([["button"],["button","input"],["button","input","readme"],[]]);
});

test("Tree exposes read-only explanation and supports Shift-letter typeahead",async({page})=>{
  await open(page);await expect(item(page,"Read only")).toHaveAccessibleDescription("Selection is read only.");
  expect(await page.locator('.flood-tree').ariaSnapshot()).not.toContain('Selection is read only.');
  await item(page,"Source").focus();await page.keyboard.press("Shift+D");
  await expect(item(page,"Documentation")).toBeFocused();
  await page.getByRole("button",{name:"Read only",exact:true}).click();
  await expect(page.getByRole("tree")).toHaveAccessibleDescription("Selection is read only.");
});
