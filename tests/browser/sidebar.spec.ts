import {test,expect,type Page} from '@playwright/test';
import {build} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chooseSelectOption} from './select-helpers';
test.use({reducedMotion:'reduce'});
async function open(page:Page){await page.goto('/components/sidebar');const sidebar=page.locator('.preview-stage').getByRole('complementary',{name:'Workspace navigation',exact:true});await expect(sidebar).toBeVisible();await page.evaluate(()=>document.fonts.ready);return sidebar;}
async function sidebarProperty(page:Page, name:string, value:string|boolean){
  if(typeof value==='boolean')await page.getByRole('checkbox',{name:`Sidebar prop ${name}`,exact:true}).setChecked(value);
  else await chooseSelectOption(page.getByRole('combobox',{name:`Sidebar prop ${name}`,exact:true}),value);
}

test('sidebar width eases in both directions and respects reduced motion',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  const sidebar=await open(page);
  await sidebar.evaluate(node=>{node.style.transitionDuration='5s';});
  for(const collapsed of [true,false]){
    const start=await sidebar.evaluate(node=>node.offsetWidth);
    await sidebar.getByRole('button',{name:collapsed?'Collapse sidebar':'Expand sidebar',exact:true}).evaluate(node=>(node as HTMLButtonElement).click());
    await expect(sidebar).toHaveAttribute('data-collapsed',String(collapsed));
    const widths=await sidebar.evaluate(node=>{
      const transition=node.getAnimations().find(animation=>
        animation instanceof CSSTransition&&['inline-size','width'].includes(animation.transitionProperty));
      if(!transition?.effect)throw new Error('Missing width transition');
      transition.pause();
      transition.currentTime=Number(transition.effect.getTiming().duration)/2;
      const middle=node.offsetWidth;
      transition.finish();
      return {middle,end:node.offsetWidth};
    });
    expect(widths.middle).toBeGreaterThan(Math.min(start,widths.end));
    expect(widths.middle).toBeLessThan(Math.max(start,widths.end));
  }
  await sidebar.evaluate(node=>node.style.removeProperty('transition-duration'));
  await page.emulateMedia({reducedMotion:'reduce'});
  await sidebar.getByRole('button',{name:'Collapse sidebar',exact:true}).click();
  await expect(sidebar).toHaveAttribute('data-collapsed','true');
  await expect(sidebar).toHaveCSS('transition-property','all');
});

test('quiet and standard recipes preserve destinations while changing emphasis at the shared owner',async({page})=>{
  const sidebar=await open(page),current=sidebar.getByRole('link',{name:'Overview',exact:true}),inactive=sidebar.getByRole('link',{name:'Activity',exact:false});
  await expect(sidebar).toHaveAttribute('data-variant','quiet');
  const quiet=await current.evaluate(node=>({radius:parseFloat(getComputedStyle(node).borderTopLeftRadius),color:getComputedStyle(node).color}));
  expect(await inactive.evaluate(node=>getComputedStyle(node).color)).not.toBe(quiet.color);
  await sidebarProperty(page,'variant','standard');
  expect(await current.evaluate(node=>parseFloat(getComputedStyle(node).borderTopLeftRadius))).toBeGreaterThan(quiet.radius);
  await expect(current).toHaveAttribute('href','#overview');await expect(current).toHaveAttribute('aria-current','page');
});

test('expanded rows keep symmetric outer clearance with and without a scrollbar',async({page})=>{
  const sidebar=await open(page);
  for(const rtl of [false,true]){
    await page.evaluate(rtl=>{document.documentElement.dir=rtl?'rtl':'ltr';},rtl);
    for(const long of [false,true]){
      await sidebarProperty(page,'longNavigation',long);
      const spaces=await sidebar.evaluate(node=>{
        const outer=node.getBoundingClientRect(),style=getComputedStyle(node);
        return Array.from(node.querySelectorAll('.flood-navigation-tree > ul > li > .flood-navigation-tree__row')).filter(row=>!row.closest('.flood-navigation-tree__branch')).map(row=>{const rect=row.getBoundingClientRect();return {left:rect.left-outer.left-parseFloat(style.borderLeftWidth),right:outer.right-rect.right-parseFloat(style.borderRightWidth)};});
      });
      for(const space of spaces)expect(Math.abs(space.left-space.right)).toBeLessThan(1);
    }
  }
});

