import selection from "./src/public-catalog.json" with { type: "json" };

export const isPublicSite = typeof __FLOOD_PUBLIC_SITE__ === "boolean"
  ? __FLOOD_PUBLIC_SITE__
  : typeof process !== "undefined" && process.env.FLOOD_WEBSITE_PROFILE === "public";

const components = new Set([...selection.components, ...selection.charts]);
const recipes = new Set(selection.recipes);
const starterPreviews = new Set(["/playground/navigation", "/playground/settings", "/playground/table-bulk-actions"]);

export function isSitePreview(path) {
  return !isPublicSite || starterPreviews.has(path);
}

export function isPublicComponent(slug) {
  return components.has(slug);
}

export function isPublicRecipe(slug) {
  return recipes.has(slug);
}

export function isPublicMaterial(id) {
  if (id.startsWith("component:")) return isPublicComponent(id.slice(10));
  if (id.startsWith("recipe:")) return isPublicRecipe(id.slice(7));
  return true;
}
