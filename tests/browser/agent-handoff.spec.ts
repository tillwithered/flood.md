import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("AgentHandoff preserves transfer direction through all recorded outcomes", async ({page}, info) => {
  await page.goto("/components/agent-handoff");
  const panel = page.locator(".preview-stage .flood-surface");
  const valueFor = (label: string) => panel.getByText(label,{exact:true}).locator("..").locator("dd");
  const state = page.getByRole("combobox",{name:"AgentHandoff prop state"});
  await expect(valueFor("From")).toHaveText("Support triage");
  await expect(valueFor("To")).toHaveText("Billing review");
  await expect(panel.getByText("Transferred",{exact:true})).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("agent-handoff.png")});

  await chooseSelectOption(state,"requested");
  await expect(panel.getByText("Requested",{exact:true})).toBeVisible();
  await expect(panel.getByText("Transferred",{exact:true})).toHaveCount(0);
  await page.getByRole("checkbox",{name:"AgentHandoff prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox",{name:"AgentHandoff prop surface"}),"overlay");
  await chooseSelectOption(state,"failed");
  await expect(panel.getByText("Transfer failed",{exact:true})).toBeVisible();
  await expect(valueFor("To")).toHaveText("Billing review");
  await expect(panel.getByText("The billing agent was unavailable.")).toBeVisible();
  expect(await panel.evaluate(node => node.scrollWidth-node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("agent-handoff-narrow.png")});

  await chooseSelectOption(state,"unknown");
  await expect(panel.getByText("Outcome unavailable",{exact:true})).toBeVisible();
  await expect(panel.getByText("Transfer failed",{exact:true})).toHaveCount(0);
  await expect(valueFor("From")).toHaveText("Support triage");
});
