import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { initProject, knowledgeInfo, knowledgeCatalog, knowledgeRead, run, VERSION } from '../packages/cli/lib/index.mjs';

async function fixture(t, connected=true) {
  const root=await mkdtemp(join(tmpdir(),'flood-query-'));
  t.after(async()=>{const path=relative(resolve(tmpdir()),resolve(root));assert.ok(path.startsWith('flood-query-')&&!path.startsWith('..')&&!path.includes(sep));await rm(root,{recursive:true,force:true});});
  await writeFile(join(root,'package.json'),JSON.stringify({name:'consumer',private:true,privateMarker:'never-return-this-field',dependencies:{react:'^19.0.0',next:'^16.0.0'}}));
  await writeFile(join(root,'AGENTS.md'),'Host instructions stay authoritative.');
  if(connected){
    await initProject(root,{installer(){},log(){}});
    for(const name of ['tokens','react','agent','cli']){
      const directory=join(root,'node_modules/@flood-md',name);await mkdir(directory,{recursive:true});
      await writeFile(join(directory,'package.json'),JSON.stringify({name:'@flood-md/'+name,version:VERSION}));
    }
  }
  return root;
}
async function snapshot(root,path='') {
  const entries=[];
  for(const entry of await readdir(join(root,path),{withFileTypes:true})){
    const p=path?path+'/'+entry.name:entry.name;
    if(entry.isDirectory())entries.push(...await snapshot(root,p));
    else entries.push([p,createHash('sha256').update(await readFile(join(root,p))).digest('hex')]);
  }
  return entries.sort(([a],[b])=>a<b?-1:1);
}

test('info/catalog/read are JSON-only read operations and preserve host instructions',async t=>{
  const root=await fixture(t),before=await snapshot(root),output=[];
  const info=await run(['info','--json'],{root,log:value=>output.push(value)});
  assert.equal(info.project.state,'connected');assert.equal(info.project.framework,'next');
  assert.equal(info.project.configuredVersion,VERSION);assert.equal(info.knowledge.version,VERSION);
  assert.ok(!JSON.stringify(info).includes('never-return-this-field'));
  await run(['catalog','--kind','workflow','--limit','2'],{root,log:value=>output.push(value)});
  await run(['read','workflow:forms','--length','64'],{root,log:value=>output.push(value)});
  assert.ok(output.every(line=>JSON.parse(line).schemaVersion===1));
  assert.deepEqual(await snapshot(root),before);
});

test('unconnected projects use explicit bundle-only scope without pretending installation',async t=>{
  const root=await fixture(t,false),before=await snapshot(root);
  assert.equal((await knowledgeInfo(root)).project.state,'bundle-only');
  assert.equal((await knowledgeRead(root,'component:button',{length:20})).scope,'bundle-only');
  assert.deepEqual(await snapshot(root),before);
});

test('version mismatch is visible in info and prevents reading the wrong guide train',async t=>{
  const root=await fixture(t);const file=join(root,'node_modules/@flood-md/react/package.json');
  await writeFile(file,JSON.stringify({name:'@flood-md/react',version:'0.1.1'}));
  assert.equal((await knowledgeInfo(root)).project.state,'version-mismatch');
  await assert.rejects(knowledgeCatalog(root),{code:'VERSION_MISMATCH'});
  await assert.rejects(knowledgeRead(root,'component:button'),{code:'VERSION_MISMATCH'});
});

test('selected customized guides remain authoritative, including ranges beyond upstream length',async t=>{
  const root=await fixture(t);const upstream=await knowledgeRead(root,'workflow:forms',{source:'package',length:40000});
  const custom=upstream.text+'\nLocal instruction 🟢 '.repeat(1500);
  const file=join(root,upstream.installedTarget);await writeFile(file,custom);
  const offset=Array.from(upstream.text).length+200;
  const selected=await knowledgeRead(root,'workflow:forms',{offset,length:90});
  assert.equal(selected.source,'project');assert.equal(selected.customized,true);
  assert.equal(selected.packageSha256,upstream.sha256);
  assert.equal(selected.text,Array.from(custom).slice(offset,offset+90).join(''));
  assert.equal((await knowledgeRead(root,'workflow:forms',{source:'package',length:40000})).text,upstream.text);
  assert.equal(await readFile(file,'utf8'),custom);
});

test('edited project catalog data cannot redirect package lookups to arbitrary paths',async t=>{
  const root=await fixture(t);await writeFile(join(root,'private.txt'),'A host-only marker.');
  await writeFile(join(root,'flood/catalog.json'),JSON.stringify({materials:[{id:'reference:private',file:'../private.txt'}]}));
  await assert.rejects(knowledgeRead(root,'reference:private'),{code:'UNKNOWN_MATERIAL'});
  const page=await knowledgeCatalog(root,{kind:'workflow'});assert.ok(!JSON.stringify(page).includes('host-only'));
});

test('strict CLI arguments reject unknown IDs, repeated flags and coercible ranges',async t=>{
  const root=await fixture(t),before=await snapshot(root);
  for(const args of [
    ['catalog','--limit','1abc'],['catalog','--limit','1','--limit','2'],['catalog','--group','unknown'],
    ['read','../private.txt'],['read','component:button','--length','0'],['read','component:button','--source','project'],
    ['info','--unknown'],['read'],['catalog','--limit'],
    ['read','component:button','--links-offset','0','--links-offset','1'],
  ])await assert.rejects(run(args,{root,log(){}}));
  assert.deepEqual(await snapshot(root),before);
});
