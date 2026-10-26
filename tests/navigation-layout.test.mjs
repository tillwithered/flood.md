import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {NavigationList,Steps,Section,Split,Center,SkipLink} from '../packages/react/dist/index.js';

const links=[{value:'overview',label:'Overview',href:'/overview',group:'Workspace'},{value:'activity',label:'Activity',href:'/activity',group:'Workspace'},{value:'settings',label:'Settings',href:'/settings',group:'Manage',linkProps:{target:'_blank',rel:'noopener'}}];
const steps=[{value:'details',title:'Details'},{value:'access',title:'Access',description:'Invite the team'},{value:'review',title:'Review',disabled:true}];

test('NavigationList keeps native grouped destinations and exactly one current page',()=>{
 const html=render(h(NavigationList,{label:'Project navigation',items:links,currentValue:'activity',size:'sm',dir:'rtl'}));
 assert.match(html,/<nav[^>]+aria-label="Project navigation"/);assert.match(html,/dir="rtl"/);assert.equal((html.match(/aria-current="page"/g)||[]).length,1);assert.equal((html.match(/<a /g)||[]).length,3);assert.match(html,/href="\/activity"[^>]+aria-current="page"/);assert.match(html,/target="_blank"/);assert.match(html,/rel="noopener"/);assert.match(html,/Workspace/);assert.match(html,/Manage/);assert.doesNotMatch(html,/role="menu|role="tab|<button/);
});
test('NavigationList and Steps reject ambiguous collection identities',()=>{
 assert.throws(()=>render(h(NavigationList,{label:'Navigation',items:[links[0],links[0]]})),/unique nonempty/);
 assert.throws(()=>render(h(NavigationList,{label:' ',items:links})),/name/);
 assert.throws(()=>render(h(Steps,{label:'Setup',items:[steps[0],steps[0]]})),/unique nonempty/);
 assert.throws(()=>render(h(Steps,{label:'Setup',items:steps,currentValue:'missing'})),/identify a step/);
});
test('Steps communicates progress as an ordered list and only opts into native actions',()=>{
 const html=render(h(Steps,{label:'Setup',items:steps,currentValue:'access'}));
 assert.match(html,/<ol[^>]+role="list"[^>]+aria-label="Setup"/);assert.equal((html.match(/aria-current="step"/g)||[]).length,1);assert.match(html,/data-state="complete"/);assert.match(html,/Completed/);assert.match(html,/Current step/);assert.match(html,/Upcoming/);assert.doesNotMatch(html,/<button|role="tab/);
 const interactive=render(h(Steps,{label:'Setup',items:steps,currentValue:'access',orientation:'vertical',onStepChange:()=>{}}));
 assert.equal((interactive.match(/<button/g)||[]).length,3);assert.match(interactive,/type="button"/);assert.match(interactive,/disabled=""/);assert.match(interactive,/data-orientation="vertical"/);
 const error=render(h(Steps,{label:'Setup',items:[steps[0],{...steps[1],status:'error'}],currentValue:'access',statusLabels:{complete:'Done',current:'Now',upcoming:'Next',error:'Needs review'}}));
 assert.match(error,/data-state="error"[^>]+aria-current="step"/);assert.match(error,/Needs review/);
});
test('Section owns a real labelled section and follows the document heading level',()=>{
 const html=render(h(Section,{id:'preferences',title:'Preferences',description:'Team settings',headingLevel:4,actions:h('button',{type:'button'},'Edit')},h('p',null,'Content')));
 assert.match(html,/<section[^>]+id="preferences"[^>]+aria-labelledby="preferences-title"/);assert.match(html,/<h4 id="preferences-title"/);assert.match(html,/Team settings/);assert.match(html,/Content/);assert.match(html,/Edit/);assert.doesNotMatch(html,/<main/);
 assert.throws(()=>render(h(Section,{title:' '})),/nonempty title/);
});
test('Split preserves logical reading order, pane responsibility and responsive policy',()=>{
 const start=render(h(Split,{main:h('p',null,'Primary content'),aside:h('p',null,'Supporting content'),side:'start',ratio:'main',collapseAt:'sm',gap:'3',dir:'rtl'}));
 assert.ok(start.indexOf('Supporting content')<start.indexOf('Primary content'));assert.match(start,/data-collapse="sm"/);assert.match(start,/data-side="start"/);assert.match(start,/--flood-layout-gap:var\(--flood-sys-space-3\)/);assert.doesNotMatch(start,/<main|<aside|role="separator"/);
 const end=render(h(Split,{main:'Primary content',aside:'Supporting content',side:'end'}));assert.ok(end.indexOf('Primary content')<end.indexOf('Supporting content'));
});
test('Center constrains its content while retaining native root attributes',()=>{
 const html=render(h(Center,{inline:true,maxWidth:'20rem',minHeight:'12rem',id:'centered',hidden:true},'Centered content'));
 assert.match(html,/id="centered"/);assert.match(html,/hidden=""/);assert.match(html,/data-inline="true"/);assert.match(html,/min-block-size:12rem/);assert.match(html,/--flood-center-max:20rem/);assert.match(html,/flood-center__content/);
});
test('SkipLink keeps native fragment navigation and requires a page target',()=>{
 const html=render(h(SkipLink,{href:'#main-content',lang:'en'}));assert.match(html,/<a[^>]+href="#main-content"/);assert.match(html,/Skip to content/);assert.match(html,/flood-skip-link/);assert.doesNotMatch(html,/role="button"|tabindex="-1"/);
 assert.throws(()=>render(h(SkipLink,{href:'/another-page'})),/same-page fragment/);assert.throws(()=>render(h(SkipLink,{href:'#'})),/nonempty/);
});
