import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("CodeDiff expands context without losing focus and preserves it when changing layout", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/code-diff");
  const diff = page.locator(".preview-stage .flood-code-diff");
  const contextToggle = diff.getByRole("button", { name: /unchanged lines?/ });
  await expect(diff).toHaveAttribute("data-layout", "unified");
  const contextCount = await diff.locator("code").count();
  await expect(contextToggle).toHaveAttribute("aria-expanded", "false");
  await contextToggle.press("Space");
  await expect(contextToggle).toBeFocused();
  await expect(contextToggle).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => diff.locator("code").count()).toBeGreaterThan(contextCount);
  await page.evaluate(() => document.fonts.ready);
  await diff.screenshot({ path: info.outputPath("code-diff-unified.png") });

  await chooseSelectOption(page.getByRole("combobox", { name: "CodeDiff prop layout", exact: true }), "split");
  await expect(diff).toHaveAttribute("data-layout", "split");
  await expect(contextToggle).toHaveAttribute("aria-expanded", "true");
  const changedRow = diff.locator("tr").filter({ has: page.locator(".flood-code-diff__content[data-diff-kind=removed]") }).first();
  await expect(changedRow.locator(".flood-code-diff__content[data-diff-kind=added]")).toBeVisible();
  await diff.screenshot({ path: info.outputPath("code-diff-split.png") });
});
