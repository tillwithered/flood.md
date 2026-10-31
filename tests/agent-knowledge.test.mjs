import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, link, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { createKnowledgeReader, validateKnowledgeCatalog } from '../packages/agent/lib/index.mjs';
import { compileAgentKnowledge } from '../scripts/agent-knowledge.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const pkg = JSON.parse(await readFile('packages/agent/package.json', 'utf8'));
async function fixture(t, count = 1, body = 'A small material 🟢.\n') {
  const root = await mkdtemp(join(tmpdir(), 'flood-knowledge-'));
  t.after(async () => { const path = relative(resolve(tmpdir()), resolve(root)); assert.ok(path.startsWith('flood-knowledge-') && !path.startsWith('..') && !path.includes(sep)); await rm(root,{recursive:true,force:true}); });
  await mkdir(join(root,'dist/materials'),{recursive:true});
  await writeFile(join(root,'package.json'),JSON.stringify({name:'@flood-md/agent',version:pkg.version}));
  const materials = Array.from({length:count},(_,i)=>({id:'component:item-'+String(i).padStart(5,'0'),kind:'component',name:'Item '+i,description:'An independent component used for a bounded discovery check.',groups:['composition'],status:'available',file:'dist/materials/item-'+i+'.md',bytes:Buffer.byteLength(body),sha256:sha(body),links:[],requires:[]}));
  const catalog={schemaVersion:1,version:pkg.version,groups:[{id:'composition',name:'Composition',description:'Compose existing elements.'}],capabilities:[],materials};
  const save = async () => writeFile(join(root,'dist/catalog.json'),JSON.stringify(catalog));
  await save(); await writeFile(join(root,materials[0].file),body);
  return {root,catalog,save,reader:createKnowledgeReader({root}),body};
}

test('discovery stays bounded at 5,000 entries without reading unrelated bodies',async t=>{
  const f=await fixture(t,5000);
  // Only the selected body's file exists; listing must not need the other 4,999.
  const page=await f.reader.list();
  assert.equal(page.total,5000);assert.ok(page.items.length<=12);assert.equal(page.truncated,true);
  assert.ok(Buffer.byteLength(JSON.stringify(page))<=16*1024);
  assert.ok(page.items.every(item=>!Object.hasOwn(item,'text')&&!Object.hasOwn(item,'file')));
  assert.equal((await f.reader.read('component:item-00000')).text,f.body);
  await assert.rejects(f.reader.read('component:item-00001'),{code:'MISSING_MATERIAL'});
});

test('catalog pagination has no omissions and refuses stale or cross-query cursors',async t=>{
  const f=await fixture(t,120);let cursor;const ids=[];
  do {const page=await f.reader.list({limit:50,cursor});ids.push(...page.items.map(item=>item.id));cursor=page.nextCursor??undefined;}while(cursor);
  assert.deepEqual(ids,f.catalog.materials.map(item=>item.id));
  const first=await f.reader.list({limit:1});
  await assert.rejects(f.reader.list({search:'other',cursor:first.nextCursor}),{code:'STALE_CURSOR'});
  f.catalog.materials[0].description='Changed metadata';await f.save();
  await assert.rejects(f.reader.list({cursor:first.nextCursor}),{code:'STALE_CURSOR'});
  await assert.rejects(f.reader.list({cursor:'../arbitrary'}),{code:'INVALID_CURSOR'});
  await assert.rejects(f.reader.list({limit:1000}),{code:'INVALID_QUERY'});
  await assert.rejects(f.reader.list({group:'missing'}),{code:'INVALID_QUERY'});
});

