import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: /(?:docs|flood|workbench)\.spec\.ts/,
  webServer: { command: "node apps/website/server.mjs", url: "http://127.0.0.1:4173/health", reuseExistingServer: !process.env.CI },
});
