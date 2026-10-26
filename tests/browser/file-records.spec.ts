import {test,expect,type Page} from "@playwright/test";
import {build} from "vite";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
let bundled:Promise<string>;
async function fixture(){
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll("\\","/"));const directory=resolve(`.artifacts/file-records-${process.pid}`);await mkdir(directory,{recursive:true});const entry=resolve(directory,"entry.mjs");
  await writeFile(entry,`import React,{useState}from ${file("node_modules/react/index.js")};import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,FileMeta,FileList,FileItem,UploadList,UploadItem,ImagePreview,Button,Checkbox}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};const h=React.createElement;
function App(){const[state,S]=useState('uploading'),[removed,R]=useState(false),[disabled,D]=useState(false),[unknown,U]=useState(false),[count,C]=useState(0),[missing,M]=useState(false);return h(FloodRoot,null,h('h1',null,'File records'),
h(FileList,{label:'Attachments'},h(FileItem,{id:'simple',name:'Empty.txt',size:0}),h(FileItem,{name:'Attachment-with-a-very-long-file-name-that-needs-to-wrap-properly-in-narrow-layouts.pdf',size:2400000,mimeType:'PDF',onPreview:()=>C(x=>x+1),onRemove:()=>R(true),hidden:removed,disabled}),h(FileItem,{id:'bare',name:'Bare.txt'})),
h(UploadList,{label:'Uploads'},h(UploadItem,{name:'Cover.png',size:850000,state,progress:unknown?undefined:45,error:'Connection interrupted',disabled,onCancel:()=>S('cancelled'),onRetry:()=>S('uploading'),onRemove:()=>S('queued'),onPreview:()=>C(x=>x+1)})),
h(ImagePreview,{title:'Cover preview',src:missing?'/missing-image.svg':'/test-image.svg',alt:'Preview artwork',caption:'Project artwork',trigger:props=>h(Button,props,'View image')}),
h(Button,{onClick:()=>S('error')},'Fail upload'),h(Button,{onClick:()=>S('success')},'Complete upload'),h(Button,{onClick:()=>M(true)},'Missing image'),h(Checkbox,{label:'Disable actions',checked:disabled,onChange:e=>D(e.currentTarget.checked)}),h(Checkbox,{label:'Unknown progress',checked:unknown,onChange:e=>U(e.currentTarget.checked)}),h('div',{id:'metas'},h(FileMeta,{id:'both',format:'PDF',size:2400000,lang:'en'}),h(FileMeta,{id:'format-only',format:'SVG'}),h(FileMeta,{id:'size-only',size:0,lang:'en'}),h(FileMeta,{id:'no-meta'})),h('output',{'aria-label':'Invocations'},count));}createRoot(document.getElementById('app')).render(h(App));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("production")},build:{write:false,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"FileRecords"}}});
  const output=(Array.isArray(result)?result:[result]).flatMap(x=>"output"in x?x.output:[]);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>File records</title><style>'+output.filter(x=>x.type==="asset"&&x.fileName.endsWith(".css")).map(x=>(x as any).source).join("")+'body{margin:1rem;background:#181818;color:white}main{max-width:34rem}</style></head><body><main id="app"></main><script>'+output.filter(x=>x.type==="chunk").map(x=>(x as any).code).join("")+'</script></body></html>';
}
async function open(page:Page){bundled??=fixture();await page.route("**/__file-records.html",async route=>route.fulfill({contentType:"text/html",body:await bundled}));await page.goto("/__file-records.html");}
test("File rows keep list semantics, omit absent slots and invoke independent actions",async({page})=>{
  await open(page);const list=page.getByRole("list",{name:"Attachments"});await expect(list.getByRole("listitem")).toHaveCount(3);
  await expect(page.locator("#simple")).toContainText("0 B");await expect(page.locator("#bare .flood-data-list-item__description")).toHaveCount(0);await expect(page.locator("#bare .flood-data-list-item__trailing")).toHaveCount(0);
  await list.getByRole("button",{name:/^Preview:/}).click();await expect(page.getByLabel("Invocations")).toHaveText("1");
  await list.getByRole("button",{name:/^Remove:/}).click();await expect(list.getByRole("listitem")).toHaveCount(2);
  await page.evaluate(()=>document.documentElement.style.fontSize="20px");expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test("UploadItem exposes applicable actions and determinate or unknown progress",async({page})=>{
  await open(page);const list=page.getByRole("list",{name:"Uploads"});const progress=list.getByRole("progressbar");await expect(progress).toHaveAttribute("aria-valuenow","45");
  await expect(list.locator('.flood-status-indicator__dot')).toBeVisible();
  const statusBox=(await list.locator('.flood-status-indicator').boundingBox())!,barBox=(await progress.boundingBox())!;
  const nameBox=(await list.locator('.flood-file-item__name').boundingBox())!;
  expect(statusBox.x).toBeCloseTo(nameBox.x,1);
  expect(barBox.x).toBeGreaterThan(statusBox.x+statusBox.width);
  expect(barBox.width).toBeGreaterThan(8);
  expect(barBox.y+barBox.height/2).toBeCloseTo(statusBox.y+statusBox.height/2,0);
  await expect(list.getByRole("button",{name:/^Remove:/})).toHaveCount(0);await expect(list.getByRole("button",{name:/^Retry upload:/})).toHaveCount(0);
  await page.getByRole("checkbox",{name:"Unknown progress"}).check();await expect(progress).not.toHaveAttribute("aria-valuenow");
  await list.getByRole("button",{name:/^Cancel upload:/}).click();await expect(progress).toHaveCount(0);await expect(list).toContainText("Cancelled");
  await list.getByRole("button",{name:/^Retry upload:/}).click();await expect(progress).toBeVisible();
  await page.getByRole("button",{name:"Fail upload",exact:true}).click();await expect(list).toContainText("Connection interrupted");await expect(list.getByRole("button",{name:/^Cancel upload:/})).toHaveCount(0);
  await page.getByRole("button",{name:"Complete upload",exact:true}).click();await expect(list).toContainText("Uploaded");await expect(list.getByRole("button",{name:/^Preview:/})).toBeVisible();
});
test("Disabled file and upload actions do not invoke callbacks",async({page})=>{
  await open(page);await page.getByRole("checkbox",{name:"Disable actions"}).check();
  await expect(page.getByRole("list",{name:"Attachments"}).getByRole("button",{name:/^Preview:/})).toBeDisabled();
  await expect(page.getByRole("button",{name:/^Cancel upload:/})).toBeDisabled();await expect(page.getByLabel("Invocations")).toHaveText("0");
});
test("ImagePreview is lazy, fits its image and restores trigger focus",async({page})=>{
  let requests=0,release:()=>void=()=>{};const held=new Promise<void>(resolve=>{release=resolve;});
  await page.route("**/test-image.svg",async route=>{requests++;await held;await route.fulfill({contentType:"image/svg+xml",body:'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="pink"/></svg>'});});
  await open(page);expect(requests).toBe(0);const trigger=page.getByRole("button",{name:"View image",exact:true});await trigger.click();
  const dialog=page.getByRole("dialog",{name:"Cover preview"});await expect(dialog.getByRole("status")).toBeVisible();await expect.poll(()=>requests).toBe(1);release();
  await expect(dialog.locator('.flood-image-preview__media')).toHaveAttribute("data-state","loaded");const image=await dialog.getByRole("img",{name:"Preview artwork"}).boundingBox();expect(image!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.keyboard.press("Escape");await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();
});
test("ImagePreview shows failure feedback instead of a broken image",async({page})=>{
  await page.route("**/missing-image.svg",route=>route.fulfill({status:404,body:"missing"}));await open(page);await page.getByRole("button",{name:"Missing image",exact:true}).click();await page.getByRole("button",{name:"View image",exact:true}).click();
  const dialog=page.getByRole("dialog",{name:"Cover preview"});await expect(dialog.getByText("Could not load the image.",{exact:true})).toBeVisible();await expect(dialog.getByRole("img")).toHaveCount(0);
});

test("FileMeta combines format and size without empty separators and shares the filename row",async({page})=>{
 await open(page);await expect(page.locator('#both')).toContainText('PDF');await expect(page.locator('#both')).toContainText('2.4 MB');
 await expect(page.locator('#format-only')).toHaveText('SVG');await expect(page.locator('#size-only')).toHaveText('0 B');await expect(page.locator('#no-meta')).toHaveCount(0);
 const name=(await page.locator('#simple .flood-file-item__name').boundingBox())!,chip=(await page.locator('#simple .flood-file-meta').boundingBox())!;
 expect(chip.x).toBeGreaterThan(name.x+name.width);expect(chip.y).toBeLessThan(name.y+name.height);await expect(page.locator('#simple .flood-data-list-item__description')).toHaveCount(0);
});
