import { expect, test } from "@playwright/test";

test("the public MCP guide links to a downloadable plugin", async ({ page }) => {
  await page.goto("/docs/mcp");
  await expect(page.getByRole("heading", { level: 1, name: "MCP" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("codex mcp add flood --url https://flood.md/mcp");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download the Flood plugin ZIP" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("flood-plugin.zip");
  expect(await download.failure()).toBeNull();
});
