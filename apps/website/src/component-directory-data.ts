import componentSummaries from "./generated/component-summaries.json";
import taxonomy from "./component-groups.json";

export interface ComponentSummary {
  slug: string;
  name: string;
  group: string;
  description: string;
}

export const directoryComponents = componentSummaries satisfies ComponentSummary[];
export const directoryGroups = taxonomy.map(group => ({
  ...group,
  components: directoryComponents.filter(page => page.group === group.id).sort((a, b) => a.name.localeCompare(b.name)),
})).filter(group => group.components.length > 0);

export function matchesComponent(page: ComponentSummary, query: string) {
  const group = taxonomy.find(group => group.id === page.group);
  const text = `${page.name} ${page.slug.replaceAll("-", " ")} ${page.description} ${group?.label ?? ""}`.toLowerCase();
  return query.trim().toLowerCase().split(/\s+/).every(word => text.includes(word));
}
