import {test, expect, type Page} from "@playwright/test";
import {build} from "vite";
import {resolve} from "node:path";
import {mkdir, writeFile} from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
let bundle: Promise<string>;
async function fixture() {
  const file = (path:string) => JSON.stringify(resolve(path).replaceAll("\\","/"));
  const directory=resolve(`.artifacts/menu-submenus-${process.pid}`),entry=resolve(directory,"entry.mjs"); await mkdir(directory,{recursive:true});
  await writeFile(entry,`import React,{useState,StrictMode}from ${file("node_modules/react/index.js")};import{createRoot}from ${file("node_modules/react-dom/client.js")};import{FloodRoot,Button,Menu}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};const h=React.createElement,trigger=label=>props=>h(Button,{...props,variant:'subtle'},label);
function App(){const[actions,A]=useState([]),[checked,C]=useState(false),[radio,R]=useState('one'),[owned,O]=useState(false),[freeze,F]=useState(false),[mounted,M]=useState(true);
const items=[{id:'rename',label:'Rename'},{id:'export',type:'submenu',label:'Export',items:[{id:'pdf',label:'PDF'},{id:'plain',label:'Plain text'},{id:'advanced',type:'submenu',label:'Advanced',items:[{id:'json',label:'JSON'},{id:'xml',label:'XML'}]}]},{id:'preferences',type:'submenu',label:'Preferences',items:[{id:'notify',type:'checkbox',label:'Notifications',checked,onCheckedChange:C},...['one','two'].map(value=>({id:'radio-'+value,type:'radio',group:'Mode',label:value,checked:radio===value,onCheckedChange:()=>R(value)}))]},{id:'unavailable',type:'submenu',label:'Unavailable',disabled:true,items:[{id:'never',label:'Never run'}]},{id:'beta',label:'Beta'}];
return h(FloodRoot,{style:{padding:'1rem'}},h('h1',null,'Submenu checks'),h(Button,{id:'before'},'Before'),mounted&&h(Menu,{label:'Tree',trigger:trigger('Open tree'),items,onAction:id=>A(v=>[...v,id])}),h(Button,{id:'after'},'After'),h('input',{'aria-label':'Outside destination'}),h('label',null,h('input',{type:'checkbox',checked:freeze,onChange:event=>F(event.target.checked)}),'Refuse closing'),h(Menu,{label:'Owned tree',trigger:trigger('Open owned'),items,open:owned,onOpenChange:value=>{if(value||!freeze)O(value)},onAction:id=>A(v=>[...v,id])}),h(Button,{onClick:()=>M(false)},'Unmount tree'),h('output',{'aria-label':'Actions'},JSON.stringify(actions)));}createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("production")},build:{write:false,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"SubmenuFixture"}}});
  const output=Array.isArray(result)?result[0].output:result.output;
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Submenus</title><style>'+output.filter(x=>x.type==='asset'&&x.fileName.endsWith('.css')).map(x=>(x as any).source).join('')+'</style></head><body><main id="app"></main><script>'+output.filter(x=>x.type==='chunk').map(x=>(x as any).code).join('')+'</script></body></html>';
}
async function open(page:Page){bundle??=fixture();await page.route('**/__submenu.html',async route=>route.fulfill({contentType:'text/html',body:await bundle}));await page.goto('/__submenu.html');await expect(page.getByRole('heading',{name:'Submenu checks'})).toBeVisible();}
const menu=(page:Page,name:string)=>page.getByRole('menu',{name,exact:true});
async function openExport(page:Page){await page.getByRole('button',{name:'Open tree',exact:true}).click();const item=menu(page,'Tree').getByRole('menuitem',{name:'Export',exact:true});await item.focus();await page.keyboard.press('ArrowRight');await expect(menu(page,'Export')).toBeVisible();}

test('menu trees reject duplicate recursive IDs, empty children and cycles while radio groups stay level-scoped',async()=>{
  const {validateMenuTree}=await import('../../packages/react/dist/menu.js');
  expect(()=>validateMenuTree([{id:'same',label:'Root'},{id:'parent',label:'Child',type:'submenu',items:[{id:'same',label:'Duplicate'}]}])).toThrow(/unique/);
  expect(()=>validateMenuTree([{id:'empty',label:'Empty',type:'submenu',items:[]}])).toThrow(/at least one/);
  const cycle:any[]=[];cycle.push({id:'cycle',label:'Cycle',type:'submenu',items:cycle});expect(()=>validateMenuTree(cycle)).toThrow(/recursive/);
  expect(()=>validateMenuTree([{id:'r1',type:'radio',label:'Root mode',group:'Mode',checked:true,onCheckedChange:()=>{}},{id:'sub',type:'submenu',label:'Child',items:[{id:'r2',type:'radio',label:'Child mode',group:'Mode',checked:true,onCheckedChange:()=>{}}]}])).not.toThrow();
});

test('nested menu keyboard arrows, depth Escape, disabled discovery and typeahead stay scoped',async({page})=>{
  await open(page);await openExport(page);
  await expect(menu(page,'Export').getByRole('menuitem',{name:'PDF',exact:true})).toBeFocused();
  await page.keyboard.press('p');await expect(menu(page,'Export').getByRole('menuitem',{name:'Plain text',exact:true})).toBeFocused();
  await page.keyboard.press('End');await expect(menu(page,'Export').getByRole('menuitem',{name:'Advanced',exact:true})).toBeFocused();
  await page.keyboard.press('ArrowRight');await expect(menu(page,'Advanced').getByRole('menuitem',{name:'JSON',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');await expect(menu(page,'Advanced')).toBeHidden();await expect(menu(page,'Export')).toBeVisible();
  await expect(menu(page,'Export').getByRole('menuitem',{name:'Advanced',exact:true})).toBeFocused();
  await page.keyboard.press('ArrowLeft');await expect(menu(page,'Export')).toBeHidden();
  await expect(menu(page,'Tree').getByRole('menuitem',{name:'Export',exact:true})).toBeFocused();
  await page.keyboard.press('End');await expect(menu(page,'Tree').getByRole('menuitem',{name:'Beta',exact:true})).toBeFocused();
  await page.keyboard.press('ArrowUp');const disabled=menu(page,'Tree').getByRole('menuitem',{name:'Unavailable',exact:true});await expect(disabled).toBeFocused();
  await page.keyboard.press('ArrowRight');await expect(menu(page,'Unavailable')).toBeHidden();await page.keyboard.press('Enter');await expect(menu(page,'Unavailable')).toBeHidden();
});

test('nested action closes the whole tree once and preferences remain open',async({page})=>{
  await open(page);await openExport(page);await menu(page,'Export').getByRole('menuitem',{name:'PDF',exact:true}).click();
  await expect(menu(page,'Tree')).toBeHidden();await expect(page.getByRole('button',{name:'Open tree',exact:true})).toBeFocused();
  await expect(page.getByRole('status',{name:'Actions',exact:true})).toHaveText('["pdf"]');
  await page.getByRole('button',{name:'Open tree',exact:true}).click();await menu(page,'Tree').getByRole('menuitem',{name:'Preferences',exact:true}).focus();await page.keyboard.press('Enter');
  const notification=menu(page,'Preferences').getByRole('menuitemcheckbox',{name:'Notifications',exact:true});await expect(notification).toBeFocused();await page.keyboard.press('Space');await expect(notification).toBeChecked();await expect(menu(page,'Preferences')).toBeVisible();
  await menu(page,'Preferences').getByRole('menuitemradio',{name:'two',exact:true}).click();await expect(menu(page,'Preferences').getByRole('menuitemradio',{name:'two',exact:true})).toBeChecked();await expect(menu(page,'Tree')).toBeVisible();
});

test('nested Tab and ShiftTab exit through the root trigger and root open refusal is honored',async({page})=>{
  await open(page);await openExport(page);await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'After',exact:true})).toBeFocused();await expect(menu(page,'Tree')).toBeHidden();
  await openExport(page);await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'Open tree',exact:true})).toBeFocused();await expect(menu(page,'Tree')).toBeHidden();
  await page.getByRole('checkbox',{name:'Refuse closing',exact:true}).check();await page.getByRole('button',{name:'Open owned',exact:true}).click();await menu(page,'Owned tree').getByRole('menuitem',{name:'Export',exact:true}).focus();await page.keyboard.press('ArrowRight');
  await menu(page,'Export').getByRole('menuitem',{name:'PDF',exact:true}).click();await expect(menu(page,'Owned tree')).toBeVisible();await expect(page.getByRole('status',{name:'Actions',exact:true})).toHaveText('["pdf"]');
});

test('mouse hover intent is cancellable, crossing to a child is safe and click does not toggle a hover-opened child closed',async({page})=>{
  await open(page);await page.getByRole('button',{name:'Open tree',exact:true}).click();
  const parent=menu(page,'Tree').getByRole('menuitem',{name:'Export',exact:true});await parent.hover();await page.waitForTimeout(60);await menu(page,'Tree').getByRole('menuitem',{name:'Rename',exact:true}).hover();await page.waitForTimeout(170);await expect(menu(page,'Export')).toBeHidden();
  await parent.hover();await expect(menu(page,'Export')).toBeVisible();await parent.click();await expect(menu(page,'Export')).toBeVisible();
  await menu(page,'Export').getByRole('menuitem',{name:'PDF',exact:true}).hover();await expect(menu(page,'Export')).toBeVisible();
  await page.getByRole('textbox',{name:'Outside destination',exact:true}).click();await expect(menu(page,'Tree')).toBeHidden();await expect(page.getByRole('textbox',{name:'Outside destination',exact:true})).toBeFocused();
});

test('RTL nested menus use reversed arrows and remain inside a narrow enlarged viewport',async({page})=>{
  await page.setViewportSize({width:390,height:850});await open(page);await page.evaluate(()=>{document.documentElement.dir='rtl';document.documentElement.style.fontSize='24px';});
  await page.getByRole('button',{name:'Open tree',exact:true}).click();await menu(page,'Tree').getByRole('menuitem',{name:'Export',exact:true}).focus();await page.keyboard.press('ArrowLeft');await expect(menu(page,'Export')).toBeVisible();
  const box=(await menu(page,'Export').boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(390);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.keyboard.press('ArrowRight');await expect(menu(page,'Export')).toBeHidden();
});

test('touch taps toggle submenus without needing hover',async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true});try{const page=await context.newPage();await open(page);await page.getByRole('button',{name:'Open tree',exact:true}).tap();const parent=menu(page,'Tree').getByRole('menuitem',{name:'Export',exact:true});await parent.tap();await expect(menu(page,'Export')).toBeVisible();await parent.tap();await expect(menu(page,'Export')).toBeHidden();}finally{await context.close();}
});

test('unmount cancels pending hover opening without delayed actions or document errors',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await open(page);
  await page.getByRole('button',{name:'Open tree',exact:true}).click();await menu(page,'Tree').getByRole('menuitem',{name:'Export',exact:true}).hover();
  await page.getByRole('button',{name:'Unmount tree',exact:true}).evaluate(node=>node.click());
  await page.waitForTimeout(200);await expect(page.getByRole('button',{name:'Open tree',exact:true})).toHaveCount(0);await expect(menu(page,'Tree')).toHaveCount(0);expect(errors).toEqual([]);
});
