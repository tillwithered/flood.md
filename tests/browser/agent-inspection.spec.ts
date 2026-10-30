import {test,expect,type Page} from '@playwright/test';
import {build} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {inspectRenderedUI} from '../../packages/agent/lib/inspect.mjs';
let bundled:Promise<string>;
async function fixture(){
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll('\\','/'));
  const directory=resolve(`.artifacts/inspection-${process.pid}`);await mkdir(directory,{recursive:true});
  const entry=resolve(directory,'entry.mjs');
  await writeFile(entry,`import React from ${file('node_modules/react/index.js')};import{createRoot}from ${file('node_modules/react-dom/client.js')};
import{FloodRoot,Table,Input,Button,IconSlot,Stack,Text}from ${file('packages/react/dist/index.js')};import ${file('packages/react/dist/styles.css')};const h=React.createElement;
const row=h('tbody',null,h('tr',null,h('td',null,h(Input,{'aria-label':'Quantity',defaultValue:'2',controlSize:'lg'})),h('td',{'data-numeric':true},'20.00')));
const records=h('tbody',null,h('tr',null,h('th',{scope:'row'},h(Stack,{gap:'1'},h(Text,{size:'compact'},'Project alpha'),h(Text,{size:'helper'},'30 October'))),h('td',null,'Client'),h('td',{'data-numeric':true},'12.00'),h('td',null,h(Button,{variant:'subtle'},'Open'))));
createRoot(document.getElementById('app')).render(h(FloodRoot,null,
h('section',{id:'bad'},h(Button,null,'＋ Create'),h(Table,{caption:'Top',cellVerticalAlign:'top'},row)),
h('section',{id:'good'},h(Button,null,h(IconSlot,null,h('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor'},h('path',{d:'M12 5v14M5 12h14'}))),'Create'),h(Table,{caption:'Middle'},row)),
h('section',{id:'bottom'},h(Table,{caption:'Bottom',cellVerticalAlign:'bottom'},row)),
h('section',{id:'records-bad'},h(Table,{caption:'Record top',cellVerticalAlign:'top'},records)),
h('section',{id:'records-good'},h(Table,{caption:'Record middle'},records)),
h('section',{id:'copy'},h(Button,null,'Save changes'),h(Text,{size:'helper'},'Changes are saved with “Save changes”.'),h(Text,{size:'compact'},'Save changes replaces the existing revision.')),
h(Button,null,'+7 phone'),h('button',{className:'flood-button',hidden:true},'＋ Hidden')));`);
  const result=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{write:false,cssCodeSplit:false,lib:{entry,formats:['iife'],name:'Inspection'}}});
  const output=(Array.isArray(result)?result:[result]).flatMap(x=>'output'in x?x.output:[]);
  return '<!doctype html><html><head><meta charset="utf-8"><style>'+output.filter(x=>x.type==='asset'&&x.fileName.endsWith('.css')).map(x=>(x as any).source).join('')+'</style></head><body><div id="app"></div><script>'+output.filter(x=>x.type==='chunk').map(x=>(x as any).code).join('')+'</script></body></html>';
}
async function open(page:Page){bundled??=fixture();await page.route('**/__inspection.html',async route=>route.fulfill({contentType:'text/html',body:await bundled}));await page.goto('/__inspection.html');await page.locator('#good table').waitFor();await page.evaluate(()=>document.fonts.ready);}

test('observer flags real glyph and mixed-row defects, not slot icons, phone prefixes or hidden actions',async({page})=>{
  await open(page);
  const report=await page.evaluate(inspectRenderedUI,{});
  expect(report.issues.filter(issue=>issue.id==='icons.text-glyph')).toHaveLength(1);
  const bad=await page.evaluate(inspectRenderedUI,{rootSelector:'#bad'});
  expect(bad.issues.filter(issue=>issue.id==='table.mixed-row-centre').map(issue=>issue.target.label)).toEqual(['20.00']);
  const good=await page.evaluate(inspectRenderedUI,{rootSelector:'#good'});
  expect(good.issues).toEqual([]);
  expect(good.notChecked.length).toBeGreaterThan(0);
});

test('Table native alignment works across all modes and defaults to middle',async({page})=>{
  await open(page);
  for(const [section,alignment] of [['bad','top'],['good','middle'],['bottom','bottom']]){
    await expect(page.locator(`#${section} tbody td`).first()).toHaveCSS('vertical-align',alignment);
    await expect(page.locator(`#${section} tbody td`).last()).toHaveCSS('vertical-align',alignment);
  }
  const difference=await page.locator('#good tbody tr').evaluate(row=>{
    const control=row.querySelector('input')!.getBoundingClientRect();
    const range=document.createRange();range.selectNodeContents(row.querySelector('[data-numeric]')!);const text=range.getBoundingClientRect();
    return Math.abs(control.y+control.height/2-text.y-text.height/2);
  });
  expect(difference).toBeLessThanOrEqual(1);
});

test('record/action rows include multiline identities, plain values and controls in coverage',async({page})=>{
  await open(page);
  const bad=await page.evaluate(inspectRenderedUI,{rootSelector:'#records-bad'});
  const labels=bad.issues.filter(issue=>issue.id==='table.mixed-row-centre').map(issue=>issue.target.label);
  expect(labels).toContain('Client');expect(labels).toContain('12.00');
  const good=await page.evaluate(inspectRenderedUI,{rootSelector:'#records-good'});
  expect(good.issues).toEqual([]);
  await page.evaluate(()=>document.documentElement.style.fontSize='24px');
  const enlarged=await page.evaluate(inspectRenderedUI,{rootSelector:'#records-good'});
  expect(enlarged.issues).toEqual([]);
});

test('action-echo observation flags narration and consequential instructions for contextual review',async({page})=>{
  await open(page);
  const report=await page.evaluate(inspectRenderedUI,{rootSelector:'#copy'});
  expect(report.issues.filter(issue=>issue.id==='copy.action-echo')).toHaveLength(2);
  expect(report.notChecked.join(' ')).toContain('Editorial necessity');
});

test('observer bounds inventory and refuses an absent root without mutating the page',async({page})=>{
  await open(page);
  const before=await page.content();
  const report=await page.evaluate(inspectRenderedUI,{maxElements:1});
  expect(report.truncated).toBe(true);
  expect(await page.content()).toBe(before);
  await expect(page.evaluate(inspectRenderedUI,{rootSelector:'#missing'})).rejects.toThrow('root was not found');
});
