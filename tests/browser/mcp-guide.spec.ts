import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("the public MCP guide links to a downloadable plugin", async ({ page }) => {
  await page.goto("/docs/mcp");
  await expect(page.getByRole("heading", { level: 1, name: "Connect your agent" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("codex mcp add flood --url https://flood.md/mcp");
  if (page.viewportSize()!.width <= 576) await chooseSelectOption(page.getByRole("combobox", { name: "MCP client" }), "ChatGPT");
  else await page.getByRole("tab", { name: "ChatGPT" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download the Flood plugin ZIP" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("flood-plugin.zip");
  expect(await download.failure()).toBeNull();
});

test("the agent guide hands off to editors and copies a starter task", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/docs/mcp");
  const codex = page.getByRole("tab", { name: "Codex" });
  const cursor = page.getByRole("tab", { name: "Cursor" });
  const phone = page.viewportSize()!.width <= 576;
  const picker = page.getByRole("combobox", { name: "MCP client" });
  if (phone) await chooseSelectOption(picker, "Cursor");
  else {
    await codex.focus();
    await codex.press("ArrowRight");
    await expect(cursor).toHaveAttribute("aria-selected", "true");
  }
  const cursorAction = page.getByRole("link", { name: "Add to Cursor" });
  const cursorUrl = new URL((await cursorAction.getAttribute("href"))!);
  expect(cursorUrl.protocol).toBe("cursor:");
  expect(cursorUrl.searchParams.get("name")).toBe("flood");
  expect(JSON.parse(atob(cursorUrl.searchParams.get("config")!))).toEqual({ url: "https://flood.md/mcp" });
  if (phone) await chooseSelectOption(picker, "VS Code");
  else await cursor.press("ArrowRight");
  const vscodeAction = page.getByRole("link", { name: "Add to VS Code" });
  const vscodeUrl = new URL((await vscodeAction.getAttribute("href"))!);
  expect(vscodeUrl.protocol).toBe("vscode:");
  expect(JSON.parse(decodeURIComponent(vscodeUrl.search.slice(1)))).toEqual({ name: "flood", type: "http", url: "https://flood.md/mcp" });
  await page.getByRole("button", { name: "Copy prompt for Table with bulk actions" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toMatch(/Build a requests table.*Use Flood\./);
  await expect(page.getByRole("link", { name: "View table with bulk actions example" })).toHaveAttribute("href", "/docs/recipes/table-bulk-actions");
});

test("connection instructions are readable without JavaScript", async ({ browser }) => {
  const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 320, height: 760 } });
  try {
    await page.goto("/docs/mcp");
    await expect(page.getByRole("link", { name: "Add to Cursor" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Download the Flood plugin ZIP" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  } finally {
    await page.close();
  }
});
