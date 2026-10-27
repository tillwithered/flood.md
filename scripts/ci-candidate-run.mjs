import { appendFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const { GITHUB_REPOSITORY: repository, GITHUB_TOKEN: token, GITHUB_OUTPUT: output } = process.env;
const commit = spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout?.trim();
if(!/^[a-f0-9]{40}$/.test(commit ?? '') || !/^[\w.-]+\/[\w.-]+$/.test(repository ?? '') || !token || !output)throw Error('Missing trusted candidate lookup context');
const request=async path=>{
  const response=await fetch(`https://api.github.com/repos/${repository}/${path}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error(`Candidate lookup failed: HTTP ${response.status}`);return response.json();
};
const {workflow_runs:runs}=await request(`actions/workflows/ci.yml/runs?head_sha=${commit}&branch=main&event=push&status=success&per_page=100`);
const run=runs.find(run=>run.head_sha===commit && run.head_branch==='main' && run.event==='push' && run.status==='completed' && run.conclusion==='success' && run.head_repository?.full_name===repository && run.repository?.full_name===repository);
if(!run)throw Error('No successful protected-main candidate for this exact release commit. Complete main CI before publishing; do not rebuild in the publisher.');
const {artifacts}=await request(`actions/runs/${run.id}/artifacts?per_page=100`);
for(const name of [`candidate-bytes-${commit}`,`browser-build-${commit}`])if(!artifacts.some(artifact=>artifact.name===name && !artifact.expired))throw Error('Verified candidate artifacts missing or expired; prepare a fresh verified candidate');
await appendFile(output,`run_id=${run.id}\ncommit=${commit}\n`);
console.log(`Promoting successful main CI ${run.id}, source ${commit}`);
