import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testMatch: /(?:structural-primitives|composition-audit|custom-select|choice-groups|connected-controls|disclosure|navigation|overlays|menu|toolbar|card|scroll-area|field-status|hidden-label)\.spec\.ts/,
  reporter: [["list"], ["json", {outputFile:".artifacts/browser-engines.json"}]],
  projects: [
    {name:"firefox",use:{browserName:"firefox",viewport:{width:1440,height:1000}}},
    {name:"webkit",use:{browserName:"webkit",viewport:{width:1440,height:1000}}},
  ],
});
