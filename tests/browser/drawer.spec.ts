import {test,expect,type Page} from '@playwright/test';
import {build} from 'vite';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
let bundle:Promise<string>;
async function fixture(){
 const file=(p:string)=>JSON.stringify(resolve(p).replaceAll('\\','/'));const directory=resolve(`.artifacts/drawer-${process.pid}`);await mkdir(directory,{recursive:true});const entry=resolve(directory,'entry.mjs');
 await writeFile(entry,`import React,{StrictMode,useRef,useState}from ${file('node_modules/react/index.js')};import{createRoot}from ${file('node_modules/react-dom/client.js')};import{FloodRoot,Drawer,Dialog,Button,Input,Select}from ${file('packages/react/dist/index.js')};import ${file('packages/react/dist/styles.css')};const h=React.createElement,trigger=label=>p=>h(Button,p,label);function App(){const[side,S]=useState('end'),[outside,O]=useState(true),[owned,V]=useState(false),[requests,R]=useState(0);const initial=useRef(null);return h(FloodRoot,null,h('h1',null,'Drawer checks'),h('label',null,'Drawer edge',h('select',{value:side,onChange:e=>S(e.target.value)},['start','end','top','bottom'].map(value=>h('option',{key:value,value},value)))),h('label',null,h('input',{type:'checkbox',checked:outside,onChange:e=>O(e.target.checked)}),'Backdrop closing'),h(Drawer,{title:'Project settings',description:'Settings remain in this example.',side,closeOnOutsideClick:outside,initialFocusRef:initial,trigger:trigger('Open settings'),footer:h(Button,null,'Save settings')},h(Input,{ref:initial,'aria-label':'Project name',defaultValue:'Flood'}),h(Select,{'aria-label':'Visibility',defaultValue:'private'},h('option',{value:'private'},'Private'),h('option',{value:'team'},'Team')),h(Dialog,{title:'Nested settings',trigger:trigger('Nested prompt')},h(Input,{'aria-label':'Nested value'})),Array.from({length:24},(_,i)=>h('p',{key:i},'Detailed setting '+(i+1))),h(Input,{'aria-label':'Last setting',defaultValue:'Bottom'})),h(Drawer,{title:'Controlled drawer',open:owned,onOpenChange:next=>{if(next)V(true);else R(n=>n+1)},trigger:trigger('Controlled settings')},h(Input,{'aria-label':'Controlled value'})),h(Dialog,{title:'Ordinary dialog',trigger:trigger('Ordinary prompt')},'Normal content'),h('output',{id:'close-requests'},requests));}createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
 const result=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':'"development"'},build:{write:false,cssCodeSplit:false,lib:{entry,formats:['iife'],name:'Fixture'}}});const output=Array.isArray(result)?result[0].output:result.output;return '<!doctype html><html lang="en"><head><title>Drawer checks</title><meta charset="utf-8"><style>'+output.filter(x=>x.type==='asset'&&x.fileName.endsWith('.css')).map(x=>(x as any).source).join('')+'</style></head><body><main id="app"></main><script>'+output.filter(x=>x.type==='chunk').map(x=>(x as any).code).join('')+'</script></body></html>';
}
async function open(page:Page){bundle??=fixture();await page.route('**/__drawer.html',async route=>route.fulfill({contentType:'text/html',body:await bundle}));await page.goto('/__drawer.html');}
test('Drawer owns native modal focus, nested Select Escape, backdrop optout and return focus',async({page})=>{
 await open(page);await page.getByRole('checkbox',{name:'Backdrop closing',exact:true}).uncheck();const trigger=page.getByRole('button',{name:'Open settings',exact:true});await trigger.click();const drawer=page.getByRole('dialog',{name:'Project settings',exact:true}),close=drawer.getByRole('button',{name:'Close',exact:true}),save=drawer.getByRole('button',{name:'Save settings',exact:true});await expect(drawer.getByRole('textbox',{name:'Project name',exact:true})).toBeFocused();await expect(close).toHaveClass(/flood-icon-button/);await close.focus();await page.keyboard.press('Shift+Tab');await expect(save).toBeFocused();await page.keyboard.press('Tab');await expect(close).toBeFocused();await page.mouse.click(2,2);await expect(drawer).toBeVisible();const select=drawer.getByRole('combobox',{name:'Visibility',exact:true});await select.click();await expect(page.getByRole('listbox')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('listbox')).not.toBeVisible();await expect(drawer).toBeVisible();await page.keyboard.press('Escape');await expect(drawer).not.toBeVisible();await expect(trigger).toBeFocused();await page.getByRole('checkbox',{name:'Backdrop closing',exact:true}).check();await trigger.click();await page.mouse.click(2,2);await expect(drawer).not.toBeVisible();await expect(trigger).toBeFocused();
});
test('Drawer resolves logical edges in RTL and keeps header/footer while long body scrolls',async({page})=>{
 await open(page);
 for(const dir of ['ltr','rtl']){
  await page.evaluate(dir=>document.documentElement.dir=dir,dir);
  for(const side of ['start','end','top','bottom']){
   await page.getByRole('combobox',{name:'Drawer edge',exact:true}).selectOption(side);await page.getByRole('button',{name:'Open settings',exact:true}).click();const drawer=page.getByRole('dialog',{name:'Project settings',exact:true});const rect=(await drawer.boundingBox())!,viewport=page.viewportSize()!;const left=(side==='start'&&dir==='ltr')||(side==='end'&&dir==='rtl');
   if(side==='start'||side==='end'){expect(Math.abs(left?rect.x:viewport.width-rect.x-rect.width)).toBeLessThanOrEqual(2);expect(rect.height).toBeGreaterThan(viewport.height*.9);}else{expect(Math.abs(side==='top'?rect.y:viewport.height-rect.y-rect.height)).toBeLessThanOrEqual(2);expect(rect.width).toBeGreaterThan(viewport.width*.9);}
   const close=drawer.getByRole('button',{name:'Close',exact:true}),save=drawer.getByRole('button',{name:'Save settings',exact:true});const beforeClose=await close.boundingBox(),beforeSave=await save.boundingBox();await drawer.getByRole('textbox',{name:'Last setting',exact:true}).scrollIntoViewIfNeeded();expect((await close.boundingBox())!.y).toBe(beforeClose!.y);expect((await save.boundingBox())!.y).toBe(beforeSave!.y);await expect(save).toBeInViewport();await expect(close).toBeInViewport();await page.keyboard.press('Escape');await expect(drawer).not.toBeVisible();
  }
 }
});
test('Drawer controlled refusal stays modal, and ordinary Dialog keeps its close icon',async({page})=>{
 await open(page);const regular=page.getByRole('button',{name:'Ordinary prompt',exact:true});await regular.click();const normal=page.getByRole('dialog',{name:'Ordinary dialog',exact:true});await normal.getByRole('button',{name:'Close',exact:true}).click();await expect(normal).not.toBeVisible();await expect(regular).toBeFocused();await regular.click();await page.mouse.click(2,2);await expect(normal).not.toBeVisible();await expect(regular).toBeFocused();await page.getByRole('button',{name:'Controlled settings',exact:true}).click();const drawer=page.getByRole('dialog',{name:'Controlled drawer',exact:true});await drawer.getByRole('button',{name:'Close',exact:true}).click();await expect(drawer).toBeVisible();await expect(page.locator('#close-requests')).toHaveText('1');await page.keyboard.press('Escape');await expect(drawer).toBeVisible();await expect(page.locator('#close-requests')).toHaveText('2');expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});

test('Drawer catalog stays flush with viewport despite stable scrollbar gutters and uses compact heading geometry',async({page})=>{
 await page.goto('/components/drawer');
 const stage=page.locator('.preview-stage'),trigger=stage.getByRole('button',{name:'Open settings',exact:true});
 await expect(trigger).toBeVisible();
 expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollbarGutter)).toContain('stable');
 const header=page.locator('header').first();
 for(const dir of ['ltr','rtl']){
  await page.evaluate(dir=>{document.documentElement.dir=dir},dir);
  for(const side of ['start','end','top','bottom']){
   const sideControl=page.getByRole('combobox',{name:'Drawer prop side',exact:true});
   await sideControl.click();await page.getByRole('option',{name:side,exact:true}).click();
   await trigger.scrollIntoViewIfNeeded();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   const before=await header.boundingBox();
   await trigger.click();const drawer=page.getByRole('dialog',{name:'Project settings',exact:true});await expect(drawer).toBeVisible();
   const geometry=await drawer.evaluate(node=>{const rect=node.getBoundingClientRect(),title=node.querySelector('.flood-overlay-title')!.getBoundingClientRect(),description=node.querySelector('.flood-overlay-description')!.getBoundingClientRect();return{x:rect.x,y:rect.y,width:rect.width,height:rect.height,viewportWidth:innerWidth,viewportHeight:innerHeight,gap:description.top-title.bottom,padding:parseFloat(getComputedStyle(node).paddingTop),direction:(node as HTMLElement).dataset.drawerDirection,hitLeft:node.contains(document.elementFromPoint(1,rect.top+rect.height/2)),hitRight:node.contains(document.elementFromPoint(innerWidth-1,rect.top+rect.height/2))}});
   expect(geometry.direction).toBe(dir);
   const left=(side==='start'&&dir==='ltr')||(side==='end'&&dir==='rtl');
   if(side==='start'||side==='end'){expect(Math.abs(left?geometry.x:geometry.viewportWidth-geometry.x-geometry.width)).toBeLessThanOrEqual(1);expect(left?geometry.hitLeft:geometry.hitRight).toBe(true);}
   else {expect(Math.abs(geometry.x)).toBeLessThanOrEqual(1);expect(Math.abs(geometry.width-geometry.viewportWidth)).toBeLessThanOrEqual(1);expect(geometry.hitRight).toBe(true);expect(geometry.hitLeft).toBe(true);expect(Math.abs(side==='top'?geometry.y:geometry.viewportHeight-geometry.y-geometry.height)).toBeLessThanOrEqual(1);}
   expect(Math.abs(geometry.gap-4)).toBeLessThanOrEqual(1);expect(geometry.padding).toBe(16);
   const during=await header.boundingBox();for(const key of ['x','y','width','height'] as const)expect(Math.abs(during![key]-before![key]),`${dir}/${side}/${key}: ${before![key]} -> ${during![key]}`).toBeLessThanOrEqual(1);
   await drawer.getByRole('button',{name:'Close',exact:true}).click();await expect(drawer).not.toBeVisible();
   expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollbarGutter)).toContain('stable');const after=await header.boundingBox();for(const key of ['x','y','width','height'] as const)expect(Math.abs(after![key]-before![key])).toBeLessThanOrEqual(1);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
 }
});


test('Drawer nested modal locks preserve and restore host root inline styles and priorities',async({page})=>{
 await open(page);await page.evaluate(()=>{const s=document.documentElement.style;s.setProperty('overflow','auto','important');s.setProperty('scrollbar-gutter','stable both-edges','important');s.setProperty('padding-left','3px','important');s.setProperty('padding-right','7px','important')});
 const snapshot=()=>page.evaluate(()=>['overflow','scrollbar-gutter','padding-left','padding-right'].map(key=>[key,document.documentElement.style.getPropertyValue(key),document.documentElement.style.getPropertyPriority(key)]));const before=await snapshot();
 await page.getByRole('button',{name:'Open settings',exact:true}).click();const outer=page.getByRole('dialog',{name:'Project settings',exact:true});await expect(outer).toBeVisible();expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollbarGutter)).toBe('auto');
 await outer.getByRole('button',{name:'Nested prompt',exact:true}).click();const nested=page.getByRole('dialog',{name:'Nested settings',exact:true});await expect(nested).toBeVisible();await nested.getByRole('button',{name:'Close',exact:true}).click();await expect(nested).not.toBeVisible();await expect(outer).toBeVisible();expect(await page.evaluate(()=>getComputedStyle(document.documentElement).overflow)).toBe('hidden');expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollbarGutter)).toBe('auto');await outer.getByRole('button',{name:'Close',exact:true}).click();await expect(outer).not.toBeVisible();expect(await snapshot()).toEqual(before);
});
