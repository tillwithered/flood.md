import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("IdentityVerificationBadge discloses issuers and omits an unsupported mark", async ({ page }, info) => {
  await page.goto("/components/identity-verification-badge");
  const stage = page.locator(".preview-stage");
  const trigger = stage.getByRole("button", { name: "Maya Chen’s verified identity" });
  const disclosure = page.getByRole("dialog", { name: "Verified by", exact: true });
  const evidence = page.getByRole("combobox", { name: "IdentityVerificationBadge prop evidence", exact: true });

  if (info.project.name === "mobile") {
    await chooseSelectOption(page.getByRole("combobox", { name: "IdentityVerificationBadge prop surface", exact: true }), "overlay");
  }
  await expect(stage.getByText("@maya.northstar.news")).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("identity-verification-badge.png"), animations: "disabled" });

  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(disclosure).toBeVisible();
  const list = disclosure.getByRole("list", { name: "Verified by" });
  await expect(list.getByRole("listitem")).toHaveCount(2);
  const issuer = list.getByRole("link", { name: "Independent Press Guild" });
  await expect(issuer).toHaveAttribute("href", "/components/citation");
  await expect(issuer).toBeFocused();
  await expect.poll(() => issuer.evaluate(node => node.parentElement!.clientWidth - node.getBoundingClientRect().width))
    .toBeGreaterThan(0);
  await expect(list.getByText("Northstar Newsroom", { exact: true })).toBeVisible();
  const bounds = await disclosure.boundingBox();
  expect(bounds?.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({ path: info.outputPath("identity-verification-issuers.png"), animations: "disabled" });
  await page.keyboard.press("Escape");
  await expect(disclosure).toBeHidden();
  await expect(trigger).toBeFocused();

  await chooseSelectOption(evidence, "Single issuer");
  await trigger.click();
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await chooseSelectOption(evidence, "No evidence");
  await expect(trigger).toHaveCount(0);
  await expect(stage.getByText("Maya Chen", { exact: true })).toBeVisible();
});
