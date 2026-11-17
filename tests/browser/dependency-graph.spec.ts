import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("DependencyGraph shows parallel jobs and retains their relationships in list view", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/dependency-graph");
  const graph = page.locator(".preview-stage .flood-dependency-graph");
  const build = graph.getByRole("button", { name: "Build", exact: true });
  const typecheck = graph.getByRole("button", { name: "Type check", exact: true });
  const browser = graph.getByRole("button", { name: "Browser tests", exact: true });
  const publish = graph.getByRole("button", { name: "Publish", exact: true });
  const edge = graph.locator("path[data-from][data-to]");
  await expect(edge).toHaveCount(4);
  const [a, b, c, d] = await Promise.all([build, typecheck, browser, publish].map(button => button.boundingBox()));
  expect(a!.x).toBeLessThan(b!.x);
  expect(Math.abs(b!.x - c!.x)).toBeLessThan(2);
  expect(c!.y).toBeGreaterThan(b!.y);
  expect(d!.x).toBeGreaterThan(c!.x);
  await expect(publish).toHaveAccessibleDescription("Depends on Type check, Browser tests");
  await publish.press("Enter");
  await expect(publish).toHaveAttribute("aria-current", "true");
  await expect(graph.locator("path[data-active=true]")).toHaveCount(2);
  await page.evaluate(() => document.fonts.ready);
  await graph.screenshot({ path: info.outputPath("dependency-graph.png") });

  await chooseSelectOption(page.getByRole("combobox", { name: "DependencyGraph prop presentation", exact: true }), "list");
  await expect(graph.getByRole("list", { name: "Release jobs" })).toBeVisible();
  await expect(edge).toHaveCount(0);
  await expect(publish).toHaveAttribute("aria-current", "true");
  await expect(graph.getByText("Depends on Type check, Browser tests")).toBeVisible();
  await graph.screenshot({ path: info.outputPath("dependency-graph-list.png") });
});

test("DependencyGraph uses the same relationships for upstream tables and downstream reports", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/dependency-graph");
  await chooseSelectOption(page.getByRole("combobox", { name: "DependencyGraph prop example", exact: true }), "Tables");
  const graph = page.locator(".preview-stage .flood-dependency-graph");
  const orders = graph.getByRole("button", { name: "Orders", exact: true });
  const accounts = graph.getByRole("button", { name: "Accounts", exact: true });
  const facts = graph.getByRole("button", { name: "Order facts", exact: true });
  const revenue = graph.getByRole("button", { name: "Daily revenue", exact: true });
  const summary = graph.getByRole("button", { name: "Account summary", exact: true });
  await expect(graph.getByRole("button", { name: "Build", exact: true })).toHaveCount(0);
  await expect(facts).toHaveAccessibleDescription(/Depends on Orders, Accounts/);
  await expect(revenue).toHaveAccessibleDescription(/Depends on Order facts/);
  await expect(summary).toHaveAccessibleDescription(/Depends on Order facts/);
  const boxes = await Promise.all([orders, accounts, facts, revenue, summary].map(button => button.boundingBox()));
  const [a,b,c,d,e] = boxes.map(box=>box!);
  expect(Math.abs(a.x-b.x)).toBeLessThan(2);
  expect(c.x).toBeGreaterThan(b.x);
  expect(d.x).toBeGreaterThan(c.x);
  expect(Math.abs(e.x-d.x)).toBeLessThan(2);
  await facts.press("Enter");
  await expect(graph.locator("path[data-active=true]")).toHaveCount(4);
  await page.evaluate(() => document.fonts.ready);
  await graph.screenshot({ path:info.outputPath("table-dependencies.png") });

  await chooseSelectOption(page.getByRole("combobox", { name: "DependencyGraph prop presentation", exact: true }), "list");
  await expect(graph.getByRole("list", { name: "Table dependencies", exact: true })).toBeVisible();
  await expect(facts).toHaveAttribute("aria-current", "true");
  await expect(graph.getByText("Depends on Orders, Accounts", { exact:true })).toBeVisible();
  await graph.screenshot({ path:info.outputPath("table-dependencies-list.png") });
});
