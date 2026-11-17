import {expect, test} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("ServiceRuntimeStatus distinguishes idle sleep, wake progress and unavailable telemetry", async ({page}, info) => {
  await page.goto("/components/service-runtime-status");
  const panel = page.locator(".preview-stage .flood-surface");
  const scenario = page.getByRole("combobox",{name:"Scenario",exact:true});
  const status = panel.locator(".flood-status-indicator");
  const duration = panel.locator("data");
  await expect(status).toHaveText("Sleeping");
  await expect(status).toHaveAttribute("data-tone","neutral");
  await expect(duration).toHaveCount(0);
  await expect(panel.locator("time")).toHaveAttribute("datetime","2026-11-18T09:41:00Z");
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({path:info.outputPath("service-runtime-status.png"),animations:"disabled"});

  await chooseSelectOption(scenario,"Waking");
  await expect(status).toHaveText("Waking");
  await expect(panel.getByText("Elapsed",{exact:true})).toBeVisible();
  await expect(duration).toHaveAttribute("value","2100");
  await chooseSelectOption(scenario,"Running");
  await expect(status).toHaveText("Running");
  await expect(panel.getByText("Last startup")).toBeVisible();
  await expect(duration).toHaveAttribute("value","3270");
  await expect(panel.getByText("Elapsed",{exact:true})).toHaveCount(0);

  await page.getByRole("checkbox",{name:"ServiceRuntimeStatus prop narrow"}).check();
  await chooseSelectOption(page.getByRole("combobox",{name:"ServiceRuntimeStatus prop surface"}),"overlay");
  await chooseSelectOption(scenario,"Wake failed");
  await expect(status).toHaveAttribute("data-tone","error");
  await expect(panel.getByText("The process exited before it started accepting connections.")).toBeVisible();
  await expect(duration).toHaveCount(0);
  expect(await panel.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({path:info.outputPath("service-runtime-status-narrow.png"),animations:"disabled"});

  await page.getByRole("checkbox",{name:"ServiceRuntimeStatus prop announce"}).check();
  await chooseSelectOption(scenario,"Unknown");
  await expect(panel.getByRole("status")).toHaveText("Runtime unavailable");
  await expect(panel.locator("time")).toHaveCount(0);
  await expect(duration).toHaveCount(0);
});
