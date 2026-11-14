/** Bound runner concurrency while keeping catalog work per shard stable. */
export function browserShards(componentCount, full = true) {
  if (!Number.isInteger(componentCount) || componentCount < 1) throw Error('Invalid catalog size');
  return {
    chromium: full ? Math.max(4, Math.min(12, Math.ceil(componentCount / 30))) : 4,
    engines: full ? Math.max(2, Math.min(4, Math.ceil(componentCount / 60))) : 2,
  };
}
export function validShard(value) {
  const match = /^([1-9]\d?)\/([1-9]\d?)$/.exec(value);
  return Boolean(match && Number(match[1]) <= Number(match[2]) && Number(match[2]) <= 12);
}

export function chromiumJobs(scope, shards) {
  if (scope === 'integration') return [{ lane: 'all', shard: 1, total: 1 }];
  if (scope !== 'full' && scope !== 'publication') throw Error('Unknown Chromium scope');
  const jobs = (lane, total) => Array.from({ length: total }, (_, index) => ({ lane, shard: index + 1, total }));
  if (scope === 'publication') return jobs('all', shards);
  // The latest full run spent more time in behavior than in the variant audit.
  const behavior = Math.min(12, Math.ceil(shards * 1.4));
  const catalog = Math.max(2, Math.ceil(shards * 0.8));
  return [...jobs('behavior', behavior), ...jobs('catalog', catalog)];
}
