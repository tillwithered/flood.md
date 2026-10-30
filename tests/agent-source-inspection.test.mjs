import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectSourceUI} from '../packages/agent/lib/inspect.mjs';

test('source review distinguishes visible native controls from selected Flood owners',()=>{
  const source=`<form><DatePicker label="Date"/><Select/><Button>Save</Button><table/></form>\nwindow.confirm('Discard?');\n<input type="date"/><select/><button>Save</button>`;
  const report=inspectSourceUI(source);
  assert.deepEqual(report.issues.map(issue=>issue.owner),['AlertDialog','DatePicker','Select','Button']);
  assert.equal(report.issues[0].line,2);assert.equal(report.issues[0].column,1);
  assert.equal(inspectSourceUI('<AlertDialog/><Grid/><Field><Input/></Field>').issues.length,0);
});
test('custom layout observations keep host shell decisions explicit and do not certify them',()=>{
  const report=inspectSourceUI('.tracks {display:grid;gap:1rem} header {display:flex} .flood-grid {display:grid}',{format:'css'});
  assert.deepEqual(report.issues.map(issue=>issue.owner),['Grid','Stack / Inline']);
  assert.match(report.issues[1].message,/shell/);
  const positioned=inspectSourceUI('body {margin:0}\n\n  .tracks {display:grid}',{format:'css'}).issues[0];
  assert.equal(positioned.line,3);assert.equal(positioned.column,3);
  assert.match(report.notChecked.join(' '),/not parsing/);
});
test('source observations are bounded, read-only text processing and disclose false-positive limits',()=>{
  const source='// window.confirm("example");\nwindow.confirm("Discard?");';
  const report=inspectSourceUI(source,{maxFindings:1});
  assert.equal(report.issues.length,1);assert.equal(report.truncated,true);
  assert.match(report.notChecked.join(' '),/comments/);
  assert.throws(()=>inspectSourceUI('x'.repeat(500001)),/500000/);
  assert.throws(()=>inspectSourceUI('',{maxFindings:0}),/maxFindings/);
  assert.throws(()=>inspectSourceUI('',{format:'html'}),/format/);
});
