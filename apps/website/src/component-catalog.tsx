import content from "./generated/content.json";
import taxonomy from "./component-groups.json";

export interface ComponentPage {
  slug: string;
  name: string;
  group: string;
  description: string;
  code: string;
  imports: string[];
  notes: string[];
  api: Array<[string, string, string]>;
  contract?: { props: Array<{ name: string; options?: Array<string | number | boolean>; defaultLiteral?: string | number | boolean }> };
}

export const componentPages: ComponentPage[] = content.components.map(page => ({
  ...page,
  api: page.api.map(([name, type, fallback]) => [name, type, fallback] as [string, string, string]),
}));

export const componentGroups = taxonomy.map(group => ({
  ...group,
  components: componentPages.filter(page => page.group === group.id).sort((a, b) => a.name.localeCompare(b.name)),
})).filter(group => group.components.length > 0);

export function matchesComponent(page: ComponentPage, query: string) {
  const group = taxonomy.find(group => group.id === page.group);
  const text = `${page.name} ${page.slug.replaceAll("-", " ")} ${page.description} ${group?.label ?? ""}`.toLowerCase();
  return query.trim().toLowerCase().split(/\s+/).every(word => text.includes(word));
}
