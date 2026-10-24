import { test, expect } from "@playwright/test";
import { chooseSelectOption } from "./select-helpers";

test("readOnly prevents edits, permits selection and focus, and can be switched off", async ({ page }) => {
  for (const slug of ["input", "textarea"]) {
    const name = slug === "input" ? "Input" : "Textarea";
    await page.goto(`/components/${slug}`);
    const field = page.locator(".preview-stage").getByRole("textbox");
    const checkbox = page.getByRole("checkbox", { name: `${name} prop readOnly`, exact: true });
    const value = await field.inputValue();
    await checkbox.check();
    await expect(field).toHaveAttribute("readonly", "");
    await expect(field).toHaveCSS("border-top-style", "dashed");
    await expect(page.locator(".preview-stage")).toContainText("Read only. Select and copy.");
    await field.focus();
    await expect(field).toBeFocused();
    await expect(field).toHaveCSS("border-top-style", "solid");
    await field.press("ControlOrMeta+A");
    expect(await field.evaluate(node => (node as HTMLInputElement).selectionEnd! - (node as HTMLInputElement).selectionStart!)).toBeGreaterThan(0);
    await field.pressSequentially("changed");
    await expect(field).toHaveValue(value);
    await checkbox.uncheck();
    await field.fill("Editable again");
    await expect(field).toHaveValue("Editable again");
  }
});

test("field feedback is described, advisory states are not invalid, and errors take precedence", async ({ page }, info) => {
  const messages = { warning: "Check this value before continuing.", success: "Looks good.", info: "You can change this later.", error: "Please review this value." };
  for (const slug of ["input", "textarea", "select", "field"]) {
    const name = { input: "Input", textarea: "Textarea", select: "Select", field: "Field" }[slug];
    await page.goto(`/components/${slug}`);
    const stage = page.locator(".preview-stage");
    const control = stage.getByRole(slug === "select" ? "combobox" : "textbox");
    const status = page.getByRole("combobox", { name: `${name} prop status`, exact: true });
    for (const state of ["warning", "success", "info", "error"] as const) {
      await chooseSelectOption(status, state);
      await expect(control).toHaveAttribute("data-status", state);
      await expect(stage).toContainText(messages[state]);
      await expect(control).toHaveAttribute("aria-describedby", /-message/);
      if (state === "error") await expect(control).toHaveAttribute("aria-invalid", "true");
      else await expect(control).not.toHaveAttribute("aria-invalid", "true");
      const color = await control.evaluate(node => getComputedStyle(node.closest(".flood-field")!.querySelector(".flood-message")!).color);
      await expect(control).toHaveCSS("border-top-color", color);
      await expect(page.locator("#usage .site-code-block code")).toContainText(`status="${state}"`);
    }
    await chooseSelectOption(status, "success");
    await page.getByRole("checkbox", { name: `${name} prop ${slug === "field" ? "error" : "invalid"}`, exact: true }).check();
    await expect(control).toHaveAttribute("data-status", "error");
    await expect(control).toHaveAttribute("aria-invalid", "true");
    await page.screenshot({ path: `.artifacts/field-status-${slug}-${info.project.name}.png` });
  }
});
