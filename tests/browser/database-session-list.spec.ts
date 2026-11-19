import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("DatabaseSessionList connects visible blockers and preserves a wait when its blocker is hidden", async ({ page }, info) => {
  await page.goto("/components/database-session-list");
  const stage = page.locator(".preview-stage");
  const sessions = stage.getByRole("list", { name: "Postgres sessions" });
  const sync = sessions.getByRole("listitem").filter({ hasText: "Inventory sync" });
  const consoleSession = sessions.getByRole("listitem").filter({ hasText: "Idle in transaction" });
  const blocker = sync.getByRole("link", { name: "Admin console" });
  const surface = page.getByRole("combobox", { name: "DatabaseSessionList prop surface" });
  const scenario = page.getByRole("region", { name: "Preview properties" })
    .getByRole("combobox", { name: "Scenario", exact: true });
  await chooseSelectOption(surface, "canvas");
  await expect(blocker).toBeVisible();
  await chooseSelectOption(surface, info.project.name === "mobile" ? "overlay" : "raised");
  if (info.project.name === "mobile") {
    await page.getByRole("checkbox", { name: "DatabaseSessionList prop narrow" }).check();
  }
  await expect(sync.getByText("Waiting for lock", { exact: true })).toBeVisible();
  await expect(consoleSession.getByText("Transaction open 8 min")).toBeVisible();
  await expect(sessions.getByText("Idle", { exact: true })).toBeVisible();
  await expect(blocker).toHaveAttribute("href", `#${await consoleSession.getAttribute("id")}`);
  await expect.poll(() => sessions.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await page.evaluate(() => document.fonts.ready);
  await stage.screenshot({ path: info.outputPath("database-session-list.png"), animations: "disabled" });

  await blocker.press("Enter");
  await expect(consoleSession).toBeFocused();
  await chooseSelectOption(scenario, "Blocker hidden");
  await expect(blocker).toHaveCount(0);
  await expect(sync.getByText("Waiting for lock", { exact: true })).toBeVisible();
  await chooseSelectOption(scenario, "No waits");
  await expect(sync.getByText("Active", { exact: true })).toBeVisible();
  await chooseSelectOption(scenario, "Empty");
  await expect(sessions.getByText("No sessions found.")).toBeVisible();
});
