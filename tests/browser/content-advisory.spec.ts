import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("a content advisory reveals and unmounts media on deliberate activation", async ({ page }, info) => {
  await page.goto("/components/content-advisory");
  const advisory = page.locator(".workbench-stage .flood-content-advisory");
  const warningPanel = advisory.locator(".flood-alert");
  const toggle = advisory.getByRole("button");
  const warning = advisory.getByText("Contains the final result", { exact: true }).first();
  const media = advisory.locator("img");

  await expect(warning).toBeVisible();
  await expect(toggle).toHaveAccessibleName(/Show chart.*Contains the final result/);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(media).toHaveCount(0);
  const beforePanel = (await warningPanel.boundingBox())!;
  const beforeToggle = (await toggle.boundingBox())!;
  await advisory.screenshot({ path: info.outputPath("advisory-concealed.png") });

  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAccessibleName(/Hide chart.*Contains the final result/);
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(toggle).toBeFocused();
  await expect(warning).toBeVisible();
  await expect(media).toBeVisible();
  const afterPanel = (await warningPanel.boundingBox())!;
  const afterToggle = (await toggle.boundingBox())!;
  expect(afterPanel.height).toBeCloseTo(beforePanel.height, 0);
  expect(afterToggle.y - afterPanel.y).toBeCloseTo(beforeToggle.y - beforePanel.y, 0);
  await advisory.screenshot({ path: info.outputPath("advisory-revealed.png") });

  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await expect(media).toHaveCount(0);
});

test("a media advisory reserves the same frame and action position across reveal", async ({ page }, info) => {
  await page.goto("/components/content-advisory");
  await chooseSelectOption(page.getByRole("combobox", { name: "ContentAdvisory prop presentation" }), "media");
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "ContentAdvisory prop narrow" }).check();
  }
  const advisory = page.locator(".workbench-stage .flood-content-advisory");
  const frame = advisory.locator(".flood-content-advisory__frame");
  const toggle = advisory.getByRole("button");
  const image = advisory.getByRole("img");
  await expect(toggle).toHaveAccessibleDescription("The chart shows which series ended higher.");
  await expect(image).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  const concealedFrame = await frame.boundingBox();
  const concealedToggle = await toggle.boundingBox();
  await advisory.screenshot({ path: info.outputPath("advisory-media-concealed.png") });

  await toggle.press("Space");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(image).toBeVisible();
  await image.evaluate(node => (node as HTMLImageElement).decode());
  expect(await frame.boundingBox()).toEqual(concealedFrame);
  expect(await toggle.boundingBox()).toEqual(concealedToggle);
  await advisory.screenshot({ path: info.outputPath("advisory-media-revealed.png") });

  await toggle.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await expect(advisory.locator("img")).toHaveCount(0);
});
