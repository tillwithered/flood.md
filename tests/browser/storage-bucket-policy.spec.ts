import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("StorageBucketPolicy separates read access, effective upload limits and missing data", async ({page}, info) => {
  await page.goto("/components/storage-bucket-policy");
  const stage = page.locator(".preview-stage");
  const policy = stage.locator("dl[aria-label='Bucket policy']");
  const value = (label: string) => policy.locator("dt").filter({hasText:label}).locator("+ dd");
  const scenario = page.getByRole("combobox", {name:"Scenario",exact:true});

  await expect(value("Read access")).toContainText("Anyone with a file link can read it.");
  await expect(value("Max file size")).toHaveText("8 MB");
  await expect(value("Allowed types").locator("code")).toHaveText(["image/png","image/webp","image/svg+xml"]);
  await page.evaluate(() => document.fonts.ready);
  await stage.locator(".flood-surface").screenshot({path:info.outputPath("storage-bucket-policy.png")});

  await page.getByRole("checkbox", {name:"StorageBucketPolicy prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox", {name:"StorageBucketPolicy prop surface"}), "overlay");
  await expect.poll(() => policy.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.locator(".flood-surface").screenshot({path:info.outputPath("storage-bucket-policy-narrow.png")});

  await chooseSelectOption(scenario, "Private uploads");
  await expect(value("Read access")).toContainText("Read access is restricted.");
  await expect(value("Max file size")).toContainText("25 MB");
  await expect(value("Max file size")).toContainText("Project limit");
  await expect(value("Allowed types")).toHaveText("Any file type");
  await chooseSelectOption(scenario, "Unknown");
  await expect(policy.locator("dd")).toHaveText(["Unknown","Unknown","Unknown"]);
});
