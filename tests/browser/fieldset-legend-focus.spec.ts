import { test, expect, type Page } from "@playwright/test";
import { build } from "vite";
import { resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

let bundle: Promise<string>;
async function fixture() {
  const file = (path: string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  const directory = resolve(`.artifacts/fieldset-legend-focus-${process.pid}`), entry = resolve(directory, "entry.mjs");
  await mkdir(directory, { recursive: true });
  await writeFile(entry, `import React,{StrictMode,useRef,useState}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,Fieldset,Field,Button,Input,Checkbox,Link}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};
const h=React.createElement;
function RichLegend(){const[count,C]=useState(0);return h('span',null,'Delivery preferences ',h(Button,{size:'sm',onClick:()=>C(n=>n+1)},'Update legend'),h('span',{'role':'status','aria-label':'Legend count'},String(count)),h(Checkbox,{label:'Allow receipt',name:'receipt',value:'yes',defaultChecked:true}));}
function App(){const[hidden,H]=useState(false),[refResult,R]=useState(''),ref=useRef();return h(FloodRoot,null,h('h1',null,'Focusable hidden labels'),
h(Button,{onClick:()=>H(value=>!value)},'Toggle legend visibility'),h(Button,{id:'before-group'},'Before group'),
h('form',{id:'legend-owner'},h(Fieldset,{legend:'Workspace preferences'},h(Fieldset,{id:'delivery',ref,disabled:true,hideLabel:hidden,legend:h(RichLegend)},h(Input,{'aria-label':'Disabled body',name:'body',defaultValue:'retained'}),h(Fieldset,{legend:'Nested details'},h(Input,{'aria-label':'Nested body',name:'nested',defaultValue:'nested'}))))),
h(Button,{id:'after-group'},'After group'),h(Button,{onClick:()=>R(ref.current.tagName+':'+ref.current.firstElementChild.tagName)},'Inspect fieldset ref'),h('output',{'aria-label':'Fieldset ref'},refResult),
h(Button,{id:'before-field'},'Before field'),h(Field,{id:'focus-project',hideLabel:true,label:h(React.Fragment,null,'Project name ',h(Link,{href:'#label-guide'},'Label guide'))},props=>h(Input,{...props,defaultValue:'Retained project'})),h('div',{id:'label-guide'},'Supporting explanation'));
}createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
  const result = await build({ configFile: false, logLevel: "silent", define: { "process.env.NODE_ENV": JSON.stringify("development") }, build: { write: false, minify: true, cssCodeSplit: false, lib: { entry, formats: ["iife"], name: "LegendFocusFixture" } } });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(item => "output" in item ? item.output : []);
  const js = outputs.filter(item => item.type === "chunk").map(item => item.type === "chunk" ? item.code : "").join("\n");
  const css = outputs.filter(item => item.type === "asset" && item.fileName.endsWith(".css")).map(item => item.type === "asset" ? String(item.source) : "").join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Focusable hidden labels</title><style>${css}body{margin:16px;background:#181818}#app>.flood-root{display:grid;gap:1rem;width:32rem;max-width:100%}</style></head><body><main id="app"></main><script>${js.replace(/<\/script/gi,"<\\/script")}</script></body></html>`;
}
async function open(page: Page) {
  bundle ??= fixture();
  await page.route("**/__legend-focus.html", async route => route.fulfill({ contentType: "text/html", body: await bundle }));
  await page.goto("/__legend-focus.html");
  await expect(page.getByRole("heading", { name: "Focusable hidden labels" })).toBeVisible();
}

test("a nested disabled fieldset reveals its first legend on Tab without remounting rich state", async ({ page }) => {
  await open(page);
  const group = page.locator("#delivery"), legend = group.locator(":scope > legend"), update = group.getByRole("button", { name: "Update legend", exact: true });
  const receipt = group.getByRole("checkbox", { name: "Allow receipt", exact: true }), count = group.getByRole("status", { name: "Legend count", exact: true });
  const original = (await update.elementHandle())!;
  await expect(group).toHaveAccessibleName(/Delivery preferences/);
  await expect(update).toBeEnabled(); await expect(receipt).toBeEnabled();
  await expect(group.getByRole("textbox", { name: "Disabled body", exact: true })).toBeDisabled();
  await expect(group.getByRole("textbox", { name: "Nested body", exact: true })).toBeDisabled();
  await update.click(); await expect(count).toHaveText("1"); await receipt.uncheck();
  await page.getByRole("button", { name: "Toggle legend visibility", exact: true }).click();
  expect((await legend.boundingBox())!.height).toBeLessThanOrEqual(1);
  await expect(group).toHaveAccessibleName(/Delivery preferences/);
  await page.locator("#before-group").focus(); await page.keyboard.press("Tab");
  await expect(update).toBeFocused(); await expect(update).toBeInViewport(); expect((await legend.boundingBox())!.height).toBeGreaterThan(1);
  await expect(update).toHaveCSS("outline-style", "solid");
  await expect(count).toHaveText("1"); await page.keyboard.press("Enter"); await expect(count).toHaveText("2");
  await page.keyboard.press("Tab"); await expect(receipt).toBeFocused(); await page.keyboard.press("Space"); await expect(receipt).toBeChecked();
  expect(await page.locator("#legend-owner").evaluate(node => [...new FormData(node as HTMLFormElement)])).toEqual([["receipt", "yes"]]);
  await page.keyboard.press("Tab"); await expect(page.locator("#after-group")).toBeFocused();
  expect((await legend.boundingBox())!.height).toBeLessThanOrEqual(1);
  for (let cycle = 0; cycle < 2; cycle++) {
    await page.getByRole("button", { name: "Toggle legend visibility", exact: true }).click();
    expect((await legend.boundingBox())!.height).toBeGreaterThan(1);
    await page.getByRole("button", { name: "Toggle legend visibility", exact: true }).click();
    expect((await legend.boundingBox())!.height).toBeLessThanOrEqual(1);
    await expect(count).toHaveText("2"); await expect(receipt).toBeChecked();
    expect(await original.evaluate(node => node.isConnected)).toBe(true);
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; document.documentElement.dir = "rtl"; });
  await page.locator("#before-group").focus(); await page.keyboard.press("Tab");
  await expect(update).toBeFocused(); await expect(update).toBeInViewport(); expect((await legend.boundingBox())!.height).toBeGreaterThan(1);
  await expect(group).toHaveAccessibleName(/Delivery preferences/); await expect(count).toHaveText("2");
  await page.getByRole("button", { name: "Inspect fieldset ref", exact: true }).click();
  await expect(page.locator('output[aria-label="Fieldset ref"]')).toHaveText("FIELDSET:LEGEND");
});

test("a supporting link reveals a hidden Field label while preserving the input name", async ({ page }) => {
  await open(page);
  const label = page.locator('label[for="focus-project"]'), input = page.getByRole("textbox", { name: /Project name/ });
  const link = label.getByRole("link", { name: "Label guide", exact: true });
  expect((await label.boundingBox())!.height).toBeLessThanOrEqual(1);
  await expect(input).toHaveAccessibleName(/Project name/);
  await page.locator("#before-field").focus(); await page.keyboard.press("Tab");
  await expect(link).toBeFocused(); await expect(link).toBeInViewport(); expect((await label.boundingBox())!.height).toBeGreaterThan(1);
  await expect(link).toHaveCSS("outline-style", "solid");
  await expect(input).toHaveAccessibleName(/Project name/);
  await page.keyboard.press("Tab"); await expect(input).toBeFocused();
  expect((await label.boundingBox())!.height).toBeLessThanOrEqual(1);
  await expect(input).toHaveValue("Retained project"); await expect(input).toHaveAccessibleName(/Project name/);
});
