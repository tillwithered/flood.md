import {expect, test} from "@playwright/test";

test("a paused scheduled task keeps its trigger and loses only its next execution", async ({page}) => {
  await page.goto("/components/scheduled-task-list");
  const list = page.getByRole("list", {name:"Scheduled tasks",exact:true});
  const digest = list.getByRole("listitem").filter({hasText:"Weekly release digest"});
  const builds = list.getByRole("listitem").filter({hasText:"Summarize failed builds"});
  const report = list.getByRole("listitem").filter({hasText:"Export the November report"});
  await expect(digest.locator('time[datetime="2026-11-23T09:00:00Z"]')).toBeVisible();
  await expect(builds).toContainText("When a build fails");
  await expect(builds.locator("time")).toHaveCount(0);
  await expect(report.locator("time")).toHaveCount(0);
  const pause = digest.getByRole("button", {name:"Pause",exact:true});
  await pause.focus();
  await page.keyboard.press("Enter");
  await expect(digest.locator(".flood-status-indicator__label")).toHaveText("Paused");
  await expect(digest.locator("time")).toHaveCount(0);
  await expect(digest).toContainText("Mondays at 09:00 UTC");
  await expect(digest.getByRole("button", {name:"Resume",exact:true})).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(digest.locator(".flood-status-indicator__label")).toHaveText("Active");
  await expect(digest.locator("time")).toBeVisible();
  await expect(pause).toBeFocused();
});
