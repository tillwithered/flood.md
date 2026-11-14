import test from 'node:test';
import assert from 'node:assert/strict';
import { strToU8, zipSync } from 'fflate';
import { findReceipt, matchesBrowserReceipt, matchingMergedPull, trustedBrowserRun } from '../scripts/ci-browser-reuse.mjs';

const repository = 'owner/flood';
const head = 'a'.repeat(40);
const commit = 'b'.repeat(40);
const repo = { full_name: repository };
const run = { id: 11, run_attempt: 2, repository: repo, head_repository: repo, head_sha: head,
  event: 'pull_request', path: '.github/workflows/ci.yml', status: 'completed', conclusion: 'success' };
const expected = { repository, pull: 7, tree: 'c'.repeat(40), baseTree: 'd'.repeat(40), plan: 'e'.repeat(64), scope: 'full' };
const receipt = { schemaVersion: 1, ...expected, head, run: run.id, attempt: run.run_attempt };
const pr = { number: 7, merge_commit_sha: commit, merged_at: '2026-11-14', base: { ref: 'main', repo }, head: { sha: head, repo } };

test('main accepts evidence only for an identical tree, base, coverage and successful run attempt', () => {
  assert.equal(matchesBrowserReceipt(receipt, expected, run), true);
  for (const key of Object.keys(receipt)) assert.equal(matchesBrowserReceipt({ ...receipt, [key]: null }, expected, run), false, key);
  assert.equal(matchesBrowserReceipt(receipt, expected, { ...run, run_attempt: 3 }), false);
  assert.equal(matchesBrowserReceipt(receipt, { ...expected, scope: 'integration' }, run), false);
});

test('browser evidence comes from the expected workflow and same-repository pull request', () => {
  assert.equal(trustedBrowserRun(run, repository, head), true);
  for (const change of [
    { event: 'workflow_dispatch' }, { conclusion: 'cancelled' }, { status: 'in_progress' },
    { path: '.github/workflows/other.yml' }, { head_sha: commit }, { head_repository: { full_name: 'fork/flood' } },
  ]) assert.equal(trustedBrowserRun({ ...run, ...change }, repository, head), false);
  assert.equal(matchingMergedPull([pr], repository, commit), pr);
  for (const change of [{ merge_commit_sha: head }, { merged_at: null }, { base: { ...pr.base, ref: 'feature' } },
    { head: { ...pr.head, repo: { full_name: 'fork/flood' } } }]) {
    assert.equal(matchingMergedPull([{ ...pr, ...change }], repository, commit), undefined);
  }
});

test('the lookup pins the artifact to the successful attempt and rechecks for a rerun', async () => {
  const zip = zipSync({ 'browser-verification.json': strToU8(JSON.stringify(receipt)) });
  const artifact = { id: 15, name: 'browser-verification-2', size_in_bytes: zip.length, expired: false };
  const lookup = async ({ result = run, artifacts = [artifact], target = expected } = {}) => {
    const responses = new Map([
      [`commits/${commit}/pulls?per_page=10`, Response.json([pr])],
      [`actions/workflows/ci.yml/runs?event=pull_request&status=success&head_sha=${head}&per_page=10`, Response.json({ workflow_runs: [run] })],
      ['actions/runs/11/artifacts?name=browser-verification-2&per_page=10', Response.json({ artifacts })],
      ['actions/artifacts/15/zip', new Response(zip)],
      ['actions/runs/11', Response.json(result)],
    ]);
    return findReceipt(target, commit, path => {
      assert.ok(responses.has(path), path);
      return responses.get(path);
    });
  };
  assert.equal(await lookup(), run.id);
  assert.equal(await lookup({ result: { ...run, run_attempt: 3 } }), undefined);
  assert.equal(await lookup({ artifacts: [{ ...artifact, expired: true }] }), undefined);
  assert.equal(await lookup({ target: { ...expected, baseTree: head } }), undefined);
});
