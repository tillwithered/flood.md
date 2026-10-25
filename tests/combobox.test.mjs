import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h}from'react';
import {renderToStaticMarkup as render}from'react-dom/server';
import {Combobox,Field}from'../packages/react/dist/index.js';
const options=[{value:'react',label:'React'},{value:'vue',label:'Vue',disabled:true}];
test('Combobox SSR preserves Field associations, selected IDs and native required input',()=>{
 const html=render(h(Field,{id:'framework',label:'Framework',hint:'Choose a runtime'},p=>h(Combobox,{...p,options,defaultValue:'react',name:'framework',required:true})));
 assert.match(html,/role="combobox"/);assert.match(html,/aria-autocomplete="list"/);assert.match(html,/aria-expanded="false"/);assert.match(html,/for="framework"/);assert.match(html,/id="framework"/);assert.match(html,/type="text"[^>]+value="React"/);assert.match(html,/type="hidden"[^>]+name="framework"[^>]+value="react"/);assert.match(html,/aria-describedby="framework-hint"/);
});
test('Combobox rejects ambiguous option identities and retains controlled precedence',()=>{
 for(const invalid of [[{value:'',label:'Empty'}],[{value:'a',label:''}],[{value:'a',label:'A'},{value:'a',label:'B'}]])assert.throws(()=>render(h(Combobox,{options:invalid})),/unique nonempty/);
 const html=render(h(Combobox,{options,value:'vue',defaultValue:'react','aria-label':'Framework',readOnly:true}));assert.match(html,/value="Vue"/);assert.match(html,/readonly=""/i);assert.match(html,/value="vue"/);assert.throws(()=>render(h(Combobox,{options,listLabel:''})),/nonempty/);
});

