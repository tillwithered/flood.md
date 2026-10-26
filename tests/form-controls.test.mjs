import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {ListBox,PinInput,Rating,Dropzone,CharacterCount} from '../packages/react/dist/index.js';
const options=[{value:'react',label:'React'},{value:'vue',label:'Vue'},{value:'locked',label:'Unavailable',disabled:true}];
test('ListBox keeps selection semantics separate from native submitted values',()=>{
 const single=render(h(ListBox,{label:'Framework',options,name:'framework',defaultValue:'react'}));
 assert.match(single,/role="listbox"/);assert.match(single,/role="option" aria-selected="true"/);assert.match(single,/type="hidden" name="framework"[^>]*value="react"/);assert.match(single,/aria-disabled="true"/);
 const multiple=render(h(ListBox,{label:'Frameworks',options,name:'frameworks',multiple:true,defaultValue:['react','react','vue']}));assert.match(multiple,/aria-multiselectable="true"/);assert.equal((multiple.match(/name="frameworks"/g)||[]).length,2);
 const controlled=render(h(ListBox,{label:'Fixed',options,value:'vue',defaultValue:'react',readOnly:true}));assert.match(controlled,/aria-readonly="true"/);assert.match(controlled,/id="[^"]+-option-1" role="option" aria-selected="true"/);assert.throws(()=>render(h(ListBox,{label:'Duplicate',options:[{value:'a',label:'A'},{value:'a',label:'Another'}]})),/unique nonempty/);
});
test('PinInput renders one labeled native code editor with decorative slots',()=>{
 const html=render(h(PinInput,{label:'Code',name:'code',length:4,defaultValue:'12-34',required:true,mask:true}));assert.equal((html.match(/<input/g)||[]).length,1);assert.equal((html.match(/data-pin-slot=""/g)||[]).length,4);assert.match(html,/type="password"/);assert.match(html,/autoComplete="one-time-code"/i);assert.match(html,/name="code"/);assert.match(html,/value="1234"/);assert.match(html,/pattern="\[0-9\]\{4\}"/);assert.throws(()=>render(h(PinInput,{label:'Code',length:0})),/from 1 to 12/);
});
test('Rating is a native named group with explicit radio labels and controlled precedence',()=>{
 const html=render(h(Rating,{label:'Experience',name:'rating',max:5,defaultValue:3,value:2,required:true}));assert.match(html,/role="radiogroup"/);assert.equal((html.match(/type="radio"/g)||[]).length,5);assert.equal((html.match(/name="rating"/g)||[]).length,5);assert.match(html,/checked="" value="2"|value="2"[^>]*checked=""/);assert.match(html,/aria-label="2 of 5 stars"/);assert.match(html,/required=""/);assert.throws(()=>render(h(Rating,{label:'Wrong',name:'',max:5})),/group name/);
});
test('Dropzone retains the successful native chooser and accept hint',()=>{
 const html=render(h(Dropzone,{label:'Attachments',name:'files',multiple:true,accept:'.pdf',required:true,description:'PDF documents'}));assert.match(html,/flood-dropzone/);assert.match(html,/type="file"/);assert.match(html,/name="files"/);assert.match(html,/accept=".pdf"/);assert.match(html,/multiple=""/);assert.match(html,/PDF documents/);assert.match(html,/aria-describedby="[^"]+-description"/);
});
test('CharacterCount counts Unicode code points and states an exceeded advisory limit',()=>{
 const html=render(h(CharacterCount,{value:'A😀',max:1,htmlFor:'note'}));assert.match(html,/>2 \/ 1</);assert.match(html,/Over limit/);assert.match(html,/data-over-limit="true"/);assert.match(html,/aria-live="off"/);assert.match(html,/for="note"/);
 const remaining=render(h(CharacterCount,{count:12,max:10,mode:'remaining',overLimitLabel:'Too long'}));assert.match(remaining,/>-2</);assert.match(remaining,/Too long/);assert.throws(()=>render(h(CharacterCount,{count:-1})),/nonnegative integer/);
});
