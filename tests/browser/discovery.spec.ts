import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("search finds a recipe from a task and opens it from the keyboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    Object.defineProperties(navigator, {
      platform: { value: "Win32" }, userAgentData: { value: undefined },
    });
  });
  await page.goto("/");
  await expect(page.getByRole("banner").getByRole("searchbox", { name: "Search Flood" }))
    .toHaveAttribute("aria-keyshortcuts", "Control+K");
  await page.keyboard.press("Control+k");
  const search = page.getByRole("dialog", { name: "Search Flood" });
  const input = search.getByRole("combobox");
  await expect(input).toBeFocused();
  await expect(search.getByRole("button", { name: "Close" })).toHaveCount(0);
  await expect(search.getByRole("group", { name: "Common workflows" }).getByRole("option")).toHaveCount(3);
  await expect(search.getByRole("group", { name: "Component families" })).toBeVisible();
  const forms = search.getByRole("option", { name: "Forms", exact: true });
  await forms.hover();
  await expect(forms).toHaveAttribute("aria-selected", "false");
  await input.hover();
  await expect(input).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await input.press("ArrowDown");
  await expect(search.getByRole("option", { name: /^Collection views/ })).toHaveAttribute("aria-selected", "true");
  await input.fill("DataTable");
  await expect(search.getByRole("option").first()).toContainText("DataTable");
  await input.fill("DataTabel");
  await expect(search.getByRole("option").first()).toContainText("DataTable");
  await input.fill("nothing matches 8093");
  await expect(search.getByRole("option")).toContainText("No results.");
  await input.fill("bulk edit");
  await expect(search.getByRole("option").first()).toContainText("Table bulk actions");
  const scopes = search.getByRole("tablist", { name: "Search scope" });
  await scopes.getByRole("tab", { name: "Docs" }).click();
  await expect(input).toHaveValue("bulk edit");
  await expect(search.getByRole("option")).toContainText("No results in docs");
  await scopes.getByRole("tab", { name: "Recipes" }).click();
  await expect(search.getByRole("option").first()).toContainText("Table bulk actions");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  const homeSearch = page.getByRole("searchbox", { name: "Search Flood", exact: true });
  await expect(homeSearch).toBeFocused();
  await homeSearch.click();
  await expect(search).toBeVisible();
  await page.mouse.click(1, 1);
  await expect(search).toBeHidden();
  await expect(homeSearch).toBeFocused();
  await homeSearch.fill("массовое редактирование");
  await expect(input).toHaveValue("массовое редактирование");
  await expect(scopes.getByRole("tab", { name: "All", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(search.getByRole("option").first()).toContainText("Table bulk actions");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/docs\/recipes\/table-bulk-actions$/);

  await page.getByRole("button", { name: "Copy for agent" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("/components/data-table.md");
  const live = page.getByRole("region", { name: "Live example" });
  await live.getByRole("checkbox", { name: /Design system/ }).check();
  await live.getByRole("button", { name: "Archive projects" }).click();
  const confirmation = page.getByRole("alertdialog", { name: "Archive selected projects?" });
  await confirmation.getByRole("button", { name: "Keep projects" }).click();
  await expect(live.getByText("Design system", { exact: true })).toBeVisible();
  await live.getByRole("button", { name: "Archive projects" }).click();
  await confirmation.getByRole("button", { name: "Archive selected" }).click();
  await expect(live.getByText("Design system", { exact: true })).toHaveCount(0);
});

test("the shortcut hint follows the operating system and stays quiet on touch devices", async ({ page }) => {
  await page.addInitScript(() => {
    const touch = new URL(location.href).searchParams.has("touch");
    Object.defineProperties(navigator, {
      platform: { value: "MacIntel" }, userAgentData: { value: undefined },
      maxTouchPoints: { value: touch ? 5 : 0 },
    });
  });
  await page.goto("/");
  const trigger = page.getByRole("banner").getByRole("searchbox", { name: "Search Flood" });
  await expect(trigger).toHaveAttribute("aria-keyshortcuts", "Meta+K");
  await expect(page.locator(".site-search-entry kbd")).toHaveText(["⌘", "K"]);
  await page.keyboard.press("Meta+k");
  await expect(page.getByRole("dialog", { name: "Search Flood" }).getByRole("combobox")).toBeFocused();

  await page.goto("/docs?touch");
  const headerSearch = page.getByRole("banner").getByRole("searchbox", { name: "Search Flood" });
  await expect(headerSearch).toHaveAttribute("aria-keyshortcuts", "Meta+K");
  await expect(page.locator(".site-search-entry kbd")).toHaveCount(0);
  await headerSearch.click();
  await expect(page.getByRole("dialog", { name: "Search Flood" })).toBeVisible();
});

test("recipes and agent setup are discoverable from stable navigation routes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Search Flood" }).click();
  const search = page.getByRole("dialog", { name: "Search Flood" });
  await search.getByRole("option", { name: /^Form submission/ }).click();
  await expect(page).toHaveURL(/\/docs\/recipes\/form-submission$/);
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Recipes", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Recipes", exact: true })).toBeVisible();
  await page.getByRole("link", { name: /^E-commerce / }).click();
  await expect(page).toHaveURL(/\/recipes\/e-commerce$/);
  await expect(page.getByRole("heading", { name: "E-commerce", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Table bulk actions / })).toBeVisible();
  await page.getByRole("link", { name: "Categories", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Categories", exact: true })).toBeVisible();
  await page.getByRole("banner").getByRole("searchbox", { name: "Search Flood" }).click();
  const scopes = search.getByRole("tablist", { name: "Search scope" });
  const explore = scopes.getByRole("tab", { name: "Explore" });
  await explore.press((await scopes.getAttribute("aria-orientation")) === "vertical" ? "ArrowDown" : "ArrowRight");
  await expect(scopes.getByRole("tab", { name: "Categories" })).toHaveAttribute("aria-selected", "true");
  await expect(search.getByRole("option", { name: /^Fintech \d+ recipes/ })).toBeVisible();
  await search.getByRole("combobox").fill("cloud");
  await search.getByRole("option", { name: /^Cloud & hosting/ }).click();
  await expect(page).toHaveURL(/\/recipes\/hosting$/);
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "For agents" }).click();
  await expect(page.getByRole("heading", { name: "Flood for coding agents" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Connect Flood MCP/ })).toHaveAttribute("href", "/docs/mcp");
});
