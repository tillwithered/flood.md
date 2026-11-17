import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("ReplicaAllocation shifts capacity across regions under the shared limit", async ({ page }, info) => {
  await page.goto("/components/replica-allocation");
  const stage = page.locator(".preview-stage");
  const allocation = stage.getByRole("region", { name: "Regional replicas" });
  const count = (region: string) => allocation.getByRole("spinbutton", { name: `${region} replicas` });
  const increase = (region: string) => allocation.getByRole("button", { name: `Add a replica in ${region}` });
  const locked = page.getByRole("checkbox", { name: "ReplicaAllocation prop locked" });
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "ReplicaAllocation prop narrow" }).check();
    await chooseSelectOption(page.getByRole("combobox", { name: "ReplicaAllocation prop surface" }), "overlay");
  }

  await count("Singapore").press("ArrowUp");
  await expect(count("Singapore")).toBeFocused();
  await expect(count("Singapore")).toHaveValue("1");
  await expect(allocation.getByText("4 / 4 replicas", { exact: true })).toBeVisible();
  await expect(increase("Frankfurt")).toBeDisabled();
  await expect(increase("Virginia")).toBeDisabled();
  await count("Virginia").fill("9");
  await expect(count("Virginia")).toHaveValue("1");
  await count("Frankfurt").press("ArrowDown");
  await expect(allocation.getByText("3 / 4 replicas", { exact: true })).toBeVisible();
  await increase("Singapore").click();
  await expect(count("Singapore")).toHaveValue("2");
  await locked.check();
  await expect(count("Virginia")).toBeDisabled();
  await expect(allocation.getByText("Managed by production policy.")).toBeVisible();

  await page.evaluate(() => document.fonts.ready);
  const panel = (await stage.locator(".flood-surface").boundingBox())!;
  const canvas = (await stage.boundingBox())!;
  expect(panel.y).toBeGreaterThan(canvas.y);
  expect(panel.y + panel.height).toBeLessThan(canvas.y + canvas.height);
  await expect.poll(() => allocation.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.screenshot({ path: info.outputPath("replica-allocation.png"), animations: "disabled" });

  await count("Frankfurt").press("ArrowDown");
  await count("Singapore").press("ArrowDown");
  await count("Singapore").press("ArrowDown");
  await expect(allocation.getByText("1 / 4 replicas", { exact: true })).toBeVisible();
  await locked.uncheck();
  await count("Virginia").press("ArrowDown");
  await expect(count("Virginia")).toHaveValue("1");
  await expect(allocation.getByRole("button", { name: "Remove a replica in Virginia" })).toBeDisabled();
  await page.getByRole("checkbox", { name: "ReplicaAllocation prop disabled" }).check();
  await expect(count("Singapore")).toBeDisabled();
});
