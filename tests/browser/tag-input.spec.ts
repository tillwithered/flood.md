import {test, expect, type Page} from "@playwright/test";
import {build} from "vite";
import {mkdir, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import AxeBuilder from "@axe-core/playwright";
let bundle: Promise<string>;
async function fixture() {
  const file = (path: string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  const directory = resolve(`.artifacts/tag-input-${process.pid}`);
  await mkdir(directory, {recursive:true});
  const entry = resolve(directory,"entry.mjs");
  await writeFile(entry, `import React,{StrictMode,useState}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,TagInput,Button,Checkbox}from ${file("packages/react/dist/index.js")};
import ${file("packages/react/dist/styles.css")};const h=React.createElement;
function App(){const[disabled,D]=useState(false),[readOnly,R]=useState(false),[hidden,H]=useState(false),[cancel,C]=useState(false),[accept,A]=useState(false),[fixed,F]=useState(['Fixed']),[requested,Q]=useState(''),[submitted,S]=useState('');return h(FloodRoot,null,h('h1',null,'Tag input checks'),
h('form',{id:'tags-form',onSubmit:e=>{e.preventDefault();S(JSON.stringify([...new FormData(e.currentTarget)]))},onReset:e=>{if(cancel)e.preventDefault()}},h('fieldset',{disabled},h('legend',null,'Tag settings'),h(TagInput,{label:'Topics',name:'topics',defaultValue:['Design'],delimiters:[',',';'],readOnly,hideLabel:hidden,placeholder:'Add topic'}),h(TagInput,{label:'Fixed topics',value:fixed,readOnly,onValueChange:next=>{Q(JSON.stringify(next));if(accept)F(next)}}),h(Button,{type:'submit'},'Submit tags')),h(Button,{type:'reset'},'Reset tags')),
h('form',{id:'required-tags',onSubmit:e=>e.preventDefault()},h(TagInput,{label:'Required topics',name:'required-topics',required:true}),h(Button,{type:'submit'},'Validate tags')),
h(Checkbox,{label:'Read only',checked:readOnly,onChange:e=>R(e.currentTarget.checked)}),h(Checkbox,{label:'Disable fieldset',checked:disabled,onChange:e=>D(e.currentTarget.checked)}),h(Checkbox,{label:'Hide label',checked:hidden,onChange:e=>H(e.currentTarget.checked)}),h(Checkbox,{label:'Cancel reset',checked:cancel,onChange:e=>C(e.currentTarget.checked)}),h(Checkbox,{label:'Accept changes',checked:accept,onChange:e=>A(e.currentTarget.checked)}),h('output',{'aria-label':'Requested tags'},requested),h('output',{'aria-label':'Submitted tags'},submitted));}createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
  const result = await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("development")},build:{write:false,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"TagInputFixture"}}});
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(result => "output" in result ? result.output : []);
  const css = outputs.filter(item => item.type === "asset" && item.fileName.endsWith(".css")).map(item => item.type === "asset" ? String(item.source) : "").join("\n");
  const js = outputs.filter(item => item.type === "chunk").map(item => item.type === "chunk" ? item.code : "").join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tag input</title><style>${css}body{margin:16px;background:#181818;color:white}main{max-width:30rem}fieldset{min-width:0}</style></head><body><main id="app"></main><script>${js.replace(/<\/script/gi,"<\\/script")}</script></body></html>`;
}
async function open(page: Page) {
  bundle ??= fixture();
  await page.route("**/__tag-input.html",async route => route.fulfill({contentType:"text/html",body:await bundle}));
  await page.goto("/__tag-input.html");
}
const topic = (page:Page) => page.getByRole("textbox",{name:"Topics",exact:true});
const field = (page:Page) => page.locator(".flood-tag-input").filter({has:topic(page)});
async function paste(page:Page,text:string) {
  await topic(page).evaluate((node,text) => {
    const clipboard = new DataTransfer(); clipboard.setData("text/plain",text);
    const event = new ClipboardEvent("paste",{bubbles:true,cancelable:true});
    Object.defineProperty(event,"clipboardData",{value:clipboard}); node.dispatchEvent(event);
  },text);
}

test("TagInput trims, deduplicates, handles delimiters/paste and submits only committed values",async({page}) => {
  await open(page);const input=topic(page);
  await input.fill("  Research  ");await input.press("Enter");
  await expect(field(page).getByRole("button",{name:"Remove Research",exact:true})).toBeVisible();
  await input.fill("Design");await input.press(",");await expect(field(page).locator(".flood-tag")).toHaveCount(2);
  await input.fill("Code; Docs,");await expect(input).toHaveValue("");
  await paste(page,"Code,New topic\r\nLast topic");
  await expect(field(page).locator(".flood-tag")).toHaveCount(6);
  await input.fill("Uncommitted");await page.getByRole("button",{name:"Submit tags",exact:true}).click();
  await expect(page.getByRole("status",{name:"Submitted tags"})).toHaveText('[["topics","Design"],["topics","Research"],["topics","Code"],["topics","Docs"],["topics","New topic"],["topics","Last topic"]]');
});

test("TagInput keyboard removal preserves modifier shortcuts and composition",async({page}) => {
  await open(page);const input=topic(page);await input.fill("Second");await input.press("Enter");
  await input.press("Control+Backspace");await expect(field(page).locator(".flood-tag")).toHaveCount(2);
  await input.press("ArrowLeft");const remove=field(page).getByRole("button",{name:"Remove Second",exact:true});await expect(remove).toBeFocused();
  await remove.press("Delete");await expect(input).toBeFocused();await expect(field(page).locator(".flood-tag")).toHaveCount(1);
  await input.fill("Composing");await input.dispatchEvent("compositionstart",{data:"Composing"});await input.dispatchEvent("keydown",{key:"Enter",isComposing:true});
  await expect(field(page).locator(".flood-tag")).toHaveCount(1);await input.dispatchEvent("compositionend",{data:"Composing"});await input.press("Enter");
  await expect(field(page).locator(".flood-tag")).toHaveCount(2);await input.press("Backspace");await expect(field(page).locator(".flood-tag")).toHaveCount(1);
});

test("TagInput controlled refusal keeps draft and native resets respect ownership and cancellation",async({page}) => {
  await open(page);const fixed=page.getByRole("textbox",{name:"Fixed topics",exact:true});
  await fixed.fill("Proposed");await fixed.press("Enter");await expect(fixed).toHaveValue("Proposed");
  await expect(page.getByRole("status",{name:"Requested tags"})).toHaveText('["Fixed","Proposed"]');
  await expect(page.getByRole("button",{name:"Remove Proposed",exact:true})).toHaveCount(0);
  await page.getByRole("checkbox",{name:"Accept changes",exact:true}).check();await fixed.press("Enter");await expect(fixed).toHaveValue("");
  await expect(page.getByRole("button",{name:"Remove Proposed",exact:true})).toBeVisible();
  const input=topic(page);await input.fill("Extra");await input.press("Enter");
  await page.getByRole("checkbox",{name:"Cancel reset",exact:true}).check();await page.getByRole("button",{name:"Reset tags",exact:true}).click();await expect(field(page).locator(".flood-tag")).toHaveCount(2);
  await page.getByRole("checkbox",{name:"Cancel reset",exact:true}).uncheck();await page.getByRole("button",{name:"Reset tags",exact:true}).click();await expect(field(page).locator(".flood-tag")).toHaveCount(1);
  await expect(page.getByRole("button",{name:"Remove Proposed",exact:true})).toBeVisible();
});

test("TagInput required validity uses committed tags; readonly and inherited disabling stay native",async({page}) => {
  await open(page);const required=page.getByRole("textbox",{name:"Required topics",exact:true});await required.fill("Draft only");await page.getByRole("button",{name:"Validate tags",exact:true}).click();
  await expect(required).toBeFocused();await expect(page.getByRole("alert")).toHaveText("Add at least one tag.");await required.press("Enter");
  expect(await required.evaluate((node:HTMLInputElement)=>node.checkValidity())).toBe(true);await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("checkbox",{name:"Read only",exact:true}).check();const input=topic(page);await expect(input).toHaveAttribute("readonly","");
  await expect(field(page).getByRole("button")).toHaveCount(0);await input.press("Backspace");await expect(field(page).locator('input[type="hidden"][value="Design"]')).toHaveCount(1);
  await page.getByRole("checkbox",{name:"Read only",exact:true}).uncheck();await page.getByRole("checkbox",{name:"Disable fieldset",exact:true}).check();
  await expect(input).toBeDisabled();await expect(field(page).getByRole("button",{name:"Remove Design",exact:true})).toBeDisabled();
  expect(await page.locator("#tags-form").evaluate((node:HTMLFormElement)=>[...new FormData(node)])).toEqual([]);
});

test("TagInput hidden naming, nested geometry and long tags reflow in RTL enlarged text",async({page}) => {
  await open(page);await page.getByRole("checkbox",{name:"Hide label",exact:true}).check();
  await page.setViewportSize({width:390,height:1100});await page.evaluate(()=>{document.documentElement.dir="rtl";document.documentElement.style.fontSize="24px"});
  const input=topic(page);await input.fill("InternationalProductInterfacesWithoutSpacesOrShortcuts");await input.press("Enter");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const nested=await field(page).locator(".flood-tag-input__control").evaluate(node=>{const outer=node.getBoundingClientRect(),tag=node.querySelector(".flood-tag")!,inner=tag.getBoundingClientRect();return{outer:parseFloat(getComputedStyle(node).borderTopRightRadius),inner:parseFloat(getComputedStyle(tag).borderTopRightRadius),inset:outer.right-inner.right}});
  expect(Math.abs(nested.outer-nested.inset-nested.inner)).toBeLessThan(2);
  await input.press("ArrowRight");await expect(field(page).getByRole("button",{name:"Remove InternationalProductInterfacesWithoutSpacesOrShortcuts",exact:true})).toBeFocused();
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);await page.screenshot({path:".artifacts/tag-input-rtl.png",fullPage:true});
});

test("TagInput touch removal has a distinct target and returns focus once",async({browser,baseURL}) => {
  const context=await browser.newContext({baseURL,hasTouch:true,isMobile:true,viewport:{width:390,height:844}});
  try {const page=await context.newPage();await open(page);const remove=field(page).getByRole("button",{name:"Remove Design",exact:true}),box=(await remove.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);await remove.tap();await expect(field(page).locator(".flood-tag")).toHaveCount(0);await expect(topic(page)).toBeFocused();}
  finally {await context.close();}
});
