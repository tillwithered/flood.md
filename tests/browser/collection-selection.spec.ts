import { test, expect, type Page } from '@playwright/test';
import { build } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

let fixtureHTML: Promise<string>;

async function fixture() {
  const file = (path: string) => JSON.stringify(resolve(path).replaceAll('\\', '/'));
  const directory = resolve(`.artifacts/collection-selection-${process.pid}`);
  await mkdir(directory, { recursive: true });
  const entry = resolve(directory, 'entry.tsx');
  await writeFile(entry, `
    import React from ${file('node_modules/react/index.js')};
    import {createRoot} from ${file('node_modules/react-dom/client.js')};
    import {FloodRoot} from '@flood-md/react';
    import '@flood-md/react/styles.css';
    import {ProjectCollection} from ${file('apps/website/src/collections-playground.tsx')};
    window.bulkRequests=[];
    function updateStatus(update){
      window.bulkRequests.push(update);
      return new Promise((resolve,reject)=>{
        window.acceptBulk=resolve;
        window.rejectBulk=()=>reject(Error('Refused'));
      });
    }
    createRoot(document.getElementById('app')).render(
      <FloodRoot><ProjectCollection onUpdateStatus={updateStatus}/></FloodRoot>
    );
  `);
  const built = await build({ configFile: false, logLevel: 'silent', define: { 'process.env.NODE_ENV': JSON.stringify('production') }, build: {
    write: false, cssCodeSplit: false, lib: { entry, formats: ['iife'], name: 'CollectionSelectionFixture' },
  }});
  const outputs = (Array.isArray(built) ? built : [built]).flatMap(result => 'output' in result ? result.output : []);
  const javascript = outputs.filter(item => item.type === 'chunk').map(item => item.type === 'chunk' ? item.code : '').join('\n');
  const css = outputs.filter(item => item.type === 'asset' && item.fileName.endsWith('.css')).map(item => item.type === 'asset' ? String(item.source) : '').join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body><main id="app"></main><script>${javascript.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
}

async function open(page: Page, deferred = false) {
  if (deferred) {
    fixtureHTML ??= fixture();
    const html = await fixtureHTML;
    await page.route('**/__collection-selection.html', route => route.fulfill({ contentType: 'text/html', body: html }));
    await page.goto('/__collection-selection.html');
  } else await page.goto('/playground/collections');
  return page.getByRole('region', { name: 'Projects collection', exact: true });
}

test('floating selection bar leaves the table in place and keeps final controls reachable', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 550 });
  const scope = await open(page);
  const table = scope.getByRole('table', { name: 'Projects', exact: true });
  const before = (await table.boundingBox())!;
  await scope.getByRole('checkbox', { name: 'Select Design system', exact: true }).check();
  const bar = scope.getByRole('toolbar', { name: 'Selected projects', exact: true });
  await expect(bar).toBeVisible();
  expect(Math.abs((await table.boundingBox())!.y - before.y)).toBeLessThan(1);
  const initial = (await bar.boundingBox())!;
  expect(initial.y + initial.height).toBeLessThanOrEqual(550);
  expect(550 - initial.y - initial.height).toBeLessThanOrEqual(24);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  expect(Math.abs((await bar.boundingBox())!.y - initial.y)).toBeLessThan(1);
  const next = (await scope.getByRole('button', { name: 'Next page', exact: true }).boundingBox())!;
  expect(next.y + next.height).toBeLessThan(initial.y);
  await bar.getByRole('button', { name: 'More', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: 'Set active', exact: true })).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(bar.getByRole('button', { name: 'More', exact: true })).toBeFocused();
});

