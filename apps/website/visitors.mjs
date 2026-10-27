export async function visitorRequest(request, response, origin) {
  const json = (status, value) => { response.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}); response.end(JSON.stringify(value)); };
  const base = process.env.VISITOR_SERVICE_URL, token = process.env.VISITOR_TOKEN;
  if (!base || !token) return json(503,{error:'Visitor counter unavailable'});
  if (!['GET','POST'].includes(request.method)) return json(405,{error:'Method not allowed'});
  let body;
  if (request.method === 'POST') {
    const allowed = request.headers.origin === origin || (process.env.NODE_ENV !== 'production' && request.headers.origin === `http://${request.headers.host}`);
    if (!allowed || request.headers['content-type'] !== 'application/json') return json(403,{error:'Same-origin JSON required'});
    if (/bot|spider|crawler|headless/i.test(request.headers['user-agent'] ?? '')) return json(403,{error:'Automated visit excluded'});
    try {
      let input = '';
      for await (const chunk of request) { input += chunk; if (Buffer.byteLength(input)>128) return json(413,{error:'Body too large'}); }
      const value = JSON.parse(input);
      if (typeof value.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value.id)) return json(400,{error:'Invalid visitor'});
      body = JSON.stringify({id:value.id});
    } catch { return json(400,{error:'Invalid request'}); }
  }
  try {
    const result = await fetch(new URL('/visitors',base), {method:request.method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body,redirect:'error',signal:AbortSignal.timeout(3000)});
    if (!result.ok) throw Error('Counter unavailable');
    const value = await result.json();
    if (!Number.isSafeInteger(value.total) || value.total<0 || !Number.isFinite(Date.parse(value.since))) throw Error('Invalid counter');
    json(200,{total:value.total,since:value.since});
  } catch { json(503,{error:'Visitor counter unavailable'}); }
}
