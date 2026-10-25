import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";
import { DescriptionList, Table, Button } from "../packages/react/dist/index.js";

test("DescriptionList keeps native groups, rich values and stable item identities", () => {
  const html = render(h(DescriptionList, { items: [{ id: "owner", term: "Owner", description: h("a", { href: "/team" }, "Design team") }, { id: "count", term: "Members", description: 0 }] }));
  assert.match(html, /<dl[^>]*><div[^>]*><dt>Owner<\/dt><dd><a href="\/team">Design team<\/a><\/dd>/);
  assert.match(html, /<dd>0<\/dd>/);
  assert.doesNotMatch(html, /role="(?:term|definition)"/);
  assert.throws(() => render(h(DescriptionList, { items: [{id:"same",term:"One",description:1},{id:"same",term:"Two",description:2}] })), /unique/i);
  assert.throws(() => render(h(DescriptionList, { items: [{id:" ",term:"One",description:1}] })), /nonempty/i);
  assert.doesNotMatch(render(h(DescriptionList, { items: [] })), /<dt|<dd/);
});

test("Table preserves native headers, caption, form actions and host props before enhancement", () => {
  const html = render(h(Table, { caption: "Projects", hideCaption: true, dir: "rtl", id: "projects", style: { minWidth: "32rem" }, scrollLabel: "Project columns" },
    h("thead",null,h("tr",null,h("th",{scope:"col"},"Project"),h("th",{scope:"col","data-numeric":true},"Members"))),
    h("tbody",null,h("tr",null,h("th",{scope:"row"},"Flood"),h("td",null,h(Button,{type:"submit",form:"project-form"},"Save"))))));
  assert.match(html, /<table[^>]*id="projects"/);
  assert.match(html, /<caption class="flood-visually-hidden">Projects<\/caption>/);
  assert.match(html, /<th scope="col"/);
  assert.match(html, /<th scope="row"/);
  assert.match(html, /role="region" aria-label="Project columns"|aria-label="Project columns"[^>]*role="region"/);
  assert.match(html, /data-orientation="horizontal"/);
  assert.match(html, /type="submit"/);
  assert.match(html, /form="project-form"/);
  assert.doesNotMatch(html, /role="grid"|aria-sort=/);
});