test('scrollbars use existing edge spacing without moving rows or overlapping their surfaces',async({page})=>{
  const sidebar=await open(page);
  for(const compact of [false,true]){
    if(compact)await sidebar.getByRole('button',{name:'Collapse sidebar',exact:true}).click();
    for(const rtl of [false,true]){
      await page.evaluate(rtl=>{document.documentElement.dir=rtl?'rtl':'ltr';},rtl);
      await sidebarProperty(page,'longNavigation',false);
      const first=sidebar.locator('.flood-sidebar__body .flood-navigation-tree__row').first();
      const before=(await first.boundingBox())!;
      await expect(sidebar.locator('.flood-scroll-area__track--vertical')).toHaveCount(0);
      await sidebarProperty(page,'longNavigation',true);
      const track=sidebar.locator('.flood-scroll-area__track--vertical');await expect(track).toBeVisible();
      const after=(await first.boundingBox())!,bar=(await track.boundingBox())!;
      expect(Math.abs(after.x-before.x)).toBeLessThan(1);expect(Math.abs(after.width-before.width)).toBeLessThan(1);
      expect(rtl?after.x-(bar.x+bar.width):bar.x-(after.x+after.width)).toBeGreaterThanOrEqual(1);
    }
  }
});

test('compact header navigation and footer share the full rail center with symmetric clearance',async({page})=>{
  const sidebar=await open(page);
  await sidebar.getByRole('button',{name:'Collapse sidebar',exact:true}).click();
  for(const rtl of [false,true]){
    await page.evaluate(rtl=>{document.documentElement.dir=rtl?'rtl':'ltr';},rtl);
    for(const long of [false,true]){
      await sidebarProperty(page,'longNavigation',long);
      const axes=await sidebar.evaluate(node=>{
        const outer=node.getBoundingClientRect(),center=outer.x+outer.width/2;
        return {center,items:Array.from(node.querySelectorAll('.flood-sidebar__identity .flood-icon,.flood-sidebar__header button,.flood-navigation-tree__row > .flood-navigation-item__control,.flood-sidebar__footer .flood-navigation-item__control,.flood-sidebar__footer button')).map(item=>{const r=item.getBoundingClientRect();return r.x+r.width/2;})};
      });
      for(const center of axes.items)expect(Math.abs(center-axes.center)).toBeLessThan(1);
    }
  }
});

test('shared icon text and action tracks span header groups descendants and footer without scrollbar drift',async({page})=>{
  const sidebar=await open(page);
  for(const size of ['sm','md','lg']){
    await sidebarProperty(page,'size',size);
    for(const long of [false,true]){
      await sidebarProperty(page,'longNavigation',long);
      for(const rtl of [false,true]){
        await page.evaluate(rtl=>{document.documentElement.dir=rtl?'rtl':'ltr';},rtl);
        const axes=await sidebar.evaluate((node,rtl)=>{
          const text=(element:Element)=>{const range=document.createRange();range.selectNodeContents(element);const r=range.getBoundingClientRect();return rtl?r.right:r.left;};
          const center=(element:Element)=>{const r=element.getBoundingClientRect();return r.left+r.width/2;};
          const labels=Array.from(node.querySelectorAll('.flood-navigation-item__label,.flood-navigation-group__label,.flood-sidebar__identity .flood-text'));
          const icons=Array.from(node.querySelectorAll('.flood-sidebar__identity .flood-icon,.flood-navigation-tree__row > .flood-navigation-item__control > .flood-icon'));
          return {text:labels.map(text),icons:icons.map(center),actions:[node.querySelector('.flood-navigation-item__disclosure,.flood-navigation-item__indicator')!,node.querySelector('.flood-navigation-item__trailing .flood-badge')!].map(center)};
        },rtl);
        for(const track of [axes.text,axes.icons,axes.actions])expect(Math.max(...track)-Math.min(...track)).toBeLessThan(1);
      }
    }
  }
});

