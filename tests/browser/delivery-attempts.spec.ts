import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("DeliveryAttempts retains the response disclosure at a narrow width", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/delivery-attempts");
  const preview = page.locator(".preview-stage");
  const history = preview.locator(".flood-delivery-attempts");
  const list = history.getByRole("list", { name: "Invoice webhook delivery attempts" });
  const first = list.getByRole("listitem").filter({ hasText: "Attempt 1" });
  const second = list.getByRole("listitem").filter({ hasText: "Attempt 2" });
  const third = list.getByRole("listitem").filter({ hasText: "Attempt 3" });
  const expand = second.getByRole("button", { name: "Attempt 2 response" });
  await expect(first.getByText("Failed", { exact: true })).toBeVisible();
  await expect(first.getByText("HTTP 503 Service Unavailable")).toBeVisible();
  await expect(second.getByText("Connection timed out")).toBeVisible();
  await expect(second.locator("time")).toHaveAttribute("datetime", "2026-11-16T12:01:00Z");
  await expect(third.getByText("Delivered", { exact: true })).toBeVisible();
  await expect(third.getByText("HTTP 204 No Content")).toBeVisible();
  await expect(expand).toHaveAttribute("aria-expanded", "false");
  await expand.press("Enter");
  await expect(expand).toHaveAttribute("aria-expanded", "true");
  const panelId = await expand.getAttribute("aria-controls");
  const panel = second.locator(`[id=${JSON.stringify(panelId)}]`);
  await expect(panel).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await preview.screenshot({ path: info.outputPath("delivery-attempts-context.png") });

  await page.getByRole("checkbox", { name: "DeliveryAttempts prop narrow" }).check();
  await expect(panel).toBeVisible();
  await expect.poll(() => history.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await history.screenshot({ path: info.outputPath("delivery-attempts-narrow.png") });
  await expand.press("Space");
  await expect(expand).toBeFocused();
  await expect(panel).toBeHidden();

  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  await chooseSelectOption(scenario, "Pending");
  await expect(third.getByText("Pending", { exact: true })).toBeVisible();
  await expect(history.getByText("HTTP 204 No Content")).toHaveCount(0);
  await chooseSelectOption(scenario, "Failed");
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await page.getByRole("checkbox", { name: "DeliveryAttempts prop empty" }).check();
  await expect(list).toHaveCount(0);
  await expect(history.getByText("No delivery attempts yet.")).toBeVisible();
});
