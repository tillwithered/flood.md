import {test,expect,type Page} from "@playwright/test";
import {build} from "vite";
import {resolve} from "node:path";
import {mkdir,writeFile} from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";

let bundled:Promise<string>;
async function fixture(){
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll("\\","/"));
  const directory=resolve(`.artifacts/tree-select-${process.pid}`),entry=resolve(directory,"entry.mjs");await mkdir(directory,{recursive:true});
  await writeFile(entry,`import React,{StrictMode,useState}from ${file("node_modules/react/index.js")};import{createRoot}from ${file("node_modules/react-dom/client.js")};import{FloodRoot,TreeSelect,Button}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};const h=React.createElement;
const items=[{value:'design',label:'Design',selectable:false,children:[{value:'foundation',label:'Foundations'},{value:'components',label:'Components'},{value:'locked',label:'Locked',disabled:true}]},{value:'engineering',label:'Engineering'}];
function App(){const[disabled,D]=useState(false),[trim,T]=useState(false);return h(FloodRoot,{style:{padding:'1rem',maxWidth:'26rem'}},h('h1',null,'Tree select checks'),h('form',{id:'choices',onSubmit:event=>event.preventDefault()},h(TreeSelect,{id:'destination',label:'Destination',name:'destination',items:trim?items.slice(1):items,defaultValue:'foundation',required:true}),h(TreeSelect,{id:'empty',label:'Empty',name:'empty',items,required:true}),h(TreeSelect,{id:'fixed',label:'Controlled',name:'fixed',items,value:'engineering'}),h(TreeSelect,{id:'readonly',label:'Read only',name:'readonly',items,defaultValue:'foundation',readOnly:true,required:true}),h('fieldset',{disabled},h('legend',null,'Group'),h(TreeSelect,{id:'inherited',label:'Inherited',name:'inherited',items,defaultValue:'engineering'})),h(Button,{type:'submit'},'Submit'),h(Button,{type:'reset'},'Reset')),h(Button,{onClick:()=>D(value=>!value)},'Disable fieldset'),h(Button,{onClick:()=>T(true)},'Remove design'));}createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("production")},build:{write:false,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"TreeSelectFixture"}}});
  const output=Array.isArray(result)?result[0].output:result.output;
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tree select checks</title><style>'+output.filter(x=>x.type==="asset"&&x.fileName.endsWith(".css")).map(x=>(x as any).source).join("")+'</style></head><body><main id="app"></main><script>'+output.filter(x=>x.type==="chunk").map(x=>(x as any).code).join("")+'</script></body></html>';
}
async function open(page:Page){bundled??=fixture();await page.route("**/__tree-select.html",async route=>route.fulfill({contentType:"text/html",body:await bundled}));await page.goto('/__tree-select.html');await expect(page.locator('#destination-trigger')).toBeVisible();}
const submitted=(page:Page,name:string)=>page.locator('#choices').evaluate((form:HTMLFormElement,key)=>new FormData(form).getAll(key),name);

test('TreeSelect navigates hierarchy, commits one form value and restores trigger focus',async({page})=>{
  await open(page);const trigger=page.locator('#destination-trigger');await trigger.focus();await page.keyboard.press('ArrowDown');
  const popup=page.getByRole('dialog',{name:'Destination',exact:true});await expect(popup).toBeVisible();
  await expect(popup.getByRole('treeitem',{name:'Foundations',exact:true})).toBeFocused();
  await page.keyboard.press('ArrowDown');await expect(popup.getByRole('treeitem',{name:'Components',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');await expect(popup).toBeHidden();await expect(trigger).toBeFocused();await expect(trigger).toContainText('Components');expect(await submitted(page,'destination')).toEqual(['components']);
  await trigger.click();await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
  await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(trigger).toContainText('Foundations');expect(await submitted(page,'destination')).toEqual(['foundation']);
});
test('TreeSelect respects required, readonly, inherited disabled and removed choices',async({page})=>{
  await open(page);await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(page.locator('#empty-trigger')).toBeFocused();await expect(page.locator('#empty-trigger')).toHaveAttribute('aria-invalid','true');
  await page.locator('#readonly-trigger').focus();await page.keyboard.press('Enter');await expect(page.getByRole('dialog',{name:'Read only',exact:true})).toBeHidden();expect(await submitted(page,'readonly')).toEqual(['foundation']);
  await page.getByRole('button',{name:'Disable fieldset',exact:true}).click();await expect(page.locator('#inherited-trigger')).toBeDisabled();expect(await submitted(page,'inherited')).toEqual([]);
  await page.getByRole('button',{name:'Remove design',exact:true}).click();await expect(page.locator('#destination-trigger')).toContainText('Choose an item');expect(await submitted(page,'destination')).toEqual(['']);
});
test('TreeSelect controlled value remains host owned and popup fits narrow viewports',async({page})=>{
  await open(page);await page.locator('#fixed-trigger').click();const popup=page.getByRole('dialog',{name:'Controlled',exact:true});
  await popup.getByRole('treeitem',{name:'Design',exact:true}).press('ArrowRight');await popup.getByRole('treeitem',{name:'Foundations',exact:true}).click();
  await expect(page.locator('#fixed-trigger')).toContainText('Engineering');expect(await submitted(page,'fixed')).toEqual(['engineering']);
  await page.locator('#fixed-trigger').click();const rect=await popup.boundingBox();expect(rect!.x).toBeGreaterThanOrEqual(0);expect(rect!.x+rect!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  const audit=await new AxeBuilder({page}).include('#fixed').analyze();expect(audit.violations).toEqual([]);
});
