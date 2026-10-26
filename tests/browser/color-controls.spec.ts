import {test, expect, type Page} from "@playwright/test";
import {build} from "vite";
import {mkdir, writeFile} from "node:fs/promises";
import {resolve} from "node:path";

let bundle: Promise<string>;
async function fixture() {
  const file = (path:string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  const directory = resolve(`.artifacts/color-controls-${process.pid}`);
  await mkdir(directory, {recursive:true});
  const entry = resolve(directory, "entry.mjs");
  await writeFile(entry, `import React,{StrictMode,useState}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,ColorPicker,ColorSwatch,Button,Checkbox}from ${file("packages/react/dist/index.js")};
import ${file("packages/react/dist/styles.css")};const h=React.createElement;
function App(){const[readOnly,R]=useState(false),[disabled,D]=useState(false),[cancel,C]=useState(false),[accept,A]=useState(false),[color,S]=useState('#ffffff'),[requested,Q]=useState('');return h(FloodRoot,null,h('h1',null,'Color controls'),
h('form',{id:'colors',onReset:e=>{if(cancel)e.preventDefault()},onSubmit:e=>e.preventDefault()},h('fieldset',{disabled},h('legend',null,'Colors'),h(ColorPicker,{id:'brand',label:'Brand color',name:'brand',defaultValue:'#f49',required:true,readOnly,presets:['#ffffff','#000000','#f49']}),h(Button,{type:'reset'},'Reset colors'))),
h(ColorPicker,{id:'fixed',label:'Fixed color',value:color,onValueChange:next=>{Q(next);if(accept)S(next)}}),
h(Checkbox,{label:'Read only',checked:readOnly,onChange:e=>R(e.currentTarget.checked)}),h(Checkbox,{label:'Disable fieldset',checked:disabled,onChange:e=>D(e.currentTarget.checked)}),h(Checkbox,{label:'Cancel reset',checked:cancel,onChange:e=>C(e.currentTarget.checked)}),h(Checkbox,{label:'Accept changes',checked:accept,onChange:e=>A(e.currentTarget.checked)}),h('output',{'aria-label':'Requested color'},requested),h(ColorSwatch,{value:'#abc',label:'Pale blue'}));}createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
  const result = await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("development")},build:{write:false,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"ColorFixture"}}});
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(result => "output" in result ? result.output : []);
  const css = outputs.filter(item => item.type === "asset" && item.fileName.endsWith(".css")).map(item => item.type === "asset" ? String(item.source) : "").join("\n");
  const js = outputs.filter(item => item.type === "chunk").map(item => item.type === "chunk" ? item.code : "").join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Color controls</title><style>${css}body{margin:16px;background:#181818;color:white}main{max-width:30rem}fieldset{min-width:0}</style></head><body><main id="app"></main><script>${js.replace(/<\/script/gi,"<\\/script")}</script></body></html>`;
}
async function open(page:Page) {
  bundle ??= fixture();
  await page.route("**/__colors.html", async route => route.fulfill({contentType:"text/html",body:await bundle}));
  await page.goto("/__colors.html");
}
const formValue = (page:Page) => page.locator("#colors").evaluate((form:HTMLFormElement) => new FormData(form).get("brand"));

test("ColorPicker normalizes hex and invalid drafts never submit the previous color", async({page}) => {
  await open(page); const input = page.locator("#brand-hex");
  await expect(input).toHaveValue("#ff4499");
  await input.fill("#ABC"); await expect(input).toHaveValue("#ABC"); expect(await formValue(page)).toBe("#aabbcc");
  await input.blur(); await expect(input).toHaveValue("#aabbcc");
  await input.fill(""); await input.pressSequentially("#123456");
  await expect(input).toHaveValue("#123456"); expect(await formValue(page)).toBe("#123456");
  await input.fill("#ab"); expect(await formValue(page)).toBe("");
  expect(await input.evaluate((node:HTMLInputElement) => node.checkValidity())).toBe(false);
  await input.blur(); await expect(page.getByRole("alert")).toHaveText("Enter a color in #rrggbb format.");
  await input.fill(""); expect(await formValue(page)).toBe("");
  expect(await input.evaluate((node:HTMLInputElement) => node.checkValidity())).toBe(false);
});

test("ColorPicker RGB keyboard edits and presets share one canonical value", async({page}) => {
  await open(page); const brand = page.locator("#brand");
  await brand.getByRole("slider", {name:"Red",exact:true}).focus(); await page.keyboard.press("Home");
  await expect(page.locator("#brand-hex")).toHaveValue("#004499");
  await brand.getByRole("button", {name:"#ffffff",exact:true}).click();
  await expect(page.locator("#brand-hex")).toHaveValue("#ffffff");
  await expect(brand.getByRole("button", {name:"#ffffff",exact:true})).toHaveAttribute("aria-pressed", "true");
  expect(await formValue(page)).toBe("#ffffff");
});

test("ColorPicker controlled refusal, acceptance and readOnly retain host values", async({page}) => {
  await open(page); const input = page.locator("#fixed-hex");
  await input.fill("#123456"); await expect(input).toHaveValue("#ffffff");
  await expect(page.getByRole("status", {name:"Requested color"})).toHaveText("#123456");
  await page.getByRole("checkbox", {name:"Accept changes",exact:true}).check();
  await input.fill("#123456"); await expect(input).toHaveValue("#123456");
  await input.fill(""); await input.pressSequentially("#abcdef"); await expect(input).toHaveValue("#abcdef");
  await page.getByRole("checkbox", {name:"Read only",exact:true}).check();
  const brand = page.locator("#brand");
  await expect(page.locator("#brand-hex")).toHaveAttribute("readonly", "");
  const preset = brand.getByRole("button", {name:"#000000",exact:true});
  await expect(preset).toHaveAttribute("aria-disabled", "true");
  await preset.evaluate((node:HTMLButtonElement) => node.click());
  await brand.getByRole("slider", {name:"Red",exact:true}).focus(); await page.keyboard.press("Home");
  expect(await formValue(page)).toBe("#ff4499");
});

test("ColorPicker native reset cancellation and inherited disabled apply to form data", async({page}) => {
  await open(page); const input = page.locator("#brand-hex"); await input.fill("#123456");
  await page.getByRole("checkbox", {name:"Cancel reset",exact:true}).check();
  await page.getByRole("button", {name:"Reset colors",exact:true}).click(); await expect(input).toHaveValue("#123456");
  await page.getByRole("checkbox", {name:"Cancel reset",exact:true}).uncheck();
  await page.getByRole("button", {name:"Reset colors",exact:true}).click(); await expect(input).toHaveValue("#ff4499");
  await page.getByRole("checkbox", {name:"Disable fieldset",exact:true}).check();
  await expect(input).toBeDisabled(); expect(await formValue(page)).toBe(null);
});
