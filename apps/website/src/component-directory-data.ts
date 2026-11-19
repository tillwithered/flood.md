import componentSummaries from "./generated/component-summaries.json";
import taxonomy from "./component-groups.json";
import publicCatalog from "./public-catalog.json";
import { isPublicSite } from "../site-scope.mjs";

export interface ComponentSummary {
  slug: string;
  name: string;
  group: string;
  description: string;
}

export const directoryComponents = componentSummaries satisfies ComponentSummary[];
export const directoryGroups = taxonomy.map(group => ({
  ...group,
  components: directoryComponents.filter(page => page.group === group.id).sort((a, b) =>
    isPublicSite && group.id === "charts"
      ? publicCatalog.charts.indexOf(a.slug) - publicCatalog.charts.indexOf(b.slug)
      : a.name.localeCompare(b.name)),
})).filter(group => group.components.length > 0);

export function matchesComponent(page: ComponentSummary, query: string) {
  const group = taxonomy.find(group => group.id === page.group);
  const text = `${page.name} ${page.slug.replaceAll("-", " ")} ${page.description} ${group?.label ?? ""}`.toLowerCase();
  return query.trim().toLowerCase().split(/\s+/).every(word => text.includes(word));
}

const componentNameKey = (text: string) => text.toLowerCase().replace(/[\s_-]+/g, "");

export function searchDirectoryComponents(pages: readonly ComponentSummary[], query: string) {
  const key = componentNameKey(query);
  return pages.flatMap(page => {
    const name = componentNameKey(page.name);
    const slug = componentNameKey(page.slug);
    if (key && (name === key || slug === key)) return [{ page, rank: 0 }];
    if (key && (name.startsWith(key) || slug.startsWith(key))) return [{ page, rank: 1 }];
    if (key && (name.includes(key) || slug.includes(key))) return [{ page, rank: 2 }];
    return matchesComponent(page, query) ? [{ page, rank: 3 }] : [];
  }).sort((a, b) => a.rank - b.rank || a.page.name.localeCompare(b.page.name)).map(result => result.page);
}