test('Unicode body and relationship ranges are explicit and reconstruct the selected content',async t=>{
  const f=await fixture(t,70,'Пример 🟢 without broken surrogate pairs.');
  f.catalog.materials[0].links=f.catalog.materials.slice(1).map(item=>item.id);await f.save();
  let offset=0,text='';
  do {const page=await f.reader.read('component:item-00000',{offset,length:5});text+=page.text;offset=page.nextOffset;}while(offset!==null);
  assert.equal(text,f.body);assert.ok(!text.includes('\ufffd'));
  const links=[];let linksOffset=0;
  do {const page=await f.reader.read('component:item-00000',{length:1,linksOffset});assert.ok(page.links.length<=32);links.push(...page.links);linksOffset=page.nextLinksOffset;}while(linksOffset!==null);
  assert.deepEqual(links,f.catalog.materials[0].links);
  await assert.rejects(f.reader.read('component:absent'),{code:'UNKNOWN_MATERIAL'});
  await assert.rejects(f.reader.read('../outside'),{code:'INVALID_QUERY'});
});

test('a changed material or package version fails instead of serving stale instructions',async t=>{
  const f=await fixture(t);
  await writeFile(join(f.root,f.catalog.materials[0].file),'Edited after catalog compilation');
  await assert.rejects(f.reader.read('component:item-00000'),{code:'INTEGRITY_MISMATCH'});
  await writeFile(join(f.root,'package.json'),JSON.stringify({name:'@flood-md/agent',version:'99.0.0'}));
  await assert.rejects(f.reader.info(),{code:'VERSION_MISMATCH'});
});

test('catalog paths and relationships cannot escape, duplicate IDs or hide dependency cycles',async t=>{
  const f=await fixture(t,2);
  const broken=structuredClone(f.catalog);broken.materials[0].file='../outside.md';assert.throws(()=>validateKnowledgeCatalog(broken),{code:'INVALID_CATALOG'});
  const duplicate=structuredClone(f.catalog);duplicate.materials.push({...duplicate.materials[0]});assert.throws(()=>validateKnowledgeCatalog(duplicate),{code:'INVALID_CATALOG'});
  const cycle=structuredClone(f.catalog);cycle.materials[0].requires=[cycle.materials[1].id];cycle.materials[1].requires=[cycle.materials[0].id];assert.throws(()=>validateKnowledgeCatalog(cycle),{code:'INVALID_CATALOG'});
  cycle.materials.forEach(item=>{item.links=item.requires;item.requires=[];});assert.doesNotThrow(()=>validateKnowledgeCatalog(cycle),'ordinary cross-links may cycle');
  const dangling=structuredClone(f.catalog);dangling.materials[0].links=['workflow:missing'];assert.throws(()=>validateKnowledgeCatalog(dangling),{code:'INVALID_CATALOG'});
});

test('linked knowledge bodies are refused',async t=>{
  const f=await fixture(t);const file=join(f.root,f.catalog.materials[0].file),other=join(f.root,'outside.md');
  await writeFile(other,f.body);await rm(file);await link(other,file);
  await assert.rejects(f.reader.read('component:item-00000'),{code:'INVALID_MATERIAL'});
  await rm(file);
  try{await symlink(other,file,'file');}catch(error){if(['EPERM','EACCES','ENOTSUP'].includes(error.code)){t.diagnostic('Host cannot create file symlinks; hard-link refusal was exercised.');return;}throw error;}
  await assert.rejects(f.reader.read('component:item-00000'),{code:'INVALID_PATH'});
});

test('prerequisite depth stays bounded even when dependencies were visited first',async t=>{
  const f=await fixture(t,33);
  for(let i=1;i<f.catalog.materials.length;i++)f.catalog.materials[i].requires=[f.catalog.materials[i-1].id];
  assert.throws(()=>validateKnowledgeCatalog(f.catalog),{code:'INVALID_CATALOG'});
  f.catalog.materials.pop();assert.doesNotThrow(()=>validateKnowledgeCatalog(f.catalog));
});

