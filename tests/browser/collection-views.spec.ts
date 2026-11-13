import {test,expect,type Page,type Locator} from '@playwright/test';
import {chooseSelectOption} from './select-helpers';
import AxeBuilder from '@axe-core/playwright';

const projectKey='flood-project-views-v1';
async function open(page:Page){await page.goto('/playground/collections');await expect(page.getByRole('table',{name:'Projects',exact:true})).toBeVisible();return page.getByRole('region',{name:'Projects collection',exact:true});}
async function openAdvanced(page: Page, scope: Locator) {
  await scope.getByRole('button', { name: 'Filters', exact: true }).click();
  const advanced = page.getByRole('button', { name: 'Advanced conditions', exact: true });
  if (await advanced.isVisible()) await advanced.click();
}
async function action(page:Page,scope:Locator,name:string){const button=scope.getByRole('button',{name,exact:true});if(await button.isVisible())await button.click();else{await scope.getByRole('button',{name:'View actions',exact:true}).click();await page.getByRole('menuitem',{name,exact:true}).click();}}
async function saveAs(page:Page,scope:Locator,name:string){await action(page,scope,'Save as new view');const dialog=page.getByRole('dialog',{name:'Save view',exact:true});await dialog.getByRole('textbox',{name:'View name',exact:false}).fill(name);await dialog.getByRole('button',{name:'Save view',exact:true}).click();await expect(dialog).toBeHidden();}
async function values(page:Page,panel:Locator,index:number,labels:string[]){const input=panel.getByRole('combobox',{name:`Condition ${index} values`,exact:true});await input.click();for(const label of labels)await page.getByRole('option',{name:label,exact:true}).click();await input.press('Escape');await expect(panel).toBeVisible();}
const stored=(search:string)=>JSON.stringify({version:1,views:[{id:'saved-existing',name:'My view',query:{search,match:'all',conditions:[],sort:null}}]});

