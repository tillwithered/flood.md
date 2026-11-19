import { chromium, expect } from "@playwright/test";

const baseURL = process.argv[2] ?? process.env.WEBSITE_URL ?? "http://127.0.0.1:4173";
const browser = await chromium.launch();
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ baseURL, viewport, reducedMotion: "reduce" });
    try {
      const page = await context.newPage();
      await page.goto("/components", { waitUntil: "domcontentloaded" });
      const main = page.getByRole("main");
      const directorySearch = main.getByRole("searchbox", { name: "Search components" });
      await directorySearch.fill("AppShell");
      await expect(main.getByRole("link", { name: /^AppShell\b/ })).toHaveAttribute("href", "/components/app-shell");
      await directorySearch.fill("PaymentMethodPicker");
      await expect(main.getByRole("status")).toHaveText("No components found.");
      await expect(main.getByRole("link", { name: /PaymentMethodPicker/ })).toHaveCount(0);
      await directorySearch.clear();

      const opener = page.getByRole("searchbox", { name: "Search Flood" });
      await opener.click();
      const dialog = page.getByRole("dialog", { name: "Search Flood" });
      const search = dialog.getByRole("combobox");
      const results = dialog.getByRole("listbox");
      await search.fill("PaymentMethodPicker");
      await expect(results.getByText("No results.", { exact: true })).toBeVisible();
      await search.fill("Product variants");
      await expect(results.getByText("No results.", { exact: true })).toBeVisible();
      await search.fill("Navigation workspace");
      await expect(dialog.getByRole("option", { name: /Navigation workspace/i }).first()).toBeVisible();
      await search.fill("CodeBlock");
      const codeBlock = dialog.getByRole("option", { name: /^CodeBlock\b/ });
      await expect(codeBlock).toBeVisible();
      await search.press("Enter");
      await expect(page).toHaveURL(/\/components\/code-block$/);
      await expect(page.getByRole("heading", { name: "CodeBlock", exact: true })).toBeVisible();
      console.log(`Verified public directory and global search at ${viewport.width}px.`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
