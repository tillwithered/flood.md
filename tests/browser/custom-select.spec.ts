import { test, expect, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { openSelectFixture } from "./select-fixture";
import { chooseSelectOption, selectBridge } from "./select-helpers";

async function activeOption(trigger: Locator) {
  const id = await trigger.getAttribute("aria-activedescendant");
  if (!id) throw new Error("Open combobox has no active descendant");
  return trigger.page().locator(`[id=${JSON.stringify(id)}]`);
}

test("custom popup supports uncommitted navigation, disabled groups, typeahead and dismissal", async ({ page }) => {
  await openSelectFixture(page);
  const trigger = page.getByRole("combobox", { name: "Region", exact: true });
  await expect(trigger).toHaveJSProperty("tagName", "BUTTON");
  await expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
  await expect(selectBridge(trigger)).not.toBeVisible();
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  const menu = page.getByRole("listbox");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("option", { name: "Blocked region", exact: true })).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Home");
  await expect(await activeOption(trigger)).toHaveText("Alpha");
  await page.keyboard.press("a");
  const firstMatch = await (await activeOption(trigger)).textContent();
  expect(["Alpha", "Alpine"]).toContain(firstMatch);
  await page.keyboard.press("a");
  const secondMatch = await (await activeOption(trigger)).textContent();
  expect(["Alpha", "Alpine"]).toContain(secondMatch);
  expect(secondMatch).not.toBe(firstMatch);
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(selectBridge(trigger)).toHaveValue("");
  await trigger.click();
  await page.keyboard.press("End");
  await expect(await activeOption(trigger)).toHaveText("Option 30");
  const optionBox = (await (await activeOption(trigger)).boundingBox())!;
  const menuBox = (await menu.boundingBox())!;
  expect(optionBox.y).toBeGreaterThanOrEqual(menuBox.y);
  expect(optionBox.y + optionBox.height).toBeLessThanOrEqual(menuBox.y + menuBox.height + 1);
  await page.keyboard.press("Enter");
  await expect(selectBridge(trigger)).toHaveValue("option-30");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.keyboard.press("Home");
  await page.getByRole("heading", { name: "Select contract fixture" }).click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(selectBridge(trigger)).toHaveValue("option-30");
  await trigger.click();
  await page.keyboard.press("Home");
  await page.keyboard.press("Tab");
  await expect(selectBridge(trigger)).toHaveValue("alpha");
  await expect(trigger).not.toBeFocused();
  await expect(menu).not.toBeVisible();
});

test("forwarded native ref, required validation, form submission and prevented reset stay coherent", async ({ page }) => {
  await openSelectFixture(page);
  const trigger = page.getByRole("combobox", { name: "Region", exact: true });
  const bridge = selectBridge(trigger);
  await page.getByRole("button", { name: "Focus forwarded ref" }).click();
  await expect(page.getByRole("status", { name: "Form result" })).toHaveText("SELECT");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-describedby", "contract-region-hint");
  await expect(bridge).toHaveAttribute("required", "");
  await page.getByRole("button", { name: "Submit selection" }).click();
  await expect(trigger).toBeFocused();
  expect(await bridge.evaluate((node: HTMLSelectElement) => node.validity.valueMissing)).toBe(true);
  await chooseSelectOption(trigger, "beta");
  await page.getByRole("button", { name: "Submit selection" }).click();
  await expect(page.getByRole("status", { name: "Form result" })).toHaveText('{"region":"beta"}');
  await page.getByRole("checkbox", { name: "Prevent reset" }).check();
  await page.getByRole("button", { name: "Reset selection" }).click();
  await expect(bridge).toHaveValue("beta");
  await expect(trigger).toContainText("Beta");
  await page.getByRole("checkbox", { name: "Prevent reset" }).uncheck();
  await page.getByRole("button", { name: "Reset selection" }).click();
  await expect(bridge).toHaveValue("");
  await expect(trigger).toContainText("Choose a region");
  const locked = page.getByRole("combobox", { name: "Locked choice", exact: true });
  await expect(locked).toHaveAttribute("dir", "rtl");
  await expect(locked).toHaveAttribute("tabindex", "3");
  await expect(locked).toHaveAttribute("data-contract", "forwarded");
  await locked.click();
  await page.getByRole("option", { name: "Beta", exact: true }).click();
  await expect(page.getByRole("status", { name: "Rejected change" })).toHaveText("beta");
  await expect(selectBridge(locked)).toHaveValue("alpha");
  await expect(locked).toContainText("Alpha");
});

