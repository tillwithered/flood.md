import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Avatar, Badge, Button, Skeleton, Spinner } from "../packages/react/dist/index.js";

test("loading semantics distinguish standalone status and decorative button artwork", () => {
  const standalone = renderToStaticMarkup(h(Spinner, { label: "Загрузка" }));
  assert.match(standalone, /role="status"/);
  assert.match(standalone, /Загрузка/);
  const button = renderToStaticMarkup(h(Button, { loading: true }, "Saving"));
  assert.match(button, /disabled=""/);
  assert.match(button, /aria-busy="true"/);
  assert.match(button, /flood-loading/);
  assert.doesNotMatch(button, /role="status"|>Loading</);
  assert.match(button, />Saving<\/button>/);
});

test("identity and placeholders render deterministically without a client load", () => {
  const avatar = renderToStaticMarkup(h(Avatar, { name: "  Alex   Morgan ", src: "/alex.svg" }));
  assert.match(avatar, /role="img"/);
  assert.match(avatar, /aria-label="  Alex   Morgan "/);
  assert.match(avatar, />AM<\/span>/);
  assert.match(avatar, /alt=""/);
  assert.doesNotMatch(renderToStaticMarkup(h(Avatar, { name: "Alex", decorative: true })), /role="img"|aria-label=/);
  assert.match(renderToStaticMarkup(h(Avatar, { name: "李 明", fallback: "李" })), />李<\/span>/);
  const skeleton = renderToStaticMarkup(h(Skeleton, { shape: "rounded", width: "12rem", animate: false }));
  assert.match(skeleton, /aria-hidden="true"/);
  assert.match(skeleton, /width:12rem/);
  assert.doesNotMatch(skeleton, /role="status"/);
  assert.match(renderToStaticMarkup(h(Badge, { tone: "success" }, "Active")), />Active<\/span>/);
});
