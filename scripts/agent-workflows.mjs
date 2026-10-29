import { readFile } from 'node:fs/promises';

export function validateWorkflowIndex(index, manifest, catalog, groups) {
  if (index.schemaVersion!==1 || !Array.isArray(index.workflows) || !index.workflows.length) throw Error('Invalid workflow index');
  const ids=new Set(), guides=new Set(), knownGroups=new Set(groups.map(group=>group.id)), names=new Set(catalog.map(component=>component.name));
  for(const workflow of index.workflows) {
    if(!/^[a-z][a-z0-9-]*$/.test(workflow.id??'') || ids.has(workflow.id) || guides.has(workflow.guide)) throw Error('Invalid or duplicate workflow identity');
    ids.add(workflow.id);guides.add(workflow.guide);
    if(!manifest.files.some(file=>file.source===workflow.guide&&file.kind==='skill') || !/^references\/flood-[a-z0-9-]+\/SKILL\.md$/.test(workflow.guide)) throw Error('Unshipped workflow skill');
    if(workflow.all!==true && !(workflow.groups?.length||workflow.components?.length)) throw Error('Workflow has no applicability');
    for(const id of workflow.groups??[]) if(!knownGroups.has(id)) throw Error('Unknown workflow component group');
    for(const name of workflow.components??[]) if(!names.has(name)) throw Error('Unknown workflow component');
  }
  const skills=manifest.files.filter(file=>file.kind==='skill'&&file.source!==manifest.entry);
  if(skills.some(file=>!guides.has(file.source))) throw Error('Skill omitted from workflow routing');
  return catalog.map(component=>{
    if(!knownGroups.has(component.group)) throw Error('Unknown catalog group');
    const workflows=index.workflows.filter(item=>item.all===true||item.groups?.includes(component.group)||item.components?.includes(component.name)).map(item=>item.id);
    if(!workflows.length) throw Error('Component has no workflow guidance');
    return {name:component.name,slug:component.slug,group:component.group,workflows};
  });
}

export async function readAgentWorkflows() {
  const read=async path=>JSON.parse(await readFile(path,'utf8'));
  const [index,manifest,catalog,groups,rules]=await Promise.all([
    read('packages/agent/workflows.json'),read('packages/agent/manifest.json'),
    read('apps/website/src/component-catalog.json'),read('apps/website/src/component-groups.json'),
    read('packages/agent/rules.json'),
  ]);
  const coverage=validateWorkflowIndex(index,manifest,catalog,groups);
  const workflows=await Promise.all(index.workflows.map(async item=>{
    const source=await readFile(`packages/agent/${item.guide}`,'utf8');
    const front=source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
    const name=front?.match(/^name:\s*([^\r\n]+)$/m)?.[1],description=front?.match(/^description:\s*([^\r\n]+)$/m)?.[1];
    if(name!==item.guide.split('/')[1] || !description?.trim()) throw Error('Workflow skill metadata differs from its source path');
    const ruleIds=rules.rules.filter(rule=>rule.guide===item.guide).map(rule=>rule.id);
    if(!ruleIds.length)throw Error('Workflow has no observable rules');
    return {...item,name,description,ruleIds,components:coverage.filter(component=>component.workflows.includes(item.id)).map(component=>component.name)};
  }));
  return {schemaVersion:1,version:manifest.version,workflows,coverage};
}

export function workflowMarkdown({workflows}) {
  const escape=value=>value.replaceAll('|','\\|');
  return '| Workflow | Use when | Skill source |\n| --- | --- | --- |\n'+workflows.map(item=>`| ${item.name} | ${escape(item.description)} | [Read skill](/agent/${item.guide}) |`).join('\n');
}
