import { test, expect, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { chooseSelectOption } from "./select-helpers";

async function documentBox(locator: Locator) {
  return locator.evaluate(el => { const r=el.getBoundingClientRect(); return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}; });
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

test("Avatar preserves geometry across pending load, error, removal and source retry", async ({ page }, info) => {
  let finish: () => void = () => {};
  const pending = new Promise<void>(resolve => { finish = resolve; });
  let requests = 0;
  await page.route("**/avatar-demo.svg", async route => {
    await pending;
    const [width,height] = ++requests === 1 ? [120,40] : [40,120];
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
  await expect(avatar.locator("img")).toHaveJSProperty("naturalHeight",120);
  await assertCover();
  await chooseSelectOption(page.getByRole("combobox",{name:"Avatar prop size",exact:true}),"lg");
  await page.evaluate(()=>{document.documentElement.style.fontSize="24px";document.documentElement.dir="rtl";});
  await assertCover();
  await info.attach("avatar-portrait-enlarged-rtl-cover.png",{body:await avatar.screenshot(),contentType:"image/png"});
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
