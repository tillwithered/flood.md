import {test,expect,type Page} from '@playwright/test';
import {chooseSelectOption} from './select-helpers';
import AxeBuilder from '@axe-core/playwright';
async function open(page:Page, hash = ''){
  const viewport = page.viewportSize();
  if (viewport && viewport.width < 640) await page.setViewportSize({ ...viewport, width: 640 });
  await page.goto('/playground/navigation' + hash);
  await expect(page.getByRole('complementary',{name:'Global navigation',exact:true})).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
}

test('page search finds available destinations and reveals the selected branch',async({page})=>{
  await open(page, '#labs/projects/all');
  await page.getByRole('button',{name:'Collapse Product delivery',exact:true}).click();
  const trigger=page.getByRole('button',{name:'Go to page',exact:true});
  await trigger.click();
  const search=page.getByRole('combobox',{name:'Search pages',exact:true});
  await expect(search).toBeFocused();
  await search.fill('archived');
  await expect(page.getByRole('listbox',{name:'Search pages'}).getByText('No matching pages',{exact:true})).toBeVisible();
  await search.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(search).toHaveValue('');
  await search.fill('administration management');
  await search.press('Enter');
  const name='Workspace administration and access management';
  await expect(page.getByRole('heading',{name,exact:true})).toBeFocused();
  await expect(page.getByRole('link',{name,exact:true})).toHaveAttribute('aria-current','page');
  await expect(page.getByRole('table',{name:'Projects'}).getByText(name,{exact:true})).toBeVisible();
});

test('command palette exposes loading, empty and disabled results',async({page})=>{
  await page.goto('/components/command-palette');
  const trigger=page.getByRole('button',{name:'Go to page',exact:true});
  const dialog=page.getByRole('dialog',{name:'Go to page'});
  const editor=dialog.getByRole('combobox',{name:'Search pages'});
  const scenario=page.getByRole('combobox',{name:'Scenario',exact:true});
  await chooseSelectOption(page.getByRole('combobox',{name:'CommandPalette prop density',exact:true}),'compact');
  await chooseSelectOption(scenario,'loading');
  await trigger.click();
  await expect(dialog.getByRole('listbox')).toHaveAttribute('aria-busy','true');
  await editor.press('Enter');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:'Close',exact:true}).click();
  await expect(trigger).toBeFocused();

  await chooseSelectOption(scenario,'empty');
  await trigger.click();
  await expect(dialog.getByRole('listbox').getByText('No matching pages.')).toBeVisible();
  await editor.press('Escape');

  await chooseSelectOption(scenario,'pages');
  await trigger.click();
  await expect(dialog.getByRole('option',{name:'Archive',exact:true})).toHaveAttribute('aria-disabled','true');
  await editor.press('End');
  await editor.press('Enter');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('status').filter({hasText:'Inbox'})).toBeVisible();
});

