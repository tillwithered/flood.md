import {test,expect,type Page} from '@playwright/test';
import {chooseSelectOption} from './select-helpers';
import {build} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

async function open(page:Page){
  await page.goto('/components/filter-condition');
  const row=page.locator('.preview-stage').getByRole('group',{name:'Condition 1',exact:true});
  await expect(row).toBeVisible(); await page.evaluate(()=>document.fonts.ready);return row;
}

test('property changes discard incompatible values, operator changes preserve selection, removal has a return target',async({page})=>{
  const row=await open(page);
  await expect(row.locator('.flood-tag__label')).toHaveText('Active');
  await chooseSelectOption(row.getByRole('combobox',{name:'Condition 1 property',exact:true}),'owner');
  await expect(row.locator('.flood-tag')).toHaveCount(0);
  const values=row.getByRole('combobox',{name:'Condition 1 values',exact:true});
  await values.click();await page.getByRole('option',{name:'Maya',exact:true}).click();await values.press('Escape');
  await chooseSelectOption(row.getByRole('combobox',{name:'Condition 1 operator',exact:true}),'is-not');
  await expect(row.locator('.flood-tag__label')).toHaveText('Maya');
  const feedback=page.locator('.workbench-feedback');
  await expect(feedback).toBeEmpty();
  await row.getByRole('button',{name:'Remove condition 1',exact:true}).click();
  await expect(row).toHaveCount(0);
  await expect(feedback).toHaveText('Condition removed');
  await expect(page.getByRole('button',{name:'Reset',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await expect(feedback).toBeEmpty();
  await expect(row.locator('.flood-tag__label')).toHaveText('Active');
});

test('compact selected values share control geometry; constrained rows reflow instead of clipping',async({page})=>{
  await page.setViewportSize({width:1800,height:1100});
  const row=await open(page);
  for(const size of ['sm','md','lg','xl']){
    await chooseSelectOption(page.getByRole('combobox',{name:'FilterCondition prop controlSize',exact:true}),size);
    const boxes=await row.locator('.flood-filter-condition__row > *').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return{y:r.y,height:r.height,center:r.y+r.height/2};}));
    expect(Math.max(...boxes.map(r=>r.center))-Math.min(...boxes.map(r=>r.center))).toBeLessThan(1);
    expect(Math.max(...boxes.map(r=>r.height))-Math.min(...boxes.map(r=>r.height))).toBeLessThanOrEqual(1);
  }
  await chooseSelectOption(page.getByRole('combobox',{name:'FilterCondition prop width',exact:true}),'26rem');
  await page.evaluate(()=>{document.documentElement.style.fontSize='24px';});
  const geometry=await row.evaluate(node=>({width:node.clientWidth,scroll:node.scrollWidth,children:Array.from(node.querySelectorAll('.flood-filter-condition__row > *')).map(child=>{const r=child.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};})}));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.width+1);
  for(const rect of geometry.children)expect(rect.w).toBeGreaterThanOrEqual(32);
  await page.getByRole('checkbox',{name:'FilterCondition prop disabled',exact:true}).check();
  for(const field of await row.getByRole('combobox').all())await expect(field).toBeDisabled();
  await expect(row.getByRole('button',{name:'Remove condition 1',exact:true})).toBeDisabled();
});

test('advanced collection editor uses the shared row, retains draft cancellation and focuses a surviving row on removal',async({page})=>{
  await page.goto('/playground/collections');
  await page.getByRole('button',{name:'Filters',exact:true}).click();
  const panel=page.getByRole('dialog',{name:'Projects filters',exact:true});
  await panel.getByRole('button',{name:'Advanced conditions',exact:true}).click();
  await panel.getByRole('button',{name:'Add condition',exact:true}).click();
  await panel.getByRole('button',{name:'Add condition',exact:true}).click();
  await expect(panel.locator('.flood-filter-condition')).toHaveCount(2);
  await panel.getByRole('button',{name:'Remove condition 1',exact:true}).click();
  await expect(panel.locator('.flood-filter-condition')).toHaveCount(1);
  await expect(panel.getByRole('combobox',{name:'Condition 1 property',exact:true})).toBeFocused();
  await panel.getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(page.getByRole('table',{name:'Projects',exact:true})).toContainText('Design system');
});

