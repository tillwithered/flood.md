import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import catalog from "../../apps/website/src/component-catalog.json" with { type: "json" };
import taxonomy from "../../apps/website/src/component-groups.json" with { type: "json" };

test("catalog categories, search and canonical Markdown agree", async ({ page, request }, info) => {
  await page.goto("/components");
  const main = page.getByRole("main");
  const search = main.getByRole("searchbox", { name: "Search components" });
  await expect(search).toBeVisible();
  await expect(page.locator(".catalog-card")).toHaveCount(catalog.length);
  const groups = taxonomy.filter(group => catalog.some(component => component.group === group.id));
  const categories = page.getByRole("navigation", { name: "Component categories" });
  await expect(categories.getByRole("link")).toHaveCount(groups.length);
  await categories.getByRole("link", { name: /^Forms\b/ }).click();
  await expect(page).toHaveURL(/#forms$/);
  await expect(main.getByRole("heading", { name: "Forms", exact: true })).toBeInViewport();
  await search.fill("forms");
  for (const component of catalog.filter(component => component.group === "forms")) {
    await expect(page.locator(".component-catalog").getByRole("link", { name: new RegExp(`^${component.name}\\b`) })).toBeVisible();
  }
  await expect(page.locator(".component-catalog").getByRole("heading", { name: "Forms", exact: true })).toBeVisible();
  await search.fill("  SCROLL area  ");
  for (const name of ["ScrollArea", "Table"]) await expect(page.locator(".component-catalog").getByRole("link", { name: new RegExp(`^${name}\\b`) })).toBeVisible();
  await search.fill("not-a-component");
  await expect(page.locator(".catalog-card")).toHaveCount(0);
  await expect(main.locator(".component-catalog").getByRole("status")).toHaveText("No components found.");
  await main.getByRole("button", { name: "Clear search" }).click();
  await expect(search).toBeFocused();
  await expect(page.locator(".catalog-card")).toHaveCount(catalog.length);
  await search.fill("forms");
  await search.press("Escape");
  await expect(page.locator(".catalog-card")).toHaveCount(catalog.length);
  const markdown = await (await request.get("/components.md")).text();
  for (const group of groups) expect(markdown).toContain(`## ${group.label}`);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `.artifacts/catalog-groups-${info.project.name}.png` });
});

test("catalog category and active item survive direct component navigation", async ({ page }, info) => {
  await page.goto("/components/select");
  if (info.project.name === "mobile") await page.getByRole("button", { name: "Components", exact: true }).click();
  const sidebar = page.locator(info.project.name === "mobile" ? "#studio-catalog-sheet" : "#studio-catalog");
  const current = sidebar.getByRole("group", { name: "Forms", exact: true }).getByRole("link", { name: "Select", exact: true });
  await expect(current).toHaveAttribute("aria-current", "page");
  await expect(current).toBeInViewport();
  const search = sidebar.getByRole("searchbox", { name: "Search components" });
  await search.fill("icon");
  await expect(sidebar.getByRole("link", { name: "IconButton", exact: true })).toBeVisible();
  await sidebar.getByRole("link", { name: "IconButton", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("IconButton");
});

test("a long catalog name fits before the sidebar scrollbar", async ({ page }, info) => {
  await page.goto("/components/collection-view-switcher");
  if (info.project.name === "mobile") await page.getByRole("button", { name: "Components", exact: true }).click();
  const sidebar = page.locator(info.project.name === "mobile" ? "#studio-catalog-sheet" : "#studio-catalog");
  const current = sidebar.getByRole("link", { name: "CollectionViewSwitcher", exact: true });
  await expect(current).toHaveAttribute("aria-current", "page");
  await expect(current).toBeInViewport();
  await page.evaluate(() => document.fonts.ready);
  const track = sidebar.locator(".flood-scroll-area__track--vertical");
  await expect(track).toBeVisible();
  const text = await current.locator(".catalog-item-name").evaluate(element => ({
    fits: element.scrollWidth <= element.clientWidth,
    height: element.getBoundingClientRect().height,
    lineHeight: parseFloat(getComputedStyle(element).lineHeight),
  }));
  expect(text.fits).toBe(true);
  expect(text.height).toBeLessThanOrEqual(text.lineHeight + 1);
  const [row, scrollbar] = await Promise.all([current.boundingBox(), track.boundingBox()]);
  expect(row!.x + row!.width).toBeLessThan(scrollbar!.x);
});
