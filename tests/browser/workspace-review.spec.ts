import {test, expect, type Page} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {build} from "vite";
import {mkdir, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {chooseSelectOption} from "./select-helpers";

let html: Promise<string>;
async function fixture() {
  const directory = resolve(`.artifacts/workspace-review-${process.pid}`);
  await mkdir(directory, {recursive:true});
  const entry = resolve(directory, "entry.mjs");
  const file = (path:string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  await writeFile(entry, `import React from ${file("node_modules/react/index.js")};
import {createRoot} from ${file("node_modules/react-dom/client.js")};
import {FloodRoot} from ${file("packages/react/dist/index.js")};
import {WorkspaceReview} from ${file("apps/website/src/recipes/workspace-review.tsx")};
import ${file("packages/react/dist/styles.css")};
createRoot(document.getElementById('app')).render(React.createElement(FloodRoot,null,React.createElement(WorkspaceReview)));`);
  const result = await build({configFile:false, logLevel:"silent", define:{"process.env.NODE_ENV":JSON.stringify("production")},
    build:{write:false, cssCodeSplit:false, lib:{entry, formats:["iife"], name:"WorkspaceReview"}}});
  const output = (Array.isArray(result) ? result : [result]).flatMap(item => "output" in item ? item.output : []);
  const css = output.filter(item => item.type === "asset" && item.fileName.endsWith(".css")).map(item => (item as {source:string}).source).join("");
  const js = output.filter(item => item.type === "chunk").map(item => (item as {code:string}).code).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Workspace review</title><style>${css}body{margin:0;background:#181818;color:white}main{max-width:40rem;margin-inline:auto;padding:1rem;box-sizing:border-box}</style></head><body><main id="app"></main><script>${js}</script></body></html>`;
}
async function open(page:Page) {
  html ??= fixture();
  await page.route("**/__workspace-review", route => html.then(body => route.fulfill({contentType:"text/html", body})));
  await page.goto("/__workspace-review");
}

test("workspace composition preserves validation, real form values, snapshot and reset", async ({page}) => {
  await open(page);
  const form = page.getByRole("form", {name:"Workspace review settings"});
  const name = page.getByRole("textbox", {name:"Workspace name"});
  await name.fill("   ");
  await form.getByRole("button", {name:"Accept locally"}).click();
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Snapshot accepted in memory only.", {exact:false})).toHaveCount(0);
  await name.fill("Team space");
  await chooseSelectOption(page.getByRole("combobox", {name:"Visibility"}), "team");
  await page.getByRole("checkbox", {name:"Product updates"}).uncheck();
  expect(await form.evaluate(node => Object.fromEntries(new FormData(node as HTMLFormElement)))).toEqual({workspace:"Team space", visibility:"team"});
  await form.getByRole("button", {name:"Accept locally"}).click();
  await expect(page.getByText("Accepted in this session", {exact:true})).toBeVisible();
  await expect(page.locator("dd")).toHaveText(["Team space", "Project team", "Off"]);
  await name.fill("Changed draft");
  await expect(page.getByText("Unsaved changes", {exact:true})).toBeVisible();
  await expect(page.locator("dd").first()).toHaveText("Team space");
  await form.evaluate(node => node.addEventListener("reset", event => event.preventDefault(), {once:true}));
  await form.getByRole("button", {name:"Reset settings"}).click();
  await expect(name).toHaveValue("Changed draft");
  await form.getByRole("button", {name:"Reset settings"}).click();
  await expect(name).toHaveValue("Design workspace");
  await expect(page.getByRole("checkbox", {name:"Product updates"})).toBeChecked();
  await expect(page.locator("dd")).toHaveCount(0);
});

test("workspace drawer retains form state, names, focus and nested primitive anatomy", async ({page}) => {
  await open(page);
  const errors:string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.getByRole("textbox", {name:"Workspace name"}).fill("Unsubmitted draft");
  const trigger = page.getByRole("button", {name:"Review files", exact:true});
  await trigger.focus(); await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", {name:"Files", exact:true});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("list", {name:"Sample project files"}).getByRole("listitem")).toHaveCount(2);
  await expect(dialog.locator(".flood-file-meta")).toHaveCount(2);
  await expect(dialog.locator(".flood-status-indicator__dot")).toHaveCount(2);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused();
  await expect(page.getByRole("textbox", {name:"Workspace name"})).toHaveValue("Unsubmitted draft");
  await trigger.click(); await dialog.getByRole("button", {name:"Done reviewing"}).click();
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});

test("workspace composition remains reachable at enlarged narrow RTL sizes", async ({page}, info) => {
  await open(page);
  await page.setViewportSize({width:320, height:900});
  await page.evaluate(() => {document.documentElement.style.fontSize="32px"; document.documentElement.dir="rtl";});
  await page.getByRole("textbox", {name:"Workspace name"}).fill("A long but readable workspace name");
  await page.getByRole("button", {name:"Accept locally"}).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole("button", {name:"Review files", exact:true}).click();
  const dialog = page.getByRole("dialog", {name:"Files", exact:true});
  const files = dialog.getByRole("list", {name:"Sample project files"});
  expect(await files.evaluate(root => {
    const box=root.getBoundingClientRect(), walker=document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node:Node|null;
    while(node=walker.nextNode()) {
      if (!node.textContent?.trim()) continue;
      const range=document.createRange(); range.selectNodeContents(node);
      if(Array.from(range.getClientRects()).some(rect=>rect.left < box.left-1 || rect.right > box.right+1)) return false;
    }
    return true;
  })).toBe(true);
  await files.scrollIntoViewIfNeeded();
  await page.screenshot({path:`.artifacts/workspace-review-files-${info.project.name}.png`});
  const done=dialog.getByRole("button", {name:"Done reviewing"});
  await done.scrollIntoViewIfNeeded(); await done.click();
  await expect(dialog).not.toBeVisible();
});