test("top-layer popup escapes clipped ancestors and clamps or flips within the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 420 });
  await openSelectFixture(page);
  await page.locator("#positioning-box").evaluate(node => {
    Object.assign((node as HTMLElement).style, { position: "fixed", bottom: "4px", right: "4px", width: "280px", height: "80px", overflow: "hidden", transform: "translateZ(0)" });
  });
  const trigger = page.getByRole("combobox", { name: "Region", exact: true });
  await trigger.click();
  const menu = page.getByRole("listbox");
  await expect(menu).toBeVisible();
  const menuBox = (await menu.boundingBox())!, triggerBox = (await trigger.boundingBox())!;
  expect(menuBox.x).toBeGreaterThanOrEqual(0);
  expect(menuBox.y).toBeGreaterThanOrEqual(0);
  expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(390);
  expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(420);
  expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(triggerBox.y + 1);
  expect(menuBox.height).toBeGreaterThan(80);
  expect(await menu.evaluate(node => node.matches(":popover-open"))).toBe(true);
  await page.keyboard.press("End");
  await expect(await activeOption(trigger)).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(selectBridge(trigger)).toHaveValue("option-30");
});

test("the real gap knob renders eight custom options and keeps selected six visible", async ({ page }, info) => {
  await page.goto("/components/stack");
  const trigger = page.getByRole("combobox", { name: "Stack prop gap", exact: true });
  await chooseSelectOption(trigger, "6");
  await expect(page.locator("#usage .site-code-block code")).toContainText('gap="6"');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await trigger.evaluate(node => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await trigger.click();
  const menu = page.getByRole("listbox");
  await expect(menu.getByRole("option")).toHaveCount(8);
  await expect(menu.getByRole("option", { name: "6", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.screenshot({ path: `.artifacts/custom-select-gap6-${info.project.name}.png` });
});

test("a short popup above its trigger keeps the actual eight-pixel anchor gap", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 420 });
  await openSelectFixture(page);
  await page.locator("#short-positioning-box").evaluate(node => {
    Object.assign((node as HTMLElement).style, { position: "fixed", bottom: "4px", right: "4px", width: "280px" });
  });
  const trigger = page.getByRole("combobox", { name: "Locked choice", exact: true });
  await trigger.click();
  const menu = page.getByRole("listbox");
  await expect(menu).toBeVisible();
  const triggerBox = (await trigger.boundingBox())!, menuBox = (await menu.boundingBox())!;
  expect(menuBox.y).toBeLessThan(triggerBox.y);
  expect(triggerBox.y - menuBox.y - menuBox.height).toBeCloseTo(8, 0);
  await expect(menu.getByRole("option")).toHaveCount(2);
});


test("touch selection uses the Flood popup with full touch row targets", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await openSelectFixture(page);
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
    const trigger = page.getByRole("combobox", { name: "Region", exact: true });
    await trigger.tap();
    const menu = page.getByRole("listbox");
    await expect(menu).toBeVisible();
    const option = menu.getByRole("option", { name: "Alpha", exact: true });
    expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await option.tap();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(selectBridge(trigger)).toHaveValue("alpha");
  } finally { await context.close(); }
});

test("forced-color numeric options commit zero through a real pointer",async({browser},info)=>{
  const context=await browser.newContext({baseURL:"http://127.0.0.1:4173",hasTouch:true,isMobile:true,viewport:{width:390,height:844},forcedColors:"active"});
  try {
    const page=await context.newPage();
    await page.addInitScript(()=>{
      const history:Array<Record<string,unknown>>=[];
      (window as unknown as {numericSelectHistory:typeof history}).numericSelectHistory=history;
      for(const type of ["pointerdown","pointerup","click","input","change","scroll"])document.addEventListener(type,event=>{
        const target=event.target as HTMLElement;
        history.push({type,tag:target?.localName,role:target?.getAttribute?.("role"),text:target?.textContent?.slice(0,35),value:(target as HTMLSelectElement)?.value,trusted:event.isTrusted});
        if(history.length>30)history.shift();
      },true);
    });
    await page.goto("/components/pagination");
    const trigger=page.getByRole("combobox",{name:"Pagination prop siblingCount",exact:true});
    try {
      await chooseSelectOption(trigger,"0");
      await expect(page.locator("#usage .site-code-block code")).toContainText("siblingCount={0}");
    } catch(error) {
      const history=await page.evaluate(()=>(window as unknown as {numericSelectHistory:unknown}).numericSelectHistory);
      console.log("NUMERIC_SELECT_DIAGNOSTIC",JSON.stringify(history));
      await info.attach("numeric-select-events",{body:JSON.stringify(history,null,2),contentType:"application/json"});
      throw error;
    }
  } finally {await context.close()}
});
