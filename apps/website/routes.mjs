/** Explicit page allowlist shared by the static server and website navigation. */
import catalog from "./src/component-catalog.json" with { type: "json" };
import componentGroups from "./src/component-groups.json" with { type: "json" };
import { docPages, siteOrigin } from "./site-guides.mjs";
import { isPublicComponent, isPublicSite, isSitePreview } from "./site-scope.mjs";
export { docPages, siteOrigin };

export const componentSlugs = catalog.map(component => component.slug).filter(slug => !isPublicSite || isPublicComponent(slug));
const discoveryPages = [
  { path: "/recipes", label: "Recipes", description: "Explore runnable interface recipes built with Flood." },
  { path: "/for-agents", label: "For agents", description: "Connect your coding agent to Flood and try a real task." },
  ...componentGroups.map(item => ({ ...item, label: `${item.label} components`, path: `/components/category/${item.id}` })),
];
export const pagePaths = new Set([
  "/", "/playground", "/playground/content", "/playground/collections", "/playground/surfaces", "/playground/navigation", "/playground/motion",
  "/playground/collections/format", "/playground/collections/active-format", "/playground/collections/filter-group",
  "/playground/collections/saved-views", "/components", ...docPages.map(page => page.path),
  "/playground/records", "/playground/settings", "/playground/charts",
  "/playground/table-bulk-actions",
  "/playground/product-variants",
  "/playground/merge-records",
  "/playground/import-mapping",
  "/playground/document-review",
  "/playground/code-editor",
  "/playground/code-review",
  ...componentSlugs.map(slug => `/components/${slug}`), ...discoveryPages.map(page => page.path),
].filter(path => !path.startsWith("/playground") || isSitePreview(path)));

export const indexablePaths = [...pagePaths].filter(path => !path.startsWith("/playground"));

/** Public URL metadata shares the navigation and component inventories. */
export function pageMetadata(path) {
  if (!pagePaths.has(path)) throw new Error(`Unknown website page: ${path}`);
  const doc = docPages.find(page => page.path === path);
  const component = catalog.find(page => path === `/components/${page.slug}`);
  const discovery = discoveryPages.find(page => page.path === path);
  const playgroundLabels = {
    "/playground/product-variants": "Product variants",
    "/playground/merge-records": "Merge duplicate contacts",
    "/playground/import-mapping": "Map import columns",
    "/playground/document-review": "Document review",
    "/playground/code-editor": "Query workspace",
    "/playground/code-review": "Code review",
    "/playground": "Playground",
    "/playground/content": "Content playground",
    "/playground/collections": "Collections playground",
    "/playground/surfaces": "Surface study",
    "/playground/navigation": "Navigation workspace",
    "/playground/motion": "Motion playground",
    "/playground/records": "Record management",
    "/playground/settings": "Settings workspace",
    "/playground/table-bulk-actions": "Table bulk actions",
    "/playground/charts": "Request latency",
    "/playground/collections/format": "Format filter",
    "/playground/collections/active-format": "Active format filter",
    "/playground/collections/filter-group": "File filter group",
    "/playground/collections/saved-views": "Saved file views",
  };
  const title = path === "/" ? "Flood — Design system for developers and coding agents"
    : `${doc?.label ?? component?.name ?? discovery?.label ?? playgroundLabels[path] ?? "Components"} — flood.md`;
  const description = doc?.description ?? component?.description ?? discovery?.description ?? (path === "/components"
    ? "Explore Flood's original React components, live examples and TypeScript API references."
    : "Original components, design tokens and versioned skills for coding agents. Available for React and Next.js.");
  return { title, description, canonical: siteOrigin + path, indexable: indexablePaths.includes(path), shareImage: doc?.shareImage };
}
