import { test, expect, type Locator, type Page } from '@playwright/test';

async function open(page: Page) {
  await page.goto('/playground/surfaces');
  await expect(page.locator('[data-study-controls="overlay"]')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function appearance(node: Locator) {
  return node.evaluate(element => {
    const rgba = (value: string) => {
      const values = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0, values[3] ?? 1];
    };
    const chain: Element[] = [];
    for (let current: Element | null = element; current; current = current.parentElement) chain.unshift(current);
    let background = [24, 24, 24];
    let parent = background;
    for (const current of chain) {
      const color = rgba(getComputedStyle(current).backgroundColor);
      parent = background;
      background = background.map((channel, i) => color[i] * color[3] + channel * (1 - color[3]));
    }
    const css = getComputedStyle(element);
    return { background, parent, color: rgba(css.color), fill: css.backgroundColor,
      border: css.borderTopColor, focus: css.outlineColor, current: css.getPropertyValue('--flood-sys-color-surface-current').trim() };
  });
}

test('neutral roles adapt across materials while content, selection and focus retain hierarchy', async ({ page }) => {
  await open(page);
  for (const material of ['base', 'default', 'overlay', 'raised']) {
    const controls = page.locator(`[data-study-controls="${material}"]`);
    const secondary = controls.getByRole('button', { name: 'Secondary', exact: true });
    const input = controls.getByRole('textbox', { name: 'Project', exact: true });
    const rest = await appearance(secondary), field = await appearance(input);
    // A quiet action is distinguishable without becoming a dark island on its owner.
    expect(rest.background[0] - rest.parent[0]).toBeGreaterThan(3);
    expect(rest.background[0] - rest.parent[0]).toBeLessThan(20);
    expect(field.background[0] - field.parent[0]).toBeGreaterThan(3);
    expect(field.background[0] - field.parent[0]).toBeLessThan(20);
    expect(field.color.slice(0, 3)).toEqual([255, 255, 255]);
    await secondary.hover();
    await expect.poll(async () => (await appearance(secondary)).background[0]).toBeGreaterThan(rest.background[0]);
    await input.focus();
    await expect(input).toHaveCSS('border-color', 'rgb(255, 92, 168)');
    await expect(input).toHaveCSS('border-width', '2px');
    const selected = await appearance(controls.getByRole('button', { name: 'Selected', exact: true }));
    const unselected = await appearance(controls.getByRole('button', { name: 'Unselected', exact: true }));
    expect(selected.background[0]).toBeGreaterThan(unselected.background[0]);
    await expect(controls.getByRole('button', { name: 'Disabled', exact: true })).toBeDisabled();
    const readonly = controls.getByRole('textbox', { name: 'Read only', exact: true });
    await readonly.focus(); await readonly.pressSequentially('changed');
    await expect(readonly).toHaveValue('Workspace');
    expect((await appearance(controls.locator('.flood-tag'))).background[0]).toBeGreaterThan(rest.parent[0]);
    expect((await appearance(controls.locator('.flood-indicator__track'))).background[0]).toBeGreaterThan(rest.parent[0]);
  }
});

test('nested owners reset material context and a real top-layer chooser establishes its own context', async ({ page }) => {
  await open(page);
  const standalone = await appearance(page.locator('[data-study-controls="default"]').getByRole('textbox', { name: 'Project', exact: true }));
  await page.getByRole('button', { name: 'Open dialog', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Project settings', exact: true });
  const nested = await appearance(dialog.locator('[data-study-controls="nested"]').getByRole('textbox', { name: 'Project', exact: true }));
  expect(nested.background).toEqual(standalone.background);
  const field = dialog.locator('[data-study-controls="dialog"]').getByRole('combobox', { name: 'Visibility', exact: true });
  await field.click();
  const option = page.getByRole('option', { name: 'Team', exact: true });
  await expect(option).toBeVisible();
  const material = await option.evaluate(node => {
    const style = getComputedStyle(node);
    return {
      current: style.getPropertyValue('--flood-sys-color-surface-current'),
      floating: style.getPropertyValue('--flood-sys-color-surface-floating'),
      overlay: style.getPropertyValue('--flood-sys-color-surface-overlay'),
    };
  });
  expect(material.current).toBe(material.floating);
  expect(material.current).not.toBe(material.overlay);
  await option.click();
  await expect(field).toContainText('Team');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open dialog', exact: true })).toBeFocused();
});

test('context overrides and reduced transparency survive nested panels and system colors', async ({ page }) => {
  await open(page);
  await page.locator('.flood-root').evaluate(node => {
    const root = node as HTMLElement;
    root.dataset.floodTransparency = 'reduced';
    root.style.setProperty('--flood-sys-color-context-filled-field-border', 'rgb(138, 138, 138)');
  });
  await expect(page.locator('[data-study-controls="overlay"]').getByRole('textbox', { name: 'Project', exact: true })).toHaveCSS('border-color', 'rgb(138, 138, 138)');
  await expect(page.locator('[data-study-controls="base"]').getByRole('textbox', { name: 'Project', exact: true })).toHaveCSS('border-color', 'rgb(56, 56, 56)');
  await page.getByRole('button', { name: 'Open popover', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Project filters', exact: true });
  await expect(panel).toHaveCSS('background-color', 'rgb(56, 56, 56)');
  await expect(panel).toHaveCSS('backdrop-filter', 'none');
  await page.emulateMedia({ forcedColors: 'active' });
  const system = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.cssText = 'background:Canvas;color:CanvasText';
    document.querySelector('.flood-root')!.append(probe);
    const css = getComputedStyle(probe), result = { background: css.backgroundColor, color: css.color };
    probe.remove(); return result;
  });
  await expect(panel).toHaveCSS('background-color', system.background);
  const input = panel.getByRole('textbox', { name: 'Project', exact: true });
  await input.focus();
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS('color', system.color);
});
