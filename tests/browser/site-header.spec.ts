import {test,expect} from "@playwright/test";
import {chooseSelectOption} from "./select-helpers";

test("shared Flood header keeps its geometry and native navigation across routes",async({page},info)=>{
  let height:number|undefined;
  for(const path of ["/","/docs","/components/button","/playground"]){
    await page.goto(path);
    const header=page.locator(".site-header"),nav=page.getByRole("navigation",{name:"Main navigation"});
    await expect(nav.getByRole("link")).toHaveCount(3);
    for(const link of await nav.getByRole("link").all()){
      await expect(link).toHaveClass(/flood-button/);
      await expect(link).not.toHaveAttribute("role","button");
    }
    const box=(await header.boundingBox())!;
    if(path==="/components/button")expect(box.height).toBeLessThan(height!);
    else if(height!==undefined)expect(Math.abs(box.height-height)).toBeLessThan(1);
    else height=box.height;
    await expect(header.getByRole("link",{name:"flood.md home"})).toHaveText(path.startsWith("/components") ? "" : "flood.md");
    if(path.startsWith("/docs"))await expect(nav.getByRole("link",{name:"Docs",exact:true})).toHaveAttribute("aria-current","page");
    if(path.startsWith("/components"))await expect(nav.getByRole("link",{name:"Components",exact:true})).toHaveAttribute("aria-current","page");
    if(path==="/"||path==="/docs")await header.screenshot({path:`.artifacts/shared-header-${path==="/"?"home":"docs"}-${info.project.name}.png`});
  }
  await page.setViewportSize({width:320,height:900});
  await page.evaluate(()=>{document.documentElement.style.fontSize="24px"});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("Link button appearances share Button metrics while preserving anchor behavior",async({page})=>{
  await page.goto("/components/link");
  const link=page.locator(".preview-stage").getByRole("link");
  await expect(link).not.toHaveClass(/flood-button/);
  await chooseSelectOption(page.getByRole("combobox",{name:"Link prop variant",exact:true}),"solid");
  await chooseSelectOption(page.getByRole("combobox",{name:"Link prop size",exact:true}),"xl");
  await expect(link).toHaveAttribute("href","/docs/installation");
  expect(await link.getAttribute("variant")).toBeNull();
  expect(await link.getAttribute("size")).toBeNull();
  const metrics=await link.evaluate(node=>{const s=getComputedStyle(node);return [s.fontSize,s.lineHeight,s.minHeight,s.paddingInlineStart,s.borderRadius,s.backgroundColor,s.color]});
  await page.goto("/components/button");
  await chooseSelectOption(page.getByRole("combobox",{name:"Button prop size",exact:true}),"xl");
  const button=page.locator(".preview-stage").getByRole("button");
  expect(await button.evaluate(node=>{const s=getComputedStyle(node);return [s.fontSize,s.lineHeight,s.minHeight,s.paddingInlineStart,s.borderRadius,s.backgroundColor,s.color]})).toEqual(metrics);
});

test("page scroll uses a Flood overlay rail without shifting the catalog",async({page},info)=>{
  await page.goto("/components");
  const viewport=page.locator(".site-page-scroll");
  const rail=viewport.locator("..").locator(":scope > .flood-scroll-area__track--vertical");
  await expect(rail).toBeVisible();
  await expect(viewport).toHaveCSS("scrollbar-width","none");
  await page.keyboard.press("Control+End");
  await expect.poll(()=>viewport.evaluate(node=>node.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(()=>scrollY)).toBe(0);
  await page.keyboard.press("Home");
  await expect.poll(()=>viewport.evaluate(node=>node.scrollTop)).toBe(0);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link",{name:"Skip to content",exact:true})).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  const search=page.getByRole("main").getByRole("searchbox",{name:"Search components"});
  const geometry=()=>search.evaluate(node=>{
    const {left,width}=node.closest(".catalog-search")!.getBoundingClientRect();
    return {left,width,gutter:innerWidth-document.documentElement.clientWidth};
  });
  const initial=await geometry();
  expect(initial.gutter).toBe(0);
  await search.fill("not-a-component");
  await expect(rail).toBeHidden();
  expect(await geometry()).toEqual(initial);
  await search.fill("");
  await expect(rail).toBeVisible();
  expect(await geometry()).toEqual(initial);
  await page.screenshot({path:`.artifacts/site-scroll-catalog-${info.project.name}.png`});
  await page.emulateMedia({forcedColors:"active"});
  await expect(viewport).toHaveCSS("scrollbar-width","auto");
  await expect(rail).toBeHidden();
});

test("deep links and Studio use the page and preview ScrollAreas independently",async({page},info)=>{
  await page.goto("/docs/charts#latency-example");
  const viewport=page.locator(".site-page-scroll");
  await expect(page.getByRole("heading",{name:"Request latency (ms)"})).toBeInViewport();
  await expect.poll(()=>viewport.evaluate(node=>node.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(()=>scrollY)).toBe(0);
  await page.goto("/components/aspect-ratio");
  await expect(page.getByRole("heading",{name:"AspectRatio",exact:true})).toBeVisible();
  const canvas=page.getByRole("region",{name:"Preview canvas",exact:true});
  await expect(canvas).toHaveAttribute("data-scrollbars","overlay");
  await expect(canvas.locator("..").locator(":scope > .flood-scroll-area__track")).toHaveCount(0);
  if(info.project.name!=="mobile") return;
  await page.goto("/components/data-table");
  await expect(canvas.locator("..").locator(":scope > .flood-scroll-area__track--vertical")).toBeVisible();
  await expect(canvas).toHaveCSS("scrollbar-width","none");
  await page.getByRole("button",{name:"Reference Alt R"}).click();
  const reference=page.getByRole("dialog",{name:"Component reference"});
  await expect(reference).toBeVisible();
  await expect(viewport).toHaveCSS("overflow-y","hidden");
  await page.keyboard.press("Escape");
  await expect(reference).toBeHidden();
  await expect(page.getByRole("button",{name:"Reference Alt R"})).toBeFocused();
});

test("sidebar item text is brighter than category labels before hover",async({page},info)=>{
  await page.goto("/components/button");
  if(info.project.name==="mobile")await page.getByRole("button",{name:"Components",exact:true}).click();
  const nav=page.locator(info.project.name==="mobile" ? "#studio-catalog-sheet" : "#studio-catalog");
  const color=await nav.getByRole("link",{name:"Input",exact:true}).evaluate(node=>getComputedStyle(node).color);
  const label=await nav.getByRole("group",{name:"Forms",exact:true}).getByText("Forms",{exact:true}).evaluate(node=>getComputedStyle(node).color);
  expect(color).toBe("rgb(255, 255, 255)");expect(label).not.toBe(color);
});

test("mobile navigation search shares the disclosure surface while scrolling",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/components/drawer");
  await page.getByRole("button",{name:"Components",exact:true}).click();
  const navigation=page.locator("#studio-catalog-sheet");
  const surface=await navigation.evaluate(node=>getComputedStyle(node).backgroundColor);
  const tools=navigation.locator(".catalog-nav-tools");
  await expect(tools).toHaveCSS("background-color",surface);
  const viewport=navigation.locator(".flood-scroll-area__viewport");
  await viewport.evaluate(node=>{node.scrollTop+=100});
  await expect.poll(()=>tools.evaluate(node=>{
    const viewport=node.closest(".flood-scroll-area__viewport")!;
    return Math.abs(node.getBoundingClientRect().top-viewport.getBoundingClientRect().top);
  })).toBeLessThanOrEqual(1);
  await expect(navigation.getByRole("searchbox",{name:"Search components"})).toBeVisible();
});
