import {test, expect, type Page} from '@playwright/test';
import {build} from 'vite';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
let bundle:Promise<string>;
async function fixture(){
 const file=(path:string)=>JSON.stringify(resolve(path).replaceAll('\\','/')),directory=resolve(`.artifacts/context-menu-${process.pid}`),entry=resolve(directory,'entry.mjs');await mkdir(directory,{recursive:true});
 await writeFile(entry,`import React,{useState,StrictMode}from ${file('node_modules/react/index.js')};import{createRoot}from ${file('node_modules/react-dom/client.js')};import{FloodRoot,ContextMenu,Button,Input,Dialog}from ${file('packages/react/dist/index.js')};import ${file('packages/react/dist/styles.css')};const h=React.createElement;const items=[{id:'open',label:'Open'},{id:'export',type:'submenu',label:'Export',items:[{id:'pdf',label:'PDF'},{id:'text',label:'Text'}]},{id:'disabled',label:'Unavailable',disabled:true}];function App(){const[actions,A]=useState([]),[owned,O]=useState(false),[freeze,F]=useState(false),[disabled,D]=useState(false);return h(FloodRoot,{style:{padding:'1rem'}},h('h1',null,'Context checks'),h(Button,{id:'before'},'Before'),h(ContextMenu,{id:'area',label:'Document actions',items,onAction:id=>A(v=>[...v,id]),style:{border:'1px solid #383838',padding:'1rem',maxWidth:'24rem'}},h(Button,{id:'document'},'Document'),h('p',null,'Right click content')),h(Button,{id:'after'},'After'),h('label',null,h('input',{type:'checkbox',checked:disabled,onChange:e=>D(e.target.checked)}),'Disable context'),h(ContextMenu,{id:'disabled-area',label:'Optional actions',items,disabled,style:{padding:'1rem'}},'Optional content'),h('label',null,h('input',{type:'checkbox',checked:freeze,onChange:e=>F(e.target.checked)}),'Refuse close'),h(ContextMenu,{id:'owned',label:'Owned context',items,open:owned,onOpenChange:next=>{if(next||!freeze)O(next)},onAction:id=>A(v=>[...v,id])},h(Button,null,'Owned document')),h(ContextMenu,{id:'cancelled',label:'Cancelled context',items,onContextMenu:e=>e.preventDefault()},'Host handles context'),h(Input,{'aria-label':'Host focus destination'}),h(Dialog,{title:'Editor',trigger:props=>h(Button,props,'Open editor')},h(ContextMenu,{id:'nested-context',label:'Editor actions',items},h(Button,null,'Editor document'))),h('output',{'aria-label':'Actions'},JSON.stringify(actions)));}createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
 const result=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{write:false,cssCodeSplit:false,lib:{entry,formats:['iife'],name:'ContextFixture'}}});const output=Array.isArray(result)?result[0].output:result.output;
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Context menus</title><style>'+output.filter(x=>x.type==='asset'&&x.fileName.endsWith('.css')).map(x=>(x as any).source).join('')+'</style></head><body><main id="app"></main><script>'+output.filter(x=>x.type==='chunk').map(x=>(x as any).code).join('')+'</script></body></html>';
}
async function open(page:Page){bundle??=fixture();await page.route('**/__context.html',async route=>route.fulfill({contentType:'text/html',body:await bundle}));await page.goto('/__context.html');await expect(page.getByRole('heading',{name:'Context checks'})).toBeVisible();}
const menu=(page:Page,name='Document actions')=>page.getByRole('menu',{name,exact:true});

test('ContextMenu opens near the pointer without hidden triggers and restores its actual source',async({page})=>{
 await open(page);const source=page.getByRole('button',{name:'Document',exact:true});const box=(await source.boundingBox())!;const point={x:box.x+box.width/2,y:box.y+box.height/2};await source.click({button:'right'});await expect(menu(page)).toBeVisible();const popup=(await menu(page).boundingBox())!;expect(Math.abs(popup.x-point.x)).toBeLessThan(12);expect(Math.abs(popup.y-point.y)).toBeLessThan(18);await expect(menu(page).getByRole('menuitem',{name:'Open',exact:true})).toBeFocused();
 await page.keyboard.press('Escape');await expect(menu(page)).toBeHidden();await expect(source).toBeFocused();await expect(page.locator('#area button[hidden]')).toHaveCount(0);
});

test('ContextMenu keyboard context activation and nested actions share Menu semantics',async({page})=>{
 await open(page);const source=page.getByRole('button',{name:'Document',exact:true});await source.focus();await page.keyboard.press('Shift+F10');await expect(menu(page)).toBeVisible();await menu(page).getByRole('menuitem',{name:'Export',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(menu(page,'Export')).toBeVisible();await menu(page,'Export').getByRole('menuitem',{name:'PDF',exact:true}).click();await expect(menu(page)).toBeHidden();await expect(source).toBeFocused();await expect(page.getByRole('status',{name:'Actions',exact:true})).toHaveText('["pdf"]');
 await page.locator('#area').focus();await page.locator('#area').dispatchEvent('keydown',{key:'ContextMenu',bubbles:true,cancelable:true});await expect(menu(page)).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#area')).toBeFocused();
});

test('ContextMenu repositions an already open root to a new pointer request',async({page})=>{
 await open(page);const area=page.locator('#area');await area.click({button:'right',position:{x:20,y:20}});await expect(menu(page)).toBeVisible();const before=(await menu(page).boundingBox())!;
 const request=await area.evaluate(node=>{const event=new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:300,clientY:270});node.dispatchEvent(event);return{x:event.clientX,y:event.clientY,prevented:event.defaultPrevented};});expect(request).toEqual({x:300,y:270,prevented:true});
 await expect.poll(async()=>Math.round((await menu(page).boundingBox())!.x)).toBe(300);
 const after=(await menu(page).boundingBox())!;expect(after.x).not.toBe(before.x);expect(Math.abs(after.y-278)).toBeLessThan(2);
});

test('ContextMenu disabled and host-cancelled activation preserve native event ownership',async({page})=>{
 await open(page);await page.getByRole('checkbox',{name:'Disable context',exact:true}).check();
 const prevented=await page.locator('#disabled-area').evaluate(node=>{const event=new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:100,clientY:100});node.dispatchEvent(event);return event.defaultPrevented;});expect(prevented).toBe(false);await expect(menu(page,'Optional actions')).toBeHidden();
 await page.locator('#cancelled').click({button:'right'});await expect(menu(page,'Cancelled context')).toBeHidden();
});

test('ContextMenu Tab exits through the source and outside focus is preserved',async({page})=>{
 await open(page);const source=page.getByRole('button',{name:'Document',exact:true});await source.click({button:'right'});await menu(page).getByRole('menuitem',{name:'Export',exact:true}).focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'After',exact:true})).toBeFocused();await expect(menu(page)).toBeHidden();
 await source.click({button:'right'});await page.getByRole('textbox',{name:'Host focus destination',exact:true}).focus();await expect(menu(page)).toBeHidden();await expect(page.getByRole('textbox',{name:'Host focus destination',exact:true})).toBeFocused();
});

test('ContextMenu honors root open refusal and owns Escape only above a parent dialog',async({page})=>{
 await open(page);await page.getByRole('checkbox',{name:'Refuse close',exact:true}).check();await page.getByRole('button',{name:'Owned document',exact:true}).click({button:'right'});await page.keyboard.press('Escape');await expect(menu(page,'Owned context')).toBeVisible();await page.goto('/__context.html');
 await page.getByRole('button',{name:'Open editor',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Editor',exact:true}),source=page.getByRole('button',{name:'Editor document',exact:true});await source.click({button:'right'});await expect(menu(page,'Editor actions')).toBeVisible();await page.keyboard.press('Escape');await expect(menu(page,'Editor actions')).toBeHidden();await expect(dialog).toBeVisible();await expect(source).toBeFocused();await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
});

test('ContextMenu clamps pointer and child popups in enlarged RTL layouts',async({page})=>{
 await page.setViewportSize({width:390,height:844});await open(page);await page.evaluate(()=>{document.documentElement.dir='rtl';document.documentElement.style.fontSize='24px';});await page.locator('#area').evaluate(node=>{Object.assign((node as HTMLElement).style,{position:'fixed',bottom:'4px',right:'4px',width:'280px',overflow:'hidden',transform:'translateZ(0)'});});await page.locator('#area').click({button:'right',position:{x:270,y:25}});await expect(menu(page)).toBeVisible();const box=(await menu(page).boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(390);expect(box.y+box.height).toBeLessThanOrEqual(844);expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});
