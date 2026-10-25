import test from "node:test";
import assert from "node:assert/strict";
import {createElement as h} from "react";
import {renderToStaticMarkup as render} from "react-dom/server";
import {Container,Grid,AspectRatio,Image,List,VisuallyHidden,EmptyState,Checkbox,Radio,Switch,CodeSnippet} from "../packages/react/dist/index.js";

test("structural atoms retain native semantics in server markup",()=>{
 const html=render(h(Container,{size:"sm",gutter:"4",id:"content"},h(Grid,{columns:3},h(AspectRatio,{ratio:1.5},h(Image,{src:"/image.svg",alt:"Preview",width:300,height:200})))));
 assert.match(html,/id="content"/);assert.match(html,/flood-container/);assert.match(html,/repeat\(3, minmax\(0, 1fr\)\)/);assert.match(html,/aspect-ratio:1.5/);assert.match(html,/alt="Preview"/);assert.match(html,/width="300"/);
 const list=render(h(List,{ordered:true,start:-2,reversed:true,marker:false},h("li",null,"First")));
 assert.match(list,/<ol/);assert.match(list,/start="-2"/);assert.match(list,/reversed=""/);assert.match(list,/role="list"/);assert.match(list,/<li>First<\/li>/);
 assert.match(render(h(VisuallyHidden,{focusable:true},h("a",{href:"#main"},"Skip"))),/flood-visually-hidden--focusable/);
});
test("aspect geometry rejects invalid ratios without guessing",()=>{
 for(const ratio of [0,-1,NaN,Infinity,-Infinity])assert.throws(()=>render(h(AspectRatio,{ratio})),/finite positive/);
 for(const ratio of [0.5,1,16/9])assert.match(render(h(AspectRatio,{ratio})),/aspect-ratio/);
 assert.throws(()=>render(h(List,{start:1.5})),/safe integer/);
 assert.throws(()=>render(h(Image,{src:"/unknown.svg"})),/explicit alt/);
 assert.doesNotThrow(()=>render(h(Image,{src:"/decorative.svg",alt:""})));
 assert.throws(()=>render(h(EmptyState,{title:"   "})),/nonempty title/);
});
test("mixed choice and static empty content keep distinct semantics",()=>{
 const html=render(h(Checkbox,{name:"all",label:"Select all",indeterminate:true,defaultChecked:true}));
 assert.match(html,/type="checkbox"/);assert.match(html,/aria-checked="mixed"/);assert.match(html,/checked=""/);assert.doesNotMatch(html,/indeterminate=/);
 const empty=render(h(EmptyState,{title:"No results",headingLevel:3}));assert.match(empty,/<h3/);assert.doesNotMatch(empty,/role="status"|role="alert"|flood-empty-state__actions|flood-empty-state__icon/);
});

test("code direction stays independent of host action layout",()=>{
 const html=render(h(CodeSnippet,{code:"npx flood",dir:"rtl"}));assert.match(html,/<div dir="rtl"/);assert.match(html,/<code dir="ltr"/);
 const override=render(h(CodeSnippet,{code:"مثال",codeDirection:"auto",dir:"rtl"}));assert.match(override,/<code dir="auto"/);
});

test("native choice scopes include their visible label",()=>{
 for (const Choice of [Checkbox,Radio,Switch]) {
  const html=render(h(Choice,{label:"Choice",dir:"rtl",lang:"ar",hidden:true}));
  assert.match(html,/<label(?=[^>]*hidden="")(?=[^>]*dir="rtl")(?=[^>]*lang="ar")[^>]*>/);
  assert.match(html,/<input(?=[^>]*dir="rtl")(?=[^>]*lang="ar")[^>]*>/);
 }
});
