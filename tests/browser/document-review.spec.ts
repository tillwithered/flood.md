import { test, expect } from "@playwright/test";

test("a tracked replacement and its discussion stay linked", async ({ page }, info) => {
  await page.goto("/playground/document-review");
  const main = page.getByRole("main");
  const change = main.locator(".flood-text-revision");
  await expect(change.locator("del")).toContainText("with the project lead");
  await expect(change.locator("ins")).toContainText("with the project team");
  await page.getByRole("button", { name: "Go to text" }).press("Enter");
  await expect(change).toBeFocused();
  await expect(change).toHaveAttribute("data-active", "true");
  await page.evaluate(() => document.fonts.ready);
  await main.screenshot({ path: info.outputPath("document-review-pending.png") });

  const draft = page.getByRole("textbox", { name: "Reply to handoff discussion" });
  await draft.fill("I'll share the notes after approval.");
  await page.getByRole("button", { name: "Resolve discussion", exact: true }).click();
  await expect(change).toHaveAttribute("data-state", "pending");
  await page.getByRole("button", { name: "Reopen discussion", exact: true }).click();
  await expect(draft).toHaveValue("I'll share the notes after approval.");
  await page.getByRole("button", { name: "Reply", exact: true }).click();
  await expect(page.getByRole("list", { name: "Handoff discussion" })).toContainText("I'll share the notes");
  await page.getByRole("button", { name: "Accept revision" }).press("Enter");
  await expect(change).toHaveText("with the project team");
  await expect(change).toBeFocused();
  await expect(page.getByRole("button", { name: "Reopen discussion", exact: true })).toBeVisible();
});

test("a rejected revision restores the original text and detached threads can reopen", async ({ page }) => {
  await page.goto("/playground/document-review");
  await page.getByRole("button", { name: "Earlier discussion" }).click();
  await expect(page.getByText("The original text was removed.")).toBeVisible();
  await page.getByRole("button", { name: "Reopen reminder discussion" }).click();
  await expect(page.getByRole("button", { name: "Resolve reminder discussion" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Reminder discussion" })).toContainText("remove the old reminder");
  await page.getByRole("button", { name: "Reject revision" }).click();
  await expect(page.locator(".flood-text-revision")).toHaveText("with the project lead");
  await expect(page.getByRole("status")).toHaveText("Revision rejected");
});

test("inline annotations keep their destination and original text after resolution", async ({ page }) => {
  await page.goto("/playground/document-review");
  const annotation = page.getByRole("link", { name: "the next release", exact: true });
  const thread = page.getByRole("region", { name: "Source file retention" });
  await expect(annotation).toHaveAccessibleDescription("Open discussion");
  await annotation.press("Enter");
  await expect(page).toHaveURL(/#retention-discussion$/);
  await expect(thread).toBeFocused();
  await expect(thread.getByRole("list", { name: "Retention discussion" })).toBeVisible();
  await thread.getByRole("button", { name: "Resolve retention discussion" }).click();
  await expect(annotation).toHaveAccessibleDescription("Resolved discussion");
  await thread.getByRole("link", { name: "Back to source text" }).press("Enter");
  await expect(annotation).toBeFocused();
  await expect(annotation).toHaveText("the next release");
  await annotation.press("Enter");
  await expect(thread.getByRole("button", { name: "Reopen retention discussion" })).toBeVisible();
});

test("a long annotation follows the line breaks without shifting text on resolution", async ({ page }) => {
  await page.goto("/components/text-annotation");
  await page.getByRole("checkbox", { name: "TextAnnotation prop constrainWidth" }).check();
  const annotation = page.getByRole("link", { name: "the next scheduled release is available" });
  const rows = () => annotation.evaluate(link => Array.from(link.getClientRects(), rect => [rect.x, rect.y, rect.width, rect.height]));
  const before = await rows();
  expect(before.length).toBeGreaterThan(1);
  await page.getByRole("checkbox", { name: "TextAnnotation prop resolved" }).check();
  expect(await rows()).toEqual(before);
  await expect(annotation).toHaveCSS("text-decoration-style", "dotted");
});
