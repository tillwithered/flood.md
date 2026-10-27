import {test,expect,type Page} from '@playwright/test';
import {build} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
let bundle:Promise<string>;
async function fixture(){
 const file=(path:string)=>JSON.stringify(resolve(path).replaceAll('\\','/'));const folder=resolve(`.artifacts/listbox-forms-${process.pid}`);await mkdir(folder,{recursive:true});const entry=resolve(folder,'entry.mjs');
 await writeFile(entry,`import React,{useState}from ${file('node_modules/react/index.js')};import{createRoot}from ${file('node_modules/react-dom/client.js')};import{FloodRoot,ListBox,Button,Checkbox}from ${file('packages/react/dist/index.js')};import ${file('packages/react/dist/styles.css')};const h=React.createElement,options=[{value:'alpha',label:'Alpha'},{value:'beta',label:'Beta'},{value:'locked',label:'Locked',disabled:true}];function App(){const[readOnly,R]=useState(false),[disabled,D]=useState(false),[cancel,C]=useState(true),[accept,A]=useState(false),[owned,O]=useState([]),[requested,Q]=useState([]),[message,M]=useState(''),[submitted,S]=useState(0);return h(FloodRoot,null,h('h1',null,'ListBox forms'),
 h('form',{id:'single',onSubmit:e=>{e.preventDefault();S(n=>n+1)}},h(ListBox,{id:'single-list',label:'Single choice',name:'single',options,required:true,description:'Select one tool.',requiredMessage:'Choose a tool.'}),h(Button,{type:'submit'},'Submit single')),
 h('form',{id:'owned',onSubmit:e=>e.preventDefault()},h('fieldset',{disabled},h('legend',null,'Owned selection'),h(ListBox,{id:'owned-list',label:'Owned choices',name:'owned',options,multiple:true,required:true,value:owned,onValueChange:next=>{Q(next);if(accept)O(next)},readOnly,validationMessage:message}))),
 h('form',{id:'reset',onReset:e=>{if(cancel)e.preventDefault()}},h(ListBox,{id:'reset-list',label:'Reset choices',name:'reset',options,multiple:true,defaultValue:['alpha']}),h(Button,{type:'reset'},'Reset choices now')),
 h('form',{id:'remote'},h(Button,{type:'submit'},'Remote submit')),h(ListBox,{id:'remote-list',label:'Remote choices',name:'remote',form:'remote',options,defaultValue:'beta',status:'warning',message:'Review this choice.',hideLabel:true}),
 h(Button,{onClick:()=>O(requested)},'Accept request'),h(Button,{onClick:()=>A(true)},'Accept automatically'),h(Button,{onClick:()=>M('Server rejected this choice.')},'Server error'),h(Button,{onClick:()=>M('')},'Clear server error'),
 h(Checkbox,{label:'Read only',checked:readOnly,onChange:e=>R(e.currentTarget.checked)}),h(Checkbox,{label:'Disabled',checked:disabled,onChange:e=>D(e.currentTarget.checked)}),h(Checkbox,{label:'Cancel reset',checked:cancel,onChange:e=>C(e.currentTarget.checked)}),h('output',{'aria-label':'Submitted'},submitted));}createRoot(document.getElementById('app')).render(h(App));`);
 const result=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':'"production"'},build:{write:false,cssCodeSplit:false,lib:{entry,formats:['iife'],name:'ListboxForms'}}});const output=(Array.isArray(result)?result:[result]).flatMap(result=>'output'in result?result.output:[]);
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ListBox</title><style>'+output.filter(x=>x.type==='asset'&&x.fileName.endsWith('.css')).map(x=>(x as any).source).join('')+'body{margin:1rem;background:#181818;color:white}#app{max-width:30rem}fieldset{min-width:0}</style><body><main id="app"></main><script>'+output.filter(x=>x.type==='chunk').map(x=>(x as any).code).join('')+'</script></body></html>';
}
async function open(page:Page){bundle??=fixture();await page.route('**/__listbox-forms.html',async route=>route.fulfill({contentType:'text/html',body:await bundle}));await page.goto('/__listbox-forms.html');}
const values=(page:Page,id:string)=>page.locator(`#${id}`).evaluate((form:HTMLFormElement)=>[...new FormData(form)]);
const valid=(page:Page,id:string)=>page.locator(`#${id}`).evaluate((form:HTMLFormElement)=>form.checkValidity());

test('required single selection validates, focuses the list and clears feedback on selection',async({page})=>{
 await open(page);const list=page.getByRole('listbox',{name:'Single choice',exact:true});await expect(list).toHaveAttribute('aria-required','true');await expect(list).toHaveAccessibleDescription('Select one tool.');
 await page.getByRole('button',{name:'Submit single',exact:true}).click();await expect(list).toBeFocused();await expect(page.getByRole('alert')).toHaveText('Choose a tool.');await expect(list).toHaveAttribute('aria-invalid','true');
 await list.getByRole('option',{name:'Beta',exact:true}).click();await expect(page.getByRole('alert')).toHaveCount(0);expect(await valid(page,'single')).toBe(true);expect(await values(page,'single')).toEqual([['single','beta']]);
 await page.getByRole('button',{name:'Submit single',exact:true}).click();await expect(page.locator('output')).toHaveText('1');
});

test('controlled refusal remains invalid until accepted, while readonly and inherited disable preserve contracts',async({page})=>{
 await open(page);const list=page.getByRole('listbox',{name:'Owned choices',exact:true});await list.getByRole('option',{name:'Alpha',exact:true}).click();expect(await values(page,'owned')).toEqual([]);expect(await valid(page,'owned')).toBe(false);
 await page.getByRole('button',{name:'Accept request',exact:true}).click();expect(await valid(page,'owned')).toBe(true);expect(await values(page,'owned')).toEqual([['owned','alpha']]);
 await page.getByRole('button',{name:'Server error',exact:true}).click();expect(await valid(page,'owned')).toBe(false);await expect(page.getByRole('alert')).toHaveText('Server rejected this choice.');
 await page.getByRole('checkbox',{name:'Read only',exact:true}).check();expect(await valid(page,'owned')).toBe(true);expect(await values(page,'owned')).toEqual([['owned','alpha']]);await expect(page.getByRole('alert')).toHaveCount(0);
 await page.getByRole('checkbox',{name:'Disabled',exact:true}).check();expect(await values(page,'owned')).toEqual([]);expect(await valid(page,'owned')).toBe(true);
 await page.getByRole('checkbox',{name:'Disabled',exact:true}).uncheck();await expect(list).not.toHaveAttribute('aria-disabled','true');expect(await values(page,'owned')).toEqual([['owned','alpha']]);
});

test('multiple reset cancellation and external form ownership keep exact accepted values',async({page})=>{
 await open(page);const list=page.getByRole('listbox',{name:'Reset choices',exact:true});await list.getByRole('option',{name:'Beta',exact:true}).click();await page.getByRole('button',{name:'Reset choices now',exact:true}).click();expect(await values(page,'reset')).toEqual([['reset','alpha'],['reset','beta']]);
 await page.getByRole('checkbox',{name:'Cancel reset',exact:true}).uncheck();await page.getByRole('button',{name:'Reset choices now',exact:true}).click();await expect.poll(()=>values(page,'reset')).toEqual([['reset','alpha']]);
 const remote=page.getByRole('listbox',{name:'Remote choices',exact:true});await expect(remote).toHaveAccessibleDescription('Review this choice.');await expect(remote).toHaveAttribute('data-status','warning');expect(await values(page,'remote')).toEqual([['remote','beta']]);
 await remote.getByRole('option',{name:'Alpha',exact:true}).click();expect(await values(page,'remote')).toEqual([['remote','alpha']]);
});