test('selection spans pages and archiving requires confirmation', async ({ page }) => {
  const scope = await open(page);
  await scope.getByRole('checkbox', { name: 'Select Design system', exact: true }).check();
  await scope.getByRole('button', { name: 'Next page', exact: true }).click();
  await scope.getByRole('checkbox', { name: 'Select Onboarding', exact: true }).check();
  const bar = scope.getByRole('toolbar', { name: 'Selected projects', exact: true });
  await expect(bar.getByText('2 selected', { exact: true })).toBeVisible();
  await bar.getByRole('button', { name: 'Archive', exact: true }).click();
  const confirmation = page.getByRole('alertdialog', { name: 'Archive 2 projects?', exact: true });
  await expect(confirmation).toContainText('Design system, Onboarding');
  await confirmation.getByRole('button', { name: 'Keep projects', exact: true }).click();
  await expect(scope.getByRole('checkbox', { name: 'Select Onboarding', exact: true })).toBeChecked();
  await expect(bar.getByRole('button', { name: 'Archive', exact: true })).toBeFocused();
  await bar.getByRole('button', { name: 'Archive', exact: true }).click();
  await confirmation.getByRole('button', { name: 'Archive projects', exact: true }).click();
  await expect(scope.getByRole('status').filter({ hasText: '2 projects archived.' })).toBeVisible();
  await expect(bar).toHaveCount(0);
  await expect(scope).toBeFocused();
  await expect(scope.getByRole('row').filter({ hasText: 'Design system' })).toContainText('Archived');
  await scope.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(scope.getByRole('row').filter({ hasText: 'Onboarding' })).toContainText('Archived');
});

test('a narrow floating rail confirms an overflow command and restores its persistent opener', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const scope = await open(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '24px'; });
  await scope.getByRole('checkbox', { name: 'Select Design system', exact: true }).check();
  const bar = scope.getByRole('toolbar', { name: 'Selected projects', exact: true });
  const more = bar.getByRole('button', { name: 'More', exact: true });
  await more.click();
  await page.getByRole('menuitem', { name: 'Archive', exact: true }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Archive 1 project?', exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Keep projects', exact: true }).click();
  await expect(more).toBeFocused();
  await expect(scope.getByRole('checkbox', { name: 'Select Design system', exact: true })).toBeChecked();
});

test('refusal preserves records and selection, retry accepts the captured proposal', async ({ page }) => {
  const scope = await open(page, true);
  await scope.getByRole('checkbox', { name: 'Select Design system', exact: true }).check();
  const bar = scope.getByRole('toolbar', { name: 'Selected projects', exact: true });
  await bar.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(scope.locator('.flood-bulk-action-bar')).toHaveAttribute('aria-busy', 'true');
  await expect(bar.getByRole('button', { name: 'Archive', exact: true })).toBeDisabled();
  await page.evaluate(() => (window as any).rejectBulk());
  await expect(scope.getByRole('status').filter({ hasText: 'Couldn’t update 1 project.' })).toBeVisible();
  await expect(scope.getByRole('checkbox', { name: 'Select Design system', exact: true })).toBeChecked();
  await expect(scope.getByRole('row').filter({ hasText: 'Design system' })).toContainText('Active');
  await scope.getByRole('button', { name: 'Retry update', exact: true }).click();
  expect(await page.evaluate(() => (window as any).bulkRequests)).toEqual([
    { ids: ['design'], status: 'paused' }, { ids: ['design'], status: 'paused' },
  ]);
  await page.evaluate(() => (window as any).acceptBulk());
  await expect(scope.getByRole('row').filter({ hasText: 'Design system' })).toContainText('Paused');
  await expect(scope.getByRole('button', { name: 'Retry update', exact: true })).toHaveCount(0);
  await expect(bar).toHaveCount(0);
  await expect(scope).toBeFocused();
});

test('pending work updates captured IDs and preserves a later selection', async ({ page }) => {
  const scope = await open(page, true);
  await scope.getByRole('checkbox', { name: 'Select Design system', exact: true }).check();
  await scope.getByRole('toolbar').getByRole('button', { name: 'Pause', exact: true }).click();
  await scope.getByRole('searchbox', { name: 'Search projects', exact: true }).fill('Checkout');
  await scope.getByRole('checkbox', { name: 'Select Checkout', exact: true }).check();
  await page.evaluate(() => (window as any).acceptBulk());
  await expect(scope.getByRole('checkbox', { name: 'Select Checkout', exact: true })).toBeChecked();
  await expect(scope.getByRole('row').filter({ hasText: 'Checkout' })).toContainText('Active');
  await scope.getByRole('toolbar').getByRole('button', { name: 'Clear selection', exact: true }).click();
  await expect(scope).toBeFocused();
  await scope.getByRole('searchbox', { name: 'Search projects', exact: true }).fill('Design');
  await expect(scope.getByRole('row').filter({ hasText: 'Design system' })).toContainText('Paused');
});
