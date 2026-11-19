import { docPages, siteOrigin } from "../site-guides.mjs";
import { isPublicSite } from "../site-scope.mjs";

interface RecipeDetails {
  keywords: readonly string[];
  uses?: readonly string[];
  preview?: string;
}

const details: Record<string, RecipeDetails> = {
  "command-palette": { keywords: ["quick search", "keyboard shortcuts", "command menu"], uses: ["command-palette", "command-list"] },
  "select-all": { keywords: ["indeterminate checkbox", "select multiple"], uses: ["checkbox"] },
  "split-button": { keywords: ["secondary actions", "dropdown button"], uses: ["split-button"] },
  "form-submission": { keywords: ["submit form", "validate form", "validate and submit a form", "form validation", "validation errors", "pending error"], uses: ["field", "input", "button", "alert"] },
  "filter-bar": { keywords: ["search filters", "filter table", "filter products", "filter and sort records", "фильтр товаров"], uses: ["collection-toolbar", "data-table"] },
  "collection-views": { keywords: ["save filters", "saved filters", "save views", "saved views", "saved search", "file browser", "columns"], uses: ["data-table", "collection-toolbar", "file-list"], preview: "/playground/collections/saved-views" },
  "navigation-workspace": { keywords: ["sidebar navigation", "app shell", "nested navigation", "build an app workspace"], uses: ["app-shell", "sidebar", "navigation-item"], preview: "/playground/navigation" },
  "workspace-review": { keywords: ["review form", "file preview", "review records"], uses: ["drawer", "field"] },
  "table-bulk-actions": { keywords: ["bulk edit", "bulk update records", "update multiple records", "bulk update inventory", "mass update", "batch edit", "archive selected", "inventory selection", "массовое редактирование", "массовое изменение остатков"], uses: ["data-table", "collection-toolbar", "bulk-action-bar", "alert-dialog", "toast-region"], preview: isPublicSite ? "/playground/table-bulk-actions" : "/playground/collections" },
  "grouped-form": { keywords: ["form layout", "field groups", "optional fields"], uses: ["field", "fieldset", "grid"] },
  "record-workspace": { keywords: ["remote pagination", "data recovery", "record layout"], uses: ["data-table", "app-shell"] },
  "record-management": { keywords: ["edit records", "catalog editor", "product administration"], uses: ["data-table", "drawer", "collection-toolbar"], preview: "/playground/records" },
  "settings-workspace": { keywords: ["configuration", "preferences", "settings panel", "save draft"], uses: ["field", "app-shell", "button"], preview: "/playground/settings" },
  "chat-starter": { keywords: ["chat", "messenger", "conversation", "stream reply", "seeded avatar"], uses: ["chat-message", "message-scroller", "message-composer", "character-avatar"], preview: "/playground/chat-starter" },
  "auth-card": { keywords: ["sign in", "register", "verification", "authentication", "login"], uses: ["field", "password-input", "pin-input", "form-actions"], preview: "/playground/auth-card" },
  "inventory-grid": { keywords: ["spreadsheet", "virtual rows", "inline editing", "inventory totals"], uses: ["editable-grid", "search-input", "select"], preview: "/playground/inventory-grid" },
  "conversion-funnel": { keywords: ["conversion", "funnel", "stage rates"], uses: ["funnel-chart", "bar-list", "metric"] },
};

export const recipes = docPages.filter(page => page.group === "recipes").map(page => {
  const slug = page.path.slice("/docs/recipes/".length);
  return { ...page, slug, ...details[slug] };
});

export type Recipe = (typeof recipes)[number];
export const recipeByPath = new Map(recipes.map(recipe => [recipe.path, recipe]));

export function recipePrompt(recipe: Recipe) {
  const contracts = recipe.uses?.map(slug => siteOrigin + "/components/" + slug + ".md") ?? [];
  return [
    "Use Flood to build the following interface: " + recipe.label + ".",
    recipe.description,
    "Read this recipe: " + siteOrigin + recipe.path + ".md",
    ...contracts,
    "Check the installed Flood version and adapt the data and permissions to the host. Verify the interaction, keyboard behavior and recovery states in the browser.",
  ].join("\n");
}
