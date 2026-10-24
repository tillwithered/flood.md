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
    if(height!==undefined)expect(Math.abs(box.height-height)).toBeLessThan(1);
    height=box.height;
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

test("document scrolling uses Flood tokens without replacing the native page viewport",async({page})=>{
  await page.goto("/components");
  await expect(page.getByRole("heading",{level:1})).toHaveText("Components");
  const state=await page.evaluate(()=>{
    const root=document.documentElement,s=getComputedStyle(root);
    const color=(value:string)=>{const probe=document.createElement("span");probe.style.color=value;root.append(probe);const resolved=getComputedStyle(probe).color;probe.remove();return resolved};
    return {native:document.scrollingElement===root,width:s.scrollbarWidth,colors:s.scrollbarColor,
      thumb:color(s.getPropertyValue("--flood-sys-color-scrollbar-thumb").trim()),canvas:color(s.getPropertyValue("--flood-sys-color-surface-canvas").trim())};
  });
  expect(state.native).toBe(true);expect(state.width).toBe("thin");
  expect(state.colors).toBe(`${state.thumb} ${state.canvas}`);
  await page.keyboard.press("Control+End");
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(0);
  await page.emulateMedia({forcedColors:"active"});
  expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollbarColor)).toBe("auto");
});

test("sidebar item text is brighter than category labels before hover",async({page},info)=>{
  await page.goto("/components/button");
  if(info.project.name==="mobile")await page.getByRole("button",{name:"Browse documentation",exact:true}).click();
  const nav=page.locator(info.project.name==="mobile"?".mobile-navigation":".desktop-sidebar");
  const color=await nav.getByRole("link",{name:"Input",exact:true}).evaluate(node=>getComputedStyle(node).color);
  const label=await nav.getByText("Forms",{exact:true}).evaluate(node=>getComputedStyle(node).color);
  expect(color).toBe("rgb(255, 255, 255)");expect(label).not.toBe(color);
});