test('workspace switching from the account menu restores route, branches and focus',async({page})=>{
  await open(page);
  await page.getByRole('link',{name:'Active',exact:true}).click();
  const chooseWorkspace=async(current:string,next:string)=>{
    const trigger=page.getByRole('button',{name:'Account',exact:true});
    await trigger.click();
    const menu=page.getByRole('menu',{name:'Account',exact:true});
    await expect(menu.getByRole('menuitemradio',{name:current,exact:true})).toHaveAttribute('aria-checked','true');
    await menu.getByRole('menuitemradio',{name:next,exact:true}).click();
    await expect(trigger).toBeFocused();
  };
  await chooseWorkspace('Flood Studio','Flood Labs');
  await expect(page.getByRole('heading',{name:'All projects',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Archived',exact:true})).toHaveCount(0);
  await page.setViewportSize({width:1280,height:700});
  const labsSidebar=page.getByRole('complementary',{name:'Projects navigation',exact:true});
  await expect.poll(()=>labsSidebar.locator('.flood-sidebar__body').evaluate(node=>node.scrollHeight-node.clientHeight)).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Collapse Research and operations',exact:true}).click();
  await expect(page.getByRole('button',{name:'Expand Research and operations',exact:true})).toHaveAttribute('aria-expanded','false');
  const projectLink=page.getByRole('link',{name:'Workspace administration and access management',exact:true});
  await projectLink.scrollIntoViewIfNeeded();
  await projectLink.click();
  await expect(page.getByRole('heading',{name:'Workspace administration and access management',exact:true})).toBeVisible();
  await chooseWorkspace('Flood Labs','Flood Studio');
  await expect(page).toHaveURL(/#projects\/active$/);
  await page.getByRole('radio',{name:'Sidebar',exact:true}).check();
  const collapse=page.getByRole('complementary',{name:'Workspace navigation',exact:true}).getByRole('button',{name:'Collapse sidebar',exact:true});
  const sidebar=page.getByRole('complementary',{name:'Workspace navigation',exact:true});
  const header=sidebar.locator('.flood-sidebar__header');
  const mainHeader=page.locator('.navigation-lab__main-header');
  expect((await header.boundingBox())!.height).toBe((await mainHeader.boundingBox())!.height);
  await collapse.click();
  const expand=sidebar.getByRole('button',{name:'Expand sidebar',exact:true});
  await mainHeader.hover();
  await expect(expand).toHaveCSS('opacity','0');
  await header.hover();
  await expect(expand).toHaveCSS('opacity','1');
  await expect(header.locator('.navigation-lab__brand')).toHaveCSS('opacity','0');
  await chooseWorkspace('Flood Studio','Flood Labs');
  await expect(page).toHaveURL(/#labs\/projects\/lab-12$/);
  await expand.click();
  await expect(page.getByRole('button',{name:'Expand Research and operations',exact:true})).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading',{name:'Active projects',exact:true})).toBeVisible();
  await page.goto('/playground/navigation#labs/projects/archived');
  await expect(page.getByRole('heading',{name:'All projects',exact:true})).toBeVisible();
});

test('full viewport workspaces do not reserve an unused document scrollbar strip',async({page})=>{
  await page.goto('/playground/navigation');
  await expect(page.getByRole('heading', { name: 'All projects', exact: true })).toBeVisible();
  const measure=()=>page.evaluate(()=>({width:innerWidth,root:document.documentElement.getBoundingClientRect().width,scroll:document.documentElement.scrollHeight,height:innerHeight}));
  for(const profile of ['Rail + context','Sidebar']){
    await page.getByRole('radio',{name:profile,exact:true}).check();
    const bounds=await measure();expect(Math.abs(bounds.width-bounds.root)).toBeLessThan(1);expect(bounds.scroll).toBeLessThanOrEqual(bounds.height+1);
  }
});

test('both workspace layouts move navigation into a drawer when content is narrow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/playground/navigation');
  const navigation = page.getByRole('button', { name: 'Navigation', exact: true });
  const drawer = page.getByRole('dialog', { name: 'Workspace navigation' });
  for (const layout of ['Rail + context', 'Sidebar']) {
    await page.getByRole('radio', { name: layout, exact: true }).check();
    await expect(navigation).toBeVisible();
    const content = page.getByRole('main');
    expect((await content.boundingBox())!.width).toBeGreaterThan(280);
    await navigation.click();
    await expect(drawer).toBeVisible();
    await drawer.getByRole('link', { name: 'Files', exact: true }).click();
    await expect(drawer).toBeHidden();
    await expect(page.getByRole('heading', { name: 'All files', exact: true })).toBeFocused();
    await navigation.click();
    await drawer.getByRole('link', { name: 'Projects', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'All projects', exact: true })).toBeFocused();
  }
});

test('global location contextual page and explicit pane visibility are independent',async({page})=>{
  await open(page);
  const rail=page.getByRole('complementary',{name:'Global navigation',exact:true});
  const logo=(await rail.locator('.navigation-lab__brand img').boundingBox())!;
  const topAction=(await page.getByRole('button',{name:'Go to page',exact:true}).boundingBox())!;
  expect(Math.abs(logo.y+logo.height/2-topAction.y-topAction.height/2)).toBeLessThan(1);
  let context=page.getByRole('complementary',{name:'Projects navigation',exact:true});
  await expect(rail.getByRole('link',{name:'Projects',exact:true})).toHaveAttribute('aria-current','location');
  await expect(context.getByRole('link',{name:'All projects',exact:true})).toHaveAttribute('aria-current','page');
  await expect(context.getByRole('navigation',{name:'Projects views',exact:true})).toBeVisible();
  await expect(context.locator('.flood-sidebar__group-label')).toHaveCount(0);
  const firstRow=(region:typeof rail)=>region.locator('.flood-navigation-tree__row').first().boundingBox();
  expect(Math.abs((await firstRow(rail))!.y-(await firstRow(context))!.y)).toBeLessThan(1);
  await context.getByRole('link',{name:'Active',exact:true}).click();
  await expect(page).toHaveURL(/#projects\/active$/);
  await expect(rail.getByRole('link',{name:'Projects',exact:true})).toHaveAttribute('aria-current','location');
  const hide=rail.getByRole('button',{name:'Hide context navigation',exact:true});
  const position=await hide.boundingBox();
  await hide.click();await expect(context).toHaveCount(0);
  const show=rail.getByRole('button',{name:'Show context navigation',exact:true});
  expect(await show.boundingBox()).toEqual(position);
  const inbox=rail.getByRole('button',{name:'Inbox',exact:true});
  const flyout=rail.getByRole('dialog',{name:'Inbox',exact:true});
  await expect(show).toBeFocused();
  await inbox.hover();
  await expect(flyout).toBeVisible();
  await expect(show).toBeFocused();
  const panel=(await flyout.boundingBox())!,railBounds=(await rail.boundingBox())!;
  const topInset=panel.y-railBounds.y;
  const bottomInset=railBounds.y+railBounds.height-panel.y-panel.height;
  expect(topInset).toBeGreaterThan(0);
  expect(Math.abs(bottomInset-topInset)).toBeLessThan(1);
  await expect(flyout.getByRole('button',{name:'Close',exact:true})).toHaveCount(0);
  await page.mouse.move(panel.x+panel.width/2,panel.y+panel.height-20);
  expect(await flyout.evaluate(node=>node.matches(':hover'))).toBe(true);
  await flyout.getByRole('link',{name:/^Unread/}).hover();
  await expect(flyout).toBeVisible();
  await rail.getByRole('button',{name:'Files',exact:true}).hover();
  const filesFlyout=rail.getByRole('dialog',{name:'Files',exact:true});
  await expect(filesFlyout).toBeVisible();
  await expect(flyout).toHaveCount(0);
  expect(await filesFlyout.boundingBox()).toEqual(panel);
  await expect(show).toBeFocused();
  await inbox.hover();
  await expect(flyout).toBeVisible();
  await page.getByRole('link',{name:'Sidebar',exact:true}).hover();
  await expect(flyout).toBeHidden();
  await inbox.click();
  await expect(flyout).toBeVisible();
  await expect(flyout.getByRole('link',{name:'All messages',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(inbox).toBeFocused();
  await inbox.click();
  await flyout.getByRole('link',{name:'All messages',exact:true}).click();
  await expect(flyout).toBeHidden();
  await expect(page.getByRole('heading',{name:'All messages',exact:true})).toBeVisible();
  await expect(page.getByRole('complementary',{name:'Inbox navigation',exact:true})).toHaveCount(0);
  await show.click();
  expect(await hide.boundingBox()).toEqual(position);
  context=page.getByRole('complementary',{name:'Inbox navigation',exact:true});await expect(context).toBeVisible();
  await rail.getByRole('link',{name:'Inbox',exact:true}).click();await expect(context).toBeVisible();
  await page.goBack();await expect(page).toHaveURL(/#projects\/active$/);
});

test('modified links retain browser ownership and classic mode reuses routes',async({page},info)=>{
  await open(page);
  const rail=page.getByRole('complementary',{name:'Global navigation',exact:true});
  const files=rail.getByRole('link',{name:'Files',exact:true});
  await expect(files).toHaveAttribute('href','#files/all');
  const prevented=await files.evaluate(node=>{
    // Observe the host's decision before isolating the browser's platform-specific
    // native modified-click action; this is not a claim that a new tab was opened.
    let hostPrevented:boolean|undefined;
    const observe=(event:MouseEvent)=>{hostPrevented=event.defaultPrevented;event.preventDefault();};
    node.ownerDocument.addEventListener('click',observe,{once:true});
    node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,ctrlKey:true}));
    return hostPrevented;
  });
  expect(prevented).toBe(false);
  await expect(page.getByRole('heading',{name:'All projects',exact:true})).toBeVisible();
  await page.getByRole('radio',{name:'Sidebar',exact:true}).check();
  await expect(rail).toHaveCount(0);
  const narrow = info.project.name === 'mobile';
  if (narrow) await page.setViewportSize({ width: 390, height: 844 });
  if(narrow)await page.getByRole('button',{name:'Navigation',exact:true}).click();
  const sidebar=page.getByRole(narrow?'dialog':'complementary',{name:'Workspace navigation',exact:true});
  await sidebar.getByRole('link',{name:'Files',exact:true}).click();await expect(page).toHaveURL(/#files\/all$/);
  await expect(page.getByRole('list',{name:'Files',exact:true})).toBeVisible();
  if(narrow){
    await expect(sidebar).toBeHidden();
    await expect(page.getByRole('heading',{name:'All files',exact:true})).toBeFocused();
  }
});

test('real project creation works and enlarged workspace keeps overflow in the table owner',async({page})=>{
  await open(page);await page.getByRole('button',{name:'New project',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'New project',exact:true});
  await dialog.getByRole('textbox',{name:'Project name',exact:false}).fill('Navigation polish');
  await dialog.getByRole('button',{name:'Create project',exact:true}).click();
  await expect(page.getByRole('table',{name:'Projects',exact:true}).getByText('Navigation polish',{exact:true})).toBeVisible();
  await page.setViewportSize({width:1280,height:1000});
  await page.evaluate(()=>{document.documentElement.style.fontSize='24px';document.documentElement.dir='rtl';});
  const main=page.getByRole('main',{name:'Projects workspace',exact:true});
  const geometry=await main.evaluate(node=>({width:innerWidth,scroll:document.documentElement.scrollWidth,main:node.getBoundingClientRect().width}));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.width);expect(geometry.main).toBeGreaterThan(500);
  await expect(page.getByRole('button',{name:'New project',exact:true})).toBeVisible();
});

test('project filters stay scoped across modules and archived is a reachable All projects result',async({page})=>{
  await open(page);
  const rail=page.getByRole('complementary',{name:'Global navigation',exact:true});
  async function filter(value:string){
    await page.getByRole('button',{name:'Filters',exact:true}).click();
    const panel=page.getByRole('dialog',{name:'Project filters',exact:true});
    await chooseSelectOption(panel.getByRole('combobox',{name:'Status',exact:true}),value);
    await panel.getByRole('button',{name:'Apply filters',exact:true}).click();
  }
  await filter('paused');
  await rail.getByRole('link',{name:'Inbox',exact:true}).click();
  await expect(page.getByRole('button',{name:'Clear filters',exact:true})).toHaveCount(0);
  await page.getByRole('searchbox',{name:'Search inbox',exact:true}).fill('review');
  await page.getByRole('searchbox',{name:'Search inbox',exact:true}).fill('');
  await rail.getByRole('link',{name:'Projects',exact:true}).click();
  await expect(page.getByRole('button',{name:'Remove Status: Paused',exact:true})).toBeVisible();
  await filter('archived');
  await expect(page.getByRole('table',{name:'Projects',exact:true}).getByText('Checkout',{exact:true})).toBeVisible();
});

test('disappearing actions and dialog triggers restore a stable heading without stealing surviving focus',async({page})=>{
  await open(page, '#inbox/unread');
  const heading=page.getByRole('heading',{name:'Unread',exact:true});
  await page.getByRole('button',{name:'Mark all as read',exact:true}).focus();
  await page.keyboard.press('Enter');await expect(heading).toBeFocused();
  await page.goto('/playground/navigation#inbox/unread');
  await page.reload();
  await page.getByRole('button',{name:'Design review',exact:true}).focus();await page.keyboard.press('Enter');
  const detail=page.getByRole('dialog',{name:'Design review',exact:true});
  await detail.getByRole('button',{name:'Close',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Unread',exact:true})).toBeFocused();
  await page.goto('/playground/navigation#projects/active');
  await page.getByRole('button',{name:'Design system actions',exact:true}).focus();await page.keyboard.press('Enter');
  await page.getByRole('menuitem',{name:'Archive project',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Active projects',exact:true})).toBeFocused();
  const search=page.getByRole('searchbox',{name:'Search projects',exact:true});
  await search.fill('Website');await expect(search).toBeFocused();
  const hide=page.getByRole('button',{name:'Hide context navigation',exact:true});
  await hide.click();await expect(page.getByRole('button',{name:'Show context navigation',exact:true})).toBeFocused();
});

test('a surviving dialog trigger retains keyboard focus after opening a message',async({page})=>{
  await page.goto('/playground/navigation#inbox/all');
  const trigger=page.getByRole('button',{name:'Design review',exact:true});
  await trigger.focus();await trigger.press('Enter');
  await page.getByRole('dialog',{name:'Design review',exact:true}).getByRole('button',{name:'Close',exact:true}).click();
  await expect(trigger).toBeFocused();
});

test('invalid route tails cannot produce an unnamed destination and a short desktop keeps scrolling local',async({page})=>{
  await page.goto('/playground/navigation#projects/all/extra');
  await expect(page.getByRole('heading',{name:'All projects',exact:true})).toBeVisible();
  await page.setViewportSize({width:1280,height:640});
  await page.evaluate(()=>document.documentElement.style.fontSize='24px');
  const scroll=page.getByRole('region',{name:'Projects content',exact:true});
  const header=page.locator('.navigation-lab__main-header'),before=(await header.boundingBox())!.y;
  const geometry=await scroll.evaluate(node=>{node.scrollTop=node.scrollHeight;return {height:node.clientHeight,content:node.scrollHeight,scroll:node.scrollTop,body:document.documentElement.scrollHeight,window:innerHeight};});
  expect(geometry.content).toBeGreaterThan(geometry.height);expect(geometry.scroll).toBeGreaterThan(0);
  expect(geometry.body).toBeLessThanOrEqual(geometry.window+1);
  expect(Math.abs((await header.boundingBox())!.y-before)).toBeLessThan(1);
});

test('both composed and standalone workspaces preserve accessible names and navigation semantics',async({page})=>{
  await open(page);
  const check=async()=>{const result=await new AxeBuilder({page}).include('.navigation-lab__frame').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations).toEqual([]);};
  await check();await page.getByRole('radio',{name:'Sidebar',exact:true}).check();await check();
});
