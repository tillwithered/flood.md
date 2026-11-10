import {test,expect,type Page} from '@playwright/test';
import {build} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

let bundle:Promise<string>;
async function fixture(){
  const directory=resolve(`.artifacts/navigation-family-${process.pid}`),entry=resolve(directory,'entry.tsx');
  await mkdir(directory,{recursive:true});
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll('\\','/'));
  await writeFile(entry,`import React,{useState} from ${file('node_modules/react/index.js')};
import{createRoot}from ${file('node_modules/react-dom/client.js')};
import{FloodRoot,NavigationItem,NavigationGroup,NavigationTree,Button,Badge,Stack}from ${file('packages/react/dist/index.js')};
import ${file('packages/react/dist/styles.css')};
const icon=<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M4 6h6l2 2h8v12H4z"/></svg>;
function App(){const[only,O]=useState(false),[split,S]=useState(false),[refuse,R]=useState(false),[compact,C]=useState(false),[groupOpen,G]=useState(true),[events,E]=useState(''),[actions,A]=useState(0);
const propose=(next,set)=>{E('proposed:'+next);if(!refuse)set(next)};
return <FloodRoot style={{padding:'1rem'}}><Stack gap="4" style={{maxWidth:'24rem'}}>
<h1>Navigation family</h1><label><input type="checkbox" checked={refuse} onChange={e=>R(e.target.checked)}/>Refuse changes</label>
<label><input type="checkbox" checked={compact} onChange={e=>C(e.target.checked)}/>Compact items</label>
<NavigationItem data-testid="disclosure-only" label="Resources" icon={icon} compact={compact} disclosure={{expanded:only,onExpandedChange:next=>propose(next,O),label:(only?'Collapse':'Expand')+' Resources',controls:'resource-content'}}/>
{only&&<div id="resource-content">Resource destinations</div>}
<NavigationItem data-testid="split-item" label="Projects" href="#__projects" icon={icon} current linkProps={{onClick:event=>E(event.ctrlKey?'modified-link':'plain-link')}} disclosure={{expanded:split,onExpandedChange:next=>propose(next,S),label:(split?'Collapse':'Expand')+' Projects',controls:'project-content'}}/>
{split&&<div id="project-content">Project destinations</div>}
<NavigationItem data-testid="action-item" label="Create project" icon={icon} onAction={()=>A(n=>n+1)}/>
<NavigationItem data-testid="disabled-item" label="Unavailable" href="#__unavailable" icon={icon} disabled disclosure={{expanded:false,onExpandedChange:()=>E('disabled-expanded'),label:'Expand unavailable'}}/>
<NavigationItem data-testid="metadata-item" label="Activity" href="#__activity" icon={icon} compact={compact} trailing={<Badge>4</Badge>}/>
{compact&&<div data-testid="compact-branch"><NavigationTree label="Compact projects" compact currentValue="design" items={[{value:'projects',label:'Projects',href:'#__projects',icon,children:[{value:'design',label:'Design system',href:'#__design'}]}]}/></div>}
<NavigationGroup label="Saved views" collapsible expanded={groupOpen} onExpandedChange={next=>propose(next,G)} compact={compact} headingAction={<Button size="sm" onClick={()=>A(n=>n+1)}>Add saved view</Button>}><NavigationItem label="Assigned to me" href="#__assigned" icon={icon} compact={compact}/></NavigationGroup>
<NavigationGroup label="Utilities" hideLabel separator><NavigationItem label="Help" href="#__help" icon={icon}/></NavigationGroup>
<NavigationGroup label="Fixed section" collapsible collapseDisabled><NavigationItem label="Still usable" href="#__usable" icon={icon}/></NavigationGroup>
<Button>Outside</Button><output aria-label="Events">{events}</output><output aria-label="Action count">{actions}</output>
</Stack></FloodRoot>};createRoot(document.getElementById('app')).render(<App/>);`);
  const result=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{write:false,cssCodeSplit:false,lib:{entry,formats:['iife'],name:'NavigationFamilyFixture'}}});
  const output=(Array.isArray(result)?result:[result]).flatMap(result=>'output'in result?result.output:[]);
  const js=output.filter(item=>item.type==='chunk').map(item=>item.type==='chunk'?item.code:'').join('\n');
  const css=output.filter(item=>item.type==='asset'&&item.fileName.endsWith('.css')).map(item=>item.type==='asset'?String(item.source):'').join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Navigation family</title><style>body{margin:0}${css}</style></head><body><main id="app"></main><script>${js.replace(/<\/script/gi,'<\\/script')}</script></body></html>`;
}
async function open(page:Page){bundle??=fixture();await page.route('**/__navigation-family.html',async route=>route.fulfill({contentType:'text/html',body:await bundle}));await page.goto('/__navigation-family.html');await expect(page.getByRole('heading',{name:'Navigation family'})).toBeVisible();await page.evaluate(()=>document.fonts.ready);}

test('disclosure-only item is one full-width action with accepted and refused proposals',async({page})=>{
  await open(page);const row=page.getByTestId('disclosure-only'),control=row.getByRole('button');
  await expect(control).toHaveCount(1);await expect(row.getByRole('link')).toHaveCount(0);
  const outer=(await row.boundingBox())!,target=(await control.boundingBox())!;
  expect(target.width/outer.width).toBeGreaterThan(.9);
  await control.click({position:{x:target.width-12,y:target.height/2}});
  await expect(control).toHaveAttribute('aria-expanded','true');await expect(page.getByText('Resource destinations',{exact:true})).toBeVisible();
  await page.getByRole('checkbox',{name:'Refuse changes',exact:true}).check();await control.press('Enter');
  await expect(page.getByRole('status',{name:'Events',exact:true})).toHaveText('proposed:false');await expect(control).toHaveAttribute('aria-expanded','true');
  await page.getByRole('checkbox',{name:'Refuse changes',exact:true}).uncheck();await control.press('Space');await expect(control).toHaveAttribute('aria-expanded','false');
});

test('page link and sibling disclosure retain separate browser and expansion ownership',async({page})=>{
  await open(page);const row=page.getByTestId('split-item'),link=row.getByRole('link',{name:'Projects',exact:true}),toggle=row.getByRole('button',{name:'Expand Projects',exact:true});
  await expect(link).toHaveAttribute('href','#__projects');await expect(link).toHaveAttribute('aria-current','page');await expect(link).not.toHaveAttribute('aria-expanded');
  expect(await row.locator('a button,button a').count()).toBe(0);
  await link.click();await expect(page).toHaveURL(/#__projects$/);await expect(toggle).toHaveAttribute('aria-expanded','false');
  await toggle.click();await expect(page.getByText('Project destinations',{exact:true})).toBeVisible();await expect(page).toHaveURL(/#__projects$/);
  const modified=await link.evaluate(node=>{let prevented:boolean|undefined;const observe=(event:MouseEvent)=>{prevented=event.defaultPrevented;event.preventDefault()};document.addEventListener('click',observe,{once:true});node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,ctrlKey:true}));return prevented;});
  expect(modified).toBe(false);await expect(page.getByRole('status',{name:'Events',exact:true})).toHaveText('modified-link');await expect(row.getByRole('button',{name:'Collapse Projects',exact:true})).toHaveAttribute('aria-expanded','true');
});

test('shared selected surface contains the primary link and its trailing disclosure',async({page})=>{
  await open(page);const row=page.getByTestId('split-item');
  const geometry=await row.evaluate(node=>{const root=node.getBoundingClientRect(),link=node.querySelector('a')!.getBoundingClientRect(),button=node.querySelector('button')!.getBoundingClientRect();return {background:getComputedStyle(node).backgroundColor,root:{left:root.left,right:root.right},link:{left:link.left,right:link.right},button:{left:button.left,right:button.right}};});
  expect(geometry.background).not.toBe('rgba(0, 0, 0, 0)');
  expect(geometry.link.right).toBeLessThanOrEqual(geometry.button.left+1);
  expect(geometry.button.right).toBeLessThanOrEqual(geometry.root.right+1);
  const centers=await page.locator('[data-testid="disclosure-only"] .flood-navigation-item__indicator svg, [data-testid="split-item"] .flood-navigation-item__disclosure svg, [data-testid="metadata-item"] .flood-badge').evaluateAll(nodes=>nodes.map(node=>{const rect=node.getBoundingClientRect();return rect.left+rect.width/2;}));
  expect(centers).toHaveLength(3);
  expect(Math.max(...centers)-Math.min(...centers), JSON.stringify(centers)).toBeLessThan(1);
});

test('commands stay buttons and disabled destinations cannot navigate or disclose',async({page})=>{
  await open(page);const command=page.getByTestId('action-item');await expect(command.getByRole('link')).toHaveCount(0);await command.getByRole('button').press('Enter');await expect(page.getByRole('status',{name:'Action count',exact:true})).toHaveText('1');
  const disabled=page.getByTestId('disabled-item');await expect(disabled.locator('a[href]')).toHaveCount(0);await expect(disabled.getByRole('link')).toHaveAttribute('aria-disabled','true');for(const button of await disabled.getByRole('button').all())await expect(button).toBeDisabled();
  expect(new URL(page.url()).hash).not.toBe('#__unavailable');await expect(page.getByRole('status',{name:'Events',exact:true})).not.toHaveText('disabled-expanded');
});

test('compact destinations keep native links with hover and keyboard hints',async({page})=>{
  await open(page);await page.getByRole('checkbox',{name:'Compact items',exact:true}).check();
  const row=page.getByTestId('metadata-item'),link=row.getByRole('link',{name:'Activity',exact:true});
  await expect(link).toHaveAttribute('href','#__activity');await link.hover();await expect(page.getByRole('tooltip',{name:'Activity',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.getByRole('tooltip',{name:'Activity',exact:true})).toBeHidden();
  await page.getByRole('button',{name:'Outside',exact:true}).hover();await page.getByRole('button',{name:'Outside',exact:true}).focus();await link.focus();await expect(page.getByRole('tooltip',{name:'Activity',exact:true})).toBeVisible();
});

test('compact tree branch keeps both the parent destination and child destinations in its flyout',async({page})=>{
  await open(page);await page.getByRole('checkbox',{name:'Compact items',exact:true}).check();
  const trigger=page.getByTestId('compact-branch').getByRole('button',{name:'Projects',exact:true});await trigger.click();
  const panel=page.getByRole('dialog',{name:'Projects',exact:true});await expect(panel.getByRole('link',{name:'Projects',exact:true})).toHaveAttribute('href','#__projects');await expect(panel.getByRole('link',{name:'Design system',exact:true})).toHaveAttribute('href','#__design');
  await expect(page.getByRole('tooltip',{name:'Projects',exact:true})).toBeHidden();await panel.getByRole('link',{name:'Projects',exact:true}).click();await expect(page).toHaveURL(/#__projects$/);await expect(panel).toBeHidden();await expect(trigger).toBeFocused();
});

test('group heading action does not disclose and controlled refusal preserves accepted content',async({page})=>{
  await open(page);const group=page.getByRole('group',{name:'Saved views',exact:true}),heading=group.getByRole('button',{name:'Saved views',exact:true});
  await expect(heading).toHaveAttribute('aria-expanded','true');await group.getByRole('button',{name:'Add saved view',exact:true}).click();
  await expect(heading).toHaveAttribute('aria-expanded','true');await expect(page.getByRole('status',{name:'Action count',exact:true})).toHaveText('1');
  await page.getByRole('checkbox',{name:'Refuse changes',exact:true}).check();await heading.click();
  await expect(page.getByRole('status',{name:'Events',exact:true})).toHaveText('proposed:false');await expect(heading).toHaveAttribute('aria-expanded','true');await expect(group.getByRole('link',{name:'Assigned to me',exact:true})).toBeVisible();
  await page.getByRole('checkbox',{name:'Refuse changes',exact:true}).uncheck();await heading.press('Enter');await expect(heading).toHaveAttribute('aria-expanded','false');await expect(group.getByRole('link',{name:'Assigned to me',exact:true})).toBeHidden();
});

test('compact group keeps destinations reachable and restores the expanded-mode collapse choice',async({page})=>{
  await open(page);const group=page.getByRole('group',{name:'Saved views',exact:true}),heading=group.getByRole('button',{name:'Saved views',exact:true});
  await heading.click();await expect(group.getByRole('link',{name:'Assigned to me',exact:true})).toBeHidden();
  await page.getByRole('checkbox',{name:'Compact items',exact:true}).check();await expect(heading).toBeHidden();await expect(group.getByRole('link',{name:'Assigned to me',exact:true})).toBeVisible();
  await page.getByRole('checkbox',{name:'Compact items',exact:true}).uncheck();await expect(heading).toBeVisible();await expect(heading).toHaveAttribute('aria-expanded','false');await expect(group.getByRole('link',{name:'Assigned to me',exact:true})).toBeHidden();
});

test('optional headings and separators keep group semantics while collapseDisabled does not disable links',async({page})=>{
  await open(page);const group=page.getByRole('group',{name:'Utilities',exact:true});
  await expect(group.locator('.flood-navigation-group__label')).toHaveCount(0);await expect(group).toHaveAttribute('data-separator','true');await expect(group.getByRole('link',{name:'Help',exact:true})).toBeVisible();
  const fixed=page.getByRole('group',{name:'Fixed section',exact:true});await expect(fixed.getByRole('button',{name:'Fixed section',exact:true})).toBeDisabled();await fixed.getByRole('link',{name:'Still usable',exact:true}).click();await expect(page).toHaveURL(/#__usable$/);
  await expect(page.getByRole('menu')).toHaveCount(0);await expect(page.getByRole('tree')).toHaveCount(0);
});
