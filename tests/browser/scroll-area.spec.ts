import { chromium, test, expect, type Page } from "@playwright/test";
import { build } from "vite";
import { resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { chooseSelectOption } from "./select-helpers";

let bundle: Promise<string> | undefined;
async function fixture() {
  const file = (path: string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  const source = `import React,{useState}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,ScrollArea,Button,Inline,Stack}from ${file("packages/react/dist/index.js")};
import ${file("packages/react/dist/styles.css")};
const h=React.createElement;
function Example(){const[rows,setRows]=useState(30),[height,setHeight]=useState(160),[rtl,setRtl]=useState(false);
const controls=h(Inline,null,h(Button,{onClick:()=>setRows(60)},'Add content'),h(Button,{onClick:()=>setRows(2)},'Short content'),h(Button,{onClick:()=>setHeight(240)},'Enlarge viewport'),h(Button,{onClick:()=>setRtl(v=>!v)},'Toggle direction'));
const content=h('div',{style:{width:560}},...Array.from({length:rows},(_,i)=>h('div',{key:i,style:{height:30}},'Activity row '+(i+1))));
return h(FloodRoot,{style:{padding:'1rem'}},h('h1',null,'Overlay scrollbar fixture'),h(Stack,null,controls,h(ScrollArea,{'aria-label':'Activity',orientation:'both',dir:rtl?'rtl':'ltr',style:{width:280,height}},content)));}
createRoot(document.getElementById('app')).render(h(Example));`;
  const entry = resolve(`.artifacts/scroll-area-contract-${process.pid}/entry.mjs`);
  await mkdir(resolve(`.artifacts/scroll-area-contract-${process.pid}`), { recursive: true }); await writeFile(entry, source);
  const result = await build({ configFile: false, logLevel: "silent", define: { "process.env.NODE_ENV": JSON.stringify("production") }, build: { write: false, minify: true, cssCodeSplit: false, lib: { entry, formats: ["iife"], name: "ScrollAreaFixture" } } });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((item) => "output" in item ? item.output : []);
  const js = outputs.filter((item) => item.type === "chunk").map((item) => item.type === "chunk" ? item.code : "").join("\n");
  const css = outputs.filter((item) => item.type === "asset" && item.fileName.endsWith(".css")).map((item) => item.type === "asset" ? String(item.source) : "").join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>ScrollArea</title><style>body{margin:0}${css}</style></head><body><main id="app"></main><script>${js.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
}
async function open(page: Page, enhanced = true) {
  bundle ??= fixture(); const html = await bundle;
  await page.route("**/__flood-scroll-area.html", (route) => route.fulfill({ contentType: "text/html", body: html }));
  await page.goto("/__flood-scroll-area.html");
  const viewport = page.getByRole("region", { name: "Activity" });
  await expect(viewport).toBeVisible();
  if (enhanced) await expect(viewport).toHaveAttribute("data-scrollbars", "overlay");
  else await expect(viewport).not.toHaveAttribute("data-scrollbars", "overlay");
}

test("overlay tracks are inset above content and consume no viewport layout width", async ({ page }, info) => {
  await open(page);
  const viewport = page.getByRole("region", { name: "Activity" });
  const wrapper = viewport.locator("..");
  await expect(viewport).toHaveCSS("scrollbar-width", "none");
  expect(await viewport.evaluate((node) => node.clientWidth)).toBe(280);
  const nativeGutter = await page.evaluate(() => {
    const probe = document.createElement("div"), content = document.createElement("div");
    probe.style.cssText = "position:fixed;left:-10000px;width:280px;height:160px;overflow:scroll";
    content.style.cssText = "width:560px;height:900px"; probe.appendChild(content); document.body.appendChild(probe);
    const result = { userAgent: navigator.userAgent, width: probe.clientWidth, height: probe.clientHeight, horizontalGutter: 160 - probe.clientHeight, verticalGutter: 280 - probe.clientWidth };
    probe.remove(); return result;
  });
  await info.attach("native-versus-overlay-layout.json", { body: JSON.stringify({ native: nativeGutter, overlay: { width: 280, height: 160 } }, null, 2), contentType: "application/json" });
  const box = (await viewport.boundingBox())!, rail = wrapper.locator(".flood-scroll-area__track--vertical");
  const railBox = (await rail.boundingBox())!;
  expect(railBox.width).toBe(6);
  expect(box.x + box.width - railBox.x - railBox.width).toBeCloseTo(4, 1);
  expect(railBox.y - box.y).toBeCloseTo(4, 1);
  await wrapper.screenshot({ path: `.artifacts/scroll-area-overlay-${info.project.name}.png` });
  const thumb = rail.locator(".flood-scroll-area__thumb"), before = (await thumb.boundingBox())!;
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down(); await page.mouse.move(before.x + before.width / 2, before.y + 70, { steps: 8 }); await page.mouse.up();
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await viewport.evaluate((node) => { node.scrollTop = 0; });
  await expect.poll(() => thumb.boundingBox().then((box) => box?.y)).toBeCloseTo(before.y, 1);
  await page.mouse.click(railBox.x + railBox.width / 2, railBox.y + railBox.height - 2);
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(200);
});

test("native wheel and keyboard scrolling survive content and viewport changes", async ({ page }) => {
  await open(page);
  const viewport = page.getByRole("region", { name: "Activity" }), wrapper = viewport.locator("..");
  const thumb = wrapper.locator(".flood-scroll-area__track--vertical .flood-scroll-area__thumb");
  const box = (await viewport.boundingBox())!;
  await page.mouse.move(box.x + 80, box.y + 60); await page.mouse.wheel(0, 220);
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await viewport.evaluate((node) => { node.scrollTop = 0; }); await viewport.focus(); await page.keyboard.press("PageDown");
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  const initial = (await thumb.boundingBox())!.height;
  await page.getByRole("button", { name: "Enlarge viewport" }).click();
  await expect.poll(() => thumb.boundingBox().then((box) => box!.height)).toBeGreaterThan(initial + 5);
  const enlarged = (await thumb.boundingBox())!.height;
  await page.getByRole("button", { name: "Add content" }).click();
  await expect.poll(() => thumb.boundingBox().then((box) => box!.height)).toBeLessThan(enlarged - 5);
  await page.getByRole("button", { name: "Short content" }).click();
  await expect(wrapper.locator(".flood-scroll-area__track--vertical")).toHaveCount(0);
});

test("RTL horizontal geometry and forced-colors native fallback remain operable", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Toggle direction" }).click();
  const viewport = page.getByRole("region", { name: "Activity" }), wrapper = viewport.locator("..");
  const vertical = wrapper.locator(".flood-scroll-area__track--vertical");
  await expect.poll(async () => (await vertical.boundingBox())!.x - (await viewport.boundingBox())!.x).toBeCloseTo(4, 1);
  const rail = wrapper.locator(".flood-scroll-area__track--horizontal"), thumb = rail.locator(".flood-scroll-area__thumb");
  const initial = (await thumb.boundingBox())!;
  await page.mouse.move(initial.x + initial.width / 2, initial.y + initial.height / 2); await page.mouse.down();
  await page.mouse.move(initial.x + initial.width / 2 - 60, initial.y + initial.height / 2, { steps: 8 }); await page.mouse.up();
  await expect.poll(() => viewport.evaluate((node) => Math.abs(node.scrollLeft))).toBeGreaterThan(0);
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await expect(viewport).toHaveCSS("scrollbar-width", "auto");
  await expect(rail).toBeHidden(); await viewport.focus(); await page.keyboard.press("PageDown");
  await expect(viewport).toBeFocused();
});

test("rail wheel chains at the edge unless the viewport explicitly contains overscroll", async ({ page }) => {
  await open(page);
  const viewport = page.getByRole("region", { name: "Activity" });
  const rail = viewport.locator("..").locator(".flood-scroll-area__track--vertical");
  await page.evaluate(() => { const spacer = document.createElement("div"); spacer.style.height = "2000px"; document.body.appendChild(spacer); });
  await viewport.evaluate((node) => { node.scrollTop = node.scrollHeight; });
  const cancelled = () => rail.evaluate((node) => { const event = new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true }); node.dispatchEvent(event); return event.defaultPrevented; });
  expect(await cancelled()).toBe(false);
  const box = (await rail.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.wheel(0, 140);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await viewport.evaluate((node) => { node.style.overscrollBehavior = "contain"; });
  expect(await cancelled()).toBe(true);
});

test("classic browser scrollbars reserve space while ScrollArea still overlays the full viewport", async ({}, info) => {
  const browser = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"], args: ["--disable-features=OverlayScrollbar,FluentOverlayScrollbar,FluentScrollbar"] });
  try {
    const context = await browser.newContext({ baseURL: "http://127.0.0.1:4173", viewport: { width: 700, height: 600 } });
    const page = await context.newPage(); await open(page);
    const native = await page.evaluate(() => {
      const probe = document.createElement("div"), content = document.createElement("div");
      probe.style.cssText = "position:fixed;left:-10000px;width:280px;height:160px;overflow:scroll";
      content.style.cssText = "width:560px;height:900px"; probe.appendChild(content); document.body.appendChild(probe);
      const result = { width: probe.clientWidth, height: probe.clientHeight }; probe.remove(); return result;
    });
    expect(native.width).toBeLessThan(280); expect(native.height).toBeLessThan(160);
    const viewport = page.getByRole("region", { name: "Activity" });
    expect(await viewport.evaluate((node) => ({ width: node.clientWidth, height: node.clientHeight }))).toEqual({ width: 280, height: 160 });
    await viewport.locator("..").screenshot({ path: `.artifacts/scroll-area-classic-overlay-${info.project.name}.png` });
    await info.attach("classic-gutter-proof.json", { body: JSON.stringify({ native, overlay: { width: 280, height: 160 } }), contentType: "application/json" });
  } finally { await browser.close(); }
});

test("touch swipes scroll the native viewport without dragging overlay chrome", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: "http://127.0.0.1:4173", hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage(); await open(page);
    const viewport = page.getByRole("region", { name: "Activity" }), box = (await viewport.boundingBox())!;
    const session = await context.newCDPSession(page);
    const point = (y: number) => [{ x: box.x + 80, y, id: 1, radiusX: 5, radiusY: 5, force: 1 }];
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point(box.y + 130) });
    for (let step = 1; step <= 8; step++) {
      await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: point(box.y + 130 - step * 12) });
      await page.waitForTimeout(20);
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  } finally { await context.close(); }
});

