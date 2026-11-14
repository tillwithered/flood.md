import test from 'node:test';
import assert from 'node:assert/strict';
import {browserShards,chromiumJobs,validShard} from '../scripts/ci-shards.mjs';

test('Chromium distributes the expensive catalog separately without removing test groups', () => {
  const jobs = chromiumJobs('full', 5);
  for (const [lane, count] of [['behavior', 7], ['catalog', 4]]) {
    const laneJobs = jobs.filter(job => job.lane === lane);
    assert.deepEqual(laneJobs.map(job => job.shard), Array.from({ length: count }, (_, index) => index + 1));
    assert.ok(laneJobs.every(job => job.total === count && validShard(`${job.shard}/${job.total}`)));
  }
  assert.ok(chromiumJobs('full', 12).every(job => validShard(`${job.shard}/${job.total}`)));
  assert.equal(chromiumJobs('publication', 5).length, 5);
  assert.deepEqual(chromiumJobs('integration', 5), [{ lane: 'all', shard: 1, total: 1 }]);
});
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
