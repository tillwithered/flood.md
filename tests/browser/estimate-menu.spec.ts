import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("EstimateMenu distinguishes zero, unestimated and estimates outside the current scale", async ({page}, info) => {
  await page.goto("/components/estimate-menu");
  const stage = page.locator(".preview-stage");
  const surface = stage.locator(".flood-surface");
  const trigger = surface.getByRole("button",{name:/^Estimate:/});
  const menu = page.getByRole("menu",{name:"Estimate",exact:true});
  const select = (name: string) => menu.getByRole("menuitemradio",{name,exact:true});
  await expect(trigger).toHaveAccessibleName("Estimate: 3 points");
  await page.evaluate(() => document.fonts.ready);
  await surface.screenshot({path:info.outputPath("estimate-menu.png"),animations:"disabled"});

  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(select("3 points")).toHaveAttribute("aria-checked","true");
  await select("0 points").focus();
  await page.keyboard.press("Enter");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAccessibleName("Estimate: 0 points");
  await expect(trigger).toHaveText("0");
  await trigger.click();
  await expect(select("No estimate")).toHaveAttribute("aria-checked","false");
  await expect(select("0 points")).toHaveAttribute("aria-checked","true");
  await page.keyboard.press("Escape");

  await chooseSelectOption(page.getByRole("combobox",{name:"EstimateMenu prop scale"}),"Sizes");
  await page.getByRole("checkbox",{name:"EstimateMenu prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox",{name:"EstimateMenu prop surface"}),"overlay");
  await expect(trigger).toHaveAccessibleName("Estimate: 0 points");
  await trigger.click();
  await expect(menu.getByRole("menuitemradio",{checked:true})).toHaveCount(0);
  await expect(select("Medium")).toBeVisible();
  const row = (await surface.boundingBox())!;
  const popup = (await menu.boundingBox())!;
  const x = Math.min(row.x,popup.x);
  const y = Math.min(row.y,popup.y);
  await page.screenshot({
    path:info.outputPath("estimate-menu-narrow.png"),animations:"disabled",
    clip:{x,y,width:Math.max(row.x + row.width,popup.x + popup.width) - x,
      height:Math.max(row.y + row.height,popup.y + popup.height) - y},
  });
  await select("Medium").click();
  await expect(trigger).toHaveAccessibleName("Estimate: Medium");
  await expect(trigger).toHaveText("M");

  const accept = page.getByRole("checkbox",{name:"EstimateMenu prop accept"});
  await accept.uncheck();
  await trigger.click();
  await select("No estimate").click();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAccessibleName("Estimate: Medium");
  await accept.check();
  await trigger.click();
  await select("No estimate").click();
  await expect(trigger).toHaveAccessibleName("Estimate: No estimate");
  await trigger.click();
  await expect(select("No estimate")).toHaveAttribute("aria-checked","true");
  await page.keyboard.press("Escape");
  await page.getByRole("checkbox",{name:"EstimateMenu prop disabled"}).check();
  await expect(trigger).toBeDisabled();
});
