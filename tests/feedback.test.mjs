import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";
import { Progress, Meter, Alert } from "../packages/react/dist/index.js";

test("Progress distinguishes zero, completion and unknown task progress", () => {
  const zero = render(h(Progress, { label: "Uploading", value: 0 }));
  assert.match(zero, /role="progressbar"/);
  assert.match(zero, /aria-valuenow="0"/);
  assert.match(zero, /inline-size:0%/);
  const half = render(h(Progress, { label: "Uploading", value: 100, max: 200, valueText: "One of two files" }));
  assert.match(half, /inline-size:50%/);
  assert.match(half, /aria-valuetext="One of two files"/);
  const unknown = render(h(Progress, { label: "Preparing", hideLabel: true }));
  assert.doesNotMatch(unknown, /aria-valuenow=/);
  assert.match(unknown, /data-indeterminate="true"/);
  assert.match(unknown, /flood-visually-hidden/);
  assert.match(unknown, /Preparing/);
});

test("Meter normalizes bounded negative ranges and rejects unknown or invalid values", () => {
  const html = render(h(Meter, { label: "Temperature", min: -50, max: 50, value: 0, valueText: "0 degrees" }));
  assert.match(html, /role="meter"/);
  assert.match(html, /aria-valuemin="-50"/);
  assert.match(html, /aria-valuemax="50"/);
  assert.match(html, /inline-size:50%/);
  for (const props of [{ value: undefined }, { value: NaN }, { value: Infinity }, { value: 101 }, { value: -1 }, { value: 0, max: 0 }, { value: 0, min: 100 }, { value: 0, max: Infinity }, { value: 0, min: -1e308, max: 1e308 }]) {
    assert.throws(() => render(h(Meter, { label: "Measurement", ...props })), RangeError);
  }
  assert.throws(() => render(h(Progress, { label: "Uploading", value: 101 })), RangeError);
});

test("Alert urgency is independent from visual tone and static content stays silent", () => {
  const staticMessage = render(h(Alert, { title: "Saved", tone: "success", icon: null }, "All changes saved"));
  assert.doesNotMatch(staticMessage, /role=|aria-live=|flood-alert__icon/);
  assert.match(staticMessage, /Saved/);
  for (const [announcement, role] of [["polite", "status"], ["assertive", "alert"]]) {
    const html = render(h(Alert, { announcement, tone: "warning" }, "Check storage"));
    assert.match(html, new RegExp(`role="${role}"`));
    assert.match(html, /aria-atomic="true"/);
    assert.match(html, /aria-hidden="true"/);
  }
  assert.match(render(h(Alert, { icon: null }, 0)), />0<\/div>/);
});
