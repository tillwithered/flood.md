import { expect, test, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "vite";

let fixture: Promise<string> | undefined;

async function buildFixture() {
  const file = (path: string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  const directory = resolve(`.artifacts/data-table-expansion-${process.pid}`);
  await mkdir(directory, { recursive: true });
  const entry = resolve(directory, "entry.mjs");
  await writeFile(entry, `import React, {useState} from ${file("node_modules/react/index.js")};
    import {createRoot} from ${file("node_modules/react-dom/client.js")};
    import {Button,DataTable,FloodRoot,Table} from ${file("packages/react/dist/index.js")};
    import ${file("packages/react/dist/styles.css")};
    const h = React.createElement;
    const columns = [{id:'name',label:'Name',sortable:true},{id:'status',label:'Status'}];
    function App() {
      const [action, setAction] = useState('');
      const [expanded, setExpanded] = useState([]);
      const [hidden, setHidden] = useState([]);
      const rows = [
        {id:'alpha',label:'Alpha',cells:{status:'Active'},primaryAction:{column:'name',title:'Alpha',buttonProps:{onClick:()=>setAction('Opened Alpha')}},
         expandedContent:h(Table,{caption:'Alpha tasks',hideCaption:true,cellVerticalAlign:'top'},
           h('thead',null,h('tr',null,h('th',{scope:'col'},'Task'))),
           h('tbody',null,h('tr',null,h('td',null,h(Button,{onClick:()=>setExpanded([])},'Close from details')))))},
        {id:'bravo',label:'Bravo',cells:{name:'Bravo',status:'Paused'}},
        {id:'charlie',label:'Charlie',cells:{name:'Charlie',status:'Active'}}
      ];
      return h(FloodRoot,null,h(DataTable,{caption:'Projects',columns,rows,selectable:true,striped:true,pageSize:2,minWidth:'40rem',
        expandedIds:expanded,onExpandedChange:setExpanded,hiddenColumnIds:hidden,onHiddenColumnIdsChange:setHidden,showColumnVisibility:true,
        labels:{rowDetails:'Details',expandRow:name=>'Show '+name,collapseRow:name=>'Hide '+name}}),h('output',null,action));
    }
    createRoot(document.getElementById('app')).render(h(App));`);
  const result = await build({
    configFile: false,
    logLevel: "silent",
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: { write: false, cssCodeSplit: false, lib: { entry, formats: ["iife"], name: "ExpansionFixture" } },
  });
  const output = (Array.isArray(result) ? result : [result]).flatMap(item => "output" in item ? item.output : []);
  const styles = output.flatMap(item => item.type === "asset" && item.fileName.endsWith(".css") ? [item.source] : []).join("");
  const scripts = output.flatMap(item => item.type === "chunk" ? [item.code] : []).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Expansion checks</title><style>${styles}</style></head><body><main id="app"></main><script>${scripts}</script></body></html>`;
}

async function openTable(page: Page) {
  fixture ??= buildFixture();
  const html = await fixture;
  await page.route("**/__data-table-expansion.html", route => route.fulfill({ contentType: "text/html", body: html }));
  await page.goto("/__data-table-expansion.html");
  return page.getByRole("table", { name: "Projects" });
}

test("row details use an independent disclosure, native nested table and current column count", async ({ page }) => {
  const projects = await openTable(page);
  const toggle = projects.getByRole("button", { name: "Show Alpha" });
  const bravo = projects.getByRole("row", { name: /Bravo/ });
  const initialStripe = await bravo.evaluate(row => getComputedStyle(row).backgroundColor);
  await expect(projects.getByRole("columnheader", { name: "Details" })).toHaveCount(1);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.focus();
  await toggle.press("Space");

  const close = projects.getByRole("button", { name: "Hide Alpha" });
  const detailRow = projects.locator(":scope > tbody > .flood-data-table__expanded-row");
  await expect(close).toHaveAttribute("aria-expanded", "true");
  await expect(close).toHaveAttribute("aria-controls", (await detailRow.getAttribute("id"))!);
  await expect(detailRow.locator(":scope > td")).toHaveAttribute("colspan", "4");
  await expect(detailRow.getByRole("table", { name: "Alpha tasks" })).toBeVisible();
  await expect(detailRow.getByRole("cell", { name: "Close from details" })).toHaveCSS("vertical-align", "top");
  await expect(page.locator("output")).toBeEmpty();
  await expect(projects.getByRole("checkbox", { name: "Select Alpha" })).not.toBeChecked();
  await expect(bravo).toHaveCSS("background-color", initialStripe);
  await projects.getByRole("checkbox", { name: "Select Bravo" }).check();
  await expect(bravo).not.toHaveCSS("background-color", initialStripe);

  await page.getByRole("button", { name: "Columns" }).click();
  await page.getByRole("menuitemcheckbox", { name: "Status" }).click();
  await expect(detailRow.locator(":scope > td")).toHaveAttribute("colspan", "3");
  await page.keyboard.press("Escape");
  await detailRow.getByRole("button", { name: "Close from details" }).click();
  await expect(detailRow).toHaveCount(0);
  await expect(toggle).toBeFocused();
  await projects.getByRole("button", { name: "Alpha", exact: true }).click();
  await expect(page.locator("output")).toHaveText("Opened Alpha");
});

test("expansion stays with the record while sorting and paging", async ({ page }) => {
  const projects = await openTable(page);
  await projects.getByRole("button", { name: "Show Alpha" }).click();
  const details = projects.getByRole("table", { name: "Alpha tasks" });
  await expect(details).toBeVisible();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(details).toHaveCount(0);
  await expect(projects.getByRole("columnheader", { name: "Details" })).toHaveCount(1);
  await page.getByRole("button", { name: "Previous page" }).click();
  await expect(details).toBeVisible();
  await projects.getByRole("button", { name: "Sort by Name" }).click();
  await expect(details).toBeVisible();
  await projects.getByRole("button", { name: "Sort by Name" }).click();
  await expect(details).toHaveCount(0);
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(details).toBeVisible();
});

test("expanded content stays within a narrow table viewport while scrolling columns", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const projects = await openTable(page);
  await projects.getByRole("button", { name: "Show Alpha" }).click();
  const details = projects.getByRole("table", { name: "Alpha tasks" });
  const measure = () => details.evaluate(table => {
    const viewport = table.closest(".flood-data-table")!.querySelector(".flood-scroll-area__viewport")!;
    const visible = viewport.getBoundingClientRect(), inner = table.getBoundingClientRect();
    return { start: inner.left - visible.left, end: visible.right - inner.right };
  });
  await expect.poll(async () => (await measure()).end).toBeGreaterThanOrEqual(0);
  await projects.evaluate(table => {
    const viewport = table.parentElement!;
    viewport.scrollLeft = viewport.scrollWidth;
  });
  await expect.poll(async () => (await measure()).start).toBeGreaterThanOrEqual(0);
  await expect(details.getByRole("button", { name: "Close from details" })).toBeInViewport();
});