test("without ResizeObserver the accessible native scrolling fallback stays available", async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, "ResizeObserver", { value: undefined, configurable: true }); });
  await open(page, false);
  const viewport = page.getByRole("region", { name: "Activity" });
  await expect(viewport).toHaveCSS("scrollbar-width", "auto");
  await expect(viewport.locator("..").locator(".flood-scroll-area__track")).toHaveCount(0);
  await viewport.focus(); await page.keyboard.press("PageDown");
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
});


test("explorer orientation choices demonstrate the selected axes without clipping the other content", async ({ page }) => {
  await page.goto("/components/scroll-area");
  const viewport = page.locator(".preview-stage").getByRole("region", { name: "Project notes" });
  await expect(viewport).toHaveAttribute("data-scrollbars", "overlay");
  const orientation = page.getByRole("combobox", { name: "ScrollArea prop orientation", exact: true });
  for (const axis of ["horizontal", "both", "vertical"]) {
    await chooseSelectOption(orientation, axis);
    await expect(viewport).toHaveAttribute("data-orientation", axis);
    await expect.poll(() => viewport.evaluate(node => ({ x: node.scrollWidth > node.clientWidth + 1, y: node.scrollHeight > node.clientHeight + 1 }))).toEqual({ x: axis !== "vertical", y: axis !== "horizontal" });
    await expect(page.locator("#usage .site-code-block code")).toContainText(`orientation="${axis}"`);
  }
});
