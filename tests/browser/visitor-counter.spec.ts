import {test,expect} from '@playwright/test';

test('footer shows honest totals, preserves browser identity and reflows',async({page})=>{
  const ids:string[]=[];
  await page.route('**/api/visitors',async route=>{if(route.request().method()==='POST')ids.push(route.request().postDataJSON().id);await route.fulfill({json:{total:1234,since:'2026-10-28T00:00:00Z'}});});
  await page.goto('/');
  const footer=page.getByRole('contentinfo');
  await expect(footer).toContainText('1,234 visitors');
  const id=await page.evaluate(()=>localStorage.getItem('flood.visitor.v1'));
  expect(id).toMatch(/^[0-9a-f-]{36}$/);
  await page.reload();await expect(footer).toContainText('1,234 visitors');
  expect(new Set(ids)).toEqual(new Set([id]));
  await page.goto('/components/button');await expect(footer).toContainText('1,234 visitors');
  await expect(footer.getByRole('link',{name:'Privacy'})).toHaveAttribute('href','/docs/privacy');
  await page.setViewportSize({width:320,height:900});await page.evaluate(()=>{document.documentElement.style.fontSize='24px';});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('blocked storage is read only and outages never fabricate a number',async({page})=>{
  await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw Error('Storage blocked');};});
  const methods:string[]=[];
  await page.route('**/api/visitors',async route=>{methods.push(route.request().method());await route.fulfill({json:{total:5,since:'2026-10-28T00:00:00Z'}});});
  await page.goto('/');await expect(page.getByRole('contentinfo')).toContainText('5 visitors');expect(methods).toEqual(['GET']);
  await page.unroute('**/api/visitors');await page.route('**/api/visitors',route=>route.fulfill({status:503,json:{error:'unavailable'}}));
  await page.reload();await expect(page.getByRole('contentinfo')).toContainText('Visitors —');
  await expect(page.getByRole('heading',{level:1})).toContainText('Good interfaces');
});
