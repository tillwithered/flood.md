import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {AvatarGroup,StatusIndicator,Figure,Blockquote,InlineCode,Metric,Timeline} from '../packages/react/dist/index.js';

test('AvatarGroup preserves identities and gives overflow an accessible count',()=>{
 const items=[{id:'alex',name:'Alex Morgan'},{id:'sam',name:'Sam Lee'},{id:'june',name:'June Park'}];
 const html=render(h(AvatarGroup,{label:'Collaborators',items,max:2,overflowLabel:'One more collaborator'}));
 assert.match(html,/<ul[^>]*aria-label="Collaborators"/);assert.match(html,/aria-label="Alex Morgan"/);assert.match(html,/aria-label="Sam Lee"/);assert.doesNotMatch(html,/aria-label="June Park"/);assert.match(html,/aria-label="One more collaborator"/);assert.match(html,/>\+1</);
 assert.throws(()=>render(h(AvatarGroup,{label:'Team',items:[items[0],items[0]]})),/unique/);assert.throws(()=>render(h(AvatarGroup,{label:'Team',items,max:0})),/positive/);
});
test('StatusIndicator keeps state text independent from color and announces only when requested',()=>{
 const normal=render(h(StatusIndicator,{label:'Operational',tone:'success'}));assert.match(normal,/Operational/);assert.match(normal,/data-tone="success"/);assert.doesNotMatch(normal,/role="status"/);assert.match(render(h(StatusIndicator,{label:'Updated',announce:true})),/role="status"/);
});
test('Figure, Blockquote and InlineCode retain their native text semantics',()=>{
 const figure=render(h(Figure,{caption:'Source: our own diagram',captionPosition:'before'},h('svg',{'aria-label':'Architecture'})));
 assert.ok(figure.indexOf('<figcaption')<figure.indexOf('<svg'));assert.match(render(h(Blockquote,{cite:'https://example.com/source',attribution:'A designer'},'Quoted <text>')),/<blockquote[^>]*cite="https:\/\/example.com\/source"/);assert.match(render(h(InlineCode,{wrap:false},'<script>')),/&lt;script&gt;/);
});
test('Metric uses one label for value, contextual trend and hint without inventing arithmetic',()=>{
 const html=render(h(Metric,{label:'Error rate',value:'0.4%',trend:{direction:'down',label:'0.2 points lower',tone:'success'},hint:'Last 24 hours'}));assert.match(html,/<dt[^>]*>Error rate<\/dt>/);assert.match(html,/0.4%/);assert.match(html,/data-tone="success"/);assert.match(html,/0.2 points lower/);assert.match(html,/Last 24 hours/);
 assert.throws(()=>render(h(Metric,{label:'Value',value:1,trend:{direction:'up',label:''}})),/meaningful/);
});
test('Timeline keeps supplied order, current semantics and localized state names',()=>{
 const items=[{id:'created',title:'Created',state:'complete',dateTime:'2026-10-26T09:00:00Z',timeLabel:'09:00'},{id:'review',title:'Review',state:'current'}];const html=render(h(Timeline,{label:'Activity',items,stateLabels:{complete:'Done',current:'Now'}}));assert.ok(html.indexOf('Created')<html.indexOf('Review'));assert.match(html,/aria-current="step"/);assert.match(html,/Done:/);assert.match(html,/Now:/);assert.match(html,/<time[^>]*dateTime="2026-10-26T09:00:00Z"/i);assert.throws(()=>render(h(Timeline,{label:'Activity',items:[...items,{id:'other',title:'Another current',state:'current'}]})),/at most one/);
});
