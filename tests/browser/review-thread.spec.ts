import { expect, test } from "@playwright/test";

test("ReviewThread preserves messages and focus through accepted and rejected changes", async ({ page }, info) => {
  await page.goto("/components/review-thread");
  const stage = page.locator(".preview-stage");
  const thread = stage.getByRole("article", { name: "Release notes review" });
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  const resolve = thread.getByRole("button", { name: "Resolve thread" });
  const reopen = thread.getByRole("button", { name: "Reopen thread" });
  const state = thread.getByRole("status");
  const reply = thread.getByText("Use the versioned accessibility guide so readers can match it to their release.");
  const decision = thread.getByText("Decision: link to the versioned accessibility guide.");
  await expect(state).toHaveText("Open");
  await expect(decision).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("review-thread-open.png") });

  await resolve.focus();
  await resolve.press("Enter");
  await expect(state).toHaveText("Resolved");
  await expect(reopen).toBeFocused();
  await expect(decision).toBeVisible();
  await expect(reply).toBeVisible();

  await scenario.click();
  await page.getByRole("option", { name: "Pending", exact: true }).click();
  await expect(reopen).toHaveAttribute("aria-busy", "true");
  await reopen.press("Enter");
  await expect(state).toHaveText("Resolved");
  await expect(reopen).toBeFocused();

  await scenario.click();
  await page.getByRole("option", { name: "Rejected", exact: true }).click();
  await reopen.click();
  await expect(thread.getByRole("alert")).toContainText("The discussion status could not be saved.");
  await expect(state).toHaveText("Resolved");
  await expect(reopen).toBeFocused();

  await scenario.click();
  await page.getByRole("option", { name: "Read only", exact: true }).click();
  await page.getByRole("combobox", { name: "ReviewThread prop surface" }).click();
  await page.getByRole("option", { name: "overlay", exact: true }).click();
  await page.getByRole("checkbox", { name: "ReviewThread prop narrow" }).check();
  await expect(reopen).toHaveCount(0);
  await expect(decision).toBeVisible();
  await expect(reply).toBeVisible();
  await expect.poll(() => thread.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.screenshot({ path: info.outputPath("review-thread-resolved.png") });

  await scenario.click();
  await page.getByRole("option", { name: "Ready", exact: true }).click();
  await reopen.click();
  await expect(state).toHaveText("Open");
  await expect(resolve).toBeFocused();
  await expect(decision).toHaveCount(0);
});
