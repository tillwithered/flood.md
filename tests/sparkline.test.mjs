import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";
import { Sparkline } from "../packages/react/dist/index.js";

test("Sparkline exposes a single accessible description and leaves gaps in the plot", () => {
  const label = "Revenue rose from $10 to $30 over five days";
  const html = render(h(Sparkline, { label, showLabel: true, values: [10, 20, null, NaN, 30] }));

  assert.match(html, /role="img" aria-label="Revenue rose from \$10 to \$30 over five days"/);
  assert.match(html, /<svg[^>]*aria-hidden="true" focusable="false"/);
  assert.match(html, /class="flood-sparkline__line" d="M3\.00 29\.00 L25\.50 16\.00 M93\.00 3\.00"/);
  assert.match(html, /class="flood-sparkline__point" d="M93\.00 3\.00h0"/);
  assert.match(html, /aria-hidden="true"[^>]*>Revenue rose from \$10 to \$30 over five days</);
});

test("Sparkline preserves a shared domain and handles empty, flat and extreme series", () => {
  const renderValues = (values, domain) => render(h(Sparkline, { label: "Revenue", values, domain }));

  assert.match(renderValues([25, 50], [0, 100]), /d="M3\.00 22\.50 L93\.00 16\.00"/);
  assert.match(renderValues([50, 100], [0, 100]), /d="M3\.00 16\.00 L93\.00 3\.00"/);
  assert.match(renderValues([30, 30]), /d="M3\.00 16\.00 L93\.00 16\.00"/);
  assert.match(renderValues([0]), /class="flood-sparkline__point" d="M48\.00 16\.00h0"/);
  assert.match(renderValues([-Number.MAX_VALUE, 0, Number.MAX_VALUE]), /d="M3\.00 29\.00 L48\.00 16\.00 L93\.00 3\.00"/);

  const empty = render(h(Sparkline, { label: "Revenue unavailable", values: [null, Infinity] }));
  assert.doesNotMatch(empty, /<svg/);
  assert.match(empty, /aria-label="Revenue unavailable"/);
  assert.match(empty, /aria-hidden="true"[^>]*>—</);
});

test("Sparkline area fills only contiguous segments and each plot owns its gradient", () => {
  const props = { label: "Revenue", values: [1, 2, null, 3, 4] };
  const html = render(h("div", null, h(Sparkline, props), h(Sparkline, props)));
  const gradients = [...html.matchAll(/<linearGradient id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(gradients).size, 2);
  const paths = [...html.matchAll(/class="flood-sparkline__area" d="([^"]+)" fill="url\(#([^"]+)\)"/g)];
  assert.deepEqual(paths.map(match => match[2]), gradients);
  assert.match(paths[0][1], /^M3\.00 [^Z]+ L25\.50 32 H3\.00 Z M70\.50 [^Z]+ L93\.00 32 H70\.50 Z$/);
  assert.doesNotMatch(render(h(Sparkline, { ...props, variant: "line" })), /linearGradient|flood-sparkline__area/);
});
