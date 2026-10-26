import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testMatch: /(?:editable|tag-input|breadcrumb-layout|feedback-actions|form-controls|navigation-layout|drawer|alert-dialog|file-input|text-inputs|multiple-selection|combobox|numeric-controls|structural-primitives|content-primitives|composition-audit|select-layer-audit|custom-select|choice-groups|connected-controls|disclosure|navigation|overlays|menu|toolbar|card|scroll-area|field-status|fieldset-legend-focus|hidden-label)\.spec\.ts/,
  reporter: [["list"], ["json", {outputFile:".artifacts/browser-engines.json"}]],
  projects: [
    {name:"firefox",use:{browserName:"firefox",viewport:{width:1440,height:1000}}},
    {name:"webkit",use:{browserName:"webkit",viewport:{width:1440,height:1000}}},
  ],
});