test('selected chips do not force an empty placeholder row, but typing still opens a usable search editor',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  const row=await open(page),input=row.getByRole('combobox',{name:'Condition 1 values',exact:true});
  await input.click();
  await page.getByRole('option',{name:'Paused',exact:true}).click();
  await page.getByRole('option',{name:'Archived',exact:true}).click();
  await input.press('Escape');
  const control=row.locator('.flood-multi-select__control');
  await row.locator('.flood-filter-condition__values').evaluate(node=>{(node as HTMLElement).style.inlineSize='20rem';});
  await expect(control.locator('.flood-tag')).toHaveCount(3);
  await expect(input).not.toHaveAttribute('placeholder');
  await expect(control).toHaveCSS('height','32px');
  await input.fill('Paused');
  await expect(input).toHaveValue('Paused');
  expect((await input.boundingBox())!.width).toBeGreaterThan(70);
  await expect(page.getByRole('option',{name:'Paused',exact:true})).toBeVisible();
  await input.press('Escape');
  await expect(control).toHaveCSS('height','32px');
  for(const name of ['Active','Paused','Archived'])await control.getByRole('button',{name:`Remove ${name}`,exact:true}).click();
  await expect(input).toHaveAttribute('placeholder','Choose values…');
});

test('a controlled host can refuse a property proposal without losing accepted values',async({page})=>{
  const directory=resolve('.artifacts/filter-condition-refusal');await mkdir(directory,{recursive:true});
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll('\\','/'));
  const entry=resolve(directory,'entry.tsx');
  await writeFile(entry,`import React from ${file('node_modules/react/index.js')};import {createRoot} from ${file('node_modules/react-dom/client.js')};import {FloodRoot,FilterCondition} from '@flood-md/react';import '@flood-md/react/styles.css';
    createRoot(document.getElementById('app')).render(<FloodRoot><FilterCondition label="Rule" properties={[{id:'status',label:'Status',options:[{value:'active',label:'Active'}]},{id:'owner',label:'Owner',options:[{value:'maya',label:'Maya'}]}]} value={{property:'status',operator:'is',values:['active']}} onValueChange={next=>{window.proposal=next;}} /></FloodRoot>);`);
  const result=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{write:false,cssCodeSplit:false,lib:{entry,formats:['iife'],name:'FilterRefusal'}}});
  const outputs=(Array.isArray(result)?result:[result]).flatMap(result=>'output' in result?result.output:[]);
  const js=outputs.filter(item=>item.type==='chunk').map(item=>item.type==='chunk'?item.code:'').join('\n');
  const css=outputs.filter(item=>item.type==='asset'&&item.fileName.endsWith('.css')).map(item=>item.type==='asset'?String(item.source):'').join('\n');
  await page.route('**/__filter-refusal.html',route=>route.fulfill({contentType:'text/html',body:`<html><head><style>${css}</style></head><body><div id="app"></div><script>${js.replace(/<\/script/gi,'<\\/script')}</script></body></html>`}));
  await page.goto('/__filter-refusal.html');
  await page.getByRole('combobox',{name:'Rule property',exact:true}).click();
  await page.getByRole('option',{name:'Owner',exact:true}).click();
  expect(await page.evaluate(()=>(window as any).proposal)).toEqual({property:'owner',operator:'is',values:[]});
  await expect(page.getByRole('combobox',{name:'Rule property',exact:true})).toContainText('Status');
  await expect(page.locator('.flood-tag__label')).toHaveText('Active');
});
