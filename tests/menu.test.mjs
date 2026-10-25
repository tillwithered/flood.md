import test from "node:test";
import assert from "node:assert/strict";
import {createElement as h} from "react";
import {renderToStaticMarkup as render} from "react-dom/server";
import {Button, Menu} from "../packages/react/dist/index.js";
const trigger=props=>h(Button,props,"Actions");

test("Menu SSR connects its trigger and preserves real action/separator semantics",()=>{
  const html=render(h(Menu,{label:"Project actions",trigger,defaultOpen:true,items:[{id:"rename",label:"Rename"},{id:"divider",type:"separator"},{id:"delete",label:"Delete",disabled:true,tone:"danger",shortcut:"Delete"}]}));
  assert.match(html,/aria-haspopup="menu"/);assert.match(html,/aria-expanded="true"/);
  assert.match(html,/role="menu"/);assert.match(html,/role="menuitem"/);assert.match(html,/role="separator"/);
  assert.match(html,/aria-disabled="true"/);assert.match(html,/type="button"/);
  assert.match(html,/data-tone="danger"/);
  assert.doesNotMatch(html,/aria-selected=|role="listbox"|role="dialog"/);
  assert.doesNotMatch(render(h(Menu,{label:"Actions",trigger,items:[{id:"a",label:"Rename"}]})),/role="menuitem"/);
});

test("Menu rejects missing actions and ambiguous item identities",()=>{
  for(const items of [[],[{id:"line",type:"separator"}],[{id:"a",label:"One"},{id:"a",label:"Two"}],[{id:" ",label:"One"}],[{id:"a",label:" "}]])
    assert.throws(()=>render(h(Menu,{label:"Actions",trigger,items})),/Flood/);
});
