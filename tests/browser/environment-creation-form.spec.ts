import {expect, test} from "@playwright/test";
import {chooseSelectOption, selectBridge} from "./select-helpers";

test("EnvironmentCreationForm preserves its draft and submits only an eligible source in duplicate mode", async ({page}, info) => {
  await page.goto("/components/environment-creation-form");
  const panel = page.locator(".preview-stage .flood-surface");
  const form = panel.getByRole("form",{name:"New environment"});
  const name = form.getByRole("textbox",{name:"Environment name"});
  const setup = form.getByRole("combobox",{name:"Starting point"});
  const source = form.getByRole("combobox",{name:"Source environment"});
  const submit = form.getByRole("button",{name:"Create environment"});
  const scenario = page.getByRole("combobox",{name:"Scenario",exact:true});
  await expect(selectBridge(source)).toHaveValue("staging");
  await expect(source).toHaveAccessibleDescription(/Databases start empty/);
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("environment-creation-form.png"),animations:"disabled"});

  await chooseSelectOption(scenario,"Source removed");
  await expect(selectBridge(source)).toHaveValue("");
  await expect(submit).toBeDisabled();
  await source.click();
  await expect(page.getByRole("option",{name:/Production.*Restricted by project policy/})).toHaveAttribute("aria-disabled","true");
  await page.keyboard.press("Escape");
  await chooseSelectOption(source,"testing");
  await expect(source).toHaveAccessibleDescription(/Copies 2 services/);
  await name.fill("Review workspace");
  await chooseSelectOption(setup,"empty");
  await expect(source).toHaveCount(0);
  await submit.click();
  await expect(panel.getByRole("status")).toHaveText("Review workspace");
  await chooseSelectOption(setup,"duplicate");
  await expect(selectBridge(source)).toHaveValue("testing");
  await submit.click();
  await expect(panel.getByRole("status")).toHaveText("Review workspace · testing");

  await page.getByRole("checkbox",{name:"EnvironmentCreationForm prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox",{name:"EnvironmentCreationForm prop surface"}),"overlay");
  await page.getByRole("checkbox",{name:"EnvironmentCreationForm prop fail"}).check();
  await submit.click();
  await expect(form.getByRole("alert")).toHaveText("An environment with this name already exists.");
  await expect(name).toHaveValue("Review workspace");
  await expect(selectBridge(source)).toHaveValue("testing");
  expect(await panel.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("environment-creation-form-narrow.png"),animations:"disabled"});

  await page.getByRole("checkbox",{name:"EnvironmentCreationForm prop pending"}).check();
  await expect(form).toHaveAttribute("aria-busy","true");
  await expect(name).toHaveAttribute("readonly","");
  await expect(source).toBeDisabled();
  await page.getByRole("checkbox",{name:"EnvironmentCreationForm prop pending"}).uncheck();
  await chooseSelectOption(scenario,"No sources");
  await expect(source).toBeDisabled();
  await expect(form.getByText("No environments are available to duplicate.")).toBeVisible();
  await expect(submit).toBeDisabled();
});
