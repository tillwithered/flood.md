import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {SearchInput,PasswordInput,Field} from '../packages/react/dist/index.js';
test('SearchInput retains native search semantics and one named clear action',()=>{
 const html=render(h(Field,{id:'query',label:'Search'},p=>h(SearchInput,{...p,name:'q',defaultValue:'Flood'})));
 assert.match(html,/type="search"/);assert.match(html,/name="q"/);assert.match(html,/for="query"/);assert.match(html,/aria-label="Clear search"/);
 assert.doesNotMatch(render(h(SearchInput,{defaultValue:'Flood',readOnly:true})),/Clear search/);
 assert.doesNotMatch(render(h(SearchInput,{defaultValue:'Flood',clearable:false})),/Clear search/);
});
test('PasswordInput has one visibility action and controlled visibility takes precedence',()=>{
 const hidden=render(h(PasswordInput,{name:'password',defaultValue:'local-demo',autoComplete:'current-password'}));
 assert.match(hidden,/type="password"/);assert.match(hidden,/aria-label="Show password"/);assert.match(hidden,/autoComplete="current-password"/i);
 const visible=render(h(PasswordInput,{visible:true,defaultVisible:false,hidePasswordLabel:'Hide secret',readOnly:true}));
 assert.match(visible,/type="text"/);assert.match(visible,/aria-label="Hide secret"/);assert.match(visible,/readonly=""/i);
});
