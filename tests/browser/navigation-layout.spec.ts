import {test,expect} from '@playwright/test';

test('AppTopBar border has no effect on header or breadcrumb geometry', async ({page}) => {
 await page.goto('/components/app-top-bar');
 const bar=page.locator('.preview-stage .flood-app-top-bar');
 const measure=()=>bar.evaluate(node=>{
  const box=node.getBoundingClientRect();
  const crumb=node.querySelector('.flood-breadcrumb')!.getBoundingClientRect();
  return {height:box.height, crumbTop:crumb.top-box.top, crumbHeight:crumb.height};
 });
 await expect(bar).toBeVisible();
 await page.evaluate(()=>document.fonts.ready);
 const before=await measure();
 await page.getByRole('checkbox',{name:'AppTopBar prop bordered',exact:true}).check();
 await expect(bar).toHaveAttribute('data-bordered','true');
 expect(await measure()).toEqual(before);
});

test('large component pages open directly in the studio with catalog and API controls', async ({page}) => {
 await page.setViewportSize({width:1440,height:950});
 await page.goto('/components/app-shell');
 const preview=page.getByRole('region',{name:'Preview canvas',exact:true});
 await expect(preview.locator('.flood-app-shell')).toBeVisible();
 const documentHeight=()=>page.evaluate(()=>document.documentElement.scrollHeight);
 const originalHeight=await documentHeight();
 expect(originalHeight).toBe(950);
 const catalog=page.getByRole('complementary',{name:'Component navigation',exact:true});
 await expect(catalog.getByRole('searchbox',{name:'Search components'})).toBeVisible();
 const sidebarBox=(await catalog.boundingBox())!;
 const canvasBox=(await preview.boundingBox())!;
 expect(canvasBox.x).toBeGreaterThan(sidebarBox.x+sidebarBox.width);
 await page.getByRole('checkbox',{name:'AppShell prop showFooter',exact:true}).check();
 await expect(preview.getByText('All changes saved',{exact:true})).toBeVisible();
 const reference=page.getByRole('button',{name:'Reference Alt R',exact:true});
 await page.keyboard.press("Alt+r");
 await expect(page.getByRole('dialog',{name:'Component reference',exact:true}).getByRole('heading',{name:'API reference'})).toBeVisible();
 expect(await documentHeight()).toBe(originalHeight);
 await page.keyboard.press('Escape');
 await expect(reference).toBeFocused();
 await expect(page.getByRole('dialog',{name:'Component reference',exact:true})).toHaveCount(0);
 await page.goto('/components/app-shell#api');
 const deepLink=page.getByRole('dialog',{name:'Component reference',exact:true});
 await expect(deepLink.getByRole('heading',{name:'API reference'})).toBeVisible();
 await expect(deepLink.getByRole('heading',{name:'API reference'})).toBeInViewport();
});

test('small components use the same studio and open reference anchors in the panel', async ({page}) => {
 await page.goto('/components/button#design-notes');
 await expect(page.getByRole('region',{name:'Preview canvas',exact:true})).toBeVisible();
 const reference=page.getByRole('dialog',{name:'Component reference',exact:true});
 await expect(reference.getByRole('heading',{name:'Design notes',exact:true})).toBeInViewport();
 await page.evaluate(()=>{ location.hash = 'api'; });
 await expect(reference.getByRole('heading',{name:'API reference',exact:true})).toBeInViewport();
});

test('AppShell sidebar keeps the rows and metrics steady through both transitions', async ({page}) => {
 await page.setViewportSize({width:768,height:900});
 await page.goto('/components/app-shell');
 const shell=page.locator('.preview-stage .flood-app-shell');
 const sidebar=shell.getByRole('complementary',{name:'Workspace navigation',exact:true});
 const toggle=sidebar.locator('.flood-sidebar__toggle');
 await expect(toggle).toBeVisible();
 await page.evaluate(()=>document.fonts.ready);
 const positions=()=>shell.evaluate(node=>{
  const top=(item:Element)=>Math.round(item.getBoundingClientRect().top-node.getBoundingClientRect().top);
  return [...node.querySelectorAll('.flood-sidebar__navigation .flood-navigation-item, .app-shell-preview-metrics > *')].map(top);
 });
 const before=await positions();
 await toggle.click();
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await expect(toggle).toHaveCSS('outline-style','none');
 await sidebar.evaluate(node=>node.getAnimations().forEach(animation=>animation.finish()));
 expect(await positions()).toEqual(before);
 await page.keyboard.press('Tab');
 await toggle.focus();
 await expect(toggle).toBeFocused();
 await expect(toggle).toHaveCSS('outline-style','none');
 await expect(toggle).not.toHaveCSS('background-color','rgba(0, 0, 0, 0)');
 // Hold the real transition long enough to sample its intermediate layout under CI load.
 await sidebar.evaluate(node=>{(node as HTMLElement).style.transitionDuration='5s';});
 await toggle.press('Enter');
 await expect(toggle).toHaveAttribute('aria-expanded','true');
 await sidebar.evaluate(node=>{
  const transition=node.getAnimations().find(animation=>animation instanceof CSSTransition);
  if(!transition)throw new Error('Expected sidebar width transition');
  transition.pause();
  transition.currentTime=1;
 });
 expect(await positions()).toEqual(before);
 await sidebar.evaluate(node=>{
  node.getAnimations().forEach(animation=>animation.finish());
  (node as HTMLElement).style.removeProperty('transition-duration');
 });
 expect(await positions()).toEqual(before);
});

