import catalog from "./generated/component-summaries.json";
import groups from "./component-groups.json";
import { docPages } from "../site-guides.mjs";
import { recipeByPath, recipeGroups } from "./recipe-directory";
import release from "./release.json";
import releaseHighlights from "./release-highlights.json";

type Kind = "Component" | "Recipe" | "Guide" | "Collection";
export type SearchScope = "all" | "categories" | "components" | "recipes" | "docs";
type Entry = {
  id: string;
  label: string;
  kind: Kind;
  scope: Exclude<SearchScope, "all" | "categories">;
  category?: boolean;
  description: string;
  aliases?: readonly string[];
  context?: string;
};

const normalize = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "")
  .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2").replace(/([a-z])([A-Z])/g, "$1 $2")
  .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const compact = (value: string) => value.replaceAll(" ", "");
const stopWords = new Set(["a", "an", "can", "could", "do", "find", "for", "how", "i", "in", "my", "please", "the", "to", "where", "with"]);
const termsOf = (value: string) => value.split(" ").filter(Boolean);
const significant = (terms: readonly string[]) => terms.filter(term => !stopWords.has(term));

const guideAliases: Record<string, readonly string[]> = {
  "/docs/installation": ["install Flood", "install CLI", "get started", "set up Flood", "add Flood to React", "установка"],
  "/docs/foundations": ["design tokens", "typography", "color tokens", "spacing tokens"],
  "/docs/theming": ["change theme", "custom theme", "dark mode", "theme colors"],
  "/docs/mcp": ["connect agent", "set up MCP", "Flood MCP", "coding agent integration"],
  "/docs/agents": ["agent instructions", "agent setup", "coding agent guide"],
};
const highlightsByVersion: Record<string, readonly { slug: string }[]> = releaseHighlights;
const highlightedSlugs = new Set(highlightsByVersion[release.version]?.map(highlight => highlight.slug));
const releaseAliases = ["what's new", "new components", `release ${release.version}`];

const entries: Entry[] = [
  ...catalog.map(page => ({
    id: "/components/" + page.slug, label: page.name, kind: "Component" as const, scope: "components" as const,
    description: page.description, aliases: highlightedSlugs.has(page.slug) ? [page.slug, ...releaseAliases] : [page.slug],
    context: groups.find(group => group.id === page.group)?.label,
  })),
  ...docPages.map(page => {
    const recipe = recipeByPath.get(page.path);
    return { id: page.path, label: page.label, description: page.description, kind: recipe ? "Recipe" as const : "Guide" as const,
      scope: recipe ? "recipes" as const : "docs" as const,
      aliases: recipe?.keywords ?? guideAliases[page.path] };
  }),
  ...recipeGroups.map(group => ({
    id: "/recipes/" + group.id, label: group.label, description: group.description, kind: "Collection" as const, scope: "recipes" as const,
    aliases: [group.id], category: group.category,
  })),
  ...groups.map(group => ({
    id: "/components/category/" + group.id, label: group.label + " components",
    description: group.description, aliases: [group.label], kind: "Collection" as const, scope: "components" as const,
  })),
];
const indexed = entries.map(entry => {
  const label = normalize(entry.label);
  const aliases = (entry.aliases ?? []).map(normalize);
  const titleTerms = significant(termsOf(label));
  const aliasTerms = aliases.map(alias => significant(termsOf(alias)));
  const aliasKeys = new Set([...aliases.map(compact), ...aliasTerms.map(terms => terms.join(""))]);
  const names = [...titleTerms, ...aliasTerms.flat()];
  const metadata = normalize([entry.description, entry.kind, entry.context ?? ""].join(" "));
  return { entry, titleKey: compact(label), aliasKeys, titleTerms, aliasTerms,
    names, words: [...names, ...termsOf(metadata)] };
});

function matchesTerm(word: string, term: string) {
  return word === term || (term.length > 1 && word.startsWith(term));
}

function includesPhrase(words: readonly string[], terms: readonly string[]) {
  return words.some((_, start) => start + terms.length <= words.length &&
    terms.every((term, offset) => matchesTerm(words[start + offset], term)));
}

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
  const allTerms = termsOf(phrase);
  const intentTerms = significant(allTerms);
  const terms = intentTerms.length ? intentTerms : allTerms;
  const joined = compact(phrase);
  const intentKey = terms.join("");
  return indexed.flatMap(({ entry, titleKey, aliasKeys, titleTerms, aliasTerms, names, words }) => {
    if (scope === "categories" ? !entry.category : scope !== "all" && scope !== entry.scope) return [];
    if (titleKey === joined) return [{ entry, score: 100 }];
    if (aliasKeys.has(joined) || aliasKeys.has(intentKey)) return [{ entry, score: 95 }];
    if (titleKey.startsWith(joined)) return [{ entry, score: 90 }];
    if (includesPhrase(titleTerms, terms)) return [{ entry, score: 80 }];
    if (aliasTerms.some(alias => includesPhrase(alias, terms))) return [{ entry, score: 75 }];
    if (terms.every(term => names.some(word => matchesTerm(word, term)))) return [{ entry, score: 65 }];
    if (terms.length <= 2 && allTerms.length === terms.length && nearSpelling(joined, titleKey)) return [{ entry, score: 50 }];
    if (!terms.every(term => words.some(word => matchesTerm(word, term)))) return [];
    const nameMatches = terms.filter(term => names.some(word => matchesTerm(word, term))).length;
    return [{ entry, score: 25 + (nameMatches / terms.length) * 10 }];
  }).sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label))
    .slice(0, 16).map(result => result.entry);
}
