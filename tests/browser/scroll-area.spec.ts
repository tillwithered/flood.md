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
const navigation=h(ScrollArea,{'aria-label':'Navigation',dir:rtl?'rtl':'ltr',style:{width:280,height}},
...Array.from({length:rows},(_,i)=>h('button',{key:i,style:{display:'block',width:'100%',height:30}},'Navigation row '+(i+1))));
return h(FloodRoot,{style:{padding:'1rem'}},h('h1',null,'Overlay scrollbar fixture'),
h(Stack,null,controls,h(ScrollArea,{'aria-label':'Activity',orientation:'both',dir:rtl?'rtl':'ltr',style:{width:280,height}},content),navigation));}
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
  test.skip(browser.browserType().name() !== "chromium", "This gesture fixture uses Chromium CDP; wheel, keyboard and drag coverage runs on every engine.");
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
  const inset = page.getByRole("combobox", { name: "ScrollArea prop contentInset", exact: true });
  const content = viewport.locator(".flood-scroll-area__content");
  await expect(content).toHaveCSS("padding-inline-end", "14px");
  expect(await viewport.evaluate(node => {
    const rail = node.parentElement!.querySelector(".flood-scroll-area__track--vertical")!.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(node.querySelector("p")!);
    return [...range.getClientRects()].every(line => line.right <= rail.left - 3.9);
  })).toBe(true);
  await expect(page.locator("#usage .site-code-block code")).toContainText('contentInset="scrollbar"');
  await chooseSelectOption(inset, "none");
  await expect(content).toHaveCSS("padding-inline-end", "0px");
  await chooseSelectOption(inset, "scrollbar");
  await expect(content).toHaveCSS("padding-inline-end", "14px");
  const orientation = page.getByRole("combobox", { name: "ScrollArea prop orientation", exact: true });
  for (const axis of ["horizontal", "both", "vertical"]) {
    await chooseSelectOption(orientation, axis);
    await expect(viewport).toHaveAttribute("data-orientation", axis);
    await expect.poll(() => viewport.evaluate(node => ({ x: node.scrollWidth > node.clientWidth + 1, y: node.scrollHeight > node.clientHeight + 1 }))).toEqual({ x: axis !== "vertical", y: axis !== "horizontal" });
    await expect(page.locator("#usage .site-code-block code")).toContainText(`orientation="${axis}"`);
  }
});

test("rails avoid viewport and ancestor corner curves without adding a gutter", async ({ page }, info) => {
  await open(page);
  const viewport = page.getByRole("region", { name: "Activity" }), wrapper = viewport.locator("..");
  const vertical = wrapper.locator(".flood-scroll-area__track--vertical");
  const horizontal = wrapper.locator(".flood-scroll-area__track--horizontal");
  const gap = async () => {
    const box = (await viewport.boundingBox())!, rail = (await vertical.boundingBox())!;
    return { top: rail.y - box.y, bottom: box.y + box.height - rail.y - rail.height };
  };
  await viewport.evaluate(node => { node.style.borderRadius = "32px"; });
  await expect.poll(async () => (await gap()).top).toBeCloseTo(36, 1);
  await expect.poll(async () => (await gap()).bottom).toBeCloseTo(36, 1);
  await expect.poll(async () => {
    const box = (await viewport.boundingBox())!, rail = (await horizontal.boundingBox())!;
    return box.x + box.width - rail.x - rail.width;
  }).toBeCloseTo(36, 1);
  await viewport.evaluate(node => { node.style.borderRadius = "0"; });
  await wrapper.evaluate(node => { node.style.overflow = "hidden"; node.style.borderRadius = "0 0 32px 32px"; });
  await expect.poll(async () => (await gap()).top).toBeCloseTo(4, 1);
  await expect.poll(async () => (await gap()).bottom).toBeCloseTo(36, 1);
  expect(await viewport.evaluate(node => node.clientWidth)).toBe(280);
  await viewport.evaluate(node => { node.scrollTop = node.scrollHeight; });
  await expect.poll(async () => {
    const box = (await viewport.boundingBox())!, thumb = (await vertical.locator(".flood-scroll-area__thumb").boundingBox())!;
    return box.y + box.height - thumb.y - thumb.height;
  }).toBeCloseTo(36, 1);
  await wrapper.screenshot({ path: `.artifacts/scroll-area-rounded-${info.project.name}.png` });
  await wrapper.evaluate(node => { node.style.borderRadius = "0"; });
  await expect.poll(async () => (await gap()).bottom).toBeCloseTo(14, 1);
});

test("default content inset keeps full-width rows clear of the rail in LTR and RTL", async ({ page }) => {
  await open(page);
  const viewport = page.getByRole("region", { name: "Navigation" });
  const rail = viewport.locator("..").locator(".flood-scroll-area__track--vertical");
  const row = viewport.getByRole("button", { name: "Navigation row 1", exact: true });
  await expect(viewport).toHaveAttribute("data-scrollbars", "overlay");
  await expect.poll(async () => {
    const item = (await row.boundingBox())!, track = (await rail.boundingBox())!;
    return track.x - item.x - item.width;
  }).toBeCloseTo(4, 1);
  expect(await viewport.evaluate(node => node.clientWidth)).toBe(280);
  await page.getByRole("button", { name: "Toggle direction" }).click();
  await expect.poll(async () => {
    const item = (await row.boundingBox())!, track = (await rail.boundingBox())!;
    return item.x - track.x - track.width;
  }).toBeCloseTo(4, 1);
  await page.emulateMedia({ forcedColors: "active" });
  await expect(viewport.locator(".flood-scroll-area__content")).toHaveCSS("padding-inline-end", "0px");
  await expect(rail).toBeHidden();
  await page.emulateMedia({ forcedColors: "none" });
  await page.getByRole("button", { name: "Short content" }).click();
  await expect(rail).toHaveCount(0);
  await expect(viewport.locator(".flood-scroll-area__content")).toHaveCSS("padding-inline-end", "0px");
});

test("documentation navigation row backgrounds end before the overlay rail", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "Desktop sidebar is intentionally hidden on mobile");
  await page.goto("/components/scroll-area");
  const viewport = page.getByRole("region", { name: "Documentation sections scroll" });
  const selected = viewport.locator('[aria-current="page"]');
  const rail = viewport.locator("..").locator(".flood-scroll-area__track--vertical");
  await expect(rail).toBeVisible();
  await expect.poll(async () => {
    const item = (await selected.boundingBox())!, track = (await rail.boundingBox())!;
    return track.x - item.x - item.width;
  }).toBeGreaterThanOrEqual(3.9);
  await viewport.locator("..").screenshot({ path: ".artifacts/scroll-area-sidebar-safe.png" });
});
