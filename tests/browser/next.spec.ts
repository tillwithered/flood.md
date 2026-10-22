import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("Next App Router renders, hydrates and submits Flood controls", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:3001");
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
