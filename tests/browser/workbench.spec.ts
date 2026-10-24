import { test, expect } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("preview geometry stays stable across icon sizes, feedback and reset", async ({ page }, info) => {
  await page.goto("/components/icon-button");
  const workbench = page.locator(".component-workbench"), stage = page.locator(".preview-stage");
  const icon = stage.getByRole("button", { name: "Add idea" });
  const geometry = async () => {
    const box = (await icon.boundingBox())!, frame = (await workbench.boundingBox())!;
    return { height: frame.height, x: box.x + box.width / 2 - frame.x, y: box.y + box.height / 2 - frame.y };
  };
  const before = await geometry();
  for (const size of ["2xs", "2xl", "md"]) {
    await chooseSelectOption(page.getByRole("combobox", { name: "IconButton prop size", exact: true }), size);
    const next = await geometry();
    expect(next.height).toBeCloseTo(before.height, 1);
    expect(next.x).toBeCloseTo(before.x, 1);
    expect(next.y).toBeCloseTo(before.y, 1);
  }
  await icon.click();
  await expect(stage.getByRole("status")).toHaveText("Action completed locally.");
  expect(await geometry()).toEqual(before);
  await expect(page.locator("#usage .site-code-block code")).not.toContainText("workbench-feedback");
  await page.screenshot({ path: `.artifacts/workbench-icon-feedback-${info.project.name}.png` });
  await workbench.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(stage.getByRole("status")).toBeEmpty();
  expect(await geometry()).toEqual(before);
});

test("textarea sizes and validation never resize the playground or move its settings", async ({ page }, info) => {
  await page.goto("/components/textarea");
  const workbench = page.locator(".component-workbench"), controls = page.locator(".workbench-controls");
  const textarea = page.locator(".preview-stage textarea");
  const initialHeight = (await workbench.boundingBox())!.height;
  const settingsTop = async () => (await controls.boundingBox())!.y - (await workbench.boundingBox())!.y;
  const initialTop = await settingsTop();
  const heights = [];
  for (const size of ["sm", "md", "lg", "xl"]) {
    await chooseSelectOption(page.getByRole("combobox", { name: "Textarea prop controlSize", exact: true }), size);
    heights.push((await textarea.boundingBox())!.height);
    expect((await workbench.boundingBox())!.height).toBeCloseTo(initialHeight, 1);
    expect(await settingsTop()).toBeCloseTo(initialTop, 1);
  }
  expect(heights[3]).toBeGreaterThan(heights[0]);
  const textareaTop = async () => (await textarea.boundingBox())!.y - (await page.locator(".preview-stage").boundingBox())!.y;
  const before = await textareaTop();
  await page.getByRole("checkbox", { name: "Textarea prop invalid", exact: true }).check();
  expect(await textareaTop()).toBeCloseTo(before, 1);
  expect(await settingsTop()).toBeCloseTo(initialTop, 1);
  await workbench.getByRole("button", { name: "Focus control", exact: true }).click();
  await expect(textarea).toBeFocused();
  await expect(workbench).not.toContainText("Changes stay in this preview.");
  await expect(workbench).not.toContainText("Adjust the props.");
  await expect(workbench).not.toContainText("Reset restores the example");
  await page.screenshot({ path: `.artifacts/workbench-textarea-${info.project.name}.png` });
});

test("field descriptions have reserved space and oversized samples remain reachable", async ({ page }) => {
  await page.goto("/components/field");
  const input = page.locator(".preview-stage input");
  const inputTop = async () => (await input.boundingBox())!.y - (await page.locator(".preview-stage").boundingBox())!.y;
  const initial = await inputTop();
  for (const name of ["hint", "error"]) {
    await page.getByRole("checkbox", { name: `Field prop ${name}`, exact: true }).uncheck();
    expect(await inputTop()).toBeCloseTo(initial, 1);
  }
  await page.goto("/components/heading");
  await chooseSelectOption(page.getByRole("combobox", { name: "Heading prop size", exact: true }), "display");
  await page.evaluate(() => { document.documentElement.style.fontSize = "32px"; });
  const stage = page.locator(".preview-stage");
  await stage.evaluate(node => { node.scrollTop = 0; });
  const heading = stage.getByRole("heading");
  expect((await heading.boundingBox())!.y).toBeGreaterThanOrEqual((await stage.boundingBox())!.y);
  await stage.evaluate(node => { node.scrollTop = node.scrollHeight; });
  const box = (await heading.boundingBox())!, frame = (await stage.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(frame.y + frame.height + 1);
});

test("font and icon credits expose complete local license notices", async ({ page, request }) => {
  await page.goto("/docs/faq");
  await expect(page.getByRole("heading", { name: "Which fonts and icons does Flood use?" })).toBeVisible();
  for (const [file, text] of [["inter.txt", "SIL OPEN FONT LICENSE"], ["lucide.txt", "ISC License"], ["github-mark.txt", "MIT License"]]) {
    const response = await request.get(`/licenses/${file}`);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain(text);
  }
});
