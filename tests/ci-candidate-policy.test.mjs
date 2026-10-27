import test from 'node:test';
import assert from 'node:assert/strict';
import {trustedRun,candidateArtifactIds,assertStableRun} from '../scripts/ci-candidate-policy.mjs';
const repo='owner/flood', commit='a'.repeat(40);
const run={id:1,run_attempt:1,head_sha:commit,head_branch:'main',event:'push',status:'completed',conclusion:'success',repository:{full_name:repo},head_repository:{full_name:repo}};
test('only successful exact-source main push runs can supply release bytes',()=>{
  assert.equal(trustedRun(run,repo,commit),true);
  for(const change of [{event:'pull_request'},{conclusion:'failure'},{status:'in_progress'},{head_sha:'b'.repeat(40)},{head_repository:{full_name:'fork/flood'}}])assert.equal(trustedRun({...run,...change},repo,commit),false);
});
test('promotion pins artifact IDs and refuses expired, ambiguous or rerun candidates',()=>{
  const artifacts=[{id:11,name:`candidate-bytes-${commit}`,expired:false},{id:12,name:`browser-build-${commit}`,expired:false}];
  assert.deepEqual(candidateArtifactIds(artifacts,commit),{candidate_id:'11',browser_id:'12'});
  assert.throws(()=>candidateArtifactIds(artifacts.map(a=>({...a,expired:true})),commit));
  assert.throws(()=>candidateArtifactIds([...artifacts,artifacts[0]],commit));
  assertStableRun(run,run,repo,commit);
  assert.throws(()=>assertStableRun(run,{...run,run_attempt:2},repo,commit));
  assert.throws(()=>assertStableRun(run,{...run,status:'in_progress'},repo,commit));
});
