import test from "node:test";
import assert from "node:assert/strict";
import {createElement as h} from "react";
import {renderToStaticMarkup as render} from "react-dom/server";
import {Tabs,Breadcrumb,Pagination} from "../packages/react/dist/index.js";
import {pageWindow} from "../packages/react/dist/page-window.js";

test("Tabs SSR pairs roving tabs with retained panels and a valid selection fallback",()=>{
  const items=[{value:"a",label:"Alpha",content:"Alpha content"},{value:"b",label:"Beta",content:"Beta content",disabled:true}];
  const html=render(h(Tabs,{label:"Sections",items}));assert.match(html,/role="tablist"/);assert.match(html,/aria-selected="true"/);
  assert.equal((html.match(/role="tabpanel"/g)??[]).length,2);assert.match(html,/>Beta content</);assert.match(html,/hidden=""/);
  const matches=[...html.matchAll(/ id="([^"]+)"/g)],ids=new Set(matches.map(match=>match[1]));assert.equal(ids.size,matches.length);
  for(const match of html.matchAll(/aria-controls="([^"]+)"/g))assert.ok(ids.has(match[1]));
  const disabled=render(h(Tabs,{label:"Sections",items,disabled:true}));assert.match(disabled,/aria-selected="true"/);
  assert.throws(()=>render(h(Tabs,{label:"Bad",items:[items[0],items[0]]})),/unique/);
});

test("Breadcrumb marks exactly the last item current and keeps separators decorative",()=>{
  const html=render(h(Breadcrumb,{items:[{label:"Home",href:"/"},{label:"Project"}]}));
  assert.match(html,/<nav[^>]*aria-label="Breadcrumb"/);assert.match(html,/<ol>/);assert.equal((html.match(/aria-current="page"/g)??[]).length,1);
  assert.match(html,/<span aria-current="page">Project/);assert.match(html,/aria-hidden="true">\//);
});

test("Pagination page windows are bounded, unique, ordered and include current/edge pages",()=>{
  for(const count of [1,2,5,8,20,100,Number.MAX_SAFE_INTEGER])for(const page of [...new Set([1,Math.ceil(count/2),count])])for(const siblings of [0,1,2]){
    const items=pageWindow(page,count,siblings),numbers=items.filter(value=>typeof value==="number");
    assert.ok(items.length<=2*siblings+5);assert.deepEqual(numbers,[...new Set(numbers)].sort((a,b)=>a-b));assert.ok(numbers.includes(page));assert.ok(numbers.includes(1));assert.ok(numbers.includes(count));
  }
  assert.throws(()=>pageWindow(0,20,1),/valid page/);assert.throws(()=>pageWindow(21,20,1),/valid page/);assert.throws(()=>pageWindow(1,0,1),/valid page/);assert.throws(()=>pageWindow(1,20,3),/siblingCount/);
  const html=render(h(Pagination,{page:1,pageCount:20,getHref:page=>`?page=${page}`}));
  assert.match(html,/href="\?page=2"/);assert.match(html,/role="link" aria-disabled="true"/);assert.equal((html.match(/aria-current="page"/g)??[]).length,1);
  assert.doesNotMatch(html,/href="\?page=0"/);
});
