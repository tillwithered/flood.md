import { expect, test, type Page } from "@playwright/test";

async function slowMotion(page: Page) {
  await page.addStyleTag({ content: `
    .flood-root {
      --flood-sys-motion-duration-enter: 2s;
      --flood-sys-motion-duration-layer: 2s;
    }
  ` });
}

test("anchored layer entry keeps the panel geometry fixed and closes with Escape", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/components/popover");
  await slowMotion(page);
  const workbench = page.getByRole("region", { name: "Popover live playground" });
  const trigger = workbench.getByRole("button", { name: "Project settings", exact: true });
  await trigger.click();
  const popup = workbench.getByRole("dialog", { name: "Project settings" });
  await expect(popup).toHaveCSS("animation-name", "flood-motion-layer-in");
  await expect(popup).toHaveCSS("translate", "none");
  await expect(popup.locator(".flood-overlay-header")).toHaveCSS("translate", "none");
  const body = popup.locator(".flood-overlay-body");
  await expect(body).toHaveCSS("animation-name", "flood-motion-layer-content-in");
  expect(await body.evaluate(node => getComputedStyle(node).translate.split(" ").some(value => Math.abs(parseFloat(value)) > 0))).toBe(true);
  await expect(popup.getByRole("textbox", { name: "Project name" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(popup).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.press("Enter");
  await expect(popup).toBeVisible();
  await expect(popup.getByRole("textbox", { name: "Project name" })).toBeFocused();
});

test("drawer reveals bounded content while its edge stays in place", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/components/drawer");
  await slowMotion(page);
  const workbench = page.getByRole("region", { name: "Drawer live playground" });
  const trigger = workbench.getByRole("button", { name: "Open settings", exact: true });
  await trigger.click();
  const drawer = workbench.getByRole("dialog", { name: "Project settings" });
  await expect(drawer).toHaveCSS("animation-name", "flood-motion-layer-in");
  await expect(drawer).toHaveCSS("translate", "none");
  await expect(drawer.locator(".flood-overlay-header")).toHaveCSS("translate", "none");
  await expect(drawer.locator(".flood-drawer__body")).toHaveCSS("animation-name", "flood-motion-layer-content-in");
  const bounds = await drawer.boundingBox();
  expect(Math.abs(bounds!.x + bounds!.width - (await page.evaluate(() => innerWidth)))).toBeLessThan(1);
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("system and local reduced motion preserve interaction and remove layer motion", async ({ page }) => {
  await page.goto("/components/popover");
  const workbench = page.getByRole("region", { name: "Popover live playground" });
  const root = workbench.locator(".workbench-stage .flood-root");
  const trigger = workbench.getByRole("button", { name: "Project settings", exact: true });
  const popup = workbench.getByRole("dialog", { name: "Project settings" });
  for (const mode of ["system", "local"]) {
    await page.emulateMedia({ reducedMotion: mode === "system" ? "reduce" : "no-preference" });
    if (mode === "local") await root.evaluate(node => node.setAttribute("data-flood-motion", "reduce"));
    await trigger.press("Enter");
    await expect(popup).toBeVisible();
    await expect(popup).toHaveCSS("animation-name", "none");
    await expect(popup.locator(".flood-overlay-body")).toHaveCSS("animation-name", "none");
    await expect(popup.getByRole("textbox", { name: "Project name" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();
    await expect(trigger).toBeFocused();
  }
});

test("toast arrival keeps the live message available during motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/playground/motion");
  await slowMotion(page);
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("menuitem", { name: "Duplicate project" }).click();
  const toast = page.locator(".flood-toast");
  await expect(toast).toHaveCSS("animation-name", "flood-toast-enter");
  await expect(toast.getByRole("status")).toContainText("Action complete");
  await expect(toast.getByRole("status")).toHaveCSS("animation-name", "none");
  const entry = await toast.evaluate(card => {
    const animation = card.getAnimations()[0];
    animation.pause();
    animation.currentTime = 0;
    const start = card.getBoundingClientRect().top;
    animation.finish();
    return start - card.getBoundingClientRect().top;
  });
  expect(entry).toBeGreaterThan(4);
  await toast.getByRole("button", { name: /Action complete/ }).click();
  await expect(toast).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("menuitem", { name: "Duplicate project" }).click();
  await expect(toast).toHaveCSS("animation-name", "none");
  await expect(toast.getByRole("status")).toContainText("Action complete");
});
