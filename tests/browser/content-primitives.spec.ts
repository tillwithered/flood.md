import { test, expect, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { chooseSelectOption, chooseStudioSheetOption } from "./select-helpers";

async function documentBox(locator: Locator) {
  return locator.evaluate(el => {
    const r=el.getBoundingClientRect();
    const viewport=el.closest(".site-page-scroll");
    return {x:r.x+(viewport?.scrollLeft??scrollX),y:r.y+(viewport?.scrollTop??scrollY),width:r.width,height:r.height};
  });
}

test("content board composes named and decorative primitives without overflow", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/playground/content");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Small pieces, more possibilities.");
  const board = page.locator(".content-board");
  await expect(board.locator('.flood-loading[role="status"]')).toHaveCount(3);
  await expect(board.getByRole("button", { name: "Saving", exact: true })).toBeDisabled();
  await expect(board.getByRole("button", { name: "Saving", exact: true })).toHaveAttribute("aria-busy", "true");
  const avatar = board.locator(".flood-avatar").first();
  const before = await documentBox(avatar);
  await board.getByRole("button", { name: "Show initials" }).click();
  await expect(avatar).not.toContainText("Loading");
  await expect(avatar.locator("img")).toHaveCount(0);
  expect(await documentBox(avatar)).toEqual(before);
  await board.getByRole("button", { name: "Animation on" }).click();
  await expect(board.locator(".flood-skeleton").first()).toHaveCSS("animation-name", "none");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; document.documentElement.dir = "rtl"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => { document.documentElement.style.fontSize = ""; document.documentElement.dir = "ltr"; });
  expect(errors).toEqual([]);
  await board.getByRole("button", { name: "Show image" }).click();
  await expect(avatar.locator("img")).toHaveCSS("opacity", "1");
  await board.getByRole("button", { name: "Animation off" }).click();
  await page.screenshot({ path: `.artifacts/content-primitives-${info.project.name}.png`, fullPage: true });
});

test("shortcut keycaps keep their order in RTL and expose one spoken combination", async ({page}, info) => {
  await page.goto("/components/keyboard-shortcut");
  const shortcut = page.locator(".preview-stage .flood-keyboard-shortcut");
  const keycaps = shortcut.locator("kbd");
  await expect(keycaps).toHaveText(["Ctrl","Shift","K"]);
  await page.getByRole("checkbox",{name:"KeyboardShortcut prop rtl"}).check();
  const starts = await keycaps.evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().left));
  expect(starts[0]).toBeLessThan(starts[1]);
  expect(starts[1]).toBeLessThan(starts[2]);
  await page.evaluate(()=>document.fonts.ready);
  await shortcut.screenshot({path:info.outputPath("shortcut-keycaps.png")});
  await chooseSelectOption(page.getByRole("combobox",{name:"KeyboardShortcut prop presentation"}),"compact");
  await chooseSelectOption(page.getByRole("combobox",{name:"KeyboardShortcut prop example",exact:true}),"macOS glyphs");
  await expect(keycaps).toHaveText(["⌘ ⇧ K"]);
  await expect(keycaps).toHaveAttribute("aria-hidden","true");
  await expect(shortcut.locator(".flood-visually-hidden")).toHaveText("Command plus Shift plus K");
  await shortcut.screenshot({path:info.outputPath("shortcut-compact.png")});
});

