import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("NetworkAllowlist preserves an exact range and distinguishes the host's network modes", async ({ page, context }, info) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/components/network-allowlist");
  const stage = page.locator(".preview-stage");
  const list = stage.getByRole("list", { name: "Allowed network ranges" });
  const mode = stage.locator(".flood-status-indicator__label");
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  const cidr = "2001:db8:abcd:1234:5678:90ab:cdef:0/112";
  const copy = list.getByRole("button", { name: `Copy ${cidr}` });

  await expect(mode).toHaveText("Allowlist only");
  await expect(list.getByRole("listitem")).toHaveCount(3);
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "NetworkAllowlist prop narrow" }).check();
    await page.getByRole("checkbox", { name: "NetworkAllowlist prop rtl" }).check();
    await chooseSelectOption(page.getByRole("combobox", { name: "NetworkAllowlist prop surface" }), "overlay");
    await expect(list.getByText(cidr)).toHaveCSS("direction", "ltr");
  }
  await expect.poll(() => list.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("network-allowlist.png") });

  await copy.press("Enter");
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(cidr);
  await expect(list.getByRole("button", { name: /^Copied/ })).toBeFocused();

  await chooseSelectOption(scenario, "Empty allowlist");
  await expect(mode).toHaveText("Allowlist only");
  await expect(stage.getByText("No ranges in the allowlist.")).toBeVisible();
  await expect(list).toHaveCount(0);
  await chooseSelectOption(scenario, "All networks");
  await expect(mode).toHaveText("All networks");
  await expect(stage.getByText("No ranges in the allowlist.")).toHaveCount(0);
  await chooseSelectOption(scenario, "No networks");
  await expect(mode).toHaveText("No networks");
  await expect(list).toHaveCount(0);
});
