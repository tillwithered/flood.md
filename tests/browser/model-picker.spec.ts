import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("ModelPicker preserves provider identity and explains blocked choices", async ({page}, info) => {
  await page.goto("/components/model-picker");
  const panel = page.locator(".preview-stage .flood-surface");
  const form = panel.getByRole("form",{name:"Run settings"});
  const picker = form.getByRole("combobox",{name:"Model"});
  const models = page.getByRole("listbox",{name:"Models"});
  const catalog = page.getByRole("combobox",{name:"ModelPicker prop catalog"});
  const selected = () => form.evaluate(node => new FormData(node as HTMLFormElement).get("model"));

  await expect(picker).toHaveValue("Core · Northstar");
  await form.getByRole("button",{name:"Show models"}).click();
  const northstar = models.getByRole("group",{name:"Northstar"});
  const meridian = models.getByRole("group",{name:"Meridian"});
  await expect(northstar.getByRole("option",{name:/Core/})).toBeVisible();
  await expect(meridian.getByRole("option",{name:/Core/})).toBeVisible();
  const blocked = meridian.getByRole("option",{name:/Review/});
  await expect(blocked).toHaveAttribute("aria-disabled","true");
  await expect(blocked).toContainText("Workspace access required");
  await blocked.click({force:true});
  await expect.poll(selected).toBe("northstar-core");
  await page.evaluate(() => document.fonts.ready);
  const fieldBox = (await panel.boundingBox())!;
  const menuBox = (await models.boundingBox())!;
  const top = Math.min(fieldBox.y,menuBox.y);
  await page.screenshot({
    path:info.outputPath("model-picker.png"),animations:"disabled",
    clip:{x:fieldBox.x,y:top,width:fieldBox.width,height:Math.max(fieldBox.y+fieldBox.height,menuBox.y+menuBox.height+6)-top},
  });
  await picker.fill("meridian-core-2");
  await expect(models.getByRole("option")).toHaveCount(1);
  await picker.press("Enter");
  await expect(picker).toHaveValue("Core · Meridian");
  await expect.poll(selected).toBe("meridian-core");

  await page.getByRole("checkbox",{name:"ModelPicker prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox",{name:"ModelPicker prop surface"}),"overlay");
  await chooseSelectOption(catalog,"error");
  await expect(picker).toHaveValue("Core · Meridian");
  await form.getByRole("button",{name:"Show models"}).click();
  await expect(models.getByRole("option",{name:/could not|couldn.t|unable/i})).toBeVisible();
  await expect.poll(selected).toBe("meridian-core");
  await picker.press("Escape");
  await expect(picker).toBeFocused();
  expect(await panel.evaluate(node=>node.scrollWidth-node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("model-picker-narrow.png"),animations:"disabled"});
});
