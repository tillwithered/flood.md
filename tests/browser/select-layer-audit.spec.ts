import { test, expect, type Page } from "@playwright/test";
import { build } from "vite";
import { resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { selectBridge } from "./select-helpers";

let bundle: Promise<string>;
async function fixture() {
  const file = (path: string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  const directory = resolve(`.artifacts/select-layer-audit-${process.pid}`), entry = resolve(directory, "entry.mjs");
  await mkdir(directory, { recursive: true });
  await writeFile(entry, `import React,{StrictMode,useRef,useState}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,Button,Input,Select,Dialog}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};
const h=React.createElement,options=()=>[h('option',{key:'0',value:'0'},'Zero'),h('option',{key:'1',value:'1'},'One'),h('option',{key:'2',value:'2'},'Two')];
function App(){const destination=useRef(),[changes,C]=useState(0),[underlay,U]=useState(0),[focuses,F]=useState(0),[blurs,B]=useState(0);return h(FloodRoot,null,
h('h1',null,'Select layer verification'),
h('div',{id:'scroll-anchor',style:{height:'12rem',width:'18rem',maxWidth:'100%',overflow:'auto'}},h('div',{style:{height:'6rem'}}),h(Select,{'aria-label':'Scrolling select',defaultValue:'1',style:{width:'14rem'}},...options()),h('div',{style:{height:'30rem'}})),
h(Input,{ref:destination,'aria-label':'Host destination'}),
h(Select,{'aria-label':'Moving select',defaultValue:'1',onFocus:()=>F(n=>n+1),onBlur:()=>B(n=>n+1),onChange:()=>{C(n=>n+1);destination.current.focus()}},...options()),
h(Button,{id:'underlay',style:{display:'none'},onClick:()=>U(n=>n+1)},'Underlying action'),
h('output',{'aria-label':'Changes'},String(changes)),h('output',{'aria-label':'Underlying clicks'},String(underlay)),h('output',{'aria-label':'Native focus callbacks'},String(focuses)),h('output',{'aria-label':'Native blur callbacks'},String(blurs)),
h(Dialog,{title:'Select parent',trigger:props=>h(Button,{...props},'Open select parent')},h(Select,{'aria-label':'Nested select',defaultValue:'1',onBlur:()=>B(n=>n+1)},...options()),h(Button,null,'Dialog next')));
}createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
  const result = await build({ configFile: false, logLevel: "silent", define: { "process.env.NODE_ENV": JSON.stringify("development") }, build: { write: false, minify: true, cssCodeSplit: false, lib: { entry, formats: ["iife"], name: "SelectLayerAuditFixture" } } });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(item => "output" in item ? item.output : []);
  const js = outputs.filter(item => item.type === "chunk").map(item => item.type === "chunk" ? item.code : "").join("\n");
  const css = outputs.filter(item => item.type === "asset" && item.fileName.endsWith(".css")).map(item => item.type === "asset" ? String(item.source) : "").join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Select layer verification</title><style>${css}body{margin:0;min-height:1800px}#app>.flood-root{padding:1rem;display:flex;flex-direction:column;gap:1rem;align-items:flex-start}</style></head><body><main id="app"></main><script>${js.replace(/<\/script/gi,"<\\/script")}</script></body></html>`;
}
async function open(page: Page) {
  bundle ??= fixture();
  await page.route("**/__select-layer-audit.html", async route => route.fulfill({ contentType: "text/html", body: await bundle }));
  await page.goto("/__select-layer-audit.html");
  await expect(page.getByRole("heading", { name: "Select layer verification" })).toBeVisible();
}

test("Select remains anchored through ancestor/page scrolling and viewport resize", async ({ page }) => {
  await open(page);
  const trigger = page.getByRole("combobox", { name: "Scrolling select", exact: true });
  await trigger.click();
  const menu = page.getByRole("listbox", { name: "Scrolling select", exact: true });
  await expect(menu).toBeVisible();
  const initial = { trigger: (await trigger.boundingBox())!, menu: (await menu.boundingBox())! };
  await page.locator("#scroll-anchor").evaluate(node => { node.scrollTop += 30; });
  await expect(menu).toBeVisible();
  await expect.poll(async () => Math.abs(((await menu.boundingBox())!.y - initial.menu.y) - ((await trigger.boundingBox())!.y - initial.trigger.y))).toBeLessThanOrEqual(1);
  const afterAncestor = { trigger: (await trigger.boundingBox())!, menu: (await menu.boundingBox())! };
  await page.evaluate(() => window.scrollBy(0, 24));
  await expect(menu).toBeVisible();
  await expect.poll(async () => Math.abs(((await menu.boundingBox())!.y - afterAncestor.menu.y) - ((await trigger.boundingBox())!.y - afterAncestor.trigger.y))).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 360, height: 640 });
  await expect(menu).toBeVisible();
  await expect.poll(async () => { const box = (await menu.boundingBox())!; return box.x >= 0 && box.x + box.width <= 361 && box.y >= 0 && box.y + box.height <= 641; }).toBe(true);
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("nested Select keeps the first Escape even after the trigger loses focus", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Open select parent", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Select parent", exact: true }), trigger = dialog.getByRole("combobox", { name: "Nested select", exact: true });
  await trigger.click();
  const menu = page.getByRole("listbox", { name: "Nested select", exact: true });
  await expect(menu).toBeVisible();
  await trigger.evaluate(node => (node as HTMLButtonElement).blur());
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(dialog).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("Select mirrors native focus callbacks without treating its bridge as outside focus", async ({ page }) => {
  await open(page);
  const trigger = page.getByRole("combobox", { name: "Moving select", exact: true });
  await trigger.focus();
  await expect(page.locator('output[aria-label="Native focus callbacks"]')).toHaveText("1");
  await trigger.click();
  await expect(page.getByRole("listbox", { name: "Moving select", exact: true })).toBeVisible();
  await page.getByRole("option", { name: "Zero", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Host destination", exact: true })).toBeFocused();
  await expect(selectBridge(trigger)).toHaveValue("0");
  await expect(page.locator('output[aria-label="Changes"]')).toHaveText("1");
  await expect(page.locator('output[aria-label="Native blur callbacks"]')).toHaveText("1");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("touch option activation fires once, preserves host focus and cannot click through", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: "http://127.0.0.1:4173", viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  try {
    const page = await context.newPage();
    await open(page);
    const trigger = page.getByRole("combobox", { name: "Moving select", exact: true });
    await trigger.tap();
    const menu = page.getByRole("listbox", { name: "Moving select", exact: true }), option = menu.getByRole("option", { name: "Zero", exact: true });
    await expect(option).toBeVisible();
    const box = (await option.boundingBox())!;
    await page.locator("#underlay").evaluate((node, rect) => { (node as HTMLElement).style.cssText = `display:block;position:fixed;left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px;z-index:0`; }, box);
    await option.tap();
    await expect(menu).toBeHidden();
    await expect(selectBridge(trigger)).toHaveValue("0");
    await expect(page.getByRole("textbox", { name: "Host destination", exact: true })).toBeFocused();
    await page.waitForTimeout(100); // Allow any delayed compatibility click to arrive.
    await expect(page.locator('output[aria-label="Changes"]')).toHaveText("1");
    await expect(page.locator('output[aria-label="Underlying clicks"]')).toHaveText("0");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  } finally { await context.close(); }
});
