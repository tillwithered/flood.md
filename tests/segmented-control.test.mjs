import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";
import { SegmentedControl } from "../packages/react/dist/index.js";
const options = [{value:"day",label:"Day"},{value:"week",label:"Week",disabled:true}];

test("SegmentedControl keeps native single-choice form semantics and descriptions", () => {
  const html = render(h(SegmentedControl,{label:"Time range",name:"period",options,defaultValue:"day",required:true,hint:"Choose a range",form:"owner"}));
  assert.match(html, /<fieldset/); assert.match(html, /role="radiogroup"/);
  assert.equal((html.match(/type="radio"/g) ?? []).length,2);
  assert.equal((html.match(/name="period"/g) ?? []).length,2);
  assert.match(html, /<input(?=[^>]*value="day")(?=[^>]*checked="")[^>]*>/);
  assert.match(html, /aria-describedby=/); assert.match(html, /required=""/);
  assert.doesNotMatch(html, /aria-pressed=|role="tab"|fullWidth=|controlSize=/);
  const controlled = render(h(SegmentedControl,{label:"Range",name:"period",options,value:"week",defaultValue:"day"}));
  assert.match(controlled, /<input(?=[^>]*value="week")(?=[^>]*checked="")[^>]*>/);
});

test("SegmentedControl rejects ambiguous options and keeps icon names", () => {
  assert.throws(()=>render(h(SegmentedControl,{label:"Range",name:"period",options:[options[0],options[0]]})),/unique/);
  assert.throws(()=>render(h(SegmentedControl,{label:"Range",name:"period",options,iconOnly:true})),/require icons/);
  const html = render(h(SegmentedControl,{label:"Range",name:"period",iconOnly:true,options:[{...options[0],icon:h("svg",null)}]}));
  assert.match(html,/flood-segmented__name/); assert.match(html,/>Day</);
  assert.match(render(h(SegmentedControl,{label:"Range",name:"period",options:[]})),/No options available/);
});
