import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: /(?:indexing|mcp-guide|workbench)\.spec\.ts$/,
  webServer: base.webServer?.[0],
});
