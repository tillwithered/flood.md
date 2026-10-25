import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("catalog categories, search and canonical Markdown agree", async ({ page, request }, info) => {
  await page.goto("/components");
  if (info.project.name === "mobile") await page.getByText("Browse documentation", { exact: true }).click();
  const sidebar = page.locator(info.project.name === "mobile" ? ".mobile-navigation" : ".desktop-sidebar");
  const search = sidebar.getByRole("searchbox", { name: "Search components" });
  await expect(page.locator(".catalog-card")).toHaveCount(47);
  await expect(page.getByRole("navigation", { name: "Component categories" }).getByRole("link")).toHaveCount(9);
  await search.fill("forms");
  await expect(page.locator(".catalog-card")).toHaveCount(13);
  await expect(page.locator(".component-catalog h2")).toHaveText("Forms");
  await search.fill("  SCROLL area  ");
  await expect(page.locator(".catalog-card")).toHaveCount(2);
  await expect(page.locator(".catalog-card")).toContainText(["ScrollArea", "Table"]);
  await search.fill("not-a-component");
  await expect(page.locator(".catalog-card")).toHaveCount(0);
  await expect(page.locator(".component-catalog")).toContainText("No components found");
  await search.press("Escape");
  await expect(page.locator(".catalog-card")).toHaveCount(47);
  const markdown = await (await request.get("/components.md")).text();
  for (const name of ["Setup", "Layout", "Typography", "Actions", "Forms", "Navigation", "Content", "Overlays", "Feedback"]) expect(markdown).toContain(`## ${name}`);
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
