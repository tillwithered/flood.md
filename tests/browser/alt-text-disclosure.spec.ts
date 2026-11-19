import { expect, test } from "@playwright/test";

test("AltTextDisclosure preserves the native description and restores the opener", async ({ page }, info) => {
  await page.goto("/components/alt-text-disclosure");
  const stage = page.locator(".preview-stage");
  const button = stage.getByRole("button", { name: "Show alt text" });
  const dialog = page.getByRole("dialog", { name: "Image description" });
  await expect(button).toHaveText("ALT");
  await button.press("Enter");
  await expect(dialog).toBeVisible();
  const firstDescription = await stage.locator("img").getAttribute("alt");
  await expect(dialog.locator(".flood-text")).toHaveText(firstDescription!);
  await expect(dialog.locator(".flood-text")).toBeFocused();
  await expect(dialog.locator(".flood-scroll-area__viewport")).not.toBeFocused();
  await page.evaluate(() => document.fonts.ready);
  await dialog.screenshot({ path: info.outputPath("alt-text-description.png") });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(button).toBeFocused();

  const example = page.getByRole("combobox", { name: /^(Example|AltTextDisclosure prop example)$/ });
  await example.click();
  await page.getByRole("option", { name: "detailed", exact: true }).click();
  await page.setViewportSize({ width: 360, height: 480 });
  await page.getByRole("checkbox", { name: "AltTextDisclosure prop narrow" }).check();
  await button.click();
  const viewport = dialog.locator(".flood-scroll-area__viewport");
  const imageAlt = await stage.locator("img").getAttribute("alt");
  expect(await dialog.locator(".flood-text").textContent()).toBe(imageAlt);
  await expect(viewport).toHaveAttribute("data-scrollbars", "overlay");
  await expect.poll(() => viewport.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  await viewport.focus();
  await page.keyboard.press("End");
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await dialog.screenshot({ path: info.outputPath("alt-text-scrolled.png") });
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(button).toBeFocused();

  await example.click();
  await page.getByRole("option", { name: "decorative", exact: true }).click();
  await expect(stage.locator("img")).toHaveAttribute("alt", "");
  await expect(button).toHaveCount(0);
});
