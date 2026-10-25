import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h}from'react';
import {renderToStaticMarkup as render}from'react-dom/server';
import {Tag,Field,MultiSelect}from'../packages/react/dist/index.js';
const options=[{value:'react',label:'React'},{value:'vue',label:'Vue'},{value:'locked',label:'Locked',disabled:true}];
test('Tag keeps label content static and gives its removal action a real name',()=>{
 const html=render(h(Tag,{onRemove:()=>{}},'Design'));assert.match(html,/<span class="flood-tag"/);assert.match(html,/aria-label="Remove Design"/);assert.match(html,/type="button"/);assert.doesNotMatch(html,/role="button"/);
 assert.throws(()=>render(h(Tag,{onRemove:()=>{}},h('em',null,'Rich label'))),/removeLabel/);
 const disabled=render(h(Tag,{disabled:true,onRemove:()=>{},removeLabel:'Remove label'},h('em',null,'Rich label')));assert.match(disabled,/disabled=""/);assert.match(disabled,/aria-label="Remove label"/);
 assert.doesNotMatch(render(h(Tag,null,'Static')) ,/<button/);
});
test('MultiSelect submits explicit repeated IDs and preserves Field associations in SSR',()=>{
 const html=render(h(Field,{id:'frameworks',label:'Frameworks',hint:'Select several'},p=>h(MultiSelect,{...p,options,name:'frameworks',defaultValue:['react','vue'],required:true})));
 assert.equal((html.match(/type="hidden"/g)||[]).length,2);assert.equal((html.match(/name="frameworks"/g)||[]).length,2);assert.match(html,/value="react"/);assert.match(html,/value="vue"/);assert.match(html,/aria-label="Remove React"/);assert.match(html,/aria-required="true"/);assert.doesNotMatch(html,/required=""/);assert.match(html,/for="frameworks"/);assert.match(html,/frameworks-selection/);
 const empty=render(h(MultiSelect,{options,name:'frameworks',required:true,'aria-label':'Frameworks'}));assert.doesNotMatch(empty,/type="hidden"/);assert.match(empty,/required=""/);
});
test('MultiSelect rejects ambiguous values and keeps controlled and readonly models separate',()=>{
 for(const props of [{defaultValue:['react','react']},{value:['']},{removeItemLabel:''}])assert.throws(()=>render(h(MultiSelect,{options,...props})),/Flood/);
 const html=render(h(MultiSelect,{options,value:['vue'],defaultValue:['react'],readOnly:true,'aria-label':'Frameworks'}));assert.match(html,/type="hidden"[^>]*value="vue"/);assert.doesNotMatch(html,/aria-label="Remove Vue"/);assert.doesNotMatch(html,/type="hidden"[^>]*value="react"/);
});
