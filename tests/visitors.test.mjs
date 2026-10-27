import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { visitorStore } from '../apps/visitors/store.mjs';
import { visitorRequest } from '../apps/website/visitors.mjs';

test('private HTTP service requires authentication and counts repeat submissions once',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'flood-visitor-http-')),token='test-service-token-not-a-production-secret';
  const child=spawn(process.execPath,['apps/visitors/server.mjs'],{env:{...process.env,VISITOR_DATA_DIR:dir,VISITOR_TOKEN:token,PORT:'0'},stdio:['ignore','pipe','pipe']});
  try{
    const port=await new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(Error('Counter readiness timeout')),5000);
      let output='';child.once('error',reject);child.once('exit',()=>{clearTimeout(timeout);reject(Error('Counter exited'));});
      child.stdout.on('data',data=>{output+=data;const m=/listening on (\d+)/.exec(output);if(m){clearTimeout(timeout);resolve(m[1]);}});
    });
    const base=`http://127.0.0.1:${port}`;
    assert.equal((await fetch(base+'/health')).status,200);
    assert.equal((await fetch(base+'/visitors')).status,401);
    const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
    assert.equal((await (await fetch(base+'/visitors',{headers})).json()).total,0);
    const id=randomUUID();
    const responses=await Promise.all(Array.from({length:8},()=>fetch(base+'/visitors',{method:'POST',headers,body:JSON.stringify({id})}).then(r=>r.json())));
    assert.ok(responses.every(result=>result.total===1));
    assert.equal((await fetch(base+'/visitors',{method:'POST',headers,body:JSON.stringify({id:'wrong'})})).status,400);
  }finally{const stopped=once(child,'exit');child.kill();await stopped;await rm(dir,{recursive:true,force:true});}
});

test('browser hashes deduplicate across connections/restarts without storing raw IDs',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'flood-visitors-')),file=join(dir,'counter.sqlite'),id=randomUUID();
  let store=visitorStore(file),other=visitorStore(file);
  try {
    assert.equal(store.read().total,0);
    const since=store.read().since;
    for(let n=0;n<10;n++){store.visit(id);other.visit(id);}
    assert.equal(other.read().total,1);
    assert.equal(store.visit(randomUUID()).total,2);
    assert.throws(()=>store.visit('../../x'),/identifier/);
    other.close();store.close();store=visitorStore(file);other=visitorStore(file);
    assert.equal(store.visit(id).total,2);assert.equal(store.read().since,since);
    assert.ok(!(await readFile(file)).includes(Buffer.from(id)));
  }finally{other.close();store.close();await rm(dir,{recursive:true,force:true});}
});

test('public proxy enforces origin/body, sanitizes response and fails without blocking website',async()=>{
  const keys=['VISITOR_SERVICE_URL','VISITOR_TOKEN'],saved=keys.map(k=>process.env[k]);
  let forwarded=0,authorization;const methods=[];
  const backend=createServer(async(req,res)=>{forwarded++;methods.push(req.method);authorization=req.headers.authorization;for await(const _ of req){}res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({total:17,since:'2026-10-28T00:00:00Z',private:'never forward'}));});
  const front=createServer((req,res)=>void visitorRequest(req,res,'https://flood.md'));
  try{
    backend.listen(0,'127.0.0.1');front.listen(0,'127.0.0.1');await Promise.all([once(backend,'listening'),once(front,'listening')]);
    const base=`http://127.0.0.1:${front.address().port}`;
    delete process.env.VISITOR_SERVICE_URL;delete process.env.VISITOR_TOKEN;
    assert.deepEqual(await (await fetch(base)).json(),{available:false});
    process.env.VISITOR_SERVICE_URL=`http://127.0.0.1:${backend.address().port}`;process.env.VISITOR_TOKEN='test-only-credential-not-a-real-secret';
    const send=(body,origin='https://flood.md',ua='Browser')=>fetch(base,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','User-Agent':ua},body});
    assert.equal((await send(JSON.stringify({id:randomUUID()}),'https://other.example')).status,403);
    assert.equal((await send(JSON.stringify({id:'invalid'}))).status,400);
    assert.equal((await send('x'.repeat(129))).status,413);
    assert.equal(forwarded,0);
    assert.equal((await send(JSON.stringify({id:randomUUID()}),'https://flood.md','crawler')).status,200);
    assert.equal(forwarded,1);
    assert.deepEqual(methods,['GET']);
    const response=await send(JSON.stringify({id:randomUUID()}));
    assert.deepEqual(await response.json(),{total:17,since:'2026-10-28T00:00:00Z'});
    assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(authorization,`Bearer ${process.env.VISITOR_TOKEN}`);
    assert.equal((await fetch(base)).status,200);
    backend.closeAllConnections();await new Promise(resolve=>backend.close(resolve));
    assert.deepEqual(await (await fetch(base)).json(),{available:false});
  }finally{
    for(const server of [front,backend]){server.closeAllConnections();if(server.listening)await new Promise(resolve=>server.close(resolve));}
    keys.forEach((k,i)=>{if(saved[i]===undefined)delete process.env[k];else process.env[k]=saved[i];});
  }
});
