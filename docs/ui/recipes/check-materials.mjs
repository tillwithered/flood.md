/** Dependency-free checks for explicit opaque color pairs in this specimen.
 * Not a WCAG audit: gradients, composited alpha, real controls and all runtime
 * surfaces still require inspection. Run: node docs/ui/recipes/check-materials.mjs
 */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const css = readFileSync(new URL('./materials.css', import.meta.url), 'utf8');
function tokens(selector) {
  const start = css.indexOf(`${selector} {`);
  assert(start >= 0, `Missing block: ${selector}`);
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/(--[a-z-]+):\s*(#[0-9a-f]{6});/g)].map(m => [m[1], m[2]]));
}
function luminance(hex) {
  assert(/^#[0-9a-f]{6}$/i.test(hex), `Expected opaque hex, got ${hex}`);
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return channels.reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i], 0);
}
function ratio(a, b) {
  const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (high + 0.05) / (low + 0.05);
}
const light = tokens('.flood-materials');
const themes = { light, dark: { ...light, ...tokens('.flood-materials[data-theme="dark"]') } };
let checked = 0;
for (const [theme, t] of Object.entries(themes)) {
  const pairs = [
    ['--on-ink', '--ink', 4.5], ['--on-ink', '--primary-hover', 4.5],
    ['--danger-text', '--danger-surface', 4.5], ['--on-danger', '--danger-solid', 4.5],
    ['--on-danger', '--danger-text', 4.5], ['--warning-text', '--warning-surface', 4.5],
    ['--success-text', '--success-surface', 4.5],
    ['--danger-mark', '--danger-surface', 3], ['--danger-text', '--field', 3],
  ];
  for (const surface of ['--background', '--canvas', '--surface', '--elevated', '--field', '--hover', '--selected']) {
    pairs.push(['--ink', surface, 4.5], ['--muted', surface, 4.5],
      ['--focus-ring', surface, 3], ['--boundary-control', surface, 3]);
  }
  for (const [fg, bg, min] of pairs) {
    const value = ratio(t[fg], t[bg]);
    assert(value >= min, `${theme}: ${fg}/${bg} = ${value}, expected >= ${min}`);
    checked++;
  }
  console.log(`${theme}: ${pairs.length} opaque pairs passed`);
}
const legacy = ratio('#d92f55', '#fff0f3');
assert(legacy < 4.5, 'The documented legacy danger-text finding changed');
console.log(`Legacy danger ink on tinted surface: ${legacy.toFixed(3)}:1 (below 4.5; not used for specimen body text)`);
console.log(`${checked} pair checks passed. This does not certify production UI.`);
