import { readFile, writeFile, mkdir, mkdtemp, cp, readdir, lstat } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspace = fileURLToPath(new URL('../', import.meta.url));
const website = join(workspace, 'apps/website');
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const hashPattern = /^[a-f0-9]{40}$/;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function writeSiteMetadata() {
  const git = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: workspace, encoding: 'utf8' });
  const sha = git.status === 0 ? git.stdout.trim() : process.env.RAILWAY_GIT_COMMIT_SHA;
  const status = spawnSync('git', ['status', '--porcelain'], { cwd: workspace, encoding: 'utf8' });
  const release = await json(join(website, 'src/release.json'));
  const metadata = { schemaVersion: 1, version: release.version, sourceCommit: hashPattern.test(sha ?? '') ? sha : null, sourceDirty: status.status === 0 ? Boolean(status.stdout.trim()) : false };
  await writeFile(join(website, 'dist/site-release.json'), JSON.stringify(metadata, null, 2) + '\n');
  return metadata;
}

async function regularTree(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if ((await lstat(path)).isSymbolicLink()) throw new Error('Linked files are not valid website runtime artifacts');
    if (entry.isDirectory()) await regularTree(path);
    else if (!entry.isFile()) throw new Error('Only regular runtime files may be bundled');
  }
}

export async function prepareSiteBundle() {
  await regularTree(join(website, 'dist'));
  await mkdir(join(workspace, '.artifacts'), { recursive: true });
  const directory = await mkdtemp(join(workspace, '.artifacts/website-runtime-'));
  const target = join(directory, 'apps/website');
  await mkdir(join(target, 'src'), { recursive: true });
  for (const file of ['server.mjs', 'routes.mjs']) await cp(join(website, file), join(target, file));
  await cp(join(website, 'src/component-catalog.json'), join(target, 'src/component-catalog.json'));
  await cp(join(website, 'dist'), join(target, 'dist'), { recursive: true });
  await writeFile(join(directory, 'Dockerfile'), 'FROM node:24-alpine\nENV NODE_ENV=production\nWORKDIR /app\nCOPY --chown=node:node apps/website ./apps/website\nUSER node\nEXPOSE 4173\nCMD ["node", "apps/website/server.mjs"]\n');
  return directory;
}

export async function verifySite(base, { expectedCommit, expectedVersion, expectedFiles } = {}) {
  const origin = new URL(base);
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password) throw new Error('A plain HTTP(S) website origin is required');
  const read = async (path, type, method = 'GET') => {
    const response = await fetch(new URL(path, origin), { method, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (response.status !== 200 || !response.headers.get('content-type')?.includes(type)) throw new Error(path + ': unexpected status or media type');
    return { response, body: await response.text() };
  };
  const metadata = JSON.parse((await read('/site-release.json', 'application/json')).body);
  if (metadata.schemaVersion !== 1 || typeof metadata.version !== 'string') throw new Error('Invalid website release metadata');
  if (expectedCommit && (!hashPattern.test(expectedCommit) || metadata.sourceCommit !== expectedCommit || metadata.sourceDirty)) throw new Error('Website does not serve the expected clean source commit');
  if (expectedVersion && metadata.version !== expectedVersion) throw new Error('Website release version differs');
  if ((await read('/health', 'text/plain')).body !== 'ok') throw new Error('Website health probe failed');
  await read('/', 'text/html');
  const skill = (await read('/agent/SKILL.md', 'text/markdown')).body;
  if (!skill.includes('Flood') && !skill.includes('flood')) throw new Error('Agent skill is empty or unrelated');
  const manifest = JSON.parse((await read('/agent/manifest.json', 'application/json')).body);
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.files) || !manifest.files.length) throw new Error('Missing agent bundle inventory');
  if (manifest.version !== metadata.version) throw new Error('Agent bundle version differs from the website release');
  // Verify actual deployed HTML, not just the source marker or a browser title.
  for (const [path, title] of [['/', 'Good interfaces'], ['/docs/installation', 'Installation'], ['/components/button', 'Button']]) {
    const { body } = await read(path, 'text/html');
    if (!body.includes('<h1') || !body.includes(title) || body.includes('Loading documentation…') || !body.includes(`rel="canonical" href="https://flood.md${path}"`)) throw new Error(path + ': missing prerendered content or canonical');
  }
  const sitemap = (await read('/sitemap.xml', 'application/xml')).body;
  if (!sitemap.includes('<loc>https://flood.md/components/button</loc>') || sitemap.includes('/playground')) throw new Error('Invalid public sitemap');
  if (!(await read('/robots.txt', 'text/plain')).body.includes('Sitemap: https://flood.md/sitemap.xml')) throw new Error('Missing sitemap discovery');
  const paths = new Map([['/llms.txt', 'text/plain'], ['/schema/config.json', 'application/json'], ['/components/button.md', 'text/markdown']]);
  for (const file of manifest.files) {
    if (typeof file.source !== 'string' || file.source.startsWith('/') || file.source.split(/[\\/]/).some(part => !part || part === '..' || part === '.')) throw new Error('Unsafe agent reference');
    const path = '/agent/' + file.source;
    paths.set(path, path.endsWith('.json') ? 'application/json' : 'text/markdown');
  }
  for (const [path, type] of paths) {
    const { body } = await read(path, type);
    if (!body.trim()) throw new Error(path + ': empty document');
    if (expectedFiles?.has(path) && body !== expectedFiles.get(path)) throw new Error(path + ': built artifact content differs');
  }
  const head = await read('/agent/SKILL.md', 'text/markdown', 'HEAD');
  if (head.body !== '') throw new Error('HEAD returned a response body');
  const missing = await fetch(new URL('/agent/missing-reference.md', origin), { redirect: 'error' });
  if (missing.status !== 404) throw new Error('Missing documentation must return 404');
  const rejected = await fetch(new URL('/', origin), { method: 'POST', redirect: 'error' });
  if (rejected.status !== 405) throw new Error('Static runtime accepted an unsupported method');
  return metadata;
}

