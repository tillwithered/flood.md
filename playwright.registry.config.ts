import { defineConfig } from "@playwright/test";

// The registry verifier owns an isolated Next server on port 3001.
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: /(?:next|foundations|team)\.spec\.ts/,
  workers: 1,
  retries: 1,
  reporter: [["list"], ["json", { outputFile: ".artifacts/registry-browser-results.json" }]],
  use: { baseURL: "http://127.0.0.1:3001", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
});
