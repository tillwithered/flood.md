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
