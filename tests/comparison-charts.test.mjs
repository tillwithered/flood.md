import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";
import { ComboChart, FunnelChart, LineChart, RadarChart, SankeyChart, ScatterChart } from "../packages/react/dist/index.js";

const label = "Example";
const categories = ["January", "February", "March"];
const series = [
  { id: "main", label: "Actual", values: [2, 5, 4] },
  { id: "secondary", label: "Previous", values: [1, 2, 3] },
];
const nodes = [{ id: "a", label: "Incoming" }, { id: "b", label: "Operations" }, { id: "c", label: "Reserve" }];
const link = (source, target, value) => ({ id: source + target, source, target, value });

test("LineChart area retains the default and adds separate stacked band boundaries", () => {
  const chart = (props) => render(h(LineChart, { label, categories, series, showYAxis: true, ...props }));
  const paths = (html) => [...html.matchAll(/flood-line-chart__area" d="([^"]+)"/g)].map(result => result[1]);
  assert.equal(paths(chart()).length, 1);
  assert.equal(paths(chart({ areaLayout: "overlay" })).length, 2);
  const bands = paths(chart({ areaLayout: "stacked" }));
  assert.equal(bands.length, 2);
  assert.match(bands[1], /L600 [\d.]+ L300 [\d.]+ L0 [\d.]+ Z$/);
  assert.match(chart({ areaLayout: "percent" }), />100%</);
  assert.throws(() => chart({ areaLayout: "percent", series: [{ ...series[0], values: [-1, 2, 3] }] }), /nonnegative/);
});

test("ComboChart uses independent axes and represents missing observations", () => {
  const html = render(h(ComboChart, { label, categories,
    series: [
      { ...series[0], values: [null, 5, 4], kind: "bar" },
      { ...series[1], values: [90, 95, 97], kind: "line", axis: "right" },
    ],
    rightAxis: { label: "Success rate", domain: [0, 100], formatValue: (value) => value + "%" },
  }));
  assert.match(html, /role="slider"/);
  assert.match(html, /January, Actual: No value, Previous: 90%/);
  assert.match(html, /Success rate/);
  assert.equal([...html.matchAll(/class="flood-comparison-chart__bar"/g)].length, 2);
  assert.throws(() => render(h(ComboChart, { label, categories,
    series: [{ ...series[0], kind: "bar" }], leftAxis: { label: "Count", domain: [1, 6] },
  })), /must be finite and contain/);
});

test("FunnelChart exposes exact stage counts and rejects an increasing cohort", () => {
  const stages = [{ id: "visit", label: "Visited", value: 100 }, { id: "trial", label: "Started trial", value: 20 }];
  const html = render(h(FunnelChart, { label, stages }));
  assert.match(html, /Visited, Value: 100, Of initial stage: 100%/);
  assert.match(html, />20</);
  assert.throws(() => render(h(FunnelChart, { label, stages: stages.slice().reverse() })), /nonincreasing/);
});

test("RadarChart leaves a gap for missing values and renders complete profiles as polygons", () => {
  const axes = categories.map((label, index) => ({ id: String(index), label }));
  const html = render(h(RadarChart, { label, axes,
    series: [series[0], { ...series[1], values: [null, 2, 3] }],
  }));
  assert.equal([...html.matchAll(/class="flood-comparison-chart__radar-profile"/g)].length, 1);
  assert.match(html, /January, Actual: 2, Previous: No value/);
  assert.match(render(h(RadarChart, { label, axes: [], series: [], emptyLabel: "No metrics" })), /No metrics/);
});

test("SankeyChart routes branches, omits unrelated nodes and rejects cyclic graphs", () => {
  const unused = { id: "d", label: "Unrelated desk" };
  const html = render(h(SankeyChart, { label, nodes: [...nodes, unused], links: [link("a", "b", 75), link("a", "c", 25)] }));
  assert.equal([...html.matchAll(/class="flood-comparison-chart__ribbon"/g)].length, 2);
  assert.equal([...html.matchAll(/class="flood-comparison-chart__node"/g)].length, 3);
  assert.match(html, /Incoming → Operations, Flow: 75/);
  assert.doesNotMatch(html, /Unrelated desk|NaN|Infinity/);
  assert.throws(() => render(h(SankeyChart, { label, nodes, links: [link("a", "b", 2), link("b", "a", 3)] })), /acyclic/);
});

test("ScatterChart pairs cohort and bubble size with exact observations", () => {
  const groups = [{ id: "a", label: "Preview" }, { id: "b", label: "Production" }];
  const points = [
    { id: "one", label: "First run", x: 12, y: 20, seriesId: "a", size: 2 },
    { id: "two", label: "Second run", x: 11, y: 19, seriesId: "b", size: 8 },
  ];
  const draw = (overrides) => render(h(ScatterChart, { label, xLabel: "Traffic", yLabel: "Latency",
    sizeLabel: "Requests", series: groups, points, ...overrides,
  }));
  const html = draw();
  assert.match(html, /First run, Preview, Traffic: 12, Latency: 20, Requests: 2/);
  assert.match(html, /flood-scatter-chart__legend/);
  assert.match(html, /--flood-scatter-diameter:0\.75rem/);
  assert.match(html, /--flood-scatter-diameter:1\.5rem/);
  assert.throws(() => draw({ sizeMax: 7 }), /contain all sizes/);
  assert.throws(() => draw({ points: [{ ...points[0], seriesId: "unknown" }] }), /defined series/);
});
