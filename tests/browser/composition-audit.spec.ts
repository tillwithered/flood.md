import {test,expect,type Page} from "@playwright/test";
import {build} from "vite";
import {resolve} from "node:path";
import {mkdir,writeFile} from "node:fs/promises";
let bundle:Promise<string>;
async function fixture(){
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll("\\","/"));
  const directory=resolve(`.artifacts/composition-audit-${process.pid}`),entry=resolve(directory,"entry.mjs");await mkdir(directory,{recursive:true});
  await writeFile(entry,`import React,{useState,useRef,StrictMode}from ${file("node_modules/react/index.js")};
import{tabbables,registerLayer}from ${file("packages/react/dist/overlay-runtime.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};import{flushSync}from ${file("node_modules/react-dom/index.js")};
import{FloodRoot,Button,Input,Popover,Dialog,Tabs,Accordion,Collapsible,Breadcrumb,Pagination,Menu,Table}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};
window.auditOwnerDocument=()=>{const frame=document.createElement('iframe');document.body.appendChild(frame);const doc=frame.contentDocument;doc.body.innerHTML='<form><input type="radio" name="choice" id="first"><input type="radio" name="choice" id="second" checked></form>';const stops=tabbables(doc.body).map(node=>node.id),dialog=doc.createElement('dialog');doc.body.appendChild(dialog);dialog.showModal();let closed=0;const dispose=registerLayer(doc,{panel:dialog,anchor:()=>null,modal:true,close:()=>{closed++;dialog.close()}});const event=new frame.contentWindow.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true});doc.dispatchEvent(event);dispose();frame.remove();return{stops,closed,canceled:event.defaultPrevented}};
const h=React.createElement,trigger=label=>props=>h(Button,{...props},label),rapid=props=>h(Button,{...props,onClick:event=>{flushSync(()=>props.onClick(event));document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}))}},'Quick popup');
function App(){const[submits,S]=useState(0),[page,P]=useState(1),disabled=useRef(),hidden=useRef();return h(FloodRoot,null,h('h1',null,'Composition verification'),
h('form',{onSubmit:event=>{event.preventDefault();S(n=>n+1)}},h(Tabs,{label:'Composition tabs',items:[{value:'a',label:'Alpha',content:'Alpha content',icon:h('svg',{viewBox:'0 0 24 24'},h('circle',{cx:12,cy:12,r:8}))},{value:'b',label:'Beta',content:'Beta content'}]}),h(Accordion,{label:'Questions',items:[{value:'one',title:'One question',content:'Answer'}]}),h(Collapsible,{title:'Details'},'Details content'),h(Pagination,{page,pageCount:3,onPageChange:P})),
h('div',{id:'overflow-tabs',style:{width:'14rem',maxWidth:'100%'}},h(Tabs,{label:'Overflow tabs',items:Array.from({length:8},(_,i)=>({value:'t'+i,label:'Section '+i,content:'Section body'}))})),
h('div',{id:'overflow-table',style:{width:'14rem',maxWidth:'100%'}},h(Table,{caption:'Wide table',style:{minWidth:'48rem'}},h('tbody',null,h('tr',null,h('td',null,'Final row'))))),
h(Menu,{label:'Long actions',trigger:trigger('Long actions'),items:Array.from({length:40},(_,i)=>({id:'item'+i,label:'Action '+i}))}),
h(Breadcrumb,{items:[{label:'Home',href:'#home'},{label:'Current'}]}),h('output',{'aria-label':'Submits'},String(submits)),h('output',{'aria-label':'Page'},String(page)),
h(Dialog,{title:'Media content',trigger:trigger('Open media content')},h('video',{controls:true,preload:'none','aria-label':'Video preview',style:{maxWidth:'100%'}}),h('audio',{controls:true,preload:'none','aria-label':'Audio preview',style:{maxWidth:'100%'}}),h(Button,null,'Media action')),
h(Dialog,{title:'Rich content',trigger:trigger('Open rich content')},h('div',{contentEditable:'plaintext-only',role:'textbox','aria-label':'Editable notes'},'Notes'),h('details',null,h('summary',null,'Extra details'),h('button',null,'Detail action')),h(Button,null,'Last rich action')),
h(Dialog,{title:'Parent dialog',trigger:trigger('Open parent')},h(Popover,{title:'Quick child',trigger:rapid},'Child content'),h(Button,null,'Parent action')),
h(Dialog,{title:'Disabled preferred',initialFocusRef:disabled,trigger:trigger('Open disabled preferred')},h(Input,{ref:disabled,disabled:true,'aria-label':'Disabled target'}),h(Input,{'aria-label':'Usable target'})),
h(Popover,{title:'Hidden preferred',initialFocusRef:hidden,trigger:trigger('Open hidden preferred')},h(Input,{ref:hidden,hidden:true,'aria-label':'Hidden target'}),h(Input,{hidden:true,'data-flood-autofocus':true,'aria-label':'Hidden autofocus'}),h(Input,{'aria-label':'Usable popup target'})));
}
createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("development")},build:{write:false,minify:true,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"CompositionAuditFixture"}}});
  const outputs=(Array.isArray(result)?result:[result]).flatMap(item=>"output" in item?item.output:[]);
  const js=outputs.filter(item=>item.type==="chunk").map(item=>item.type==="chunk"?item.code:"").join("\n");
  const css=outputs.filter(item=>item.type==="asset"&&item.fileName.endsWith(".css")).map(item=>item.type==="asset"?String(item.source):"").join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Composition verification</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}body{min-height:2000px}</style></head><body><main id="app"></main><script>${js.replace(/<\/script/gi,"<\\/script")}</script></body></html>`;
}
async function open(page:Page){bundle??=fixture();const html=await bundle;await page.route("**/__composition-audit.html",route=>route.fulfill({contentType:"text/html",body:html}));await page.goto("/__composition-audit.html")}


