import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {Drawer,Button} from '../packages/react/dist/index.js';
test('Drawer SSR preserves dialog associations and closed native presentation',()=>{
 const html=render(h(Drawer,{id:'settings',title:'Project settings',description:'Changes remain local.',side:'start',size:'lg',trigger:p=>h(Button,p,'Settings'),footer:h(Button,null,'Save')},'Editor content'));
 assert.match(html,/<dialog/);assert.match(html,/aria-modal="true"/);assert.match(html,/aria-labelledby="settings-title"/);assert.match(html,/aria-describedby="settings-description"/);assert.match(html,/flood-drawer/);assert.match(html,/data-side="start"/);assert.match(html,/data-size="lg"/);assert.doesNotMatch(html,/<dialog[^>]*\sopen(?:[\s=>])/);
});
