import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sha = /^[a-f0-9]{40}$/;
const workflow = '.github/workflows/ci.yml';
const validatedScopes = ['full', 'publication', 'integration'];
const receiptFile = '.artifacts/browser-verification.json';
const maxReceipt = 32 * 1024;

export function matchesBrowserReceipt(receipt, expected, run) {
  return receipt?.schemaVersion === 1 && validatedScopes.includes(expected.scope) &&
    receipt.repository === expected.repository && receipt.pull === expected.pull &&
    receipt.head === run.head_sha && receipt.run === run.id && receipt.attempt === run.run_attempt &&
    receipt.tree === expected.tree && receipt.baseTree === expected.baseTree &&
    receipt.scope === expected.scope && receipt.plan === expected.plan;
}

export function matchingMergedPull(pulls, repository, commit) {
  return pulls.find(item => item.merge_commit_sha === commit && item.merged_at &&
    Number.isSafeInteger(item.number) && item.number > 0 &&
    item.base?.ref === 'main' && item.base.repo?.full_name === repository &&
    item.head?.repo?.full_name === repository && sha.test(item.head.sha));
}

export function trustedBrowserRun(run, repository, head) {
  return run?.repository?.full_name === repository && run.head_repository?.full_name === repository &&
    run.head_sha === head && run.event === 'pull_request' && run.path === workflow &&
    run.status === 'completed' && run.conclusion === 'success' &&
    Number.isSafeInteger(run.id) && run.id > 0 &&
    Number.isSafeInteger(run.run_attempt) && run.run_attempt > 0;
}

function git(...args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0) throw Error('Git tree unavailable');
  return result.stdout.trim();
}

function identity(repository, base, scope, plan) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? '') || !sha.test(base ?? '') ||
      !validatedScopes.includes(scope) || !/^[a-f0-9]{64}$/.test(plan ?? '')) throw Error('Missing bounded CI scope');
  return { repository, scope, tree: git('rev-parse', 'HEAD^{tree}'),
    baseTree: git('rev-parse', base + '^{tree}'), plan };
}

export async function findReceipt(expected, commit, api) {
  const json = async path => {
    const response = await api(path);
    if (!response.ok) throw Error('GitHub verification lookup unavailable');
    return response.json();
  };
  const pulls = await json(`commits/${commit}/pulls?per_page=10`);
  const pr = matchingMergedPull(pulls, expected.repository, commit);
  if (!pr) return;
  const { workflow_runs: runs } = await json(`actions/workflows/ci.yml/runs?event=pull_request&status=success&head_sha=${pr.head.sha}&per_page=10`);
  const run = runs.find(item => trustedBrowserRun(item, expected.repository, pr.head.sha));
  if (!run) return;
  const { artifacts } = await json(`actions/runs/${run.id}/artifacts?name=browser-verification-${run.run_attempt}&per_page=10`);
  const matches = artifacts.filter(item => item.name === `browser-verification-${run.run_attempt}` && !item.expired);
  const [artifact] = matches;
  if (matches.length !== 1 || !Number.isSafeInteger(artifact.id) || artifact.id < 1 ||
      !Number.isSafeInteger(artifact.size_in_bytes) || artifact.size_in_bytes > maxReceipt) return;
  const archive = await api(`actions/artifacts/${artifact.id}/zip`);
  if (!archive.ok) return;
  const bytes = new Uint8Array(await archive.arrayBuffer());
  if (bytes.length > maxReceipt) return;
  const { unzipSync } = await import('fflate');
  const files = unzipSync(bytes, { filter: file => file.name === 'browser-verification.json' && file.originalSize <= maxReceipt });
  const receipt = JSON.parse(new TextDecoder().decode(files['browser-verification.json']));
  if (!matchesBrowserReceipt(receipt, { ...expected, pull: pr.number }, run)) return;
  const current = await json(`actions/runs/${run.id}`);
  if (trustedBrowserRun(current, expected.repository, pr.head.sha) &&
      current.id === run.id && current.run_attempt === run.run_attempt) return run.id;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { GITHUB_REPOSITORY: repository, GITHUB_TOKEN: token, GITHUB_SHA: commit, GITHUB_OUTPUT: output,
    GITHUB_EVENT_NAME: eventName, GITHUB_RUN_ID: run, GITHUB_RUN_ATTEMPT: attempt,
    FLOOD_CI_SCOPE: scope, FLOOD_CI_COVERAGE: plan } = process.env;
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  if (process.argv[2] === 'record' && eventName === 'pull_request') {
    const pr = event.pull_request;
    if (git('rev-parse', 'HEAD') !== commit) throw Error('Browser verification checkout differs from the workflow commit');
    const expected = identity(repository, pr.base.sha, scope, plan);
    await mkdir('.artifacts', { recursive: true });
    await writeFile(receiptFile, JSON.stringify({ schemaVersion: 1, ...expected, pull: pr.number,
      head: pr.head.sha, run: Number(run), attempt: Number(attempt) }) + '\n');
  } else if (process.argv[2] === 'lookup') {
    let verifiedRun;
    if (eventName === 'push' && process.env.GITHUB_REF === 'refs/heads/main' && token && sha.test(commit ?? '')) {
      try {
        if (git('rev-parse', 'HEAD') !== commit) throw Error('Main checkout differs from the workflow commit');
        const expected = identity(repository, event.before, scope, plan);
        // Changes to the verification mechanism bootstrap with fresh browser jobs.
        if (!git('diff', '--name-only', event.before, 'HEAD', '--', '.github/workflows',
          'scripts/ci-browser-reuse.mjs', 'scripts/ci-browser.mjs', 'scripts/ci-affected.mjs',
          'scripts/ci-scope.mjs', 'scripts/ci-shards.mjs', 'package-lock.json')) {
          verifiedRun = await findReceipt(expected, commit, path =>
            fetch(`https://api.github.com/repos/${repository}/${path}`, {
              headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
              signal: AbortSignal.timeout(8000),
            }));
        }
      } catch {
        console.log('Browser verification evidence unavailable. Running local browser jobs.');
      }
    }
    await appendFile(output, `reused=${Boolean(verifiedRun)}\n`);
    if (verifiedRun) console.log(`Using browser verification from PR run ${verifiedRun} for the matching source and plan.`);
  } else throw Error('Use record for pull requests or lookup for pushes');
}
