import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, relative, sep, posix } from 'node:path';
import { createHash } from 'node:crypto';
import { readAgentWorkflows } from './agent-workflows.mjs';
import { validateKnowledgeCatalog } from '../packages/agent/lib/index.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const ordered = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const unique = values => [...new Set(values)].sort(ordered);

/** Assemble the same installed-version material consumed by CLI and website. */
export async function compileAgentKnowledge({version, definition, manifest, workflows, components, documents, tokens, sources}) {
  if (definition.schemaVersion !== 1 || tokens.version !== version || workflows.version !== version || manifest.version !== version) throw Error('Knowledge inputs have incompatible schemas or versions.');
  const materials = [], bodies = new Map(), bySource = new Map();
  const groups = new Set(definition.groups.map(group => group.id));
  const installed = new Map(manifest.files.map(file => [file.source, file.target]));
  const add = ({id, kind = id.split(':')[0], name, description, groups: memberships, source, body, requires = [], links = []}) => {
    if (bodies.has(id)) throw Error(`Duplicate knowledge ID: ${id}`);
    if (!memberships?.length || memberships.some(group => !groups.has(group))) throw Error(`Knowledge group missing for ${id}`);
    const bytes = Buffer.from(body);
    const file = source?.startsWith('agent:') ? source.slice(6) : `dist/materials/${id.replace(':','-')}.${kind === 'token' ? 'json' : 'md'}`;
    const item = {id, kind, name, description, groups: unique(memberships), status: 'available', file,
      bytes: bytes.length, sha256: sha(bytes), links: [...links], requires: [...requires, ...(definition.prerequisites?.[id] ?? [])]};
    if (source && installed.has(source.slice(6)) && source.startsWith('agent:')) item.installedTarget = installed.get(source.slice(6));
    materials.push(item); bodies.set(id, {source, bytes}); if (source) bySource.set(source, id);
  };
  for (const workflow of workflows.workflows) {
    if (!Object.hasOwn(definition.workflows, workflow.id)) throw Error(`Workflow lacks knowledge groups: ${workflow.id}`);
    add({id: `workflow:${workflow.id}`, name: workflow.name, description: workflow.description,
      groups: definition.workflows[workflow.id], source: 'agent:' + workflow.guide, body: sources[workflow.guide]});
  }
  if (Object.keys(definition.workflows).some(id => !workflows.workflows.some(item => item.id === id))) throw Error('Stale workflow knowledge mapping.');
  for (const reference of definition.references) {
    if (typeof sources[reference.source] !== 'string') throw Error(`Missing canonical reference: ${reference.source}`);
    add({...reference, source: 'agent:' + reference.source, body: sources[reference.source]});
  }
  for (const component of components) {
    const coverage = workflows.coverage.find(item => item.name === component.name);
    if (!coverage || !component.markdown) throw Error(`Component lacks knowledge contract: ${component.name}`);
    add({id: 'component:' + component.slug, name: component.name, description: component.description,
      groups: definition.componentGroups[component.group], source: `component:${component.slug}`, body: component.markdown,
      links: coverage.workflows.map(id => 'workflow:' + id)});
  }
  for (const document of documents) {
    const recipe = document.path.startsWith('/docs/recipes/');
    const slug = document.path === '/docs' ? 'introduction' : document.path.split('/').at(-1);
    if (recipe && !Object.hasOwn(definition.prerequisites ?? {}, 'recipe:' + slug)) throw Error(`Recipe needs an explicit prerequisite decision: ${slug}`);
    add({id: `${recipe ? 'recipe' : 'guide'}:${slug}`, name: document.label, description: document.description,
      groups: definition.documentGroups?.[document.file], source: 'docs:' + document.file, body: document.content});
  }
  if (Object.keys(definition.documentGroups ?? {}).some(file => !documents.some(document => document.file === file))) throw Error('Stale document knowledge mapping.');
  if (Object.keys(definition.prerequisites ?? {}).some(id => !bodies.has(id))) throw Error('Stale material prerequisite annotation.');
  const roles = new Map();
  for (const context of tokens.contexts) for (const token of context.tokens) {
    if (!token.id.startsWith('sys.') || token.visibility !== 'public') continue;
    const current = roles.get(token.id) ?? {role: token.id, cssName: token.cssName, description: token.description, contexts: []};
    if (current.cssName !== token.cssName) throw Error(`Token CSS identity differs between contexts: ${token.id}`);
    current.contexts.push({preset: context.preset, theme: context.theme, ...token}); roles.set(token.id, current);
  }
  for (const token of roles.values()) { token.contexts.sort((a,b)=>ordered(`${a.preset}:${a.theme}`,`${b.preset}:${b.theme}`)); add({id: 'token:' + token.role, name: token.role, description: token.description,
    groups: token.role.startsWith('sys.motion.') ? ['foundations', 'motion'] : ['foundations'],
    body: JSON.stringify(token, null, 2) + '\n'}); }

  // Explicit prerequisites and ordinary hyperlinks are different relationships.
  // Hyperlinks may be cyclic; prerequisites must not be.
  const knownComponents = new Set(components.map(item => item.name));
  for (const item of materials) {
    const {source, bytes} = bodies.get(item.id), body = bytes.toString('utf8');
    for (const match of body.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']@flood-md\/react["']/gs)) {
      for (let imported of match[1].split(',')) {
        imported = imported.trim(); if (!imported || imported.startsWith('type ')) continue;
        const name = imported.split(/\s+as\s+/)[0];
        if (!knownComponents.has(name)) throw Error(`${item.id}: unknown Flood component import ${name}`);
        item.links.push('component:' + components.find(component => component.name === name).slug);
      }
    }
    if (source?.startsWith('agent:')) {
      for (const match of body.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
        const link = match[1].split('#')[0];
        if (!link || link.startsWith('/') || /^[a-z]+:/i.test(link)) continue;
        const resolved = 'agent:' + posix.normalize(posix.join(posix.dirname(source.slice(6)), link));
        const target = bySource.get(resolved);
        if (!target) throw Error(`${item.id}: unresolved local guidance link ${link}`);
        item.links.push(target);
      }
    }
    item.links = unique(item.links.filter(id => id !== item.id));
    item.requires = unique(item.requires);
  }
  materials.sort((a,b) => ordered(a.id,b.id));
  const catalog = {schemaVersion: 1, version, groups: definition.groups, capabilities: definition.capabilities, materials};
  validateKnowledgeCatalog(catalog);
  if (Buffer.byteLength(JSON.stringify(catalog,null,2)+'\n')>8*1024*1024) throw Error('Knowledge catalog exceeds the reader budget.');
  return {catalog, bodies};
}

