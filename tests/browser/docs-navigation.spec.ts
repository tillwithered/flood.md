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
  await expect(outline.getByRole("link", { name: "Connect with the CLI" })).toHaveAttribute("aria-current", "location");
});

test("table of contents follows native fragments and scrolling in its own region", async ({ page }) => {
  await page.goto("/components/table-of-contents");

  const outline = page.getByRole("navigation", { name: "On this page" });
  const viewport = page.getByRole("region", { name: "Setup guide" });
  await expect(outline.getByRole("link", { name: "Installation" })).toHaveAttribute("aria-current", "location");

  const tokens = outline.getByRole("link", { name: "Import tokens" });
  await tokens.press("Enter");
  await expect(page).toHaveURL(/#outline-tokens$/);
  await expect(tokens).toHaveAttribute("aria-current", "location");

  await viewport.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await expect(outline.getByRole("link", { name: "Verification" })).toHaveAttribute("aria-current", "location");
  await expect(outline.locator('[aria-current="location"]')).toHaveCount(1);
  await expect(page).toHaveURL(/#outline-tokens$/);
});
