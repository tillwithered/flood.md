import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("CidrField validates native submissions and retains the address as entered", async ({ page }, info) => {
  await page.goto("/components/cidr-field");
  const stage = page.locator(".preview-stage");
  const field = stage.getByRole("textbox", { name: "IP range" });
  const add = stage.getByRole("button", { name: "Add range" });
  const list = stage.getByRole("list", { name: "Allowed network ranges" });

  const examples = [
    ["0.0.0.0/0", true],
    ["203.0.113.24/32", true],
    ["203.0.113.24/33", false],
    ["256.0.0.1/24", false],
    ["010.0.0.1/24", false],
    ["203.0.113.24", false],
    ["FFFF:1:2:3:4:5:6:7/128", true],
    ["2001:DB8::/32", true],
    ["::ffff:192.0.2.1/128", true],
    ["1:2:3:4:5:6:192.0.2.1/128", true],
    ["::/0", true],
    ["::1/129", false],
    ["1::2::3/64", false],
    ["1:2:3:4::5:6:7:8/64", false],
    ["fe80::1%en0/64", false],
    ["[2001:db8::1]/64", false],
  ] as const;
  for (const [example, valid] of examples) {
    await field.fill(example);
    expect(await field.evaluate((input: HTMLInputElement) => input.validity.valid), example).toBe(valid);
  }

  await add.click();
  const error = stage.getByRole("alert");
  await expect(error).toContainText("address with a prefix length");
  await expect(field).toHaveAttribute("aria-invalid", "true");
  await expect(list).toHaveCount(0);
  await field.fill("2001:DB8::/32");
  await expect(error).toHaveCount(0);
  await field.press("Enter");
  await expect(field).toHaveValue("");
  await expect(field).toBeFocused();
  await expect(list.getByText("2001:DB8::/32", { exact: true })).toBeVisible();
  await field.press("Enter");
  await expect(error).toHaveText("Enter an IP range.");
  await field.fill("2001:DB8::/32");
  await field.press("Enter");
  await expect(error).toHaveText("This range is already in the list.");
  await expect(list.getByRole("listitem")).toHaveCount(1);

  await chooseSelectOption(page.getByRole("combobox", { name: "CidrField prop familyMode" }), "IPv4");
  await field.fill("2001:DB8::/48");
  await add.focus();
  await expect(error).toContainText("Enter an IPv4 address");
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "CidrField prop rtl" }).check();
    await expect(field).toHaveCSS("direction", "ltr");
  }
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("cidr-field.png") });

  await field.fill("198.51.100.0/24");
  await field.press("Enter");
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await page.getByRole("checkbox", { name: "CidrField prop disabled" }).check();
  await expect(field).toBeDisabled();
  await expect(add).toBeDisabled();
});
