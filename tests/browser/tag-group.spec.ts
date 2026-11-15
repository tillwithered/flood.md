import { expect, test } from "@playwright/test";

test("tag group discloses accepted tags, wraps long values and retains focus on removal", async ({page}, info) => {
  await page.goto("/components/tag-group");
  const group = page.getByRole("list", {name:"Project filters", exact:true});
  const shortTag = group.getByRole("button", {name:"Remove Status: Active", exact:true});
  const nextTag = group.getByRole("button", {name:"Remove Owner: Maya Chen", exact:true});
  const longTag = group.getByText("Team: Product design and research", {exact:true});
  await expect(group).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(longTag).toHaveCount(0);
  const toggle = group.getByRole("button", {name:"Show 2 more", exact:true});
  await toggle.press("Enter");
  await expect(longTag).toBeVisible();
  await expect(group.getByRole("button", {name:"Show fewer", exact:true})).toBeFocused();

  await page.getByRole("checkbox", {name:"TagGroup prop narrow", exact:true}).check();
  const bounds = await group.boundingBox();
  const tag = await longTag.locator("..").boundingBox();
  expect(tag!.x + tag!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width + 1);
  expect(await longTag.evaluate(node => node.getBoundingClientRect().height / parseFloat(getComputedStyle(node).lineHeight))).toBeGreaterThan(1);
  await group.screenshot({path:info.outputPath("tag-group-expanded.png")});

  await shortTag.press("Enter");
  await expect(shortTag).toHaveCount(0);
  await expect(nextTag).toBeFocused();
  await page.getByRole("checkbox", {name:"TagGroup prop disabled", exact:true}).check();
  await expect(nextTag).toBeDisabled();
  await expect(longTag).toBeVisible();
});
