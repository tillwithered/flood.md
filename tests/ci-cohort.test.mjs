import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogCohort} from '../scripts/ci-cohort.mjs';
test('catalog cohort defaults to complete coverage and rejects empty or unknown selection',()=>{
  const all=['date-field','textarea','button'];
  assert.deepEqual(catalogCohort(all),all);
  assert.deepEqual(catalogCohort(all,'date-field,textarea'),['date-field','textarea']);
  assert.throws(()=>catalogCohort(all,''));assert.throws(()=>catalogCohort(all,'missing'));
});
