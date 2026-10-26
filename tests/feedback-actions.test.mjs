import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {CopyButton,ToastRegion} from '../packages/react/dist/index.js';
test('CopyButton retains native action semantics and localized stable labels',()=>{
 const html=render(h(CopyButton,{value:'local text',copyLabel:'Copy value',copiedLabel:'Value copied',errorLabel:'Try again',disabled:true}));
 assert.match(html,/type="button"/);assert.match(html,/disabled=""/);assert.match(html,/aria-label="Copy value"/);assert.match(html,/Value copied/);assert.match(html,/role="status"/);const named=render(h(CopyButton,{value:'x','aria-label':'Copy installation command'}));assert.match(named,/aria-label="Copy installation command"/);assert.throws(()=>render(h(CopyButton,{value:'x',resetDelay:-1})),/nonnegative/);
});
test('ToastRegion limits visible items and preserves named announcement semantics',()=>{
 const html=render(h(ToastRegion,{label:'Project notifications',inline:true,limit:1,items:[{id:'a',title:'Saved',status:'success'},{id:'b',title:'Failed',status:'error'}],onDismiss:()=>{}}));
 assert.match(html,/role="region"/);assert.match(html,/aria-label="Project notifications"/);assert.match(html,/role="status"/);assert.match(html,/Dismiss notification: Saved/);assert.doesNotMatch(html,/Failed/);assert.match(html,/data-inline="true"/);
 const error=render(h(ToastRegion,{items:[{id:'a',title:'Connection lost',status:'error'}],onDismiss:()=>{}}));assert.match(error,/role="alert"/);
});
test('ToastRegion rejects ambiguous queue identities and invalid timing',()=>{
 for(const items of [[{id:'',title:'A'}],[{id:'x',title:'A'},{id:'x',title:'B'}]])assert.throws(()=>render(h(ToastRegion,{items,onDismiss:()=>{}})),/unique nonempty/);
 assert.throws(()=>render(h(ToastRegion,{items:[],limit:0,onDismiss:()=>{}})),/positive integer/);
 assert.throws(()=>render(h(ToastRegion,{items:[{id:'a',title:'A',duration:-1}],onDismiss:()=>{}})),/nonnegative/);
});