test('Columns shares the tool row and Filters stays anchored when reset appears', async ({ page }, info) => {
  const scope = await open(page);
  const trigger = scope.getByRole('button', { name: 'Filters', exact: true });
  const clear = scope.getByRole('button', { name: 'Clear filters', exact: true });
  const search = scope.getByRole('searchbox', { name: 'Search projects', exact: true });
  const columns = scope.getByRole('button', { name: 'Columns', exact: true });
  await page.evaluate(() => document.fonts.ready);
  const initial = (await trigger.boundingBox())!;
  const columnsBox = (await columns.boundingBox())!;
  const row = scope.locator('.flood-collection-toolbar__row');
  await expect(row.getByRole('button', { name: 'Columns', exact: true })).toHaveCount(1);
  await expect(columns).toHaveCount(1);
  expect(initial.x + initial.width).toBeLessThan(columnsBox.x);
  expect(initial.y + initial.height / 2).toBeCloseTo(columnsBox.y + columnsBox.height / 2, 0);
  if (info.project.name === 'desktop') {
    const searchBox = (await search.boundingBox())!;
    expect(searchBox.y + searchBox.height / 2).toBeCloseTo(columnsBox.y + columnsBox.height / 2, 0);
  }
  await columns.click();
  await page.getByRole('menuitemcheckbox', { name: 'Owner', exact: true }).click();
  await expect(scope.getByRole('columnheader', { name: 'Sort by Owner' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(columns).toBeFocused();
  await expect(clear).toHaveCount(0);
  await search.fill('Design');
  await expect(clear).toBeVisible();
  const active = (await trigger.boundingBox())!;
  expect(Math.abs(active.x - initial.x)).toBeLessThan(1);
  const reset = (await clear.boundingBox())!;
  expect(reset.x + reset.width).toBeLessThanOrEqual(active.x);
  await clear.press('Enter');
  await expect(trigger).toBeFocused();
  await expect(clear).toHaveCount(0);
  expect(Math.abs((await trigger.boundingBox())!.x - initial.x)).toBeLessThan(1);
});

test('three secondary filters collapse into a staged panel and restore with search and sort', async ({ page }) => {
  const scope = await open(page);
  const table = scope.getByRole('table', { name: 'Projects', exact: true });
  const search = scope.getByRole('searchbox', { name: 'Search projects', exact: true });
  const filters = scope.getByRole('group', { name: 'Projects applied filters', exact: true });
  const trigger = scope.getByRole('button', { name: 'Filters', exact: true });
  await expect(scope.getByRole('button', { name: 'Status', exact: true })).toHaveCount(0);
  await trigger.click();
  const panel = page.getByRole('dialog', { name: 'Projects filters', exact: true });
  await chooseSelectOption(panel.getByRole('combobox', { name: 'Status', exact: true }), 'active');
  await chooseSelectOption(panel.getByRole('combobox', { name: 'Owner', exact: true }), 'maya');
  await expect(table.locator('tbody tr')).toHaveCount(5);
  await panel.getByRole('button', { name: 'Cancel', exact: true }).click();
  await trigger.click();
  await expect(panel.getByRole('combobox', { name: 'Status', exact: true })).toContainText('All');
  await chooseSelectOption(panel.getByRole('combobox', { name: 'Status', exact: true }), 'active');
  await chooseSelectOption(panel.getByRole('combobox', { name: 'Owner', exact: true }), 'maya');
  await panel.getByRole('button', { name: 'Apply filters', exact: true }).click();
  await expect(table.locator('tbody tr')).toHaveCount(2);
  await search.fill('Customer');
  await table.getByRole('button', { name: 'Sort by Project' }).click();
  await expect(table.locator('tbody tr')).toHaveCount(1);
  await saveAs(page, scope, 'Maya active');
  await filters.getByRole('button', { name: 'Remove status filter: Active', exact: true }).press('Enter');
  await expect(trigger).toBeFocused();
  await expect(search).toHaveValue('Customer');
  await expect(filters.getByText('Owner: Maya', { exact: true })).toBeVisible();

  await page.reload();
  await scope.getByRole('combobox', { name: 'Projects view', exact: true }).click();
  await page.getByRole('option', { name: 'Maya active', exact: true }).click();
  await expect(filters.getByText('Status: Active', { exact: true })).toBeVisible();
  await expect(filters.getByText('Owner: Maya', { exact: true })).toBeVisible();
  await expect(table.locator('tbody tr')).toHaveCount(1);
  await expect(table.getByRole('columnheader', { name: /Project/ })).toHaveAttribute('aria-sort', 'ascending');
});

test('conditions have draft/apply/cancel, all/any, exclusion and real removal semantics',async({page})=>{
 const scope=await open(page),table=scope.getByRole('table',{name:'Projects',exact:true});
 await openAdvanced(page, scope);const panel=page.getByRole('dialog',{name:'Projects filters',exact:true});
 await panel.getByRole('button',{name:'Add condition',exact:true}).click();await values(page,panel,1,['Active']);
 await panel.getByRole('button',{name:'Add condition',exact:true}).click();await values(page,panel,2,['Maya']);
 await panel.getByRole('button',{name:'Cancel',exact:true}).click();await expect(table.locator('tbody tr')).toHaveCount(5);await expect(scope.getByText('1–5 of 8',{exact:true})).toBeVisible();
 await openAdvanced(page, scope);await expect(panel.getByRole('combobox')).toHaveCount(0);
 await panel.getByRole('button',{name:'Add condition',exact:true}).click();await values(page,panel,1,['Active']);await panel.getByRole('button',{name:'Add condition',exact:true}).click();await values(page,panel,2,['Maya']);await panel.getByRole('button',{name:'Apply filters',exact:true}).click();
 await expect(table.locator('tbody tr')).toHaveCount(2);await expect(table).toContainText('Design system');await expect(table).toContainText('Customer portal');
 await openAdvanced(page, scope);await panel.getByRole('radio',{name:'Any condition',exact:true}).check();await panel.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(table.locator('tbody tr')).toHaveCount(5);await expect(scope.getByText('Any:',{exact:true})).toBeVisible();
 await scope.getByRole('button',{name:'Remove owner filter',exact:true}).click();await expect(table.locator('tbody tr')).toHaveCount(4);
 await openAdvanced(page, scope);await chooseSelectOption(panel.getByRole('combobox',{name:'Condition 1 operator',exact:true}),'is-not');await panel.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(table.locator('tbody tr')).toHaveCount(4);await expect(table).not.toContainText('Design system');
 await scope.getByRole('button',{name:'Clear filters',exact:true}).click();await expect(scope.getByText('1–5 of 8',{exact:true})).toBeVisible();
});

test('saving preserves row selection; rename does not accidentally save dirty filters; delete removes only the definition',async({page})=>{
 const scope=await open(page),search=scope.getByRole('searchbox',{name:'Search projects',exact:true}),view=scope.getByRole('combobox',{name:'Projects view',exact:true});await search.fill('Design');
 await scope.getByRole('checkbox',{name:'Select Design system',exact:true}).check();await saveAs(page,scope,'Design review');await expect(view).toContainText('Design review');await expect(scope.getByRole('checkbox',{name:'Select Design system',exact:true})).toBeChecked();await expect(view).toBeFocused();
 await search.fill('Checkout');await action(page,scope,'Rename');const rename=page.getByRole('dialog',{name:'Rename view',exact:true});await rename.getByRole('textbox',{name:'View name',exact:false}).fill('Weekly review');await rename.getByRole('button',{name:'Rename view',exact:true}).click();await expect(rename).toBeHidden();await expect(search).toHaveValue('Checkout');
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).views[0].query.search,projectKey)).toBe('Design');
 await action(page,scope,'Update view');expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).views[0].query.search,projectKey)).toBe('Checkout');
 await search.fill('Billing');await action(page,scope,'Reset view');await expect(search).toHaveValue('Checkout');
 await action(page,scope,'Delete view');await page.getByRole('button',{name:'Keep views',exact:true}).click();await expect(view).toContainText('Weekly review');
 await action(page,scope,'Delete view');await page.getByRole('alertdialog').getByRole('button',{name:'Delete view',exact:true}).click();await expect(view).toContainText('All projects');await expect(scope.getByText('1–5 of 8',{exact:true})).toBeVisible();expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).views,projectKey)).toEqual([]);
});

