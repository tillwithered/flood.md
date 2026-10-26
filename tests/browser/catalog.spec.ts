import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import catalog from "../../apps/website/src/component-catalog.json" with { type: "json" };
import taxonomy from "../../apps/website/src/component-groups.json" with { type: "json" };

test("catalog categories, search and canonical Markdown agree", async ({ page, request }, info) => {
  await page.goto("/components");
  if (info.project.name === "mobile") await page.getByText("Browse documentation", { exact: true }).click();
  const sidebar = page.locator(info.project.name === "mobile" ? ".mobile-navigation" : ".desktop-sidebar");
  const search = sidebar.getByRole("searchbox", { name: "Search components" });
  await expect(page.locator(".catalog-card")).toHaveCount(catalog.length);
  const groups = taxonomy.filter(group => catalog.some(component => component.group === group.id));
  await expect(page.getByRole("navigation", { name: "Component categories" }).getByRole("link")).toHaveCount(groups.length);
  await search.fill("forms");
  for (const component of catalog.filter(component => component.group === "forms")) {
    await expect(page.locator(".component-catalog").getByRole("link", { name: new RegExp(`^${component.name}\\b`) })).toBeVisible();
  }
  await expect(page.locator(".component-catalog").getByRole("heading", { name: "Forms", exact: true })).toBeVisible();
  await search.fill("  SCROLL area  ");
  for (const name of ["ScrollArea", "Table"]) await expect(page.locator(".component-catalog").getByRole("link", { name: new RegExp(`^${name}\\b`) })).toBeVisible();
  await search.fill("not-a-component");
  await expect(page.locator(".catalog-card")).toHaveCount(0);
  await expect(page.locator(".component-catalog")).toContainText("No components found");
  await search.press("Escape");
  await expect(page.locator(".catalog-card")).toHaveCount(catalog.length);
  const markdown = await (await request.get("/components.md")).text();
  for (const group of groups) expect(markdown).toContain(`## ${group.label}`);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `.artifacts/catalog-groups-${info.project.name}.png` });
});

test("category links and active item survive direct component navigation", async ({ page }, info) => {
  await page.goto("/components/select");
  await expect(page.locator(".doc-breadcrumb").getByRole("link", { name: "Forms" })).toHaveAttribute("href", "/components#forms");
  if (info.project.name === "mobile") await page.getByText("Browse documentation", { exact: true }).click();
  const sidebar = page.locator(info.project.name === "mobile" ? ".mobile-navigation" : ".desktop-sidebar");
  const current = sidebar.getByRole("group", { name: "Forms", exact: true }).getByRole("link", { name: "Select", exact: true });
  await expect(current).toHaveAttribute("aria-current", "page");
  await expect(current).toBeInViewport();
  const search = sidebar.getByRole("searchbox", { name: "Search components" });
  await search.fill("icon");
  await expect(sidebar.getByRole("link", { name: "IconButton", exact: true })).toBeVisible();
  await sidebar.getByRole("link", { name: "IconButton", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("IconButton");
});