export async function buildAgentKnowledge() {
  const json = async path => JSON.parse(await readFile(path, 'utf8'));
  const [pkg, definition, manifest, workflows, generated, tokenManifest] = await Promise.all([
    json('packages/agent/package.json'), json('packages/agent/knowledge.json'), json('packages/agent/manifest.json'),
    readAgentWorkflows(), json('apps/website/src/generated/content.json'), json('packages/tokens/dist/foundations.manifest.json'),
  ]);
  const {docPages} = await import('../apps/website/routes.mjs');
  const components = await Promise.all(generated.components.map(async item => ({...item, markdown: await readFile(`apps/website/public/components/${item.slug}.md`, 'utf8')})));
  const documents = docPages.map(page => ({...page, content: generated.docs[page.file]}));
  const sources = Object.fromEntries(await Promise.all(manifest.files.filter(item => ['skill','reference','contract','rules'].includes(item.kind)).map(async item => [item.source, await readFile('packages/agent/' + item.source, 'utf8')])));
  const {catalog, bodies} = await compileAgentKnowledge({version: pkg.version, definition, manifest, workflows, components, documents, tokens: tokenManifest, sources});
  const target = resolve('packages/agent/dist/materials'), workspace = resolve('.');
  if (!relative(workspace, target).startsWith('packages' + sep + 'agent' + sep + 'dist' + sep)) throw Error('Refusing an unexpected generated material destination.');
  await rm(target, {recursive: true, force: true});
  await mkdir(target, {recursive: true});
  for (const item of catalog.materials) if (item.file.startsWith('dist/materials/')) await writeFile('packages/agent/' + item.file, bodies.get(item.id).bytes);
  await writeFile('packages/agent/dist/catalog.json', JSON.stringify(catalog, null, 2) + '\n');
  console.log(`Built versioned knowledge for ${components.length} components and ${catalog.materials.length} materials.`);
  return catalog;
}
