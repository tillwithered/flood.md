import type { CommandListItem } from "@flood-md/react";
import { BookOpen, Boxes, Columns3, Images, MessageSquarePlus, Palette, Rows3, Ruler, Terminal, Type, Zap } from "lucide-react";
import { docPages } from "../site-guides.mjs";
import { directoryComponents, directoryGroups } from "./component-directory-data";
import { recipes } from "./recipe-directory";
import release from "./release.json";
import releaseHighlights from "./release-highlights.json";
import type { SearchScope } from "./site-search-model";

const versions: Record<string, readonly string[]> = releaseHighlights;
const releaseIcons = { "message-composer": MessageSquarePlus, "comparison-table": Columns3, "image-gallery": Images };
const releaseItems: CommandListItem[] = (versions[release.version] ?? []).flatMap(slug => {
  const component = directoryComponents.find(entry => entry.slug === slug);
  if (!component) return [];
  const Icon = releaseIcons[slug as keyof typeof releaseIcons] ?? Boxes;
  return [{ id: `/components/${slug}`, label: component.name,
    group: `${release.published ? "New in" : "Preview of"} ${release.version}`, icon: <Icon data-release-highlight="" /> }];
});

const foundationItems: CommandListItem[] = [
  { id: "/docs/foundations#color-and-surfaces", label: "Color & surfaces", icon: Palette },
  { id: "/docs/foundations#inter-typography", label: "Typography", icon: Type },
  { id: "/docs/layout", label: "Spacing & layout", icon: Ruler },
  { id: "/docs/motion", label: "Motion", icon: Zap },
].map(({ icon: Icon, ...item }) => ({ ...item, group: "Design foundations", icon: <Icon data-foundation-link="" /> }));

const componentFamilies: CommandListItem[] = directoryGroups.map(group => ({
  id: `/components#${group.id}`, label: group.label,
  description: `${group.components.length} components`, group: "Component families",
}));

function guideItems(group: string, paths: readonly string[]) {
  return paths.flatMap(path => {
    const guide = docPages.find(page => page.path === path);
    return guide ? [{ id: guide.path, label: guide.label,
      group, icon: group === "For agents" ? <Terminal /> : <BookOpen /> }] : [];
  });
}

export const browseItems: Record<SearchScope, readonly CommandListItem[]> = {
  all: [...releaseItems, ...foundationItems],
  components: [...componentFamilies, { id: "/components", label: "Browse all components", group: "Component families" }],
  recipes: [
    { id: "/recipes", label: "Browse all recipes", group: "Recipes", icon: <Rows3 /> },
    ...recipes.map(recipe => ({ id: recipe.path, label: recipe.label, group: "Recipes", icon: <Rows3 /> })),
  ],
  docs: [
    ...guideItems("Get started", ["/docs/installation", "/docs/foundations", "/docs/theming"]),
    { id: "/for-agents", label: "Connect your agent", group: "For agents", icon: <Terminal /> },
    ...guideItems("For agents", ["/docs/mcp", "/docs/skills", "/docs/agent-knowledge"]),
  ],
};
