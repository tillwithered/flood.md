import { expect, test } from "@playwright/test";

test("PermissionEditor preserves inherited access and the editable draft in review mode", async ({ page }) => {
  await page.goto("/components/permission-editor");
  const editor = page.getByRole("group", { name: "Release operator" });
  const deploy = editor.getByRole("checkbox", { name: "Start deployments" });
  const rollback = editor.getByRole("checkbox", { name: "Roll back deployments" });
  await expect(editor.getByRole("checkbox")).toHaveCount(2);
  await expect(editor.getByText("Inherited from Member", { exact: true })).toBeVisible();
  await expect(editor.getByText("Inherited from Production policy", { exact: true })).toBeVisible();
  await expect(deploy).toHaveAccessibleDescription("Deploy an approved build to Production.");
  await deploy.press("Space");
  await expect(deploy).toBeChecked();
  await expect(deploy).toBeFocused();
  await rollback.click();
  await expect(rollback).not.toBeChecked();
  const mode = page.getByRole("combobox", { name: "PermissionEditor prop mode", exact: true });
  await mode.click();
  await page.getByRole("option", { name: "Review", exact: true }).click();
  await expect(editor.getByRole("checkbox")).toHaveCount(0);
  await expect(editor.getByText("Granted", { exact: true })).toHaveCount(2);
  await expect(editor.getByText("Not granted", { exact: true })).toHaveCount(2);
  const rows = editor.locator(".flood-setting-row");
  await expect(rows.filter({hasText: "Start deployments"}).getByText("Granted", {exact: true})).toBeVisible();
  await expect(rows.filter({hasText: "Roll back deployments"}).getByText("Not granted", {exact: true})).toBeVisible();
  await page.getByRole("checkbox", { name: "PermissionEditor prop narrow" }).check();
  await expect.poll(() => editor.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await mode.click();
  await page.getByRole("option", { name: "Edit", exact: true }).click();
  await expect(deploy).toBeChecked();
  await expect(rollback).not.toBeChecked();
});

test("ApiKeyList copies only public values and scopes revocation to active keys", async ({ page, context }, info) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/components/api-key-list");
  const list = page.getByRole("list", { name: "Project API keys" });
  const warehouse = list.getByRole("listitem").filter({ hasText: "Warehouse sync" });
  const reporting = list.getByRole("listitem").filter({ hasText: "Reporting job" });
  const revoke = warehouse.getByRole("button", { name: "Revoke Warehouse sync" });
  await expect(list.getByRole("button", { name: /^Copy / })).toHaveCount(1);
  await list.getByRole("button", { name: "Copy Storefront" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("pk_example_storefront_8db7fq64q8vb6");
  await expect(warehouse).toContainText("7f2a");
  await expect(reporting).toContainText("Expired");
  await expect(reporting.getByRole("button")).toHaveCount(0);

  await revoke.press("Enter");
  const dialog = page.getByRole("alertdialog", { name: "Revoke Warehouse sync?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(revoke).toBeFocused();
  await revoke.click();
  await dialog.getByRole("button", { name: "Revoke key" }).click();
  await expect(page.getByText("Revocation requested for Warehouse sync.", { exact: true })).toBeVisible();

  await page.getByRole("checkbox", { name: "ApiKeyList prop narrow" }).check();
  await expect.poll(() => list.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await list.screenshot({ path: info.outputPath("api-key-list-narrow.png") });
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  await scenario.click();
  await page.getByRole("option", { name: "Revoked", exact: true }).click();
  await expect(warehouse).toContainText("Revoked");
  await expect(warehouse.getByRole("button")).toHaveCount(0);
});

test("SessionList only offers sign-out for a known remote session", async ({ page }, info) => {
  await page.goto("/components/session-list");
  const stage = page.locator(".preview-stage");
  const list = stage.getByRole("list", { name: "Active sessions" });
  const current = list.getByRole("listitem").filter({ hasText: "Chrome on Windows" });
  const remote = list.getByRole("listitem").filter({ hasText: "iPhone" });
  const unavailable = list.getByRole("listitem").filter({ hasText: "Firefox on Linux" });
  const action = remote.getByRole("button", { name: "Sign out of iPhone" });
  await expect(current.getByText("Current session", { exact: true })).toBeVisible();
  await expect(current.getByRole("button")).toHaveCount(0);
  await expect(unavailable.getByText("Session status unavailable", { exact: true })).toBeVisible();
  await expect(unavailable.getByRole("button")).toHaveCount(0);
  await expect(remote.locator("time")).toHaveAttribute("datetime", "2026-11-16T12:15:00Z");

  await action.press("Enter");
  const confirm = page.getByRole("alertdialog", { name: "Sign out of iPhone?" });
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: "Cancel" }).click();
  await expect(action).toBeFocused();
  await action.click();
  await confirm.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByText("Sign-out requested for iPhone.", { exact: true })).toBeVisible();

  await page.getByRole("checkbox", { name: "SessionList prop narrow" }).check();
  await expect.poll(() => list.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await page.evaluate(() => document.fonts.ready);
  await list.screenshot({ path: info.outputPath("session-list-narrow.png") });

  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  await scenario.click();
  await page.getByRole("option", { name: "Current unknown", exact: true }).click();
  await expect(list.getByRole("button")).toHaveCount(0);
  await expect(list.getByText("Current session", { exact: true })).toHaveCount(0);
  await scenario.click();
  await page.getByRole("option", { name: "Empty", exact: true }).click();
  await expect(stage.getByText("No active sessions.", { exact: true })).toBeVisible();
});
