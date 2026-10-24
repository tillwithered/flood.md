import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("dark landing, keyboard tabs and forms are accessible", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A clear foundation.",
  );
  await expect(page.locator(".site-root")).toHaveAttribute("data-flood-foundations", "neutral");
  await expect(page.locator(".site-root")).toHaveAttribute("data-flood-theme", "dark");
  expect(await page.evaluate(async () => {
    const faces = await document.fonts.load('400 16px Inter', 'Рабочее пространство Ёжик');
    return faces.length > 0 && faces.every((face) => face.status === "loaded");
  })).toBe(true);
  await page.screenshot({
    path: `.artifacts/landing-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Start something" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "A small beginning" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add a new idea" }).click();
  await expect(page.getByRole("status").filter({ hasText: "A new idea" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("tab", { name: "Button" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Inputs" })).toBeFocused();
  await page.getByLabel("Project name").fill("");
  await page.getByRole("button", { name: "Save idea" }).click();
  await expect(page.getByRole("alert")).toHaveText("Give your idea a name.");
  await expect(page.getByLabel("Project name")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByLabel("Project name")).toBeFocused();
  await expect(page.getByLabel("Project name")).toHaveAttribute("required", "");
  await page.getByLabel("Project name").fill("Flood test");
  await page.getByRole("button", { name: "Save idea" }).click();
  await expect(page.getByRole("button", { name: "Save idea" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Saved locally" }),
  ).toBeVisible();
  for (const name of ["Inputs", "Choices"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    const scan = await new AxeBuilder({ page }).analyze();
    expect(scan.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("native choices and disabled controls preserve semantics", async ({
  page,
}) => {
  await page.goto("/playground");
  await page.getByRole("tab", { name: "Choices" }).click();
  const checkbox = page.getByRole("checkbox", { name: "Leave room" });
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
  await page.getByRole("radio", { name: "Public", exact: true }).check();
  await expect(
    page.getByRole("radio", { name: "Private", exact: true }),
  ).not.toBeChecked();
  const updates = page.getByRole("switch", { name: "Email updates" });
  await updates.focus();
  await page.keyboard.press("Space");
  await expect(updates).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Disabled", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Working" })).toBeDisabled();
  await expect(
    page.getByRole("switch", { name: "Disabled switch" }),
  ).toBeDisabled();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("agent endpoints are actual text and missing files return 404", async ({
  request,
}) => {
  for (const path of [
    "/llms.txt",
    "/agent/DESIGN.md",
    "/agent/SKILL.md",
    "/schema/config.json",
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).not.toContain("text/html");
  }
  expect((await request.get("/agent/missing.md")).status()).toBe(404);
});
