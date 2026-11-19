import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("ReleaseTargetMatrix separates rollout status from the release serving each target", async ({ page }, info) => {
  await page.goto("/components/release-target-matrix");
  const table = page.getByRole("table", { name: "Rollout of v2.14.0" });
  const production = table.getByRole("row").filter({ has: page.getByRole("rowheader", { name: "Production" }) });
  await expect(production.getByRole("cell").first()).toHaveText("v2.13.0");
  await expect(production.getByRole("cell").last()).toContainText("Failed");
  await expect(production.getByRole("cell").last()).toContainText("Readiness check timed out.");
  await expect(table.getByRole("row", { name: /Sandbox/ }).getByRole("cell").first()).toHaveText("None");
  await expect(table.getByRole("row", { name: /EU preview/ }).getByRole("cell").first()).toHaveText("Unknown");
  await page.evaluate(() => document.fonts.ready);
  const surface = table.locator("xpath=ancestor::*[contains(@class,'flood-surface')][1]");
  await surface.screenshot({ path: info.outputPath("release-target-matrix.png") });

  const narrow = page.getByRole("checkbox", { name: "ReleaseTargetMatrix prop narrow" });
  await narrow.check();
  await chooseSelectOption(page.getByRole("combobox", { name: "ReleaseTargetMatrix prop surface" }), "overlay");
  const viewport = table.locator("xpath=ancestor::*[contains(@class,'flood-scroll-area__viewport')][1]");
  await expect.poll(() => viewport.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  const textHeight = (node: Element) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getBoundingClientRect().height;
  };
  expect(await production.getByRole("rowheader").evaluate(textHeight)).toBeLessThan(22);
  expect(await table.getByRole("columnheader", { name: "Live", exact: true }).evaluate(textHeight)).toBeLessThan(22);
  expect(await table.getByRole("row", { name: /EU preview/ }).getByRole("cell").first().evaluate(textHeight)).toBeLessThan(22);
  await expect(production.getByText("Failed", { exact: true })).toBeVisible();
  await surface.screenshot({ path: info.outputPath("release-target-matrix-narrow.png") });

  const leftEdges = () => table.getByRole("columnheader").evaluateAll(headers =>
    headers.map(header => header.getBoundingClientRect().left));
  const before = await leftEdges();
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  await chooseSelectOption(scenario, "Released");
  await expect(production.getByRole("cell").first()).toHaveText("v2.14.0");
  await expect(production.getByRole("cell").last()).toHaveText("Released");
  expect(await leftEdges()).toEqual(before);
  await chooseSelectOption(scenario, "Empty");
  await expect(table.getByRole("cell", { name: "No deployment targets." })).toBeVisible();
});
