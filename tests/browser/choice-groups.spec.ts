import { test, expect, type Page } from "@playwright/test";
import { build } from "vite";
import { resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

let bundle: Promise<string>;
async function fixture() {
  const file = (path: string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  const entry = resolve(`.artifacts/choice-groups-${process.pid}/entry.mjs`);
  await mkdir(resolve(`.artifacts/choice-groups-${process.pid}`), { recursive: true });
  await writeFile(entry, `import React,{useState}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,RadioGroup,CheckboxGroup}from ${file("packages/react/dist/index.js")};
import ${file("packages/react/dist/styles.css")};
const h=React.createElement,options=[{value:'a',label:'Alpha'},{value:'b',label:'Beta',disabled:true},{value:'c',label:'Gamma'}];
function App(){const[radio,setRadio]=useState('a'),[checks,setChecks]=useState(['a']),[cancel,setCancel]=useState(false),[count,setCount]=useState(0);
return h(FloodRoot,null,h('form',{id:'owner',onReset:event=>{if(cancel)event.preventDefault();}},
h(RadioGroup,{name:'single',legend:'Single',options,defaultValue:'a',onValueChange:()=>setCount(n=>n+1)}),
h(CheckboxGroup,{name:'many',legend:'Many',options,defaultValue:['a']}),
h(RadioGroup,{name:'controlled',legend:h(React.Fragment,null,'Controlled single',h('input',{type:'checkbox',value:'unrelated',defaultChecked:true,'aria-label':'Legend value'})),'aria-label':'Controlled single',options,value:radio,onValueChange:setRadio}),
h(CheckboxGroup,{name:'controlledMany',legend:'Controlled many',options,value:checks,onValueChange:setChecks}),
h('button',{type:'reset'},'Reset'),h('button',{type:'button',onClick:()=>setCancel(v=>!v)},'Cancel reset'),h('output',{'aria-label':'Change count'},String(count))),
h(RadioGroup,{form:'external',name:'externalChoice',legend:'External',options,defaultValue:'a'}),h('form',{id:'external'}),
h('form',{id:'required'},h(RadioGroup,{name:'requiredChoice',legend:'Required',options,required:true})));
}createRoot(document.getElementById('app')).render(h(App));`);
  const result = await build({ configFile: false, logLevel: "silent", define: { "process.env.NODE_ENV": JSON.stringify("production") }, build: { write: false, minify: true, cssCodeSplit: false, lib: { entry, formats: ["iife"], name: "GroupFixture" } } });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(item => "output" in item ? item.output : []);
  const js = outputs.filter(item => item.type === "chunk").map(item => item.type === "chunk" ? item.code : "").join("\n");
  const css = outputs.filter(item => item.type === "asset" && item.fileName.endsWith(".css")).map(item => item.type === "asset" ? String(item.source) : "").join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css}</style></head><body><main id="app"></main><script>${js.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
}
async function open(page: Page) {
  bundle ??= fixture(); const html = await bundle;
  await page.route("**/__groups.html", route => route.fulfill({ contentType: "text/html", body: html }));
  await page.goto("/__groups.html");
}

test("radio arrow navigation skips disabled choices and native reset respects ownership and cancellation", async ({ page }) => {
  await open(page);
  const group = page.getByRole("radiogroup", { name: "Single", exact: true });
  await group.getByRole("radio", { name: "Alpha" }).focus(); await page.keyboard.press("ArrowRight");
  await expect(group.getByRole("radio", { name: "Gamma" })).toBeChecked();
  await expect(group.getByRole("radio", { name: "Gamma" })).toBeFocused();
  const controlled = page.getByRole("radiogroup", { name: "Controlled single", exact: true });
  await controlled.getByRole("radio", { name: "Gamma" }).check();
  const many = page.getByRole("group", { name: "Many", exact: true });
  await many.getByRole("checkbox", { name: "Gamma" }).check();
  const controlledMany = page.getByRole("group", { name: "Controlled many", exact: true });
  await controlledMany.getByRole("checkbox", { name: "Gamma" }).check();
  await page.getByRole("button", { name: "Cancel reset", exact: true }).click();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(group.getByRole("radio", { name: "Gamma" })).toBeChecked();
  await page.getByRole("button", { name: "Cancel reset", exact: true }).click();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(group.getByRole("radio", { name: "Alpha" })).toBeChecked();
  await expect(many.getByRole("checkbox", { name: "Gamma" })).not.toBeChecked();
  await expect(controlled.getByRole("radio", { name: "Gamma" })).toBeChecked();
  await expect(controlled.getByRole("checkbox", { name: "Legend value" })).toBeChecked();
  await expect(controlledMany.getByRole("checkbox", { name: "Gamma" })).toBeChecked();
  await expect(page.getByRole("status", { name: "Change count" })).toHaveText("1");
});

test("group form data, required radio validity and external ownership remain native", async ({ page }) => {
  await open(page);
  const required = page.getByRole("radiogroup", { name: "Required", exact: true });
  expect(await page.locator("#required").evaluate(node => (node as HTMLFormElement).checkValidity())).toBe(false);
  await required.getByRole("radio", { name: "Gamma" }).check();
  expect(await page.locator("#required").evaluate(node => (node as HTMLFormElement).checkValidity())).toBe(true);
  const many = page.getByRole("group", { name: "Many", exact: true });
  await many.getByRole("checkbox", { name: "Gamma" }).check();
  expect(await page.locator("#owner").evaluate(node => new FormData(node as HTMLFormElement).getAll("many"))).toEqual(["a", "c"]);
  const external = page.getByRole("radiogroup", { name: "External", exact: true });
  await external.getByRole("radio", { name: "Gamma" }).check();
  expect(await page.locator("#external").evaluate(node => new FormData(node as HTMLFormElement).get("externalChoice"))).toBe("c");
  await page.locator("#external").evaluate(node => (node as HTMLFormElement).reset());
  await expect(external.getByRole("radio", { name: "Alpha" })).toBeChecked();
  await many.evaluate(node => { (node as HTMLFieldSetElement).disabled = true; });
  expect(await page.locator("#owner").evaluate(node => new FormData(node as HTMLFormElement).getAll("many"))).toEqual([]);
});