test('expanded destinations, disclosure and compact state remain independent',async({page})=>{
  const sidebar=await open(page);
  const header=sidebar.locator('.flood-sidebar__header');
  const brand=(await header.locator('.flood-sidebar__identity .flood-icon').boundingBox())!;
  const inlineToggle=(await header.getByRole('button',{name:'Collapse sidebar'}).boundingBox())!;
  expect(Math.abs(brand.y+brand.height/2-inlineToggle.y-inlineToggle.height/2)).toBeLessThan(1);
  expect(brand.x).toBeLessThan(inlineToggle.x);
  await sidebarProperty(page,'headerLayout','stacked');
  const initial=(await sidebar.boundingBox())!;
  const overview=(await sidebar.getByRole('link',{name:'Overview',exact:true}).boundingBox())!,activity=(await sidebar.getByRole('link',{name:'Activity',exact:false}).boundingBox())!;
  expect(activity.y-overview.y-overview.height).toBeGreaterThanOrEqual(3.5);
  await expect(sidebar.getByRole('link',{name:'Overview',exact:true})).toHaveAttribute('aria-current','page');
  await expect(sidebar.locator('a').filter({hasText:'Reports'})).toHaveCount(0);
  await sidebar.getByRole('link',{name:'Design system',exact:true}).click();
  await expect(sidebar.getByRole('link',{name:'Design system',exact:true})).toHaveAttribute('aria-current','page');
  const collapse=sidebar.getByRole('button',{name:'Collapse sidebar',exact:true}),togglePosition=(await collapse.boundingBox())!;
  await collapse.click();
  await expect(sidebar).toHaveAttribute('data-collapsed','true');
  expect((await sidebar.boundingBox())!.width).toBeLessThan(initial.width);
  await expect(sidebar.getByRole('button',{name:'Expand sidebar',exact:true})).toBeFocused();
  const expand=sidebar.getByRole('button',{name:'Expand sidebar',exact:true});
  const compactPosition=(await expand.boundingBox())!;
  const compactSidebar=(await sidebar.boundingBox())!;
  expect(Math.abs((compactPosition.x-compactSidebar.x)-(togglePosition.x-initial.x))).toBeLessThan(1);
  expect(Math.abs((compactPosition.y-compactSidebar.y)-(togglePosition.y-initial.y))).toBeLessThan(1);
  await expand.click();
  await expect(sidebar.getByRole('button',{name:'Collapse Projects',exact:true})).toHaveAttribute('aria-expanded','true');
  await expect(sidebar.getByRole('link',{name:'Design system',exact:true})).toHaveAttribute('aria-current','page');
});

test('compact destinations and branches expose Flood tooltips without replacing their controls',async({page})=>{
  const sidebar=await open(page);
  const toggle=sidebar.getByRole('button',{name:'Collapse sidebar',exact:true});
  const expandedGlyph=await toggle.locator('svg').innerHTML();await toggle.click();
  expect(await sidebar.getByRole('button',{name:'Expand sidebar',exact:true}).locator('svg').innerHTML()).not.toBe(expandedGlyph);
  const link=sidebar.getByRole('link',{name:'Overview',exact:true});
  await link.hover();await expect(page.getByRole('tooltip',{name:'Overview',exact:true})).toBeVisible();
  await expect(link).toHaveAttribute('href','#overview');expect(await link.evaluate(node=>node.localName)).toBe('a');
  await page.keyboard.press('Escape');await expect(page.getByRole('tooltip',{name:'Overview',exact:true})).toBeHidden();
  const trigger=sidebar.getByRole('button',{name:'Projects',exact:true});await trigger.focus();
  await expect(page.getByRole('tooltip',{name:'Projects',exact:true})).toBeVisible();
  await trigger.click();await expect(page.getByRole('dialog',{name:'Projects',exact:true})).toBeVisible();
  await expect(page.getByRole('tooltip',{name:'Projects',exact:true})).toBeHidden();
});

test('disclosure artwork remains subordinate while its action target retains the family size',async({page})=>{
  const sidebar=await open(page);
  for(const size of ['sm','md','lg']){
    await sidebarProperty(page,'size',size);
    const result=await sidebar.evaluate(node=>{
      const action=node.querySelector('.flood-navigation-item__disclosure')??node.querySelector('.flood-navigation-item[data-expanded] > button')!,glyph=action.querySelector('.flood-navigation-item__indicator .flood-icon')??action.querySelector('.flood-icon')!,leading=node.querySelector('.flood-navigation-item__control .flood-icon')!;
      const hit=(action.querySelector('.flood-navigation-item__indicator')??action).getBoundingClientRect();
      const row=action.closest('.flood-navigation-item')!.getBoundingClientRect();
      return {target:action.getBoundingClientRect().height,glyph:glyph.getBoundingClientRect().width,leading:leading.getBoundingClientRect().width,endInset:row.right-hit.right};
    });
    expect(result.glyph).toBeLessThan(result.leading);expect(result.target).toBeGreaterThanOrEqual(32);
    expect(result.endInset).toBeCloseTo(4,1);
  }
});

