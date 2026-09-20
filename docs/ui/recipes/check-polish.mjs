/** Opaque-pair checks for the approved clean specimen. Not a WCAG audit. */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const base = readFileSync(new URL('./materials.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('./polish.html', import.meta.url), 'utf8');
const css = html.match(/<style>([\s\S]*?)<\/style>/)?.[1];
assert(css, 'Missing specimen CSS');
function tokens(source, selector) {
  const start = source.indexOf(selector + ' {');
  assert(start >= 0, 'Missing token block: ' + selector);
  const block = source.slice(start, source.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/(--[a-z-]+):\s*(#[0-9a-f]{6});/g)].map(m => [m[1],m[2]]));
}
function luminance(hex) {
  assert(/^#[0-9a-f]{6}$/i.test(hex), 'Expected opaque hex: ' + hex);
  const c = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255).map(v => v<=0.04045 ? v/12.92 : ((v+0.055)/1.055)**2.4);
  return c[0]*0.2126+c[1]*0.7152+c[2]*0.0722;
}
function ratio(a,b) { const [x,y]=[luminance(a),luminance(b)].sort((a,b)=>a-b); return (y+0.05)/(x+0.05); }
const baseline=tokens(base,'.flood-materials');
const themes={
  light:{...baseline,...tokens(css,'.flood-materials'),...tokens(css,'.flood-materials:not([data-theme="dark"])')},
  dark:{...baseline,...tokens(base,'.flood-materials[data-theme="dark"]'),...tokens(css,'.flood-materials'),...tokens(css,'.flood-materials[data-theme="dark"]')}
};
let checked=0;
for (const [theme,t] of Object.entries(themes)) {
  const pairs=[['--on-ink','--ink',4.5],['--on-ink','--primary-hover',4.5],['--danger-text','--danger-surface',4.5],['--warning-text','--warning-surface',4.5],['--success-text','--success-surface',4.5],['--boundary-control','--field',3],['--boundary-control','--panel-bg',3]];
  for (const surface of ['--canvas','--panel-bg','--surface','--field','--control-bg','--control-hover','--control-pressed','--row-hover','--row-selected']) {
    pairs.push(['--ink',surface,4.5],['--muted',surface,4.5],['--focus-ring',surface,3]);
  }
  for(const surface of ['--panel-bg','--row-hover','--row-selected']) {
    for(const state of ['--danger-text','--warning-text','--success-text']) pairs.push([state,surface,4.5]);
    pairs.push(['--selection-mark',surface,3]);
  }
  for(const [fg,bg,min] of pairs) { const value=ratio(t[fg],t[bg]); assert(value>=min,`${theme} ${fg}/${bg} = ${value.toFixed(3)} < ${min}`);checked++; }
  console.log(`${theme}: ${pairs.length} opaque pairs passed`);
}
// The rejected >=1.20 card/canvas target encouraged a heavy grey canvas.
// Test functional contrast above; review decorative separation on a full screen.
for(const name of ['--canvas','--panel-bg','--surface','--control-bg','--control-hover','--control-pressed','--control-edge','--row-hover','--row-selected','--quiet-edge','--muted']) {
  assert(/^#([0-9a-f]{2})\1\1$/i.test(themes.light[name]), `Light chrome must be neutral: ${name}`);
}
assert(luminance(themes.light['--canvas'])>luminance('#e9e9e6'), 'Avoid the rejected dark canvas');
assert(themes.light['--panel-bg']!==themes.light['--control-bg'], 'Control must not inherit its panel fill');
assert(themes.light['--quiet-edge']!==themes.light['--panel-bg'], 'Quiet edge must remain present');
const tasks=JSON.parse(html.match(/<script id="sample-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert(tasks.length===3 && new Set(tasks.map(t=>t.id)).size===3);
assert(tasks.every(t=>['id','title','source','updated','state','tone'].every(k=>typeof t[k]==='string')));
console.log(`${checked} pair checks; neutral-role and shared-data contracts passed. Not a production audit.`);
