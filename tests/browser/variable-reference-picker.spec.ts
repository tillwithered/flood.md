import { expect, test } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("VariableReferencePicker distinguishes identical keys and submits their stable IDs", async ({ page }, info) => {
  await page.goto("/components/variable-reference-picker");
  const stage = page.locator(".preview-stage");
  const input = stage.getByRole("combobox", { name: "Source variable" });
  const list = page.getByRole("listbox", { name: "Variable references" });
  const postgres = list.getByRole("group", { name: "Postgres", exact: true });
  const replica = list.getByRole("group", { name: "Read replica", exact: true });
  const scenario = page.getByRole("combobox", { name: "Scenario", exact: true });
  const formValue = () => input.evaluate(node => new FormData((node as HTMLInputElement).form!).get("reference"));

  if (info.project.name === "mobile") {
    await chooseSelectOption(page.getByRole("combobox", { name: "VariableReferencePicker prop surface" }), "overlay");
    await page.getByRole("checkbox", { name: "VariableReferencePicker prop narrow" }).check();
  }
  await input.fill("DATABASE_URL");
  await expect(postgres.getByRole("option", { name: "DATABASE_URL" })).toBeVisible();
  await expect(replica.getByRole("option", { name: "DATABASE_URL" })).toBeVisible();
  const bounds = (await list.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: info.outputPath("variable-reference-picker-open.png"), animations: "disabled" });

  await input.press("Enter");
  await expect(input).toHaveValue("Postgres / DATABASE_URL");
  await expect.poll(formValue).toBe("db-url");
  await input.fill("read replica.database_url");
  await expect(postgres).toHaveCount(0);
  await replica.getByRole("option", { name: "DATABASE_URL" }).click();
  await expect(input).toHaveValue("Read replica / DATABASE_URL");
  await expect.poll(formValue).toBe("replica-url");
  await expect(input).toBeFocused();
  await input.blur();
  await expect.poll(() => input.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await stage.screenshot({ path: info.outputPath("variable-reference-picker.png"), animations: "disabled" });
  await input.fill("uncommitted");
  await input.press("Escape");
  await expect(input).toHaveValue("Read replica / DATABASE_URL");
  await expect.poll(formValue).toBe("replica-url");

  await chooseSelectOption(scenario, "Limited");
  await input.fill("read replica");
  await expect(replica.getByRole("option", { name: /DATABASE_URL/ })).toHaveAttribute("aria-disabled", "true");
  await input.press("Escape");
  await page.getByRole("checkbox", { name: "VariableReferencePicker prop clearable" }).check();
  await stage.getByRole("button", { name: "Clear selection" }).click();
  await expect.poll(formValue).toBe("");

  await chooseSelectOption(scenario, "Empty");
  await input.press("ArrowDown");
  await expect(list.getByRole("option", { name: "No matching references." })).toBeVisible();
});
