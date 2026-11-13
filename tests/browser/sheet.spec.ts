import { expect, test } from "@playwright/test";

test.use({ hasTouch: true, viewport: { width: 390, height: 740 }, reducedMotion: "reduce" });

test("mobile studio choices use a bottom sheet and only commit selected options", async ({ page }) => {
  await page.goto("/components/overflow-actions");
  const trigger = page.getByRole("button", { name: "Shape: pill", exact: true });
  const sheet = page.getByRole("dialog", { name: "Shape", exact: true });
  await trigger.tap();
  await expect(sheet.getByRole("option", { name: "pill", exact: true })).toHaveAttribute("aria-selected", "true");
  const bounds = (await sheet.boundingBox())!;
  expect(bounds.width).toBe(390);
  expect(bounds.y + bounds.height).toBeCloseTo(740, 0);
  expect(bounds.height).toBeLessThan(240);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.tap();
  await sheet.getByRole("option", { name: "rounded", exact: true }).tap();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("button", { name: "Shape: rounded", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "View options" }).tap();
  const view = page.getByRole("dialog", { name: "Preview options" });
  await view.getByRole("button", { name: "Frame width: Auto width" }).tap();
  const widths = page.getByRole("dialog", { name: "Frame width" });
  await widths.getByRole("option", { name: "390 px", exact: true }).tap();
  await expect(widths).toBeHidden();
  await expect(view.getByRole("button", { name: "Frame width: 390 px" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(view).toBeHidden();
});

test("Sheet keeps the close action and footer reachable while the body scrolls", async ({ page }) => {
  await page.goto("/components/sheet");
  await page.getByRole("checkbox", { name: "Sheet prop longContent" }).check();
  await page.getByRole("checkbox", { name: "Sheet prop showFooter" }).check();
  const trigger = page.getByRole("button", { name: "Open settings", exact: true });
  await trigger.tap();
  const sheet = page.getByRole("dialog", { name: "Project settings" });
  const body = sheet.locator(".flood-overlay-body");
  await expect.poll(() => body.evaluate(node => node.scrollHeight - node.clientHeight)).toBeGreaterThan(0);
  await sheet.getByText(/^Project note 12:/).scrollIntoViewIfNeeded();
  await expect(sheet.getByText(/^Project note 12:/)).toBeInViewport();
  const close = sheet.getByRole("button", { name: "Close", exact: true });
  await expect(close).toBeInViewport();
  await expect(sheet.getByRole("button", { name: "Save changes" })).toBeInViewport();
  await close.tap();
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("narrow catalog and reference sheets align their headings and content", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/components/overflow-actions");
  const openCatalog = page.getByRole("button", { name: "Components", exact: true });
  await openCatalog.tap();
  const catalog = page.getByRole("dialog", { name: "Components", exact: true });
  await expect(catalog.getByRole("navigation", { name: "Component list" })).toBeFocused();
  const catalogViewport = catalog.locator(".flood-overlay-body");
  await expect.poll(() => catalogViewport.evaluate(node => {
    const row = node.querySelector(".catalog-link")!.getBoundingClientRect();
    return Math.abs(node.getBoundingClientRect().right - row.right);
  })).toBeLessThanOrEqual(1);
  const catalogGeometry = await catalog.evaluate(panel => {
    const title = panel.querySelector(".flood-overlay-title")!;
    const textStart = (element: Element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return range.getBoundingClientRect().left;
    };
    const center = (element: Element) => {
      const box = element.getBoundingClientRect();
      return box.top + box.height / 2;
    };
    return {
      title: textStart(title),
      all: textStart(panel.querySelector(".catalog-link")!),
      row: textStart(panel.querySelector('[aria-current="page"] .catalog-item-name')!),
      centers: center(title) - center(panel.querySelector(".flood-overlay-close")!),
    };
  });
  expect(Math.abs(catalogGeometry.title - catalogGeometry.all)).toBeLessThanOrEqual(1);
  expect(Math.abs(catalogGeometry.title - catalogGeometry.row)).toBeLessThanOrEqual(1);
  expect(Math.abs(catalogGeometry.centers)).toBeLessThanOrEqual(1);
  await page.keyboard.press("Tab");
  await expect(catalog.getByRole("button", { name: "Close", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Reference Alt R", exact: true }).tap();
  const reference = page.getByRole("dialog", { name: "Component reference" });
  const usage = reference.locator("#usage");
  await expect(usage).toBeFocused();
  await expect(usage).toHaveCSS("outline-style", "none");
  const code = reference.getByRole("group", { name: "overflow-actions.tsx source code" });
  await expect.poll(() => code.evaluate(node => node.scrollWidth - node.clientWidth)).toBeGreaterThan(0);
  const [name, copy] = await Promise.all([
    reference.locator(".site-code-block__filename").boundingBox(),
    reference.getByRole("button", { name: "Copy code", exact: true }).boundingBox(),
  ]);
  expect(Math.abs(name!.y + name!.height / 2 - copy!.y - copy!.height / 2)).toBeLessThanOrEqual(1);
});
