import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const workflow = await readFile(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');
const releaseScript = workflow.match(/node --input-type=module <<'NODE'\r?\n([\s\S]*?)\r?\n\s+NODE/)?.[1];
assert.ok(releaseScript, 'Exercise the actual release preflight');

test('release recovery accepts only an existing stable published tag', async () => {
  const root = await mkdtemp(join(tmpdir(), 'flood-release-context-'));
  try {
    const output = join(root, 'output');
    const script = join(root, 'preflight.mjs');
    const valid = { tag_name: 'v0.2.9', draft: false, prerelease: false, published_at: '2026-10-30T00:00:00Z' };
    for (const [tag, release, status, accepted] of [
      ['v0.2.9', valid, 200, true],
      ['main', valid, 200, false],
      ['v0.2.9\ninjected=true', valid, 200, false],
      ['v0.2.9', { ...valid, draft: true }, 200, false],
      ['v0.2.9', { ...valid, prerelease: true }, 200, false],
      ['v0.2.9', { ...valid, published_at: null }, 200, false],
      ['v0.2.9', { ...valid, tag_name: 'v0.2.8' }, 200, false],
      ['v0.2.9', valid, 404, false],
    ]) {
      await writeFile(output, '');
      await writeFile(script, `globalThis.fetch = async () => ({ok: ${status === 200}, status: ${status}, json: async () => (${JSON.stringify(release)})});\n${releaseScript}`);
      const result = spawnSync(process.execPath, [script], { env: { ...process.env, RELEASE_TAG: tag, GITHUB_REPOSITORY: 'owner/flood', GITHUB_TOKEN: 'test-placeholder', GITHUB_OUTPUT: output }, encoding: 'utf8' });
      assert.equal(result.status === 0, accepted, `${tag}: ${result.stderr}`);
      assert.equal(await readFile(output, 'utf8'), accepted ? 'tag=v0.2.9\n' : '');
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('mounted checkout trust fixes Git ownership without trusting neighboring repositories', async () => {
  assert.match(workflow, /run: git config --global --add safe\.directory "\$GITHUB_WORKSPACE"/);
  const root = await mkdtemp(join(tmpdir(), 'flood-release-git-'));
  try {
    const checkout = join(root, 'checkout'), neighbor = join(root, 'neighbor');
    const env = { ...process.env, GIT_CONFIG_GLOBAL: join(root, 'gitconfig'), GIT_CONFIG_NOSYSTEM: '1' };
    await writeFile(env.GIT_CONFIG_GLOBAL, '');
    const git = (args, cwd, assumedOwner = true) => spawnSync('git', args, { cwd, env: { ...env, GIT_TEST_ASSUME_DIFFERENT_OWNER: assumedOwner ? '1' : '0' }, encoding: 'utf8' });
    for (const path of [checkout, neighbor]) assert.equal(git(['init', path], root, false).status, 0);
    assert.notEqual(git(['rev-parse', '--show-toplevel'], checkout).status, 0);
    assert.equal(git(['config', '--global', '--add', 'safe.directory', checkout], root).status, 0);
    assert.equal(git(['rev-parse', '--show-toplevel'], checkout).status, 0);
    assert.notEqual(git(['rev-parse', '--show-toplevel'], neighbor).status, 0);
  } finally { await rm(root, { recursive: true, force: true }); }
});
