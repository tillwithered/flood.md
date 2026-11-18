import catalog from "./generated/component-summaries.json";
import groups from "./component-groups.json";
import { docPages } from "../site-guides.mjs";
import { recipeByPath, recipeGroups } from "./recipe-directory";

type Kind = "Component" | "Recipe" | "Guide" | "Collection";
export type SearchScope = "all" | "categories" | "components" | "recipes" | "docs";
type Entry = { id: string; label: string; kind: Kind; scope: Exclude<SearchScope, "all" | "categories">; category?: boolean; description: string; keywords?: readonly string[] };

const normalize = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "")
  .replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const key = (value: string) => normalize(value).replaceAll(" ", "");

const entries: Entry[] = [
  ...catalog.map(page => ({
    id: "/components/" + page.slug, label: page.name, kind: "Component" as const, scope: "components" as const,
    description: page.description, keywords: [page.slug, groups.find(group => group.id === page.group)?.label ?? ""],
  })),
  ...docPages.map(page => {
    const recipe = recipeByPath.get(page.path);
    return { id: page.path, label: page.label, description: page.description, kind: recipe ? "Recipe" as const : "Guide" as const,
      scope: recipe ? "recipes" as const : "docs" as const,
      keywords: recipe?.keywords };
  }),
  ...recipeGroups.map(group => ({
    id: "/recipes/" + group.id, label: group.label, description: group.description, kind: "Collection" as const, scope: "recipes" as const,
    category: group.category,
  })),
  ...groups.map(group => ({
    id: "/components/category/" + group.id, label: group.label + " components",
    description: group.description, kind: "Collection" as const, scope: "components" as const,
  })),
];
const indexed = entries.map(entry => {
  const label = normalize(entry.label);
  const keywords = (entry.keywords ?? []).map(normalize);
  const text = [label, normalize(entry.description), normalize(entry.kind), ...keywords].join(" ");
  return { entry, label, keywords, text, words: text.split(" ") };
});

function nearSpelling(query: string, candidate: string) {
  if (query.length < 5 || Math.abs(query.length - candidate.length) > 1) return false;
  const [short, long] = query.length <= candidate.length ? [query, candidate] : [candidate, query];
  let index = 0;
  while (index < short.length && short[index] === long[index]) index++;
  if (short.length !== long.length) return short.slice(index) === long.slice(index + 1);
  return short.slice(index + 1) === long.slice(index + 1) ||
    (short[index] === long[index + 1] && short[index + 1] === long[index] && short.slice(index + 2) === long.slice(index + 2));
}

export function searchSite(query: string, scope: SearchScope): Entry[] {
  const phrase = normalize(query);
  if (!phrase) return [];
  const terms = phrase.split(" ");
  const joined = key(query);
  return indexed.flatMap(({ entry, label, keywords, text, words }) => {
    if (scope === "categories" ? !entry.category : scope !== "all" && scope !== entry.scope) return [];
    if (key(label) === joined) return [{ entry, score: 100 }];
    if (keywords.includes(phrase)) return [{ entry, score: 90 }];
    if (key(label).startsWith(joined)) return [{ entry, score: 80 }];
    if (label.includes(phrase)) return [{ entry, score: 70 }];
    if (keywords.some(keyword => keyword.includes(phrase))) return [{ entry, score: 60 }];
    if (!terms.every(term => text.includes(term))) {
      return !/\s/.test(query.trim()) && nearSpelling(joined, key(label)) ? [{ entry, score: 12 }] : [];
    }
    const starts = terms.filter(term => words.some(word => word.startsWith(term))).length;
    return [{ entry, score: 30 + starts + (entry.kind === "Recipe" && terms.length > 1 ? 4 : 0) }];
  }).sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label))
    .slice(0, 16).map(result => result.entry);
}
