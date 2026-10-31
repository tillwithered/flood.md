import {test,expect,type Page} from '@playwright/test';
import {build} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import AxeBuilder from '@axe-core/playwright';
let bundled:Promise<string>;
async function fixture(){
 const file=(name:string)=>JSON.stringify(resolve(name).replaceAll('\\','/'));
 const directory=resolve(`.artifacts/base-capabilities-${process.pid}`);await mkdir(directory,{recursive:true});
 const entry=resolve(directory,'entry.mjs');
 await writeFile(entry,`import React,{useState,StrictMode}from ${file('node_modules/react/index.js')};
import{createRoot}from ${file('node_modules/react-dom/client.js')};
import{FloodRoot,Field,Autocomplete,Combobox,MultiSelect,DataTable,OverflowActions,Menubar,DatePicker,DateRangePicker,TimePicker,DateTimePicker,DateTimeRangePicker,Button}from ${file('packages/react/dist/index.js')};
import ${file('packages/react/dist/styles.css')};const h=React.createElement;
const dateLabels={calendarLabel:'Календарь',openCalendarLabel:'Выбрать дату',previousMonthLabel:'Прошлый месяц',nextMonthLabel:'Следующий месяц',viewLabels:{month:'Выбрать месяц',year:'Выбрать год',previous:'Прошлый период',next:'Следующий период'}};
const timeLabels={panelLabel:'Время',openTimeLabel:'Выбрать время'};
const menuItems=[{id:'new',label:'New document'},{id:'export',type:'submenu',label:'Export',items:[{id:'pdf',label:'PDF'},{id:'text',label:'Text'}]}];
function App(){const [submitted,S]=useState(''),[query,Q]=useState(''),[resultsFor,R]=useState(''),[load,L]=useState('ready'),[selected,V]=useState('saved'),[selectionOptions,SO]=useState([{value:'saved',label:'Saved record'}]),[requests,REQ]=useState([]),[selection,SEL]=useState(['elsewhere','row3']),[action,A]=useState('');
const options=[{value:'result-'+resultsFor,label:'Result '+resultsFor,group:'Results'}];
return h(FloodRoot,{style:{padding:'2rem'}},h('h1',null,'Base capability checks'),
h('section',{'aria-label':'Localization'},h(DatePicker,{...dateLabels,id:'date',label:'Дата',locale:'ru-RU',defaultValue:'2026-10-26'}),h(DateRangePicker,{...dateLabels,id:'range',label:'Период',locale:'ru-RU',defaultValue:{start:'2026-10-26',end:'2026-10-28'}}),h(TimePicker,{...timeLabels,id:'time',label:'Время начала',defaultValue:'09:00'}),h(DateTimePicker,{id:'date-time',label:'Встреча',dateLabel:'Дата встречи',timeLabel:'Время встречи',datePickerLabels:dateLabels,timePickerLabels:timeLabels,locale:'ru-RU'}),h(DateTimeRangePicker,{id:'date-time-range',label:'Расписание',startDatePickerLabels:dateLabels,endDatePickerLabels:dateLabels,startTimePickerLabels:timeLabels,endTimePickerLabels:timeLabels,locale:'ru-RU'})),
h('form',{id:'free',onSubmit:e=>{e.preventDefault();S(JSON.stringify([...new FormData(e.currentTarget)]));}},h(Field,{id:'free-text',label:'Team'},p=>h(Autocomplete,{...p,name:'team',required:true,options:[{value:'eng',label:'Engineering',group:'Product'},{value:'ops',label:'Operations',group:'Business'}]})),h(Button,{type:'submit'},'Submit team'),h(Button,{type:'reset'},'Reset team')),h('output',{id:'submitted'},submitted),h('form',{id:'readonly-free'},h(Field,{label:'Locked text'},p=>h(Autocomplete,{...p,name:'locked',value:'Original',onValueChange:t=>A(t),options:[{value:'alternative',label:'Alternative'}]})),h(Field,{label:'Read only text'},p=>h(Autocomplete,{...p,name:'read-only',defaultValue:'Kept',readOnly:true,options:[]}))),h('form',{id:'remote-multiple'},h(Field,{label:'Remote teams'},p=>h(MultiSelect,{...p,name:'teams',value:['kept'],selectedOptions:[{value:'kept',label:'Retained team'}],query:'',onQueryChange:()=>{},filtering:'manual',optionsQuery:'',options:[{value:'new',label:'New team'}],onValueChange:ids=>A(JSON.stringify(ids))}))),
h(Field,{id:'remote',label:'Remote record'},p=>h(Combobox,{...p,name:'record',value:selected,onValueChange:id=>{V(id);SO(options.filter(o=>o.value===id));},selectedOptions:selectionOptions,query,onQueryChange:Q,filtering:'manual',optionsQuery:resultsFor,options,loadState:load,onRetry:()=>{L('loading');REQ(r=>[...r,'retry']);}})),
h(Button,{onClick:()=>R('late')},'Deliver old results'),h(Button,{onClick:()=>{R(query);L('ready');}},'Deliver current results'),h(Button,{onClick:()=>{R(query);L('error');}},'Fail search'),
h(DataTable,{id:'server',caption:'Remote projects',paginationMode:'server',totalRows:6,page:2,pageSize:2,onPageChange:p=>REQ(r=>[...r,'page:'+p]),sort:null,onSortChange:s=>REQ(r=>[...r,'sort:'+s?.direction]),selectable:true,selectionScope:'dataset',selectedIds:selection,onSelectionChange:SEL,columns:[{id:'name',label:'Project',sortable:true},{id:'state',label:'State'}],rows:[{id:'row3',label:'Project E',cells:{name:'Project E',state:'Active'}},{id:'row4',label:'Project D',cells:{name:'Project D',state:'Draft'}}]}),
h('output',{id:'requests'},JSON.stringify(requests)),h('output',{id:'selection'},JSON.stringify(selection)),
h('div',{id:'adaptive',style:{width:'60rem',maxWidth:'100%'}},h(OverflowActions,{label:'Document actions',items:[{id:'save',label:'Save',priority:10},{id:'duplicate',label:'Duplicate'},{id:'archive',label:'Archive'},{id:'delete',label:'Delete',tone:'danger'}],onAction:A})),h('output',{id:'action'},action),
h(Button,{id:'before'},'Before menus'),h(Menubar,{id:'menubar',label:'Editor commands',menus:[{id:'file',label:'File',items:menuItems},{id:'disabled',label:'Disabled',disabled:true,items:[{id:'disabled-action',label:'Disabled action'}]},{id:'edit',label:'Edit',items:[{id:'undo',label:'Undo'},{id:'redo',label:'Redo',disabled:true}]}],onAction:(menu,id)=>A(menu+':'+id)}),h(Button,{id:'after'},'After menus'));
}createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
 const result=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{write:false,cssCodeSplit:false,lib:{entry,formats:['iife'],name:'BaseCapabilities'}}});
 const output=Array.isArray(result)?result[0].output:result.output;
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Capabilities</title><style>'+output.filter(x=>x.type==='asset'&&x.fileName.endsWith('.css')).map(x=>(x as any).source).join('')+'</style></head><body><main id="app"></main><script>'+output.filter(x=>x.type==='chunk').map(x=>(x as any).code).join('')+'</script></body></html>';
}
async function open(page:Page){bundled??=fixture();await page.route('**/__base-capabilities',async r=>r.fulfill({contentType:'text/html',body:await bundled}));await page.goto('/__base-capabilities');await expect(page.getByRole('heading',{name:'Base capability checks'})).toBeVisible();}

test('calendar and clock labels pass through every composed picker',async({page})=>{
 await open(page);
 for(const id of ['date','range','date-time','date-time-range']){
  const root=page.locator('#'+id),trigger=root.getByRole('button',{name:'Выбрать дату',exact:true}).first();await trigger.click();
  const panel=page.getByRole('dialog',{name:'Календарь',exact:true});await expect(panel).toBeVisible();
  await expect(panel.getByRole('button',{name:/^Выбрать месяц:/})).toBeVisible();
  await panel.getByRole('button',{name:/^Выбрать год:/}).click();
  await expect(panel.getByRole('button',{name:/^Прошлый период/})).toBeVisible();
  await page.keyboard.press('Escape');if(await panel.isVisible())await page.keyboard.press('Escape');await expect(panel).toBeHidden();await expect(trigger).toBeFocused();
 }
 for(const id of ['time','date-time','date-time-range']){
  await page.locator('#'+id).getByRole('button',{name:'Выбрать время',exact:true}).first().click();
  const panel=page.getByRole('dialog',{name:'Время',exact:true});await expect(panel).toBeVisible();
  await page.keyboard.press('Escape');await expect(panel).toBeHidden();
 }
});
test('Autocomplete accepts arbitrary text, submits once, selects suggestions and resets',async({page})=>{
 await open(page);const input=page.getByRole('combobox',{name:'Team',exact:true});await input.fill('Independent team');await input.press('Enter');
 await expect(page.locator('#submitted')).toHaveText('[["team","Independent team"]]');
 await input.fill('Eng');await input.press('ArrowDown');await input.press('Enter');await expect(input).toHaveValue('Engineering');
 await page.getByRole('button',{name:'Submit team',exact:true}).click();await expect(page.locator('#submitted')).toHaveText('[["team","Engineering"]]');
 await page.getByRole('button',{name:'Reset team',exact:true}).click();await expect(input).toHaveValue('');
});
test('manual search rejects late results, retains selected records and offers a keyboard retry',async({page})=>{
 await open(page);const input=page.getByRole('combobox',{name:'Remote record',exact:true});await expect(input).toHaveValue('Saved record');
 await input.fill('new');await expect(page.getByRole('option',{name:'Loading options…'})).toBeVisible();
 await input.press('Escape');await page.getByRole('button',{name:'Deliver old results',exact:true}).click();await input.click();await expect(page.getByRole('option',{name:'Loading options…'})).toBeVisible();
 await input.press('Enter');await expect(input).toHaveValue('Saved record');
 await input.fill('new');await input.press('Escape');await page.getByRole('button',{name:'Fail search',exact:true}).click();await input.click();
 await input.press('Tab');const retry=page.getByRole('button',{name:'Try again',exact:true});await expect(retry).toBeFocused();await retry.press('Enter');await expect(input).toBeFocused();
 await expect(page.locator('#requests')).toContainText('retry');
 await input.press('Escape');await page.getByRole('button',{name:'Deliver current results',exact:true}).click();await input.click();await input.press('ArrowDown');await input.press('Enter');await expect(input).toHaveValue('Result new');
});
test('server table never slices or sorts the supplied page and preserves dataset selection',async({page})=>{
 await open(page);const table=page.getByRole('table',{name:'Remote projects',exact:true});
 await expect(table.locator('tbody tr')).toHaveCount(2);await expect(table.locator('tbody tr').first()).toContainText('Project E');await expect(page.locator('#server')).toContainText('3–4 of 6');
 await table.getByRole('button',{name:'Sort by Project',exact:true}).click();await expect(table.locator('tbody tr').first()).toContainText('Project E');await expect(page.locator('#requests')).toContainText('sort:ascending');await expect(table.locator('[aria-sort]')).toHaveCount(0);
 await table.getByRole('checkbox',{name:'Select rows on this page',exact:true}).check();await expect(page.locator('#selection')).toHaveText('["elsewhere","row3","row4"]');
 await page.locator('#server').getByRole('button',{name:'Next page',exact:true}).click();await expect(page.locator('#requests')).toContainText('page:3');await expect(page.locator('#server')).toContainText('3–4 of 6');
});
test('priority overflow preserves actions, disabled state and focus across resize',async({page})=>{
 await open(page);const root=page.locator('#adaptive'),archive=root.getByRole('button',{name:'Archive',exact:true});await archive.focus();
 await root.evaluate(node=>{node.style.width='13rem';});const more=root.getByRole('button',{name:'More actions',exact:true});await expect(more).toBeVisible();await expect(more).toBeFocused();
 await more.click();await page.getByRole('menuitem',{name:'Archive',exact:true}).click();await expect(page.locator('#action')).toHaveText('archive');
 await root.evaluate(node=>{node.style.width='60rem';});await expect(more).toHaveCount(0);await expect(root.getByRole('button',{name:'Save',exact:true})).toBeVisible();
 await page.evaluate(()=>{document.documentElement.style.fontSize='24px';});await root.evaluate(node=>{node.style.width='18rem';});await expect(root.getByRole('button',{name:'More actions',exact:true})).toBeVisible();
});
test('Menubar skips disabled triggers, coordinates arrows, keeps submenus and exits with Tab',async({page})=>{
 await open(page);const bar=page.getByRole('menubar',{name:'Editor commands',exact:true});const file=bar.getByRole('menuitem',{name:'File',exact:true});await file.focus();await file.press('ArrowDown');
 await expect(page.getByRole('menuitem',{name:'New document',exact:true})).toBeFocused();await page.keyboard.press('ArrowRight');await expect(page.getByRole('menuitem',{name:'Undo',exact:true})).toBeFocused();
 await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowDown');await expect(page.getByRole('menuitem',{name:'Export',exact:true})).toBeFocused();await page.keyboard.press('ArrowRight');
 await expect(page.getByRole('menuitem',{name:'PDF',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(page.getByRole('menuitem',{name:'Export',exact:true})).toBeFocused();
 await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'After menus',exact:true})).toBeFocused();await expect(page.getByRole('menu',{name:'File',exact:true})).toBeHidden();
});
test('new controls retain usable names and semantic roles',async({page})=>{
 await open(page);expect((await new AxeBuilder({page}).disableRules(['color-contrast']).analyze()).violations).toEqual([]);
 await page.getByRole('combobox',{name:'Team',exact:true}).click();expect((await new AxeBuilder({page}).disableRules(['color-contrast']).analyze()).violations).toEqual([]);await page.keyboard.press('Escape');
 await page.getByRole('menubar',{name:'Editor commands',exact:true}).getByRole('menuitem',{name:'File',exact:true}).click();expect((await new AxeBuilder({page}).disableRules(['color-contrast']).analyze()).violations).toEqual([]);
});
test('Menubar exits nested commands backwards and reverses arrows in RTL',async({page})=>{
 await open(page);const bar=page.getByRole('menubar',{name:'Editor commands',exact:true}),file=bar.getByRole('menuitem',{name:'File',exact:true});
 await file.focus();await file.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowRight');await expect(page.getByRole('menuitem',{name:'PDF',exact:true})).toBeFocused();
 await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'Before menus',exact:true})).toBeFocused();await expect(page.getByRole('menu',{name:'File',exact:true})).toBeHidden();
 await bar.evaluate(node=>{node.dir='rtl'});await file.focus();await file.press('ArrowLeft');await expect(bar.getByRole('menuitem',{name:'Edit',exact:true})).toBeFocused();
});
test('free text respects controlled refusal and readonly, remote multiple selection retains IDs',async({page})=>{
 await open(page);const locked=page.getByRole('combobox',{name:'Locked text',exact:true});await locked.fill('Changed');await expect(locked).toHaveValue('Original');await locked.press('Escape');
 const readonly=page.getByRole('combobox',{name:'Read only text',exact:true});await readonly.click();await expect(readonly).toHaveAttribute('aria-expanded','false');expect(await readonly.evaluate((node:HTMLInputElement)=>node.readOnly)).toBe(true);
 expect(await page.locator('#readonly-free').evaluate(node=>[...new FormData(node as HTMLFormElement)])).toEqual([['locked','Original'],['read-only','Kept']]);
 const multi=page.getByRole('combobox',{name:'Remote teams',exact:true});expect(await page.locator('#remote-multiple').evaluate(node=>[...new FormData(node as HTMLFormElement)])).toEqual([['teams','kept']]);
 await multi.click();await multi.press('ArrowDown');await multi.press('Enter');await expect(page.locator('#action')).toHaveText('["kept","new"]');
 expect(await page.locator('#remote-multiple').evaluate(node=>[...new FormData(node as HTMLFormElement)])).toEqual([['teams','kept']]);
});
