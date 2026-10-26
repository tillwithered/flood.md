import { test, expect, type Page } from "@playwright/test";
import { build } from "vite";
import { resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { chooseSelectOption } from "./select-helpers";

let bundle: Promise<string>;
async function fixture() {
  const file = (path: string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  const directory = resolve(`.artifacts/toggles-${process.pid}`), entry = resolve(directory, "entry.mjs");
  await mkdir(directory, {recursive: true});
  await writeFile(entry, `import React,{useState,createRef}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,Toggle,ToggleGroup}from ${file("packages/react/dist/index.js")};
import ${file("packages/react/dist/styles.css")};
const h=React.createElement,options=[{value:'a',label:'Alpha'},{value:'b',label:'Beta',disabled:true},{value:'c',label:'Gamma'}],ref=createRef();
function App(){const[p,setP]=useState(false),[values,setValues]=useState(['a']),[count,setCount]=useState(0);
return h(FloodRoot,null,h('form',{onSubmit:e=>{e.preventDefault();setCount(n=>n+1)}},
h(Toggle,{ref,defaultPressed:true},'Local'),h(Toggle,{pressed:p,onPressedChange:setP},'Controlled'),
h(Toggle,{pressed:false,onPressedChange:()=>setCount(n=>n+1)},'Frozen'),
h(Toggle,{onClick:e=>e.preventDefault(),onPressedChange:()=>setCount(n=>n+1)},'Canceled'),
h(Toggle,{disabled:true},'Disabled'),h(Toggle,{loading:true},'Loading'),
h(ToggleGroup,{label:'Single',selectionMode:'single',options,defaultValue:['a']}),
h(ToggleGroup,{label:'Multiple',options,value:values,onValueChange:setValues}),
h('button',{type:'button',onClick:()=>ref.current.focus()},'Focus ref'),
h('output',{'aria-label':'Events'},String(count))))}
createRoot(document.getElementById('app')).render(h(App));`);
  const result = await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("production")},build:{write:false,minify:true,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"ToggleFixture"}}});
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(item => "output" in item ? item.output : []);
  const js = outputs.filter(item => item.type === "chunk").map(item => item.type === "chunk" ? item.code : "").join("\n");
  const css = outputs.filter(item => item.type === "asset" && item.fileName.endsWith(".css")).map(item => item.type === "asset" ? String(item.source) : "").join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css}</style></head><body><main id="app"></main><script>${js.replace(/<\/script/gi,"<\\/script")}</script></body></html>`;
}
async function open(page: Page) {
  bundle ??= fixture(); const html = await bundle;
  await page.route("**/__toggles.html", route => route.fulfill({contentType:"text/html",body:html}));
  await page.goto("/__toggles.html");
}

test("Toggle handles keyboard, controlled/local state, cancellation and refs without submitting", async ({page}) => {
  await open(page);
  const local = page.getByRole("button", {name:"Local",exact:true});
  await expect(local).toHaveAttribute("aria-pressed","true");
  await local.focus(); await page.keyboard.press("Space"); await expect(local).toHaveAttribute("aria-pressed","false");
  await page.keyboard.press("Enter"); await expect(local).toHaveAttribute("aria-pressed","true");
  const controlled = page.getByRole("button", {name:"Controlled",exact:true});
  await controlled.click(); await expect(controlled).toHaveAttribute("aria-pressed","true");
  await page.getByRole("button",{name:"Frozen",exact:true}).click();
  await expect(page.getByRole("button",{name:"Frozen",exact:true})).toHaveAttribute("aria-pressed","false");
  await page.getByRole("button",{name:"Canceled",exact:true}).click();
  await expect(page.getByRole("button",{name:"Canceled",exact:true})).toHaveAttribute("aria-pressed","false");
  await expect(page.getByRole("button",{name:"Disabled",exact:true})).toBeDisabled();
  await expect(page.getByRole("button",{name:"Loading",exact:true})).toBeDisabled();
  await expect(page.getByLabel("Events")).toHaveText("1");
  await page.getByRole("button",{name:"Focus ref"}).click(); await expect(local).toBeFocused();
});

test("ToggleGroup separates navigation from selection, skips disabled and supports RTL/vertical", async ({page}) => {
  await open(page);
  const single = page.getByRole("group",{name:"Single",exact:true});
  const alpha = single.getByRole("button",{name:"Alpha"}), gamma = single.getByRole("button",{name:"Gamma"});
  await alpha.focus(); await page.keyboard.press("ArrowRight"); await expect(gamma).toBeFocused();
  await expect(alpha).toHaveAttribute("aria-pressed","true"); await expect(gamma).toHaveAttribute("aria-pressed","false");
  await page.keyboard.press("Enter"); await expect(gamma).toHaveAttribute("aria-pressed","true"); await expect(alpha).toHaveAttribute("aria-pressed","false");
  await page.keyboard.press("Space"); await expect(gamma).toHaveAttribute("aria-pressed","false");
  await page.keyboard.press("Home"); await expect(alpha).toBeFocused();
  await page.keyboard.press("Tab"); await expect(gamma).toBeFocused();
  await single.evaluate(node => node.setAttribute("dir","rtl"));
  await page.keyboard.press("ArrowLeft"); await expect(alpha).toBeFocused();
  const multiple = page.getByRole("group",{name:"Multiple",exact:true});
  await multiple.getByRole("button",{name:"Gamma"}).click();
  await expect(multiple.getByRole("button",{name:"Alpha"})).toHaveAttribute("aria-pressed","true");
  await expect(multiple.getByRole("button",{name:"Gamma"})).toHaveAttribute("aria-pressed","true");
  await page.goto("/components/toggle-group");
  await chooseSelectOption(page.getByRole("combobox",{name:"ToggleGroup prop orientation",exact:true}),"vertical");
  await chooseSelectOption(page.getByRole("combobox",{name:"ToggleGroup prop content",exact:true}),"icons");
  await page.getByRole("checkbox",{name:"ToggleGroup prop disableLast",exact:true}).check();
  const group = page.locator(".preview-stage").getByRole("group");
  await group.getByRole("button",{name:"Bold",exact:true}).focus(); await page.keyboard.press("End");
  await expect(group.getByRole("button",{name:"Italic",exact:true})).toBeFocused();
  await page.keyboard.press("ArrowDown"); await expect(group.getByRole("button",{name:"Bold",exact:true})).toBeFocused();
});

test("Toggle previews keep geometry, icon names, recipes and mobile reflow", async ({page}, info) => {
  for (const slug of ["toggle","toggle-group"]) {
    await page.setViewportSize(info.project.name === "mobile" ? {width:390,height:844} : {width:1440,height:1000});
    await page.goto(`/components/${slug}`);
    const stage = page.locator(".preview-stage"), first = stage.getByRole("button").first();
    const before = (await first.boundingBox())!; await first.click();
    expect((await first.boundingBox())!.height).toBeCloseTo(before.height,1);
    expect((await first.boundingBox())!.y).toBeCloseTo(before.y,1);
    await page.locator(".component-workbench").screenshot({path:`.artifacts/${slug}-${info.project.name}.png`});
    await page.setViewportSize({width:320,height:900});
    await page.evaluate(()=>{document.documentElement.style.fontSize="24px"});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.locator("#usage .site-code-block code")).toContainText("export function Example");
  }
});

test("Toggle touch targets and forced-color pressed state remain usable", async ({browser}) => {
  const context = await browser.newContext({baseURL:(process.env.FLOOD_WEBSITE_TEST_URL ?? "http://127.0.0.1:4173"),hasTouch:true,isMobile:true,viewport:{width:390,height:844}});
  try {
    const page = await context.newPage(); await page.goto("/components/toggle");
    await chooseSelectOption(page.getByRole("combobox",{name:"Toggle prop size",exact:true}),"2xs");
    await page.getByRole("checkbox",{name:"Toggle prop iconOnly",exact:true}).check();
    const toggle = page.locator(".preview-stage").getByRole("button",{name:"Bold",exact:true});
    const box = (await toggle.boundingBox())!; expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
    await page.emulateMedia({forcedColors:"active"}); await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed","true");
    const pressed = await toggle.evaluate(node=>getComputedStyle(node).backgroundColor);
    await toggle.click(); expect(await toggle.evaluate(node=>getComputedStyle(node).backgroundColor)).not.toBe(pressed);
  } finally { await context.close(); }
});
