import {expect, test} from "@playwright/test";

test("status chips share Badge geometry and expose a clipped label", async ({page}, info) => {
  await page.goto("/components/status-indicator");
  await page.getByRole("combobox", {name: "StatusIndicator prop tone"}).click();
  await page.getByRole("option", {name: "success", exact:true}).click();
  await page.getByRole("combobox", {name: "StatusIndicator prop presentation"}).click();
  await page.getByRole("option", {name: "chip", exact:true}).click();
  await page.getByRole("checkbox", {name: "StatusIndicator prop showPeers"}).check();
  const preview = page.getByRole("region", {name: "Preview canvas"});
  const chip = preview.locator(".flood-status-indicator");
  const badge = preview.locator(".flood-badge").filter({hasText:"Platform"});
  await expect(chip).toHaveClass(/flood-badge/);
  const [chipBox, badgeBox] = await Promise.all([chip.boundingBox(), badge.boundingBox()]);
  expect(chipBox!.height).toBeCloseTo(badgeBox!.height, 0);
  await expect(chip).not.toHaveAttribute("tabindex", "0");
  await page.getByRole("checkbox", {name: "StatusIndicator prop constrainWidth"}).check();
  await expect(chip).toHaveAttribute("tabindex", "0");
  await chip.focus();
  await expect(page.getByRole("tooltip")).toHaveText("All systems operational");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();
  await page.getByRole("checkbox", {name: "StatusIndicator prop constrainWidth"}).uncheck();
  await preview.locator(".flood-inline").first().screenshot({path:info.outputPath("status-family.png"), animations:"disabled"});
});