test('refused writes retain the form; cancellation and reset end their scoped errors',async({page})=>{
 const scope=await open(page);await scope.getByRole('searchbox',{name:'Search projects',exact:true}).fill('Design');
 await page.evaluate(key=>{const original=Storage.prototype.setItem;(window as any).allowViewWrites=()=>{Storage.prototype.setItem=original};Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('Denied','SecurityError');original.call(this,k,v);};},projectKey);
 await action(page,scope,'Save as new view');const dialog=page.getByRole('dialog',{name:'Save view',exact:true});await dialog.getByRole('textbox',{name:'View name',exact:false}).fill('Design review');await dialog.getByRole('button',{name:'Save view',exact:true}).click();await expect(dialog.getByText('The view could not be saved. Try again.',{exact:true})).toBeVisible();expect(await page.evaluate(key=>localStorage.getItem(key),projectKey)).toBeNull();
 await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await action(page,scope,'Save as new view');await expect(dialog.getByText('The view could not be saved. Try again.',{exact:true})).toHaveCount(0);await expect(dialog.getByRole('textbox',{name:'View name',exact:false})).toHaveValue('');
 await dialog.getByRole('textbox',{name:'View name',exact:false}).fill('Design review');await page.evaluate(()=>{(window as any).allowViewWrites()});await dialog.getByRole('button',{name:'Save view',exact:true}).click();await expect(dialog).toBeHidden();
 await page.evaluate(key=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw Error('quota');original.call(this,k,v);};},projectKey);
 await scope.getByRole('searchbox',{name:'Search projects',exact:true}).fill('Checkout');await action(page,scope,'Update view');await expect(scope.getByRole('status').filter({hasText:'The view could not be updated. Try again.'})).toBeVisible();await action(page,scope,'Reset view');await expect(scope.getByRole('status').filter({hasText:'The view could not be updated. Try again.'})).toHaveCount(0);await expect(scope.getByRole('searchbox',{name:'Search projects',exact:true})).toHaveValue('Design');
});

test('saved query and sort restore across reload; the second consumer has its own namespace',async({page})=>{
 const projects=await open(page);await page.getByRole('tab',{name:'Files',exact:true}).click();let files=page.getByRole('region',{name:'Files collection',exact:true});
 await chooseSelectOption(files.getByRole('combobox',{name:'Files view',exact:true}),'design');await chooseSelectOption(files.getByRole('combobox',{name:'Sort files',exact:true}),'size:descending');await saveAs(page,files,'Large design assets');
 const fileKey='flood-file-views-v1',id=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).views[0].id,fileKey);await page.reload();await page.getByRole('tab',{name:'Files',exact:true}).click();files=page.getByRole('region',{name:'Files collection',exact:true});await chooseSelectOption(files.getByRole('combobox',{name:'Files view',exact:true}),id);await expect(files.getByRole('list',{name:'Files',exact:true}).locator('li')).toHaveCount(3);await expect(files.getByRole('list',{name:'Files',exact:true}).locator('li').first()).toContainText('Component library.fig');await expect(files.getByRole('combobox',{name:'Sort files',exact:true})).toContainText('Size large–small');
 await page.getByRole('tab',{name:'Projects',exact:true}).click();await projects.getByRole('combobox',{name:'Projects view',exact:true}).click();await expect(page.getByRole('option',{name:'Large design assets',exact:true})).toHaveCount(0);await page.keyboard.press('Escape');
});

