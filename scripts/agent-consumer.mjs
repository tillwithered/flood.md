import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, copyFile, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { build } from 'vite';

/** Runs against the clean tarball installation, never checkout package resolution. */
export async function buildAgentConsumer(root) {
  const cli = join(root,'node_modules/@flood-md/cli/bin/flood.mjs');
  const command = args => {
    const result=spawnSync(process.execPath,[cli,...args],{cwd:root,encoding:'utf8',maxBuffer:4*1024*1024});
    assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);
  };
  const info=command(['info']);assert.equal(info.project.state,'connected');
  const selected=new Map();
  function read(id) {
    if(selected.has(id))return selected.get(id);
    let offset=0,body='',first;
    do{const page=command(['read',id,'--offset',String(offset)]);first??=page;body+=page.text;offset=page.nextOffset;}while(offset!==null);
    const material={...first,text:body};selected.set(id,material);
    for(const dependency of material.requires)read(dependency);
    return material;
  }
  const workflows=command(['catalog','--kind','workflow','--group','foundations']);
  assert.ok(workflows.items.some(item=>item.id==='workflow:foundations'));
  const recipe=read('recipe:table-bulk-actions');assert.ok(recipe.requires.includes('workflow:data-display'));
  const grouped=read('recipe:grouped-form');
  const groupedSource=await readFile('apps/website/src/recipes/grouped-form.tsx','utf8');
  assert.ok(grouped.text.includes('```tsx\n'+groupedSource.trimEnd()+'\n```'));
  assert.ok(grouped.requires.includes('workflow:forms'));
  await copyFile('apps/website/src/recipes/grouped-form.tsx',join(root,'agent-grouped-form.tsx'));
  read('component:data-table');read('reference:customization');read('token:sys.color.focus.ring');
  assert.equal(command(['catalog','--kind','workflow','--group','motion']).total,0);
  assert.equal(info.knowledge.capabilities.find(item=>item.id==='page-transitions').status,'not-provided');
  const missing=spawnSync(process.execPath,[cli,'read','component:page-transition'],{cwd:root,encoding:'utf8'});
  assert.notEqual(missing.status,0);assert.equal(JSON.parse(missing.stderr).error.code,'UNKNOWN_MATERIAL');

  const spacing=read('workflow:spacing'),guide=join(root,spacing.installedTarget);
  const original=await readFile(guide,'utf8');
  await writeFile(guide,original+'\nConsumer-owned spacing note.\n');
  const custom=command(['read','workflow:spacing']);assert.equal(custom.source,'project');assert.equal(custom.customized,true);
  assert.match(custom.text,/Consumer-owned spacing note/);await writeFile(guide,original);

  const source=await readFile('apps/website/src/recipes/table-bulk-actions.tsx','utf8');
  assert.ok(recipe.text.includes('```tsx\n'+source.trimEnd()+'\n```'),'Recipe served by installed CLI must match the typed implementation');
  await copyFile('apps/website/src/recipes/table-bulk-actions.tsx',join(root,'agent-recipe.tsx'));
  await writeFile(join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{jsx:'react-jsx',target:'ES2022',module:'ESNext',moduleResolution:'Bundler',strict:true,skipLibCheck:true}}));
  await writeFile(join(root,'agent-entry.mjs'),`import React from 'react';
import {createRoot} from 'react-dom/client';
import {FloodRoot,Container,Stack,Heading} from '@flood-md/react';
import {TableBulkActions} from './agent-recipe.tsx';
import '@flood-md/react/styles.css';
const h=React.createElement;
createRoot(document.getElementById('app')).render(h(FloodRoot,null,h(Container,{size:'lg',gutter:'4'},h(Stack,{gap:'4'},h(Heading,{level:1,size:'page'},'Project review'),h(TableBulkActions)))));`);
  const before=process.env.NODE_ENV;let result;
  try{result=await build({root,configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{write:false,cssCodeSplit:false,lib:{entry:join(root,'agent-entry.mjs'),formats:['iife'],name:'FloodAgentConsumer'}}});}
  finally{if(before===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=before;await unlink(join(root,'tsconfig.json'));}
  const output=(Array.isArray(result)?result:[result]).flatMap(item=>item.output);
  const css=output.filter(item=>item.type==='asset'&&item.fileName.endsWith('.css')).map(item=>item.source).join('\n');
  const js=output.filter(item=>item.type==='chunk').map(item=>item.code).join('\n');
  assert.ok(js.length&&css.length);
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Flood agent consumer</title><style>${css.replaceAll('</style','<\\/style')}body{margin:0}#app>.flood-root{min-block-size:100dvh;padding-block:var(--flood-sys-space-4)}</style></head><body><main id="app"></main><script>${js.replaceAll('</script','<\\/script')}</script></body></html>`;
  const directory=resolve('.artifacts/agent-consumer');await mkdir(directory,{recursive:true});
  await writeFile(join(directory,'index.html'),html);
  const report={schemaVersion:1,version:info.version,source:'clean-npm-tarballs',catalogFingerprint:info.knowledge.fingerprint,selectedMaterials:[...selected.keys()],recipeSha256:createHash('sha256').update(source).digest('hex'),cli:'passed',customization:'passed',unsupportedCapabilities:'explicit',browser:'not-run-in-build-job'};
  await writeFile(join(directory,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`Clean agent consumer ${info.version}: discovery, ${selected.size} selected materials, prerequisites, custom guide and truthful capability checks passed; browser artifact prepared.`);
}
