import { expect, test } from "@playwright/test";

test("recipe navigation reveals the current recipe and links to the recipe catalog", async ({ page }, info) => {
  const mobile = info.project.name === "mobile";
  await page.goto("/docs/recipes/settings-workspace");

  if (mobile) {
    await page.getByRole("button", { name: "Browse recipes" }).click();
    await expect(page.getByRole("dialog", { name: "Recipes" })).toBeVisible();
  }

  const navigation = page.getByRole("navigation", { name: "Recipe navigation" });
  const current = navigation.getByRole("link", { name: "Settings workspace", exact: true });
  await expect(current).toHaveAttribute("aria-current", "page");
  await expect(current).toBeInViewport();
  const sidebar = mobile ? page.getByRole("dialog", { name: "Recipes" }) : page.getByRole("complementary", { name: "Documentation navigation" });
  await sidebar.getByRole("link", { name: "All recipes" }).click();
  await expect(page).toHaveURL(/\/recipes$/);
});

test("documentation navigation opens a guide and preserves section links", async ({ page }, info) => {
  const mobile = info.project.name === "mobile";
  await page.goto("/docs");

  if (mobile) {
    await page.getByRole("button", { name: "Browse documentation" }).click();
    await expect(page.getByRole("dialog", { name: "Documentation" })).toBeVisible();
  }

  const navigation = page.getByRole("navigation", { name: "Documentation sections" });
  await navigation.getByRole("list", { name: "Getting started" }).getByRole("link", { name: "Installation" }).click();
  await expect(page).toHaveURL(/\/docs\/installation$/);
  await expect(page.getByRole("heading", { name: "Installation", exact: true })).toBeVisible();

  if (mobile) await page.getByRole("button", { name: "On this page" }).click();
  const outline = page.getByRole("navigation", { name: "On this page" });
  await outline.getByRole("link", { name: "Connect with the CLI" }).click();
  await expect(page).toHaveURL(/#connect-with-the-cli$/);
  await expect(page.getByRole("heading", { name: "Connect with the CLI" })).toBeInViewport();
});