test('bad or obsolete definitions preserve raw bytes and block saved-view writes without hiding the collection',async({page})=>{
 const invalid=JSON.parse(stored('Design'));invalid.views[0].query.conditions=[{id:'old',property:'status',operator:['is'],values:['active']}];const raw=JSON.stringify(invalid);
 await page.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:projectKey,raw});const scope=await open(page);await expect(scope.getByText('Saved views could not be read.',{exact:true})).toBeVisible();await expect(scope.getByRole('button',{name:'Save as new view',exact:true})).toBeDisabled();expect(await page.evaluate(key=>localStorage.getItem(key),projectKey)).toBe(raw);await expect(scope.getByRole('table',{name:'Projects',exact:true})).toBeVisible();
 await scope.getByRole('button',{name:'Replace saved views',exact:true}).click();await page.getByRole('button',{name:'Keep views',exact:true}).click();expect(await page.evaluate(key=>localStorage.getItem(key),projectKey)).toBe(raw);
 await scope.getByRole('button',{name:'Replace saved views',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Replace saved views',exact:true}).click();await expect(scope.getByText('Saved views could not be read.',{exact:true})).toHaveCount(0);expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).views,projectKey)).toEqual([]);
});

test('unknown option IDs and duplicate names fail instead of broadening saved filters',async({page})=>{
 const raw=JSON.parse(stored(''));raw.views[0].query.conditions=[{id:'obsolete',property:'status',operator:'is',values:['removed-status']}];await page.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:projectKey,raw:JSON.stringify(raw)});const scope=await open(page);await expect(scope.getByText('Saved views could not be read.',{exact:true})).toBeVisible();
 await page.evaluate(key=>localStorage.removeItem(key),projectKey);await scope.getByRole('button',{name:'Retry saved views',exact:true}).click();await expect(scope.getByText('Saved views could not be read.',{exact:true})).toHaveCount(0);await action(page,scope,'Save as new view');const dialog=page.getByRole('dialog',{name:'Save view',exact:true});await dialog.getByRole('textbox',{name:'View name',exact:false}).fill('all PROJECTS');await dialog.getByRole('button',{name:'Save view',exact:true}).click();await expect(dialog.getByText('A view with this name already exists.',{exact:true})).toBeVisible();
});

test('query changes reset pagination/selection, and cancelled incomplete filters do not change the view',async({page})=>{
 const scope=await open(page);await scope.getByRole('button',{name:'Next page',exact:true}).click();await scope.getByRole('checkbox',{name:'Select Onboarding',exact:true}).check();await scope.getByRole('searchbox',{name:'Search projects',exact:true}).fill('Design');await expect(scope.getByText('1–1 of 1',{exact:true})).toBeVisible();await expect(scope.getByRole('checkbox',{name:'Select Design system',exact:true})).not.toBeChecked();
 await openAdvanced(page, scope);const panel=page.getByRole('dialog',{name:'Projects filters',exact:true});await panel.getByRole('button',{name:'Add condition',exact:true}).click();await panel.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(panel.getByText('Choose a value for each condition.',{exact:true})).toBeVisible();await panel.getByRole('button',{name:'Cancel',exact:true}).click();await expect(scope.getByRole('table',{name:'Projects',exact:true})).toContainText('Design system');
});

