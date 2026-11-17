import {test,expect} from '@playwright/test';
import {chooseSelectOption} from './select-helpers';

test('empty filtering keeps table context and reset restores rows plus persistent focus',async({page})=>{
  await page.goto('/playground/collections');
  const scope=page.getByRole('region',{name:'Projects collection',exact:true});
  const search=scope.getByRole('searchbox',{name:'Search projects',exact:true});
  await search.fill('No project can match this');
  const table=scope.getByRole('table',{name:'Projects',exact:true});
  await expect(table).toBeVisible();
  await expect(table.getByRole('columnheader')).toHaveCount(5);
  await expect(table.getByRole('heading',{name:'No matching projects',exact:true})).toBeVisible();
  await expect(table.getByRole('checkbox')).toBeDisabled();
  await expect(table.getByRole('button',{name:/clear|reset filters/i})).toHaveCount(0);
  await scope.getByRole('button',{name:'Clear filters',exact:true}).click();
  await expect(search).toHaveValue('');
  await expect(scope.getByRole('button',{name:'Filters',exact:true})).toBeFocused();
  await expect(table.getByText('Design system',{exact:true})).toBeVisible();
});

test('row states keep recovery at the end on wide surfaces and wrap it under the message in narrow ones', async ({page}, info) => {
  await page.setViewportSize({width:1440,height:940});
  await page.goto('/components/error-state');
  await chooseSelectOption(page.getByRole('combobox',{name:'ErrorState prop layout'}),'row');
  const state = page.locator('.preview-stage .flood-error-state');
  const heading = state.getByRole('heading');
  const retry = state.getByRole('button',{name:'Try again',exact:true});
  await expect(retry).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const edge = await state.boundingBox();
  const wideCommand = await retry.boundingBox();
  expect(wideCommand!.x + wideCommand!.width).toBeCloseTo(edge!.x + edge!.width,0);
  expect(wideCommand!.x).toBeGreaterThan((await heading.boundingBox())!.x);
  await state.screenshot({path:info.outputPath('error-state-row.png')});

  await page.setViewportSize({width:390,height:844});
  await page.evaluate(() => { document.documentElement.dir='rtl'; });
  const narrowCommand = await retry.boundingBox();
  const narrowHeading = await heading.boundingBox();
  expect(narrowCommand!.x + narrowCommand!.width).toBeCloseTo(narrowHeading!.x + narrowHeading!.width,0);
  expect(narrowCommand!.y).toBeGreaterThan(narrowHeading!.y + narrowHeading!.height);
  expect(await state.evaluate(node=>node.scrollWidth-node.clientWidth)).toBeLessThanOrEqual(1);
  await state.screenshot({path:info.outputPath('error-state-row-narrow.png')});

  await retry.press('Enter');
  await expect(page.getByRole('list',{name:'Project activity',exact:true})).toBeFocused();
});

test('visible loading explains the wait without adding a second status announcement', async ({page}, info) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/components/loading-state');
  const loading = page.locator('.preview-stage .flood-loading-state');
  const label = 'Loading project activity…';
  await expect(loading.getByText(label,{exact:true})).toBeVisible();
  await expect(loading.getByRole('heading')).toHaveCount(0);
  await expect(loading.getByRole('status')).toHaveCount(0);
  await page.getByRole('checkbox',{name:'LoadingState prop announce',exact:true}).check();
  await expect(loading.getByRole('status')).toHaveText(label);
  await expect(loading.locator('.flood-loading')).toHaveAttribute('aria-hidden','true');
  expect(await loading.locator('.flood-spinner').evaluate(node=>getComputedStyle(node).animationName)).toBe('none');
  await loading.screenshot({path:info.outputPath('loading-state.png')});

  await page.goto('/components/data-table');
  const frame = page.locator('.preview-stage .flood-data-table');
  const table = frame.getByRole('table');
  const state = page.getByRole('combobox',{name:'DataTable prop state',exact:true});
  await chooseSelectOption(page.getByRole('combobox',{name:'DataTable prop loadingAppearance',exact:true}),'message');
  await chooseSelectOption(state,'loading');
  await expect(table).toHaveAttribute('aria-busy','true');
  await expect(frame.locator('.flood-loading-state').getByText('Loading rows…',{exact:true})).toBeVisible();
  await expect(frame.getByRole('status').filter({hasText:'Loading rows…'})).toHaveCount(1);
  await expect(frame.locator('.flood-data-table__activity')).not.toHaveAttribute('aria-busy');
  await frame.screenshot({path:info.outputPath('table-loading-message.png')});
  await chooseSelectOption(state,'ready');
  await expect(table).not.toHaveAttribute('aria-busy');
  await expect(frame.locator('.flood-loading-state')).toHaveCount(0);
  await expect(table.getByText('Design system',{exact:true})).toBeVisible();
});

