import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir, lstat, copyFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const packageNames = ['tokens', 'react', 'agent', 'cli'];
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export function validateCandidate(manifest, { commit, tree, lock, version }) {
  if (!/^[a-f0-9]{40}$/.test(commit) || manifest.schemaVersion !== 1 || manifest.commit !== commit || manifest.tree !== tree || manifest.lock !== lock || manifest.version !== version)
    throw Error('Candidate source, dependencies or version do not match');
  if (manifest.packages?.length !== packageNames.length || packageNames.some((name, i) => manifest.packages[i]?.name !== name)) throw Error('Incomplete candidate package set');
  for (const pkg of manifest.packages) if (pkg.file !== `flood-md-${pkg.name}-${version}.tgz` || !/^[a-f0-9]{64}$/.test(pkg.sha256)) throw Error('Invalid candidate archive');
}
const git = args => {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0) throw Error('Git source identity unavailable');
  return result.stdout.trim();
};
export async function candidateIdentity() {
  return { commit: git(['rev-parse', 'HEAD']), tree: git(['rev-parse', 'HEAD^{tree}']), lock: digest(await readFile('package-lock.json')), version: JSON.parse(await readFile('package.json')).version };
}
export async function verifyCandidate(directory) {
  const manifest = JSON.parse(await readFile(`${directory}/candidate.json`, 'utf8'));
  validateCandidate(manifest, await candidateIdentity());
  const files = await readdir(directory);
  if (files.sort().join(',') !== ['candidate.json', ...manifest.packages.map(p => p.file)].sort().join(',')) throw Error('Unexpected candidate files');
  for (const pkg of manifest.packages) {
    const path = `${directory}/${pkg.file}`;
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink()) throw Error('Candidate must contain regular archives');
    const bytes = await readFile(path);
    if (digest(bytes) !== pkg.sha256 || pkg.integrity !== 'sha512-' + createHash('sha512').update(bytes).digest('base64')) throw Error('Candidate archive digest differs');
  }
  return manifest;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = '.artifacts/release-candidate';
  if (process.argv[2] === 'pack') {
    await mkdir(directory, { recursive: true });
    const identity = await candidateIdentity();
    if (git(['status', '--porcelain'])) throw Error('Candidate must be built from clean source');
    const packages = [];
    for (const name of packageNames) {
      // package-smoke already installed and tested these exact tarballs.
      // A missing archive is an error; the publisher must never recreate it.
      const file = `flood-md-${name}-${identity.version}.tgz`;
      const path = `.artifacts/${file}`;
      if (!(await lstat(path)).isFile() || (await lstat(path)).isSymbolicLink()) throw Error('Missing tested package archive');
      await copyFile(path,`${directory}/${file}`);
      const bytes = await readFile(`${directory}/${file}`);
      packages.push({ name, file, integrity: 'sha512-' + createHash('sha512').update(bytes).digest('base64'), sha256: digest(bytes) });
    }
    await writeFile(`${directory}/candidate.json`, JSON.stringify({ schemaVersion: 1, ...identity, node: process.version, packages }, null, 2) + '\n');
  } else if (process.argv[2] !== 'verify') throw Error('Use pack or verify');
  const manifest = await verifyCandidate(directory);
  console.log(`Verified candidate ${manifest.version} from ${manifest.commit}`);
}
