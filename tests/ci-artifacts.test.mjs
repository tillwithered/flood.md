import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCandidate, packageNames, digest } from '../scripts/ci-artifacts.mjs';
test('candidate rejects mismatched source, lockfile, version and unsafe archives', () => {
  const identity = {commit:'a'.repeat(40),tree:'b'.repeat(40),lock:digest('lock'),version:'0.2.8'};
  const manifest = {schemaVersion:1,...identity,packages:packageNames.map(name=>({name,file:`flood-md-${name}-0.2.8.tgz`,sha256:digest(name)}))};
  validateCandidate(manifest,identity);
  for (const key of ['commit','tree','lock','version']) assert.throws(()=>validateCandidate({...manifest,[key]:'wrong'},identity));
  for (const packages of [manifest.packages.slice(1), [...manifest.packages].reverse(), manifest.packages.map(p=>({...p,file:'../escape.tgz'})),manifest.packages.map(p=>({...p,sha256:'bad'}))]) assert.throws(()=>validateCandidate({...manifest,packages},identity));
});
