import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("a slow page transition keeps the header in place and restores scroll on Back", async ({ page }) => {
  let releaseGuide!: () => void;
  const guideReady = new Promise<void>(resolve => { releaseGuide = resolve; });
  await page.route(/\/assets\/documentation-[^/]+\.js$/, async route => {
    await guideReady;
    await route.continue();
  });

  await page.goto("/components");
  const search = page.getByRole("searchbox", { name: "Search Flood" });
  await expect(search).toHaveAttribute("aria-keyshortcuts", /\+K$/);
  const headerSearch = await search.elementHandle();
  const initialBounds = await search.boundingBox();
  const viewport = page.locator(".site-page-scroll");
  const loading = page.getByRole("status").filter({ hasText: /^Loading / });

  try {
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Docs", exact: true }).click();
    await expect(loading).toBeVisible();
    expect(await search.boundingBox()).toEqual(initialBounds);
  } finally {
    releaseGuide();
  }

  await expect(page).toHaveURL(/\/docs$/);
  await expect(loading).toBeHidden();
  expect(await search.boundingBox()).toEqual(initialBounds);
  expect(await headerSearch?.evaluate(element => element.isConnected)).toBe(true);

  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Components", exact: true }).click();
  await expect(page).toHaveURL(/\/components$/);
  const scrollTop = await viewport.evaluate(node => { node.scrollTop = 500; return node.scrollTop; });
  expect(scrollTop).toBeGreaterThan(100);
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Docs", exact: true }).evaluate((link: HTMLAnchorElement) => link.click());
  await expect(page).toHaveURL(/\/docs$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/components$/);
  await expect.poll(() => viewport.evaluate(node => node.scrollTop)).toBe(scrollTop);
});

test("global search leaves the background at the same scroll position", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperties(navigator, { platform: { value: "Win32" }, userAgentData: { value: undefined } });
  });
  await page.goto("/components");
  const viewport = page.locator(".site-page-scroll");
  const opener = page.getByRole("searchbox", { name: "Search Flood" });
  await expect(opener).toHaveAttribute("aria-keyshortcuts", "Control+K");
  const position = await viewport.evaluate(node => { node.scrollTop = 500; return node.scrollTop; });
  expect(position).toBeGreaterThan(100);
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Search Flood" });
  await expect(dialog.getByRole("combobox")).toBeFocused();
  await expect.poll(() => viewport.evaluate(node => node.scrollTop)).toBe(position);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect.poll(() => viewport.evaluate(node => node.scrollTop)).toBe(position);
});

test("search can reopen during its exit and skips animation with reduced motion", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperties(navigator, { platform: { value: "Win32" }, userAgentData: { value: undefined } });
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.addStyleTag({ content: ".site-search { --flood-sys-motion-duration-exit: 500ms; }" });
  const opener = page.getByRole("searchbox", { name: "Search Flood" });
  const field = page.locator(".site-search-input");
  const idleBorder = await field.evaluate(node => getComputedStyle(node).borderTopWidth);
  const dialog = page.getByRole("dialog", { name: "Search Flood" });
  const input = dialog.getByRole("combobox");
  await page.keyboard.press("Control+k");
  await input.fill("Fintech");
  await expect(dialog.getByRole("option", { name: /^Fintech/ }).first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveAttribute("data-closing", "true");
  await page.keyboard.press("Control+k");
  await expect(dialog).not.toHaveAttribute("data-closing");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("Fintech");
  await page.mouse.click(1, 1);
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(field).toHaveCSS("border-top-width", idleBorder);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await opener.click();
  await expect(dialog).toHaveCSS("transition-duration", "0s");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(field).toHaveCSS("border-top-width", idleBorder);
  await expect(opener).toHaveCSS("caret-color", "rgba(0, 0, 0, 0)");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(opener).toBeFocused();
  await expect(field).not.toHaveCSS("border-top-width", idleBorder);
});

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
  await page.getByRole("main").focus();
  await page.keyboard.press("Control+k");
  const search = page.getByRole("dialog", { name: "Search Flood" });
  const input = search.getByRole("combobox");
  await expect(input).toBeFocused();
  await expect(search.getByRole("button", { name: "Close" })).toHaveCount(0);
  const tasks = search.getByRole("group", { name: "Start with a task" });
  await expect(tasks.getByRole("option")).toHaveCount(3);
  const lastOption = search.getByRole("option").last();
  await lastOption.hover();
  await expect(lastOption).toHaveAttribute("aria-selected", "false");
  await input.hover();
  await expect(input).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await input.press("ArrowDown");
  await expect(search.getByRole("option").nth(1)).toHaveAttribute("aria-selected", "true");
  await input.fill("DataTable");
  await expect(search.getByRole("option").first()).toContainText("DataTable");
  await input.fill("DataTabel");
  await expect(search.getByRole("option").first()).toContainText("DataTable");
  await input.fill("data tabel");
  await expect(search.getByRole("option").first()).toContainText("DataTable");
  await input.fill("How do I save filters?");
  await expect(search.getByRole("option").first()).toContainText("Collection views");
  await input.fill("How do I connect an agent?");
  await expect(search.getByRole("option").first()).toContainText("Connect your agent");
  await input.fill("filter and sort records");
  await expect(search.getByRole("option").first()).toContainText("Filter bar");
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
  await page.keyboard.press("Control+k");
  await expect(input).toBeFocused();
  expect(await input.evaluate(node => {
    const field = node as HTMLInputElement;
    return field.value.slice(field.selectionStart ?? 0, field.selectionEnd ?? 0);
  })).toBe("bulk edit");
  await expect(scopes.getByRole("tab", { name: "Recipes" })).toHaveAttribute("aria-selected", "true");
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
  const keycap = page.locator(".site-search-entry kbd");
  await expect(keycap).toHaveText(["⌘ K"]);
  await expect(keycap).toHaveCSS("border-top-width", "0px");
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
  await search.getByRole("option", { name: /^Validate and submit a form/ }).click();
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
