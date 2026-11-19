import type { ComponentType, ReactNode, RefObject } from "react";
import { usesDocumentation } from "../site-guides.mjs";

export type PageContent = {
  documentation?: ComponentType<{ path: string; scrollRootRef?: RefObject<HTMLDivElement | null> }>;
  preview?: ReactNode;
  standalone?: boolean;
  recipe?: boolean;
};

const standalonePages = {
  "/playground": () => import("./examples"),
  "/playground/content": () => import("./content-board"),
  "/playground/collections": () => import("./collections-playground"),
  "/playground/surfaces": () => import("./surface-study"),
  "/playground/navigation": () => import("./navigation-playground"),
  "/playground/motion": () => import("./motion-playground"),
};
const recipePages = {
  "/playground/product-variants": () => import("./recipes/product-variants").then(module => ({ default: module.ProductVariants })),
  "/playground/merge-records": () => import("./recipes/merge-records").then(module => ({ default: module.MergeRecords })),
  "/playground/import-mapping": () => import("./recipes/import-mapping").then(module => ({ default: module.ImportMapping })),
  "/playground/document-review": () => import("./recipes/document-review").then(module => ({ default: module.DocumentReview })),
  "/playground/code-editor": () => import("./recipes/code-editor-workspace").then(module => ({ default: module.CodeEditorExample })),
  "/playground/code-review": () => import("./recipes/code-review").then(module => ({ default: module.CodeReview })),
  "/playground/records": () => import("./recipes/record-management").then(module => ({ default: module.RecordManagement })),
  "/playground/settings": () => import("./recipes/settings-workspace").then(module => ({ default: module.SettingsWorkspace })),
  "/playground/table-bulk-actions": () => import("./recipes/table-bulk-actions").then(module => ({ default: module.TableBulkActions })),
  "/playground/chat-starter": () => import("./recipes/chat-starter").then(module => ({ default: module.ChatStarter })),
  "/playground/auth-card": () => import("./recipes/auth-card").then(module => ({ default: module.AuthCardExample })),
  "/playground/inventory-grid": () => import("./recipes/inventory-grid").then(module => ({ default: module.InventoryGrid })),
  "/playground/charts": () => import("./charts-playground"),
};
const filterModes = {
  "/playground/collections/format": "select",
  "/playground/collections/active-format": "tag",
  "/playground/collections/filter-group": "group",
  "/playground/collections/saved-views": "views",
} as const;

export async function loadSitePage(path: string): Promise<PageContent> {
  if (usesDocumentation(path)) return { documentation: (await import("./documentation")).default };
  if (Object.hasOwn(standalonePages, path)) {
    const View = (await standalonePages[path as keyof typeof standalonePages]()).default;
    return { preview: <View />, standalone: true };
  }
  if (Object.hasOwn(recipePages, path)) {
    const View = (await recipePages[path as keyof typeof recipePages]()).default;
    return { preview: <View />, recipe: true };
  }
  if (Object.hasOwn(filterModes, path)) {
    const View = (await import("./format-filter-preview")).default;
    return { preview: <View mode={filterModes[path as keyof typeof filterModes]} /> };
  }
  return {};
}
