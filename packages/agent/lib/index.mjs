import { readFile, lstat, realpath, open } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KINDS = new Set(['guide', 'workflow', 'reference', 'component', 'recipe', 'token']);
const ID = /^[a-z][a-z0-9-]*:[a-z0-9][a-z0-9.-]*$/;
const MAX_CATALOG_BYTES = 8 * 1024 * 1024;
const MAX_MATERIAL_BYTES = 1024 * 1024;
const PAGE_BYTES = 16 * 1024;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = (code, message) => { const error = new Error(message); error.code = code; throw error; };
const inside = (root, path) => { const r = relative(root, path); return r === '' || (r !== '..' && !r.startsWith('..' + sep) && !isAbsolute(r)); };
const safePath = path => typeof path === 'string' && /^[a-zA-Z0-9._/-]+$/.test(path) && !path.startsWith('/') && !path.split('/').some(part => !part || part === '.' || part === '..');
const text = (value, limit) => typeof value === 'string' && value.trim().length > 0 && value.length <= limit;

/** Validate the data contract without loading material bodies or executing instructions. */
export function validateKnowledgeCatalog(catalog) {
  if (catalog?.schemaVersion !== 1 || !/^\d+\.\d+\.\d+$/.test(catalog.version ?? '') || !Array.isArray(catalog.groups) || !catalog.groups.length || catalog.groups.length > 16 || !Array.isArray(catalog.materials) || !catalog.materials.length || !Array.isArray(catalog.capabilities) || catalog.capabilities.length > 32) fail('INVALID_CATALOG', 'Unsupported or incomplete Flood knowledge catalog.');
  const groups = new Set(), ids = new Set(), files = new Set();
  for (const group of catalog.groups) {
    if (!/^[a-z][a-z0-9-]*$/.test(group.id ?? '') || groups.has(group.id) || !text(group.name, 128) || !text(group.description, 256)) fail('INVALID_CATALOG', 'Invalid or duplicate knowledge group.');
    groups.add(group.id);
  }
  let previous = '';
  for (const item of catalog.materials) {
    if (!ID.test(item.id ?? '') || ids.has(item.id) || item.id <= previous || !KINDS.has(item.kind) || !item.id.startsWith(item.kind + ':') || !text(item.name, 128) || !text(item.description, 1024) || !safePath(item.file) || files.has(item.file) || !/^[a-f0-9]{64}$/.test(item.sha256 ?? '') || !Number.isSafeInteger(item.bytes) || item.bytes < 1 || item.bytes > MAX_MATERIAL_BYTES || !Array.isArray(item.groups) || !item.groups.length || item.groups.length > 8 || new Set(item.groups).size !== item.groups.length || item.groups.some(group => !groups.has(group)) || !Array.isArray(item.links) || !Array.isArray(item.requires) || item.status !== 'available') fail('INVALID_CATALOG', 'Invalid, unsorted or duplicate knowledge material.');
    if (item.installedTarget !== undefined && (!safePath(item.installedTarget) || !(item.installedTarget.startsWith('flood/') || item.installedTarget.startsWith('.agents/skills/flood-ui/')))) fail('INVALID_CATALOG', 'Invalid owned guide target.');
    if (item.requires.length > 16 || item.links.length > 256 || new Set(item.requires).size !== item.requires.length || new Set(item.links).size !== item.links.length) fail('INVALID_CATALOG', 'Knowledge relationships exceed their per-material budget or contain duplicates.');
    ids.add(item.id); files.add(item.file); previous = item.id;
  }
  const byId = new Map(catalog.materials.map(item => [item.id, item]));
  for (const item of catalog.materials) for (const id of [...item.links, ...item.requires]) if (!ids.has(id)) fail('INVALID_CATALOG', `Unresolved knowledge relationship: ${id}`);
  const visiting = new Set(), visited = new Set();
  const visit = id => { if (visiting.has(id)) fail('INVALID_CATALOG', 'Knowledge prerequisite cycle.'); if (visited.has(id)) return; if (visiting.size >= 32) fail('INVALID_CATALOG', 'Knowledge prerequisites exceed the supported depth.'); visiting.add(id); for (const dependency of byId.get(id).requires) visit(dependency); visiting.delete(id); visited.add(id); };
  for (const id of ids) visit(id);
  const capabilities = new Set();
  for (const item of catalog.capabilities) {
    if (!/^[a-z][a-z0-9-]*$/.test(item.id ?? '') || capabilities.has(item.id) || !['available', 'not-provided'].includes(item.status) || !text(item.description, 256) || !Array.isArray(item.materials) || item.materials.length > 16 || item.materials.some(id => !ids.has(id)) || (item.status === 'available' && !item.materials.length) || (item.status === 'not-provided' && item.materials.length)) fail('INVALID_CATALOG', 'Invalid knowledge capability declaration.');
    capabilities.add(item.id);
  }
  return catalog;
}

async function readRegular(root, path, maxBytes) {
  if (!safePath(path)) fail('INVALID_PATH', 'Knowledge paths must come from the package catalog.');
  const base = await realpath(root);
  let current = base;
  for (const part of path.split('/')) {
    current = resolve(current, part);
    const stat = await lstat(current).catch(() => fail('MISSING_MATERIAL', `Missing knowledge file: ${path}`));
    if (stat.isSymbolicLink()) fail('INVALID_PATH', 'Refusing a linked knowledge file or directory.');
  }
  if (!inside(base, await realpath(current))) fail('INVALID_PATH', 'Knowledge file left its package root.');
  const handle = await open(current, 'r');
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.nlink !== 1 || stat.size > maxBytes) fail('INVALID_MATERIAL', 'Knowledge file is not a bounded regular file.');
    const bytes = await handle.readFile();
    if (bytes.length > maxBytes) fail('INVALID_MATERIAL', 'Knowledge file exceeds its read budget.');
    return bytes;
  } finally { await handle.close(); }
}

