import { expect, test } from "@playwright/test";

test("guide navigation reveals the current recipe and preserves section links", async ({ page }, info) => {
  const mobile = info.project.name === "mobile";
  await page.goto("/docs/recipes/settings-workspace");

  if (mobile) {
    await page.getByRole("button", { name: "Browse documentation" }).click();
    await expect(page.getByRole("dialog", { name: "Documentation" })).toBeVisible();
  }

  const navigation = page.getByRole("navigation", { name: "Documentation sections" });
  const current = navigation.getByRole("list", { name: "Recipes" }).getByRole("link", { name: "Settings workspace" });
  await expect(current).toHaveAttribute("aria-current", "page");
  await expect(current).toBeInViewport();
  await navigation.getByRole("list", { name: "Getting started" }).getByRole("link", { name: "Installation" }).click();
  await expect(page).toHaveURL(/\/docs\/installation$/);

  if (mobile) await page.getByRole("button", { name: "On this page" }).click();
  const outline = page.getByRole("navigation", { name: "On this page" });
  await outline.getByRole("link", { name: "Connect with the CLI" }).click();
  await expect(page).toHaveURL(/#connect-with-the-cli$/);
  await expect(page.getByRole("heading", { name: "Connect with the CLI" })).toBeInViewport();
});
