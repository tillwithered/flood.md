/** Explicit page allowlist shared by the static server and website navigation. */
export const docPages = [
  { path: "/docs", label: "Introduction", file: "README.md", description: "A calm foundation for React interfaces." },
  { path: "/docs/installation", label: "Installation", file: "installation.md", description: "Connect Flood to React or Next.js." },
  { path: "/docs/foundations", label: "Foundations", file: "foundations.md", description: "Semantic tokens, typography and neutral dark surfaces." },
  { path: "/docs/theming", label: "Customization", file: "theming.md", description: "Adapt semantic roles to your project." },
  { path: "/docs/agents", label: "Agent guide", file: "agents.md", description: "Give your agent the matching design instructions." },
  { path: "/docs/faq", label: "FAQ", file: "faq.md", description: "Compatibility, customization and common questions." },
];
export const componentSlugs = [
  "flood-root", "text", "heading", "stack", "inline", "surface", "divider",
  "button", "icon-button", "link", "field", "input", "textarea", "checkbox",
  "radio", "switch", "code-snippet", "icon-slot",
];
export const pagePaths = new Set([
  "/", "/playground", "/components", ...docPages.map(page => page.path),
  ...componentSlugs.map(slug => `/components/${slug}`),
]);
