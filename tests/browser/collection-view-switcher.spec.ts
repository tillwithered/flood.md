import {test,expect,type Page} from '@playwright/test';
import {chooseSelectOption} from './select-helpers';

async function open(page:Page){
  await page.goto('/components/collection-view-switcher');
  const view=page.locator('.preview-stage .flood-collection-view-switcher');
  await expect(view).toBeVisible();await page.evaluate(()=>document.fonts.ready);return view;
}

test('view choice uses Select semantics, disabled options and one-action mode reuses Button',async({page})=>{
  const view=await open(page),select=view.getByRole('combobox',{name:'Project view',exact:true});
  const rail=view.getByRole('toolbar');
  expect(Math.abs((await rail.boundingBox())!.height-(await select.boundingBox())!.height)).toBeLessThan(1);
  await chooseSelectOption(select,'active');await expect(select).toContainText('Active projects');
  await select.click();await expect(page.getByRole('option',{name:'Archived projects',exact:true})).toHaveAttribute('aria-disabled','true');
  await page.keyboard.press('Escape');
  await page.getByRole('checkbox',{name:'CollectionViewSwitcher prop editable',exact:true}).uncheck();
  await expect(view.locator('.flood-overflow-actions')).toHaveCount(0);
  await expect(view.getByRole('button',{name:'Save as new view',exact:true})).toBeVisible();
  await page.getByRole('checkbox',{name:'CollectionViewSwitcher prop disabled',exact:true}).check();
  await expect(select).toBeDisabled();
  await expect(view.getByRole('button',{name:'Save as new view',exact:true})).toBeDisabled();
});

test('constrained commands remain reachable through overflow at enlarged text and RTL',async({page})=>{
  const view=await open(page);
  await page.getByRole('checkbox',{name:'CollectionViewSwitcher prop dirty',exact:true}).check();
  await chooseSelectOption(page.getByRole('combobox',{name:'CollectionViewSwitcher prop width',exact:true}),'18rem');
  await page.setViewportSize({width:1280,height:1000});
  await page.evaluate(()=>{document.documentElement.style.fontSize='24px';document.documentElement.dir='rtl';});
  const more=view.getByRole('button',{name:'View actions',exact:true});await expect(more).toBeVisible();
  await more.click();await expect(page.getByRole('menuitem',{name:'Delete view',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');await expect(more).toBeFocused();
  const geometry=await view.evaluate(node=>({width:node.clientWidth,scroll:node.scrollWidth}));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.width+1);
});