test('navigation row keeps its sibling action and metadata visible without shifting the label',async({page})=>{
  await page.goto('/components/navigation-item');
  await page.getByRole('checkbox',{name:'NavigationItem prop badge',exact:true}).check();
  await page.getByRole('checkbox',{name:'NavigationItem prop showTrailingAction',exact:true}).check();
  const row=page.locator('.preview-stage .flood-navigation-item').first();
  const link=row.getByRole('link',{name:'Projects',exact:true});
  const action=row.getByRole('button',{name:'About this row',exact:true});
  const slot=row.locator('.flood-navigation-item__action');
  await expect(link.locator('button')).toHaveCount(0);
  await expect(slot).toHaveCSS('opacity','1');
  await expect(row.locator('.flood-navigation-item__metadata')).toHaveCSS('opacity','1');
  await link.scrollIntoViewIfNeeded();
  const label=await row.locator('.flood-navigation-item__label').boundingBox();
  await link.hover();
  await expect(slot).toHaveCSS('opacity','1');
  expect(await row.locator('.flood-navigation-item__label').boundingBox()).toEqual(label);
  await action.hover();
  await expect(action).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await link.focus();
  await page.keyboard.press('Tab');
  await expect(action).toBeFocused();
  await action.press('Enter');
  await expect(page.getByRole('dialog',{name:'About this row'})).toBeVisible();
});

test('pane glyph and branch placement follow the same logical side in LTR and RTL',async({page})=>{
  // Leave room on both sides to test preferred placement independently of collision fallback.
  await page.setViewportSize({width:1280,height:900});
  const sidebar=await open(page);
  for(const side of ['start','end']){
    await sidebarProperty(page,'side',side);
    for(const rtl of [false,true]){
      await page.evaluate(rtl=>{document.documentElement.dir=rtl?'rtl':'ltr';},rtl);
      const left=(side==='start')!==rtl;
      const collapse=sidebar.getByRole('button',{name:'Collapse sidebar',exact:true});
      await expect(collapse.locator('svg path').first()).toHaveAttribute('d',left?'M9 4v16':'M15 4v16');
      const closing=await collapse.locator('svg path').last().getAttribute('d');await collapse.click();
      const expand=sidebar.getByRole('button',{name:'Expand sidebar',exact:true});
      await expect(expand.locator('svg path').first()).toHaveAttribute('d',left?'M9 4v16':'M15 4v16');
      expect(await expand.locator('svg path').last().getAttribute('d')).not.toBe(closing);
      const trigger=sidebar.getByRole('button',{name:'Projects',exact:true});await trigger.click();
      const panel=page.getByRole('dialog',{name:'Projects',exact:true});await expect(panel).toBeVisible();
      const a=(await trigger.boundingBox())!,p=(await panel.boundingBox())!;
      expect(left?p.x>=a.x+a.width:p.x+p.width<=a.x).toBe(true);
      await page.keyboard.press('Escape');await expand.click();
    }
  }
});

test('compact flyout retains readable real links, current descendant and dismissal focus',async({page})=>{
  const sidebar=await open(page);await sidebar.getByRole('button',{name:'Collapse sidebar',exact:true}).click();
  const trigger=sidebar.getByRole('button',{name:'Projects',exact:true});await trigger.click();
  const panel=page.getByRole('dialog',{name:'Projects',exact:true});
  const link=panel.getByRole('link',{name:'Website',exact:true});await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href','#website');
  const label=link.locator('.flood-navigation-item__label');expect((await label.boundingBox())!.width).toBeGreaterThan(20);
  await link.click();await expect(panel).toBeHidden();await expect(trigger).toBeFocused();
  await expect(trigger.locator('..')).toHaveAttribute('data-ancestor-current','true');await expect(trigger).not.toHaveAttribute('aria-current');
  await trigger.click();await expect(panel.getByRole('link',{name:'Website',exact:true})).toHaveAttribute('aria-current','page');
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
});

