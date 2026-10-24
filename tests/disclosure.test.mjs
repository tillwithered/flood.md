import test from "node:test";
import assert from "node:assert/strict";
import {createElement as h} from "react";
import {renderToStaticMarkup as render} from "react-dom/server";
import {Collapsible, Accordion} from "../packages/react/dist/index.js";

test("disclosure SSR preserves IDs, hidden mounted panels and controlled precedence",()=>{
  const closed=render(h(Collapsible,{id:"extra",title:"Advanced"},h("input",{name:"prefix",defaultValue:"flood"})));
  assert.match(closed,/aria-expanded="false"/);assert.match(closed,/aria-controls="extra-panel"/);
  assert.match(closed,/<div[^>]*id="extra-panel"[^>]*hidden=""/);assert.match(closed,/name="prefix"/);
  const open=render(h(Collapsible,{title:"Advanced",open:true,defaultOpen:false,headingLevel:2},"Details"));
  assert.match(open,/<h2/);assert.match(open,/aria-expanded="true"/);assert.doesNotMatch(open,/hidden=""|defaultOpen=|headingLevel=/);
});

test("Accordion rejects duplicate keys and ambiguous single expansion",()=>{
  const item={value:"a",title:"Question",content:"Answer"};
  assert.throws(()=>render(h(Accordion,{label:"FAQ",items:[item,item]})),/unique/);
  assert.throws(()=>render(h(Accordion,{label:"FAQ",items:[item],value:["a","b"]})),/at most one/);
  const html=render(h(Accordion,{label:"FAQ",items:[item,{...item,value:"b",disabled:true}],expansionMode:"multiple",defaultValue:["a","b"]}));
  assert.equal((html.match(/aria-expanded="true"/g)??[]).length,2);assert.match(html,/disabled=""/);
  assert.equal(new Set([...html.matchAll(/ id="([^"]+)"/g)].map(match=>match[1])).size,6);
  assert.doesNotMatch(html,/role="region"|expansionMode=/);
});
