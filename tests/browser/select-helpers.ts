import { expect, type Locator } from "@playwright/test";

/** The native form/ref bridge remains testable without opening an OS menu. */
export function selectBridge(trigger: Locator): Locator {
  return trigger.locator("..").locator("select").first();
}

/** Exercise the actual custom popup and option clicks, never selectOption(). */
export async function chooseSelectOption(trigger: Locator, value: string) {
  await expect(trigger).toBeVisible();
  await expect(selectBridge(trigger).locator("option").first()).toBeAttached();
  const text = await selectBridge(trigger).locator("option").evaluateAll((options, selected) =>
    (options as HTMLOptionElement[]).find((option) => option.value === selected)?.label,
  value);
  if (!text) throw new Error(`No Select option has value ${JSON.stringify(value)}`);
  await trigger.scrollIntoViewIfNeeded();
  await trigger.page().evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await trigger.page().getByRole("option", { name: text, exact: true }).click();
  await expect(selectBridge(trigger)).toHaveValue(value);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
}
