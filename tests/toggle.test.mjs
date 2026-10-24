import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";
import { Toggle, ToggleGroup } from "../packages/react/dist/index.js";
const options = [{value: "a", label: "Alpha"}, {value: "b", label: "Beta", disabled: true}];

test("Toggle SSR exposes pressed state and owns native action semantics", () => {
  const html = render(h(Toggle, {defaultPressed: true}, "Bold"));
  assert.match(html, /aria-pressed="true"/); assert.match(html, /type="button"/);
  assert.match(render(h(Toggle, {pressed: false, defaultPressed: true}, "Bold")), /aria-pressed="false"/);
  assert.match(render(h(Toggle, {loading: true}, "Bold")), /disabled=""/);
  assert.doesNotMatch(html, /defaultPressed=|onPressedChange=/);
});

test("ToggleGroup SSR keeps named pressed buttons without form inputs", () => {
  const html = render(h(ToggleGroup, {label: "Formatting", options, defaultValue: ["a"]}));
  assert.match(html, /role="group" aria-label="Formatting"/);
  assert.equal((html.match(/<button/g) ?? []).length, 2);
  assert.match(html, /aria-pressed="true"/); assert.match(html, /disabled=""/);
  assert.doesNotMatch(html, /<input|role="radio"|role="tab"/);
  assert.throws(() => render(h(ToggleGroup, {label: "Bad", options: [options[0], options[0]]})), /unique/);
  assert.throws(() => render(h(ToggleGroup, {label: "Bad", options, selectionMode: "single", value: ["a", "b"]})), /at most one/);
  assert.throws(() => render(h(ToggleGroup, {label: "Bad", options, iconOnly: true})), /require icons/);
});
