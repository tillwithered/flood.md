import {test,expect,type Page} from '@playwright/test';
import {chooseSelectOption} from './select-helpers';
import {build} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

async function open(page:Page){
  await page.goto('/components/filter-group');
  const group=page.locator('.preview-stage').getByRole('group',{name:'Project conditions',exact:true});
  await expect(group).toBeVisible();await page.evaluate(()=>document.fonts.ready);return group;
}
const ids=(group:ReturnType<Page['locator']>)=>group.locator('[data-filter-condition-id]').evaluateAll(rows=>rows.map(row=>(row as HTMLElement).dataset.filterConditionId));

test('accepted row management preserves IDs and matching, with useful addition/removal focus and a minimal empty state',async({page})=>{
  const group=await open(page),initial=await ids(group);
  await group.getByRole('radio',{name:'Any condition',exact:true}).check();
  const firstRowOffset=()=>group.locator('.flood-filter-condition').first().evaluate(row =>
    row.getBoundingClientRect().top - row.closest('.flood-filter-group')!.getBoundingClientRect().top);
  const initialOffset=await firstRowOffset();
  await group.getByRole('button',{name:'Add condition',exact:true}).click();
  await expect(group.getByRole('combobox',{name:'Condition 3 property',exact:true})).toBeFocused();
  await expect(group.getByRole('combobox',{name:'Condition 3 property',exact:true})).toContainText('Priority');
  const added=await ids(group);expect(added.slice(0,2)).toEqual(initial);
  expect(await firstRowOffset()).toBeCloseTo(initialOffset,0);
  await expect(group.getByRole('button',{name:'Add condition',exact:true})).toBeDisabled();
  await group.getByRole('button',{name:'Remove condition 2',exact:true}).click();
  await expect(group.getByRole('combobox',{name:'Condition 2 property',exact:true})).toBeFocused();
  expect(await ids(group)).toEqual([initial[0],added[2]]);
  await expect(group.getByRole('radio',{name:'Any condition',exact:true})).toBeChecked();
  await group.getByRole('button',{name:'Remove condition 2',exact:true}).click();
  await expect(group.getByRole('combobox',{name:'Condition 1 property',exact:true})).toBeFocused();
  await expect(group.getByRole('radiogroup')).toHaveCount(0);
  await group.getByRole('button',{name:'Remove condition 1',exact:true}).click();
  await expect(group.getByRole('button',{name:'Add condition',exact:true})).toBeFocused();
  await expect(group.locator('.flood-filter-condition')).toHaveCount(0);
  await expect(group.getByRole('button')).toHaveCount(1);
  await group.getByRole('button',{name:'Add condition',exact:true}).click();
  expect((await ids(group))[0]).not.toBe(added[2]);
  await expect(group.getByRole('combobox',{name:'Condition 1 property',exact:true})).toBeFocused();
  await group.getByRole('button',{name:'Add condition',exact:true}).click();
  await expect(group.getByRole('radio',{name:'Any condition',exact:true})).toBeChecked();
});

test('duplicate and addition limits prevent new choices without discarding accepted rows; disabled blocks every edit',async({page})=>{
  const group=await open(page);
  await group.getByRole('combobox',{name:'Condition 1 property',exact:true}).click();
  await expect(page.getByRole('option',{name:'Owner',exact:true})).toHaveAttribute('aria-disabled','true');
  await page.keyboard.press('Escape');
  await page.getByRole('checkbox',{name:'FilterGroup prop allowDuplicateProperties',exact:true}).check();
  await group.getByRole('button',{name:'Add condition',exact:true}).click();
  await expect(group.getByRole('combobox',{name:'Condition 3 property',exact:true})).toContainText('Status');
  await page.getByRole('checkbox',{name:'FilterGroup prop allowDuplicateProperties',exact:true}).uncheck();
  await chooseSelectOption(page.getByRole('combobox',{name:'FilterGroup prop maxConditions',exact:true}),'2');
  await expect(group.locator('.flood-filter-condition')).toHaveCount(3);
  await expect(group.getByRole('button',{name:'Add condition',exact:true})).toBeDisabled();
  await page.getByRole('checkbox',{name:'FilterGroup prop disabled',exact:true}).check();
  for(const control of await group.getByRole('combobox').all())await expect(control).toBeDisabled();
  for(const control of await group.getByRole('radio').all())await expect(control).toBeDisabled();
  for(const control of await group.getByRole('button').all())await expect(control).toBeDisabled();
});