function compilerFixture() {
  return {version:pkg.version,definition:{schemaVersion:1,groups:[{id:'composition',name:'Composition',description:'Composition.'}],workflows:{composition:['composition']},references:[],componentGroups:{layout:['composition']},capabilities:[]},
    manifest:{version:pkg.version,files:[{source:'references/flood-composition/SKILL.md',target:'.agents/skills/flood-ui/references/flood-composition/SKILL.md'}]},
    workflows:{version:pkg.version,workflows:[{id:'composition',name:'flood-composition',description:'Compose existing components.',guide:'references/flood-composition/SKILL.md'}],coverage:[{name:'Stack',workflows:['composition']}]},
    components:[{name:'Stack',slug:'stack',description:'Stack content.',group:'layout',markdown:'# Stack\n'}],documents:[],tokens:{version:pkg.version,contexts:[]},sources:{'references/flood-composition/SKILL.md':'# Composition\n'}};
}

test('compiler regenerates metadata and content hashes, and rejects unsupported growth',async()=>{
  const input=compilerFixture();const before=await compileAgentKnowledge(input);
  input.sources['references/flood-composition/SKILL.md']='# Better composition\n';
  const after=await compileAgentKnowledge(input);assert.notEqual(before.catalog.materials.find(i=>i.kind==='workflow').sha256,after.catalog.materials.find(i=>i.kind==='workflow').sha256);
  const newExport=compilerFixture();newExport.components.push({name:'Unknown',slug:'unknown',description:'Unknown.',group:'layout',markdown:'# Unknown'});await assert.rejects(compileAgentKnowledge(newExport),/lacks knowledge contract/);
  const newGroup=compilerFixture();newGroup.components[0].group='unmapped';await assert.rejects(compileAgentKnowledge(newGroup),/group missing/);
  const brokenLink=compilerFixture();brokenLink.sources['references/flood-composition/SKILL.md']='[Missing](../missing.md)';await assert.rejects(compileAgentKnowledge(brokenLink),/unresolved local/);
  const fakeAPI=compilerFixture();fakeAPI.components[0].markdown='import { BulkActions } from "@flood-md/react"';await assert.rejects(compileAgentKnowledge(fakeAPI),/unknown Flood component import/);
});

test('the actual compiled catalog covers every component and serves the website bytes',async()=>{
  const baseline=JSON.parse(await readFile('tests/fixtures/agent-knowledge-v1.json','utf8'));
  const actual=JSON.parse(await readFile('packages/agent/dist/catalog.json','utf8'));
  const ids=new Set(actual.materials.map(item=>item.id));
  for(const id of baseline.ids)assert.ok(ids.has(id),`Stable knowledge identity removed: ${id}`);
  const reader=createKnowledgeReader();const expected=JSON.parse(await readFile('apps/website/src/component-catalog.json','utf8'));let cursor;const entries=[];
  do{const page=await reader.list({kind:'component',limit:50,cursor});entries.push(...page.items);cursor=page.nextCursor??undefined;}while(cursor);
  assert.deepEqual(entries.map(i=>i.id).sort(),expected.map(i=>'component:'+i.slug).sort());
  for(const component of expected){const body=await readFile(`apps/website/public/components/${component.slug}.md`,'utf8');const result=await reader.read('component:'+component.slug,{length:40000});assert.equal(result.text,body);assert.equal(result.truncated,false);}
  const info=await reader.info();assert.equal(info.capabilities.find(i=>i.id==='page-transitions').status,'not-provided');
  assert.equal((await reader.list({kind:'workflow',group:'motion'})).total,0);
  assert.equal((await reader.list({kind:'token',group:'motion'})).total,4);
});

test('compiler output is deterministic under independent source enumeration and rejects stale annotations',async()=>{
  const input=compilerFixture();
  input.components.push({...input.components[0],name:'Inline',slug:'inline'});
  input.workflows.coverage.push({name:'Inline',workflows:['composition']});
  const before=await compileAgentKnowledge(input);
  input.components.reverse();input.workflows.coverage.reverse();
  assert.deepEqual((await compileAgentKnowledge(input)).catalog,before.catalog);
  input.definition.documentGroups={'missing.md':['composition']};
  await assert.rejects(compileAgentKnowledge(input),/Stale document/);
});
