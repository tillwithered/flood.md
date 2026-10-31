import {test, expect, type Page} from "@playwright/test";
import {build} from "vite";
import {resolve} from "node:path";
import {mkdir, writeFile} from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";

let bundled: Promise<string>;
async function fixture() {
  const file = (path: string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  const directory = resolve(`.artifacts/date-picker-${process.pid}`), entry = resolve(directory, "entry.mjs");
  await mkdir(directory, {recursive:true});
  await writeFile(entry, `import React,{useState,StrictMode}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,DatePicker,Button,Dialog}from ${file("packages/react/dist/index.js")};
import ${file("packages/react/dist/styles.css")};const h=React.createElement;
function App(){const[changes,C]=useState([]),[open,O]=useState(false),[disabled,D]=useState(false),[readonly,R]=useState(false);
return h(FloodRoot,{style:{maxWidth:'28rem',padding:'1rem'}},h('h1',null,'Date picker checks'),
h('form',{id:'dates'},h(DatePicker,{id:'delivery',label:'Delivery',calendarLabel:'Delivery calendar',openCalendarLabel:'Choose delivery',name:'delivery',defaultValue:'2026-10-26',today:'2026-10-26',min:'2026-10-01',max:'2026-11-30',required:true,onValueChange:date=>C(value=>[...value,date])}),h(Button,{type:'reset'},'Reset dates')),
h(DatePicker,{id:'external',label:'External',name:'external',form:'dates',defaultValue:'2026-10-20',today:'2026-10-26'}),
h(DatePicker,{id:'fixed',label:'Fixed',value:'2026-10-26',today:'2026-10-26',open,onOpenChange:next=>{if(next)O(true)},onValueChange:date=>C(value=>[...value,'fixed:'+date])}),
h('label',null,h('input',{type:'checkbox',checked:disabled,onChange:event=>D(event.target.checked)}),'Disable picker group'),
h('label',null,h('input',{type:'checkbox',checked:readonly,onChange:event=>R(event.target.checked)}),'Read only picker'),
h('fieldset',{disabled},h('legend',null,'Available date'),h(DatePicker,{id:'inherited',label:'Inherited',defaultValue:'2026-10-26',today:'2026-10-26',readOnly:readonly})),
h(DatePicker,{id:'readonly',label:'Read only',readOnly:true,defaultOpen:true,defaultValue:'2026-10-26',today:'2026-10-26'}),
h(Dialog,{title:'Schedule',trigger:props=>h(Button,props,'Open schedule')},h(DatePicker,{id:'nested',label:'Nested',defaultValue:'2026-10-26',today:'2026-10-26'})),
h('input',{'aria-label':'Outside'}),h('output',{id:'changes'},JSON.stringify(changes)));}
createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
  const result = await build({configFile:false, logLevel:"silent", define:{"process.env.NODE_ENV":JSON.stringify("production")},
    build:{write:false, cssCodeSplit:false, lib:{entry,formats:["iife"],name:"DatePickerFixture"}}});
  const output = Array.isArray(result) ? result[0].output : result.output;
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Date picker checks</title><style>' +
    output.filter(item => item.type === "asset" && item.fileName.endsWith(".css")).map(item => (item as any).source).join("") +
    '</style></head><body><main id="app"></main><script>' + output.filter(item => item.type === "chunk").map(item => (item as any).code).join("") + '</script></body></html>';
}
async function open(page: Page) {
  bundled ??= fixture();
  await page.route("**/__date-picker.html", async route => route.fulfill({contentType:"text/html", body:await bundled}));
  await page.goto("/__date-picker.html");
  await expect(page.locator("#delivery")).toBeVisible();
}
const part = (page: Page, id: string, segment: string) => page.locator(`#${id}-${segment}`);
const submitted = (page: Page, name = "delivery") => page.locator("#dates").evaluate((form: HTMLFormElement, key) => new FormData(form).get(key), name);
const choose = (page: Page, date: string) => page.locator(`.flood-date-picker__panel:popover-open [data-calendar-date="${date}"]`).click();

test("DatePicker shares calendar and typed entry, submits one date and restores trigger focus", async ({page}) => {
  await open(page);
  const trigger = page.getByRole("button", {name:"Choose delivery", exact:true});
  await trigger.click();
  const popup = page.getByRole("dialog", {name:"Delivery calendar", exact:true});
  await expect(popup).toBeVisible();
  await expect(popup.locator('[data-calendar-date="2026-10-26"]')).toBeFocused();
  await choose(page, "2026-10-28");
  await expect(popup).toBeHidden(); await expect(trigger).toBeFocused();
  await expect(part(page,"delivery","day")).toHaveValue("28");
  expect(await submitted(page)).toBe("2026-10-28");
  expect(await page.locator("#dates").evaluate((form: HTMLFormElement) => new FormData(form).getAll("delivery"))).toEqual(["2026-10-28"]);
  await part(page,"delivery","day").fill("29");
  await trigger.click(); await expect(popup.locator('[data-calendar-date="2026-10-29"]')).toHaveAttribute("data-selected", "true");
  await page.keyboard.press("Escape"); await expect(popup).toBeHidden(); await expect(trigger).toBeFocused();
  const changes = await page.locator("#changes").textContent();
  await trigger.click(); await choose(page,"2026-10-29");
  await expect(popup).toBeHidden(); await expect(trigger).toBeFocused();
  await expect(page.locator("#changes")).toHaveText(changes!);
});

test("DatePicker preserves incomplete drafts without submitting an old date, then calendar selection repairs them", async ({page}) => {
  await open(page);
  await part(page,"delivery","day").fill("31"); await part(page,"delivery","month").fill("11");
  expect(await submitted(page)).toBe("");
  await page.getByRole("button", {name:"Choose delivery", exact:true}).click();
  await expect(part(page,"delivery","month")).toHaveValue("11");
  await expect(part(page,"delivery","day")).toHaveValue("31");
  await choose(page,"2026-10-27");
  await expect(part(page,"delivery","month")).toHaveValue("10");
  await expect(part(page,"delivery","day")).toHaveValue("27");
  expect(await submitted(page)).toBe("2026-10-27");
});

test("DatePicker respects host refusal for value and open state and keeps range constraints", async ({page}) => {
  await open(page);
  await page.getByRole("button", {name:"Open calendar: Fixed", exact:true}).click();
  await choose(page,"2026-10-28");
  await expect(page.getByRole("dialog", {name:"Fixed calendar", exact:true})).toBeVisible();
  await expect(part(page,"fixed","day")).toHaveValue("26");
  await expect(page.locator("#changes")).toContainText("fixed:2026-10-28");
  await page.goto("/__date-picker.html");
  await page.getByRole("button", {name:"Choose delivery", exact:true}).click();
  const outside = page.locator('.flood-date-picker__panel:popover-open [data-calendar-date="2026-09-30"]');
  await expect(outside).toHaveAttribute("aria-disabled", "true");
  await outside.click({force:true});
  expect(await submitted(page)).toBe("2026-10-26");
});

test("DatePicker resets uncontrolled and external-form values silently and honors prevented reset", async ({page}) => {
  await open(page);
  await page.getByRole("button", {name:"Choose delivery", exact:true}).click(); await choose(page,"2026-10-28");
  await page.getByRole("button", {name:"Open calendar: External", exact:true}).click(); await choose(page,"2026-10-24");
  const before = await page.locator("#changes").textContent();
  await page.locator("#dates").evaluate(form => form.addEventListener("reset", event => event.preventDefault(), {once:true}));
  await page.getByRole("button", {name:"Reset dates", exact:true}).click();
  expect(await submitted(page)).toBe("2026-10-28"); expect(await submitted(page,"external")).toBe("2026-10-24");
  await page.getByRole("button", {name:"Reset dates", exact:true}).click();
  await expect(part(page,"delivery","day")).toHaveValue("26");
  await expect(part(page,"external","day")).toHaveValue("20");
  expect(await submitted(page)).toBe("2026-10-26"); expect(await submitted(page,"external")).toBe("2026-10-20");
  await expect(page.locator("#changes")).toHaveText(before!);
});

test("DatePicker readOnly and inherited disabled close the calendar and prevent changes", async ({page}) => {
  await open(page);
  await expect(page.getByRole("button", {name:"Open calendar: Read only", exact:true})).toBeDisabled();
  await expect(page.getByRole("dialog", {name:"Read only calendar", exact:true})).toBeHidden();
  const inherited = page.getByRole("button", {name:"Open calendar: Inherited", exact:true});
  await inherited.click();
  await page.getByRole("checkbox", {name:"Disable picker group", exact:true}).check();
  await expect(inherited).toBeDisabled();
  await expect(page.getByRole("dialog", {name:"Inherited calendar", exact:true})).toBeHidden();
  await page.getByRole("checkbox", {name:"Disable picker group", exact:true}).uncheck();
  await page.getByRole("checkbox", {name:"Read only picker", exact:true}).check();
  await expect(inherited).toBeDisabled();
  await part(page,"inherited","day").focus(); await page.keyboard.press("ArrowUp");
  await expect(part(page,"inherited","day")).toHaveValue("26");
});

test("DatePicker Alt+Down and nested Escape keep the existing overlay ownership", async ({page}) => {
  await open(page);
  await page.getByRole("button", {name:"Open schedule", exact:true}).click();
  const modal = page.getByRole("dialog", {name:"Schedule", exact:true});
  await part(page,"nested","day").focus(); await page.keyboard.press("Alt+ArrowDown");
  const popup = page.getByRole("dialog", {name:"Nested calendar", exact:true});
  await expect(popup).toBeVisible();
  await page.keyboard.press("Escape"); await expect(popup).toBeHidden(); await expect(modal).toBeVisible();
  await expect(page.getByRole("button", {name:"Open calendar: Nested", exact:true})).toBeFocused();
  await page.keyboard.press("Escape"); await expect(modal).toBeHidden();
});

test("DatePicker keeps its calendar inside a narrow enlarged RTL viewport with accessible naming", async ({page}) => {
  await page.setViewportSize({width:390,height:900}); await open(page);
  await page.evaluate(() => {document.documentElement.dir="rtl"; document.documentElement.style.fontSize="24px";});
  await page.getByRole("button", {name:"Choose delivery", exact:true}).click();
  const popup = page.getByRole("dialog", {name:"Delivery calendar", exact:true});
  await expect(popup).toBeVisible();
  const box = (await popup.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x+box.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});


test("DatePicker popup tracks wide fields, preserves calendar width for short fields and clamps to viewport",async({page})=>{
 await open(page);await page.getByRole('button',{name:'Choose delivery',exact:true}).click();
 const field=page.locator('#delivery .flood-date-field__control');
 const popup=page.getByRole('dialog',{name:'Delivery calendar',exact:true});
 const geometry=async()=>{const a=(await field.boundingBox())!,b=(await popup.boundingBox())!;return{width:b.width-a.width,start:b.x-a.x,end:(b.x+b.width)-(a.x+a.width)};};
 await expect.poll(async()=>Math.abs((await geometry()).width)).toBeLessThan(1);
 await expect.poll(async()=>Math.abs((await geometry()).start)).toBeLessThan(1);
 await expect.poll(async()=>Math.abs((await geometry()).end)).toBeLessThan(1);
 await page.locator('#delivery').evaluate(node=>{node.style.width='18rem';});
 await expect.poll(async()=>Math.abs((await popup.boundingBox())!.width-320)).toBeLessThan(1);
 await expect.poll(async()=>(await geometry()).width).toBeGreaterThan(30);
 // A wider panel near the viewport edge must collision-clamp rather than keep
 // an impossible anchor-edge alignment outside the visible viewport.
 await expect.poll(async()=>{const a=(await field.boundingBox())!,b=(await popup.boundingBox())!;const gap=await popup.evaluate(e=>parseFloat(getComputedStyle(e).columnGap)||8);return Math.abs(b.x-Math.max(gap,a.x+a.width-b.width));}).toBeLessThan(1);
 await page.setViewportSize({width:320,height:900});
 await page.locator('#delivery').evaluate(node=>{node.style.width='40rem';});
 await expect.poll(async()=>{const b=(await popup.boundingBox())!;return b.x>=0 && b.x+b.width<=321 && b.width<320;}).toBe(true);
});
