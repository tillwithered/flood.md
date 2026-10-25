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
];
export const componentSlugs = catalog.map(component => component.slug);
export const pagePaths = new Set([
  "/", "/playground", "/playground/content", "/components", ...docPages.map(page => page.path),
  ...componentSlugs.map(slug => `/components/${slug}`),
]);
