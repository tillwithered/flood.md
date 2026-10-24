import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Field, Input, Textarea, Select } from "../packages/react/dist/index.js";

test("field status survives SSR for text and select variants without leaking a status HTML attribute", () => {
  for (const Component of [Input, Textarea, Select]) {
    for (const status of ["warning", "success", "info", "error"]) {
      const html = renderToStaticMarkup(h(Component, { status, "aria-label": "Value" }));
      assert.match(html, new RegExp(`data-status="${status}"`));
      assert.doesNotMatch(html, /\sstatus=/);
      if (status === "error") assert.match(html, /aria-invalid="true"/);
      else assert.doesNotMatch(html, /aria-invalid="true"/);
    }
  }
  const list = renderToStaticMarkup(h(Select, { status: "success", multiple: true, "aria-label": "Values" }));
  assert.match(list, /<select[^>]*data-status="success"/);
});

test("invalid semantics override advisory statuses and false aria-invalid stays advisory", () => {
  for (const Component of [Input, Textarea, Select]) {
    for (const props of [{ invalid: true }, { "aria-invalid": true }, { "aria-invalid": "grammar" }]) {
      assert.match(renderToStaticMarkup(h(Component, { status: "success", ...props })), /data-status="error"/);
    }
    assert.match(renderToStaticMarkup(h(Component, { status: "warning", "aria-invalid": "false" })), /data-status="warning"/);
  }
});

test("Field messages are associated, numeric zero is preserved, and errors suppress contradictory messages", () => {
  const render = (props) => renderToStaticMarkup(h(Field, { id: "value", label: "Value", ...props }, control => h(Input, control)));
  const advisory = render({ status: "warning", message: 0, describedBy: "external" });
  assert.match(advisory, /aria-describedby="external value-message"/);
  assert.match(advisory, /id="value-message"[^>]*>0<\/div>/);
  assert.doesNotMatch(advisory, /aria-invalid="true"|role="alert"/);
  const error = render({ status: "success", message: "Looks good", error: "Required" });
  assert.match(error, /data-status="error"/);
  assert.match(error, /aria-invalid="true"/);
  assert.match(error, /aria-describedby="value-error"/);
  assert.doesNotMatch(error, /Looks good|value-message/);
});
