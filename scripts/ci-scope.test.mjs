import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scopeFor, withoutReleaseVersion } from './ci-scope.mjs';
test('dock-only patch checks frontend', () => {
  assert.deepEqual(scopeFor(['src/components/Dock.svelte']), { frontend: true, packages: [] });
});
test('shared contracts include consumers', () => {
  assert.deepEqual(scopeFor(['crates/flood-connectors/src/lib.rs']).packages, ['flood-core','flood-connectors','flood-github','flood-mcp','flood-desktop']);
});
test('native changes check desktop and frontend', () => {
  assert.deepEqual(scopeFor(['src-tauri/src/codex_connection.rs']), { frontend: true, packages: ['flood-desktop'] });
});
test('unknown paths and infrastructure require full checks', () => {
  for (const file of ['Cargo.lock','Cargo.toml','.github/workflows/ci.yml','new-package/code.rs','scripts/ci-scope.mjs']) assert.equal(scopeFor([file]).packages.length, 5);
});
test('documentation-only changes do not rebuild', () => {
  assert.deepEqual(scopeFor(['README.md','CHANGELOG.md']), { frontend: false, packages: [] });
});
test('release version bumps do not hide dependency changes', () => {
  const before = '[workspace.package]\nversion = "0.2.0"\n[workspace.dependencies]\nserde = "1.0"';
  assert.equal(withoutReleaseVersion('Cargo.toml', before), withoutReleaseVersion('Cargo.toml', before.replace('0.2.0','0.2.1')));
  assert.notEqual(withoutReleaseVersion('Cargo.toml', before), withoutReleaseVersion('Cargo.toml', before.replace('1.0','2.0')));
  const lock = 'name = "flood-core"\nversion = "0.2.0"\nname = "serde"\nversion = "1.0"';
  assert.equal(withoutReleaseVersion('Cargo.lock', lock), withoutReleaseVersion('Cargo.lock', lock.replace('0.2.0','0.2.1')));
  assert.notEqual(withoutReleaseVersion('Cargo.lock', lock), withoutReleaseVersion('Cargo.lock', lock.replace('1.0','2.0')));
});
