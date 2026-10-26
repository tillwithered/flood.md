import {test,expect,type Locator} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const material = (surface:Locator) => surface.evaluate(node=>{const style=getComputedStyle(node);return{fill:style.backgroundColor,border:style.borderTopColor,shadow:style.boxShadow,backdrop:style.backdropFilter,opacity:style.opacity}});
async function expectFloating(surface:Locator){
 await expect(surface).toBeVisible();const paint=await material(surface);
 expect(paint.fill).toBe('rgba(56, 56, 56, 0.88)');expect(paint.border).toBe('rgba(255, 255, 255, 0.07)');expect(paint.backdrop).toContain('blur(16px)');expect(paint.backdrop).toContain('saturate(1.05)');expect(paint.shadow).toContain('rgba(0, 0, 0, 0.1)');expect(paint.shadow).toContain('0px 2px 8px');expect(paint.opacity).toBe('1');
}
test('Select uses light floating paint and active fill while its parent Drawer keeps opaque modal paint',async({page})=>{
 await page.goto('/components/drawer');await page.locator('.preview-stage').getByRole('button',{name:'Open settings',exact:true}).click();const drawer=page.getByRole('dialog',{name:'Project settings',exact:true});await expect(drawer).toBeVisible();expect((await material(drawer)).fill).toBe('rgb(48, 48, 48)');expect((await material(drawer)).backdrop).toBe('none');await drawer.getByRole('combobox',{name:'Visibility',exact:true}).click();const popup=page.locator('.flood-select__menu:popover-open');await expectFloating(popup);const active=popup.locator('[data-active="true"]');await expect(active).toHaveCount(1);expect(await active.evaluate(node=>getComputedStyle(node).backgroundColor)).toBe('rgba(255, 255, 255, 0.06)');expect((await material(drawer)).fill).toBe('rgb(48, 48, 48)');expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});
test('Floating paint has an opaque reduced-transparency fallback and system forced-colors rendering',async({page})=>{
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});await page.goto('/components/select');test.skip(!await page.evaluate(()=>matchMedia('(prefers-reduced-transparency: reduce)').matches),'Chromium does not expose reduced-transparency emulation');await page.locator('.preview-stage').getByRole('combobox',{name:'Project visibility',exact:true}).click();const popup=page.locator('.flood-select__menu:popover-open');await expect(popup).toBeVisible();let paint=await material(popup);expect(paint.fill).toBe('rgb(56, 56, 56)');expect(paint.backdrop).toBe('none');expect(paint.opacity).toBe('1');
 await page.emulateMedia({forcedColors:'active'});paint=await material(popup);const canvas=await page.evaluate(()=>{const probe=document.createElement('span');probe.style.background='Canvas';document.body.append(probe);const result=getComputedStyle(probe).backgroundColor;probe.remove();return result});expect(paint.fill).toBe(canvas);expect(paint.backdrop).toBe('none');expect(paint.shadow).toBe('none');const active=popup.locator('[data-active="true"]');expect(await active.evaluate(node=>getComputedStyle(node).forcedColorAdjust)).toBe('none');await cdp.detach();
});
test('Combobox, Menu and Popover share the same floating material on their actual catalog pages',async({page})=>{
 for(const slug of ['combobox','menu','popover']){
  await page.goto('/components/'+slug);const stage=page.locator('.preview-stage');let popup:Locator;
  if(slug==='combobox'){await stage.getByRole('combobox',{name:'Framework',exact:true}).click();popup=page.locator('.flood-combobox__menu:popover-open');}
  else if(slug==='menu'){await stage.getByRole('button',{name:'Project actions',exact:true}).click();popup=page.getByRole('menu',{name:'Project actions',exact:true});}
  else{await stage.getByRole('button',{name:'Project settings',exact:true}).click();popup=page.getByRole('dialog',{name:'Project settings',exact:true});}
  await expectFloating(popup);expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);await page.keyboard.press('Escape');await expect(popup).not.toBeVisible();
 }
});
