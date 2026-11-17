import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("HandleField submits the full address and discards availability for old drafts", async ({page}, info) => {
  await page.goto("/components/handle-field");
  const panel = page.locator(".preview-stage .flood-surface");
  const form = panel.getByRole("form",{name:"Profile identity"});
  const field = form.getByRole("textbox",{name:"Handle"});
  const scenario = page.getByRole("combobox",{name:"Scenario",exact:true});
  const mode = page.getByRole("combobox",{name:"HandleField prop mode"});
  const submitted = () => form.evaluate(node => new FormData(node as HTMLFormElement).get("handle"));

  await expect(field).toHaveValue("maya");
  await expect(field).toHaveAccessibleDescription(/\.studio\.example/);
  await expect(form.getByRole("status")).toHaveText("Available");
  expect(await submitted()).toBe("maya.studio.example");
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("handle-field.png"),animations:"disabled"});

  await field.fill("sam");
  await expect(form.getByRole("status")).toHaveCount(0);
  await expect(field).toBeFocused();
  await chooseSelectOption(scenario,"Unavailable");
  await expect(form.getByRole("alert")).toHaveCount(0);
  await field.fill("maya");
  await expect(form.getByRole("alert")).toHaveText("This handle is already in use.");
  await expect(field).toHaveAttribute("aria-invalid","true");
  await field.fill("");
  expect(await submitted()).toBe("");
  expect(await field.evaluate(node => (node as HTMLInputElement).validity.valueMissing)).toBe(true);

  await chooseSelectOption(mode,"Own domain");
  await expect(field).toHaveValue("maya.example");
  await field.fill("my-domain.example");
  expect(await submitted()).toBe("my-domain.example");
  await expect(form.getByRole("alert")).toHaveCount(0);
  await chooseSelectOption(mode,"Hosted");
  await expect(field).toHaveValue("");
  await field.fill("maya");
  await chooseSelectOption(scenario,"Checking");
  await expect(form.getByRole("status")).toHaveText("Checking availability…");

  await chooseSelectOption(scenario,"Long domain");
  await page.getByRole("checkbox",{name:"HandleField prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox",{name:"HandleField prop surface"}),"overlay");
  const suffix = form.locator(".flood-truncated-text");
  await expect(suffix).toHaveAttribute("tabindex","0");
  expect(await panel.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("handle-field-narrow.png"),animations:"disabled"});
  await suffix.focus();
  await expect(page.getByRole("tooltip")).toHaveText(".design-references.international-workspace.example");
  await page.keyboard.press("Escape");
  await page.getByRole("checkbox",{name:"HandleField prop disabled"}).check();
  await expect(field).toBeDisabled();
  expect(await submitted()).toBeNull();
});
