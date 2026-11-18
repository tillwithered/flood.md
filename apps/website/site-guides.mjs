export const docPages = [
  { path: "/docs", label: "Introduction", file: "README.md", description: "A calm foundation for React interfaces." },
  { path: "/docs/installation", label: "Installation", file: "installation.md", description: "Connect Flood to React or Next.js." },
  { path: "/docs/project-ui", label: "Project UI", file: "project-ui.md", description: "Give your app a short, project-owned UI boundary." },
  { path: "/docs/foundations", label: "Foundations", file: "foundations.md", description: "Semantic tokens, typography and neutral dark surfaces." },
  { path: "/docs/motion", label: "Motion", file: "motion.md", description: "Motion roles, component behavior and reduced motion." },
  { path: "/docs/layout", label: "Layout", file: "layout.md", description: "Control widths, centered rows and readable grouping." },
  { path: "/docs/charts", label: "Charts", file: "charts.md", description: "Choose a chart for trends, comparisons or distributions. Explore live latency charts and open the TypeScript examples.",
    shareImage: { path: "/charts-share.png", alt: "Flood charts with a request latency line chart, histogram and box plot", width: 1200, height: 630 } },
  { path: "/docs/theming", label: "Customization", file: "theming.md", description: "Adapt semantic roles to your project." },
  { path: "/docs/agents", label: "Agent guide", file: "agents.md", description: "Give your agent the matching design instructions." },
  { path: "/docs/mcp", label: "Connect your agent", file: "mcp.md", description: "Give your agent access to Flood’s public components, recipes and design rules over MCP.", websiteOnly: true },
  { path: "/docs/skills", label: "Skills", file: "skills.md", description: "Task-focused agent workflows for composing and verifying the dark base." },
  { path: "/docs/interface-content", label: "Interface content", file: "interface-content.md", description: "Purposeful interface copy, information hierarchy and contextual reference adaptation." },
  { path: "/docs/agent-knowledge", label: "Agent knowledge", file: "agent-knowledge.md", description: "Versioned discovery, selected reading and knowledge growth safeguards." },
  { path: "/docs/faq", label: "FAQ", file: "faq.md", description: "Compatibility, customization and common questions." },
  { path: "/docs/privacy", label: "Website privacy", file: "privacy.md", description: "How the optional website visitor counter works." },
  { path: "/docs/recipes/command-palette", label: "Command palette", file: "recipes/command-palette.md", description: "Use CommandPalette for searchable navigation and application commands.", group: "recipes" },
  { path: "/docs/recipes/select-all", label: "Select all", file: "recipes/select-all.md", description: "Aggregate selection with an indeterminate checkbox.", group: "recipes" },
  { path: "/docs/recipes/split-button", label: "Split button", file: "recipes/split-button.md", description: "A primary action with an additional-actions menu.", group: "recipes" },
  { path: "/docs/recipes/form-submission", label: "Form submission", file: "recipes/form-submission.md", description: "Native validation, pending state and recoverable errors.", group: "recipes" },
  { path: "/docs/recipes/filter-bar", label: "Filter bar", file: "recipes/filter-bar.md", description: "Compose search and filters with a host-owned data table.", group: "recipes" },
  { path: "/docs/recipes/collection-views", label: "Collection views", file: "recipes/collection-views.md", description: "Compose staged filters and saved query definitions for tables and file lists.", group: "recipes" },
  { path: "/docs/recipes/navigation-workspace", label: "Navigation workspace", file: "recipes/navigation-workspace.md", description: "Compose global and contextual navigation with independent route, pane and focus ownership.", group: "recipes" },
  { path: "/docs/recipes/workspace-review", label: "Workspace review", file: "recipes/workspace-review.md", description: "A local form and file drawer composed from Flood primitives and task-focused skills.", group: "recipes" },
  { path: "/docs/recipes/table-bulk-actions", label: "Table bulk actions", file: "recipes/table-bulk-actions.md", description: "Host-owned table selection, action scope and local confirmation from existing components.", group: "recipes" },
  { path: "/docs/recipes/grouped-form", label: "Grouped form", file: "recipes/grouped-form.md", description: "Shared form tracks, semantic groups and optional fields composed from Flood primitives.", group: "recipes" },
  { path: "/docs/recipes/record-workspace", label: "Record workspace", file: "recipes/record-workspace.md", description: "Stable workspace geometry, remote page ownership, selection and explicit data recovery.", group: "recipes" },
  { path: "/docs/recipes/record-management", label: "Record management", file: "recipes/record-management.md", description: "Find, open and edit records while preserving the working list.", group: "recipes" },
  { path: "/docs/recipes/settings-workspace", label: "Settings workspace", file: "recipes/settings-workspace.md", description: "Group settings, validate changes and save an explicit draft.", group: "recipes" },
];
export const recipeCollections = [
  { id: "tables", label: "Tables & records", description: "Find, organize and act on records." },
  { id: "forms", label: "Forms & settings", description: "Edit values and recover from errors." },
  { id: "workspace", label: "Workspaces", description: "Navigate and review complex work." },
  { id: "e-commerce", label: "E-commerce", description: "Browse and update collections of products and records." },
  { id: "fintech", label: "Fintech", description: "Review changes and work with structured data." },
  { id: "hosting", label: "Hosting", description: "Build tools for configuration and service operations." },
];

export const siteOrigin = "https://flood.md";

export function usesDocumentation(path) {
  return path === "/docs" || path.startsWith("/docs/") ||
    (path.startsWith("/components/") && !path.startsWith("/components/category/"));
}
