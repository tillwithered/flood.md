import { test, expect } from "@playwright/test";

test.describe("readable without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("public pages expose styled content, API and normal links", async ({ page }, info) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Good interfaces");
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Docs", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Introduction");
    await expect(page.locator(".markdown-content")).not.toBeEmpty();
    await page.goto("/components/button");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Button");
    await expect(page.getByRole("heading", { name: "API reference", exact: true })).toBeVisible();
    await expect(page.locator("#usage .site-code-block code")).toContainText("@flood-md/react");
    expect(await page.locator(".component-workbench").evaluate(node => getComputedStyle(node).borderTopStyle)).toBe("solid");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://flood.md/components/button");
    await page.screenshot({ path: `.artifacts/indexing-nojs-${info.project.name}.png`, fullPage: true });
  });
});

test("hydration retains document semantics, interactions and anchors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/components/button");
  await expect(page.locator("#usage .site-code-block")).toHaveAttribute("data-highlighted", "true");
  await page.getByRole("checkbox", { name: "Button prop loading", exact: true }).check();
  await expect(page.locator(".preview-stage").getByRole("button", { name: "Save changes" })).toBeDisabled();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.locator(".preview-stage").getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".preview-stage").getByRole("status")).toContainText("Action completed locally.");
  await page.goto("/docs/installation#updates-from-011");
  await expect(page.locator("#updates-from-011")).toBeInViewport();
  expect(errors).toEqual([]);
});
