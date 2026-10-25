import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { chooseSelectOption } from "./select-helpers";

test("Progress exposes known and unknown values and keeps its label when hidden", async ({ page }) => {
  await page.goto("/components/progress");
  const stage = page.locator(".workbench-stage");
  const bar = stage.getByRole("progressbar", { name: "Uploading files" });
  await expect(bar).toHaveAttribute("aria-valuenow", "50");
  await chooseSelectOption(page.getByRole("combobox", { name: "Progress prop value" }), "0");
  await expect(bar).toHaveAttribute("aria-valuenow", "0");
  await chooseSelectOption(page.getByRole("combobox", { name: "Progress prop value" }), "100");
  await expect(bar).toHaveAttribute("aria-valuenow", "100");
  await page.getByRole("checkbox", { name: "Progress prop indeterminate" }).check();
  await expect(bar).not.toHaveAttribute("aria-valuenow");
  const trackTop = await bar.evaluate(el => el.getBoundingClientRect().top + scrollY);
  await page.getByRole("checkbox", { name: "Progress prop hideLabel" }).check();
  await expect(bar).toBeVisible();
  expect(await bar.evaluate(el => el.getBoundingClientRect().top + scrollY)).toBeCloseTo(trackTop, 1);
  await expect(stage.locator(".flood-indicator > div").first()).toHaveClass("flood-visually-hidden");
  await expect(stage.getByRole("status")).toHaveCount(0);
  await expect(page.locator("#usage .site-code-block code")).toContainText("hideLabel={true}");
});

test("Meter communicates units and its fill follows value and RTL direction", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/components/meter");
  const bar = page.locator(".workbench-stage").getByRole("meter", { name: "Storage used" });
  await chooseSelectOption(page.getByRole("combobox", { name: "Meter prop value" }), "25");
  await expect(bar).toHaveAttribute("aria-valuetext", "25 of 100 GB");
  const fill = bar.locator(".flood-indicator__fill");
  const geometry = await bar.evaluate(el => { const a=el.getBoundingClientRect(),b=el.firstElementChild!.getBoundingClientRect(); return {ratio:b.width/a.width,start:Math.abs(a.left-b.left)}; });
  expect(geometry.ratio).toBeCloseTo(.25, 2); expect(geometry.start).toBeLessThan(1);
  await page.evaluate(() => { document.documentElement.dir="rtl"; });
  expect(await bar.evaluate(el => Math.abs(el.getBoundingClientRect().right-el.firstElementChild!.getBoundingClientRect().right))).toBeLessThan(1);
  await expect(fill).toHaveCSS("transition-duration", "0s");
});

test("Alert defaults to static content, supports explicit urgency and preserves focus", async ({ page }) => {
  await page.goto("/components/alert");
  const stage = page.locator(".workbench-stage");
  const alert = stage.locator(".flood-alert");
  await expect(alert).not.toHaveAttribute("role");
  await chooseSelectOption(page.getByRole("combobox", { name: "Alert prop announcement" }), "polite");
  await expect(stage.getByRole("status")).toBeVisible();
  await chooseSelectOption(page.getByRole("combobox", { name: "Alert prop announcement" }), "assertive");
  await expect(stage.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Alert prop announcement" })).toBeFocused();
  await page.getByRole("checkbox", { name: "Alert prop showIcon" }).uncheck();
  await expect(alert.locator(".flood-alert__icon")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Alert prop showTitle" }).uncheck();
  await expect(alert.locator(".flood-alert__title")).toHaveCount(0);
  await expect(alert).toContainText("Your work stays here");
});

test("feedback examples remain accessible and reflow at enlarged text", async ({ page }, info) => {
  await page.goto("/playground/content#feedback");
  const section=page.locator("#feedback");
  await expect(section.getByRole("progressbar")).toHaveCount(2);
  await expect(section.getByRole("meter")).toHaveCount(2);
  await section.getByRole("button",{name:"Advance",exact:true}).click();
  await expect(section.getByRole("progressbar",{name:"Uploading files"})).toHaveAttribute("aria-valuenow","80");
  await section.getByRole("button",{name:"Indeterminate",exact:true}).click();
  await expect(section.getByRole("progressbar",{name:"Uploading files"})).not.toHaveAttribute("aria-valuenow");
  await expect(section.getByRole("alert")).toHaveCount(0);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.setViewportSize({width:320,height:900});
  await page.evaluate(()=>{document.documentElement.style.fontSize="24px";document.documentElement.dir="rtl";});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.emulateMedia({reducedMotion:"reduce",forcedColors:"active"});
  await expect(section.locator('[data-indeterminate="true"] .flood-indicator__fill')).toHaveCSS("animation-name","none");
  await expect(section.getByRole("progressbar").first()).toHaveCSS("outline-style","solid");
  await page.emulateMedia({reducedMotion:"reduce",forcedColors:"none"});
  await page.setViewportSize(info.project.name==="desktop"?{width:1440,height:1000}:{width:390,height:844});
  await page.evaluate(()=>{document.documentElement.style.fontSize="";document.documentElement.dir="ltr";});
  await section.screenshot({path:`.artifacts/feedback-${info.project.name}.png`});
});
