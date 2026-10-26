export const docPages: Array<{ path: string; label: string; file: string; description: string; group?: "recipes" }>;
export const componentSlugs: string[];
export const pagePaths: Set<string>;
export const siteOrigin: string;
export const indexablePaths: string[];
export function pageMetadata(path: string): { title: string; description: string; canonical: string; indexable: boolean };
