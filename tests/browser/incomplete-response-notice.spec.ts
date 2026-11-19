import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("IncompleteResponseNotice distinguishes partial text, empty output and recovery", async ({page}, info) => {
  await page.goto("/components/incomplete-response-notice");
  const stage = page.locator(".preview-stage");
  const scenario = page.getByRole("combobox", {name:"Scenario",exact:true});
  const partial = stage.getByText(/Two suppliers match the request/);
  const recovery = stage.getByRole("link", {name:"Review usage"});
  const surface = stage.locator(".flood-surface");

  await expect(partial).toBeVisible();
  await expect(stage.getByText("Response incomplete",{exact:true})).toBeVisible();
  await expect(stage.getByText("Output limit reached.")).toBeVisible();
  await expect(recovery).toHaveAttribute("href","/components/token-usage-breakdown");
  await page.evaluate(() => document.fonts.ready);
  await surface.screenshot({path:info.outputPath("incomplete-response-notice.png")});

  await page.getByRole("checkbox", {name:"IncompleteResponseNotice prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox", {name:"IncompleteResponseNotice prop surface"}),"overlay");
  await expect.poll(() => surface.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await surface.screenshot({path:info.outputPath("incomplete-response-notice-narrow.png")});
  await chooseSelectOption(scenario,"No output");
  await expect(partial).toHaveCount(0);
  await expect(stage.getByText("No response text",{exact:true})).toBeVisible();
  await expect(recovery).toBeVisible();
  await chooseSelectOption(scenario,"Filtered");
  await expect(stage.getByText("Stopped by a content filter.")).toBeVisible();
  await expect(recovery).toHaveCount(0);
  await chooseSelectOption(scenario,"Unknown");
  await expect(stage.getByText("No response text",{exact:true})).toBeVisible();
  await expect(stage.getByText(/output limit|content filter/i)).toHaveCount(0);
});
