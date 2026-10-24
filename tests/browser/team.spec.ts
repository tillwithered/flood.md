import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const url = "http://127.0.0.1:3001/team";

test("team settings validate, save native form values and reset", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  await expect(page.getByRole("heading", { name: "Настройки команды", level: 1 })).toBeVisible();
  const section = page.getByRole("region", { name: "Общие настройки" });
  const name = section.getByRole("textbox", { name: "Название команды" });
  await name.fill(" ");
  await section.getByRole("button", { name: "Сохранить изменения" }).click();
  await expect(section.getByRole("alert")).toHaveText("Укажите название команды");
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await name.fill("Flood research");
  await section.getByRole("textbox", { name: "Описание команды" }).fill("Новая команда");
  const toggle = section.getByRole("switch", { name: "Публичный профиль команды" });
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toBeChecked();
  await section.getByRole("checkbox", { name: "Получать новости проекта на почту" }).uncheck();
  await section.getByRole("button", { name: "Сохранить изменения" }).click();
  await expect(section.getByRole("status")).toContainText("Настройки «Flood research» сохранены в демо");
  expect(JSON.parse(await page.getByTestId("team-form-data").textContent() ?? "{}")).toEqual({
    name: "Flood research", description: "Новая команда", public: "yes",
  });
  await section.getByRole("button", { name: "Сбросить", exact: true }).click();
  await expect(name).toHaveValue("Flood studio");
  await expect(toggle).not.toBeChecked();
  await expect(section.getByRole("checkbox")).toBeChecked();
  await expect(section.getByRole("status")).toBeEmpty();
  expect(errors).toEqual([]);
});

test("members are added locally with their role, duplicates rejected and owner protected", async ({ page }) => {
  await page.goto(url);
  const section = page.getByRole("region", { name: "Участники", exact: true });
  const email = section.getByRole("textbox", { name: "Email нового участника" });
  const submit = section.getByRole("button", { name: "Добавить в демо", exact: true });
  await submit.click();
  await expect(section.getByRole("alert")).toHaveText("Укажите корректный email");
  await expect(email).toBeFocused();
  await email.fill("maria@example.com");
  await submit.click();
  await expect(section.getByRole("alert")).toHaveText("Этот участник уже в команде");
  await email.fill("new@example.com");
  const viewer = section.getByRole("radio", { name: "Наблюдатель", exact: true });
  await viewer.focus();
  await page.keyboard.press("Space");
  await expect(viewer).toBeChecked();
  await submit.click();
  const member = section.getByRole("listitem").filter({ hasText: "new@example.com" });
  await expect(member).toContainText("Наблюдатель");
  await expect(section.getByRole("status")).toContainText("Письмо не отправлено");
  await expect(email).toBeEmpty();
  await expect(section.getByRole("button", { name: "Удалить alex@example.com", exact: true })).toBeDisabled();
  await member.getByRole("button", { name: "Удалить new@example.com", exact: true }).click();
  await expect(member).toHaveCount(0);
  await expect(section.getByRole("listitem")).toHaveCount(2);
});

test("team composition is accessible and reflows with increased text and reduced motion", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `.artifacts/team-${testInfo.project.name}.png`, fullPage: true });
  await page.locator("#team-root").evaluate((root) => { root.setAttribute("data-layout", "split"); });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `.artifacts/team-split-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole("link", { name: "Участники", exact: true }).click();
  await expect(page).toHaveURL(/#members$/);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "24px";
    const override = document.createElement("style");
    override.textContent = "#team-root * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } #team-root p { margin-bottom: 2em !important; }";
    document.head.append(override);
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#team-root").evaluate((root) => { root.setAttribute("data-layout", "grouped"); });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const input = page.getByRole("textbox", { name: "Название команды" });
  await input.scrollIntoViewIfNeeded();
  const before = await input.boundingBox();
  await input.focus();
  await expect(input).toHaveCSS("border-top-width", "2px");
  expect(await input.boundingBox()).toEqual(before);
  await expect(page.getByRole("button", { name: "Сохранить изменения", exact: true })).toHaveCSS("transition-duration", "0s");
});
