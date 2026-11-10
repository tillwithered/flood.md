import {test,expect,type Page} from '@playwright/test';
import {chooseSelectOption} from './select-helpers';

async function open(page:Page){
  await page.goto('/components/collection-toolbar');
  const bar=page.locator('.preview-stage').getByRole('group',{name:'Project collection',exact:true});
  await expect(bar).toBeVisible();await page.evaluate(()=>document.fonts.ready);return bar;
}

test('search, accepted summaries and reserved reset retain a persistent focus/anchor',async({page})=>{
  const bar=await open(page),filters=bar.getByRole('button',{name:'Filters',exact:true});
  const x=(await filters.boundingBox())!.x;
  await bar.getByRole('searchbox',{name:'Search projects',exact:true}).fill('Checkout');
  await bar.getByRole('button',{name:'Remove Status: Active',exact:true}).click();
  await expect(filters).toBeFocused();
  await expect(bar.getByRole('button',{name:'Remove Owner: Maya',exact:true})).toBeVisible();
  await bar.getByRole('button',{name:'Clear filters',exact:true}).click();
  await expect(filters).toBeFocused();
  await expect(bar.getByRole('searchbox')).toHaveValue('');
  await expect(bar.getByRole('group',{name:'Applied filters',exact:true})).toHaveCount(0);
  await expect(bar.getByRole('button',{name:'Clear filters',exact:true})).toHaveCount(0);
  expect(Math.abs((await filters.boundingBox())!.x-x)).toBeLessThan(1);
  await bar.getByRole('searchbox').fill('Again');
  expect(Math.abs((await filters.boundingBox())!.x-x)).toBeLessThan(1);
});

test('panel edits remain drafts until Apply, Cancel restores accepted conditions and any-match is explicit',async({page})=>{
  const bar=await open(page),filters=bar.getByRole('button',{name:'Filters',exact:true});
  await filters.click();
  let panel=page.getByRole('dialog',{name:'Project filters',exact:true});
  await panel.getByRole('button',{name:'Remove condition 1',exact:true}).click();
  await panel.getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(bar.getByRole('button',{name:'Remove Status: Active',exact:true})).toBeVisible();
  await filters.click();
  panel=page.getByRole('dialog',{name:'Project filters',exact:true});
  await expect(panel.locator('.flood-filter-condition')).toHaveCount(2);
  await panel.getByRole('radio',{name:'Any condition',exact:true}).check();
  await panel.getByRole('button',{name:'Apply filters',exact:true}).click();
  await expect(bar.getByText('Any:',{exact:true})).toBeVisible();
  await expect(filters).toBeFocused();
});

test('without a panel, removal and reset focus search; disabled blocks the whole query group',async({page})=>{
  const bar=await open(page);
  await page.getByRole('checkbox',{name:'CollectionToolbar prop showFilters',exact:true}).uncheck();
  await bar.getByRole('button',{name:'Remove Status: Active',exact:true}).click();
  await expect(bar.getByRole('searchbox')).toBeFocused();
  await bar.getByRole('button',{name:'Clear filters',exact:true}).click();
  await expect(bar.getByRole('searchbox')).toBeFocused();
  await page.getByRole('checkbox',{name:'CollectionToolbar prop showFilters',exact:true}).check();
  await page.getByRole('checkbox',{name:'CollectionToolbar prop disabled',exact:true}).check();
  await expect(bar.getByRole('searchbox')).toBeDisabled();
  await expect(bar.getByRole('button',{name:'Filters',exact:true})).toBeDisabled();
});

test('narrow enlarged RTL layout preserves reachability without trapping text-input arrows',async({page})=>{
  const bar=await open(page);
  await chooseSelectOption(page.getByRole('combobox',{name:'CollectionToolbar prop width',exact:true}),'24rem');
  await page.evaluate(()=>{document.documentElement.style.fontSize='24px';document.documentElement.dir='rtl';});
  const search=bar.getByRole('searchbox');await search.fill('query');await search.press('ArrowLeft');
  await expect(search).toBeFocused();
  const geometry=await bar.evaluate(node=>({width:node.clientWidth,scroll:node.scrollWidth}));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.width+1);
  await bar.getByRole('button',{name:'Filters',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Project filters',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(bar.getByRole('button',{name:'Filters',exact:true})).toBeFocused();
});
