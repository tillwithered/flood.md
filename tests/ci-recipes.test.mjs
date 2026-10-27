import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { changedRecipes } from '../scripts/ci-recipes.mjs';

const source = `const select = (x) => x; const knobs = {button: [select('sm')], input: []}; function recipeFor(slug) { switch(slug) {case 'button': return element('Button', {size:'sm'}); case 'input': return element('Input'); default: return null;} }`;
test('recipe scope follows exact slug controls and branches', () => {
  assert.deepEqual(changedRecipes(source, source.replace("size:'sm'", "size:'lg'"), ['button','input']), ['button']);
  assert.deepEqual(changedRecipes(source, source.replace("select('sm')", "select('lg')"), ['button','input']), ['button']);
  assert.deepEqual(changedRecipes(source, '\n' + source, ['button','input']), []);
});
test('shared rendering, defaults and unknown syntax retain full scope', () => {
  assert.throws(() => changedRecipes(source, source.replace('(x) => x', '(x) => [x]'), ['button','input']), /Shared/);
  assert.throws(() => changedRecipes(source, source.replace('default: return null', 'default: return element("Button")'), ['button','input']), /Shared/);
  assert.throws(() => changedRecipes(source, source.replace("case 'button': return element('Button', {size:'sm'});", "case 'button': element('Button');"), ['button','input']), /fallthrough/);
  assert.throws(() => changedRecipes(source, source.replace('button: [', '[dynamic]: ['), ['button','input']), /Unknown/);
  assert.throws(() => changedRecipes(source, source.replace("case 'input'", "case 'button'"), ['button','input']), /duplicate/);
});
test('grouped recipe labels include the shared branch for every alias', () => {
  const grouped = source.replace("case 'button': return element('Button', {size:'sm'});", "case 'button':");
  assert.deepEqual(changedRecipes(grouped, grouped.replace("element('Input')", "element('Input', {size:'lg'})"), ['button','input']), ['button','input']);
});
test('actual playground precision edit scopes one recipe; shared registry edits fail closed', () => {
  const actual = readFileSync('apps/website/src/component-workbench.tsx', 'utf8');
  const slugs = JSON.parse(readFileSync('apps/website/src/component-catalog.json')).map(c => c.slug);
  const edit = actual.replace('defaultValue:v.precision === "second"?"09:30:00":"09:30"', 'defaultValue:v.precision === "second"?"10:30:00":"10:30"');
  assert.notEqual(edit, actual);
  assert.deepEqual(changedRecipes(actual, edit, slugs), ['time-field']);
  assert.throws(() => changedRecipes(actual, actual.replace('...Flood, Plus', '...Flood, ArrowRight, Plus'), slugs), /Shared/);
});
