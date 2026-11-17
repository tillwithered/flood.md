import { expect, test } from "@playwright/test";
import { chooseSelectOption, chooseStudioSheetOption } from "./select-helpers";

test("code review selects files and keeps discussions on their line and side", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 940 });
  await page.goto("/playground/code-review");
  const revision = page.getByRole("group",{name:"Review revision"});
  await expect(revision.locator(".flood-status-indicator__label")).toHaveText("Review out of date");
  await revision.getByRole("link",{name:"View current diff"}).press("Enter");
  await expect(page.locator("#review-current-diff")).toBeFocused();
  const file = page.getByRole("treeitem", { name:"projects.ts", exact:true });
  const testFile = page.getByRole("treeitem", { name:"projects.test.ts", exact:true });
  await expect(file).toHaveAttribute("aria-selected","true");
  await expect(page.getByText("1 line added, 1 line removed", { exact:true })).toHaveCount(1);
  await expect(page.getByRole("columnheader", { name:"Before", exact:true })).toHaveCSS("white-space", "nowrap");
  await page.getByRole("button", { name:"Show 4 unchanged lines", exact:true }).click();
  await expect(page.getByText("type Project = {", {exact:true})).toBeVisible();

  await page.getByRole("button", { name:"Discuss after line 9", exact:true }).click();
  await expect(page.getByText("Can we keep the previous endpoint available during the rollout?")).toBeVisible();
  const reply = page.getByRole("textbox", { name:"Comment on after line 9", exact:true });
  await reply.fill("Yes, keep both endpoints through Monday.");
  await testFile.click();
  await expect(page.getByRole("table", { name:"src/projects.test.ts", exact:true })).toBeVisible();
  await expect(page.getByText("2 lines added, 1 line removed", { exact:true })).toHaveCount(1);
  await page.getByRole("button", { name:"Discuss before line 15", exact:true }).click();
  await expect(page.getByText("Can we keep the previous endpoint available during the rollout?")).toBeHidden();

  await file.click();
  await expect(reply).toHaveValue("Yes, keep both endpoints through Monday.");
  await page.getByRole("button", { name:"Comment", exact:true }).click();
  await expect(page.getByText("Yes, keep both endpoints through Monday.")).toBeVisible();
  await page.getByRole("radio", { name:"Split", exact:true }).check();
  await expect(page.getByRole("button", { name:"Discuss after line 9", exact:true })).toHaveAttribute("aria-pressed","true");
  await expect(page.getByText("Yes, keep both endpoints through Monday.")).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  await page.locator("main").screenshot({path:info.outputPath("code-review-thread.png")});
});

test("ReviewRevision separates reviewed and current commits and exposes the relevant diff", async ({page},info) => {
  await page.goto("/components/review-revision");
  const group = page.getByRole("group",{name:"Review revision"});
  const previous = group.locator("[data-side='before']");
  const current = group.locator("[data-side='after']");
  const compare = group.getByRole("link",{name:"Compare revisions"});
  await expect(previous.getByText("Reviewed")).toBeVisible();
  await expect(current.getByText("Current")).toBeVisible();
  await expect(previous).toContainText("7c00a18daac9491e4510d868d024beaea1019b4e");
  await expect(current).toContainText("e70932645c171cabbe8d12c52ffc11dfc5d048d7");
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:info.outputPath("review-revision.png")});
  await compare.press("Enter");
  await expect(page.locator("#review-revision-diff")).toBeFocused();

  await page.getByRole("checkbox",{name:/^Narrow width$|^ReviewRevision prop narrow$/}).check();
  expect(await group.evaluate(node=>node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({path:info.outputPath("review-revision-narrow.png")});
  await page.getByRole("checkbox",{name:/^Show reviewed revision$|^ReviewRevision prop showPrevious$/}).uncheck();
  await expect(previous).toHaveCount(0);
  await expect(compare).toBeVisible();
  const state = page.getByRole("combobox",{name:/^State$|^ReviewRevision prop state$/});
  if (await state.isVisible()) await chooseSelectOption(state,"current");
  else await chooseStudioSheetOption(page,"State","current");
  await expect(group.locator(".flood-status-indicator__label")).toHaveText("Review up to date");
  await expect(current.getByText("Current")).toBeVisible();
  await expect(compare).toHaveCount(0);
});

test("diff stat keeps signed counts readable and renders the proportional mark", async ({ page }) => {
  await page.goto("/components/diff-stat");
  const stat = page.locator(".preview-stage .flood-diff-stat");
  await expect(stat).toHaveText(/128 lines added, 22 lines removed\+128−22/);
  await expect(stat).not.toHaveAttribute("tabindex");
  const distribution = stat.locator(".flood-diff-stat__distribution");
  await expect(distribution).toHaveCount(0);
  await page.getByRole("checkbox", { name:"DiffStat prop showDistribution" }).check();
  await expect(distribution).toBeVisible();
  await expect(distribution).toHaveAttribute("aria-hidden", "true");
  const widths = await distribution.locator("span").evaluateAll(parts => parts.map(part => part.getBoundingClientRect().width));
  expect(widths[0] / (widths[0] + widths[1])).toBeCloseTo(128 / 150, 2);
});
