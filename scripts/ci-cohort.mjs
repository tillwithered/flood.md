export function catalogCohort(slugs, requested = process.env.FLOOD_AFFECTED_COMPONENTS) {
  if (requested === undefined) return slugs;
  const selected = requested.split(',');
  if (!selected.length || selected.some(slug=>!slug || !slugs.includes(slug))) throw Error('Invalid affected catalog cohort');
  return slugs.filter(slug=>selected.includes(slug));
}
