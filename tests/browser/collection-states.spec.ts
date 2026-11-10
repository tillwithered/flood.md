import {test,expect} from '@playwright/test';
import {chooseSelectOption} from './select-helpers';

test('empty filtering keeps table context and reset restores rows plus persistent focus',async({page})=>{
  await page.goto('/playground/collections');
  const scope=page.getByRole('region',{name:'Projects collection',exact:true});
  const search=scope.getByRole('searchbox',{name:'Search projects',exact:true});
  await search.fill('No project can match this');
  const table=scope.getByRole('table',{name:'Projects',exact:true});
  await expect(table).toBeVisible();
  await expect(table.getByRole('columnheader')).toHaveCount(5);
  await expect(table.getByRole('heading',{name:'No matching projects',exact:true})).toBeVisible();
  await expect(table.getByRole('checkbox')).toBeDisabled();
  await table.getByRole('button',{name:'Reset filters',exact:true}).click();
  await expect(search).toHaveValue('');await expect(search).toBeFocused();
  await expect(table.getByText('Design system',{exact:true})).toBeVisible();
});

test('custom empty content is ready-only; loading and error keep their owners and retry restores actual rows',async({page})=>{
  await page.goto('/components/data-table');
  const table=page.locator('.preview-stage .flood-data-table');
  const state=page.getByRole('combobox',{name:'DataTable prop state',exact:true});
  const empty=page.getByRole('checkbox',{name:'DataTable prop emptyRows',exact:true});
  await empty.check();
  await expect(table.getByRole('heading',{name:'No projects yet',exact:true})).toBeVisible();
  await page.getByRole('checkbox',{name:'DataTable prop customEmpty',exact:true}).uncheck();
  await expect(table.getByText('No results found.',{exact:true})).toBeVisible();
  await page.getByRole('checkbox',{name:'DataTable prop customEmpty',exact:true}).check();
  await empty.uncheck();
  await chooseSelectOption(state,'loading');
  await expect(table).toHaveAttribute('aria-busy','true');
  await expect(table.getByRole('heading')).toHaveCount(0);
  await chooseSelectOption(state,'error');
  await expect(table.getByText('Could not load the rows.',{exact:true})).toBeVisible();
  await expect(table.getByRole('heading')).toHaveCount(0);
  await table.getByRole('button',{name:'Try again',exact:true}).click();
  await expect(table.getByText('Design system',{exact:true})).toBeVisible();
  await expect(table.getByText('Could not load the rows.',{exact:true})).toHaveCount(0);
});
