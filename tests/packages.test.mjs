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
  FloodRoot,
  Text,
  Heading,
  Stack,
  Inline,
  Surface,
  IconButton,
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

test("foundation primitives separate semantics from appearance and opt in locally", () => {
  const html = renderToStaticMarkup(
    createElement(FloodRoot, { id: "local-theme" },
      createElement(Surface, { elevation: "raised", padding: "8" },
        createElement(Stack, { gap: "6" },
          createElement(Heading, { level: 3, size: "large" }, "Section"),
          createElement(Text, { as: "p", size: "compact", tone: "subtle" }, "Description"),
          createElement(Inline, { gap: "2", align: "baseline" }, "Actions"),
        ),
      ),
    ),
  );
  assert.match(html, /data-flood-foundations="neutral"/);
  assert.match(html, /data-flood-theme="dark"/);
  assert.match(html, /<h3 class="flood-heading flood-type--large">Section<\/h3>/);
  assert.match(html, /<p class="flood-text flood-type--compact flood-tone--subtle">Description<\/p>/);
  assert.match(html, /--flood-layout-gap:var\(--flood-sys-space-6\)/);
  assert.match(html, /align-items:baseline/);
  assert.doesNotMatch(html, /role="region"/);
});

test("Field required wiring preserves native input size independently of visual size", () => {
  const html = renderToStaticMarkup(
    createElement(Field,
      { id: "project", label: "Project", required: true, describedBy: "outside-note", hint: "Public name", error: "Required" },
      (props) => createElement(Input, { ...props, name: "project", size: 30, controlSize: "xl" }),
    ),
  );
  assert.match(html, /for="project"/);
  assert.match(html, /aria-describedby="outside-note project-hint project-error"/);
  assert.match(html, /required=""/);
  assert.match(html, /size="30"/);
  assert.match(html, /flood-control--xl/);
  assert.doesNotMatch(html, /controlSize=/);
});

test("icon button has a stable accessible name and decorative icon slot", () => {
  const html = renderToStaticMarkup(createElement(IconButton, { label: "Add item", size: "lg" }, "+"));
  assert.match(html, /aria-label="Add item"/);
  assert.match(html, /flood-button--lg/);
  assert.match(html, /<span aria-hidden="true"/);
  assert.match(html, /type="button"/);
});