test('custom empty content is ready-only; loading and error keep their owners and retry restores actual rows',async({page})=>{
  await page.goto('/components/data-table');
  const table=page.locator('.preview-stage .flood-data-table');
  const state=page.getByRole('combobox',{name:'DataTable prop state',exact:true});
  const empty=page.getByRole('checkbox',{name:'DataTable prop emptyRows',exact:true});
  await empty.check();
  await expect(table.getByRole('heading',{name:'No projects yet',exact:true})).toBeVisible();
  await page.getByRole('checkbox',{name:'DataTable prop customEmpty',exact:true}).uncheck();
  await expect(table.getByText('No results found.',{exact:true})).toBeVisible();
  await page.getByRole('checkbox',{name:'DataTable prop customEmpty',exact:true}).check();
  await empty.uncheck();
  await chooseSelectOption(state,'loading');
  await expect(table).toHaveAttribute('aria-busy','true');
  await expect(table.getByRole('heading')).toHaveCount(0);
  await chooseSelectOption(state,'error');
  const failure = table.getByRole('heading',{name:'Could not load the rows.',exact:true});
  await expect(failure).toBeVisible();
  await expect(table.getByRole('heading',{name:'No projects yet',exact:true})).toHaveCount(0);
  const retry = table.getByRole('button',{name:'Try again',exact:true});
  const withinViewport = () => retry.evaluate(node => {
    const viewport = node.closest('.flood-scroll-area__viewport')!.getBoundingClientRect();
    const button = node.getBoundingClientRect();
    return button.left >= viewport.left && button.right <= viewport.right;
  });
  await expect.poll(withinViewport).toBe(true);
  await page.getByRole('checkbox',{name:'DataTable prop customError',exact:true}).check();
  await expect(table.locator('.flood-error-state')).toHaveAttribute('data-layout','row');
  await retry.evaluate(node => {
    const viewport = node.closest('.flood-scroll-area__viewport')!;
    viewport.scrollLeft = viewport.scrollWidth;
  });
  await expect.poll(withinViewport).toBe(true);
  await table.getByRole('button',{name:'Try again',exact:true}).click();
  await expect(table.getByText('Design system',{exact:true})).toBeVisible();
  await expect(failure).toHaveCount(0);
  await expect(table.locator('.flood-error-state')).toHaveCount(0);
});

test('inline error keeps one recovery action and hands focus to restored content',async({page})=>{
  await page.goto('/components/error-state');
  await chooseSelectOption(page.getByRole('combobox',{name:'ErrorState prop layout'}),'inline');
  const state=page.locator('.flood-error-state');
  const retry=state.getByRole('button',{name:'Try again',exact:true});
  await expect(state).toHaveAttribute('data-layout','inline');
  await retry.focus();
  const position = await retry.boundingBox();
  const retrying = page.getByRole('checkbox',{name:'ErrorState prop retrying'});
  await retrying.evaluate(node => (node as HTMLInputElement).click());
  await expect(retry).toBeDisabled();
  await expect(retry).toHaveAttribute('aria-busy','true');
  await expect(retry).toBeFocused();
  expect(await retry.boundingBox()).toEqual(position);
  await retry.press('Enter');
  await expect(state).toBeVisible();
  await retrying.evaluate(node => (node as HTMLInputElement).click());
  await retry.press('Enter');
  const restored=page.getByRole('list',{name:'Project activity',exact:true});
  await expect(restored).toContainText('Design review completed');
  await expect(restored).toBeFocused();
  await expect(state).toBeHidden();
});

