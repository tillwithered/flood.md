import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {FileInput,Field} from '../packages/react/dist/index.js';
test('FileInput keeps native file semantics and Field associations',()=>{
 const html=render(h(Field,{id:'attachments',label:'Attachments',hint:'PDF documents'},p=>h(FileInput,{...p,name:'files',multiple:true,required:true,accept:'.pdf',form:'upload'})));
 for(const pattern of [/type="file"/,/name="files"/,/multiple=""/,/required=""/,/accept=".pdf"/,/form="upload"/,/for="attachments"/,/aria-describedby="attachments-hint"/])assert.match(html,pattern);
 assert.doesNotMatch(html,/type="hidden"|Clear files|value=/);assert.match(html,/Choose files/);
});
test('FileInput localizes its empty view and preserves feedback/disabled',()=>{
 const html=render(h(FileInput,{'aria-label':'Documents',placeholder:'Choose a document',status:'warning',disabled:true,controlSize:'xl'}));
 assert.match(html,/Choose a document/);assert.match(html,/data-status="warning"/);assert.match(html,/disabled=""/);assert.match(html,/flood-control--xl/);
});
