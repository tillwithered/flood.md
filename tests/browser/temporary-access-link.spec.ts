import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("TemporaryAccessLink copies the full address only before its expiry", async ({page}, info) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {value:{
      writeText: async (address: string) => { sessionStorage.setItem("copied-link", address); },
    }});
  });
  await page.goto("/components/temporary-access-link");
  const stage = page.locator(".preview-stage");
  const group = stage.getByRole("group", {name:"November reconciliation.csv"});
  const scenario = page.getByRole("combobox", {name:"Scenario",exact:true});
  const copy = stage.getByRole("button", {name:"Copy link",exact:true});
  await expect(group.getByText(/Expires in 30 min/).filter({visible:true})).toBeVisible();
  await expect(group.locator("time")).toHaveAttribute("datetime","2026-11-17T09:30:00Z");
  await expect(group).not.toContainText("token=preview");
  await page.evaluate(() => document.fonts.ready);
  const surface = stage.locator(".flood-surface");
  await surface.screenshot({path:info.outputPath("temporary-access-link.png")});

  await copy.press("Enter");
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("copied-link")))
    .toBe("https://files.example/reconciliation?token=preview");
  await page.evaluate(() => sessionStorage.removeItem("copied-link"));
  await chooseSelectOption(scenario, "Expired");
  await expect(group.getByText("Expired",{exact:true}).filter({visible:true})).toBeVisible();
  await expect(copy).toBeDisabled();
  await copy.press("Enter");
  expect(await page.evaluate(() => sessionStorage.getItem("copied-link"))).toBeNull();

  await chooseSelectOption(page.getByRole("combobox", {name:"TemporaryAccessLink prop access"}), "upload");
  await page.getByRole("checkbox", {name:"TemporaryAccessLink prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox", {name:"TemporaryAccessLink prop surface"}), "overlay");
  await chooseSelectOption(scenario, "Expiring");
  await expect(stage.getByText("Anyone with the link can upload to this destination.")).toBeVisible();
  await expect(stage.getByText(/Expires in 2 min/).filter({visible:true})).toBeVisible();
  await expect.poll(() => surface.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await surface.screenshot({path:info.outputPath("temporary-access-link-narrow.png")});
  await chooseSelectOption(scenario, "Unavailable");
  await expect(stage.getByText("The link has been revoked.")).toBeVisible();
  await expect(stage.locator("time")).toHaveCount(0);
  await expect(copy).toBeDisabled();
});
