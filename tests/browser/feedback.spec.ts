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
  const trackTop = () => bar.evaluate(el => {
    const canvas = el.closest(".preview-stage")!;
    return el.getBoundingClientRect().top - canvas.getBoundingClientRect().top + canvas.scrollTop;
  });
  const before = await trackTop();
  await page.getByRole("checkbox", { name: "Progress prop hideLabel" }).check();
  await expect(bar).toBeVisible();
  expect(await trackTop()).toBeCloseTo(before, 1);
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

test("Meter places a named reference on its existing scale in both directions", async ({page}) => {
  await page.goto("/components/meter");
  const meter = page.locator(".preview-stage").getByRole("meter", {name:"Storage used"});
  await page.getByRole("checkbox", {name:"Meter prop reference"}).check();
  await expect(meter).toHaveAccessibleDescription("Included storage · 75 GB");
  for (const direction of ["ltr", "rtl"]) {
    await meter.evaluate((node, dir) => node.setAttribute("dir", dir), direction);
    const track = (await meter.boundingBox())!;
    const marker = (await meter.locator(".flood-indicator__reference").boundingBox())!;
    const logicalStart = direction === "ltr" ? track.x : track.x + track.width;
    expect(Math.abs(marker.x + marker.width / 2 - logicalStart) / track.width).toBeCloseTo(.75, 2);
  }
});

test("CapacityMeter preserves the fixed scale and reports actual usage above it", async ({page}) => {
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/components/capacity-meter");
  const indicator = page.locator(".preview-stage .flood-indicator");
  const meter = indicator.getByRole("meter", {name:"Storage used"});
  const select = page.getByRole("combobox", {name:"CapacityMeter prop used"});
  await expect(indicator).toHaveAttribute("data-capacity-state", "warning");
  await chooseSelectOption(select, "0");
  await expect(meter).toHaveAttribute("aria-valuenow", "0");
  await expect(indicator).toHaveAttribute("data-capacity-state", "normal");
  await chooseSelectOption(select, "100");
  const full = await meter.boundingBox();
  await chooseSelectOption(select, "112");
  await expect(indicator).toHaveAttribute("data-capacity-state", "over");
  await expect(meter).toHaveAttribute("aria-valuemax", "100");
  await expect(meter).toHaveAttribute("aria-valuenow", "100");
  await expect(meter).toHaveAttribute("aria-valuetext", "112 / 100 GB");
  await expect(indicator.getByText("112 / 100 GB")).toBeVisible();
  expect(await meter.boundingBox()).toEqual(full);
});

for (const [component, role, label] of [
  ["Progress", "progressbar", "Uploading files"],
  ["Meter", "meter", "Storage used"],
] as const) {
  test(`${component} keeps the inline caption and gives the track a full row when narrow`, async ({ page }) => {
    await page.goto(`/components/${component.toLowerCase()}`);
    const indicator = page.locator(".preview-stage .flood-indicator");
    const track = indicator.getByRole(role, { name: label });
    const caption = indicator.locator(".flood-indicator__caption");
    await chooseSelectOption(page.getByRole("combobox", {name:`${component} prop layout`}), "inline");
    const [labelBox, trackBox] = await Promise.all([caption.boundingBox(), track.boundingBox()]);
    expect(trackBox!.x).toBeGreaterThan(labelBox!.x + labelBox!.width);
    expect(trackBox!.y + trackBox!.height / 2).toBeCloseTo(labelBox!.y + labelBox!.height / 2, 0);
    await page.getByRole("checkbox", {name:`${component} prop narrow`}).check();
    const [narrowLabel, narrowTrack, bounds] = await Promise.all([caption.boundingBox(), track.boundingBox(), indicator.boundingBox()]);
    expect(narrowTrack!.y).toBeGreaterThan(narrowLabel!.y + narrowLabel!.height);
    expect(narrowTrack!.width).toBeCloseTo(bounds!.width, 0);
    await page.getByRole("checkbox", {name:`${component} prop hideLabel`}).check();
    await expect(track).toBeVisible();
    expect((await track.boundingBox())!.y).toBeCloseTo((await indicator.boundingBox())!.y, 0);
  });
}

