/** Explicit page allowlist shared by the static server and website navigation. */
import catalog from "./src/component-catalog.json" with { type: "json" };
export const docPages = [
  { path: "/docs", label: "Introduction", file: "README.md", description: "A calm foundation for React interfaces." },
  { path: "/docs/installation", label: "Installation", file: "installation.md", description: "Connect Flood to React or Next.js." },
  { path: "/docs/project-ui", label: "Project UI", file: "project-ui.md", description: "Give your app a short, project-owned UI boundary." },
  { path: "/docs/foundations", label: "Foundations", file: "foundations.md", description: "Semantic tokens, typography and neutral dark surfaces." },
  { path: "/docs/layout", label: "Layout", file: "layout.md", description: "Control widths, centered rows and readable grouping." },
  { path: "/docs/theming", label: "Customization", file: "theming.md", description: "Adapt semantic roles to your project." },
  { path: "/docs/agents", label: "Agent guide", file: "agents.md", description: "Give your agent the matching design instructions." },
  { path: "/docs/faq", label: "FAQ", file: "faq.md", description: "Compatibility, customization and common questions." },
  { path: "/docs/recipes/command-palette", label: "Command palette", file: "recipes/command-palette.md", description: "Compose Dialog and CommandList for application commands.", group: "recipes" },
  { path: "/docs/recipes/select-all", label: "Select all", file: "recipes/select-all.md", description: "Aggregate selection with an indeterminate checkbox.", group: "recipes" },
  { path: "/docs/recipes/split-button", label: "Split button", file: "recipes/split-button.md", description: "A primary action with an additional-actions menu.", group: "recipes" },
  { path: "/docs/recipes/form-submission", label: "Form submission", file: "recipes/form-submission.md", description: "Native validation, pending state and recoverable errors.", group: "recipes" },
  { path: "/docs/recipes/filter-bar", label: "Filter bar", file: "recipes/filter-bar.md", description: "Compose search and filters with a host-owned data table.", group: "recipes" },
];
export const componentSlugs = catalog.map(component => component.slug);
export const pagePaths = new Set([
  "/", "/playground", "/playground/content", "/components", ...docPages.map(page => page.path),
  ...componentSlugs.map(slug => `/components/${slug}`),
]);

export const siteOrigin = "https://flood.md";
export const indexablePaths = [...pagePaths].filter(path => !path.startsWith("/playground"));

/** Public URL metadata shares the navigation and component inventories. */
export function pageMetadata(path) {
  if (!pagePaths.has(path)) throw new Error(`Unknown website page: ${path}`);
  const doc = docPages.find(page => page.path === path);
  const component = catalog.find(page => path === `/components/${page.slug}`);
  const title = path === "/" ? "flood.md — Good interfaces start with a little Flood."
    : `${doc?.label ?? component?.name ?? (path === "/components" ? "Components" : path === "/playground" ? "Playground" : "Content playground")} — flood.md`;
  const description = doc?.description ?? component?.description ?? (path === "/components"
    ? "Explore Flood's original React components, live examples and TypeScript API references."
    : "Good interfaces start with a little Flood. A calm React design system with native components, dark foundations and instructions for your agent.");
  return { title, description, canonical: siteOrigin + path, indexable: indexablePaths.includes(path) };
}
