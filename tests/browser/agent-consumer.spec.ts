import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';

test.beforeEach(async ({page}) => {
  const report=JSON.parse(await readFile('.artifacts/agent-consumer/report.json','utf8'));
  expect(report.source).toBe('clean-npm-tarballs');
  const html=await readFile('.artifacts/agent-consumer/index.html','utf8');
  await page.route('**/__agent-consumer',route=>route.fulfill({contentType:'text/html',body:html}));
  await page.goto('/__agent-consumer');
});

test('installed recipe preserves cross-page selection, cancellation and protected rows',async ({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const archive=page.getByRole('button',{name:'Archive projects',exact:true});
  await expect(archive).toBeDisabled();
  await page.getByRole('checkbox',{name:'Select Design system',exact:true}).check();
  await page.getByRole('button',{name:'Next page',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Select Protected project',exact:true})).toBeDisabled();
  await page.getByRole('checkbox',{name:'Select Research',exact:true}).check();
  await expect(page.getByText('2 selected',{exact:true})).toBeVisible();
  await archive.click();
  const dialog=page.getByRole('alertdialog',{name:'Archive selected projects?'});
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:'Keep projects',exact:true}).click();
  await expect(archive).toBeFocused();
  await expect(page.getByText('2 selected',{exact:true})).toBeVisible();
  await archive.click();
  await dialog.getByRole('button',{name:'Archive selected',exact:true}).click();
  await expect(page.getByText('2 projects archived.',{exact:true})).toBeVisible();
  await expect(page.getByText('0 selected',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Select Design system',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});

test('installed composition remains reachable with enlarged narrow RTL content',async ({page},info)=>{
  await page.setViewportSize({width:320,height:900});
  await page.evaluate(()=>{document.documentElement.style.fontSize='24px';document.documentElement.dir='rtl';});
  await expect(page.getByRole('heading',{name:'Projects',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const scroll=page.locator('.flood-data-table .flood-scroll-area');
  await expect(scroll).toHaveCount(1);
  await page.screenshot({path:info.outputPath('agent-consumer-narrow.png'),fullPage:true});
});
