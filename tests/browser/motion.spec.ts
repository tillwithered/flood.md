import { expect, test } from "@playwright/test";

test("press compresses a control without moving its neighbors and releases cleanly", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/playground/motion");
  const button = page.getByRole("button", { name: "Hover or press" });
  const neighbor = page.getByRole("switch", { name: "Notifications" });
  const press = async () => {
    await button.hover();
    await page.mouse.down();
  };
  await expect(button).toHaveCSS("scale", "none");
  const initial = await neighbor.boundingBox();
  await press();
  await expect(button).toHaveCSS("scale", "0.96");
  expect(await neighbor.boundingBox()).toEqual(initial);
  await page.mouse.up();
  await expect(button).toHaveCSS("scale", "none");

  await page.getByRole("radio", { name: "Reduced motion", exact: true }).check();
  await press();
  await expect(button).toHaveCSS("scale", "none");
  await page.mouse.up();
});

test("motion preview reduces loading and transitions without changing state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/playground/motion");
  const loading = page.getByRole("button", { name: "Loading", exact: true });
  const progress = page.getByRole("progressbar", { name: "Upload" });
  const fill = progress.locator(".flood-indicator__fill");
  const skeleton = page.locator(".flood-skeleton");
  await loading.click();
  await expect(loading).toHaveAttribute("aria-pressed", "true");
  await expect(fill).toHaveCSS("animation-name", "flood-indeterminate");
  await expect(skeleton).toHaveCSS("animation-name", "flood-skeleton-pulse");

  await page.getByRole("radio", { name: "Reduced motion", exact: true }).check();
  await expect(fill).toHaveCSS("animation-name", "none");
  await expect(skeleton).toHaveCSS("animation-name", "none");
  await expect(progress).not.toHaveAttribute("aria-valuenow", /.+/);
  await expect(loading).toHaveAttribute("aria-pressed", "true");

  await loading.click();
  await page.getByRole("button", { name: "Update progress" }).click();
  await expect(progress).toHaveAttribute("aria-valuenow", "50");
  await expect(fill).toHaveCSS("transition-duration", "0s");

  await page.getByRole("radio", { name: "System preference", exact: true }).check();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await loading.click();
  await expect(skeleton).toHaveCSS("animation-name", "none");
  await expect(fill).toHaveCSS("animation-name", "none");
});
