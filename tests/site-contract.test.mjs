import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm, readdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { prepareSiteBundle, checkLocalSite, verifySite, waitForSite } from '../scripts/site-contract.mjs';

const sha = 'a'.repeat(40);
const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')); 
async function fixture(handler) {
 const server = createServer(handler);server.listen(0,'127.0.0.1');await once(server,'listening');
 return {server,url:'http://127.0.0.1:'+server.address().port,close:()=>new Promise(resolve=>server.close(resolve))};
}

test('isolated deploy artifact includes only runtime files and serves the complete agent bundle', async () => {
 const bundle = await prepareSiteBundle();
 const entries = await readdir(bundle);
 assert.deepEqual(entries.sort(), ['Dockerfile','apps']);
 assert.match(await readFile(bundle+'/Dockerfile','utf8'),/USER node/);
 const metadata = await checkLocalSite(bundle);
 assert.equal(metadata.version,version);
 // The built runtime must fail the gate if a shipped reference is missing.
 const manifest = JSON.parse(await readFile(bundle+'/apps/website/dist/agent/manifest.json','utf8'));
 const reference = manifest.files.find(file=>file.kind==='reference').source;
 await rm(bundle+'/apps/website/dist/agent/'+reference);
 await assert.rejects(checkLocalSite(bundle), /ENOENT/);
});

test('deployment verification rejects mismatched or dirty source before accepting page status', async () => {
 const host = await fixture((request,response)=>{
  response.writeHead(200,{'content-type':'application/json'});
  response.end(JSON.stringify({schemaVersion:1,version:'0.2.2',sourceCommit:sha,sourceDirty:true}));
 });
 try {
  await assert.rejects(verifySite(host.url,{expectedCommit:sha}),/expected clean source/);
  await assert.rejects(verifySite(host.url,{expectedCommit:'b'.repeat(40)}),/expected clean source/);
  await assert.rejects(waitForSite(host.url,sha,1),/timed out/);
 } finally {await host.close();}
});

test('deployment probe refuses unsafe origins and source identifiers', async () => {
 await assert.rejects(verifySite('file:///tmp/site'),/HTTP/);
 await assert.rejects(verifySite('https://user:password@example.invalid'),/HTTP/);
 await assert.rejects(waitForSite('http://127.0.0.1','main',1),/full lowercase Git SHA/);
});

test('deployment probe catches a stale agent bundle even when the source marker and health are current', async () => {
 const host = await fixture((request,response)=>{
  let body, type='application/json';
  if(request.url==='/site-release.json') body=JSON.stringify({schemaVersion:1,version:'0.2.2',sourceCommit:sha,sourceDirty:false});
  else if(request.url==='/health'){body='ok';type='text/plain';}
  else if(request.url==='/'){body='<html></html>';type='text/html';}
  else if(request.url==='/agent/SKILL.md'){body='# Flood';type='text/markdown';}
  else body=JSON.stringify({schemaVersion:1,version:'0.0.0',files:[{source:'DESIGN.md'}]});
  response.writeHead(200,{'content-type':type});response.end(body);
 });
 try {await assert.rejects(verifySite(host.url,{expectedCommit:sha}),/Agent bundle version differs/);}
 finally {await host.close();}
});
