export const docPages: Array<{ path: string; label: string; file: string; description: string; group?: "recipes" }>;
export const recipeCollections: Array<{ id: string; label: string; description: string; category?: boolean }>;
export const siteOrigin: string;
export function usesDocumentation(path: string): boolean;
