import test from 'node:test';
import assert from 'node:assert/strict';
import { componentFingerprints, selectBrowserFiles } from '../scripts/ci-affected.mjs';
test('affected graph follows shared helpers and composite consumers',()=>{
  const path='packages/react/src/index.tsx';
  const source='const shared = 1; const other = 2; export const Button = () => shared; export const IconButton = () => Button(); export const Text = () => other;';
  const names=['Button','IconButton','Text'];
  const before=componentFingerprints(new Map([[path,source]]),names);
  const after=componentFingerprints(new Map([[path,source.replace('shared = 1','shared = 3')]]),names);
  assert.notEqual(before.get('Button'),after.get('Button'));assert.notEqual(before.get('IconButton'),after.get('IconButton'));assert.equal(before.get('Text'),after.get('Text'));
});
test('affected graph follows imported implementation and cycles',()=>{
  const entry='packages/react/src/index.tsx', child='packages/react/src/button.tsx';
  const before=new Map([[entry,`import { Impl } from './button.js'; export const Button = () => Impl(); export const Text = () => 1;`],[child,`import { Button } from './index.js'; export const Impl = () => Button;`]]);
  const after=new Map(before);after.set(child,before.get(child).replace('() => Button','() => [Button]'));
  const a=componentFingerprints(before,['Button','Text']), b=componentFingerprints(after,['Button','Text']);
  assert.notEqual(a.get('Button'),b.get('Button'));assert.equal(a.get('Text'),b.get('Text'));
});
test('browser selection retains unclassified global checks and composite tests',()=>{
  const catalog=[{name:'Button',slug:'button'},{name:'IconButton',slug:'icon-button'},{name:'Text',slug:'text'}];
  assert.deepEqual(selectBrowserFiles([{path:'global',source:'axe(document)'},{path:'button',source:`page.goto('/components/icon-button')`},{path:'text',source:'Text test'}],catalog,['button','icon-button']),['global','button']);
});
