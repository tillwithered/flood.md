export { docPages, recipeCollections, siteOrigin } from "./site-guides.mjs";
export const componentSlugs: string[];
export const pagePaths: Set<string>;
export const indexablePaths: string[];
export function pageMetadata(path: string): { title: string; description: string; canonical: string; indexable: boolean };