test('long navigation scrolls independently while header/footer stay fixed, including enlarged RTL',async({page})=>{
  const sidebar=await open(page);
  await sidebarProperty(page,'longNavigation',true);
  await page.setViewportSize({width:1280,height:1000});
  await page.evaluate(()=>{document.documentElement.style.fontSize='24px';document.documentElement.dir='rtl';});
  const header=sidebar.locator('.flood-sidebar__header'),footer=sidebar.locator('.flood-sidebar__footer'),rootY=(await sidebar.boundingBox())!.y,before=[(await header.boundingBox())!.y-rootY,(await footer.boundingBox())!.y-rootY];
  const last=sidebar.getByRole('link',{name:'Collection 16',exact:true});await last.focus();
  const geometry=await sidebar.evaluate(node=>{const viewport=node.querySelector('.flood-scroll-area__viewport')!;const last=node.querySelector('a[href="#collection-15"]')!.getBoundingClientRect(),body=viewport.getBoundingClientRect();return {scroll:viewport.scrollTop,height:viewport.clientHeight,scrollHeight:viewport.scrollHeight,lastBottom:last.bottom,bodyBottom:body.bottom,width:node.clientWidth,scrollWidth:node.scrollWidth};});
  expect(geometry.scroll).toBeGreaterThan(0);expect(geometry.lastBottom).toBeLessThanOrEqual(geometry.bodyBottom+1);expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width+1);
  const afterY=(await sidebar.boundingBox())!.y;
  expect(Math.abs((await header.boundingBox())!.y-afterY-before[0])).toBeLessThan(1);expect(Math.abs((await footer.boundingBox())!.y-afterY-before[1])).toBeLessThan(1);
  await sidebar.getByRole('button',{name:'Collapse sidebar',exact:true}).click();
  await sidebar.getByRole('button',{name:'Projects',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Projects',exact:true}).getByRole('link',{name:'Design system',exact:true})).toBeVisible();
});

test('controlled refusal preserves accepted width and external collapse keeps focus inside navigation',async({page})=>{
  const directory=resolve('.artifacts/sidebar-controlled');await mkdir(directory,{recursive:true});const entry=resolve(directory,'entry.tsx');
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll('\\','/'));
  await writeFile(entry,`import React,{useState} from ${file('node_modules/react/index.js')};import {createRoot} from ${file('node_modules/react-dom/client.js')};import {FloodRoot,Sidebar,Button,IconButton} from '@flood-md/react';import '@flood-md/react/styles.css';window.refuse=true;function App(){const [collapsed,setCollapsed]=useState(false);window.accept=()=>setCollapsed(window.proposal);window.toCompact=()=>setCollapsed(true);window.toExpanded=()=>setCollapsed(false);return <FloodRoot><input aria-label="Outside navigation"/><div style={{height:'28rem'}}><Sidebar width={320} label="Controlled navigation" footer={({collapsed})=>collapsed?<IconButton label="Footer account"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/></svg></IconButton>:<Button>Footer account</Button>} collapsed={collapsed} onCollapsedChange={next=>{window.proposal=next;if(!window.refuse)setCollapsed(next);}} defaultExpandedValues={['group']} groups={[{id:'one',label:'One',items:[{value:'group',label:'Group',children:[{value:'child',label:'Child',href:'#child'}]}]}]}/></div></FloodRoot>;}createRoot(document.getElementById('app')).render(<App/>);`);
  const result=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{write:false,cssCodeSplit:false,lib:{entry,formats:['iife'],name:'SidebarControlled'}}});
  const output=(Array.isArray(result)?result:[result]).flatMap(result=>'output'in result?result.output:[]),js=output.filter(item=>item.type==='chunk').map(item=>item.type==='chunk'?item.code:'').join('\n'),css=output.filter(item=>item.type==='asset'&&item.fileName.endsWith('.css')).map(item=>item.type==='asset'?String(item.source):'').join('\n');
  await page.route('**/__sidebar.html',route=>route.fulfill({contentType:'text/html',body:`<html><head><style>${css}</style></head><body><div id="app"></div><script>${js.replace(/<\/script/gi,'<\\/script')}</script></body></html>`}));await page.goto('/__sidebar.html');
  const sidebar=page.getByRole('complementary',{name:'Controlled navigation',exact:true});
  const width=(await sidebar.boundingBox())!.width;
  expect(width).toBe(320);
  await sidebar.getByRole('button',{name:'Collapse sidebar',exact:true}).click();await expect(sidebar).toHaveAttribute('data-collapsed','false');expect((await sidebar.boundingBox())!.width).toBe(width);
  expect(await page.evaluate(()=>(window as any).proposal)).toBe(true);
  await sidebar.getByRole('link',{name:'Child',exact:true}).focus();await page.evaluate(()=>(window as any).accept());
  await expect(sidebar).toHaveAttribute('data-collapsed','true');
  expect(await sidebar.evaluate(node=>node.contains(document.activeElement))).toBe(true);
  await page.evaluate(()=>(window as any).toExpanded());await expect(sidebar).toHaveAttribute('data-collapsed','false');
  const footerAccount=sidebar.getByRole('button',{name:'Footer account',exact:true});await footerAccount.focus();await expect(footerAccount).toBeFocused();await page.evaluate(()=>(window as any).toCompact());
  await expect(sidebar.getByRole('button',{name:'Expand sidebar',exact:true})).toBeFocused();
  await page.evaluate(()=>(window as any).toExpanded());await expect(sidebar).toHaveAttribute('data-collapsed','false');const outside=page.getByRole('textbox',{name:'Outside navigation',exact:true});await outside.focus();await page.evaluate(()=>(window as any).toCompact());
  await expect(outside).toBeFocused();
});