test("ProgressRing keeps its semantics and geometry through empty, full and unknown values", async ({ page }) => {
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/components/progress-ring");
  const root = page.locator(".preview-stage .flood-indicator");
  const ring = root.getByRole("progressbar",{name:"Exporting project files"});
  const fill = ring.locator(".flood-indicator__ring-fill");
  const value = page.getByRole("combobox",{name:"ProgressRing prop value"});
  const initial = (await ring.boundingBox())!;
  await expect(ring).toHaveAttribute("aria-valuetext","50%");
  await expect(ring).not.toHaveAttribute("tabindex");
  await chooseSelectOption(value,"0");
  await expect(ring).toHaveAttribute("aria-valuenow","0");
  await expect(fill).toHaveCSS("stroke-linecap","butt");
  await chooseSelectOption(value,"100");
  await expect(ring).toHaveAttribute("aria-valuenow","100");
  await expect(fill).toHaveCSS("stroke-dasharray","100px, 100px");
  await page.getByRole("checkbox",{name:"ProgressRing prop indeterminate"}).check();
  await expect(ring).not.toHaveAttribute("aria-valuenow");
  await expect(ring.locator("svg")).toHaveCSS("animation-name","none");
  await page.getByRole("checkbox",{name:"ProgressRing prop narrow"}).check();
  await expect(ring).toBeVisible();
  expect((await ring.boundingBox())!.width).toBe(initial.width);
  expect(await root.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
  await page.getByRole("checkbox",{name:"ProgressRing prop hideLabel"}).check();
  await expect(ring).toHaveAccessibleName("Exporting project files");
  await expect(root.locator(".flood-indicator__caption")).toHaveCount(0);
  await page.emulateMedia({reducedMotion:"reduce",forcedColors:"active"});
  await expect(fill).not.toHaveCSS("stroke",await ring.locator(".flood-indicator__ring-track").evaluate(node=>getComputedStyle(node).stroke));
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
  await page.getByRole("checkbox", { name: "Alert prop showIcon" }).check();
  await page.getByRole("checkbox", { name: "Alert prop showAction" }).check();
  await chooseSelectOption(page.getByRole("combobox", { name: "Alert prop tone" }), "warning");
  const action = alert.getByRole("button", { name: "View usage" });
  const message = (await alert.getByRole("alert").boundingBox())!;
  const glyph = (await alert.locator(".flood-alert__icon").boundingBox())!;
  expect(glyph.y + glyph.height / 2).toBeCloseTo(message.y + message.height / 2, 0);
  await action.hover();
  await expect(action).toHaveCSS("background-color", /color\(srgb /);
  const warningHover = await action.evaluate(node => getComputedStyle(node).backgroundColor);
  await chooseSelectOption(page.getByRole("combobox", { name: "Alert prop tone" }), "success");
  await action.hover();
  await expect(action).toHaveCSS("background-color", /color\(srgb /);
  await expect(action).not.toHaveCSS("background-color", warningHover);
});

test("Alert keeps the action outside its announcement and reflows by available width", async ({page}) => {
  await page.setViewportSize({width:1440,height:940});
  await page.goto("/components/alert");
  await chooseSelectOption(page.getByRole("combobox",{name:"Alert prop announcement"}),"polite");
  await page.getByRole("checkbox",{name:"Alert prop showAction"}).check();
  await page.getByRole("checkbox",{name:"Alert prop showTitle"}).uncheck();
  const alert = page.locator(".preview-stage .flood-alert");
  const message = alert.getByRole("status");
  const button = alert.getByRole("button",{name:"View usage"});
  await expect(message).toHaveText("Storage usage is 92%.");
  await expect(message.getByRole("button")).toHaveCount(0);
  const [wideMessage,wideButton] = await Promise.all([message.boundingBox(),button.boundingBox()]);
  expect(wideMessage!.y + wideMessage!.height / 2).toBeCloseTo(wideButton!.y + wideButton!.height / 2,0);
  await page.getByRole("checkbox",{name:"Alert prop narrow"}).check();
  const [narrowMessage,narrowButton] = await Promise.all([message.boundingBox(),button.boundingBox()]);
  expect(narrowButton!.y).toBeGreaterThan(narrowMessage!.y + narrowMessage!.height);
  expect(await alert.evaluate(node=>node.scrollWidth <= node.clientWidth)).toBe(true);
  await button.press("Enter");
  await expect(button).toBeFocused();
  await expect(page.locator(".workbench-feedback")).toHaveText("Storage opened.");
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
