import test from 'node:test';
import assert from 'node:assert/strict';
import {browserShards,validShard} from '../scripts/ci-shards.mjs';
test('catalog growth scales bounded full-candidate concurrency; scoped PRs keep a stable runner budget',()=>{
  assert.deepEqual(browserShards(120),{chromium:4,engines:2});
  assert.deepEqual(browserShards(240),{chromium:8,engines:4});
  assert.deepEqual(browserShards(1000),{chromium:12,engines:4});
  assert.deepEqual(browserShards(1000,false),{chromium:4,engines:2});
  assert.throws(()=>browserShards(0));
});
test('invalid shard coordinates cannot silently omit coverage',()=>{
  for(const value of ['1/2','2/2','4/4','12/12'])assert.equal(validShard(value),true);
  for(const value of ['0/4','5/4','1/0','13/13','2','all','1/4 --grep skipped'])assert.equal(validShard(value),false);
});