test('studio zoom and direct canvas dragging preserve the live component', async ({page}) => {
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('/components/app-shell');
 const canvas=page.getByRole('region',{name:'Preview canvas',exact:true});
 const shell=canvas.locator('.flood-app-shell');
 const chooseView=async(label:string, option:string)=>{
  await page.getByRole('combobox',{name:label,exact:true}).click();
  await page.getByRole('option',{name:option,exact:true}).click();
 };
 await chooseView('Frame width','390 px');
 await expect.poll(()=>shell.evaluate(node=>node.clientWidth)).toBeGreaterThan(380);
 await expect.poll(()=>shell.evaluate(node=>node.clientWidth)).toBeLessThan(400);
 await expect(canvas.getByRole('button',{name:'Navigation',exact:true})).toBeVisible();
 await chooseView('Frame width','1200 px');
 await chooseView('Canvas zoom','150%');
 await expect.poll(()=>shell.evaluate(node=>node.getBoundingClientRect().width)).toBeGreaterThan(1700);
 await page.getByRole('button',{name:'Fit',exact:true}).click();
 await expect(page.getByRole('button',{name:'Fit',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect.poll(()=>canvas.evaluate(node=>node.scrollWidth-node.clientWidth)).toBeLessThanOrEqual(1);
 await chooseView('Canvas zoom','150%');
 await canvas.scrollIntoViewIfNeeded();
 const bounds=(await canvas.boundingBox())!;
 const frame=canvas.locator(':scope > .flood-scroll-area__content > .flood-root');
 const frameStart=(await frame.boundingBox())!;
 await page.mouse.move(bounds.x+170,bounds.y+5);
 await page.mouse.down();
 await page.mouse.move(bounds.x+65,bounds.y+5,{steps:6});
 await page.mouse.up();
 await expect.poll(async()=>Math.round((await frame.boundingBox())!.x-frameStart.x)).toBe(-105);
 await page.getByRole('button',{name:'Reset view',exact:true}).click();
 await expect.poll(()=>canvas.evaluate(node=>node.scrollLeft)).toBe(0);
 await expect(canvas.getByRole('complementary',{name:'Workspace navigation',exact:true})).toBeVisible();
});

test('AppShell preserves fixed chrome, skip focus and logical navigation order', async ({page}) => {
 await page.goto('/components/app-shell');
 await choose(page,'AppShell','navigationMode','docked');
 const stage=page.locator('.preview-stage'), shell=stage.locator('.flood-app-shell');
 const work=stage.getByRole('region',{name:'Workspace preview',exact:true});
 const bar=stage.getByText('Flood Studio',{exact:true});
 const sidebar=stage.getByRole('complementary',{name:'Workspace navigation',exact:true});
 await expect(work).toBeVisible();
 await stage.evaluate(node=>{node.style.setProperty('--flood-workbench-shell-height','20rem');});
 await page.getByRole('checkbox',{name:'AppShell prop showFooter',exact:true}).check();
 const footer=stage.getByText('All changes saved',{exact:true});
 const before={bar:(await bar.boundingBox())!.y,footer:(await footer.boundingBox())!.y,sidebar:(await sidebar.boundingBox())!.y};
 const viewport=work.locator('.flood-app-shell__scroll');
 await expect(viewport).toHaveAttribute('data-scrollbars','overlay');
 await expect(viewport.locator('.flood-scroll-area__content')).toHaveCSS('padding-inline-end','0px');
 await viewport.evaluate(node=>{node.scrollTop=node.scrollHeight;});
 await expect.poll(()=>viewport.evaluate(node=>node.scrollTop)).toBeGreaterThan(0);
 expect({bar:(await bar.boundingBox())!.y,footer:(await footer.boundingBox())!.y,sidebar:(await sidebar.boundingBox())!.y}).toEqual(before);
 const skip=stage.getByRole('link',{name:'Skip to workspace preview',exact:true});
 await skip.focus();
 await skip.press('Enter');
 await expect(work).toBeFocused();
 await choose(page,'AppShell','navigationSide','end');
 await page.evaluate(()=>{document.documentElement.dir='rtl';});
 await expect.poll(async()=>(await sidebar.boundingBox())!.x-(await work.boundingBox())!.x).toBeLessThan(0);
 await choose(page,'AppShell','scroll','page');
 await expect(shell).toHaveAttribute('data-scroll','page');
 await expect(viewport).toHaveCount(0);
 await choose(page,'AppShell','navigationMode','none');
 await expect(sidebar).toHaveCount(0);
});

test('AppShell uses its own width to switch navigation and preserves focus on resize', async ({page}) => {
 await page.setViewportSize({width:1440,height:950});
 await page.goto('/components/app-shell');
 const stage=page.locator('.preview-stage'), shell=stage.locator('.flood-app-shell');
 const sidebar=stage.getByRole('complementary',{name:'Workspace navigation',exact:true});
 const work=stage.getByRole('region',{name:'Workspace preview',exact:true});
 await sidebar.getByRole('link',{name:'Overview',exact:true}).focus();
 await shell.evaluate(node=>{(node as HTMLElement).style.width='22rem';});
 const trigger=stage.getByRole('button',{name:'Navigation',exact:true});
 await expect(trigger).toBeFocused();
 await expect(sidebar).toHaveCount(0);
 await trigger.click();
 await expect(stage.getByRole('dialog',{name:'Workspace navigation',exact:true})).toBeVisible();
 await shell.evaluate(node=>{(node as HTMLElement).style.width='100%';});
 await expect(sidebar).toBeVisible();
 await expect(work).toBeFocused();
 await expect(trigger).toHaveCount(0);
});

test('AppShell can swap docked navigation for the existing Drawer', async ({page}) => {
 await page.goto('/components/app-shell');
 await choose(page,'AppShell','navigationMode','drawer');
 const stage=page.locator('.preview-stage');
 await expect(stage.getByRole('complementary',{name:'Workspace navigation',exact:true})).toHaveCount(0);
 const trigger=stage.getByRole('button',{name:'Navigation',exact:true});
 const drawer=stage.getByRole('dialog',{name:'Workspace navigation',exact:true});
 await trigger.click();
 await expect(drawer.getByRole('link',{name:'Archive',exact:true})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(drawer).toBeHidden();
 await expect(trigger).toBeFocused();
 await trigger.click();
 await drawer.getByRole('link',{name:'Archive',exact:true}).click();
 await expect(drawer).toBeHidden();
 await expect(page).toHaveURL(/#shell-archive$/);
});

async function choose(page:import('@playwright/test').Page,component:string,prop:string,value:string){
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
 await page.getByRole('checkbox',{name:'Steps prop interactive',exact:true}).check();await stage.getByRole('button',{name:/Review/}).click();await expect(page.locator('.workbench-feedback')).toHaveText('Step requested: review');await expect(stage.locator('[aria-current=step]')).toContainText('Access');await expect(stage.getByRole('tab')).toHaveCount(0);
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

test('Section separates document heading level from its visual heading size',async({page})=>{
 await page.goto('/components/section');const stage=page.locator('.preview-stage'),heading=stage.getByRole('heading',{name:'Project settings',exact:true});
 await expect(heading).toBeVisible();await page.evaluate(()=>document.fonts.ready);const initialSize=await heading.evaluate(node=>getComputedStyle(node).fontSize);await expect(heading).toHaveJSProperty('tagName','H2');
 await choose(page,'Section','headingLevel','5');await expect(heading).toHaveJSProperty('tagName','H5');expect(await heading.evaluate(node=>getComputedStyle(node).fontSize)).toBe(initialSize);
 await choose(page,'Section','headingSize','large');await expect(heading).toHaveJSProperty('tagName','H5');expect(parseFloat(await heading.evaluate(node=>getComputedStyle(node).fontSize))).toBeGreaterThan(parseFloat(initialSize));
 await page.setViewportSize({width:390,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='24px');await heading.scrollIntoViewIfNeeded();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const bounds=await heading.evaluate(node=>{const title=node.getBoundingClientRect(),section=node.closest('section')!.getBoundingClientRect();return{left:title.left,right:title.right,sectionLeft:section.left,sectionRight:section.right}});expect(bounds.left).toBeGreaterThanOrEqual(bounds.sectionLeft);expect(bounds.right).toBeLessThanOrEqual(bounds.sectionRight);
 await stage.screenshot({path:'.artifacts/section-heading-size-mobile.png'});
});

test('PageHeader keeps one primary heading and wraps actions within the available width', async ({page}) => {
  await page.goto('/components/page-header');
  const header = page.locator('.preview-stage .flood-page-header');
  await expect(page.getByRole('heading', {level:1, exact:true})).toHaveText('PageHeader');
  const title = header.getByRole('heading', {name:'Projects', level:2, exact:true});
  const action = header.getByRole('button', {name:'New project', exact:true});
  await expect(title).toBeVisible();
  await expect(action).toBeVisible();
  await expect(header).not.toContainText('Only projects shared');
  await page.getByRole('checkbox', {name:'PageHeader prop showDescription', exact:true}).check();
  await expect(header).toContainText('Only projects shared');
  await page.setViewportSize({width:390,height:1000});
  await page.evaluate(() => { document.documentElement.style.fontSize = '24px'; });
  const geometry = await header.evaluate(node => {
    const bounds = node.getBoundingClientRect();
    const title = node.querySelector('h2')!.getBoundingClientRect();
    const action = node.querySelector('button')!.getBoundingClientRect();
    return {below: action.top > title.bottom, contained: action.left >= bounds.left && action.right <= bounds.right + 1};
  });
  expect(geometry).toEqual({below:true, contained:true});
  await action.focus();
  await expect(action).toBeFocused();
});
