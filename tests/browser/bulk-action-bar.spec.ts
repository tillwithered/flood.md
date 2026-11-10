import { test, expect, type Page } from '@playwright/test';
import { build } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

let fixtureHTML: Promise<string>;
async function fixture() {
  const file = (path: string) => JSON.stringify(resolve(path).replaceAll('\\', '/'));
  const directory = resolve(`.artifacts/bulk-action-bar-${process.pid}`);
  await mkdir(directory, { recursive: true });
  const entry = resolve(directory, 'entry.tsx');
  await writeFile(entry, `
    import React,{useState} from ${file('node_modules/react/index.js')};
    import {createRoot} from ${file('node_modules/react-dom/client.js')};
    import {BulkActionBar,FloodRoot,Text} from ${file('packages/react/src/index.tsx')};
    import '@flood-md/react/styles.css';
    function Fixture(){
      const [count,setCount]=useState(12),[action,setAction]=useState('');
      const [counter,setCounter]=useState('label');
      window.setBulkCount=setCount; window.setBulkCounter=setCounter;
      return <FloodRoot><div id="host" style={{width:'32rem',maxWidth:'100%'}}>
        <BulkActionBar label="Selected projects" selectionCount={count} counter={counter} onClear={()=>setCount(0)}
          items={[{id:'archive',label:'Archive',priority:3},{id:'pause',label:'Pause',priority:2},{id:'active',label:'Set active',priority:1},{id:'delete',label:'Delete',tone:'danger'}]}
          onAction={setAction}/>
        <Text role="status">{action}</Text>
      </div></FloodRoot>;
    }
    createRoot(document.getElementById('app')).render(<Fixture/>);
  `);
  const built = await build({ configFile: false, logLevel: 'silent', define: { 'process.env.NODE_ENV': JSON.stringify('production') }, build: {
    write: false, cssCodeSplit: false, lib: { entry, formats: ['iife'], name: 'BulkActionFixture' },
  }});
  const outputs = (Array.isArray(built) ? built : [built]).flatMap(result => 'output' in result ? result.output : []);
  const javascript = outputs.filter(item => item.type === 'chunk').map(item => item.type === 'chunk' ? item.code : '').join('\n');
  const css = outputs.filter(item => item.type === 'asset' && item.fileName.endsWith('.css')).map(item => item.type === 'asset' ? String(item.source) : '').join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body><main id="app"></main><script>${javascript.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
}
async function open(page: Page) {
  fixtureHTML ??= fixture();
  await page.route('**/__bulk-action-bar.html', async route => route.fulfill({ contentType: 'text/html', body: await fixtureHTML }));
  await page.goto('/__bulk-action-bar.html');
  await page.evaluate(() => document.fonts.ready);
  return page.getByRole('toolbar', { name: 'Selected projects', exact: true });
}

test('bulk rail limits visible commands and retains every command in More', async ({page}) => {
  await page.setViewportSize({width:1280,height:800});
  const bar = await open(page);
  await expect(bar.getByRole('button',{name:'Archive',exact:true})).toBeVisible();
  await expect(bar.getByRole('button',{name:'Pause',exact:true})).toBeVisible();
  await expect(bar.getByRole('button',{name:'Set active',exact:true})).toHaveCount(0);
  await bar.getByRole('button',{name:'More',exact:true}).click();
  await expect(page.getByRole('menuitem',{name:'Set active',exact:true})).toBeVisible();
  await page.getByRole('menuitem',{name:'Delete',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('delete');
  await expect(bar.getByRole('button',{name:'More',exact:true})).toBeFocused();
  await bar.getByRole('button',{name:'Clear selection',exact:true}).click();
  await expect(bar).toHaveCount(0);
});

test('resizing moves focused commands into overflow without wrapping or losing focus', async ({page}) => {
  await page.setViewportSize({width:1280,height:800});
  const bar = await open(page);
  await bar.getByRole('button',{name:'Pause',exact:true}).focus();
  await page.locator('#host').evaluate(node=>{(node as HTMLElement).style.width='15rem';});
  const more = bar.getByRole('button',{name:'More',exact:true});
  await expect(more).toBeFocused();
  await more.click();
  await page.getByRole('menuitem',{name:'Pause',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('pause');
  await page.locator('#host').evaluate(node=>{(node as HTMLElement).style.width='32rem';});
  await expect(bar.getByRole('button',{name:'Pause',exact:true})).toBeVisible();
  await bar.getByRole('button',{name:'Archive',exact:true}).focus();
  await page.keyboard.press('End');
  await expect(bar.getByRole('button',{name:'Clear selection',exact:true})).toBeFocused();
});

test('narrow enlarged text keeps count More and clear on one reachable capsule', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  const bar = await open(page);
  await page.evaluate(()=>{document.documentElement.style.fontSize='24px';});
  await expect(bar.getByRole('button',{name:'More',exact:true})).toBeVisible();
  const geometry = await bar.evaluate(node=>{
    const rect=node.getBoundingClientRect();
    return {width:rect.width,scrollWidth:node.scrollWidth,clientWidth:node.clientWidth,wrap:getComputedStyle(node).flexWrap,
      centers:Array.from(node.querySelectorAll('button')).map(button=>{const r=button.getBoundingClientRect();return r.y+r.height/2;})};
  });
  expect(geometry.wrap).toBe('nowrap');
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth+1);
  expect(Math.max(...geometry.centers)-Math.min(...geometry.centers)).toBeLessThan(1);
  await bar.getByRole('button',{name:'More',exact:true}).click();
  await page.getByRole('menuitem',{name:'Archive',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('archive');
});

test('counter modes reserve stable command geometry across digit changes and hidden mode frees the slot', async ({page}) => {
  await page.setViewportSize({width:1280,height:800});
  const bar = await open(page);
  for (const mode of ['label','number','none']) {
    await page.evaluate(mode => (window as any).setBulkCounter(mode), mode);
    const counter = bar.locator('.flood-bulk-action-bar__selection');
    if (mode === 'none') await expect(counter).toHaveCount(0);
    else await expect(counter).toHaveAttribute('data-counter',mode);
    const action = bar.getByRole('button',{name:'Archive',exact:true});
    const start = (await action.boundingBox())!.x;
    for (const count of [1,9,10,99,100,999]) {
      await page.evaluate(count => (window as any).setBulkCount(count), count);
      if (mode === 'label') await expect(counter).toHaveText(`${count} selected`);
      if (mode === 'number') {
        await expect(counter.locator('[aria-hidden="true"]')).toHaveText(String(count));
        await expect(counter.locator('.flood-visually-hidden')).toHaveText(`${count} selected`);
      }
      await expect.poll(async () => Math.abs((await action.boundingBox())!.x-start)).toBeLessThan(1);
    }
  }
  await page.getByRole('button',{name:'Clear selection',exact:true}).click();
  await expect(bar).toHaveCount(0);
});
