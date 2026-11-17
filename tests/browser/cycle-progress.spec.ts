import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("CycleProgress compares the latest scope with the opening scope and shows historical observations", async ({ page }, info) => {
  await page.goto("/components/cycle-progress");
  const stage = page.locator(".preview-stage");
  const surface = stage.locator(".flood-surface").filter({ has: page.getByRole("heading", { name:"Cycle 42", exact:true }) });
  const metrics = stage.getByRole("group", { name: "Cycle work", exact:true });
  const value = (label: string) => metrics.locator("dl").filter({ has: page.getByText(label, { exact:true }) }).locator("dd").first();
  const plot = stage.getByRole("slider", { name: "Cycle work over time" });
  const scenario = page.getByRole("combobox", { name: "Scenario", exact:true });
  await expect(value("Done")).toHaveText("18");
  await expect(value("Scope")).toHaveText("24");
  await expect(value("At start")).toHaveText("20");
  await page.evaluate(() => document.fonts.ready);
  await surface.screenshot({ path: info.outputPath("cycle-progress.png") });

  await plot.press("Home");
  await expect(plot).toHaveAttribute("aria-valuetext", "Mon, Done: 2, Scope: 20");
  await plot.press("End");
  await expect(plot).toHaveAttribute("aria-valuetext", "Fri, Done: 18, Scope: 24");
  await plot.press("Escape");
  await expect(plot).not.toHaveAttribute("data-inspecting");
  await expect(plot).toBeFocused();

  await chooseSelectOption(scenario, "Scope reduced");
  await page.getByRole("checkbox", { name:"CycleProgress prop narrow" }).check();
  await chooseSelectOption(page.getByRole("combobox", { name:"CycleProgress prop surface" }), "overlay");
  await expect(value("Scope")).toHaveText("18");
  await expect(value("At start")).toHaveText("20");
  await expect.poll(() => surface.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await plot.press("End");
  await expect(plot).toHaveAttribute("aria-valuetext", "Fri, Done: 18, Scope: 18");
  await surface.screenshot({ path: info.outputPath("cycle-progress-narrow.png") });

  await chooseSelectOption(scenario, "Complete");
  await expect(value("Done")).toHaveText("24");
  await expect(value("Scope")).toHaveText("24");
  await chooseSelectOption(scenario, "Empty");
  await expect(stage.getByText("No cycle observations yet.")).toBeVisible();
  await expect(plot).toHaveCount(0);
});
