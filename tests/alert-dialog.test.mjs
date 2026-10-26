import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {AlertDialog,Button} from '../packages/react/dist/index.js';
test('AlertDialog SSR preserves alert semantics, description and closed presentation',()=>{
 const html=render(h(AlertDialog,{id:'archive',title:'Archive project?',description:'Restore it later.',trigger:p=>h(Button,p,'Ask'),onConfirm:()=>{}}));
 assert.match(html,/role="alertdialog"/);assert.match(html,/aria-modal="true"/);assert.match(html,/aria-labelledby="archive-title"/);assert.match(html,/aria-describedby="archive-description"/);assert.match(html,/id="archive-description"[^>]*>Restore it later/);assert.doesNotMatch(html,/flood-overlay-close/);assert.doesNotMatch(html,/<dialog[^>]*\sopen(?:[\s=>])/);
});
