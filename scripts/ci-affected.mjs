import { parse } from '@babel/parser';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const identifiers = node => {
  const names = new Set();
  function walk(value) {
    if (!value || typeof value !== 'object') return;
    if (value.type === 'Identifier' || value.type === 'JSXIdentifier') names.add(value.name);
    for (const [key, child] of Object.entries(value)) if (!['loc','start','end','extra','comments','tokens'].includes(key)) {
      if (Array.isArray(child)) child.forEach(walk); else walk(child);
    }
  }
  walk(node); return names;
};
/** Compare public declarations and their transitive implementation dependencies.
 * Unknown syntax/paths fail closed to full CI in the caller. */
export function componentFingerprints(files, names) {
  const modules = new Map();
  for (const [path, source] of files) {
    const ast = parse(source, {sourceType:'module',plugins:['typescript','jsx']});
    const declarations = new Map(), imports = new Map();
    for (const statement of ast.program.body) {
      if (statement.type === 'ImportDeclaration' && statement.source.value.startsWith('.')) {
        const raw = posix.normalize(posix.join(posix.dirname(path),statement.source.value)).replace(/\.js$/, '');
        const target = [raw, raw+'.tsx', raw+'.ts'].find(p=>files.has(p));
        if (!target) throw Error('Unresolved implementation dependency');
        if (!statement.specifiers.length) throw Error('Side-effect import requires full CI');
        for (const spec of statement.specifiers) {
          if (spec.type !== 'ImportSpecifier' || !spec.imported?.name) throw Error('Unclassified module import');
          imports.set(spec.local.name,{target,name:spec.imported.name});
        }
      }
      const node = statement.declaration ?? statement;
      if (node.type === 'VariableDeclaration') {
        for (const declaration of node.declarations) {
          if (declaration.id.type !== 'Identifier') throw Error('Unclassified declaration');
          declarations.set(declaration.id.name,{source:source.slice(statement.start,statement.end),refs:identifiers(declaration)});
        }
      } else if (node.id?.name) declarations.set(node.id.name,{source:source.slice(statement.start,statement.end),refs:identifiers(node)});
      else if (statement.type !== 'ImportDeclaration') throw Error('Unclassified module statement requires full CI');
    }
    const context=JSON.stringify(ast.program.directives)+ast.program.body.filter(n=>n.type==='ImportDeclaration'&&!n.source.value.startsWith('.')).map(n=>source.slice(n.start,n.end)).join('\n');
    modules.set(path,{source,declarations,imports,context});
  }
  const entry = 'packages/react/src/index.tsx';
  return new Map(names.map(name=>{
    const parts = new Map();
    function declaration(path,name) {
      const key=path+':'+name;if(parts.has(key))return;
      const item=modules.get(path);const node=item.declarations.get(name);
      parts.set('context:'+path,item.context);
      if(!node) {if(item.imports.has(name)) {
        const imported=item.imports.get(name);
        parts.set(key,imported.target+':'+imported.name);
        declaration(imported.target,imported.name);
      }return;}
      parts.set(key,node.source);
      for(const ref of node.refs)declaration(path,ref);
    }
    if(!modules.get(entry)?.declarations.has(name))throw Error('Missing public declaration');
    declaration(entry,name);
    return [name,createHash('sha256').update(JSON.stringify([...parts].sort())).digest('hex')];
  }));
}
export function selectBrowserFiles(files, catalog, affected) {
  const selected = new Set(affected);
  return files.filter(({source})=>{
    const mentions=catalog.filter(c=>new RegExp(`\\b${c.name}\\b|[/'\"]${c.slug}(?:[/'\"#?]|$)`).test(source));
    return !mentions.length || mentions.some(c=>selected.has(c.slug));
  }).map(file=>file.path);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const git = args=>{const r=spawnSync('git',args,{encoding:'utf8',maxBuffer:32*1024*1024});if(r.status!==0)throw Error('Git diff unavailable');return r.stdout;};
  let plan={full:true,reason:'Main and unknown changes retain full verification',components:[],testFiles:[]};
  try {
    const event=JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8'));
    if(event.pull_request) {
      const base=event.pull_request.base.sha;if(!/^[a-f0-9]{40}$/.test(base))throw Error('Invalid base');
      const ancestor=git(['merge-base',base,'HEAD']).trim();
      const changed=git(['diff','--name-only','--no-renames',ancestor,'HEAD']).trim().split('\n').filter(Boolean);
      const catalog=JSON.parse(await readFile('apps/website/src/component-catalog.json','utf8'));
      // Shared styles/tokens, build, dependencies, recipes and CI edits affect all.
      if(!changed.length || changed.some(p=>!/^packages\/react\/src\/.+\.tsx?$/.test(p)))throw Error('Shared or unclassified change');
      const paths=git(['ls-tree','-r','--name-only','HEAD','packages/react/src']).trim().split('\n').filter(p=>/\.tsx?$/.test(p));
      const before=new Map(),after=new Map();
      for(const path of paths){after.set(path,await readFile(path,'utf8'));before.set(path,git(['show',`${ancestor}:${path}`]));}
      const names=catalog.map(c=>c.name), old=componentFingerprints(before,names), next=componentFingerprints(after,names);
      const components=catalog.filter(c=>old.get(c.name)!==next.get(c.name)).map(c=>c.slug);
      if(!components.length)throw Error('No public consumer identified');
      const tests=git(['ls-files','tests/browser/*.spec.ts']).trim().split('\n');
      const testFiles=selectBrowserFiles(await Promise.all(tests.map(async path=>({path,source:await readFile(path,'utf8')}))),catalog,components);
      if(!testFiles.length)throw Error('No affected tests identified');
      plan={full:false,reason:'Public implementation dependency closure',components,testFiles};
    }
  } catch(error) {plan.reason=error.message;}
  await mkdir('.artifacts',{recursive:true});
  await writeFile('.artifacts/ci-plan.json',JSON.stringify(plan,null,2)+'\n');
  console.log(JSON.stringify(plan,null,2));
}
