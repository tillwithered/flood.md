import {test,expect,type Page} from "@playwright/test";
import {build} from "vite";
import {resolve} from "node:path";
import {mkdir,writeFile} from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
let bundle:Promise<string>;
async function fixture(){
  const file=(p:string)=>JSON.stringify(resolve(p).replaceAll("\\","/"));
  const directory=resolve(`.artifacts/structural-${process.pid}`),entry=resolve(directory,"entry.mjs");await mkdir(directory,{recursive:true});
  await writeFile(entry,`import React,{StrictMode,useState,useRef} from ${file("node_modules/react/index.js")};import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,Container,Grid,Surface,AspectRatio,Image,List,VisuallyHidden,EmptyState,Checkbox,Button,Link,Avatar}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};
const h=React.createElement,source='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="pink"/></svg>');
const avatarSource=(width,height)=>'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'"><rect width="'+width+'" height="'+height+'" fill="pink"/></svg>');
function App(){const[mixed,M]=useState(true),[checked,C]=useState(false),[result,R]=useState(''),[loaded,L]=useState(false),[broken,B]=useState(false),ref=useRef();return h(FloodRoot,null,
h('div',{id:'avatar-gallery'},h(Avatar,{name:'Landscape avatar',src:avatarSource(120,40)}),h(Avatar,{name:'Portrait avatar',src:avatarSource(40,120),size:'lg',shape:'rounded'})),
h(Container,{id:'container',size:'sm',gutter:'4'},h('div',{id:'contained'},'Content')),
h(Grid,{id:'adaptive'},...[1,2,3].map(v=>h(Surface,{key:v,padding:'2'},'Item '+v))),h(Grid,{id:'fixed',columns:3},...[1,2,3].map(v=>h('div',{key:v},'Cell '+v))),
h(AspectRatio,{id:'media',ratio:1.5},h(Image,{src:source,alt:'Geometry sample',width:300,height:200,fit:'contain',onLoad:()=>L(true)})),h('output',{'aria-label':'Image lifecycle'},loaded?'loaded':''),h(Image,{src:'/missing-structural.svg',alt:'Unavailable sample',onError:()=>B(true)}),h('output',{'aria-label':'Image error'},broken?'failed':''),
h(List,{id:'list',ordered:true,start:3,reversed:true,marker:false},h('li',null,'Third'),h('li',null,'Second')),
h(Button,{id:'before'},'Before skip'),h(VisuallyHidden,{id:'skip',focusable:true},h(Link,{href:'#destination'},'Skip to destination')),h(Button,{id:'destination'},'Destination'),h(VisuallyHidden,{id:'supplement'},'Supplementary context'),
h('form',{onSubmit:e=>{e.preventDefault();R(JSON.stringify([...new FormData(e.currentTarget)]))},onReset:()=>{C(false);M(true)}},h(Checkbox,{ref,label:'Select all',name:'all',value:'yes',checked,indeterminate:mixed,onChange:e=>C(e.currentTarget.checked)}),h(Checkbox,{label:'Hidden choice',hidden:true}),h(Button,{type:'submit'},'Submit'),h(Button,{type:'reset'},'Reset form'),h(Button,{onClick:()=>M(false)},'Resolve mixed'),h(Button,{onClick:()=>R(String(ref.current.indeterminate))},'Inspect ref')),
h('output',{'aria-label':'Form result'},result),h(EmptyState,{id:'empty',title:'No projects',headingLevel:2,actions:h(Button,{onClick:()=>R('created')},'Create')}));}
createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("development")},build:{write:false,minify:true,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"StructuralFixture"}}});
  const outputs=(Array.isArray(result)?result:[result]).flatMap(v=>"output"in v?v.output:[]);
  const js=outputs.filter(v=>v.type==="chunk").map(v=>v.type==="chunk"?v.code:"").join("\n"),css=outputs.filter(v=>v.type==="asset"&&v.fileName.endsWith(".css")).map(v=>v.type==="asset"?String(v.source):"").join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Structural verification</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}body{margin:16px}header{overflow-wrap:anywhere}#app>.flood-root{display:grid;gap:16px;min-width:0}#media{max-width:30rem}</style></head><body><header><h1>Structural verification</h1></header><main id="app"></main><script>${js.replace(/<\/script/gi,"<\\/script")}</script></body></html>`;
}
async function openFixture(page:Page){bundle??=fixture();await page.route("**/__structural.html",async route=>route.fulfill({contentType:"text/html",body:await bundle}));await page.goto("/__structural.html");}




test("Container includes logical gutters and Grid adapts without a new breakpoint",async({page})=>{
 await openFixture(page);await page.setViewportSize({width:1000,height:1000});const grid=page.locator('#adaptive');const wide=await grid.locator(':scope > *').evaluateAll(nodes=>nodes.map(el=>el.getBoundingClientRect().y));expect(new Set(wide).size).toBe(1);const container=await page.locator('#container').evaluate(node=>{const r=node.getBoundingClientRect(),child=node.firstElementChild!.getBoundingClientRect();return{width:r.width,left:child.left-r.left,right:r.right-child.right};});expect(container.width).toBeLessThanOrEqual(640);expect(container.left).toBeCloseTo(16);expect(container.right).toBeCloseTo(16);
 await page.setViewportSize({width:320,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='24px');const narrow=await grid.locator(':scope > *').evaluateAll(nodes=>nodes.map(el=>el.getBoundingClientRect().y));expect(new Set(narrow).size).toBe(3);const fixed=await page.locator('#fixed > *').evaluateAll(nodes=>nodes.map(el=>el.getBoundingClientRect().y));expect(new Set(fixed).size).toBe(1);const report=await page.evaluate(()=>({pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,textOverflow:(()=>{const result:Array<{text:string,parent:string,right:number,width:number}>=[];const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const node=walk.currentNode;if(!node.textContent?.trim()||node.parentElement?.closest("script,style"))continue;const range=document.createRange();range.selectNodeContents(node);for(const box of Array.from(range.getClientRects()))if(box.right>innerWidth+1)result.push({text:node.textContent.slice(0,100),parent:node.parentElement?.localName??"",right:box.right,width:box.width});}return result.slice(0,15)})(),overflow:Array.from(document.querySelectorAll("body *")).map(node=>{const r=node.getBoundingClientRect();return{tag:node.localName,id:node.id,class:node.className,x:r.x,right:r.right,width:r.width}}).filter(r=>r.right>innerWidth+1&&r.width>0).slice(0,15)}));expect(report.pageWidth,JSON.stringify(report)).toBeLessThanOrEqual(report.viewport);
});
test("AspectRatio reserves real media dimensions and preserves native image lifecycle",async({page})=>{
 await openFixture(page);await expect(page.locator('output[aria-label="Image lifecycle"]')).toHaveText('loaded');await expect(page.locator('output[aria-label="Image error"]')).toHaveText('failed');const dimensions=await page.locator('#media').evaluate(el=>{const a=el.getBoundingClientRect(),b=el.querySelector('img')!.getBoundingClientRect();return{ratio:a.width/a.height,width:a.width,childWidth:b.width,childHeight:b.height,height:a.height};});expect(dimensions.ratio).toBeCloseTo(1.5,2);expect(dimensions.childWidth).toBeCloseTo(dimensions.width,1);expect(dimensions.childHeight).toBeCloseTo(dimensions.height,1);await expect(page.locator('#media img')).toHaveCSS('object-fit','contain');
});
test("VisuallyHidden retains content and reveals a focused skip link",async({page})=>{
 await openFixture(page);const skip=page.locator('#skip');expect((await skip.boundingBox())!.height).toBeLessThanOrEqual(1);await page.locator('#before').focus();await page.keyboard.press('Tab');await expect(skip.getByRole('link')).toBeFocused();expect((await skip.boundingBox())!.height).toBeGreaterThan(10);await page.keyboard.press('Tab');await expect(page.locator('#destination')).toBeFocused();expect((await skip.boundingBox())!.height).toBeLessThanOrEqual(1);await expect(page.locator('#supplement')).not.toHaveAttribute('aria-hidden');await expect(page.locator('#list')).toHaveAttribute('start','3');await expect(page.locator('#list')).toHaveAttribute('reversed','');await expect(page.locator('#list')).toHaveRole('list');
});
test("Checkbox mixed presentation remains independent of native checked submission and reset",async({page})=>{
 await openFixture(page);const checkbox=page.getByRole('checkbox',{name:'Select all',exact:true}),result=page.locator('output[aria-label="Form result"]');await expect(checkbox).toHaveJSProperty('indeterminate',true);await expect(checkbox).not.toBeChecked();await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(result).toHaveText('[]');await checkbox.click();await expect(checkbox).toBeChecked();await expect(checkbox).toHaveJSProperty('indeterminate',true);await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(result).toHaveText('[["all","yes"]]');await page.getByRole('button',{name:'Resolve mixed',exact:true}).click();await expect(checkbox).toHaveJSProperty('indeterminate',false);await expect(checkbox).not.toHaveAttribute('aria-checked','mixed');await page.getByRole('button',{name:'Reset form',exact:true}).click();await expect(checkbox).not.toBeChecked();await expect(checkbox).toHaveJSProperty('indeterminate',true);await page.getByRole('button',{name:'Inspect ref',exact:true}).click();await expect(result).toHaveText('true');await expect(page.locator('label').filter({hasText:'Hidden choice'})).toBeHidden();
});
test("Static empty content and structural composition pass automated semantics",async({page})=>{
 await openFixture(page);await expect(page.locator('#empty')).not.toHaveAttribute('role');await page.locator('#empty').getByRole('button',{name:'Create',exact:true}).click();await expect(page.locator('output[aria-label="Form result"]')).toHaveText('created');expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});
test("served Inter loads the actual italic face for Latin and Cyrillic emphasis",async({page})=>{
 const fontResponses:Array<number>=[];page.on('response',response=>{if(response.url().includes('InterVariable-Italic'))fontResponses.push(response.status())});await page.goto('/components/text');await expect(page.locator('.workbench-stage')).toBeVisible();const faces=await page.evaluate(async()=>{const result=await document.fonts.load('italic 400 16px "Inter"','Flood Ёжик');const em=document.createElement('em');em.textContent='Flood Ёжик';document.querySelector('.workbench-stage .flood-root')!.append(em);const style=getComputedStyle(em);return{faces:result.map(face=>({family:face.family,style:face.style,status:face.status})),style:style.fontStyle,family:style.fontFamily};});expect(faces.faces.some(face=>face.style==='italic'&&face.status==='loaded')).toBe(true);expect(faces.style).toBe('italic');expect(faces.family).toContain('Inter');expect(fontResponses).toContain(200);
});


test("Avatar covers both intrinsic orientations without exposing fallback at enlarged RTL sizes",async({page},info)=>{
 await openFixture(page);
 for(const base of [16,24]){
  await page.evaluate(value=>{document.documentElement.style.fontSize=value+"px";document.documentElement.dir=value===24?"rtl":"ltr";},base);
  for(const [name,wide] of [["Landscape avatar",true],["Portrait avatar",false]] as const){
   const avatar=page.getByRole("img",{name,exact:true}),image=avatar.locator("img");
   await expect(image).toHaveCSS("opacity","1");
   const metrics=await image.evaluate(node=>{const img=node as HTMLImageElement,r=img.getBoundingClientRect(),a=img.parentElement!.getBoundingClientRect();return{naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,width:r.width,height:r.height,avatarWidth:a.width,avatarHeight:a.height};});
   expect(metrics.naturalWidth>metrics.naturalHeight).toBe(wide);
   expect(metrics.width).toBeCloseTo(metrics.avatarWidth,1);
   expect(metrics.height).toBeCloseTo(metrics.avatarHeight,1);
   await expect(image).toHaveCSS("object-fit","cover");
   await info.attach(`avatar-${wide?"landscape":"portrait"}-${base}.png`,{body:await avatar.screenshot(),contentType:"image/png"});
  }
 }
});
