import {expect, test} from "@playwright/test";

test("Carousel reaches the last slide using its controls and returns with Home", async ({page}, info) => {
  await page.goto("/components/carousel");
  const view = page.locator(".flood-carousel__viewport").first();
  const next = page.getByRole("button", {name: "Next slide"});
  const previous = page.getByRole("button", {name: "Previous slide"});
  await expect(view).toBeVisible();
  await expect(previous).toHaveAttribute("aria-disabled", "true");
  await next.click();
  await expect(previous).toHaveAttribute("aria-disabled", "false");
  await view.press("End");
  await expect(next).toHaveAttribute("aria-disabled", "true");
  await view.press("Home");
  await expect(view).toBeFocused();
  await expect(previous).toHaveAttribute("aria-disabled", "true");
  await expect.poll(() => view.evaluate(node => node.scrollLeft)).toBe(0);
  await page.locator(".flood-carousel").first().screenshot({path: info.outputPath("carousel.png")});
});

test("MaskedInput edits across separators and retains its ordinary form control", async ({page}, info) => {
  await page.goto("/components/masked-input");
  const input = page.locator("input[inputmode=numeric]").first();
  await expect(input).toBeVisible();
  await input.fill("123456789");
  await expect(input).toHaveValue("123-45-6789");
  await input.evaluate((node: HTMLInputElement) => node.setSelectionRange(4, 4));
  await input.press("Backspace");
  await expect(input).toHaveValue("124-56-789");
  await expect.poll(() => input.evaluate((node: HTMLInputElement) => node.selectionStart)).toBe(2);
  await expect.poll(() => input.evaluate((node: HTMLInputElement) => node.validity.customError)).toBe(true);
  await input.fill("321-54-9876");
  await expect(input).toHaveValue("321-54-9876");
  await expect.poll(() => input.evaluate((node: HTMLInputElement) => node.validity.valid)).toBe(true);
  const submitted = await input.evaluate((node: HTMLInputElement) => {
    const form = document.createElement("form");
    form.id = "masked-test-order";
    document.body.append(form);
    node.setAttribute("form", form.id);
    node.parentElement?.querySelector("input[type=hidden]")?.setAttribute("form", form.id);
    return Array.from(new FormData(form).entries());
  });
  expect(submitted).toEqual([["identifier", "321549876"]]);
  await input.screenshot({path: info.outputPath("masked-input.png")});
});

test("PhoneInput formats national and international drafts and reports incomplete numbers", async ({page}, info) => {
  await page.goto("/components/phone-input");
  const item = page.locator(".flood-phone-input").first();
  const input = item.locator("input[type=tel]");
  const country = item.getByRole("combobox", {name: "Country calling code"});
  await expect(input).toBeVisible();
  await expect(country).toHaveValue("US +1");
  await input.fill("2025550123");
  await expect(input).toHaveValue("(202) 555-0123");
  await input.fill("+44 20 7946 0958");
  await expect(country).toHaveValue("GB +44");
  await expect(input).toHaveValue("+44 20 7946 0958");
  await expect.poll(() => input.evaluate((node: HTMLInputElement) => node.validity.valid)).toBe(true);
  await item.screenshot({path: info.outputPath("phone-input.png")});
  await country.fill("Kazakhstan");
  const option = page.getByRole("option", {name: "Kazakhstan (+7)"});
  await expect(option).toBeVisible();
  await page.screenshot({path: info.outputPath("phone-input-countries.png")});
  await option.click();
  await expect(country).toHaveValue("KZ +7");
  await input.fill("+44 7");
  await expect.poll(() => input.evaluate((node: HTMLInputElement) => node.validity.customError)).toBe(true);
});

test("TokenInput inserts a structured mention, copies its identity and deletes it atomically", async ({page}, info) => {
  await page.goto("/components/token-input");
  const editor = page.locator(".flood-token-input").first();
  const token = editor.locator("[data-flood-inline-token]");
  await expect(editor).toBeVisible();
  await editor.fill("@");
  const suggestion = page.getByRole("option").first();
  await expect(suggestion).toBeVisible();
  await editor.press("Enter");
  await expect(token).toHaveCount(1);
  await expect(token).toHaveAttribute("contenteditable", "false");
  await editor.press("ControlOrMeta+A");
  const clipboard = await editor.evaluate(node => {
    const event = new ClipboardEvent("copy", {clipboardData: new DataTransfer(), bubbles: true, cancelable: true});
    node.dispatchEvent(event);
    return {structured: event.clipboardData?.getData("application/x-flood-token-input") ?? "",
      text: event.clipboardData?.getData("text/plain") ?? ""};
  });
  expect(JSON.parse(clipboard.structured)[0]).toMatchObject({type: "token", trigger: "@", id: expect.any(String)});
  expect(clipboard.text).toMatch(/^@\S/);
  await editor.press("Backspace");
  await expect(token).toHaveCount(0);
  await editor.evaluate((node, data) => {
    const event = new ClipboardEvent("paste", {clipboardData: new DataTransfer(), bubbles: true, cancelable: true});
    event.clipboardData?.setData("application/x-flood-token-input", data);
    node.dispatchEvent(event);
  }, clipboard.structured);
  await expect(token).toHaveCount(1);
  await editor.press("ControlOrMeta+Z");
  await expect(token).toHaveCount(0);
  await editor.press("ControlOrMeta+Shift+Z");
  await expect(token).toHaveCount(1);
  await editor.screenshot({path: info.outputPath("token-input.png")});
});
