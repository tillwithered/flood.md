import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RadioGroup, CheckboxGroup } from "../packages/react/dist/index.js";
const options = [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta", disabled: true }];

test("selection groups preserve native form inputs, group names and descriptions in SSR", () => {
  for (const Component of [RadioGroup, CheckboxGroup]) {
    const html = renderToStaticMarkup(h(Component, { name: "choices", legend: "Choices", options, form: "owner", hint: "Choose", defaultValue: Component === RadioGroup ? "a" : ["a"] }));
    assert.match(html, /<fieldset/);
    assert.match(html, /<legend[^>]*>Choices<\/legend>/);
    assert.match(html, /aria-describedby=/);
    assert.equal((html.match(/name="choices"/g) ?? []).length, 2);
    assert.match(html, /<input(?=[^>]*value="a")(?=[^>]*checked="")[^>]*>/);
    assert.match(html, /type="(?:radio|checkbox)"/);
    assert.doesNotMatch(html, /selected=|initial=|kind=|fieldsetComponent=/);
  }
});

test("groups require unique option values and retain an accessible empty state", () => {
  assert.throws(() => renderToStaticMarkup(h(RadioGroup, { name: "test", legend: "Choices", options: [options[0], options[0]] })), /unique/);
  const html = renderToStaticMarkup(h(CheckboxGroup, { name: "test", legend: "Choices", options: [] }));
  assert.match(html, /No options available/);
});
