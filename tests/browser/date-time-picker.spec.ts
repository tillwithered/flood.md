import {test, expect, type Page} from "@playwright/test";
import {build} from "vite";
import {mkdir, writeFile} from "node:fs/promises";
import {resolve} from "node:path";

let bundle: Promise<string>;
async function fixture() {
  const file = (path:string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  const directory = resolve(`.artifacts/date-time-picker-${process.pid}`);
  await mkdir(directory, {recursive:true});
  const entry = resolve(directory, "entry.mjs");
  await writeFile(entry, `import React,{StrictMode,useState}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,DateTimePicker,Button,Checkbox}from ${file("packages/react/dist/index.js")};
import ${file("packages/react/dist/styles.css")};const h=React.createElement;
function App(){const[readOnly,R]=useState(false),[disabled,D]=useState(false),[cancel,C]=useState(false),[accept,A]=useState(false),[fixed,F]=useState({date:'2026-10-26',time:'14:30'}),[requested,Q]=useState('');return h(FloodRoot,null,h('h1',null,'Civil date and time'),
h('form',{id:'appointment',onReset:e=>{if(cancel)e.preventDefault()},onSubmit:e=>e.preventDefault()},h('fieldset',{disabled},h('legend',null,'Booking'),h(DateTimePicker,{id:'meeting',label:'Meeting',dateLabel:'Meeting date',timeLabel:'Meeting time',dateName:'date',timeName:'time',defaultValue:{date:'2026-10-26',time:'14:30'},required:true,readOnly}),h(Button,{type:'reset'},'Reset meeting'))),
h('form',{id:'controlled'},h(DateTimePicker,{id:'fixed',label:'Fixed meeting',dateLabel:'Fixed date',timeLabel:'Fixed time',dateName:'date',timeName:'time',value:fixed,onValueChange:next=>{Q(JSON.stringify(next));if(accept)F(next)}})),
h(Checkbox,{label:'Read only',checked:readOnly,onChange:e=>R(e.currentTarget.checked)}),h(Checkbox,{label:'Disable fieldset',checked:disabled,onChange:e=>D(e.currentTarget.checked)}),h(Checkbox,{label:'Cancel reset',checked:cancel,onChange:e=>C(e.currentTarget.checked)}),h(Checkbox,{label:'Accept changes',checked:accept,onChange:e=>A(e.currentTarget.checked)}),h('output',{'aria-label':'Requested meeting'},requested));}createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
  const result = await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("development")},build:{write:false,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"DateTimeFixture"}}});
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(result => "output" in result ? result.output : []);
  const css = outputs.filter(item => item.type === "asset" && item.fileName.endsWith(".css")).map(item => item.type === "asset" ? String(item.source) : "").join("\n");
  const js = outputs.filter(item => item.type === "chunk").map(item => item.type === "chunk" ? item.code : "").join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Civil date and time</title><style>${css}body{margin:16px;background:#181818;color:white}main{max-width:36rem}fieldset{min-width:0}</style></head><body><main id="app"></main><script>${js.replace(/<\/script/gi,"<\\/script")}</script></body></html>`;
}
async function open(page:Page) {
  bundle ??= fixture();
  await page.route("**/__date-time.html", async route => route.fulfill({contentType:"text/html",body:await bundle}));
  await page.goto("/__date-time.html");
}
const data = (page:Page, id="appointment") => page.locator(`#${id}`).evaluate((form:HTMLFormElement) => Object.fromEntries(new FormData(form)));
const segment = (page:Page, part:string, id="meeting") => page.locator(`#${id} [data-segment="${part}"]`);
const time = (page:Page, part:string, id="meeting") => page.locator(`#${id} [data-time-segment="${part}"]`);

test("DateTimePicker errors do not stretch or displace the neighboring control", async({page}) => {
  await open(page);
  const dateControl=page.locator("#meeting .flood-date-field__control");
  const timeControl=page.locator("#meeting .flood-time-field__control");
  const beforeDate=(await dateControl.boundingBox())!;
  const beforeTime=(await timeControl.boundingBox())!;
  await time(page,"minute").fill("61");
  await page.getByRole("heading",{name:"Civil date and time"}).click();
  await expect(page.locator("#meeting .flood-time-field__error")).toBeVisible();
  const afterDate=(await dateControl.boundingBox())!;
  const afterTime=(await timeControl.boundingBox())!;
  expect(afterDate.y).toBeCloseTo(beforeDate.y,1);
  expect(afterDate.height).toBeCloseTo(beforeDate.height,1);
  expect(afterTime.y).toBeCloseTo(beforeTime.y,1);
  expect(afterTime.height).toBeCloseTo(beforeTime.height,1);
  await time(page,"minute").fill("30");
  await segment(page,"day").fill("32");
  await page.getByRole("heading",{name:"Civil date and time"}).click();
  await expect(page.locator("#meeting .flood-date-field__error")).toBeVisible();
  const finalTime=(await timeControl.boundingBox())!;
  // On narrow screens the time field follows the date's validation message.
  // Its own control height must remain unchanged in either arrangement.
  expect(finalTime.height).toBeCloseTo(beforeTime.height,1);
  if ((page.viewportSize()?.width ?? 0)>480) expect(finalTime.y).toBeCloseTo(beforeTime.y,1);
});

test("DateTimePicker submits separate civil date/time values and blocks incomplete required parts", async({page}) => {
  await open(page);
  expect(await data(page)).toEqual({date:"2026-10-26", time:"14:30"});
  await time(page,"hour").fill("09"); await time(page,"minute").fill("45");
  expect(await data(page)).toEqual({date:"2026-10-26", time:"09:45"});
  await time(page,"minute").fill("");
  expect(await data(page)).toEqual({date:"2026-10-26", time:""});
  expect(await page.locator("#appointment").evaluate((form:HTMLFormElement) => form.checkValidity())).toBe(false);
  await time(page,"minute").fill("15"); await segment(page,"day").fill("");
  expect(await data(page)).toEqual({date:"", time:"09:15"});
  expect(await page.locator("#appointment").evaluate((form:HTMLFormElement) => form.checkValidity())).toBe(false);
});

test("DateTimePicker reset cancellation and native readonly/disabled preserve composed contracts", async({page}) => {
  await open(page); await time(page,"hour").fill("08"); await segment(page,"day").fill("27");
  await page.getByRole("checkbox",{name:"Cancel reset",exact:true}).check();
  await page.getByRole("button",{name:"Reset meeting",exact:true}).click();
  expect(await data(page)).toEqual({date:"2026-10-27", time:"08:30"});
  await page.getByRole("checkbox",{name:"Cancel reset",exact:true}).uncheck();
  await page.getByRole("button",{name:"Reset meeting",exact:true}).click();
  await expect(time(page,"hour")).toHaveValue("14");
  expect(await data(page)).toEqual({date:"2026-10-26", time:"14:30"});
  await page.getByRole("checkbox",{name:"Read only",exact:true}).check();
  await segment(page,"day").focus(); await page.keyboard.press("ArrowUp");
  await time(page,"hour").focus(); await page.keyboard.press("ArrowUp");
  expect(await data(page)).toEqual({date:"2026-10-26", time:"14:30"});
  await expect(time(page,"hour")).toHaveAttribute("readonly", "");
  await page.getByRole("checkbox",{name:"Disable fieldset",exact:true}).check();
  await expect(segment(page,"day")).toBeDisabled(); expect(await data(page)).toEqual({});
});

test("DateTimePicker reports full requested pairs and excludes a refused draft until blur restores accepted time", async({page}) => {
  await open(page);
  await time(page,"hour","fixed").focus(); await page.keyboard.press("ArrowUp");
  await expect(page.getByRole("status",{name:"Requested meeting"})).toHaveText('{"date":"2026-10-26","time":"15:30"}');
  expect(await data(page,"controlled")).toEqual({date:"2026-10-26",time:""});
  expect(await page.locator("#controlled").evaluate((form:HTMLFormElement) => form.checkValidity())).toBe(false);
  await time(page,"hour","fixed").blur();
  await expect(time(page,"hour","fixed")).toHaveValue("14");
  expect(await data(page,"controlled")).toEqual({date:"2026-10-26",time:"14:30"});
  await page.getByRole("checkbox",{name:"Accept changes",exact:true}).check();
  await segment(page,"day","fixed").focus(); await page.keyboard.press("ArrowUp");
  expect(await data(page,"controlled")).toEqual({date:"2026-10-27",time:"14:30"});
  await time(page,"hour","fixed").focus(); await page.keyboard.press("ArrowUp");
  expect(await data(page,"controlled")).toEqual({date:"2026-10-27",time:"15:30"});
});
