import { expect, test } from "@playwright/test";
import { chooseSelectOption, chooseStudioSheetOption } from "./select-helpers";

test("validates a decision note and transfers focus to the recorded result", async ({ page }) => {
  await page.goto("/components/approval-request");
  const request = page.getByRole("region", { name: "Renew Northstar Analytics", exact: true });
  const submit = request.getByRole("button", { name: "Submit decision" });
  await expect(submit).toBeDisabled();

  const approve = request.getByRole("radio", { name: "Approve", exact: true });
  const changes = request.getByRole("radio", { name: "Request changes", exact: true });
  await approve.focus();
  await approve.press("ArrowDown");
  await expect(changes).toBeChecked();
  await expect(changes).toHaveAccessibleDescription("Return the request to its owner for edits.");

  const note = request.getByRole("textbox", { name: "What needs to change?" });
  await note.fill("   ");
  await submit.click();
  await expect(note).toBeFocused();
  await expect(note).toHaveAttribute("aria-invalid", "true");
  await expect(request.getByRole("alert")).toHaveText("Describe the change you need.");

  await note.fill("Attach the signed quote.");
  await submit.press("Enter");
  const result = request.locator(".flood-approval-request__result");
  await expect(result).toHaveText("Request returned to Maya.");
  await expect(result).toBeFocused();
  await expect(request.getByText("$18,400", { exact: true })).toBeVisible();
  await expect(request.getByRole("radiogroup")).toHaveCount(0);
});

test("preserves the reviewer draft across a pending and failed operation", async ({ page }) => {
  await page.goto("/components/approval-request");
  const request = page.getByRole("region", { name: "Renew Northstar Analytics", exact: true });
  const choices = request.getByRole("radiogroup");
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  const submit = request.getByRole("button", { name: "Submit decision" });
  const decline = choices.getByRole("radio", { name: "Decline", exact: true });
  await page.getByRole("checkbox", { name: "ApprovalRequest prop showRoute" }).check();
  const route = request.getByRole("list", { name: "Approval route" });
  await expect(route).toContainText("Awaiting review");
  await decline.check();
  const note = request.getByRole("textbox", { name: "Reason for declining" });
  await note.fill("The department retired this service.");

  await chooseSelectOption(scenario, "submitting");
  await expect(submit).toHaveAttribute("aria-busy", "true");
  await expect(submit).toBeDisabled();
  await expect(decline).toBeDisabled();
  await expect(note).toBeDisabled();

  await chooseSelectOption(scenario, "error");
  await expect(request.getByRole("alert")).toHaveText("The decision could not be recorded. Try again.");
  await expect(route).toContainText("Awaiting review");
  await expect(decline).toBeChecked();
  await expect(note).toHaveValue("The department retired this service.");
  await submit.click();
  await expect(request.getByText("Renewal declined.", { exact: true })).toBeVisible();
  await expect(route).toContainText("Rejected");
});

test("uses one decision track and keeps evidence reachable as width changes", async ({ page }) => {
  await page.goto("/components/approval-request");
  const request = page.getByRole("region", { name: "Renew Northstar Analytics", exact: true });
  const rows = request.locator(".flood-approval-request__choice");
  await expect(rows).toHaveCount(3);

  for (const narrow of [false, true]) {
    if (narrow) await page.getByRole("checkbox", { name: "ApprovalRequest prop narrow", exact: true }).check();
    const first = await rows.nth(0).boundingBox();
    const second = await rows.nth(1).boundingBox();
    const third = await rows.nth(2).boundingBox();
    expect(second!.x).toBeCloseTo(first!.x, 0);
    expect(third!.x).toBeCloseTo(second!.x, 0);
    expect(second!.y).toBeGreaterThan(first!.y + first!.height);
    expect(third!.y).toBeGreaterThan(second!.y + second!.height);
    expect(await request.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
    await expect(request.getByText("$18,400", { exact: true })).toBeVisible();
  }
});

test("approval routes show independent reviewer outcomes and retain context in a drawer", async ({ page }) => {
  await page.goto("/components/approval-chain");
  const route = page.getByRole("list", { name: "Approval route" });
  const finance = route.locator(":scope > li").nth(1);
  await expect(route.locator(":scope > li")).toHaveCount(3);
  await expect(finance).toContainText("Covering for Alex Morgan");
  await expect(finance.getByRole("listitem").filter({ hasText: "Leah Brooks" })).toContainText("Approved");
  await expect(route.locator(":scope > li").last()).toContainText("Queued");

  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  await chooseSelectOption(scenario, "changes requested");
  await expect(finance).toContainText("Changes requested");
  await expect(finance).toContainText("Attach the itemized renewal quote.");
  expect(await route.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);

  await page.getByRole("checkbox", { name: "ApprovalChain prop inDrawer" }).check();
  const trigger = page.getByRole("button", { name: "View approval route" });
  await trigger.click();
  const drawer = page.getByRole("dialog", { name: "Renew Northstar Analytics" });
  await expect(drawer.getByRole("list", { name: "Approval route" })).toContainText("Covering for Alex Morgan");
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("ApprovalChain shows the host threshold alongside independent decisions", async ({page}, info) => {
  await page.goto("/components/approval-chain");
  const route = page.getByRole("list",{name:"Approval route",exact:true});
  const stage = route.locator(":scope > li").nth(1);
  const count = stage.locator(".flood-approval-chain__count");
  const scenario = page.getByRole("combobox",{name:/^Scenario$|^ApprovalChain prop scenario$/});
  async function setScenario(next:string) {
    if (await scenario.isVisible()) await chooseSelectOption(scenario,next);
    else await chooseStudioSheetOption(page,"Scenario",next);
  }
  await expect(count).toHaveText("1 of 2 approvals");
  await expect(stage).toContainText("Covering for Alex Morgan");
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:info.outputPath("approval-chain-count.png")});

  await setScenario("changes requested");
  await expect(count).toHaveText("1 of 2 approvals");
  await expect(stage).toContainText("Attach the itemized renewal quote.");
  await setScenario("approved");
  await expect(count).toHaveText("2 of 2 approvals");
  await expect(stage).toContainText("Approved");

  const showCount = page.getByRole("checkbox",{name:/^Show approval count$|^ApprovalChain prop requirement$/});
  await showCount.uncheck();
  await expect(count).toHaveCount(0);
  await expect(stage).toContainText("Leah Brooks");

  await showCount.check();
  await page.getByRole("checkbox",{name:/^In Drawer$|^ApprovalChain prop inDrawer$/i}).check();
  const trigger = page.getByRole("button",{name:"View approval route"});
  await trigger.click();
  const drawer = page.getByRole("dialog",{name:"Renew Northstar Analytics"});
  await expect(drawer.getByText("2 of 2 approvals",{exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath("approval-chain-drawer.png"),animations:"disabled"});
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});
