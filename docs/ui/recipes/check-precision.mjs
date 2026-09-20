/** Isolated UI lab checks. Not a production accessibility audit. */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const css=readFileSync(new URL('./precision.css',import.meta.url),'utf8');
function tokens(selector){const start=css.indexOf(selector+' {');assert(start>=0,selector);const block=css.slice(start,css.indexOf('}',start));return Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*(#[\da-f]{6});/gi)].map(m=>[m[1],m[2]]));}
function lum(hex){assert(/^#[\da-f]{6}$/i.test(hex),'Opaque hex required: '+hex);const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
function ratio(a,b){const l=[lum(a),lum(b)].sort((a,b)=>a-b);return (l[1]+.05)/(l[0]+.05);}
const light=tokens('.precision');let count=0;
for(const [theme,t]of Object.entries({light,dark:{...light,...tokens('.precision[data-theme="dark"]')}})){
 const pairs=[['--on-ink','--ink',4.5],['--on-ink','--primary-hover',4.5]];
 for(const bg of ['--canvas','--panel','--surface','--field','--control-bg','--control-hover','--control-pressed','--row-hover','--row-selected'])for(const [fg,min]of [['--ink',4.5],['--muted',4.5],['--focus',3]])pairs.push([fg,bg,min]);
 for(const bg of ['--panel','--field','--row-hover','--row-selected'])pairs.push(['--boundary',bg,3]);
 for(const kind of ['danger','warning','success'])for(const bg of ['--panel','--row-hover','--row-selected','--'+kind+'-surface'])pairs.push(['--'+kind+'-text',bg,4.5]);
 for(const [fg,bg,min]of pairs){const v=ratio(t[fg],t[bg]);assert(v>=min,`${theme} ${fg}/${bg} ${v} < ${min}`);count++;}
 console.log(`${theme}: ${pairs.length} pairs passed`);
}
for(const role of ['--canvas','--panel','--ink','--muted','--edge','--control-bg','--control-hover','--control-pressed','--field','--row-hover','--row-selected'])assert(/^#([\da-f]{2})\1\1$/i.test(light[role]),'Light neutral role: '+role);
assert.equal(light['--canvas'],'#fafafa','Approved light canvas changed');
const html=readFileSync(new URL('./precision.html',import.meta.url),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'Duplicate HTML ids');
for(const m of html.matchAll(/aria-controls="([^"]+)"/g))assert(ids.includes(m[1]),'Missing controlled panel');
assert(!/https?:\/\//.test(html),'Specimen must not load external services');
console.log(`${count} opaque pairs; light neutrality, approved canvas and document links passed.`);
