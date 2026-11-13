import {test,expect,type Page} from "@playwright/test";
import {build} from "vite";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
let bundled:Promise<string>;
async function fixture(){
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll("\\","/"));
  const directory=resolve(`.artifacts/data-table-${process.pid}`);await mkdir(directory,{recursive:true});const entry=resolve(directory,"entry.mjs");
  await writeFile(entry,`import React,{useState}from ${file("node_modules/react/index.js")};import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,DataTable,Button,Checkbox,Drawer}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};const h=React.createElement;
const columns=[{id:'name',label:'Name',sortable:true},{id:'score',label:'Score',sortable:true,numeric:true},{id:'status',label:'Status'}];
const formatter=new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'});
const source=[['a','Alpha',10],['b','Bravo',2],['c','Charlie',2],['d','Delta',null],['e','Echo',3]].map(([id,name,score])=>({id,label:name,cells:{name,score:score===null?'Unknown':h('strong',null,formatter.format(score)),status:'0012'},sortValues:{score},selectionDisabled:id==='c'}));
function App(){const[state,S]=useState('ready'),[rows,R]=useState(source),[locked,L]=useState(false),[requested,Q]=useState('');return h(FloodRoot,null,h('h1',null,'Table checks'),h(DataTable,{caption:'Projects',columns,rows,pageSize:2,selectable:true,minWidth:'34rem',state,sort:locked?null:undefined,selectedIds:locked?[]:undefined,onSortChange:next=>Q(JSON.stringify(next)),onSelectionChange:next=>Q(JSON.stringify(next)),onRetry:()=>S('ready')}),
h(Button,{onClick:()=>S('loading')},'Load'),h(Button,{onClick:()=>S('error')},'Fail'),h(Button,{onClick:()=>S('ready')},'Ready'),h(Button,{onClick:()=>R([])},'Empty'),h(Button,{onClick:()=>R([source[0]])},'Shrink'),h(Checkbox,{label:'Controlled refusal',checked:locked,onChange:e=>L(e.currentTarget.checked)}),h('output',{'aria-label':'Requested'},requested));}
function ActionTable(){
  return h(FloodRoot,null,h(Drawer,{title:'Project details',size:'lg',trigger:buttonProps=>h(DataTable,{
    caption:'Projects',hideCaption:true,inset:'roomy',toolbar:h('h1',{style:{margin:0}},'Action table'),
    columns:columns.map(column=>column.id==='score'?{...column,align:'start'}:column.id==='status'?{...column,align:'end'}:column),selectable:true,minWidth:'18rem',rows:[{
      id:'alpha',label:'Alpha',primaryAction:{column:'name',title:'Alpha',description:'Project 101',buttonProps},
      cells:{score:12,status:h('a',{href:'#activity'},'Activity')}
    }]
  })},'Project content'));
}
function VisibilityTable(){
  return h(FloodRoot,null,h(DataTable,{
    caption:'Saved layout',columns,rows:[],selectable:true,showColumnVisibility:true,
    hiddenColumnIds:['name','score','status','removed-column'],
  }));
}
const Screen = location.search === '?visibility' ? VisibilityTable : location.search ? ActionTable : App;
createRoot(document.getElementById('app')).render(h(Screen));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("production")},build:{write:false,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"DataTableFixture"}}});
  const output=(Array.isArray(result)?result:[result]).flatMap(x=>"output"in x?x.output:[]);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Table checks</title><style>'+output.filter(x=>x.type==="asset"&&x.fileName.endsWith(".css")).map(x=>(x as any).source).join("")+'body{margin:1rem;background:#181818;color:white}main{max-width:42rem}</style></head><body><main id="app"></main><script>'+output.filter(x=>x.type==="chunk").map(x=>(x as any).code).join("")+'</script></body></html>';
}
async function open(page:Page,action=false){bundled??=fixture();await page.route(/\/__data-table\.html(?:\?.*)?$/,async route=>route.fulfill({contentType:"text/html",body:await bundled}));await page.goto(action ? "/__data-table.html?action" : "/__data-table.html");}
const names=(page:Page)=>page.locator("tbody tr td:nth-child(2)").allTextContents();

test("record action opens from row or keyboard and leaves other controls independent",async({page})=>{
  await open(page,true);
  const table=page.getByRole("table",{name:"Projects"});
  const row=table.getByRole("row").nth(1);
  const title=row.getByRole("button",{name:"Alpha"});
  const dialog=page.getByRole("dialog",{name:"Project details"});
  const choice=row.getByRole("checkbox");
  await choice.check();
  await expect(dialog).toBeHidden();
  await row.getByRole("link",{name:"Activity"}).click();
  await expect(page).toHaveURL(/#activity$/);
  await expect(dialog).toBeHidden();
  await row.getByRole("cell",{name:"12",exact:true}).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(title).toBeFocused();
  await title.press("Enter");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  const geometry=await title.evaluate(button=>{
    const wrapper=button.closest(".flood-data-table")!;
    const edge=wrapper.getBoundingClientRect().left;
    const heading=wrapper.querySelector("h1")!.getBoundingClientRect();
    const cell=wrapper.querySelector<HTMLTableCellElement>("tbody td")!;
    const inset=cell.querySelector("label")!.getBoundingClientRect().left-cell.getBoundingClientRect().left;
    const description=button.nextElementSibling!.getBoundingClientRect();
    return {headingInset:heading.left-edge,inset,gap:description.top-button.getBoundingClientRect().bottom};
  });
  expect(geometry.headingInset).toBeCloseTo(geometry.inset,0);
  expect(geometry.gap).toBeLessThanOrEqual(8);
});

test("DataTable mixed sortable and plain header labels share a vertical centre",async({page})=>{
  await open(page);
  const centres=await page.locator('thead th:not(.flood-data-table__choice)').evaluateAll(headers=>headers.map(header=>{
    const label=header.querySelector('.flood-data-table__header-label')!;
    const range=document.createRange();range.selectNodeContents(label);
    const rect=range.getBoundingClientRect();return rect.y+rect.height/2;
  }));
  expect(Math.max(...centres)-Math.min(...centres)).toBeLessThanOrEqual(1);
});
test("DataTable sort targets have side clearance while header text aligns with body cells",async({page})=>{
  await open(page);
  const geometry=await page.getByRole("button",{name:"Sort by Name"}).evaluate(button=>{
    const text=button.querySelector('.flood-data-table__header-label')!;
    const range=document.createRange();range.selectNodeContents(text);
    const bounds=button.getBoundingClientRect(),label=range.getBoundingClientRect();
    const body=button.closest("table")!.querySelector("tbody tr td:nth-child(2)")!;
    const bodyRange=document.createRange();bodyRange.selectNodeContents(body);
    return {inset:label.left-bounds.left,header:label.left,body:bodyRange.getBoundingClientRect().left};
  });
  expect(geometry.inset).toBeGreaterThanOrEqual(8);
  expect(geometry.header).toBeCloseTo(geometry.body,0);
});
test("DataTable sorts rich numeric cells stably and leaves missing values last",async({page})=>{
  await open(page);const sort=page.getByRole("button",{name:"Sort by Score"});
  await sort.click();expect(await names(page)).toEqual(["Bravo","Charlie"]);await expect(page.getByRole("columnheader",{name:"Sort by Score"})).toHaveAttribute("aria-sort","ascending");
  await page.getByRole("button",{name:"Next page",exact:true}).click();expect(await names(page)).toEqual(["Echo","Alpha"]);
  await page.getByRole("button",{name:"Next page",exact:true}).click();expect(await names(page)).toEqual(["Delta"]);
  await sort.click();expect(await names(page)).toEqual(["Alpha","Echo"]);
  await expect(page.getByRole("columnheader",{name:"Sort by Score"})).toHaveAttribute("aria-sort","descending");
  await expect(sort.locator("svg")).toHaveCSS("rotate","180deg");
  await page.getByRole("button",{name:"Next page",exact:true}).click();await page.getByRole("button",{name:"Next page",exact:true}).click();expect(await names(page)).toEqual(["Delta"]);
  await sort.click();expect(await names(page)).toEqual(["Alpha","Bravo"]);
});
test("DataTable aligns comparable amounts and preserves identifiers and explicit action alignment", async ({ page }) => {
  await open(page);
  const amountHeader = page.getByRole("columnheader", { name: "Sort by Score" });
  const amount = page.getByRole("cell", { name: /10,00\s*€/ });
  for (const cell of [amountHeader, amount]) {
    await expect(cell).toHaveCSS("text-align", "end");
    await expect(cell).toHaveCSS("font-variant-numeric", "tabular-nums");
  }
  const identifier = page.getByRole("cell", { name: "0012", exact: true }).first();
  await expect(identifier).toHaveCSS("text-align", "start");
  await expect(identifier).toHaveCSS("font-variant-numeric", "normal");

  await open(page, true);
  for (const cell of [amountHeader, page.getByRole("cell", { name: "12", exact: true })]) {
    await expect(cell).toHaveCSS("text-align", "start");
    await expect(cell).toHaveCSS("font-variant-numeric", "tabular-nums");
  }
  const action = page.getByRole("cell", { name: "Activity", exact: true });
  await expect(action).toHaveCSS("text-align", "end");
  await expect(action).toHaveCSS("font-variant-numeric", "normal");
});
test("DataTable select-all is page scoped and preserves selections on other pages",async({page})=>{
  await open(page);const all=page.getByRole("checkbox",{name:"Select rows on this page",exact:true});
  await page.getByRole("checkbox",{name:"Select Alpha",exact:true}).check();await expect(all).toHaveAttribute("aria-checked","mixed");
  await all.check();await page.getByRole("button",{name:"Next page",exact:true}).click();
  await expect(page.getByRole("checkbox",{name:"Select Charlie",exact:true})).toBeDisabled();
  await all.check();await expect(page.locator(".flood-data-table__footer").getByRole("status")).toHaveText("3 of 4 selected");
  await page.getByRole("button",{name:"Previous page",exact:true}).click();await expect(all).toBeChecked();
  await all.uncheck();await expect(page.locator(".flood-data-table__footer").getByRole("status")).toHaveText("1 of 4 selected");
});
test("DataTable clamps pages and ignores removed selection IDs",async({page})=>{
  await open(page);await page.getByRole("checkbox",{name:"Select Bravo",exact:true}).check();
  await page.getByRole("button",{name:"Next page",exact:true}).click();await page.getByRole("button",{name:"Next page",exact:true}).click();
  await page.getByRole("button",{name:"Shrink",exact:true}).click();expect(await names(page)).toEqual(["Alpha"]);
  await expect(page.locator(".flood-data-table__footer").getByRole("status")).toHaveText("0 of 1 selected");await expect(page.getByRole("navigation")).toHaveCount(0);
});
test("hiding the result range preserves page navigation and selection feedback", async ({ page }) => {
  await page.goto("/components/data-table");
  const preview = page.locator(".preview-stage");
  const footer = preview.locator(".flood-data-table__footer");
  await expect(footer.getByText("1–5 of 7", { exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: "DataTable prop showResults", exact: true }).uncheck();
  await expect(footer.getByText("1–5 of 7", { exact: true })).toHaveCount(0);

  await preview.getByRole("checkbox", { name: "Select Design system", exact: true }).check();
  await expect(footer.getByRole("status")).toHaveText("1 of 6 selected");
  await footer.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(preview.getByRole("row", { name: /Marketing/ })).toBeVisible();
  await expect(footer.getByRole("status")).toHaveText("1 of 6 selected");
  await expect(footer.getByText("6–7 of 7", { exact: true })).toHaveCount(0);
  await page.getByRole("checkbox", { name: "DataTable prop showSelection", exact: true }).uncheck();
  await expect(footer.getByRole("status")).toHaveCount(0);
  await expect(preview.locator(".flood-data-table > .flood-visually-hidden[role=status]")).toHaveText("1 of 6 selected");
  await expect(footer.getByRole("button", { name: "Previous page", exact: true })).toBeVisible();
});

test("Columns changes the layout without changing the active sort or selected rows", async ({ page }) => {
  await page.goto("/components/data-table");
  const preview = page.locator(".preview-stage");
  const table = preview.getByRole("table", { name: "Projects" });
  await table.getByRole("button", { name: "Sort by Owner", exact: true }).click();
  await table.getByRole("checkbox", { name: "Select Design system", exact: true }).check();
  await preview.getByRole("button", { name: "Next page", exact: true }).click();
  const trigger = preview.getByRole("button", { name: "Columns", exact: true });
  await trigger.click();
  const menu = page.getByRole("menu", { name: "Columns", exact: true });
  await expect(menu.getByRole("menuitemcheckbox", { name: "Owner (sorted)" })).toHaveAttribute("aria-disabled", "true");
  const status = menu.getByRole("menuitemcheckbox", { name: "Status", exact: true });
  await status.focus();
  await status.press("Space");
  await expect(status).toHaveAttribute("aria-checked", "false");
  await expect(menu).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Sort by Status" })).toHaveCount(0);
  await expect(table.getByRole("columnheader", { name: "Sort by Owner" })).toHaveAttribute("aria-sort", "ascending");
  await expect(preview.getByText("6–7 of 7", { exact: true })).toBeVisible();
  await expect(preview.getByText("1 of 6 selected", { exact: true })).toBeVisible();
  await menu.getByRole("menuitem", { name: "Reset columns" }).click();
  await expect(table.getByRole("columnheader", { name: "Sort by Status" })).toBeVisible();
  await expect(trigger).toBeFocused();
});

test("DataTable keeps headings on one line and exposes unit and resize cues", async ({ page }) => {
  await page.goto("/components/data-table");
  const table = page.getByRole("table", { name: "Projects", exact: true });
  const handle = table.getByRole("separator", { name: "Resize Project column" });
  await page.evaluate(() => document.fonts.ready);
  await expect(handle).toHaveAttribute("title", "Resize Project column");
  await expect(handle.locator("svg")).toBeVisible();
  await handle.press("Home");
  const header = table.getByRole("columnheader", { name: "Sort by Budget (USD)" });
  await expect(header.getByText("USD", { exact: true })).toBeVisible();
  const wrapping = await table.locator(".flood-data-table__header-label").evaluateAll(labels =>
    labels.filter(label => getComputedStyle(label).whiteSpace !== "nowrap").map(label => label.textContent));
  expect(wrapping).toEqual([]);
  const clipped = await table.locator(".flood-data-table__header-label").evaluateAll(labels =>
    labels.filter(label => {
      const range = document.createRange();
      range.selectNodeContents(label);
      return range.getBoundingClientRect().width - label.getBoundingClientRect().width > 0.05;
    }).map(label => label.textContent));
  expect(clipped).toEqual([]);
});

test("truncated headings reveal their full name through a keyboard tooltip", async ({ page }) => {
  await page.goto("/components/data-table");
  await page.evaluate(() => document.fonts.ready);
  const grip = page.getByRole("separator", { name: "Resize Owner column" });
  const sort = page.getByRole("button", { name: "Sort by Owner", exact: true });
  const hint = page.getByRole("tooltip", { name: "Owner", exact: true });
  await grip.press("Home");
  await expect.poll(() => sort.locator(".flood-data-table__header-label").evaluate(label =>
    label.scrollWidth > label.clientWidth)).toBe(true);
  await sort.focus();
  await expect(hint).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(hint).toBeHidden();
  await grip.press("End");
  await sort.focus();
  await expect(hint).toBeHidden();
});

test("the sticky header and pinned project column stay actionable at their intersection", async ({ page }) => {
  await page.setViewportSize({ width: 740, height: 900 });
  await page.goto("/components/data-table");
  await page.getByRole("checkbox", { name: "DataTable prop stickyHeader" }).check();
  const table = page.getByRole("table", { name: "Projects", exact: true });
  await table.getByRole("button", { name: "Expand Design system" }).click();
  await expect(table.getByRole("table", { name: "Design system milestones" })).toBeVisible();
  const header = table.getByRole("columnheader", { name: "Sort by Project", exact: true });
  await expect(header).toHaveAttribute("data-pin-edge", "start");
  const scroll = await header.evaluate(cell => {
    const viewport = cell.closest<HTMLElement>(".flood-scroll-area__viewport")!;
    const before = cell.getBoundingClientRect();
    viewport.scrollTo({ left: 140, top: 90 });
    const after = cell.getBoundingClientRect();
    return { left: viewport.scrollLeft, top: viewport.scrollTop, dx: after.left - before.left, dy: after.top - before.top };
  });
  expect(scroll.left).toBeGreaterThan(0);
  expect(scroll.top).toBeGreaterThan(0);
  expect(scroll.dx).toBeCloseTo(0, 0);
  expect(scroll.dy).toBeCloseTo(0, 0);
  await header.getByRole("button", { name: "Sort by Project" }).click();
  await expect(header).toHaveAttribute("aria-sort", "ascending");
});

test("cell edits update the status badge and sort by the saved budget", async ({ page }) => {
  await page.goto("/components/data-table");
  const table = page.getByRole("table", { name: "Projects", exact: true });
  await table.getByRole("button", { name: "Status for Design system: Active" }).click();
  await page.getByRole("menuitemradio", { name: "Draft", exact: true }).click();
  const status = table.getByRole("button", { name: "Status for Design system: Draft" });
  await expect(status.locator(".flood-badge")).toHaveAttribute("data-tone", "info");

  await table.getByRole("button", { name: "Sort by Budget (USD)" }).click();
  const original = table.getByRole("button", { name: "Edit: Budget for Agent guides. 4,500" });
  const column = table.getByRole("columnheader", { name: "Sort by Budget (USD)" });
  const columnBox = (await column.boundingBox())!;
  const row = table.getByRole("row").filter({ hasText: "Agent guides" });
  const rowHeight = (await row.boundingBox())!.height;
  await original.click();
  const input = table.getByRole("textbox", { name: "Budget for Agent guides" });
  const editor = table.locator(".flood-editable[data-editing]");
  await expect(editor.locator(":popover-open")).toBeVisible();
  expect((await column.boundingBox())!.width).toBeCloseTo(columnBox.width, 0);
  expect((await row.boundingBox())!.height).toBeCloseTo(rowHeight, 0);
  for (const name of ["Save", "Cancel"]) {
    const field = (await input.boundingBox())!;
    const action = (await editor.getByRole("button", { name, exact: true }).boundingBox())!;
    expect(action.y + action.height / 2).toBeCloseTo(field.y + field.height / 2, 0);
    expect(action.x).toBeGreaterThanOrEqual(field.x + field.width);
  }
  const panel = editor.locator(":popover-open");
  const shortWidth = (await panel.boundingBox())!.width;
  await input.fill("12,345,678,901,234.56");
  expect((await panel.boundingBox())!.width).toBeGreaterThan(shortWidth);
  expect((await column.boundingBox())!.width).toBeCloseTo(columnBox.width, 0);
  // WebKit rounds the intrinsic input width and the caret's scroll extent differently.
  expect(await input.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  await input.fill("-1");
  await input.press("Enter");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await input.press("Escape");
  await expect(original).toBeFocused();

  await original.click();
  await input.fill("1,000.25");
  await input.press("Enter");
  const saved = table.getByRole("button", { name: "Edit: Budget for Agent guides. 1,000.25" });
  await expect(saved).toBeFocused();
  await expect(table.locator(":scope > tbody > tr").first()).toContainText("Agent guides");
  await expect(table.getByRole("img", { name: "Five-week budget: USD 3500 to 1000.25" })).toBeVisible();
  await saved.click();
  await input.fill("20000");
  await input.press("Enter");
  await expect(saved).toHaveCount(0);
  await expect(table.getByRole("button", { name: "Sort by Budget (USD)" })).toBeFocused();
});

test("a stale saved layout retains a data column and gives empty content the visible span", async ({ page }) => {
  await open(page);
  await page.goto("/__data-table.html?visibility");
  const table = page.getByRole("table", { name: "Saved layout" });
  await expect(table.getByRole("columnheader")).toHaveCount(2);
  await expect(table.getByRole("columnheader", { name: "Sort by Name" })).toBeVisible();
  const emptyCell = table.locator("tbody td");
  await expect(emptyCell).toHaveText("No results found.");
  await expect(emptyCell).toHaveAttribute("colspan", "2");
  await page.getByRole("button", { name: "Columns", exact: true }).click();
  const menu = page.getByRole("menu", { name: "Columns" });
  await expect(menu.getByRole("menuitemcheckbox", { name: "Name", exact: true })).toHaveAttribute("aria-disabled", "true");
  await menu.getByRole("menuitemcheckbox", { name: "Status", exact: true }).click();
  await expect(table.getByRole("columnheader", { name: "Status" })).toHaveCount(0);
});

test("DataTable controlled refusal does not apply sort or selection proposals",async({page})=>{
  await open(page);await page.getByRole("checkbox",{name:"Controlled refusal",exact:true}).check();
  await page.getByRole("button",{name:"Sort by Score"}).click();expect(await names(page)).toEqual(["Alpha","Bravo"]);
  await expect(page.getByLabel("Requested",{exact:true})).toContainText('"ascending"');
  await page.getByRole("checkbox",{name:"Select Alpha",exact:true}).click();await expect(page.getByRole("checkbox",{name:"Select Alpha",exact:true})).not.toBeChecked();
  await expect(page.getByLabel("Requested",{exact:true})).toHaveText('["a"]');
});
test("DataTable loading, retry and empty states retain native table structure",async({page})=>{
  await open(page);await page.getByRole("button",{name:"Load",exact:true}).click();
  await expect(page.locator(".flood-data-table")).toHaveAttribute("aria-busy","true");await expect(page.getByRole("button",{name:"Sort by Name"})).toBeDisabled();
  await expect(page.locator(".flood-data-table__state").getByRole("status")).toBeVisible();
  await page.getByRole("button",{name:"Fail",exact:true}).click();await expect(page.getByText("Could not load the rows.",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Try again",exact:true}).click();expect(await names(page)).toEqual(["Alpha","Bravo"]);
  await page.getByRole("button",{name:"Empty",exact:true}).click();await expect(page.getByText("No results found.",{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