test('filters and their nested value popup stay reachable at enlarged text with semantic roles',async({page})=>{
 await page.setViewportSize({width:1280,height:1000});const scope=await open(page);await page.evaluate(()=>document.documentElement.style.fontSize='24px');await openAdvanced(page, scope);const panel=page.getByRole('dialog',{name:'Projects filters',exact:true});await panel.getByRole('button',{name:'Add condition',exact:true}).click();await values(page,panel,1,['Active']);
 await panel.getByRole('button',{name:'Add condition',exact:true}).click();await values(page,panel,2,['Maya']);await panel.getByRole('button',{name:'Add condition',exact:true}).click();await values(page,panel,3,['Urgent']);
 await panel.getByRole('button',{name:'Apply filters',exact:true}).scrollIntoViewIfNeeded();await expect(panel.getByRole('button',{name:'Apply filters',exact:true})).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(1281);expect((await new AxeBuilder({page}).disableRules(['color-contrast']).analyze()).violations).toEqual([]);
 await panel.getByRole('button',{name:'Remove condition 3',exact:true}).click();await expect(panel.getByRole('combobox',{name:'Condition 3 property',exact:true})).toHaveCount(0);
 await panel.getByRole('button',{name:'Cancel',exact:true}).click();await expect(scope.getByRole('button',{name:'Filters',exact:true})).toBeFocused();
});

test('denied storage access is a scoped preferences failure, not an application crash',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Denied','SecurityError');}}));const scope=await open(page);
 await expect(scope.getByText('Saved views could not be read.',{exact:true})).toBeVisible();await expect(scope.getByRole('button',{name:'Export snapshot',exact:true})).toHaveCount(0);await scope.getByRole('searchbox',{name:'Search projects',exact:true}).fill('Design');await expect(scope.getByRole('table',{name:'Projects',exact:true})).toContainText('Design system');expect(errors).toEqual([]);
});

test('a refused delete retains the accepted view and records until a successful retry',async({page})=>{
 await page.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:projectKey,raw:stored('Design')});const scope=await open(page);await chooseSelectOption(scope.getByRole('combobox',{name:'Projects view',exact:true}),'saved-existing');
 await page.evaluate(key=>{const original=Storage.prototype.setItem;(window as any).allowViewWrites=()=>{Storage.prototype.setItem=original};Storage.prototype.setItem=function(k,v){if(k===key)throw Error('denied');original.call(this,k,v);};},projectKey);
 await action(page,scope,'Delete view');await page.getByRole('alertdialog').getByRole('button',{name:'Delete view',exact:true}).click();await expect(scope.getByRole('status').filter({hasText:'The view could not be deleted. Try again.'})).toBeVisible();await expect(scope.getByRole('combobox',{name:'Projects view',exact:true})).toContainText('My view');expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).views.length,projectKey)).toBe(1);
 await page.evaluate(()=>{(window as any).allowViewWrites()});await action(page,scope,'Delete view');await page.getByRole('alertdialog').getByRole('button',{name:'Delete view',exact:true}).click();await expect(scope.getByText('1–5 of 8',{exact:true})).toBeVisible();expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).views,projectKey)).toEqual([]);
});

test('an outside query change abandons an obsolete condition draft',async({page})=>{
 const scope=await open(page);await openAdvanced(page, scope);const panel=page.getByRole('dialog',{name:'Projects filters',exact:true});await panel.getByRole('button',{name:'Add condition',exact:true}).click();await values(page,panel,1,['Archived']);
 await scope.getByRole('searchbox',{name:'Search projects',exact:true}).fill('Design');await expect(panel).toBeHidden();await expect(scope.getByRole('table',{name:'Projects',exact:true})).toContainText('Design system');await openAdvanced(page, scope);await expect(panel.getByRole('combobox')).toHaveCount(0);
});

test('selection exposes bounded commands and can be cleared independently',async({page})=>{
 const scope=await open(page);
 const header=scope.getByRole('table',{name:'Projects'}).locator('thead');
 const headerTop=()=>header.evaluate(node=>node.getBoundingClientRect().top+window.scrollY);
 const before=await headerTop();
 await scope.getByRole('checkbox',{name:'Select Design system',exact:true}).check();
 await scope.getByRole('checkbox',{name:'Select Checkout',exact:true}).check();
 const bar=scope.getByRole('toolbar',{name:'Selected projects',exact:true});
 await expect(bar.getByText('2 selected',{exact:true})).toBeVisible();
 await expect(bar.getByRole('button',{name:'Archive',exact:true})).toBeVisible();
 await expect(scope.locator('.flood-data-table__footer').getByRole('status')).toHaveCount(0);
 expect(await headerTop()).toBeCloseTo(before,0);
 await scope.getByRole('button',{name:'Clear selection',exact:true}).click();
 await expect(bar).toHaveCount(0);
});
