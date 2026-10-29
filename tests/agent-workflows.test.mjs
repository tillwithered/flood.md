import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {posix} from 'node:path';
import {readAgentWorkflows,validateWorkflowIndex,workflowMarkdown} from '../scripts/agent-workflows.mjs';

const json=async path=>JSON.parse(await readFile(path,'utf8'));
test('every routed skill and its internal links resolve identically in source and installed bundle',async()=>{
  const manifest=await json('packages/agent/manifest.json');
  const index=await readAgentWorkflows();
  assert.equal(new Set(index.coverage.map(item=>item.name)).size,index.coverage.length);
  for(const item of index.workflows) {
    assert.ok(item.ruleIds.length);assert.ok(item.components.length);
    const mapped=manifest.files.find(file=>file.source===item.guide);
    assert.equal(mapped.kind,'skill');
  }
  for(const file of manifest.files.filter(file=>file.source.endsWith('.md'))) {
    const text=await readFile('packages/agent/'+file.source,'utf8');
    for(const match of text.matchAll(/\]\(([^\s)]+)\)/g)) {
      const link=match[1].split('#')[0];if(!link||/^(?:[a-z]+:|\/)/i.test(link))continue;
      const source=posix.normalize(posix.join(posix.dirname(file.source),link));
      const target=manifest.files.find(item=>item.source===source);
      assert.ok(target,`${file.source}: unshipped relative link ${link}`);
      assert.ok((await stat('packages/agent/'+source)).isFile());
      assert.equal(posix.normalize(posix.join(posix.dirname(file.target),link)),target.target,'Installed relative link changed meaning');
    }
  }
  const page=workflowMarkdown(index);
  for(const item of index.workflows)assert.ok(page.includes(`/agent/${item.guide}`));
});

test('workflow applicability rejects unshipped/ambiguous skills and unknown component inventory',()=>{
  const index={schemaVersion:1,workflows:[{id:'forms',guide:'references/flood-forms/SKILL.md',groups:['forms']}]};
  const manifest={entry:'SKILL.md',files:[{source:'references/flood-forms/SKILL.md',kind:'skill'}]};
  const catalog=[{name:'Input',slug:'input',group:'forms'}],groups=[{id:'forms'}];
  assert.deepEqual(validateWorkflowIndex(index,manifest,catalog,groups)[0].workflows,['forms']);
  const clone=()=>structuredClone(index);
  let broken=clone();broken.workflows.push({...broken.workflows[0]});assert.throws(()=>validateWorkflowIndex(broken,manifest,catalog,groups),/duplicate/);
  broken=clone();broken.workflows[0].guide='references/flood-missing/SKILL.md';assert.throws(()=>validateWorkflowIndex(broken,manifest,catalog,groups),/Unshipped/);
  broken=clone();broken.workflows[0].components=['Unknown'];assert.throws(()=>validateWorkflowIndex(broken,manifest,catalog,groups),/Unknown workflow component/);
  broken=clone();broken.workflows[0].groups=['unknown'];assert.throws(()=>validateWorkflowIndex(broken,manifest,catalog,groups),/Unknown workflow component group/);
  assert.throws(()=>validateWorkflowIndex(index,manifest,[{name:'Text',group:'typography'}],groups),/Unknown catalog/);
  assert.throws(()=>validateWorkflowIndex(index,manifest,[{name:'Text',group:'typography'}],[...groups,{id:'typography'}]),/no workflow/);
  assert.throws(()=>validateWorkflowIndex(index,{...manifest,files:[...manifest.files,{source:'references/flood-unrouted/SKILL.md',kind:'skill'}]},catalog,groups),/omitted/);
});

test('generated skills and composition examples match their canonical package and typed source',async()=>{
  const generated=await json('apps/website/src/generated/content.json');
  const index=await readAgentWorkflows();
  assert.ok(generated.docs['skills.md'].includes(workflowMarkdown(index)));
  const source=(await readFile('apps/website/src/recipes/workspace-review.tsx','utf8')).trimEnd();
  assert.ok(generated.docs['recipes/workspace-review.md'].includes('```tsx\n'+source+'\n```'));
  assert.ok(!generated.docs['skills.md'].includes('<!-- flood:workflows -->'));
  assert.ok(!generated.docs['recipes/workspace-review.md'].includes('<!-- flood:workspace-review -->'));
});