test("composed navigation and disclosure controls retain native button and link behavior",async({page})=>{
  await open(page);await page.getByRole('tab',{name:'Beta',exact:true}).click();await expect(page.getByRole('tab',{name:'Beta',exact:true})).toHaveAttribute('aria-selected','true');await page.getByRole('button',{name:'One question',exact:true}).click();await expect(page.getByRole('button',{name:'One question',exact:true})).toHaveAttribute('aria-expanded','true');await page.getByRole('button',{name:'Details',exact:true}).click();await page.getByRole('button',{name:'Next page',exact:true}).click();await expect(page.locator('output[aria-label="Page"]')).toHaveText('2');await expect(page.locator('output[aria-label="Submits"]')).toHaveText('0');await expect(page.getByRole('link',{name:'Home',exact:true})).toHaveAttribute('href','#home');await expect(page.locator('.flood-tab .flood-icon svg')).toHaveCount(1);await expect(page.locator('.flood-tab .flood-icon')).toHaveAttribute('aria-hidden','true');
});
test("Tabs leaves modified arrows and IME events to its host",async({page})=>{
  await open(page);const alpha=page.getByRole('tab',{name:'Alpha',exact:true}),beta=page.getByRole('tab',{name:'Beta',exact:true});await alpha.focus();for(const key of ['Control+ArrowRight','Alt+ArrowRight','Meta+ArrowRight']){await page.keyboard.press(key);await expect(alpha).toBeFocused();await expect(alpha).toHaveAttribute('aria-selected','true');}const uncanceled=await alpha.evaluate(node=>node.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true,isComposing:true})));expect(uncanceled).toBe(true);await expect(alpha).toBeFocused();await page.keyboard.press('ArrowRight');await expect(beta).toBeFocused();await expect(beta).toHaveAttribute('aria-selected','true');
});
test("a newly opened Popover owns immediate Escape before its first animation frame",async({page})=>{
  await open(page);await page.getByRole('button',{name:'Open parent',exact:true}).click();const parent=page.getByRole('dialog',{name:'Parent dialog',exact:true});await parent.getByRole('button',{name:'Quick popup',exact:true}).click();await expect(parent).toBeVisible();await expect(page.getByRole('dialog',{name:'Quick child',exact:true})).toBeHidden();await expect(parent.getByRole('button',{name:'Quick popup',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(parent).toBeHidden();
});
test("Dialog and Popover skip unavailable preferred and autofocus targets",async({page})=>{
  await open(page);await page.getByRole('button',{name:'Open disabled preferred',exact:true}).click();await expect(page.getByRole('textbox',{name:'Usable target',exact:true})).toBeFocused();await page.keyboard.press('Escape');await page.getByRole('button',{name:'Open hidden preferred',exact:true}).click();await expect(page.getByRole('textbox',{name:'Usable popup target',exact:true})).toBeFocused();await page.keyboard.press('Escape');
});

test("molecules reserve the public ScrollArea gutter when overflow appears",async({page})=>{
  await open(page);
  for(const selector of ['#overflow-tabs','#overflow-table']){
    const root=page.locator(selector),track=root.locator('.flood-scroll-area__track--horizontal');await expect(track).toBeVisible();const bounds=await track.boundingBox(),content=await root.locator(selector.includes('tabs')?'.flood-tabs__list':'table').boundingBox();expect(content!.y+content!.height).toBeLessThanOrEqual(bounds!.y);
  }
  await page.getByRole('button',{name:'Long actions',exact:true}).click();const menu=page.getByRole('menu',{name:'Long actions',exact:true}),track=menu.locator('.flood-scroll-area__track--vertical');await expect(track).toBeVisible();const rail=await track.boundingBox(),item=await menu.getByRole('menuitem').first().boundingBox();expect(item!.x+item!.width).toBeLessThanOrEqual(rail!.x);
});

test("overlay helpers use their owner document for radio and layer semantics",async({page})=>{
  await open(page);const result=await page.evaluate(()=>(window as unknown as {auditOwnerDocument:()=>{stops:string[];closed:number;canceled:boolean}}).auditOwnerDocument());expect(result).toEqual({stops:['second'],closed:1,canceled:true});
});

test("Dialog discovers native editing roots and details summaries in its focus order",async({page})=>{
  await open(page);await page.getByRole('button',{name:'Open rich content',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Rich content',exact:true});await expect(dialog.getByRole('textbox',{name:'Editable notes',exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(dialog.locator('summary')).toBeFocused();await page.keyboard.press('Tab');await expect(dialog.getByRole('button',{name:'Last rich action',exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(dialog.getByRole('button',{name:'Close',exact:true})).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(dialog.getByRole('button',{name:'Last rich action',exact:true})).toBeFocused();
});

test("Dialog includes native media controls in initial focus discovery",async({page})=>{
  await open(page);await page.getByRole('button',{name:'Open media content',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Media content',exact:true});await expect(dialog.locator('video')).toBeFocused();await dialog.locator('audio').focus();await expect(dialog.locator('audio')).toBeFocused();await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
});
