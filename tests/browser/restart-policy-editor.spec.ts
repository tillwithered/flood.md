import {expect, test} from "@playwright/test";
import {chooseSelectOption, selectBridge} from "./select-helpers";

test("RestartPolicyEditor submits the active policy and retains the inactive limit", async ({page}, info) => {
  await page.goto("/components/restart-policy-editor");
  const panel = page.locator(".preview-stage .flood-surface");
  const form = panel.getByRole("form", {name:"Storage worker runtime settings"});
  const policy = form.getByRole("combobox", {name:"Policy"});
  const limit = form.getByRole("spinbutton", {name:/Maximum restarts/});
  const restricted = page.getByRole("checkbox", {name:"RestartPolicyEditor prop restricted"});
  const submitted = () => form.evaluate(node => Object.fromEntries(new FormData(node as HTMLFormElement)));

  await expect(limit).toHaveValue("5");
  await expect.poll(submitted).toEqual({restartPolicy:"on-failure",maxRestarts:"5"});
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("restart-policy-editor.png"), animations:"disabled"});

  await limit.fill("8");
  await chooseSelectOption(policy, "never");
  await expect(limit).toHaveCount(0);
  await expect(form.getByText("Leave the service stopped.")).toBeVisible();
  await expect.poll(submitted).toEqual({restartPolicy:"never"});
  await chooseSelectOption(policy, "always");
  await expect(form.getByText("Restart whenever the service stops.")).toBeVisible();

  await restricted.check();
  await expect(form.getByRole("alert")).toHaveText("Always is unavailable on this plan.");
  await expect(selectBridge(policy)).toHaveValue("");
  expect(await form.evaluate(node => (node as HTMLFormElement).checkValidity())).toBe(false);
  await expect(policy).toBeFocused();
  await expect(form.getByRole("alert")).toHaveCount(1);
  await panel.screenshot({path:info.outputPath("restart-policy-editor-unavailable.png"), animations:"disabled"});
  await chooseSelectOption(policy, "on-failure");
  await expect(limit).toHaveValue("8");
  await expect(limit).toHaveAttribute("max","10");
  await expect(selectBridge(policy).locator('option[value="always"]')).toBeDisabled();
  await limit.fill("");
  expect(await form.evaluate(node => (node as HTMLFormElement).checkValidity())).toBe(false);
  await limit.fill("8");
  await expect.poll(submitted).toEqual({restartPolicy:"on-failure",maxRestarts:"8"});

  await page.getByRole("checkbox", {name:"RestartPolicyEditor prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox", {name:"RestartPolicyEditor prop surface"}), "overlay");
  expect(await panel.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("restart-policy-editor-narrow.png"), animations:"disabled"});
  await page.getByRole("checkbox", {name:"RestartPolicyEditor prop disabled"}).check();
  await expect(policy).toBeDisabled();
  await expect(limit).toBeDisabled();
  await expect.poll(submitted).toEqual({});
});
