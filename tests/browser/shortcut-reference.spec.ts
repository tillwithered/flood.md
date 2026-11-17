import { expect, test } from "@playwright/test";

test("ShortcutReference finds sequential chords and uses the current platform's keys", async ({ page }, info) => {
  await page.goto("/components/shortcut-reference");
  const panel = page.locator(".preview-stage .flood-shortcut-reference");
  const search = panel.getByRole("searchbox", { name: "Search shortcuts" });
  const workspace = panel.getByRole("list", { name: "Workspace" });
  const service = panel.getByRole("list", { name: "Service view" });
  await expect(workspace).toBeVisible();
  await expect(service.locator("kbd")).toHaveText(["G", "D", "G", "V"]);
  await expect(service.getByText("G then V", { exact: true })).toBeAttached();

  const searchY = (await search.boundingBox())!.y;
  await search.fill("G then V");
  await expect(service.getByRole("listitem")).toHaveCount(1);
  await expect(service).toContainText("Go to variables");
  await expect(workspace).toHaveCount(0);
  expect(Math.abs((await search.boundingBox())!.y - searchY)).toBeLessThan(2);
  await search.fill("Service variables G then V");
  await expect(service.getByRole("listitem")).toHaveCount(1);
  await expect(service).toContainText("Go to variables");
  await expect(workspace).toHaveCount(0);
  await expect(search).toBeFocused();
  await search.fill("Workspace palette Ctrl + K");
  await expect(workspace.getByRole("listitem")).toHaveCount(1);
  await expect(workspace.locator("kbd")).toHaveText(["Ctrl", "K"]);
  await search.fill("Workspace ?");
  await expect(workspace.locator("kbd")).toHaveText(["?"]);
  await search.fill("missing shortcut");
  await expect(panel.getByRole("status")).toHaveText("No matching shortcuts.");
  await panel.getByRole("button", { name: "Clear search" }).click();
  await expect(search).toBeFocused();
  await expect(service).toBeVisible();

  await page.getByRole("combobox", { name: "ShortcutReference prop platform" }).click();
  await page.getByRole("option", { name: "macOS", exact: true }).click();
  await expect(workspace.locator("kbd").first()).toHaveText("⌘");
  await search.fill("Workspace palette Command plus K");
  await expect(workspace.getByRole("listitem")).toHaveCount(1);
  await panel.getByRole("button", { name: "Clear search" }).click();
  await page.getByRole("checkbox", { name: "ShortcutReference prop narrow" }).check();
  await expect.poll(() => panel.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await search.fill("Service variables G then V");
  await expect(service.getByRole("listitem")).toHaveCount(1);
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".preview-stage").screenshot({ path: info.outputPath("shortcut-reference-narrow.png") });

  await page.getByRole("checkbox", { name: "ShortcutReference prop empty" }).check();
  await expect(panel.getByText("No shortcuts available.", { exact: true })).toBeVisible();
  await expect(search).toHaveCount(0);
});