test('narrow enlarged RTL group preserves readable tracks and action reachability',async({page})=>{
  const group=await open(page);
  await chooseSelectOption(page.getByRole('combobox',{name:'FilterGroup prop width',exact:true}),'26rem');
  await page.evaluate(()=>{document.documentElement.style.fontSize='24px';document.documentElement.dir='rtl';});
  const geometry=await group.evaluate(node=>({width:node.clientWidth,scroll:node.scrollWidth,rows:Array.from(node.querySelectorAll('.flood-filter-condition')).map(row=>({width:row.clientWidth,scroll:row.scrollWidth}))}));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.width+1);
  for(const row of geometry.rows)expect(row.scroll).toBeLessThanOrEqual(row.width+1);
  await group.getByRole('button',{name:'Remove condition 1',exact:true}).click();
  await expect(group.getByRole('combobox',{name:'Condition 1 property',exact:true})).toBeFocused();
});

test('controlled refusal preserves rows and focus; delayed acceptance does not steal an unrelated focus target',async({page})=>{
  const directory=resolve('.artifacts/filter-group-controlled');await mkdir(directory,{recursive:true});
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll('\\','/'));
  const entry=resolve(directory,'entry.tsx');
  await writeFile(entry,`import React,{useState} from ${file('node_modules/react/index.js')};import {createRoot} from ${file('node_modules/react-dom/client.js')};import {FloodRoot,FilterGroup,Button} from '@flood-md/react';import '@flood-md/react/styles.css';
    const initial={match:'all',conditions:[{id:'first',property:'status',operator:'is',values:['active']}]};window.refuse=true;
    function App(){const [value,setValue]=useState(initial);window.accept=()=>setValue(window.proposal);return <FloodRoot><FilterGroup label="Rules" properties={[{id:'status',label:'Status',options:[{value:'active',label:'Active'}]},{id:'owner',label:'Owner',options:[{value:'maya',label:'Maya'}]}]} value={value} onValueChange={next=>{window.proposal=next;if(!window.refuse)setValue(next);}}/><Button>Elsewhere</Button></FloodRoot>;}createRoot(document.getElementById('app')).render(<App/>);`);
  const result=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{write:false,cssCodeSplit:false,lib:{entry,formats:['iife'],name:'GroupControlled'}}});
  const outputs=(Array.isArray(result)?result:[result]).flatMap(result=>'output' in result?result.output:[]);
  const js=outputs.filter(item=>item.type==='chunk').map(item=>item.type==='chunk'?item.code:'').join('\n');
  const css=outputs.filter(item=>item.type==='asset'&&item.fileName.endsWith('.css')).map(item=>item.type==='asset'?String(item.source):'').join('\n');
  await page.route('**/__filter-group.html',route=>route.fulfill({contentType:'text/html',body:`<html><head><style>${css}</style></head><body><div id="app"></div><script>${js.replace(/<\/script/gi,'<\\/script')}</script></body></html>`}));
  await page.goto('/__filter-group.html');
  const group=page.getByRole('group',{name:'Rules',exact:true}),add=group.getByRole('button',{name:'Add condition',exact:true});
  await add.focus();await add.press('Enter');
  await expect(group.locator('.flood-filter-condition')).toHaveCount(1);
  await expect(add).toBeFocused();
  expect(await page.evaluate(()=>(window as any).proposal.conditions[1])).toMatchObject({property:'owner',operator:'is',values:[]});
  await page.getByRole('button',{name:'Elsewhere',exact:true}).focus();
  await page.evaluate(()=>(window as any).accept());
  await expect(group.locator('.flood-filter-condition')).toHaveCount(2);
  await expect(page.getByRole('button',{name:'Elsewhere',exact:true})).toBeFocused();
  const remove=group.getByRole('button',{name:'Remove condition 1',exact:true});
  await remove.focus();await remove.press('Enter');await expect(group.locator('.flood-filter-condition')).toHaveCount(2);await expect(remove).toBeFocused();
  await page.evaluate(()=>(window as any).accept());
  await expect(group.locator('.flood-filter-condition')).toHaveCount(1);
  expect(await ids(group)).toEqual([await page.evaluate(()=>(window as any).proposal.conditions[0].id)]);
  await expect(group.getByRole('combobox',{name:'Condition 1 property',exact:true})).toBeFocused();
});
