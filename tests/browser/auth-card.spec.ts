import { expect, test } from "@playwright/test";

const url = (process.env.FLOOD_NEXT_TEST_URL ?? "http://127.0.0.1:3001") + "/auth-card";

test("registration verifies a one-time code and allows retry after an invalid code", async ({ page }, testInfo) => {
  await page.goto(url);
  const form = page.getByRole("form");
  const signInWidth = (await form.boundingBox())?.width;
  await page.getByRole("button", { name: "Create an account" }).click();
  await expect(page.getByRole("heading", { name: "Create an account" })).toBeFocused();
  const email = page.getByRole("textbox", { name: "Email" });
  await email.fill("editor@example.test");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("example-password");
  await page.getByRole("button", { name: "Create an account" }).click();
  await expect(page.getByRole("heading", { name: "Verify your email" })).toBeFocused();
  expect((await form.boundingBox())?.width).toBe(signInWidth);
  await expect(page.getByText("editor@example.test")).toBeVisible();
  await page.getByRole("button", { name: "Send another code" }).click();
  await expect(page.getByRole("status").filter({ hasText: "A new code was sent." })).toHaveCount(1);
  const code = page.getByRole("textbox", { name: "Verification code" });
  await code.fill("999999");
  await page.getByRole("button", { name: "Verify code" }).click();
  await expect(code).toBeFocused();
  await expect(code).toHaveAttribute("aria-invalid", "true");
  await expect(code).toHaveAccessibleDescription("That code did not work. Try again.");
  await page.screenshot({ path: testInfo.outputPath("auth-code-error.png") });
  await code.fill("123456");
  await code.press("Enter");
  await expect(page.getByRole("heading", { name: "Demo complete" })).toBeFocused();
});

test("sign in and alternate provider run as separate actions", async ({ page }, testInfo) => {
  await page.goto(url);
  await page.screenshot({ path: testInfo.outputPath("auth-sign-in.png") });
  await page.getByRole("textbox", { name: "Email" }).fill("editor@example.test");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("example-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Demo complete" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Email" })).toBeEmpty();
  await page.getByRole("button", { name: "Continue with example SSO" }).click();
  await expect(page.getByRole("heading", { name: "Demo complete" })).toBeVisible();
});
