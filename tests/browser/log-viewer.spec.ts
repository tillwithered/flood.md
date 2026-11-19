import { expect, test, type Locator } from "@playwright/test";

const distanceToLatest = (viewport: Locator) =>
  viewport.evaluate(node => node.scrollHeight - node.clientHeight - node.scrollTop);

test("LogViewer follows new events, preserves an open payload while paused, then resumes", async ({ page }, info) => {
  await page.goto("/components/log-viewer");
  const viewer = page.locator(".preview-stage .flood-log-viewer");
  const viewport = viewer.getByRole("region", { name: "Runtime log" });
  const add = page.getByRole("checkbox", { name: "LogViewer prop incomingEntry" });
  await expect.poll(() => distanceToLatest(viewport)).toBeLessThanOrEqual(2);
  await add.check();
  await expect(viewport.getByText("Upload accepted")).toBeVisible();
  await expect.poll(() => distanceToLatest(viewport)).toBeLessThanOrEqual(2);
  await add.uncheck();
  await viewport.evaluate(node => { node.scrollTop = 0; });
  await expect(viewer).toHaveAttribute("data-following", "false");

  const warning = viewport.locator("[data-severity=warning] .flood-status-indicator__label");
  await page.evaluate(() => document.fonts.ready);
  expect(await warning.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  const error = viewport.getByRole("listitem").filter({ hasText: "Upload exceeded size limit" });
  await error.getByRole("button", { name: "Show payload", exact: true }).press("Enter");
  await expect(error.getByRole("button", { name: "Hide payload", exact: true })).toBeFocused();
  const code = error.locator("code");
  await expect(code).toContainText('"status": 413');
  await expect.poll(() => code.evaluate(node => {
    const content = node.getBoundingClientRect();
    const visible = node.closest(".flood-log-viewer__viewport")!.getBoundingClientRect();
    return content.top >= visible.top - 1 && content.bottom <= visible.bottom + 1;
  })).toBe(true);
  const position = await viewport.evaluate(node => node.scrollTop);
  await add.check();
  const showNew = viewer.getByRole("button", { name: "Show 1 new", exact: true });
  await expect(showNew).toBeVisible();
  await expect(code).toBeVisible();
  expect(await viewport.evaluate(node => node.scrollTop)).toBe(position);
  await page.evaluate(() => document.fonts.ready);
  await viewer.screenshot({ path: info.outputPath("log-paused.png") });

  await showNew.click();
  await expect(viewer.getByRole("button", { name: "Pause", exact: true })).toBeFocused();
  await expect.poll(() => distanceToLatest(viewport)).toBeLessThanOrEqual(2);
});

test("LogRow gives the payload a keyboard-operable disclosure", async ({ page }) => {
  await page.goto("/components/log-row");
  const row = page.locator(".preview-stage .flood-log-row");
  const button = row.locator("button[aria-expanded]");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  const [buttonBox, timeBox] = await Promise.all([button.boundingBox(), row.locator("time").boundingBox()]);
  expect(Math.abs(buttonBox!.y + buttonBox!.height / 2 - timeBox!.y - timeBox!.height / 2)).toBeLessThanOrEqual(1);
  await button.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(row.locator("time")).toHaveAttribute("datetime", "2026-11-16T12:00:09Z");
  await expect(row.getByRole("button", { name: "Copy payload", exact: true })).toBeVisible();
  await button.press("Space");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();
});

test("LogViewer search keeps the current result during appends and navigates without moving focus", async ({ page }, info) => {
  await page.goto("/components/log-viewer");
  await page.getByRole("checkbox", { name: /^Search messages$|^LogViewer prop searchable$/ }).check();
  const viewer = page.locator(".preview-stage .flood-log-viewer");
  const viewport = viewer.getByRole("region", { name: "Runtime log" });
  const find = viewer.getByRole("group", { name: "Find in logs" });
  const input = find.getByRole("searchbox", { name: "Find" });
  const counter = find.getByRole("status");
  const current = viewport.locator("[aria-current=true]");
  const incoming = page.getByRole("checkbox", { name: /^Simulate an entry$|^LogViewer prop incomingEntry$/ });

  await input.fill("Upload");
  await expect(viewer).toHaveAttribute("data-following", "false");
  await expect(counter).toHaveText("1 of 1");
  await expect(current).toContainText("Upload exceeded size limit");
  await expect(current.locator("mark")).toHaveText("Upload");
  await expect(viewport.getByRole("listitem")).toHaveCount(9);
  const before = await viewport.evaluate(node => node.scrollTop);
  await incoming.check();
  await expect(counter).toHaveText("1 of 2");
  await expect(current).toContainText("Upload exceeded size limit");
  expect(await viewport.evaluate(node => node.scrollTop)).toBe(before);

  await input.press("Enter");
  await expect(input).toBeFocused();
  await expect(counter).toHaveText("2 of 2");
  await expect(current).toContainText("Upload accepted");
  await expect.poll(() => current.evaluate(node => {
    const row = node.getBoundingClientRect();
    const area = node.closest(".flood-log-viewer__viewport")!.getBoundingClientRect();
    return row.top >= area.top - 1 && row.bottom <= area.bottom + 1;
  })).toBe(true);
  await input.press("Shift+Enter");
  await expect(counter).toHaveText("1 of 2");
  await expect(current).toContainText("Upload exceeded size limit");
  await page.evaluate(() => document.fonts.ready);
  await viewer.screenshot({ path: info.outputPath("log-search.png") });

  await input.fill("[");
  await expect(counter).toHaveText("No matches");
  await expect(find.getByRole("button", { name: "Next match" })).toBeDisabled();
  await expect(viewport.getByRole("listitem")).toHaveCount(10);
  await expect(current).toHaveCount(0);
  await input.fill("");
  await expect(viewer).toHaveAttribute("data-following", "false");
  await viewer.getByRole("button", { name: "Show 1 new" }).click();
  await expect.poll(() => distanceToLatest(viewport)).toBeLessThanOrEqual(2);
});
