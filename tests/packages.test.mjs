import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Button,
  Checkbox,
  Field,
  Input,
} from "../packages/react/dist/index.js";

test("published React entry preserves Next client boundary", async () => {
  assert.match(
    await readFile("packages/react/dist/index.js", "utf8"),
    /^"use client";/,
  );
});
test("busy button is non-submitting and cannot be activated", () => {
  const html = renderToStaticMarkup(
    createElement(Button, { loading: true }, "Save"),
  );
  assert.match(html, /type="button"/);
  assert.match(html, /disabled=""/);
  assert.match(html, /aria-busy="true"/);
});
test("Field associates error, label and native control", () => {
  const html = renderToStaticMarkup(
    createElement(
      Field,
      { id: "email", label: "Email", error: "Required" },
      (props) => createElement(Input, { ...props, name: "email" }),
    ),
  );
  assert.match(html, /for="email"/);
  assert.match(html, /id="email"/);
  assert.match(html, /aria-describedby="email-error"/);
  assert.match(html, /aria-invalid="true"/);
});
test("checkbox keeps native form name/value and label", () => {
  const html = renderToStaticMarkup(
    createElement(Checkbox, {
      label: "Updates",
      name: "updates",
      value: "yes",
      defaultChecked: true,
    }),
  );
  assert.match(html, /type="checkbox"/);
  assert.match(html, /name="updates"/);
  assert.match(html, /value="yes"/);
  assert.match(html, /checked=""/);
  assert.match(html, /Updates/);
});
