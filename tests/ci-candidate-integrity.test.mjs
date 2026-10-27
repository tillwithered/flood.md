import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {candidateIdentity,verifyCandidate,packageNames,digest} from '../scripts/ci-artifacts.mjs';
test('candidate verification detects modified bytes, integrity and extra files',async()=>{
 const root=await mkdtemp(join(tmpdir(),'flood-candidate-'));
 try {
  const packages=[];
  for(const name of packageNames){const bytes=Buffer.from(name);const file=`flood-md-${name}-0.2.8.tgz`;await writeFile(join(root,file),bytes);packages.push({name,file,sha256:digest(bytes),integrity:'sha512-'+createHash('sha512').update(bytes).digest('base64')});}
  const manifest={schemaVersion:1,...await candidateIdentity(),packages};
  const save=()=>writeFile(join(root,'candidate.json'),JSON.stringify(manifest));await save();await verifyCandidate(root);
  packages[0].integrity='sha512-wrong';await save();await assert.rejects(verifyCandidate(root),/digest differs/);
  packages[0].integrity='sha512-'+createHash('sha512').update('tokens').digest('base64');await save();
  await writeFile(join(root,packages[0].file),'tampered');await assert.rejects(verifyCandidate(root),/digest differs/);
  await writeFile(join(root,packages[0].file),'tokens');await writeFile(join(root,'unexpected'),'extra');await assert.rejects(verifyCandidate(root),/Unexpected/);
 } finally {await rm(root,{recursive:true,force:true});}
});
