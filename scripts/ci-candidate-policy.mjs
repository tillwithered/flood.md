export function trustedRun(run, repository, commit) {
  return Boolean(run && run.head_sha===commit && run.head_branch==='main' && run.event==='push' && run.status==='completed' && run.conclusion==='success' && run.head_repository?.full_name===repository && run.repository?.full_name===repository);
}
export function candidateArtifactIds(artifacts, commit, siteOnly=false) {
  const wanted=siteOnly ? {site_id:`website-runtime-${commit}`} : {candidate_id:`candidate-bytes-${commit}`,browser_id:`browser-build-${commit}`};
  return Object.fromEntries(Object.entries(wanted).map(([key,name])=>{
    const matches=artifacts.filter(artifact=>artifact.name===name && !artifact.expired);
    if(matches.length!==1 || !Number.isSafeInteger(matches[0].id) || matches[0].id<1)throw Error('Verified candidate artifact missing, expired or ambiguous');
    return [key,String(matches[0].id)];
  }));
}
export function assertStableRun(before, after, repository, commit) {
  if(!trustedRun(after,repository,commit) || before.id!==after.id || before.run_attempt!==after.run_attempt)throw Error('Candidate run changed during promotion');
}
