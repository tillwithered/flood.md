import { isPublicRecipe, isPublicSite } from "./site-scope.mjs";

export const allDocPages = [
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
  { path: "/docs/mcp", label: "MCP reference", file: "mcp.md", description: "Transport, tools and catalog behavior for Flood’s public MCP endpoint.", websiteOnly: true },
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
  { path: "/docs/recipes/import-mapping", label: "Import mapping", file: "recipes/import-mapping.md", description: "Map incoming columns and recover from validation errors.", group: "recipes" },
  { path: "/docs/recipes/action-review", label: "Action review", file: "recipes/action-review.md", description: "Inspect and approve or reject a versioned proposal.", group: "recipes" },
  { path: "/docs/recipes/record-association", label: "Record association", file: "recipes/record-association.md", description: "Find or create a related record while keeping a relationship draft.", group: "recipes" },
  { path: "/docs/recipes/refresh-controls", label: "Refresh controls", file: "recipes/refresh-controls.md", description: "Refresh a collection manually or on a schedule while keeping its accepted rows.", group: "recipes" },
  { path: "/docs/recipes/checkpoint-navigator", label: "Checkpoint navigator", file: "recipes/checkpoint-navigator.md", description: "Navigate review checkpoints with independent answered and flagged states.", group: "recipes" },
  { path: "/docs/recipes/dependent-filters", label: "Dependent filters", file: "recipes/dependent-filters.md", description: "Stage related filters together and keep only valid combinations.", group: "recipes" },
  { path: "/docs/recipes/document-review", label: "Document review", file: "recipes/document-review.md", description: "Review inline revisions and preserve their linked discussions.", group: "recipes" },
  { path: "/docs/recipes/code-editor-workspace", label: "Code editor workspace", file: "recipes/code-editor-workspace.md", description: "Connect a host-owned code editor, query execution and resizable results.", group: "recipes" },
  { path: "/docs/recipes/code-review", label: "Code review", file: "recipes/code-review.md", description: "Review changed files and attach comments to their source lines.", group: "recipes" },
  { path: "/docs/recipes/address-confirmation", label: "Address confirmation", file: "recipes/address-confirmation.md", description: "Fill address fields from a match and review meaningful differences before saving.", group: "recipes" },
  { path: "/docs/recipes/version-history", label: "Version history", file: "recipes/version-history.md", description: "Compare saved snapshots and create a new revision from an older version.", group: "recipes" },
  { path: "/docs/recipes/conversion-funnel", label: "Conversion funnel", file: "recipes/conversion-funnel.md", description: "Show ordered conversion stages with counts and a named rate denominator.", group: "recipes" },
  { path: "/docs/recipes/collaborative-save", label: "Collaborative save", file: "recipes/collaborative-save.md", description: "Show editor presence and keep drafts recoverable when a newer revision was saved.", group: "recipes" },
  { path: "/docs/recipes/map-and-list", label: "Map and list", file: "recipes/map-and-list.md", description: "Share selection between a keyboard-accessible list and a host map adapter.", group: "recipes" },
  { path: "/docs/recipes/support-reply", label: "Support reply", file: "recipes/support-reply.md", description: "Keep public and internal drafts separate and preview macro changes.", group: "recipes" },
  { path: "/docs/recipes/staged-changes", label: "Staged changes", file: "recipes/staged-changes.md", description: "Review proposed changes and select what to apply.", group: "recipes" },
  { path: "/docs/recipes/file-gallery", label: "File gallery", file: "recipes/file-gallery.md", description: "Preview and download individual files alongside gallery selection and bulk archiving.", group: "recipes" },
  { path: "/docs/recipes/product-variants", label: "Product variants", file: "recipes/product-variants.md", description: "Edit variant SKUs, prices and stock in a matrix with atomic batch validation.", group: "recipes" },
  { path: "/docs/recipes/merge-records", label: "Merge records", file: "recipes/merge-records.md", description: "Compare duplicate contacts, resolve differing values and review the merge before removing a record.", group: "recipes" },
];
export const docPages = isPublicSite
  ? allDocPages.filter(page => page.group !== "recipes" || isPublicRecipe(page.path.split("/").at(-1)))
  : allDocPages;
export const siteOrigin = "https://flood.md";

export function usesDocumentation(path) {
  return path === "/docs" || path.startsWith("/docs/") ||
    (path.startsWith("/components/") && !path.startsWith("/components/category/"));
}
