import {test,expect,type Page} from "@playwright/test";
import {build} from "vite";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
let bundled:Promise<string>;
async function fixture(){
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll("\\","/"));
  const directory=resolve(`.artifacts/data-table-${process.pid}`);await mkdir(directory,{recursive:true});const entry=resolve(directory,"entry.mjs");
  await writeFile(entry,`import React,{useState}from ${file("node_modules/react/index.js")};import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,DataTable,Button,Checkbox}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};const h=React.createElement;
const columns=[{id:'name',label:'Name',sortable:true},{id:'score',label:'Score',sortable:true,align:'end'},{id:'status',label:'Status'}];
const source=[['a','Alpha',10],['b','Bravo',2],['c','Charlie',2],['d','Delta',null],['e','Echo',3]].map(([id,name,score])=>({id,label:name,cells:{name,score:score===null?'Unknown':h('strong',null,score)},sortValues:{score},selectionDisabled:id==='c'}));
function App(){const[state,S]=useState('ready'),[rows,R]=useState(source),[locked,L]=useState(false),[requested,Q]=useState('');return h(FloodRoot,null,h('h1',null,'Table checks'),h(DataTable,{caption:'Projects',columns,rows,pageSize:2,selectable:true,minWidth:'34rem',state,sort:locked?null:undefined,selectedIds:locked?[]:undefined,onSortChange:next=>Q(JSON.stringify(next)),onSelectionChange:next=>Q(JSON.stringify(next)),onRetry:()=>S('ready')}),
h(Button,{onClick:()=>S('loading')},'Load'),h(Button,{onClick:()=>S('error')},'Fail'),h(Button,{onClick:()=>S('ready')},'Ready'),h(Button,{onClick:()=>R([])},'Empty'),h(Button,{onClick:()=>R([source[0]])},'Shrink'),h(Checkbox,{label:'Controlled refusal',checked:locked,onChange:e=>L(e.currentTarget.checked)}),h('output',{'aria-label':'Requested'},requested));}createRoot(document.getElementById('app')).render(h(App));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("production")},build:{write:false,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"DataTableFixture"}}});
  const output=(Array.isArray(result)?result:[result]).flatMap(x=>"output"in x?x.output:[]);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Table checks</title><style>'+output.filter(x=>x.type==="asset"&&x.fileName.endsWith(".css")).map(x=>(x as any).source).join("")+'body{margin:1rem;background:#181818;color:white}main{max-width:42rem}</style></head><body><main id="app"></main><script>'+output.filter(x=>x.type==="chunk").map(x=>(x as any).code).join("")+'</script></body></html>';
}
async function open(page:Page){bundled??=fixture();await page.route("**/__data-table.html",async route=>route.fulfill({contentType:"text/html",body:await bundled}));await page.goto("/__data-table.html");}
const names=(page:Page)=>page.locator("tbody tr td:nth-child(2)").allTextContents();

test("DataTable mixed sortable and plain header labels share a vertical centre",async({page})=>{
  await open(page);
  const centres=await page.locator('thead th:not(.flood-data-table__choice)').evaluateAll(headers=>headers.map(header=>{
    const label=header.querySelector('button')??header;
    const text=[...label.childNodes].find(node=>node.nodeType===Node.TEXT_NODE&&node.textContent?.trim())!;
    const range=document.createRange();range.selectNodeContents(text);
    const rect=range.getBoundingClientRect();return rect.y+rect.height/2;
  }));
  expect(Math.max(...centres)-Math.min(...centres)).toBeLessThanOrEqual(1);
});
test("DataTable sort targets have side clearance while header text aligns with body cells",async({page})=>{
  await open(page);
  const geometry=await page.getByRole("button",{name:"Sort by Name"}).evaluate(button=>{
    const text=[...button.childNodes].find(node=>node.nodeType===Node.TEXT_NODE)!;
    const range=document.createRange();range.selectNodeContents(text);
    const bounds=button.getBoundingClientRect(),label=range.getBoundingClientRect();
    const body=button.closest("table")!.querySelector("tbody tr td:nth-child(2)")!;
    const bodyRange=document.createRange();bodyRange.selectNodeContents(body);
    return {inset:label.left-bounds.left,header:label.left,body:bodyRange.getBoundingClientRect().left};
  });
  expect(geometry.inset).toBeGreaterThanOrEqual(8);
  expect(geometry.header).toBeCloseTo(geometry.body,0);
});
test("DataTable sorts rich numeric cells stably and leaves missing values last",async({page})=>{
  await open(page);const sort=page.getByRole("button",{name:"Sort by Score"});
  await sort.click();expect(await names(page)).toEqual(["Bravo","Charlie"]);await expect(page.getByRole("columnheader",{name:"Sort by Score"})).toHaveAttribute("aria-sort","ascending");
  await page.getByRole("button",{name:"Next page",exact:true}).click();expect(await names(page)).toEqual(["Echo","Alpha"]);
  await page.getByRole("button",{name:"Next page",exact:true}).click();expect(await names(page)).toEqual(["Delta"]);
  await sort.click();expect(await names(page)).toEqual(["Alpha","Echo"]);
  await expect(page.getByRole("columnheader",{name:"Sort by Score"})).toHaveAttribute("aria-sort","descending");
  await page.getByRole("button",{name:"Next page",exact:true}).click();await page.getByRole("button",{name:"Next page",exact:true}).click();expect(await names(page)).toEqual(["Delta"]);
  await sort.click();expect(await names(page)).toEqual(["Alpha","Bravo"]);
});
test("DataTable select-all is page scoped and preserves selections on other pages",async({page})=>{
  await open(page);const all=page.getByRole("checkbox",{name:"Select rows on this page",exact:true});
  await page.getByRole("checkbox",{name:"Select Alpha",exact:true}).check();await expect(all).toHaveAttribute("aria-checked","mixed");
  await all.check();await page.getByRole("button",{name:"Next page",exact:true}).click();
  await expect(page.getByRole("checkbox",{name:"Select Charlie",exact:true})).toBeDisabled();
  await all.check();await expect(page.locator(".flood-data-table__footer").getByRole("status")).toHaveText("3 of 4 selected");
  await page.getByRole("button",{name:"Previous page",exact:true}).click();await expect(all).toBeChecked();
  await all.uncheck();await expect(page.locator(".flood-data-table__footer").getByRole("status")).toHaveText("1 of 4 selected");
});
test("DataTable clamps pages and ignores removed selection IDs",async({page})=>{
  await open(page);await page.getByRole("checkbox",{name:"Select Bravo",exact:true}).check();
  await page.getByRole("button",{name:"Next page",exact:true}).click();await page.getByRole("button",{name:"Next page",exact:true}).click();
  await page.getByRole("button",{name:"Shrink",exact:true}).click();expect(await names(page)).toEqual(["Alpha"]);
  await expect(page.locator(".flood-data-table__footer").getByRole("status")).toHaveText("0 of 1 selected");await expect(page.getByRole("navigation")).toHaveCount(0);
});
test("DataTable controlled refusal does not apply sort or selection proposals",async({page})=>{
  await open(page);await page.getByRole("checkbox",{name:"Controlled refusal",exact:true}).check();
  await page.getByRole("button",{name:"Sort by Score"}).click();expect(await names(page)).toEqual(["Alpha","Bravo"]);
  await expect(page.getByLabel("Requested",{exact:true})).toContainText('"ascending"');
  await page.getByRole("checkbox",{name:"Select Alpha",exact:true}).click();await expect(page.getByRole("checkbox",{name:"Select Alpha",exact:true})).not.toBeChecked();
  await expect(page.getByLabel("Requested",{exact:true})).toHaveText('["a"]');
});
test("DataTable loading, retry and empty states retain native table structure",async({page})=>{
  await open(page);await page.getByRole("button",{name:"Load",exact:true}).click();
  await expect(page.locator(".flood-data-table")).toHaveAttribute("aria-busy","true");await expect(page.getByRole("button",{name:"Sort by Name"})).toBeDisabled();
  await expect(page.locator(".flood-data-table__state").getByRole("status")).toBeVisible();
  await page.getByRole("button",{name:"Fail",exact:true}).click();await expect(page.getByText("Could not load the rows.",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Try again",exact:true}).click();expect(await names(page)).toEqual(["Alpha","Bravo"]);
  await page.getByRole("button",{name:"Empty",exact:true}).click();await expect(page.getByText("No results found.",{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
