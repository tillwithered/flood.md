const aggregateTtl = 10_000;
const maxUpstreamRequests = 16;
let aggregate;
let upstreamRequests = 0;

async function readCounter(base, token, method, body) {
  if (upstreamRequests >= maxUpstreamRequests) throw Error('Counter busy');
  upstreamRequests++;
  try {
    const result = await fetch(new URL('/visitors',base), {method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body,redirect:'error',signal:AbortSignal.timeout(3000)});
    if (!result.ok) throw Error('Counter unavailable');
    const value = await result.json();
    if (!Number.isSafeInteger(value.total) || value.total<0 || !Number.isFinite(Date.parse(value.since))) throw Error('Invalid counter');
    return {total:value.total,since:value.since};
  } finally {
    upstreamRequests--;
  }
}

export async function visitorRequest(request, response, origin) {
  const json = (status, value) => { response.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}); response.end(JSON.stringify(value)); };
  const base = process.env.VISITOR_SERVICE_URL, token = process.env.VISITOR_TOKEN;
  if (!base || !token) return json(200,{available:false});
  if (!['GET','POST'].includes(request.method)) return json(405,{error:'Method not allowed'});
  let body, method=request.method;
  if (request.method === 'POST') {
    const allowed = request.headers.origin === origin || (process.env.NODE_ENV !== 'production' && request.headers.origin === `http://${request.headers.host}`);
    if (!allowed || request.headers['content-type'] !== 'application/json') return json(403,{error:'Same-origin JSON required'});
    if (/bot|spider|crawler|headless/i.test(request.headers['user-agent'] ?? '')) method='GET';
    try {
      let input = '';
      for await (const chunk of request) { input += chunk; if (Buffer.byteLength(input)>128) return json(413,{error:'Body too large'}); }
      const value = JSON.parse(input);
      if (typeof value.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value.id)) return json(400,{error:'Invalid visitor'});
      if(method==='POST') body = JSON.stringify({id:value.id});
    } catch { return json(400,{error:'Invalid request'}); }
  }
  try {
    if (method === 'POST') {
      aggregate = undefined;
      const value = await readCounter(base, token, method, body);
      aggregate = undefined;
      return json(200,value);
    }
    if (aggregate?.base !== base || aggregate.token !== token || aggregate.until <= Date.now()) {
      const pending = {base,token,until:Infinity};
      pending.value = readCounter(base, token, method).then(value => {
        pending.until = Date.now() + aggregateTtl;
        return value;
      }, error => {
        if (aggregate === pending) aggregate = undefined;
        throw error;
      });
      aggregate = pending;
    }
    json(200,await aggregate.value);
  } catch { json(200,{available:false}); }
}