export async function checkLocalSite(directory, { expectedCommit } = {}) {
  const runtime = join(directory, 'apps/website');
  const expected = await json(join(runtime, 'dist/site-release.json'));
  const manifest = await json(join(runtime, 'dist/agent/manifest.json'));
  const expectedFiles = new Map();
  for (const file of manifest.files) expectedFiles.set('/agent/' + file.source, await readFile(join(runtime, 'dist/agent', file.source), 'utf8'));
  const runtimeEnv = Object.fromEntries(['PATH', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP'].filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
  const child = spawn(process.execPath, [join(runtime, 'server.mjs')], { env: { ...runtimeEnv, NODE_ENV: 'production', PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    const port = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Website runtime did not become ready')), 15000);
      let output = '';
      child.once('error', error => { clearTimeout(timeout); reject(error); });
      child.once('exit', () => { clearTimeout(timeout); reject(new Error('Website runtime exited before readiness')); });
      child.stdout.on('data', data => { output += data; const match = /Flood website listening on (\d+)/.exec(output); if (match) { clearTimeout(timeout); resolve(Number(match[1])); } });
    });
    return await verifySite('http://127.0.0.1:' + port, { expectedCommit, expectedVersion: expected.version, expectedFiles });
  } finally {
    if (child.exitCode === null) {
      const stopped = new Promise(resolve => child.once('exit', resolve));
      child.kill(); await stopped;
    }
  }
}

export async function waitForSite(base, expectedCommit, timeout = 600000) {
  if (!hashPattern.test(expectedCommit ?? '')) throw new Error('Expected source commit must be a full lowercase Git SHA');
  if (!Number.isFinite(timeout) || timeout < 1) throw new Error('Invalid deployment verification timeout');
  const start = Date.now(); let last;
  do {
    try { return await verifySite(base, { expectedCommit }); }
    catch (error) { last = error; }
    if (Date.now() - start >= timeout) break;
    await pause(Math.min(5000, timeout - (Date.now() - start)));
  } while (Date.now() - start <= timeout);
  throw new Error('Deployment verification timed out: ' + last?.message);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];
  if (command === 'metadata') await writeSiteMetadata();
  else if (command === 'check' || command === 'bundle') {
    const bundle = await prepareSiteBundle();
    const metadata = await checkLocalSite(bundle, { expectedCommit: process.env.GITHUB_SHA });
    if (command === 'bundle' && process.env.GITHUB_OUTPUT) await writeFile(process.env.GITHUB_OUTPUT, 'directory=' + bundle + '\n', { flag: 'a' });
    console.log('Verified isolated website runtime for ' + metadata.version + ': ' + bundle);
  } else if (command === 'wait') {
    const metadata = await waitForSite(process.env.WEBSITE_URL ?? process.argv[3], process.env.EXPECTED_COMMIT ?? process.argv[4], Number(process.env.VERIFY_TIMEOUT_MS ?? 600000));
    console.log('Verified live website source commit ' + metadata.sourceCommit);
  } else throw new Error('Use metadata, check, bundle or wait');
}