test('compact touch targets fit the rail without clipping its scroll gutter',async({browser})=>{
  const context=await browser.newContext({hasTouch:true,viewport:{width:1280,height:1000}}),page=await context.newPage();
  try{
    const sidebar=await open(page);await sidebar.getByRole('button',{name:'Collapse sidebar',exact:true}).click();
    const link=sidebar.getByRole('link',{name:'Overview',exact:true}),box=(await link.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
    const geometry=await sidebar.evaluate(node=>({width:node.clientWidth,scroll:node.scrollWidth}));expect(geometry.scroll).toBeLessThanOrEqual(geometry.width+1);
  }finally{await context.close();}
});

test('workspace compact profile and navigation targets share the full rail axis in both profiles',async({page})=>{
  await page.setViewportSize({width:900,height:900});
  await page.goto('/playground/navigation');
  for(const profile of ['Rail + context','Sidebar']){
    await page.getByRole('radio',{name:profile,exact:true}).check();
    if(profile==='Sidebar')await page.getByRole('button',{name:'Collapse sidebar',exact:true}).first().click();
    const sidebar=page.getByRole('complementary',{name:profile==='Sidebar'?'Workspace navigation':'Global navigation',exact:true});
    for(const rtl of [false,true]){
      await page.evaluate(rtl=>document.documentElement.dir=rtl?'rtl':'ltr',rtl);
      const axes=await sidebar.evaluate(node=>{
        const outer=node.getBoundingClientRect(),center=outer.left+outer.width/2;
        const targets=[...node.querySelectorAll<HTMLElement>('.flood-sidebar__header button,.flood-sidebar__navigation .flood-navigation-item__control,.flood-sidebar__footer button,.flood-sidebar__footer .flood-navigation-item__control')].filter(element=>element.getClientRects().length&&!element.closest('[popover]'));
        return {center,targets:targets.map(element=>{const r=element.getBoundingClientRect();return {center:r.left+r.width/2,width:r.width,height:r.height};}),footer:node.querySelector('.flood-sidebar__footer button,.flood-sidebar__footer .flood-navigation-item__control')?.getBoundingClientRect().toJSON()};
      });
      expect(axes.footer).toBeTruthy();expect(axes.targets.length).toBeGreaterThanOrEqual(4);
      for(const target of axes.targets){expect(Math.abs(target.center-axes.center)).toBeLessThan(1);expect(target.width).toBeGreaterThanOrEqual(32);expect(target.height).toBeGreaterThanOrEqual(32);}
    }
    await sidebar.getByRole('button',{name:'Account',exact:true}).click();
    await expect(page.getByRole('menu')).toBeVisible();await page.keyboard.press('Escape');await expect(sidebar.getByRole('button',{name:'Account',exact:true})).toBeFocused();
  }
});
