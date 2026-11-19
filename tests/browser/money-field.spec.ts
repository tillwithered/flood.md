import {expect, test, type Locator} from "@playwright/test";
import {mkdir, writeFile} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {build} from "vite";
import {chooseSelectOption} from "./select-helpers";

async function attachForm(field: Locator) {
  await field.evaluate((input: HTMLInputElement) => {
    const group = input.closest(".flood-input-group")!;
    const form = document.createElement("form");
    form.id = "money-test";
    group.before(form);
    input.setAttribute("form", form.id);
    const hidden = group.nextElementSibling;
    if (!(hidden instanceof HTMLInputElement) || hidden.type !== "hidden") throw new Error("Missing canonical form field");
    hidden.setAttribute("form", form.id);
  });
}

test("MoneyField keeps a localized draft and submits the exact decimal", async ({page}, info) => {
  await page.goto("/components/money-field");
  await chooseSelectOption(page.getByRole("combobox", {name:"MoneyField prop currency"}), "EUR");
  await chooseSelectOption(page.getByRole("combobox", {name:"MoneyField prop locale"}), "de-DE");
  const field = page.getByRole("textbox", {name:"Refund amount"});
  const form = page.locator("#money-test");
  const readAmount = () => form.evaluate((node: HTMLFormElement) => new FormData(node).get("amount"));
  const valid = () => form.evaluate((node: HTMLFormElement) => node.checkValidity());
  await expect(field).toHaveValue("1299,50");
  await expect(field).toHaveAccessibleDescription("EUR");
  await page.locator(".preview-stage").screenshot({path:info.outputPath("money-field-resting.png")});
  await attachForm(field);
  await expect.poll(readAmount).toBe("1299.50");

  await field.fill("1.999,");
  await expect(field).toHaveValue("1.999,");
  expect(await valid()).toBe(false);
  expect(await readAmount()).toBeNull();
  await field.fill("1.999,09");
  await field.blur();
  await expect(field).toHaveValue("1999,09");
  expect(await valid()).toBe(true);
  expect(await readAmount()).toBe("1999.09");

  await field.fill("2000,01");
  await field.blur();
  await expect(field).toHaveAttribute("aria-invalid", "true");
  expect(await readAmount()).toBeNull();
  await page.locator(".preview-stage").screenshot({path:info.outputPath("money-field-invalid.png")});

  await field.fill("");
  expect(await valid()).toBe(true);
  expect(await readAmount()).toBe("");
});

test("MoneyField uses the currency precision and accepts localized digits", async ({page}) => {
  await page.goto("/components/money-field");
  const currency = page.getByRole("combobox", {name:"MoneyField prop currency"});
  const field = page.getByRole("textbox", {name:"Refund amount"});
  await chooseSelectOption(currency, "JPY");
  await expect(field).toHaveValue("1299");
  await field.fill("1299.0");
  expect(await field.evaluate((node: HTMLInputElement) => node.checkValidity())).toBe(false);
  await chooseSelectOption(currency, "KWD");
  await chooseSelectOption(page.getByRole("combobox", {name:"MoneyField prop locale"}), "ar-KW");
  await expect(field).toHaveValue("١٢٩٩٫٥٠٠");
  await attachForm(field);
  await field.fill("١٩٫٠٠١");
  expect(await page.locator("#money-test").evaluate((node: HTMLFormElement) => new FormData(node).get("amount"))).toBe("19.001");
});

test("MoneyField keeps exact large values, controlled updates and native reset", async ({page}, info) => {
  const path = info.outputPath("money-fixture.mjs");
  const file = (path: string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  await mkdir(dirname(path), {recursive:true});
  await writeFile(path, `
    import React,{useState} from ${file("node_modules/react/index.js")};
    import {createRoot} from ${file("node_modules/react-dom/client.js")};
    import {FloodRoot,MoneyField,Button} from ${file("packages/react/dist/index.js")};
    const h=React.createElement;
    function App() {
      const [value,setValue]=useState("12.50");
      return h(FloodRoot,null,
        h("form",{id:"amounts"},h(MoneyField,{"aria-label":"Large amount",name:"amount",currency:"USD",defaultValue:"0.05"}),
          h(MoneyField,{"aria-label":"Controlled amount",name:"controlled",currency:"EUR",value,required:true}),
          h(Button,{type:"reset"},"Reset")),
        h(Button,{onClick:()=>setValue("3.49")},"Replace controlled amount"));
    }
    createRoot(document.getElementById("app")).render(h(App));
  `);
  const output = await build({
    configFile:false, logLevel:"silent",
    define: {"process.env.NODE_ENV":JSON.stringify("development")},
    build:{write:false, lib:{entry:path, name:"MoneyFixture", formats:["iife"]}},
  });
  const chunks = (Array.isArray(output) ? output : [output]).flatMap(file=>"output" in file ? file.output : []);
  const script = chunks.find(file=>file.type==="chunk")?.code;
  if (!script) throw new Error("MoneyField test fixture failed to compile");
  await page.route("**/__money-fixture", route=>route.fulfill({
    contentType:"text/html",
    body:`<!doctype html><html lang="en"><title>Money field</title><div id="app"></div><script>${script.replace(/<\/script/gi,"<\\/script")}</script></html>`,
  }));
  await page.goto("/__money-fixture");
  const large = page.getByRole("textbox", {name:"Large amount"});
  const controlled = page.getByRole("textbox", {name:"Controlled amount"});
  const form = page.locator("#amounts");
  const amount = () => form.evaluate((node: HTMLFormElement) => new FormData(node).get("amount"));
  await large.fill("9,007,199,254,740,993.05");
  await large.blur();
  await expect(large).toHaveValue("9007199254740993.05");
  expect(await amount()).toBe("9007199254740993.05");

  await controlled.fill("15.00");
  expect(await form.evaluate((node: HTMLFormElement)=>node.checkValidity())).toBe(false);
  await controlled.blur();
  await expect(controlled).toHaveValue("12.50");
  await page.getByRole("button",{name:"Replace controlled amount"}).click();
  await expect(controlled).toHaveValue("3.49");
  await page.getByRole("button",{name:"Reset",exact:true}).click();
  await expect(large).toHaveValue("0.05");
  expect(await amount()).toBe("0.05");
  await expect(controlled).toHaveValue("3.49");
});