const decode = bytes => { try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { fail('INVALID_MATERIAL', 'Knowledge must be valid UTF-8.'); } };
const summary = ({id, kind, name, description, groups, status, links, requires}) => ({id, kind, name, description, groups: [...groups], status, relatedCount: links.length, requires: [...requires]});

/** A provider-neutral, read-only reader. A fresh catalog is checked on every operation. */
export function createKnowledgeReader({root = DEFAULT_ROOT} = {}) {
  async function load() {
    const bytes = await readRegular(root, 'dist/catalog.json', MAX_CATALOG_BYTES);
    let catalog;
    try { catalog = JSON.parse(decode(bytes)); } catch (error) { if (error.code) throw error; fail('INVALID_CATALOG', 'Malformed Flood knowledge catalog.'); }
    validateKnowledgeCatalog(catalog);
    const pkg = JSON.parse(decode(await readRegular(root, 'package.json', 64 * 1024)));
    if (pkg.name !== '@flood-md/agent' || pkg.version !== catalog.version) fail('VERSION_MISMATCH', 'Agent package and knowledge catalog versions differ.');
    return {catalog, fingerprint: digest(bytes)};
  }
  return {
    async info() {
      const {catalog, fingerprint} = await load();
      return {schemaVersion: 1, version: catalog.version, fingerprint, materialCount: catalog.materials.length,
        groups: catalog.groups.map(group => ({...group, count: catalog.materials.filter(item => item.groups.includes(group.id)).length})),
        kinds: [...KINDS].map(kind => ({kind, count: catalog.materials.filter(item => item.kind === kind).length})),
        capabilities: structuredClone(catalog.capabilities)};
    },
    async list({kind, group, search = '', limit = 12, cursor} = {}) {
      if ((kind !== undefined && !KINDS.has(kind)) || !Number.isSafeInteger(limit) || limit < 1 || limit > 50 || typeof search !== 'string' || search.length > 160) fail('INVALID_QUERY', 'Invalid catalog kind, limit or search.');
      const {catalog, fingerprint} = await load();
      if (group !== undefined && !catalog.groups.some(item => item.id === group)) fail('INVALID_QUERY', 'Unknown knowledge group.');
      const query = {kind: kind ?? null, group: group ?? null, search: search.trim().toLowerCase()};
      const queryHash = digest(JSON.stringify(query));
      let offset = 0;
      if (cursor !== undefined) {
        let state;
        try { if (typeof cursor !== 'string' || cursor.length > 1024 || !/^[A-Za-z0-9_-]+$/.test(cursor)) throw Error(); state = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')); } catch { fail('INVALID_CURSOR', 'Malformed knowledge cursor.'); }
        if (state.fingerprint !== fingerprint || state.query !== queryHash || !Number.isSafeInteger(state.offset) || state.offset < 1) fail('STALE_CURSOR', 'Catalog or query changed; start a fresh catalog page.');
        offset = state.offset;
      }
      const matches = catalog.materials.filter(item => (!kind || item.kind === kind) && (!group || item.groups.includes(group)) && (!query.search || `${item.id} ${item.name} ${item.description}`.toLowerCase().includes(query.search)));
      if (offset > matches.length) fail('INVALID_CURSOR', 'Knowledge cursor is outside the result set.');
      const page = [];
      const response = () => {
        const next = offset + page.length;
        return {schemaVersion: 1, version: catalog.version, fingerprint, query, total: matches.length, items: page,
          truncated: next < matches.length, nextCursor: next < matches.length ? Buffer.from(JSON.stringify({fingerprint, query: queryHash, offset: next})).toString('base64url') : null};
      };
      for (const item of matches.slice(offset, offset + limit)) {
        page.push(summary(item));
        if (Buffer.byteLength(JSON.stringify(response())) > PAGE_BYTES) { page.pop(); break; }
      }
      if (offset < matches.length && !page.length) fail('INVALID_CATALOG', 'A catalog entry exceeds the discovery budget.');
      return response();
    },
    async read(id, {offset = 0, length = 10000, linksOffset = 0} = {}) {
      if (!ID.test(id ?? '') || !Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(length) || length < 1 || length > 40000 || !Number.isSafeInteger(linksOffset) || linksOffset < 0) fail('INVALID_QUERY', 'Use a known material ID and a bounded character range.');
      const {catalog, fingerprint} = await load();
      const item = catalog.materials.find(item => item.id === id);
      if (!item) fail('UNKNOWN_MATERIAL', `Unknown installed knowledge material: ${id}`);
      if (linksOffset > item.links.length) fail('INVALID_QUERY', 'Link offset is outside the material.');
      const bytes = await readRegular(root, item.file, MAX_MATERIAL_BYTES);
      if (bytes.length !== item.bytes || digest(bytes) !== item.sha256) fail('INTEGRITY_MISMATCH', 'Knowledge content differs from the versioned catalog.');
      const chars = Array.from(decode(bytes));
      if (offset > chars.length) fail('INVALID_QUERY', 'Read offset is outside the material.');
      const end = Math.min(chars.length, offset + length);
      return {schemaVersion: 1, version: catalog.version, fingerprint, ...summary(item), source: 'package',
        sha256: item.sha256, installedTarget: item.installedTarget ?? null, links: item.links.slice(linksOffset, linksOffset + 32),
        linksOffset, nextLinksOffset: linksOffset + 32 < item.links.length ? linksOffset + 32 : null,
        text: chars.slice(offset, end).join(''), offset, totalCharacters: chars.length,
        truncated: end < chars.length, nextOffset: end < chars.length ? end : null};
    },
  };
}