test('CardSkeleton reserves the same card frame across loading and ready states', async ({page}, info) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/components/card-skeleton');
  const card = page.locator('.preview-stage .flood-card');
  const loaded = page.getByRole('checkbox',{name:'CardSkeleton prop loaded'});
  const density = page.getByRole('combobox',{name:'CardSkeleton prop density'});
  for (const size of ['comfortable','compact']) {
    await chooseSelectOption(density,size);
    await expect(card).toHaveAttribute('aria-hidden','true');
    await expect(card.locator('.flood-skeleton')).toHaveCount(6);
    expect(await card.locator('.flood-skeleton').first().evaluate(node => getComputedStyle(node).animationName)).toBe('none');
    const loading = (await card.boundingBox())!;
    await loaded.check();
    await expect(card.getByRole('heading',{name:'Project details'})).toBeVisible();
    const ready = (await card.boundingBox())!;
    expect(ready.height).toBeCloseTo(loading.height,1);
    expect(ready.width).toBeCloseTo(loading.width,1);
    await loaded.uncheck();
  }
  await page.getByRole('checkbox',{name:'CardSkeleton prop showMedia'}).check();
  const media = card.locator('.flood-card__media');
  const loadingMedia = (await media.boundingBox())!;
  const placeholder = media.locator('.flood-skeleton');
  expect((await placeholder.boundingBox())!.height).toBeCloseTo(loadingMedia.height,0);
  await card.screenshot({path:info.outputPath('card-with-media-loading.png')});
  await loaded.check();
  await expect(media.locator('img')).toBeVisible();
  expect((await media.boundingBox())!.height).toBeCloseTo(loadingMedia.height,0);
  await card.screenshot({path:info.outputPath('card-with-media-loaded.png')});
  if (info.project.name === 'desktop') {
    await loaded.uncheck();
    await page.getByRole('checkbox',{name:'CardSkeleton prop longDescription'}).check();
    const descriptionLines = card.locator('.flood-card__intro > .flood-text .flood-card-skeleton__line');
    await expect(descriptionLines).toHaveCount(2);
    const wrappedLoading = (await card.boundingBox())!.height;
    await card.screenshot({path:info.outputPath('card-description-loading.png')});
    await loaded.check();
    await expect(card.getByText('The release moved to 12 November while the team checks the final artwork.')).toBeVisible();
    expect((await card.boundingBox())!.height).toBeCloseTo(wrappedLoading,0);
    await card.screenshot({path:info.outputPath('card-description-loaded.png')});
    await page.getByRole('checkbox',{name:'CardSkeleton prop narrow'}).check();
    const narrowReady = (await card.boundingBox())!.height;
    await loaded.uncheck();
    expect((await card.boundingBox())!.height).toBeCloseTo(narrowReady,0);
  }
});

test('selectable cards keep the checkbox track through loading without a phantom control', async ({page}, info) => {
  await page.goto('/components/card-skeleton');
  const card = page.locator('.preview-stage .flood-card');
  const knob = (name:string) => page.getByRole('checkbox',{name:`CardSkeleton prop ${name}`,exact:true});
  await knob('selectable').check();
  await knob('narrow').check();
  await page.evaluate(()=>document.fonts.ready);
  const selection = card.locator('.flood-card__selection');
  const intro = card.locator('.flood-card__intro');
  const frame = async () => {
    const root = (await card.boundingBox())!;
    const slot = (await selection.boundingBox())!;
    return {x:slot.x-root.x,y:slot.y-root.y,width:slot.width,height:slot.height};
  };
  await expect(selection.locator('.flood-skeleton')).toBeVisible();
  await expect(card.locator('input, button, a, [tabindex]')).toHaveCount(0);
  const loadingFrame = await frame();
  const loadingIntro = (await intro.boundingBox())!.width;
  await card.screenshot({path:info.outputPath('card-selection-loading.png')});
  await knob('loaded').check();
  const checkbox = card.getByRole('checkbox',{name:'Select project'});
  await expect(checkbox).toBeVisible();
  expect(await frame()).toEqual(loadingFrame);
  expect((await intro.boundingBox())!.width).toBe(loadingIntro);
  await card.screenshot({path:info.outputPath('card-selection-ready.png')});
  await checkbox.press('Space');
  await expect(checkbox).toBeChecked();
  await expect(card.getByRole('button',{name:'Open project'})).toBeEnabled();
});
