import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("duration keeps a shared unit and distinguishes low measurements from zero", async ({page}, info) => {
  await page.goto("/components/duration");
  const table = page.getByRole("table", {name:"Query timings"});
  const stage = page.locator(".preview-stage");
  const values = table.locator("data");
  await expect(values).toHaveText(["2,107.797 ms","< 0.001 ms","0 ms"]);
  await expect(values.nth(0)).toHaveAttribute("value", "2107.797");
  await expect(values.nth(1)).toHaveAttribute("value", "0.0004");
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({path:info.outputPath("duration.png")});

  await chooseSelectOption(page.getByRole("combobox", {name:"Duration prop unit"}), "second");
  await chooseSelectOption(page.getByRole("combobox", {name:"Duration prop locale"}), "fr-FR");
  await chooseSelectOption(page.getByRole("combobox", {name:"Duration prop surface"}), "overlay");
  await page.getByRole("checkbox", {name:"Duration prop narrow"}).check();
  await expect(values).toHaveText(["2,108 s","< 0,001 s","0 s"]);
  await expect(values.nth(0)).toHaveAttribute("value", "2107.797");
  await expect.poll(() => table.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.screenshot({path:info.outputPath("duration-mobile.png")});
});
