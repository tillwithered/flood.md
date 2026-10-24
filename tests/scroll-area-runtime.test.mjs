import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Field, Input, ScrollArea } from "../packages/react/dist/index.js";

test("ScrollArea SSR preserves an accessible native viewport before enhancement", () => {
  const html = renderToStaticMarkup(h(ScrollArea, { id: "activity", "aria-label": "Activity log", style: { height: 160, width: 280 } }, h("p", null, "First activity")));
  assert.match(html, /class="flood-scroll-area"/);
  assert.match(html, /id="activity"/);
  assert.match(html, /role="region"/);
  assert.match(html, /tabindex="0"/);
  assert.match(html, /data-orientation="vertical"/);
  assert.match(html, /First activity/);
  assert.doesNotMatch(html, /data-scrollbars="overlay"|flood-scroll-area__track/);
  const horizontal = renderToStaticMarkup(h(ScrollArea, { orientation: "horizontal", tabIndex: -1, role: "group", "aria-label": "Example" }, "Content"));
  assert.match(horizontal, /data-orientation="horizontal"/);
  assert.match(horizontal, /tabindex="-1"/);
  assert.match(horizontal, /role="group"/);
});

test("Field descriptions normalize repeated external and generated associations", () => {
  const html = renderToStaticMarkup(h(Field, { id: "project", label: "Project", hint: "Hint", error: "Error", describedBy: " external   project-hint external " }, (props) => h(Input, props)));
  assert.match(html, /aria-describedby="external project-hint project-error"/);
  assert.match(html, /aria-invalid="true"/);
});

test("Field treats numeric zero as content and ignores non-rendering primitive messages", () => {
  const zero = renderToStaticMarkup(h(Field, { id: "zero", label: "Quantity", hint: 0, error: 0 }, (props) => h(Input, props)));
  assert.match(zero, /aria-describedby="zero-hint zero-error"/);
  assert.match(zero, /aria-invalid="true"/);
  assert.match(zero, /id="zero-hint"[^>]*>0<\/div>/);
  assert.match(zero, /id="zero-error"[^>]*role="alert">0<\/div>/);
  for (const content of [undefined, null, false, true, ""]) {
    const empty = renderToStaticMarkup(h(Field, { id: "empty", label: "Quantity", hint: content, error: content }, (props) => h(Input, props)));
    assert.doesNotMatch(empty, /aria-describedby|aria-invalid|role="alert"|id="empty-hint"/);
  }
});
