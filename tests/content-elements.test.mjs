import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {AvatarGroup,CommentThread,StatusIndicator,Figure,Blockquote,InlineCode,Metric,Timeline,Timestamp} from '../packages/react/dist/index.js';

test('CommentThread validates IDs independently for each sibling list', () => {
  const comment = {id:'review',author:{name:'Maya Chen'},body:'Review'};
  const reply = {...comment,body:'Nested reply'};
  assert.match(render(h(CommentThread,{items:[{...comment,replies:[reply]}]})), /Nested reply/);
  assert.throws(() => render(h(CommentThread,{items:[comment,comment]})), /unique nonempty IDs/);
  assert.throws(() => render(h(CommentThread,{items:[{...comment,replies:[reply,reply]}]})), /unique nonempty IDs/);
  assert.throws(() => render(h(CommentThread,{items:[{...comment,id:' '}]})), /unique nonempty IDs/);
});

test('Timestamp distinguishes civil dates, offset instants and caller-provided labels', () => {
  const options = {lang: 'en-GB', timeZone: 'America/New_York'};
  assert.match(render(h(Timestamp, {...options, dateTime: '2026-11-14'})), />14 Nov 2026<\/time>/);
  assert.match(render(h(Timestamp, {...options, dateTime: '2026-11-14T02:30:00.123456+02:00'})), />13 Nov 2026<\/time>/);
  const authored = render(h(Timestamp, {dateTime: '09:10'}, '09:10'));
  assert.match(authored, /<time[^>]*datetime="09:10"[^>]*>09:10<\/time>/i);
  assert.doesNotMatch(authored, /lang=/);
  assert.throws(() => render(h(Timestamp, {dateTime: '2026-02-29T05:00Z'})), /explicit offset/);
});

test('Timestamp uses the caller’s relative reference and falls back at four weeks', () => {
  const dateTime = '2026-11-14T09:30:00Z';
  const label = new Intl.RelativeTimeFormat('en', {numeric: 'always', style: 'short'}).format(-2, 'hour');
  assert.ok(render(h(Timestamp, {dateTime, relativeTo: '2026-11-14T11:30:00Z'})).includes(`>${label}</time>`));
  assert.match(render(h(Timestamp, {dateTime, relativeTo: '2026-12-12T09:30:00Z'})), />Nov 14, 2026<\/time>/);
});

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
 const html=render(h(Metric,{label:'Error rate',value:'0.4%',trend:{direction:'down',label:'0.2 points lower',tone:'success'},hint:'Last 24 hours'}));assert.match(html,/<dt[^>]*><span[^>]*>Error rate<\/span>.*<\/dt>/);assert.match(html,/0.4%/);assert.match(html,/data-tone="success"/);assert.match(html,/0.2 points lower/);assert.match(html,/Last 24 hours/);
 assert.throws(()=>render(h(Metric,{label:'Value',value:1,trend:{direction:'up',label:''}})),/meaningful/);
});
test('Timeline keeps supplied order, current semantics and localized state names',()=>{
 const items=[{id:'created',title:'Created',state:'complete',dateTime:'2026-10-26T09:00:00Z',timeLabel:'09:00'},{id:'review',title:'Review',state:'current'}];const html=render(h(Timeline,{label:'Activity',items,stateLabels:{complete:'Done',current:'Now'}}));assert.ok(html.indexOf('Created')<html.indexOf('Review'));assert.match(html,/aria-current="step"/);assert.match(html,/Done:/);assert.match(html,/Now:/);assert.match(html,/<time[^>]*dateTime="2026-10-26T09:00:00Z"/i);assert.throws(()=>render(h(Timeline,{label:'Activity',items:[...items,{id:'other',title:'Another current',state:'current'}]})),/at most one/);
});

test('Timeline activity exposes past events without progress states or announcements', () => {
  const items = [
    {id: 'opened', title: 'Ticket opened', dateTime: '2026-10-26T09:00:00Z', timeLabel: '09:00'},
    {id: 'reproduced', title: 'Issue reproduced', state: 'current', description: 'Sam Rivera reproduced the error.'},
  ];
  const html = render(h(Timeline, {label: 'Ticket activity', mode: 'activity', items, stateLabels: {current: 'Now'}}));
  assert.match(html, /<ol[^>]*aria-label="Ticket activity"/);
  assert.ok(html.indexOf('Ticket opened') < html.indexOf('Issue reproduced'));
  assert.match(html, /Sam Rivera reproduced the error/);
  assert.match(html, /<time[^>]*datetime="2026-10-26T09:00:00Z"[^>]*>09:00<\/time>/i);
  assert.doesNotMatch(html, /aria-current|data-state|Upcoming:|Now:|role="status"/);
});
