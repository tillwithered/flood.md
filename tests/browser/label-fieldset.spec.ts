import { test, expect } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("standalone Label focuses its control and its marker preserves native required", async ({ page }) => {
  await page.goto("/components/label");
  const stage = page.locator(".preview-stage"), input = stage.getByRole("textbox", { name: "Project name" });
  await stage.locator("label").click();
  await expect(input).toBeFocused();
  await page.getByRole("checkbox", { name: "Label prop required", exact: true }).check();
  await expect(input).toHaveAttribute("required", "");
  await input.fill("");
  expect(await input.evaluate(node => (node as HTMLInputElement).validity.valueMissing)).toBe(true);
});

test("native Fieldset groups names, disables descendants and retains selection and form behavior", async ({ page }, info) => {
  await page.goto("/components/fieldset");
  const group = page.locator(".preview-stage").getByRole("group", { name: "Notifications" });
  const first = group.getByRole("checkbox", { name: "Product updates", exact: true });
  const second = group.getByRole("checkbox", { name: "Release notes", exact: true });
  const formData = () => group.evaluate(node => {
    const form = document.createElement("form"); form.id = "test-settings"; node.before(form);
    node.querySelectorAll("input").forEach(input => input.setAttribute("form", form.id));
    const result = [...new FormData(form).entries()];
    node.querySelectorAll("input").forEach(input => input.removeAttribute("form")); form.remove(); return result;
  });
  await expect(first).toBeChecked();
  expect(await formData()).toEqual([["updates", "on"]]);
  await second.focus(); await page.keyboard.press("Space");
  await expect(second).toBeChecked();
  await page.getByRole("checkbox", { name: "Fieldset prop disabled", exact: true }).check();
  await expect(first).toBeDisabled(); await expect(second).toBeDisabled();
  expect(await formData()).toEqual([]);
  await page.getByRole("checkbox", { name: "Fieldset prop disabled", exact: true }).uncheck();
  await expect(second).toBeChecked();
  expect(await formData()).toEqual([["updates", "on"], ["releases", "on"]]);
  const position = async () => (await first.boundingBox())!.y - (await page.locator(".preview-stage").boundingBox())!.y;
  const before = await position();
  await chooseSelectOption(page.getByRole("combobox", { name: "Fieldset prop status", exact: true }), "warning");
  expect(await position()).toBeCloseTo(before, 1);
  await expect(group).toHaveAttribute("data-status", "warning");
  await expect(group).toHaveAttribute("aria-describedby", /-hint .*?-message/);
  await expect(group).not.toHaveAttribute("aria-invalid", "true");
  await page.getByRole("checkbox", { name: "Fieldset prop hint", exact: true }).uncheck();
  expect(await position()).toBeCloseTo(before, 1);
  await page.screenshot({ path: `.artifacts/fieldset-${info.project.name}.png` });
});
