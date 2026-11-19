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
function App(){const[readOnly,R]=useState(false),[disabled,D]=useState(false),[cancel,C]=useState(false),[accept,A]=useState(false),[color,S]=useState('#ffffff'),[requested,Q]=useState(''),[alpha,setAlpha]=useState(false);return h(FloodRoot,null,h('h1',null,'Color controls'),
h('form',{id:'colors',onReset:e=>{if(cancel)e.preventDefault()},onSubmit:e=>e.preventDefault()},h('fieldset',{disabled},h('legend',null,'Colors'),h(ColorPicker,{id:'brand',label:'Brand color',name:'brand',defaultValue:'#f49',required:true,readOnly,allowAlpha:alpha,presets:['#ffffff','#000000','#f49']}),h(Button,{type:'reset'},'Reset colors'))),
h(ColorPicker,{id:'fixed',label:'Fixed color',value:color,onValueChange:next=>{Q(next);if(accept)S(next)}}),
h(Checkbox,{label:'Allow alpha',checked:alpha,onChange:e=>setAlpha(e.currentTarget.checked)}),h(Checkbox,{label:'Read only',checked:readOnly,onChange:e=>R(e.currentTarget.checked)}),h(Checkbox,{label:'Disable fieldset',checked:disabled,onChange:e=>D(e.currentTarget.checked)}),h(Checkbox,{label:'Cancel reset',checked:cancel,onChange:e=>C(e.currentTarget.checked)}),h(Checkbox,{label:'Accept changes',checked:accept,onChange:e=>A(e.currentTarget.checked)}),h('output',{'aria-label':'Requested color'},requested),h(ColorSwatch,{value:'#abc',label:'Pale blue'}));}createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
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

test("ColorPicker opt-in alpha edits exact RGBA and preserves alpha in RGB edits", async({page},info)=>{
  await page.goto("/components/color-picker");
  await page.getByRole("checkbox",{name:"ColorPicker prop allowAlpha",exact:true}).check();
  const picker=page.locator(".preview-stage .flood-color-picker");
  const hex=picker.getByRole("textbox",{name:"Accent color Hex",exact:true});
  await hex.fill("#Abc8");
  await hex.blur();
  await expect(hex).toHaveValue("#aabbcc88");
  await picker.getByRole("slider",{name:"Red",exact:true}).press("Home");
  await expect(hex).toHaveValue("#00bbcc88");
  await expect(picker.locator('input[type="hidden"][name="accent"]')).toHaveValue("#00bbcc88");
  await expect(picker.locator(".flood-color-picker__value .flood-color-swatch")).toHaveAttribute("data-alpha","true");
  await picker.screenshot({path:info.outputPath("color-picker-alpha.png")});
  await picker.getByRole("slider",{name:"Opacity (%)",exact:true}).press("End");
  await expect(hex).toHaveValue("#00bbccff");
});

test("ColorPicker submits the current format when alpha support changes", async({page})=>{
  await open(page);
  const mode=page.getByRole("checkbox",{name:"Allow alpha",exact:true});
  const input=page.locator("#brand-hex");
  await mode.check();
  await expect(input).toHaveValue("#ff4499ff");
  await input.fill("#00aa1180");
  await mode.uncheck();
  await expect(input).toHaveValue("#00aa11");
  expect(await formValue(page)).toBe("#00aa11");
  await mode.check();
  await expect(input).toHaveValue("#00aa1180");
  await page.getByRole("button",{name:"Reset colors"}).click();
  await expect(input).toHaveValue("#ff4499ff");
  expect(await formValue(page)).toBe("#ff4499ff");
});

test("GradientEditor keeps coincident stops individually selectable and bounds removal", async({page},info)=>{
  await page.goto("/components/gradient-editor");
  const editor=page.locator(".preview-stage .flood-gradient-editor");
  const group=editor.getByRole("group",{name:"Color stops",exact:true});
  const first=group.getByRole("button",{name:"Stop 1: 0%",exact:true});
  const [pill,swatch]=await Promise.all([first.boundingBox(),first.locator(".flood-color-swatch").boundingBox()]);
  expect(Math.abs((swatch!.x-pill!.x)-(swatch!.y-pill!.y))).toBeLessThan(1);
  await group.getByRole("button",{name:"Stop 2: 55%",exact:true}).click();
  await editor.getByRole("spinbutton",{name:"Position (%)",exact:true}).fill("100");
  await expect(group.getByRole("button",{name:"Stop 2: 100%",exact:true})).toHaveAttribute("aria-pressed","true");
  await group.getByRole("button",{name:"Stop 3: 100%",exact:true}).press("Enter");
  await expect(group.getByRole("button",{name:"Stop 3: 100%",exact:true})).toHaveAttribute("aria-pressed","true");
  await editor.screenshot({path:info.outputPath("gradient-stops.png")});
  const channels=editor.getByRole("button",{name:"Color channels",exact:true});
  const alpha=editor.getByRole("slider",{name:"Opacity (%)",exact:true});
  await expect(alpha).toBeHidden();
  await channels.press("Enter");
  await expect(alpha).toBeVisible();
  await alpha.press("Home");
  await expect(editor.getByRole("textbox",{name:"Stop color Hex",exact:true})).toHaveValue(/00$/);
  await editor.getByRole("button",{name:"Remove stop",exact:true}).click();
  await expect(editor.getByRole("button",{name:"Remove stop",exact:true})).toBeDisabled();
  await expect(group.getByRole("button",{name:"Stop 2: 100%",exact:true})).toBeFocused();
  await editor.getByRole("button",{name:"Add stop",exact:true}).press("Enter");
  await expect(group.getByRole("button",{pressed:true})).toHaveAccessibleName(/50%/);
  await expect(group.getByRole("button",{pressed:true})).toBeFocused();
});

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
test("a named ColorPalette keeps one active choice and supports read-only and disabled options", async ({page}) => {
  await page.goto("/components/color-palette");
  const group = page.getByRole("group", {name:"Accent colors"});
  const pink = group.getByRole("button", {name:"Pink"});
  const blue = group.getByRole("button", {name:"Blue"});
  await expect(pink).toHaveAttribute("aria-pressed", "true");
  await blue.press("Enter");
  await expect(blue).toHaveAttribute("aria-pressed", "true");
  await expect(pink).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("checkbox", {name:"ColorPalette prop disableLast"}).check();
  await expect(group.getByRole("button", {name:"Mint"})).toBeDisabled();
  await page.getByRole("checkbox", {name:"ColorPalette prop readOnly"}).check();
  await expect(pink).toHaveAttribute("aria-disabled", "true");
  await pink.press("Enter");
  await expect(blue).toHaveAttribute("aria-pressed", "true");
});

test("ColorPicker can restore a selected preset after an invalid draft", async ({page}) => {
  await open(page);
  const brand = page.locator("#brand");
  const hex = page.locator("#brand-hex");
  const selected = brand.getByRole("button", {name:"#ff4499", exact:true});
  await expect(selected).toHaveAttribute("aria-pressed", "true");
  await hex.fill("#12");
  await hex.blur();
  await expect(brand.getByRole("alert")).toBeVisible();
  await selected.click();
  await expect(hex).toHaveValue("#ff4499");
  await expect(brand.getByRole("alert")).toBeHidden();
  const channel = brand.getByRole("group", {name:"Red", exact:true});
  await expect(channel.locator("legend")).toContainText("255");
  await expect(channel.getByRole("slider")).toHaveAccessibleName("Red");
});
