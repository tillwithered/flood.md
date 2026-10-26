import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("Next hydrates searchable selection without changing the input boundary", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`${process.env.FLOOD_NEXT_TEST_URL ?? "http://127.0.0.1:3001"}/foundations`);
  const input = page.getByRole("combobox", { name: "Runtime", exact: true });
  await input.fill("Vue");
  await expect(page.getByRole("option", { name: "Vue", exact: true })).toBeVisible();
  await input.press("Enter");
  await expect(input).toHaveValue("Vue");
  await expect(page.locator('input[type="hidden"][name="runtime"]')).toHaveValue("vue");
  await expect(input).toBeFocused();
  expect(errors).toEqual([]);
});

test("Next hydrates multiple selection and removable tags", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`${process.env.FLOOD_NEXT_TEST_URL ?? "http://127.0.0.1:3001"}/foundations`);
  const input = page.getByRole("combobox", { name: "Runtimes", exact: true });
  await input.fill("Vue"); await input.press("Enter");
  await expect(page.locator('input[type="hidden"][name="runtimes"]')).toHaveCount(2);
  await input.press("Escape");
  const root = page.locator(".flood-multi-select").filter({has:input});
  await root.getByRole("button", {name:"Remove Vue"}).click();
  await expect(page.locator('input[type="hidden"][name="runtimes"]')).toHaveCount(1);
  await expect(input).toBeFocused(); expect(errors).toEqual([]);
});

test("Next App Router renders, hydrates and submits Flood controls", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto((process.env.FLOOD_NEXT_TEST_URL ?? "http://127.0.0.1:3001"));
  await expect(
    page.getByRole("heading", { name: "Flood + Next.js" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Server-rendered button" }),
  ).toBeVisible();
  await page.getByLabel("Your name").fill("Flood builder");
  await page.getByRole("checkbox", { name: "Send product updates" }).check();
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Profile saved in this demo.",
  );
  expect(errors).toEqual([]);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
