import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Label, Fieldset, Field, Input } from "../packages/react/dist/index.js";

test("Label and Field share native associations and a decorative required marker", () => {
  const label = renderToStaticMarkup(h(Label, { htmlFor: "name", required: true, title: "Name" }, "Project"));
  assert.match(label, /<label[^>]*for="name"/);
  assert.match(label, /class="flood-label"/);
  assert.match(label, /aria-hidden="true"> \*<\/span>/);
  assert.doesNotMatch(label, /required=/);
  const field = renderToStaticMarkup(h(Field, { id: "name", label: "Project", required: true }, props => h(Input, props)));
  assert.match(field, /<label[^>]*for="name"/);
  assert.match(field, /<input[^>]*required=""/);
});

test("Fieldset preserves native attributes and legend order, and normalizes group descriptions", () => {
  const html = renderToStaticMarkup(h(Fieldset, { id: "settings", legend: "Updates", name: "preferences", form: "settings-form", disabled: true,
    status: "success", hint: 0, error: "Choose a channel", message: "Looks good", "aria-describedby": "external settings-hint external" }, h(Input, { name: "channel" })));
  assert.match(html, /<fieldset[^>]*disabled=""/);
  assert.match(html, /name="preferences"/);
  assert.match(html, /form="settings-form"/);
  assert.match(html, /data-status="error"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /aria-describedby="external settings-hint settings-error"/);
  assert.match(html, /<legend class="flood-legend">Updates<\/legend>/);
  assert.match(html, /id="settings-hint"[^>]*>0<\/div>/);
  assert.doesNotMatch(html, /Looks good|settings-message/);
  const advisory = renderToStaticMarkup(h(Fieldset, { legend: "Updates", status: "warning", message: "Review choices" }));
  assert.doesNotMatch(advisory, /aria-invalid="true"/);
});
