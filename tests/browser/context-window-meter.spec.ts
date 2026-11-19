import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("ContextWindowMeter keeps actual use, the threshold and active compaction distinct", async ({ page }, info) => {
  await page.goto("/components/context-window-meter");
  const stage = page.locator(".preview-stage");
  const meter = stage.getByRole("meter", { name: "Context window" });
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  const breakdown = stage.getByRole("button", { name: "Token breakdown" });

  if (info.project.name === "mobile") {
    await chooseSelectOption(page.getByRole("combobox", { name: "ContextWindowMeter prop surface" }), "overlay");
    await page.getByRole("checkbox", { name: "ContextWindowMeter prop narrow" }).check();
  }

  await expect(meter).toHaveAttribute("aria-valuetext", "96,500 / 128,000 tokens");
  await expect(meter).toHaveAccessibleDescription("Compaction threshold · 100,000");
  await expect(stage.getByText("31,500 tokens remaining")).toBeVisible();
  await expect(stage.getByText("Compacting", { exact: true })).toHaveCount(0);
  await breakdown.click();
  await expect(stage.getByText("58,420", { exact: true })).toBeVisible();

  await chooseSelectOption(scenario, "Compacting");
  await expect(meter).toHaveAttribute("aria-valuenow", "103400");
  await expect(stage.getByText("Compacting", { exact: true })).toBeVisible();
  await expect(stage.getByText("62,500", { exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => stage.getByText("Conversation", { exact: true }).evaluate(node => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getClientRects().length;
  })).toBe(1);
  await stage.screenshot({ path: info.outputPath("context-window-meter.png"), animations: "disabled" });

  await chooseSelectOption(scenario, "Compacted");
  await expect(meter).toHaveAttribute("aria-valuenow", "28310");
  await expect(stage.getByText("99,690 tokens remaining")).toBeVisible();
  await expect(stage.getByText("Compacting", { exact: true })).toHaveCount(0);
  await chooseSelectOption(scenario, "Over limit");
  await expect(meter).toHaveAttribute("aria-valuenow", "128000");
  await expect(meter).toHaveAttribute("aria-valuetext", "130,400 / 128,000 tokens");
  await expect(stage.getByText("2,400 tokens over limit")).toBeVisible();

  await page.getByRole("checkbox", { name: "ContextWindowMeter prop showThreshold" }).uncheck();
  await expect(meter).not.toHaveAttribute("aria-describedby", /.+/);
  await page.getByRole("checkbox", { name: "ContextWindowMeter prop showBreakdown" }).uncheck();
  await expect(breakdown).toHaveCount(0);
});