test("Avatar preserves geometry across pending load, error, removal and source retry", async ({ page }, info) => {
  let finish: () => void = () => {};
  const pending = new Promise<void>(resolve => { finish = resolve; });
  await page.route("**/avatar-demo.svg", async route => {
    await pending;
    const [width,height] = [120,40];
    await route.fulfill({ contentType: "image/svg+xml", body: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="pink"/><circle cx="${width/2}" cy="${height/2}" r="10" fill="white"/></svg>` });
  });
  await page.goto("/components/avatar", { waitUntil: "domcontentloaded" });
  const stage = page.locator(".workbench-stage");
  const avatar = stage.getByRole("img", { name: "Alex Morgan" });
  await expect(avatar).toBeVisible();
  const before = await documentBox(avatar);
  await expect(avatar.locator("img")).toHaveCSS("opacity", "0");
  finish();
  await expect(avatar.locator("img")).toHaveCSS("opacity", "1");
  await expect(avatar.locator("img")).toHaveJSProperty("naturalWidth",120);
  const assertCover = async () => {
    const root = await documentBox(avatar), image = await documentBox(avatar.locator("img"));
    expect(image.width).toBeCloseTo(root.width,1);
    expect(image.height).toBeCloseTo(root.height,1);
    await expect(avatar.locator("img")).toHaveCSS("object-fit","cover");
  };
  await assertCover();
  await info.attach("avatar-landscape-cover.png",{body:await avatar.screenshot(),contentType:"image/png"});
  expect(await documentBox(avatar)).toEqual(before);
  const source = page.getByRole("combobox", { name: "Avatar prop image" });
  await chooseSelectOption(source, "broken");
  await expect(avatar.locator("img")).toHaveCount(0);
  await expect(avatar).toHaveText("AM");
  await chooseSelectOption(source, "missing");
  await chooseSelectOption(source, "loaded");
  await expect(avatar.locator("img")).toHaveCSS("opacity", "1");
  expect(await documentBox(avatar)).toEqual(before);
  await expect(avatar.locator("img")).toHaveJSProperty("naturalHeight",40);
  await assertCover();
  await chooseSelectOption(page.getByRole("combobox",{name:"Avatar prop size",exact:true}),"lg");
  await page.evaluate(()=>{document.documentElement.style.fontSize="24px";document.documentElement.dir="rtl";});
  await assertCover();
  await info.attach("avatar-landscape-enlarged-rtl-cover.png",{body:await avatar.screenshot(),contentType:"image/png"});
});

test("loading primitives respect reduced motion, forced colors and hidden attributes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/playground/content");
  await expect(page.locator(".flood-spinner").first()).toHaveCSS("animation-name", "none");
  await expect(page.locator(".flood-skeleton").first()).toHaveCSS("animation-name", "none");
  await expect(page.locator(".flood-skeleton").first()).toHaveAttribute("aria-hidden", "true");
  await page.emulateMedia({ forcedColors: "active" });
  await expect(page.locator(".flood-avatar").first()).toHaveCSS("border-top-width", "1px");
  await page.locator(".flood-badge").first().evaluate(el => el.setAttribute("hidden", ""));
  await expect(page.locator(".flood-badge").first()).toBeHidden();
});

test("Timestamp preview switches to a localized relative date", async ({page}) => {
  await page.goto("/components/timestamp");
  const value = page.locator(".preview-stage time.flood-timestamp");
  await expect(value).toHaveAttribute("datetime", "2026-11-14T09:30:00Z");
  await page.getByRole("checkbox", {name:"Timestamp prop relativeTo"}).check();
  if (await page.getByRole("button", {name:"Locale: en", exact:true}).isVisible()) {
    await chooseStudioSheetOption(page, "Locale", "ru-RU");
  } else {
    await chooseSelectOption(page.getByRole("combobox", {name:"Timestamp prop locale"}), "ru-RU");
  }
  await expect(value).toHaveAttribute("lang", "ru-RU");
  await expect(value).toHaveText(/^2\s+ч\s+назад$/);
});

test("a relative Timestamp can reveal a localized exact time on hover and keyboard focus", async ({page}, info) => {
  await page.goto("/components/timestamp");
  const value = page.locator(".preview-stage time.flood-timestamp");
  const tip = page.getByRole("tooltip", {name:/Nov 14, 2026/});
  await page.getByRole("checkbox", {name:"Timestamp prop showExactTime"}).check();
  await expect(value).not.toHaveAttribute("tabindex", "0");
  await page.getByRole("checkbox", {name:"Timestamp prop relativeTo"}).check();
  await expect(value).toHaveText("2 hr. ago");
  await expect(value).toHaveAttribute("tabindex", "0");
  await value.hover();
  await expect(tip).toBeVisible();
  await expect(tip).toContainText(/9:30:00\s*AM UTC/);
  await expect(value).toHaveAttribute("aria-describedby", await tip.getAttribute("id") ?? "");
  await page.mouse.move(1, 1);
  await expect(tip).not.toBeVisible();
  await value.focus();
  await expect(tip).toBeVisible();
  await page.screenshot({path:info.outputPath("timestamp-exact-time.png")});
  await page.keyboard.press("Escape");
  await expect(tip).not.toBeVisible();
  await expect(value).toBeFocused();
});

test("new catalog previews and generated Markdown expose the same contracts", async ({ page, request }) => {
  for (const slug of ["badge", "spinner", "skeleton", "avatar"]) {
    await page.goto(`/components/${slug}`);
    await expect(page.locator(".component-workbench")).toBeVisible();
    const markdown = await (await request.get(`/components/${slug}.md`)).text();
    expect(markdown).toContain("0.2.4");
    expect(markdown).toContain("Native HTML props");
    await expect(page.locator(".workbench-stage")).not.toContainText("Choose a component");
  }
});
