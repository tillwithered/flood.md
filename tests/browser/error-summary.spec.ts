import {test, expect, type Page} from "@playwright/test";
import {build} from "vite";
import {resolve} from "node:path";
import {mkdir, writeFile} from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";

let bundled: Promise<string>;
async function fixture() {
  const file = (path: string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  const directory = resolve(`.artifacts/error-summary-${process.pid}`), entry = resolve(directory, "entry.mjs");
  await mkdir(directory, {recursive:true});
  await writeFile(entry, `import React,{useState,StrictMode}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,ErrorSummary,Field,Input,Select,Button}from ${file("packages/react/dist/index.js")};
import ${file("packages/react/dist/styles.css")};const h=React.createElement;
const initial=[{id:'email',fieldId:'customer:email[work]',message:'Enter an email address.'},{id:'region',fieldId:'region',message:'Choose a region.'},{id:'missing',fieldId:'not-rendered',message:'Open the missing field.'},{id:'cancel',fieldId:'cancelled',message:'Host opens this field.'}];
function App(){const[errors,E]=useState(initial),[announcement,A]=useState('off'),[autofocus,F]=useState(false),[selections,S]=useState([]);
return h(FloodRoot,{style:{padding:'1rem',maxWidth:'30rem'}},h('h1',null,'Error summary checks'),
h(ErrorSummary,{id:'summary',title:'Check your details',description:'Correct these fields before continuing.',errors,announcement,autoFocus:autofocus,onSelect:(error,event)=>{S(value=>[...value,error.id]);if(error.id==='cancel')event.preventDefault()}}),
h(Field,{id:'customer:email[work]',label:'Work email',hideLabel:true},props=>h(Input,{...props,name:'email'})),
h(Field,{id:'region',label:'Region'},props=>h(Select,{...props,defaultValue:''},h('option',{value:''},'Choose region'),h('option',{value:'east'},'East'))),
h(Input,{id:'cancelled','aria-label':'Host controlled field'}),h(Input,{'aria-label':'Continue typing'}),
h(Button,{onClick:()=>E([])},'Clear errors'),h(Button,{onClick:()=>E(initial)},'Restore errors'),
h(Button,{onClick:()=>E([{...initial[0],message:'Check the updated email address.'}])},'Update message'),
h(Button,{onClick:()=>A('polite')},'Polite announcements'),h(Button,{onClick:()=>A('assertive')},'Assertive announcements'),
h(Button,{onClick:()=>F(true)},'Focus new summary'),h('output',{'aria-label':'Selected error IDs'},JSON.stringify(selections)));}
createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
  const result = await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("production")},
    build:{write:false,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"ErrorSummaryFixture"}}});
  const output = Array.isArray(result) ? result[0].output : result.output;
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Error summary checks</title><style>' +
    output.filter(item => item.type === "asset" && item.fileName.endsWith(".css")).map(item => (item as any).source).join("") +
    '</style></head><body><main id="app"></main><script>' + output.filter(item => item.type === "chunk").map(item => (item as any).code).join("") + '</script></body></html>';
}
async function open(page: Page) {
  bundled ??= fixture();
  await page.route("**/__error-summary.html", async route => route.fulfill({contentType:"text/html",body:await bundled}));
  await page.goto("/__error-summary.html");
  await expect(page.getByRole("region",{name:"Check your details",exact:true})).toBeVisible();
}

test("ErrorSummary focuses exact target IDs, including hidden labels and Flood Select, through real links", async ({page}) => {
  await open(page);
  const summary = page.getByRole("region",{name:"Check your details",exact:true});
  await expect(summary.getByRole("listitem")).toHaveCount(4);
  const email = summary.getByRole("link",{name:"Enter an email address.",exact:true});
  await expect(email).toHaveAttribute("href","#customer%3Aemail%5Bwork%5D");
  await email.click();
  await expect(page.getByRole("textbox",{name:"Work email",exact:true})).toBeFocused();
  expect(await page.evaluate(() => decodeURIComponent(location.hash.slice(1)))).toBe("customer:email[work]");
  await summary.getByRole("link",{name:"Choose a region.",exact:true}).focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("combobox",{name:"Region",exact:true})).toBeFocused();
  await expect(page.getByRole("status",{name:"Selected error IDs",exact:true})).toHaveText('["email","region"]');
});

test("ErrorSummary host cancellation and modifier activation preserve browser ownership", async ({page}) => {
  await open(page);
  const cancel = page.getByRole("link",{name:"Host opens this field.",exact:true});
  await cancel.click();
  await expect(page.getByRole("textbox",{name:"Host controlled field",exact:true})).not.toBeFocused();
  expect(await page.evaluate(() => location.hash)).toBe("");
  const email = page.getByRole("link",{name:"Enter an email address.",exact:true});
  for (const modifier of ["ctrlKey","metaKey","shiftKey","altKey"]) {
    const prevented = await email.evaluate((node,key) => {
      let componentPrevented = false;
      // Observe after React's delegated handler, then suppress the synthetic
      // event's actual navigation so this test does not open extra browser tabs.
      document.addEventListener("click",event => {componentPrevented=event.defaultPrevented;event.preventDefault();},{once:true});
      const event = new MouseEvent("click",{bubbles:true,cancelable:true,[key]:true});
      node.dispatchEvent(event); return componentPrevented;
    },modifier);
    expect(prevented).toBe(false);
    await expect(page.getByRole("textbox",{name:"Work email",exact:true})).not.toBeFocused();
  }
});

test("ErrorSummary missing targets fall back to native fragment navigation without errors", async ({page}) => {
  const errors: string[] = []; page.on("pageerror",error => errors.push(error.message));
  await open(page);
  const missing = page.getByRole("link",{name:"Open the missing field.",exact:true});
  await missing.focus(); await missing.press("Enter");
  expect(await page.evaluate(() => location.hash)).toBe("#not-rendered");
  await expect(page.getByRole("link",{name:"Open the missing field.",exact:true})).toBeFocused();
  expect(errors).toEqual([]);
});

test("ErrorSummary opts into one live channel and autofocus does not steal focus on message updates", async ({page}) => {
  await open(page);
  const summary = page.getByRole("region",{name:"Check your details",exact:true});
  await expect(summary).not.toHaveAttribute("aria-live");
  await page.getByRole("button",{name:"Polite announcements",exact:true}).click();
  await expect(summary).toHaveAttribute("aria-live","polite");
  await page.getByRole("button",{name:"Assertive announcements",exact:true}).click();
  await expect(summary).toHaveAttribute("aria-live","assertive");
  await expect(summary.getByRole("alert")).toHaveCount(0); await expect(summary.getByRole("status")).toHaveCount(0);
  await page.getByRole("button",{name:"Focus new summary",exact:true}).click(); await expect(summary).toBeFocused();
  await expect(summary).not.toHaveAttribute("aria-live");
  const typing = page.getByRole("textbox",{name:"Continue typing",exact:true});
  await typing.fill("Keep typing");
  // Simulate host validation updating while the user is editing, without
  // introducing a platform-dependent pointer focus change to another button.
  await page.getByRole("button",{name:"Update message",exact:true}).evaluate(node => node.click());
  await expect(summary.getByRole("link",{name:"Check the updated email address.",exact:true})).toBeVisible();
  await expect(typing).toBeFocused();
  await page.getByRole("button",{name:"Clear errors",exact:true}).click(); await expect(summary).toHaveCount(0);
  await page.getByRole("button",{name:"Restore errors",exact:true}).click(); await expect(summary).toBeFocused();
});

test("ErrorSummary long messages retain accessible list structure in narrow enlarged RTL layouts", async ({page}) => {
  await page.setViewportSize({width:320,height:900}); await open(page);
  await page.evaluate(() => {document.documentElement.dir="rtl"; document.documentElement.style.fontSize="24px";});
  const summary = page.getByRole("region",{name:"Check your details",exact:true});
  await summary.getByRole("link").first().evaluate(node => {node.textContent="LongValidationMessageWithoutSpaces".repeat(6);});
  await expect(summary.getByRole("list")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});
