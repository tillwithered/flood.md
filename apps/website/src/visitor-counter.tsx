import { useEffect, useState } from 'react';
import { Text } from '@flood-md/react';

type Count = {total:number;since:string};
let pending: Promise<Count | null> | undefined;
function loadCount() {
  if (pending) return pending;
  pending = (async () => {
    let id:string|null = null;
    try {
      id = localStorage.getItem('flood.visitor.v1');
      if (!id || !/^[0-9a-f-]{36}$/.test(id)) { id=crypto.randomUUID();localStorage.setItem('flood.visitor.v1',id); }
    } catch { id=null; /* No durable browser storage: show totals without counting. */ }
    const request = async (register:boolean) => fetch('/api/visitors',{method:register?'POST':'GET',credentials:'omit',headers:register?{'Content-Type':'application/json'}:undefined,body:register?JSON.stringify({id}):undefined,signal:AbortSignal.timeout(5000)});
    let response = await request(Boolean(id));
    if (!response.ok && id) response = await request(false);
    if (!response.ok) return null;
    const value:Count = await response.json();
    return Number.isSafeInteger(value.total)&&value.total>=0&&Number.isFinite(Date.parse(value.since))?value:null;
  })().catch(()=>null);
  return pending;
}
export function VisitorCounter() {
  const [count,setCount] = useState<Count|null>(null);
  useEffect(()=>{let active=true;void loadCount().then(value=>{if(active)setCount(value);});return()=>{active=false;};},[]);
  return <Text size="helper" tone="subtle" className="visitor-counter" title={count?`Unique browsers since ${new Date(count.since).toISOString().slice(0,10)}. Another device or cleared browser storage counts again.`:'Unique browser count is temporarily unavailable.'}>
    {count?`${new Intl.NumberFormat('en-US').format(count.total)} ${count.total===1?'visitor':'visitors'}`:'Visitors —'}
  </Text>;
}
