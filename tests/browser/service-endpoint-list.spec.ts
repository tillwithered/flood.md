import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("ServiceEndpointList preserves address scope and the exact external port", async ({ page, context }, info) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/components/service-endpoint-list");
  const panel = page.locator(".preview-stage .flood-surface");
  const list = panel.getByRole("list", { name: "Network addresses" });
  const proxy = list.getByRole("listitem").filter({ hasText: "TCP proxy" });
  const discovery = list.getByRole("listitem").filter({ hasText: "Service discovery" });
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });

  await expect(list.getByRole("listitem")).toHaveCount(3);
  await expect(proxy).toContainText("Public");
  await expect(discovery).toContainText("Private");
  const copyButtons = await list.getByRole("button").evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().right));
  expect(copyButtons).toHaveLength(3);
  expect(Math.max(...copyButtons) - Math.min(...copyButtons)).toBeLessThanOrEqual(1);
  await page.evaluate(() => document.fonts.ready);
  await panel.screenshot({ path: info.outputPath("service-endpoints.png") });
  await proxy.getByRole("button", { name: "Copy TCP proxy (Public)" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("edge-gateway.example.net:14386");

  await page.getByRole("checkbox", { name: "ServiceEndpointList prop narrow" }).check();
  await chooseSelectOption(page.getByRole("combobox", { name: "ServiceEndpointList prop surface" }), "overlay");
  await chooseSelectOption(scenario, "provisioning");
  const web = list.getByRole("listitem").filter({ hasText: "Web" });
  await expect(web).toContainText("Provisioning");
  await expect(web.getByRole("button")).toHaveCount(0);
  await expect(discovery.getByRole("button")).toBeVisible();
  expect(await list.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await panel.screenshot({ path: info.outputPath("service-endpoints-narrow.png") });

  await chooseSelectOption(scenario, "private only");
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await expect(discovery).toBeVisible();
  await chooseSelectOption(scenario, "empty");
  await expect(list).toHaveCount(0);
  await expect(panel.getByText("No addresses configured.")).toBeVisible();
});
