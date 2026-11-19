import {expect, test} from "@playwright/test";
import {chooseSelectOption, chooseStudioSheetOption} from "./select-helpers";

test("service states and missed observations remain distinct on the shared window", async ({page}) => {
  await page.goto("/components/service-availability");
  const preview = page.getByRole("region", {name:"ServiceAvailability live playground"});
  const api = preview.getByRole("list", {name:"API",exact:true});
  const builds = preview.getByRole("list", {name:"Builds",exact:true});
  const deployments = preview.getByRole("list", {name:"Deployments",exact:true});
  await expect(api.getByRole("listitem")).toHaveCount(30);
  await expect(builds.getByRole("listitem")).toHaveCount(30);
  await expect(deployments.locator('[data-status="unknown"]')).toHaveCount(3);
  await expect(api.getByRole("listitem").nth(23)).toHaveText("Nov 10. Degraded performance");
  await expect(builds.getByRole("listitem").nth(23)).toHaveText("Nov 10. Outage. Workers could not start new builds.");
  const apiEvent = await api.getByRole("listitem").nth(23).boundingBox();
  const buildEvent = await builds.getByRole("listitem").nth(23).boundingBox();
  expect(apiEvent?.x).toBe(buildEvent?.x);
  expect(apiEvent?.width).toBe(buildEvent?.width);

  await builds.locator('[tabindex="0"]').focus();
  await page.keyboard.press("Home");
  await expect(builds.getByRole("listitem").first()).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(builds.getByRole("listitem").nth(1)).toBeFocused();
  await expect(preview.locator(".flood-uptime-history__tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(preview.locator(".flood-uptime-history__tooltip")).toHaveCount(0);

  const window = preview.getByRole("combobox", {name:"ServiceAvailability prop window"});
  if (await window.isVisible()) await chooseSelectOption(window,"90");
  else await chooseStudioSheetOption(page,"Window","90");
  await expect(api.getByRole("listitem")).toHaveCount(90);
  await expect(deployments.locator('[data-status="unknown"]')).toHaveCount(3);
});
