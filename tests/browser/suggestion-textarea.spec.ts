import {expect, test} from "@playwright/test";
import {mkdir, writeFile} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {build} from "vite";

test("SuggestionTextarea anchors its options to the caret and replaces only the current token", async ({page}, info) => {
  await page.goto("/components/suggestion-textarea");
  const field = page.locator(".preview-stage").getByRole("textbox");
  await field.fill("Loop in @maZZ about ref.");
  await field.press("Home");
  for (let index=0; index<11; index++) await field.press("ArrowRight");
  const people = page.getByRole("listbox", {name:/people|mention/i});
  const maya = people.getByRole("option", {name:/Maya Chen/});
  await expect(maya).toBeVisible();
  await expect(field).toBeFocused();
  await expect(field).toHaveAttribute("aria-activedescendant", (await maya.getAttribute("id"))!);
  const inputBounds = (await field.boundingBox())!;
  const listBounds = (await people.boundingBox())!;
  expect(listBounds.x).toBeGreaterThan(inputBounds.x + 30);
  expect(listBounds.y).toBeGreaterThan(inputBounds.y);
  await page.locator(".preview-stage").screenshot({path:info.outputPath("suggestions-at-caret.png")});
  await field.press("Enter");
  await expect(field).toHaveValue(/^Loop in @?Maya Chen +about ref\.$/);
  await expect(field).toBeFocused();
  await expect(people).toHaveCount(0);

  await field.fill("someone@example.org");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await field.fill("Good morning\n/");
  const commands = page.getByRole("listbox", {name:/commands|replies/i});
  await expect(commands.getByRole("option", {name:/Thank the customer/})).toBeVisible();
  await field.press("ArrowDown");
  const review = commands.getByRole("option", {name:/Request review/});
  await expect(field).toHaveAttribute("aria-activedescendant", (await review.getAttribute("id"))!);
  await field.press("Escape");
  await expect(commands).toHaveCount(0);
  await expect(field).toHaveValue("Good morning\n/");
});

test("MessageComposer inserts with Enter before sending the updated draft", async ({page}, info) => {
  const path = info.outputPath("suggestion-fixture.mjs");
  const file = (path: string) => JSON.stringify(resolve(path).replaceAll("\\","/"));
  await mkdir(dirname(path), {recursive:true});
  await writeFile(path, `
    import React,{useState} from ${file("node_modules/react/index.js")};
    import {createRoot} from ${file("node_modules/react-dom/client.js")};
    import {FloodRoot,MessageComposer} from ${file("packages/react/dist/index.js")};
    import ${file("packages/react/dist/styles.css")};
    const suggestions=[{trigger:"@",label:"People",items:[{id:"maya",label:"Maya Chen",insertText:"@Maya Chen"}]}];
    const h=React.createElement;
    function App() {
      const [value,setValue]=useState("");
      const [sent,setSent]=useState("");
      const [selection,setSelection]=useState("");
      return h(FloodRoot,null,h("div",{style:{width:"min(26rem, 100%)"}},
        h(MessageComposer,{label:"Reply",value,onValueChange:setValue,suggestions,onSend:()=>setSent(value),
          onSuggestionSelect:detail=>setSelection(JSON.stringify([detail.item.id,detail.start,detail.end]))}),
        h("output",{"aria-label":"Sent message"},sent),
        h("output",{"aria-label":"Inserted suggestion"},selection)));
    }
    createRoot(document.getElementById("app")).render(h(App));
  `);
  const output = await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("development")},
    build:{write:false,cssCodeSplit:false,lib:{entry:path,name:"SuggestionFixture",formats:["iife"]}}});
  const files = (Array.isArray(output) ? output : [output]).flatMap(file=>"output" in file ? file.output : []);
  const script = files.find(file=>file.type==="chunk")?.code;
  const css = files.find(file=>file.type==="asset" && file.fileName.endsWith(".css"))?.source;
  if (!script || !css) throw new Error("Suggestion fixture assets are missing");
  await page.route("**/__suggestion-fixture", route=>route.fulfill({contentType:"text/html",
    body:`<!doctype html><html lang="en"><title>Composer suggestions</title><style>${css}</style><body style="background:#191919;margin:32px"><div id="app"></div><script>${script.replace(/<\/script/gi,"<\\/script")}</script></body></html>`}));
  await page.goto("/__suggestion-fixture");
  const composer = page.getByRole("textbox",{name:"Reply"});
  await composer.fill("Ask @ma");
  const option = page.getByRole("option",{name:"Maya Chen"});
  await expect(option).toBeVisible();
  await page.screenshot({path:info.outputPath("composer-suggestion.png")});
  await composer.press("Enter");
  await expect(composer).toHaveValue("Ask @Maya Chen");
  await expect(page.locator('output[aria-label="Inserted suggestion"]')).toHaveText('["maya",4,7]');
  await expect(page.locator('output[aria-label="Sent message"]')).toBeEmpty();
  await composer.press("Enter");
  await expect(page.locator('output[aria-label="Sent message"]')).toHaveText("Ask @Maya Chen");
});

test.describe("touch suggestion menu", () => {
  test.use({ viewport: {width:390,height:844}, isMobile:true, hasTouch:true });
  test("plain mentions keep a touch target and replace only the draft token", async ({page}, info) => {
    await page.goto("/components/suggestion-textarea");
    const field = page.locator(".preview-stage").getByRole("textbox",{name:"Reply"});
    await field.fill("Loop in @");
    const people = page.getByRole("listbox",{name:"People"});
    const panel = page.locator(".flood-suggestion-textarea__panel:popover-open");
    const sam = people.getByRole("option",{name:"Sam Rivera"});
    await expect(sam).toBeVisible();
    const touch = await sam.evaluate(node=>({
      coarse:matchMedia("(pointer: coarse)").matches,
      actual:node.getBoundingClientRect().height,
      minimum:parseFloat(getComputedStyle(node).getPropertyValue("--flood-sys-size-touch")) * parseFloat(getComputedStyle(document.documentElement).fontSize),
    }));
    expect(touch.coarse).toBe(true);
    expect(touch.actual).toBeGreaterThanOrEqual(touch.minimum);
    const bounds = (await panel.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:info.outputPath("suggestions-touch.png")});
    await sam.tap();
    await expect(field).toHaveValue("Loop in @Sam Rivera");
    await expect(field).toBeFocused();
    await expect(people).toHaveCount(0);
  });
});
