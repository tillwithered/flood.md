import { expect, test } from "@playwright/test";

test("the shortcut recorder validates drafts, then saves, cancels or clears them", async ({ page }) => {
  await page.goto("/components/shortcut-recorder");
  const trigger = page.getByRole("button", { name: /^Command palette shortcut,/ });
  const editor = page.getByRole("dialog", { name: "Command palette shortcut" });
  const capture = editor.getByRole("group", { name: "Press your shortcut" });
  const save = editor.getByRole("button", { name: "Save" });

  await expect(trigger).toHaveAccessibleName("Command palette shortcut, Ctrl + K");
  await trigger.press("Enter");
  await expect(capture).toBeFocused();
  await capture.press("p");
  await expect(editor.getByRole("status")).toHaveText("Include Ctrl, Alt, Shift, or Meta.");
  await capture.press("Control+p");
  await expect(editor.getByRole("status")).toHaveText("Already assigned to Go to file.");
  await expect(save).toBeDisabled();

  await capture.press("Control+Shift+y");
  await expect(save).toBeEnabled();
  await expect(trigger).toHaveAccessibleName("Command palette shortcut, Ctrl + K");
  await capture.press("Escape");
  await expect(editor).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAccessibleName("Command palette shortcut, Ctrl + K");

  await trigger.click();
  await capture.press("Control+Shift+y");
  await capture.press("Enter");
  await expect(editor).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAccessibleName("Command palette shortcut, Ctrl + Shift + Y");

  await trigger.click();
  await capture.press("Tab");
  const clear = editor.getByRole("button", { name: "Clear" });
  await expect(clear).toBeFocused();
  await clear.press("Enter");
  await expect(capture).toBeFocused();
  await save.click();
  await expect(trigger).toHaveAccessibleName("Command palette shortcut, Record shortcut");
});
