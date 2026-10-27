import { defineConfig } from "@playwright/test";
const websiteURL = process.env.FLOOD_WEBSITE_TEST_URL ?? "http://127.0.0.1:4173";
const nextURL = process.env.FLOOD_NEXT_TEST_URL ?? "http://127.0.0.1:3001";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  workers: process.env.CI ? 4 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: websiteURL, trace: "retain-on-failure" },
  webServer: [
    {
      command: "node apps/website/server.mjs",
      url: websiteURL + "/health",
      env: { PORT: new URL(websiteURL).port || "4173" },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run start --workspace=@flood-md/next-example -- --port ${new URL(nextURL).port || "3001"}`,
      url: nextURL,
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
});
