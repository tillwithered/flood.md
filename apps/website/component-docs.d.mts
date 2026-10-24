import type { ComponentPage } from "./src/component-catalog";
export function usageCode(component: ComponentPage): string;
export function componentMarkdown(component: ComponentPage, exampleCode?: string): string;
export function catalogMarkdown(pages: ComponentPage[]): string;
