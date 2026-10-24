import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, ButtonGroup, InputGroup, Field } from "../packages/react/dist/index.js";

test("ButtonGroup names independent native actions without changing their semantics", () => {
  const html = renderToStaticMarkup(h(ButtonGroup, { label: "Editing", orientation: "vertical" }, h(Button, { type: "submit" }, "Save"), h(Button, { disabled: true }, "Undo")));
  assert.match(html, /role="group" aria-label="Editing"/);
  assert.match(html, /data-orientation="vertical"/);
  assert.match(html, /type="submit"/);
  assert.match(html, /disabled=""/);
  assert.doesNotMatch(html, /role="toolbar"|tabindex=/);
});

test("InputGroup keeps Field associations on one native input and does not submit adornments", () => {
  const html = renderToStaticMarkup(h(Field, { id: "website", label: "Website", status: "warning", message: "Check this" }, props =>
    h(InputGroup, { ...props, name: "website", defaultValue: "example.com", start: "https://", end: h(Button, null, "Open"), readOnly: true })));
  assert.equal((html.match(/<input\b/g) ?? []).length, 1);
  assert.match(html, /<input(?=[^>]*id="website")(?=[^>]*name="website")(?=[^>]*value="example.com")(?=[^>]*readonly="")[^>]*>/i);
  assert.match(html, /aria-describedby="website-message"/);
  assert.match(html, /data-status="warning"/);
  assert.doesNotMatch(html, /\sstart=|\send=|value="https:\/\//);
  const empty = renderToStaticMarkup(h(InputGroup, { start: false, end: "", "aria-label": "Value" }));
  assert.doesNotMatch(empty, /flood-input-group__addon/);
});
