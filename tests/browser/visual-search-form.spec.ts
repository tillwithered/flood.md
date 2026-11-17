import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("VisualSearchForm submits text and image independently and preserves the draft", async ({ page }, info) => {
  await page.goto("/components/visual-search-form");
  const form = page.getByRole("form", { name:"Find visual references", exact:true });
  const surface = page.locator(".preview-stage .flood-surface").filter({ has: form });
  const input = form.getByRole("searchbox", { name:"Search text", exact:true });
  const search = form.getByRole("button", { name:"Search", exact:true });
  const feedback = page.getByRole("region", { name:"VisualSearchForm live playground" }).getByRole("status");
  await expect(form.getByText("Weekly area chart", { exact:true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await surface.screenshot({ path: info.outputPath("visual-search-form.png") });
  await search.click();
  await expect(feedback).toHaveText("Searching for Weekly area chart");

  await input.fill("  compact charts  ");
  await form.getByRole("button", { name:"Replace image" }).click();
  await expect(input).toHaveValue("  compact charts  ");
  await input.press("Enter");
  await expect(feedback).toHaveText("Searching for Weekly line chart · compact charts");

  await page.getByRole("checkbox", { name:"VisualSearchForm prop narrow" }).check();
  await chooseSelectOption(page.getByRole("combobox", { name:"VisualSearchForm prop surface" }), "overlay");
  await expect.poll(() => form.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  const centerY = (node: Element) => {
    const bounds = node.getBoundingClientRect();
    return bounds.top + bounds.height / 2;
  };
  const replaceY = await form.getByRole("button", { name:"Replace image" }).evaluate(centerY);
  const removeY = await form.getByRole("button", { name:"Remove image" }).evaluate(centerY);
  expect(Math.abs(replaceY - removeY)).toBeLessThanOrEqual(1);
  await surface.screenshot({ path: info.outputPath("visual-search-form-narrow.png") });
  await page.getByRole("checkbox", { name:"VisualSearchForm prop pending" }).check();
  await expect(search).toHaveAttribute("aria-disabled", "true");
  await input.press("Enter");
  await expect(feedback).toHaveText("");
  await page.getByRole("checkbox", { name:"VisualSearchForm prop pending" }).uncheck();

  await form.getByRole("button", { name:"Remove image" }).press("Enter");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("  compact charts  ");
  await input.press("Enter");
  await expect(feedback).toHaveText("Searching for compact charts");
  await form.getByRole("button", { name:"Clear search" }).click();
  await expect(search).toBeDisabled();
  await form.getByRole("button", { name:"Add image" }).click();
  await expect(search).toBeEnabled();
});
