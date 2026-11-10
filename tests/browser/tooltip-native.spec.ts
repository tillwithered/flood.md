import {test,expect,type Page} from '@playwright/test';
import {build} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

let html:Promise<string>;
async function fixture(){
  const directory=resolve(`.artifacts/tooltip-native-${process.pid}`),entry=resolve(directory,'entry.tsx');await mkdir(directory,{recursive:true});
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll('\\','/'));
  await writeFile(entry,`import React,{useState,useCallback} from ${file('node_modules/react/index.js')};import {createRoot} from ${file('node_modules/react-dom/client.js')};import {FloodRoot,Link,Tooltip,Popover,Button,IconButton,Inline} from ${file('packages/react/src/index.tsx')};import '@flood-md/react/styles.css';
    const glyph=<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="m8 5 7 7-7 7"/></svg>;
    function BranchTrigger({tip,pop}){const ref=useCallback(node=>{tip.ref(node);pop.ref(node);},[tip.ref,pop.ref]);return <IconButton {...pop} {...tip} ref={ref} label="Projects" size="md">{glyph}</IconButton>;}
    function App(){const[open,setOpen]=useState(false),[clicks,setClicks]=useState(0);return <FloodRoot><Inline gap="4">
      <Tooltip content="Open documentation" delay={0} trigger={tip=><Link {...tip} id="native-link" href="#__docs" onClick={()=>setClicks(current=>current+1)}>Documentation</Link>}/>
      <Tooltip content="Browse projects" delay={0} disabled={open} trigger={tip=><Popover title="Project navigation" open={open} onOpenChange={setOpen} trigger={pop=><BranchTrigger tip={tip} pop={pop}/>}><Link href="#__project">Design system</Link></Popover>}/>
      <IconButton label="Normal glyph" size="md">{glyph}</IconButton><IconButton label="Small glyph" size="md" iconSize="2xs">{glyph}</IconButton>
      <Button>Elsewhere</Button><output aria-label="Link clicks">{clicks}</output></Inline></FloodRoot>;};createRoot(document.getElementById('app')).render(<App/>);`);
  const result=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{write:false,cssCodeSplit:false,lib:{entry,formats:['iife'],name:'NativeTooltipFixture'}}});
  const output=(Array.isArray(result)?result:[result]).flatMap(result=>'output'in result?result.output:[]);
  const js=output.filter(item=>item.type==='chunk').map(item=>item.type==='chunk'?item.code:'').join('\n'),css=output.filter(item=>item.type==='asset'&&item.fileName.endsWith('.css')).map(item=>item.type==='asset'?String(item.source):'').join('\n');
  return `<html lang="en"><head><style>${css}</style></head><body><main id="app"></main><script>${js.replace(/<\/script/gi,'<\\/script')}</script></body></html>`;
}
async function open(page:Page){html??=fixture();await page.route('**/__tooltip-native.html',async route=>route.fulfill({contentType:'text/html',body:await html}));await page.goto('/__tooltip-native.html');}

test('Tooltip supports native Link hover focus dismissal and activation without button semantics',async({page})=>{
  await open(page);const link=page.getByRole('link',{name:'Documentation',exact:true}),tip=page.getByRole('tooltip',{name:'Open documentation',exact:true});
  await expect(link).toHaveAttribute('href','#__docs');await expect(link).not.toHaveAttribute('type');await expect(link).not.toHaveAttribute('role');await expect(link).not.toHaveAttribute('aria-haspopup');
  await link.hover();await expect(tip).toBeVisible();await page.keyboard.press('Escape');await expect(tip).toBeHidden();
  await page.getByRole('button',{name:'Elsewhere',exact:true}).hover();await page.getByRole('button',{name:'Elsewhere',exact:true}).focus();await link.focus();await expect(tip).toBeVisible();
  await link.press('Enter');await expect(page.getByRole('status',{name:'Link clicks',exact:true})).toHaveText('1');expect(new URL(page.url()).hash).toBe('#__docs');
  await page.getByRole('button',{name:'Elsewhere',exact:true}).focus();await expect(tip).toBeHidden();
});

test('Tooltip and Popover share one trigger without losing popup or Escape focus ownership',async({page})=>{
  await open(page);const trigger=page.getByRole('button',{name:'Projects',exact:true}),tip=page.getByRole('tooltip',{name:'Browse projects',exact:true}),panel=page.getByRole('dialog',{name:'Project navigation',exact:true});
  await trigger.focus();await expect(tip).toBeVisible();await trigger.press('Enter');
  await expect(panel).toBeVisible();await expect(tip).toBeHidden();await expect(panel.getByRole('link',{name:'Design system',exact:true})).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-haspopup','dialog');await expect(trigger).toHaveAttribute('aria-expanded','true');
  await page.keyboard.press('Escape');await expect(panel).toBeHidden();await expect(trigger).toBeFocused();await expect(trigger).toHaveAttribute('aria-expanded','false');
});

test('IconButton iconSize changes glyph geometry while preserving target dimensions',async({page})=>{
  await open(page);const normal=page.getByRole('button',{name:'Normal glyph',exact:true}),small=page.getByRole('button',{name:'Small glyph',exact:true});
  const a=(await normal.boundingBox())!,b=(await small.boundingBox())!;expect(a.width).toBe(b.width);expect(a.height).toBe(b.height);
  expect((await normal.locator('svg').boundingBox())!.width).toBe(20);expect((await small.locator('svg').boundingBox())!.width).toBe(14);
  await expect(small).not.toHaveAttribute('iconsize');
});
