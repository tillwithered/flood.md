import type { CommandListItem } from "@flood-md/react";
import { ArrowUpRight, BookOpen, Boxes, Columns3, CreditCard, Images, Layers3, ListChecks, MessageSquarePlus, PanelsTopLeft, Rows3, ShoppingBag, Terminal } from "lucide-react";
import { docPages } from "../site-guides.mjs";
import { directoryComponents, directoryGroups } from "./component-directory-data";
import { recipeByPath, recipeCategories, recipeGroups } from "./recipe-directory";
import release from "./release.json";
import releaseHighlights from "./release-highlights.json";
import type { SearchScope } from "./site-search-model";

const versions: Record<string, readonly { slug: string; summary: string }[]> = releaseHighlights;
const releaseIcons = { "message-composer": MessageSquarePlus, "comparison-table": Columns3, "image-gallery": Images };
const productIcons: Record<string, typeof Boxes> = { fintech: CreditCard, "e-commerce": ShoppingBag, saas: PanelsTopLeft };
const releaseItems: CommandListItem[] = (versions[release.version] ?? []).flatMap(highlight => {
  const component = directoryComponents.find(entry => entry.slug === highlight.slug);
  if (!component) return [];
  const Icon = releaseIcons[highlight.slug as keyof typeof releaseIcons] ?? Boxes;
  return [{ id: `/components/${component.slug}`, label: component.name, description: highlight.summary,
    group: `${release.published ? "New in" : "Preview of"} ${release.version}`, icon: <Icon data-release-highlight="" /> }];
});

const taskItems = [
  { path: "/docs/recipes/filter-bar", label: "Filter and sort records", description: "Search, filters and a data table", icon: ListChecks },
  { path: "/docs/recipes/navigation-workspace", label: "Build an app workspace", description: "Sidebar, routes and focus", icon: Layers3 },
  { path: "/docs/recipes/form-submission", label: "Validate and submit a form", description: "Pending, error and success states", icon: Rows3 },
];

const componentFamilies: CommandListItem[] = directoryGroups.map(group => ({
  id: `/components/category/${group.id}`, label: group.label,
  description: `${group.components.length} components`, group: "Component families",
}));

function guideItems(group: string, paths: readonly string[]) {
  return paths.flatMap(path => {
    const guide = docPages.find(page => page.path === path);
    return guide ? [{ id: guide.path, label: guide.label, description: guide.description,
      group, icon: group === "For agents" ? <Terminal /> : <BookOpen /> }] : [];
  });
}

export const browseItems: Record<SearchScope, readonly CommandListItem[]> = {
  all: [
    ...releaseItems,
    ...(releaseItems.length && release.published ? [{
      id: `https://github.com/tillwithered/flood.md/releases/tag/v${release.version}`, label: "Release notes",
      group: releaseItems[0].group, icon: <ArrowUpRight data-release-notes="" />,
    }] : []),
    ...taskItems.filter(task => recipeByPath.has(task.path)).map(({ path, label, description, icon: Icon }) => ({
      id: path, label, description, group: "Start with a task", icon: <Icon />,
    })),
    ...recipeCategories.slice(0, 3).map(category => {
      const Icon = productIcons[category.id] ?? Boxes;
      return { id: `/recipes/${category.id}`, label: category.label, group: "Browse by product", icon: <Icon /> };
    }),
  ],
  categories: [
    ...recipeCategories.map(category => ({ id: `/recipes/${category.id}`, label: category.label,
      description: `${category.recipes.length} recipes`, group: "Categories" })),
    { id: "/categories", label: "Browse all categories", group: "Categories" },
  ],
  components: [...componentFamilies, { id: "/components", label: "Browse all components", group: "Component families" }],
  recipes: [
    ...recipeGroups.filter(collection => !collection.category).map(collection => ({
      id: `/recipes/${collection.id}`, label: collection.label, description: `${collection.recipes.length} recipes`, group: "Collections",
    })),
    { id: "/recipes", label: "Browse all recipes", group: "Collections" },
    ...["/docs/recipes/collection-views", "/docs/recipes/record-management", "/docs/recipes/settings-workspace"].flatMap(path => {
      const recipe = recipeByPath.get(path);
      return recipe ? [{ id: recipe.path, label: recipe.label, description: recipe.description, group: "Recipe examples", icon: <Rows3 /> }] : [];
    }),
  ],
  docs: [
    ...guideItems("Get started", ["/docs/installation", "/docs/foundations", "/docs/theming"]),
    ...guideItems("For agents", ["/docs/mcp", "/docs/skills", "/docs/agent-knowledge"]),
  ],
};
