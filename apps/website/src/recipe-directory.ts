import { docPages, recipeCollections, siteOrigin } from "../site-guides.mjs";

interface RecipeDetails {
  groups: readonly string[];
  keywords: readonly string[];
  uses?: readonly string[];
  preview?: string;
}

const details: Record<string, RecipeDetails> = {
  "command-palette": { groups: ["workspace", "saas"], keywords: ["quick search", "keyboard shortcuts", "command menu"], uses: ["command-palette", "command-list"] },
  "select-all": { groups: ["forms", "tables"], keywords: ["indeterminate checkbox", "select multiple"], uses: ["checkbox"] },
  "split-button": { groups: ["forms"], keywords: ["secondary actions", "dropdown button"], uses: ["split-button"] },
  "form-submission": { groups: ["forms", "e-commerce", "fintech"], keywords: ["submit form", "validate form", "validate and submit a form", "form validation", "validation errors", "pending error"], uses: ["field", "input", "button", "alert"] },
  "filter-bar": { groups: ["tables", "e-commerce", "fintech", "operations"], keywords: ["search filters", "filter table", "filter products", "filter and sort records", "фильтр товаров"], uses: ["collection-toolbar", "data-table"] },
  "collection-views": { groups: ["tables", "e-commerce", "hosting", "saas", "operations"], keywords: ["save filters", "saved filters", "save views", "saved views", "saved search", "file browser", "columns"], uses: ["data-table", "collection-toolbar", "file-list"], preview: "/playground/collections/saved-views" },
  "navigation-workspace": { groups: ["workspace", "hosting", "saas"], keywords: ["sidebar navigation", "app shell", "nested navigation", "build an app workspace"], uses: ["app-shell", "sidebar", "navigation-item"], preview: "/playground/navigation" },
  "workspace-review": { groups: ["workspace", "fintech", "operations"], keywords: ["review form", "file preview", "review records"], uses: ["drawer", "field"] },
  "table-bulk-actions": { groups: ["tables", "e-commerce", "fintech", "operations"], keywords: ["bulk edit", "bulk update records", "update multiple records", "bulk update inventory", "mass update", "batch edit", "archive selected", "inventory selection", "массовое редактирование", "массовое изменение остатков"], uses: ["data-table", "collection-toolbar", "bulk-action-bar", "alert-dialog", "toast-region"], preview: "/playground/collections" },
  "grouped-form": { groups: ["forms"], keywords: ["form layout", "field groups", "optional fields"], uses: ["field", "fieldset", "grid"] },
  "record-workspace": { groups: ["tables", "workspace", "operations"], keywords: ["remote pagination", "data recovery", "record layout"], uses: ["data-table", "app-shell"] },
  "record-management": { groups: ["tables", "workspace", "e-commerce", "fintech", "operations"], keywords: ["edit records", "catalog editor", "product administration"], uses: ["data-table", "drawer", "collection-toolbar"], preview: "/playground/records" },
  "settings-workspace": { groups: ["forms", "workspace", "hosting", "saas"], keywords: ["configuration", "preferences", "settings panel", "save draft"], uses: ["field", "app-shell", "button"], preview: "/playground/settings" },
};

export const recipes = docPages.filter(page => page.group === "recipes").map(page => {
  const slug = page.path.slice("/docs/recipes/".length);
  return { ...page, slug, ...details[slug] };
});

export type Recipe = (typeof recipes)[number];
export const recipeByPath = new Map(recipes.map(recipe => [recipe.path, recipe]));
export const recipeGroups = recipeCollections.map(collection => ({
  ...collection,
  recipes: recipes.filter(recipe => recipe.groups?.includes(collection.id)),
}));
export const recipeCategories = recipeGroups.filter(collection => collection.category);

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
