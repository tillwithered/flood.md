import { test, expect, type Page } from "@playwright/test";
import { build } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

let bundled: Promise<string>;
async function fixture() {
  const file = (path: string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  const directory = resolve(`.artifacts/data-table-columns-${process.pid}`);
  await mkdir(directory, { recursive: true });
  const entry = resolve(directory, "entry.mjs");
  await writeFile(entry, `
    import React, { useState } from ${file("node_modules/react/index.js")};
    import { createRoot } from ${file("node_modules/react-dom/client.js")};
    import { FloodRoot, DataTable, Button } from ${file("packages/react/dist/index.js")};
    import ${file("packages/react/dist/styles.css")};
    const h = React.createElement;
    const columns = [
      { id: "notes", label: "Notes", width: "12rem" },
      { id: "cost", label: "Cost", numeric: true, width: "8rem", pinned: "end", resizable: true, minWidth: 88, maxWidth: 240 },
      { id: "name", label: "Name", sortable: true, width: "8rem", pinned: "start", resizable: true, minWidth: 88, maxWidth: 240 },
      { id: "owner", label: "Owner", width: "12rem" },
    ];
    const rows = [
      { id: "a", cells: { name: "Alpha", notes: "First note", owner: "Maya", cost: 42 } },
      { id: "b", cells: { name: "Bravo", notes: "Second note", owner: "Sam", cost: 31 } },
    ];
    const flags = new URLSearchParams(location.search);
    function App() {
      const [request, setRequest] = useState("");
      const [narrow, setNarrow] = useState(false);
      const rtl = flags.has("rtl");
      return h(FloodRoot, { dir: rtl ? "rtl" : "ltr" },
        h("main", { style: { width: narrow ? "17rem" : "36rem" } },
          h(DataTable, {
            caption: "Column layout", hideCaption: true, columns, rows, selectable: true,
            showColumnVisibility: true, showResults: false, showSelection: false,
            defaultColumnWidths: { name: 136, cost: 112 },
            columnWidths: flags.has("locked") ? { name: 136, cost: 112 } : undefined,
            onColumnWidthsChange: widths => setRequest(JSON.stringify(widths)),
          }),
          h(Button, { onClick: () => setNarrow(!narrow) }, "Change viewport"),
          h("output", { "aria-label": "Requested widths" }, request)
        )
      );
    }
    createRoot(document.getElementById("app")).render(h(App));
  `);
  const result = await build({
    configFile: false, logLevel: "silent", define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: { write: false, cssCodeSplit: false, lib: { entry, formats: ["iife"], name: "ColumnFixture" } },
  });
  const output = (Array.isArray(result) ? result : [result]).flatMap(result => "output" in result ? result.output : []);
  const css = output.map(part => part.type === "asset" && part.fileName.endsWith(".css") ? part.source : "").join("");
  const js = output.map(part => part.type === "chunk" ? part.code : "").join("");
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>${css}
    body{margin:0;background:#181818;color:white}main{max-width:100%}
  </style><div id="app"></div><script>${js}</script>`;
}

async function open(page: Page, query = "") {
  bundled ??= fixture();
  await page.route("http://fixture.test/**", async route => route.fulfill({ contentType: "text/html", body: await bundled }));
  await page.goto(`http://fixture.test/${query}`);
}

test("resizing a column preserves adjacent widths and sort and resets with the column menu", async ({ page }) => {
  await open(page);
  const name = page.getByRole("columnheader", { name: "Sort by Name", exact: true });
  const notes = page.getByRole("columnheader", { name: "Notes", exact: true });
  const handle = page.getByRole("separator", { name: "Resize Name column" });
  await expect.poll(() => name.evaluate(node => node.offsetWidth)).toBe(136);
  const baseline = await notes.evaluate(node => node.offsetWidth);
  await name.getByRole("button", { name: "Sort by Name" }).click();
  await handle.press("ArrowRight");
  await expect(handle).toHaveAttribute("aria-valuenow", "144");
  await expect.poll(() => name.evaluate(node => node.offsetWidth)).toBe(144);
  expect(await notes.evaluate(node => node.offsetWidth)).toBe(baseline);
  await expect(name).toHaveAttribute("aria-sort", "ascending");
  const position = await handle.boundingBox();
  if (!position) throw new Error("Resize handle is missing");
  await page.mouse.move(position.x + position.width / 2, position.y + position.height / 2);
  await page.mouse.down();
  await page.mouse.move(position.x + position.width / 2 + 32, position.y + position.height / 2);
  await expect(handle).toHaveAttribute("aria-valuenow", "176");
  await page.mouse.up();
  await expect.poll(() => name.evaluate(node => node.offsetWidth)).toBe(176);
  await page.getByRole("button", { name: "Columns", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Notes" }).click();
  await expect(notes).toBeHidden();
  if (!await page.getByRole("menuitem", { name: "Reset columns" }).isVisible()) {
    await page.getByRole("button", { name: "Columns", exact: true }).click();
  }
  await page.getByRole("menuitem", { name: "Reset columns" }).click();
  await expect(notes).toBeVisible();
  await expect(handle).toHaveAttribute("aria-valuenow", "136");
  await expect.poll(() => name.evaluate(node => node.offsetWidth)).toBe(136);
});

for (const rtl of [false, true]) {
  test(`pinning uses logical edges and falls back in narrow ${rtl ? "RTL" : "LTR"} tables`, async ({ page }) => {
    await open(page, rtl ? "?rtl" : "");
    const table = page.getByRole("table", { name: "Column layout" });
    await expect(table.getByRole("columnheader", { name: "Sort by Name", exact: true })).toHaveAttribute("data-pin-edge", "start");
    const names = await table.getByRole("row").first().locator(".flood-data-table__header-label").allInnerTexts();
    expect(names).toEqual(["Name", "Notes", "Owner", "Cost"]);
    const coordinates = () => table.evaluate((node, rtl) => {
      const viewport = node.closest<HTMLElement>(".flood-scroll-area__viewport")!;
      const bounds = viewport.getBoundingClientRect();
      const [checkbox, name, notes, , cost] = [...node.querySelectorAll("thead th")].map(header => header.getBoundingClientRect());
      return {
        viewport: viewport.clientWidth,
        start: rtl ? bounds.right - checkbox.right : checkbox.left - bounds.left,
        name: rtl ? checkbox.left - name.right : name.left - checkbox.right,
        end: rtl ? cost.left - bounds.left : bounds.right - cost.right,
        middle: notes.left,
      };
    }, rtl);
    const before = await coordinates();
    expect(before.start).toBeCloseTo(0, 0);
    expect(before.name).toBeCloseTo(0, 0);
    expect(before.end).toBeCloseTo(0, 0);
    await table.evaluate((node, rtl) => {
      node.closest<HTMLElement>(".flood-scroll-area__viewport")!.scrollLeft = rtl ? -200 : 200;
    }, rtl);
    const scrolled = await coordinates();
    expect(scrolled.start).toBeCloseTo(0, 0);
    expect(scrolled.name).toBeCloseTo(0, 0);
    expect(scrolled.end).toBeCloseTo(0, 0);
    expect(scrolled.middle).not.toBeCloseTo(before.middle, 0);
    await page.getByRole("button", { name: "Change viewport" }).click();
    await expect(table.getByRole("columnheader", { name: "Sort by Name", exact: true })).not.toHaveAttribute("data-pin-edge");
    await expect(table.getByRole("columnheader", { name: "Cost", exact: true })).not.toHaveAttribute("data-pin-edge");
  });
}

test("controlled refusal keeps the displayed width and the proposed width map is keyed by column", async ({ page }) => {
  await open(page, "?locked");
  const handle = page.getByRole("separator", { name: "Resize Cost column" });
  await expect(handle).toHaveAttribute("aria-valuenow", "112");
  await handle.press("Shift+ArrowLeft");
  await expect(page.getByLabel("Requested widths")).toHaveText('{"cost":136,"name":136}');
  await expect(handle).toHaveAttribute("aria-valuenow", "112");
  await expect.poll(() => page.getByRole("columnheader", { name: "Cost", exact: true }).evaluate(node => node.offsetWidth)).toBe(112);
});

test("touch dragging resizes the column without panning the table", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "Touch drag uses Chromium DevTools input");
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await open(page);
    const handle = page.getByRole("separator", { name: "Resize Name column" });
    const box = await handle.boundingBox();
    if (!box) throw new Error("Resize handle is missing");
    const x = Math.round(box.x + box.width / 2);
    const y = Math.round(box.y + box.height / 2);
    const input = await context.newCDPSession(page);
    await input.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await input.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + 24, y }] });
    await input.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(handle).toHaveAttribute("aria-valuenow", "160");
    const scroll = await handle.evaluate(node => node.closest(".flood-scroll-area__viewport")?.scrollLeft);
    expect(scroll).toBe(0);
  } finally {
    await context.close();
  }
});
