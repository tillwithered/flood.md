import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const all = ['flood-core', 'flood-connectors', 'flood-github', 'flood-mcp', 'flood-desktop'];
export function withoutReleaseVersion(file, text) {
  if (file === 'src-tauri/tauri.conf.json') { const config = JSON.parse(text); delete config.version; return JSON.stringify(config); }
  if (file === 'Cargo.toml') return text.replace(/(\[workspace\.package\][\s\S]*?\nversion = ")[^"]+/, '$1VERSION');
  if (file === 'Cargo.lock') return text.replace(/(name = "flood-[^"]+"\r?\nversion = ")[^"]+/g, '$1VERSION');
  return text;
}
export function scopeFor(files) {
  let frontend = false;
  const packages = new Set();
  for (const file of files) {
    if (/^(docs\/|README|CHANGELOG|LICENSE|SECURITY)/.test(file)) continue;
    if (/^(src\/|index\.html$|vite\.config\.|tsconfig|package(-lock)?\.json$)/.test(file)) { frontend = true; continue; }
    if (file.startsWith('src-tauri/')) { frontend = true; packages.add('flood-desktop'); continue; }
    const crate = file.match(/^crates\/(flood-[^/]+)\//)?.[1];
    if (crate && all.includes(crate)) {
      packages.add(crate);
      if (crate === 'flood-core') ['flood-mcp', 'flood-desktop'].forEach(p => packages.add(p));
      if (crate === 'flood-connectors') all.forEach(p => packages.add(p));
      if (crate === 'flood-github') ['flood-mcp', 'flood-desktop'].forEach(p => packages.add(p));
      frontend = true;
      continue;
    }
    // Unknown paths, build configuration and CI changes require all checks.
    frontend = true;
    all.forEach(p => packages.add(p));
  }
  return { frontend, packages: all.filter(p => packages.has(p)) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
  let result;
  try {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    let base = event.pull_request?.base?.sha ?? event.before;
    if (process.env.GITHUB_REF_TYPE === 'tag') base = git('describe', '--tags', '--abbrev=0', '--match', 'v*', 'HEAD^');
    if (!base || /^0+$/.test(base)) throw new Error('No reliable comparison base');
    const files = git('diff', '--name-only', '--no-renames', base, 'HEAD').split(/\r?\n/).filter(Boolean);
    result = scopeFor(files.filter(file => {
      if (!['Cargo.toml', 'Cargo.lock', 'src-tauri/tauri.conf.json'].includes(file)) return true;
      return withoutReleaseVersion(file, git('show', `${base}:${file}`)) !== withoutReleaseVersion(file, git('show', `HEAD:${file}`));
    }));
  } catch (error) {
    console.log(`Full verification: ${error.message}`);
    result = { frontend: true, packages: all };
  }
  console.log(JSON.stringify(result));
  appendFileSync(process.env.GITHUB_OUTPUT, `frontend=${result.frontend}\nrust=${result.packages.length > 0}\npackages=${result.packages.join(',')}\n`);
}
