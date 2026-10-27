import {test, expect, type Page} from "@playwright/test";
import {build} from "vite";
import {resolve} from "node:path";
import {mkdir, writeFile} from "node:fs/promises";

let bundled: Promise<string>;
async function fixture() {
  const file = (path:string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  const directory = resolve(`.artifacts/hover-card-${process.pid}`), entry = resolve(directory, "entry.mjs");
  await mkdir(directory, {recursive:true});
  await writeFile(entry, `import React,{StrictMode,useState}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,HoverCard,Button,Input}from ${file("packages/react/dist/index.js")};
import ${file("packages/react/dist/styles.css")};const h=React.createElement;
function App(){const[disabled,D]=useState(false);return h(FloodRoot,{style:{padding:'2rem'}},h('h1',null,'Hover checks'),h(Input,{'aria-label':'Before preview'}),h(HoverCard,{title:'Alex Morgan',openDelay:80,closeDelay:120,disabled,trigger:props=>h(Button,props,'View Alex')},h('p',null,'Product designer'),h(Input,{'aria-label':'Profile note'}),h('a',{href:'#profile'},'Open profile')),h(Input,{'aria-label':'After preview'}),h(Button,{onClick:()=>D(value=>!value)},'Disable preview'));}
createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
  const result = await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("production")},build:{write:false,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"HoverCardFixture"}}});
  const output = Array.isArray(result) ? result[0].output : result.output;
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hover checks</title><style>'+output.filter(x=>x.type==="asset"&&x.fileName.endsWith(".css")).map(x=>(x as any).source).join("")+'</style></head><body><main id="app"></main><script>'+output.filter(x=>x.type==="chunk").map(x=>(x as any).code).join("")+'</script></body></html>';
}
async function open(page:Page) {
  bundled ??= fixture();
  await page.route("**/__hover-card.html", async route => route.fulfill({contentType:"text/html",body:await bundled}));
  await page.goto("/__hover-card.html");
  await expect(page.getByRole("button", {name:"View Alex",exact:true})).toBeVisible();
}

test("HoverCard preserves focus and supports keyboard entry and dismissal",async({page})=>{
  await open(page);
  const trigger = page.getByRole("button",{name:"View Alex",exact:true}), panel = page.getByRole("dialog",{name:"Alex Morgan"});
  await trigger.focus(); await expect(panel).toBeVisible(); await expect(trigger).toBeFocused();
  await page.keyboard.press("ArrowDown"); await expect(page.getByRole("button",{name:"Close preview"})).toBeFocused();
  await page.keyboard.press("Tab"); await expect(page.getByRole("textbox",{name:"Profile note"})).toBeFocused();
  // Windows WebKit follows platform settings that omit links from sequential Tab order.
  // Verify native link activation independently without changing runtime keyboard behavior.
  const link = page.getByRole("link",{name:"Open profile"});
  await link.focus(); await page.keyboard.press("Enter"); await expect(page).toHaveURL(/#profile$/);
  await page.keyboard.press("Escape"); await expect(panel).toBeHidden(); await expect(trigger).toBeFocused();
  await page.waitForTimeout(160); await expect(panel).toBeHidden();
  await page.getByRole("textbox",{name:"Before preview"}).focus(); await trigger.focus(); await expect(panel).toBeVisible();
  await page.getByRole("textbox",{name:"After preview"}).focus(); await expect(panel).toBeHidden();
});

test("HoverCard hover travel remains open while its content is used",async({page})=>{
  await open(page);
  const trigger=page.getByRole("button",{name:"View Alex",exact:true}), panel=page.getByRole("dialog",{name:"Alex Morgan"});
  await trigger.hover(); await expect(panel).toBeVisible();
  await panel.hover(); await page.waitForTimeout(180); await expect(panel).toBeVisible();
  await page.getByRole("heading",{name:"Hover checks"}).hover(); await expect(panel).toBeHidden();
});

test("HoverCard explicit activation pins the preview and disabled blocks it",async({page})=>{
  await open(page);
  const trigger=page.getByRole("button",{name:"View Alex",exact:true}), panel=page.getByRole("dialog",{name:"Alex Morgan"});
  await trigger.click(); await expect(panel).toBeVisible();
  await page.getByRole("heading",{name:"Hover checks"}).hover(); await page.waitForTimeout(180); await expect(panel).toBeVisible();
  await trigger.click(); await expect(panel).toBeHidden();
  await page.getByRole("button",{name:"Disable preview"}).click(); await expect(trigger).toBeDisabled();
  await trigger.hover(); await page.waitForTimeout(120); await expect(panel).toBeHidden();
});
