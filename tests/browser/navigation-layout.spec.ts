import {test,expect} from '@playwright/test';

async function choose(page:any,component:string,prop:string,value:string){
 await page.getByRole('combobox',{name:`${component} prop ${prop}`,exact:true}).click();
 await page.getByRole('option',{name:value,exact:true}).click();
}

test('NavigationList catalog keeps grouped native links and explicit current-page state',async({page})=>{
 await page.goto('/components/navigation-list');const stage=page.locator('.preview-stage'),nav=stage.getByRole('navigation',{name:'Project navigation'});
 await expect(nav.getByRole('link')).toHaveCount(3);await expect(nav.locator('[aria-current=page]')).toHaveText('Overview');await expect(nav.locator('ul[aria-labelledby]')).toHaveCount(2);
 await choose(page,'NavigationList','currentValue','settings');await expect(nav.locator('[aria-current=page]')).toHaveText('Settings');await expect(nav.getByRole('link',{name:'Settings',exact:true})).toHaveAttribute('href','#settings');
 await page.evaluate(()=>document.documentElement.dir='rtl');expect(await nav.evaluate(node=>getComputedStyle(node).direction)).toBe('rtl');await nav.getByRole('link',{name:'Activity',exact:true}).focus();await expect(nav.getByRole('link',{name:'Activity',exact:true})).toBeFocused();
});

test('Steps requests host navigation without pretending to be tabs or changing current value',async({page})=>{
 await page.goto('/components/steps');const stage=page.locator('.preview-stage');await expect(stage.locator('ol[aria-label="Project setup"]')).toBeVisible();await expect(stage.locator('[aria-current=step]')).toContainText('Access');await expect(stage.getByRole('button')).toHaveCount(0);
 await page.getByRole('checkbox',{name:'Steps prop interactive',exact:true}).check();await stage.getByRole('button',{name:/Review/}).click();await expect(stage.getByRole('status')).toHaveText('Step requested: review');await expect(stage.locator('[aria-current=step]')).toContainText('Access');await expect(stage.getByRole('tab')).toHaveCount(0);
 await page.getByRole('checkbox',{name:'Steps prop disableLast',exact:true}).check();await expect(stage.getByRole('button',{name:/Review/})).toBeDisabled();await page.getByRole('checkbox',{name:'Steps prop error',exact:true}).check();await expect(stage.locator('[data-state=error]')).toContainText('Needs attention');
});

test('Split collapses within its own container and retains logical DOM order',async({page})=>{
 await page.goto('/components/split');const stage=page.locator('.preview-stage'),layout=stage.locator('.flood-split__layout');await choose(page,'Split','collapseAt','never');
 let columns=await layout.evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').filter(Boolean));expect(columns).toHaveLength(2);await choose(page,'Split','side','start');expect(await layout.locator(':scope > :first-child').getAttribute('class')).toBe('flood-split__aside');
 await choose(page,'Split','collapseAt','md');await page.setViewportSize({width:390,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='24px');columns=await layout.evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').filter(Boolean));expect(columns).toHaveLength(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('SkipLink is revealed by focus and transfers keyboard focus to the fragment target',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/components/skip-link');const stage=page.locator('.preview-stage'),link=page.getByRole('link',{name:'Skip to example content',exact:true});
 expect(await link.evaluate(node=>getComputedStyle(node).clipPath)).toBe('inset(50%)');await stage.getByRole('button',{name:'Focus skip link',exact:true}).click();await expect(link).toBeFocused();expect(await link.evaluate(node=>getComputedStyle(node).clipPath)).toBe('none');await link.press('Enter');await expect(page.locator('#skip-link-example-content')).toBeFocused();await expect(page).toHaveURL(/#skip-link-example-content$/);
});
