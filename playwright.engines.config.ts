import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testMatch: /(?:agent-consumer|workspace-review|list-box-forms|time-compositions|collection-cards|color-controls|data-table|date-time-picker|file-records|hover-card|tree-select|next-new-controls|tree|navigation-tree|collection-contracts|menu-submenus|context-menu|error-summary|resizable-panels|range-calendar|date-range-field|date-range-picker|date-picker|calendar|time-field|date-field|command-list|editable|tag-input|breadcrumb-layout|feedback-actions|form-controls|navigation-layout|drawer|alert-dialog|file-input|text-inputs|multiple-selection|combobox|numeric-controls|structural-primitives|content-primitives|composition-audit|select-layer-audit|custom-select|choice-groups|connected-controls|disclosure|navigation|overlays|menu|toolbar|card|scroll-area|field-status|fieldset-legend-focus|hidden-label)\.spec\.ts/,
  reporter: [["list"], ["json", {outputFile:".artifacts/browser-engines.json"}]],
  projects: [
    {name:"firefox",use:{browserName:"firefox",viewport:{width:1440,height:1000}}},
    {name:"webkit",use:{browserName:"webkit",viewport:{width:1440,height:1000}}},
  ],
});
