import { expect, test } from "@playwright/test";

test("StackTrace marks the exact source line and opens frames independently", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/stack-trace");
  const stack = page.locator(".preview-stage .flood-stack-trace");
  const first = stack.locator(".flood-stack-frame").filter({ hasText: "loadProject" }).first();
  const second = stack.locator(".flood-stack-frame").filter({ hasText: "handleRequest" });
  const noSource = stack.locator(".flood-stack-frame").filter({ hasText: "onRequest" });
  await expect(first).toContainText("src/data/workspace/projects.ts:19:8");
  await expect(noSource.getByRole("button")).toHaveCount(0);
  const firstToggle = first.getByRole("button", { name: /source context/ });
  const secondToggle = second.getByRole("button", { name: /source context/ });
  await firstToggle.press("Space");
  await expect(firstToggle).toBeFocused();
  await expect(firstToggle).toHaveAttribute("aria-expanded", "true");
  const current = first.locator('[aria-current="location"]');
  await expect(current).toContainText("19");
  await expect(current.locator("code")).toHaveText("return request(projectId);");
  await expect(secondToggle).toHaveAttribute("aria-expanded", "false");
  await secondToggle.press("Enter");
  await expect(secondToggle).toHaveAttribute("aria-expanded", "true");
  await expect(firstToggle).toHaveAttribute("aria-expanded", "true");
  const snippet = (await first.locator(".flood-stack-frame__source").boundingBox())!;
  const frameBounds = (await first.boundingBox())!;
  expect(Math.abs(snippet.width - frameBounds.width)).toBeLessThan(2);
  await page.evaluate(() => document.fonts.ready);
  await stack.screenshot({ path: info.outputPath("stack-trace-open.png") });
  await firstToggle.press("Enter");
  await expect(firstToggle).toBeFocused();
  await expect(firstToggle).toHaveAttribute("aria-expanded", "false");
  await expect(secondToggle).toHaveAttribute("aria-expanded", "true");
});

test("a StackFrame keeps its source location when no source is available", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/stack-frame");
  const frame = page.locator(".preview-stage .flood-stack-frame");
  await frame.getByRole("button", { name: "Show source context" }).click();
  await expect(frame.locator('[aria-current="location"]')).toContainText("19");
  await page.evaluate(() => document.fonts.ready);
  await frame.screenshot({ path: info.outputPath("stack-frame-context.png") });
  await page.getByRole("checkbox", { name: "StackFrame prop showSource", exact: true }).uncheck();
  await expect(frame).toContainText("src/data/workspace/projects.ts:19:8");
  await expect(frame.getByRole("button")).toHaveCount(0);
});
