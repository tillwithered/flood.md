import { expect, test } from "@playwright/test";

test("ServiceIncident keeps the current impact ahead of the published timeline", async ({ page }, info) => {
  await page.goto("/components/service-incident");
  const stage = page.locator(".preview-stage");
  const incident = stage.getByRole("article", { name: "Trouble opening database connections" });
  const updates = incident.getByRole("list", { name: "Updates" });
  const phase = page.getByRole("combobox", { name: "ServiceIncident prop phase" });
  await expect(incident.getByText("Monitoring", { exact: true })).toBeVisible();
  await expect(updates.getByRole("listitem")).toHaveCount(2);
  await expect(updates.locator("time").first()).toHaveAttribute("datetime", "2026-11-16T14:26:00Z");
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("service-incident-monitoring.png") });

  await phase.click();
  await page.getByRole("option", { name: "Investigating", exact: true }).click();
  await expect(incident.getByText("New connections in Frankfurt may time out.")).toBeVisible();
  await expect(incident.getByRole("heading", { name: "Updates" })).toHaveCount(0);

  await phase.click();
  await page.getByRole("option", { name: "Resolved", exact: true }).click();
  await page.getByRole("combobox", { name: "ServiceIncident prop surface" }).click();
  await page.getByRole("option", { name: "overlay", exact: true }).click();
  await page.getByRole("checkbox", { name: "ServiceIncident prop narrow" }).check();
  await expect(incident.getByText("Resolved", { exact: true })).toBeVisible();
  await expect(updates.getByRole("listitem")).toHaveCount(3);
  await expect(updates.getByRole("listitem").first()).toContainText("Connections recovered");
  await expect.poll(() => incident.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.screenshot({ path: info.outputPath("service-incident-resolved.png") });
  const oldest = updates.getByRole("listitem").last();
  await oldest.scrollIntoViewIfNeeded();
  await expect(oldest).toBeInViewport({ ratio: 1 });
  await stage.screenshot({ path: info.outputPath("service-incident-oldest-update.png") });
});
