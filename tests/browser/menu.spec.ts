import {test,expect,type Page} from "@playwright/test";
import {build} from "vite";
import {resolve} from "node:path";
import {mkdir,writeFile} from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
let bundle:Promise<string>;
async function fixture(){
  const file=(p:string)=>JSON.stringify(resolve(p).replaceAll("\\","/"));
  const directory=resolve(`.artifacts/menu-${process.pid}`),entry=resolve(directory,"entry.mjs");await mkdir(directory,{recursive:true});
  await writeFile(entry,`import React,{StrictMode,useState,useRef} from ${file("node_modules/react/index.js")};import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,Button,Input,Menu,Dialog}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};
const h=React.createElement,trigger=label=>props=>h(Button,{...props,variant:'subtle'},label),items=[{id:'rename',label:'Rename…'},{id:'duplicate',label:'Duplicate'},{id:'disabled',label:'Download',disabled:true},{id:'separator',type:'separator'},{id:'delete',label:'Delete project',tone:'danger'}];
function App(){const[result,setResult]=useState(''),[open,setOpen]=useState(false),[freeze,setFreeze]=useState(false),[long,setLong]=useState(false),[opens,setOpens]=useState(0),input=useRef();
const request=value=>{setOpens(n=>n+1);if(value||!freeze)setOpen(value)};
return h(FloodRoot,null,h(Button,{id:'before'},'Before'),
h(Menu,{label:'Actions',trigger:trigger('Actions'),items,onAction:setResult}),h(Button,{id:'after'},'After'),
h(Input,{ref:input,'aria-label':'Action destination'}),h(Menu,{label:'Move focus',trigger:trigger('Move focus'),items:[{id:'move',label:'Move to input'}],onAction:()=>input.current.focus()}),
h('label',null,h('input',{type:'checkbox',checked:freeze,onChange:e=>setFreeze(e.target.checked)}),'Freeze close'),
h(Menu,{label:'Owned actions',trigger:trigger('Owned actions'),items,open,onOpenChange:request,onAction:setResult}),h('output',{'aria-label':'Open requests'},String(opens)),
h(Dialog,{title:'Edit project',trigger:trigger('Open dialog')},h(Menu,{label:'Nested actions',trigger:trigger('Nested actions'),items,onAction:setResult}),h(Button,null,'Dialog next')),
h(Button,{onClick:()=>setLong(v=>!v)},'Long menu'),h(Menu,{label:'Many actions',trigger:trigger('Many actions'),items:long?Array.from({length:45},(_,i)=>({id:'a'+i,label:'Action '+i})):items}),h('output',{'aria-label':'Result'},result));}
createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("development")},build:{write:false,minify:true,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"MenuFixture"}}});
  const outputs=(Array.isArray(result)?result:[result]).flatMap(v=>"output"in v?v.output:[]);
  const js=outputs.filter(v=>v.type==="chunk").map(v=>v.type==="chunk"?v.code:"").join("\n"),css=outputs.filter(v=>v.type==="asset"&&v.fileName.endsWith(".css")).map(v=>v.type==="asset"?String(v.source):"").join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}body{margin:16px}#app>.flood-root{display:flex;flex-direction:column;gap:16px;align-items:flex-start}</style></head><body><main id="app"></main><script>${js.replace(/<\/script/gi,"<\\/script")}</script></body></html>`;
}
async function openFixture(page:Page){bundle??=fixture();await page.route("**/__menu.html",async route=>route.fulfill({contentType:"text/html",body:await bundle}));await page.goto("/__menu.html");}

test("Menu supports edge opening, arrows, typeahead, disabled discovery and activation",async({page})=>{
  await openFixture(page);const trigger=page.getByRole("button",{name:"Actions",exact:true});await trigger.focus();await page.keyboard.press("ArrowUp");
  const menu=page.getByRole("menu",{name:"Actions",exact:true});await expect(menu.getByRole("menuitem",{name:"Delete project"})).toBeFocused();
  await page.keyboard.press("Home");await expect(menu.getByRole("menuitem",{name:"Rename…"})).toBeFocused();
  await page.keyboard.press("d");await expect(menu.getByRole("menuitem",{name:"Duplicate",exact:true})).toBeFocused();
  await page.keyboard.press("d");const disabled=menu.getByRole("menuitem",{name:"Download",exact:true});await expect(disabled).toBeFocused();await expect(disabled).toHaveAttribute("aria-disabled","true");
  await page.keyboard.press("Enter");const hit=(await disabled.boundingBox())!;await page.mouse.click(hit.x+hit.width/2,hit.y+hit.height/2);await expect(menu).toBeVisible();await expect(page.getByRole("status",{name:"Result"})).toHaveText("");
  await page.keyboard.press("ArrowDown");await expect(menu.getByRole("menuitem",{name:"Delete project"})).toBeFocused();
  await page.keyboard.press("End");await page.keyboard.press("Space");await expect(menu).toBeHidden();await expect(trigger).toBeFocused();await expect(page.locator('output[aria-label="Result"]')).toHaveText("delete");
});

test("Tab and outside dismissal preserve intended focus, including host-owned focus changes",async({page})=>{
  await openFixture(page);const trigger=page.getByRole("button",{name:"Actions",exact:true});await trigger.click();await page.keyboard.press("Tab");
  await expect(page.getByRole("button",{name:"After",exact:true})).toBeFocused();await expect(page.getByRole("menu",{name:"Actions",exact:true})).toBeHidden();
  await trigger.click();await page.keyboard.press("Shift+Tab");await expect(trigger).toBeFocused();
  await trigger.click();await page.getByRole("button",{name:"Before",exact:true}).click();await expect(page.getByRole("button",{name:"Before",exact:true})).toBeFocused();
  await trigger.click();await page.getByRole("textbox",{name:"Action destination"}).focus();await expect(page.getByRole("textbox",{name:"Action destination"})).toBeFocused();
  await page.getByRole("button",{name:"Move focus",exact:true}).click();await page.getByRole("menuitem",{name:"Move to input"}).click();await expect(page.getByRole("textbox",{name:"Action destination"})).toBeFocused();
});

test("controlled menus respect refusal, close once per request and own nested Escape",async({page})=>{
  await openFixture(page);const trigger=page.getByRole("button",{name:"Owned actions",exact:true});await trigger.click();await expect(page.locator('output[aria-label="Open requests"]')).toHaveText("1");
  await page.keyboard.press("Escape");await expect(trigger).toBeFocused();await expect(page.locator('output[aria-label="Open requests"]')).toHaveText("2");
  await page.getByRole("checkbox",{name:"Freeze close"}).check();await trigger.click();await page.keyboard.press("Escape");await expect(page.getByRole("menu",{name:"Owned actions",exact:true})).toBeVisible();
  await page.getByRole("menu",{name:"Owned actions",exact:true}).evaluate(el=>(el as HTMLDivElement).hidePopover());await expect.poll(()=>page.getByRole("menu",{name:"Owned actions",exact:true}).evaluate(el=>el.matches(":popover-open"))).toBe(true);
  await page.getByRole("checkbox",{name:"Freeze close"}).uncheck();await trigger.focus();await page.keyboard.press("ArrowDown");await page.keyboard.press("Escape");
  await page.getByRole("button",{name:"Open dialog",exact:true}).click();await page.getByRole("button",{name:"Nested actions",exact:true}).click();await page.keyboard.press("Escape");
  await expect(page.getByRole("menu",{name:"Nested actions",exact:true})).toBeHidden();await expect(page.getByRole("dialog",{name:"Edit project"})).toBeVisible();await expect(page.getByRole("button",{name:"Nested actions",exact:true})).toBeFocused();
  await page.keyboard.press("Escape");await expect(page.getByRole("dialog",{name:"Edit project"})).toBeHidden();
});

test("long menus scroll to keyboard focus, fit enlarged RTL viewports and retain forced-color focus",async({page})=>{
  await openFixture(page);await page.getByRole("button",{name:"Long menu",exact:true}).click();await page.setViewportSize({width:320,height:700});await page.evaluate(()=>{document.documentElement.style.fontSize="24px";document.documentElement.dir="rtl";});
  await page.getByRole("button",{name:"Many actions",exact:true}).click();const menu=page.getByRole("menu",{name:"Many actions",exact:true});await page.keyboard.press("End");
  const last=menu.getByRole("menuitem",{name:"Action 44",exact:true});await expect(last).toBeFocused();await expect(last).toBeInViewport();
  const box=(await menu.boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(321);
  await page.emulateMedia({forcedColors:"active"});await expect(last).toHaveCSS("outline-style","solid");
});

test("catalog Menu and table actions use original components and accessible nested geometry",async({page},info)=>{
  await page.goto("/components/menu");await page.locator(".workbench-stage").getByRole("button",{name:"Project actions",exact:true}).click();
  const menu=page.getByRole("menu",{name:"Project actions",exact:true});await expect(menu.getByRole("menuitem")).toHaveCount(4);expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  const geometry=await menu.evaluate(el=>({outer:parseFloat(getComputedStyle(el).borderRadius),padding:parseFloat(getComputedStyle(el).paddingLeft),border:parseFloat(getComputedStyle(el).borderLeftWidth),inner:parseFloat(getComputedStyle(el.querySelector('[role="menuitem"]')!).borderRadius)}));
  expect(geometry.inner).toBeCloseTo(geometry.outer-geometry.padding-geometry.border,1);
  await page.screenshot({path:`.artifacts/menu-${info.project.name}.png`});await menu.screenshot({path:`.artifacts/menu-popup-${info.project.name}.png`});await page.keyboard.press("Escape");
  await page.goto("/playground/content#data");await page.getByRole("button",{name:"Actions for Flood",exact:true}).click();await page.getByRole("menu",{name:"Flood actions",exact:true}).getByRole("menuitem",{name:"Duplicate",exact:true}).click();
  await expect(page.locator(".content-board-menu-status")).toHaveText("Flood: duplicate selected.");
  await expect(page.getByRole("button",{name:"Actions for Flood",exact:true})).toBeFocused();
});
