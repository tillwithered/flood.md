import {test,expect,type Page} from "@playwright/test";
import {build} from "vite";
import {resolve} from "node:path";
import {mkdir,writeFile} from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
let bundle:Promise<string>;
async function fixture(){
  const file=(p:string)=>JSON.stringify(resolve(p).replaceAll("\\","/"));
  const directory=resolve(`.artifacts/toolbar-${process.pid}`),entry=resolve(directory,"entry.mjs");await mkdir(directory,{recursive:true});
  await writeFile(entry,`import React,{StrictMode,useState,useRef} from ${file("node_modules/react/index.js")};import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,Button,IconButton,Toolbar,Toggle,Menu,Kbd}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};
const h=React.createElement;
function App(){const[vertical,V]=useState(false),[rtl,R]=useState(false),[loop,L]=useState(true),[off,D]=useState(false),[gone,G]=useState(false),[count,C]=useState(0),ref=useRef();return h(FloodRoot,null,
h(Button,{id:'before'},'Before'),h(Toolbar,{label:'Editor',orientation:vertical?'vertical':'horizontal',dir:rtl?'rtl':'ltr',loop,ref},
h(Button,{id:'undo',disabled:off,onClick:()=>C(n=>n+1)},'Undo'),h(Button,{disabled:true},'Disabled'),h(Button,{hidden:true},'Hidden'),!gone&&h(Toggle,{'aria-label':'Bold'},'Bold'),h(Menu,{label:'Options',trigger:p=>h(Button,{...p},'Options'),items:[{id:'export',label:'Export',shortcut:'Ctrl+E'}]}),h('a',{href:'#destination'},'Help')),
h(Button,{id:'after'},'After'),h(Button,{onClick:()=>V(v=>!v)},'Vertical'),h(Button,{onClick:()=>R(v=>!v)},'RTL'),h(Button,{onClick:()=>L(v=>!v)},'Loop'),h(Button,{onClick:()=>D(v=>!v)},'Disable undo'),h(Button,{onClick:()=>G(v=>!v)},'Remove bold'),h('output',{'aria-label':'Clicks'},String(count)),h(Kbd,null,'Ctrl'),h(Kbd,{size:'md'},'K'),h(Kbd,{size:'lg'},'Enter'));}
createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("development")},build:{write:false,minify:true,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"ToolbarFixture"}}});
  const outputs=(Array.isArray(result)?result:[result]).flatMap(v=>"output"in v?v.output:[]);
  const js=outputs.filter(v=>v.type==="chunk").map(v=>v.type==="chunk"?v.code:"").join("\n"),css=outputs.filter(v=>v.type==="asset"&&v.fileName.endsWith(".css")).map(v=>v.type==="asset"?String(v.source):"").join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Toolbar verification</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}body{margin:16px}#app>.flood-root{display:flex;flex-direction:column;gap:16px;align-items:flex-start}</style></head><body><header><h1>Toolbar verification</h1></header><main id="app"></main><script>${js.replace(/<\/script/gi,"<\\/script")}</script></body></html>`;
}
async function openFixture(page:Page){bundle??=fixture();await page.route("**/__toolbar.html",async route=>route.fulfill({contentType:"text/html",body:await bundle}));await page.goto("/__toolbar.html");}


test("Toolbar has one Tab entry, skips unavailable actions and leaves activation native",async({page})=>{
 await openFixture(page);const toolbar=page.getByRole("toolbar",{name:"Editor"});const undo=toolbar.getByRole("button",{name:"Undo"});
 await page.locator('#before').focus();await page.keyboard.press('Tab');await expect(undo).toBeFocused();await page.keyboard.press('ArrowRight');const bold=toolbar.getByRole('button',{name:'Bold'});await expect(bold).toBeFocused();await expect(bold).toHaveAttribute('aria-pressed','false');await page.keyboard.press('Space');await expect(bold).toHaveAttribute('aria-pressed','true');await page.keyboard.press('End');await expect(toolbar.getByRole('link',{name:'Help'})).toBeFocused();await page.keyboard.press('ArrowRight');await expect(undo).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('output')).toHaveText('1');await page.keyboard.press('Tab');await expect(page.locator('#after')).toBeFocused();
 await expect(toolbar.locator('[tabindex="0"]')).toHaveCount(1);
});
test("Toolbar composes horizontal and vertical Menu navigation",async({page})=>{
 await openFixture(page);const toolbar=page.getByRole('toolbar'),trigger=toolbar.getByRole('button',{name:'Options'});await trigger.focus();await page.keyboard.press('ArrowDown');const menu=page.getByRole('menu',{name:'Options'});await expect(menu.getByRole('menuitem',{name:'Export'})).toBeFocused();await expect(menu.locator('kbd')).toHaveText('Ctrl+E');await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await page.getByRole('button',{name:'Vertical',exact:true}).click();await trigger.focus();await page.keyboard.press('ArrowDown');await expect(toolbar.getByRole('link')).toBeFocused();await expect(menu).toBeHidden();await page.keyboard.press('ArrowUp');await page.keyboard.press('Enter');await expect(menu).toBeVisible();await page.keyboard.press('Tab');await expect(page.locator('#after')).toBeFocused();
});
test("Toolbar handles RTL, nonlooping edges and DOM changes without stealing outside focus",async({page})=>{
 await openFixture(page);const toolbar=page.getByRole('toolbar');await page.getByRole('button',{name:'RTL',exact:true}).click();await toolbar.getByRole('button',{name:'Undo'}).focus();await page.keyboard.press('ArrowLeft');await expect(toolbar.getByRole('button',{name:'Bold'})).toBeFocused();await page.getByRole('button',{name:'Loop',exact:true}).click();await toolbar.getByRole('button',{name:'Undo'}).focus();await page.keyboard.press('ArrowRight');await expect(toolbar.getByRole('button',{name:'Undo'})).toBeFocused();await page.getByRole('button',{name:'Disable undo',exact:true}).focus();await page.getByRole('button',{name:'Disable undo',exact:true}).press('Enter');await expect(page.getByRole('button',{name:'Disable undo',exact:true})).toBeFocused();await expect(toolbar.getByRole('button',{name:'Bold'})).toHaveAttribute('tabindex','0');await page.getByRole('button',{name:'Remove bold',exact:true}).click();await expect(toolbar.getByRole('button',{name:'Options'})).toHaveAttribute('tabindex','0');
});
test("Toolbar and key hints remain usable at enlarged text and pass automated semantics",async({page})=>{
 await openFixture(page);await page.evaluate(()=>document.documentElement.style.fontSize='24px');const toolbar=page.getByRole('toolbar');await expect(toolbar).toBeVisible();const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);expect(overflow).toBe(false);const results=await new AxeBuilder({page}).analyze();expect(results.violations).toEqual([]);await expect(page.locator('kbd')).toHaveCount(3);await expect(page.locator('kbd[tabindex]')).toHaveCount(0);
});
test("Toolbar catalog recipes render and retain a stable preview",async({page})=>{
 await page.goto('/components/toolbar');const stage=page.locator('.workbench-stage');await expect(stage.getByRole('toolbar')).toBeVisible();const before=(await stage.boundingBox())!;await stage.getByRole('button',{name:'Share',exact:true}).click();expect((await stage.boundingBox())!.height).toBe(before.height);await page.goto('/components/kbd');await expect(page.locator('.workbench-stage kbd')).toHaveCount(2);
});

test("Toolbar keeps owned focus recoverable when an action becomes unavailable",async({page})=>{
 await openFixture(page);const toolbar=page.getByRole('toolbar'),undo=toolbar.getByRole('button',{name:'Undo'});await undo.focus();await undo.evaluate(node=>(node as HTMLButtonElement).disabled=true);await expect(toolbar.getByRole('button',{name:'Bold'})).toBeFocused();await toolbar.getByRole('button',{name:'Bold'}).evaluate(node=>node.remove());await expect(toolbar.getByRole('button',{name:'Options'})).toBeFocused();
});
test("Toolbar composition preview fits narrow screens",async({page},info)=>{
 await page.goto('/playground/content');const section=page.locator('#toolbar');await section.scrollIntoViewIfNeeded();await expect(section.getByRole('toolbar')).toBeVisible();const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);expect(overflow).toBe(false);await section.screenshot({path:`.artifacts/toolbar-${info.project.name}.png`});
});
