import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { mkdirSync, chownSync, lstatSync } from 'node:fs';
import { visitorStore, validVisitor } from './store.mjs';

const directory = process.env.VISITOR_DATA_DIR;
const token = process.env.VISITOR_TOKEN;
if (!directory || !token || token.length < 32) throw Error('Persistent data directory and service token are required');
mkdirSync(directory, { recursive: true });
if (lstatSync(directory).isSymbolicLink()) throw Error('Data directory must not be a symlink');
// Railway volumes mount as root. Prepare only this dedicated directory, then
// drop privileges before opening SQLite or accepting any network traffic.
if (process.getuid?.() === 0) {
  chownSync(directory, 1000, 1000);
  process.setgroups([]); process.setgid(1000); process.setuid(1000);
}
const store = visitorStore(`${directory}/visitors.sqlite`);
const expected = Buffer.from(`Bearer ${token}`);
const server = createServer(async (request, response) => {
  const json = (status, value) => { response.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store'}); response.end(JSON.stringify(value)); };
  if (request.url === '/health' && request.method === 'GET') return json(200, {ok:true});
  const auth = Buffer.from(request.headers.authorization ?? '');
  if (auth.length !== expected.length || !timingSafeEqual(auth, expected)) return json(401,{error:'Unauthorized'});
  if (request.url !== '/visitors') return json(404,{error:'Not found'});
  if (request.method === 'GET') return json(200,store.read());
  if (request.method !== 'POST') return json(405,{error:'Method not allowed'});
  try {
    let body = '';
    for await (const chunk of request) { body += chunk; if (Buffer.byteLength(body)>128) return json(413,{error:'Body too large'}); }
    const {id} = JSON.parse(body);
    if (!validVisitor(id)) return json(400,{error:'Invalid visitor'});
    json(200, store.visit(id));
  } catch { json(400,{error:'Invalid request'}); }
});
server.requestTimeout = 5000; server.headersTimeout = 5000;
server.listen(Number(process.env.PORT ?? 4174), '::',()=>console.log(`Visitor counter listening on ${server.address().port}`));
const stop = () => server.close(()=>{store.close();process.exit(0);});
process.on('SIGTERM',stop);process.on('SIGINT',stop);
