import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("ProfileLinks keeps its destinations readable and directly reachable at narrow widths", async ({page}, info) => {
  await page.goto("/components/profile-links");
  const panel = page.locator(".preview-stage .flood-surface");
  const list = panel.getByRole("list",{name:"Profile links"});
  const links = list.getByRole("link");
  await expect(links).toHaveText(["Website","Design guides","Components"]);
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("profile-links.png")});

  await page.getByRole("checkbox",{name:"ProfileLinks prop narrow"}).check();
  await page.getByRole("checkbox",{name:"ProfileLinks prop longLabel"}).check();
  await page.getByRole("checkbox",{name:"ProfileLinks prop featured"}).uncheck();
  await chooseSelectOption(page.getByRole("combobox",{name:"ProfileLinks prop surface"}),"overlay");
  await expect(list.getByRole("link",{name:"Design patterns and implementation guides"})).toBeVisible();
  const geometry = await list.evaluate(node => {
    const linkRects = [...node.querySelectorAll("a")].map(link => link.getBoundingClientRect());
    return {rows:new Set(linkRects.map(rect => rect.top)).size, overflow:node.scrollWidth-node.clientWidth};
  });
  expect(geometry.rows).toBeGreaterThan(1);
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  await links.first().focus();
  await page.keyboard.press("Tab");
  await expect(links.nth(1)).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(links.last()).toBeFocused();
  await panel.screenshot({path:info.outputPath("profile-links-narrow.png")});
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/components\/?$/);
});
