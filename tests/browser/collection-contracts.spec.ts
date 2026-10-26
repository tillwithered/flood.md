import { test, expect, type Page } from '@playwright/test';
import { build } from 'vite';
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
let bundle:Promise<string>;
async function fixture(){
 const file=(p:string)=>JSON.stringify(resolve(p).replaceAll('\\','/'));
 const directory=resolve(`.artifacts/collection-contracts-${process.pid}`),entry=resolve(directory,'entry.mjs');await mkdir(directory,{recursive:true});
 await writeFile(entry,`import React,{StrictMode,useState}from ${file('node_modules/react/index.js')};import{createRoot}from ${file('node_modules/react-dom/client.js')};import{FloodRoot,Field,Combobox,MultiSelect,TagInput,Button}from ${file('packages/react/dist/index.js')};import ${file('packages/react/dist/styles.css')};const h=React.createElement,options=[{value:'alpha',label:'Alpha'},{value:'beta',label:'Beta'}];function App(){const[cancel,C]=useState(true),[value,V]=useState(''),[required,R]=useState(true),[invalid,I]=useState(false),[sorted,S]=useState(['Design']),[deferred,D]=useState(['Design']),[request,Q]=useState([]);return h(FloodRoot,null,h('form',{id:'reset-form',onReset:e=>{if(cancel)e.preventDefault()}},h(Field,{label:'Combo reset'},p=>h(Combobox,{...p,name:'combo',options,defaultValue:'alpha'})),h(Field,{label:'Multi reset'},p=>h(MultiSelect,{...p,name:'multi',options,defaultValue:['alpha']})),h(Field,{label:'Owned reset'},p=>h(Combobox,{...p,name:'owned',options,value:'beta'})),h(Button,{type:'reset'},'Reset')),h(Button,{onClick:()=>C(false)},'Allow reset'),h('form',{id:'validity',onSubmit:e=>e.preventDefault()},h(Field,{label:'Combo validation'},p=>h(Combobox,{...p,options,value,required,invalid})),h(Field,{label:'Multi validation'},p=>h(MultiSelect,{...p,options,value:value?[value]:[],required,invalid})),h(TagInput,{label:'Tag validation',value:value?['Accepted']:[],required,invalid}),h(Button,{type:'submit'},'Validate')),h(Button,{onClick:()=>V('beta')},'Provide values'),h(Button,{onClick:()=>R(false)},'Optional'),h(Button,{onClick:()=>I(true)},'Host invalid'),h(TagInput,{label:'Sorted topics',value:sorted,onValueChange:next=>S([...next].sort())}),h(TagInput,{label:'Deferred topics',value:deferred,onValueChange:Q}),h(Button,{onClick:()=>D([...request].sort())},'Accept deferred'),h(Button,{onClick:()=>D(['Alpha'])},'Accept incomplete'));}createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
 const result=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':JSON.stringify('development')},build:{write:false,minify:true,cssCodeSplit:false,lib:{entry,formats:['iife'],name:'ComboboxFixture'}}});
 const outputs=(Array.isArray(result)?result:[result]).flatMap(v=>'output'in v?v.output:[]);const js=outputs.filter(v=>v.type==='chunk').map(v=>v.type==='chunk'?v.code:'').join('\n'),css=outputs.filter(v=>v.type==='asset'&&v.fileName.endsWith('.css')).map(v=>v.type==='asset'?String(v.source):'').join('\n');
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Combobox verification</title><style>${css}body{margin:16px;background:#181818;color:white}#app{max-width:26rem}fieldset{min-width:0}form>fieldset{display:grid;gap:1rem}</style></head><body><header><h1>Combobox verification</h1></header><main id="app"></main><script>${js.replace(/<\/script/gi,'<\\/script')}</script></body></html>`;
}
async function open(page:Page){bundle??=fixture();await page.route('**/__collection-contracts.html',async route=>route.fulfill({contentType:'text/html',body:await bundle}));await page.goto('/__collection-contracts.html');}


const controls=(page:Page)=>page.locator('#validity input:not([type="hidden"])');
async function triggerInvalid(page:Page){await page.locator('#validity').evaluate((form:HTMLFormElement)=>form.checkValidity());await expect(page.locator('#validity [role="alert"]')).toHaveCount(3);}

test('selection reset waits for React cancellation and preserves controlled ownership',async({page})=>{
 await open(page);const combo=page.getByRole('combobox',{name:'Combo reset',exact:true}),multi=page.getByRole('combobox',{name:'Multi reset',exact:true});
 await combo.fill('Beta');await combo.press('Enter');await multi.fill('Beta');await multi.press('Enter');await multi.press('Escape');
 const values=()=>page.locator('#reset-form').evaluate((form:HTMLFormElement)=>[...new FormData(form)]);
 await page.getByRole('button',{name:'Reset',exact:true}).click();await page.waitForTimeout(25);
 expect(await values()).toEqual([['combo','beta'],['multi','alpha'],['multi','beta'],['owned','beta']]);
 await page.getByRole('button',{name:'Allow reset',exact:true}).click();await page.getByRole('button',{name:'Reset',exact:true}).click();
 await expect.poll(values).toEqual([['combo','alpha'],['multi','alpha'],['owned','beta']]);
});

test('externally accepted committed values clear obsolete required feedback without erasing host invalid',async({page})=>{
 await open(page);await triggerInvalid(page);
 // Merely typing an unaccepted draft must not make the committed selection valid.
 const combo=page.getByRole('combobox',{name:'Combo validation',exact:true});await combo.fill('Beta');await combo.press('Enter');
 expect(await combo.evaluate((node:HTMLInputElement)=>node.validity.valid)).toBe(false);await triggerInvalid(page);
 await page.getByRole('button',{name:'Provide values',exact:true}).click();
 await expect(page.locator('#validity [role="alert"]')).toHaveCount(0);
 for(const control of await controls(page).all()){expect(await control.evaluate((node:HTMLInputElement)=>node.validity.valid)).toBe(true);await expect(control).not.toHaveAttribute('aria-invalid','true');}
 await page.getByRole('button',{name:'Host invalid',exact:true}).click();
 for(const control of await controls(page).all())await expect(control).toHaveAttribute('aria-invalid','true');
});

test('removing required clears internal feedback while empty controlled values remain empty',async({page})=>{
 await open(page);await triggerInvalid(page);await page.getByRole('button',{name:'Optional',exact:true}).click();
 await expect(page.locator('#validity [role="alert"]')).toHaveCount(0);
 for(const control of await controls(page).all()){await expect(control).toHaveValue('');expect(await control.evaluate((node:HTMLInputElement)=>node.validity.valid)).toBe(true);await expect(control).not.toHaveAttribute('aria-invalid','true');}
});


test('TagInput recognizes complete reordered acceptance, preserves refusal and newer edits',async({page})=>{
 await open(page);const sorted=page.getByRole('textbox',{name:'Sorted topics',exact:true});
 await sorted.fill('Alpha');await sorted.press('Enter');await expect(sorted).toHaveValue('');
 await expect(page.locator('.flood-tag-input').filter({has:sorted}).getByRole('button',{name:'Remove Alpha',exact:true})).toBeVisible();
 const deferred=page.getByRole('textbox',{name:'Deferred topics',exact:true});
 await deferred.fill('Alpha');await deferred.press('Enter');await expect(deferred).toHaveValue('Alpha');
 // Receiving only the new value is not full acceptance: the requested Design is missing.
 await page.getByRole('button',{name:'Accept incomplete',exact:true}).click();await expect(deferred).toHaveValue('Alpha');
 await page.getByRole('button',{name:'Accept deferred',exact:true}).click();await expect(deferred).toHaveValue('');
 await deferred.fill('Beta');await deferred.press('Enter');await expect(deferred).toHaveValue('Beta');
 await deferred.fill('New draft');await page.getByRole('button',{name:'Accept deferred',exact:true}).click();await expect(deferred).toHaveValue('New draft');
});
