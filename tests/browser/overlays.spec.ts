import {test,expect,type Page} from "@playwright/test";
import {build} from "vite";
import {resolve} from "node:path";
import {mkdir,writeFile} from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
let bundle:Promise<string>;
async function fixture(){
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll("\\","/"));
  const directory=resolve(`.artifacts/overlays-${process.pid}`),entry=resolve(directory,"entry.mjs");await mkdir(directory,{recursive:true});
  await writeFile(entry,`import React,{useState,useEffect,StrictMode}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,Button,Input,Select,Tooltip,Popover,Dialog}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};
const h=React.createElement,trigger=label=>props=>h(Button,{...props,variant:'subtle'},label);
function App(){const[modal,setModal]=useState(false),[frozen,setFrozen]=useState(false),[outside,setOutside]=useState(true),[owned,setOwned]=useState(false),[holdPopup,setHoldPopup]=useState(false),[mountOpen,setMountOpen]=useState(false),[selectKeys,setSelectKeys]=useState(0),[preventSelectKeys,setPreventSelectKeys]=useState(false);
useEffect(()=>{window.closeFloodModal=()=>setModal(false)},[]);
return h(FloodRoot,{style:{'--flood-sys-color-surface-overlay':'rgb(35, 36, 37)','--flood-sys-color-surface-floating':'rgb(35, 36, 37)','--flood-sys-color-surface-floating-translucent':'rgb(35, 36, 37)'}},
h(Button,{id:'before'},'Before'),h(Tooltip,{content:'Helpful context',delay:120,trigger:trigger('Help')}),
h(Popover,{title:'Settings',trigger:trigger('Settings')},h(Input,{'aria-label':'Popover value',defaultValue:'draft'}),h('a',{href:'#after'},'Popover link')),
h(Popover,{title:'Frozen popup',open:false,trigger:trigger('Frozen popup')},'Frozen'),
h(Popover,{title:'Owned popup',open:owned,onOpenChange:value=>{if(value||!holdPopup)setOwned(value)},trigger:trigger('Owned popup')},h('label',null,h('input',{type:'checkbox',checked:holdPopup,onChange:e=>setHoldPopup(e.target.checked)}),'Freeze popup')),
h(Button,{onClick:()=>setMountOpen(true)},'Mount open dialog'),mountOpen&&h(Dialog,{title:'Default dialog',defaultOpen:true,trigger:trigger('Default trigger')},h(Popover,{title:'Default nested popup',defaultOpen:true,trigger:trigger('Default nested trigger')},h(Input,{'aria-label':'Default nested input'}))),
h(Dialog,{title:'Edit project',description:'Project details',open:modal,onOpenChange:value=>{if(value||!frozen)setModal(value)},closeOnOutsideClick:outside,trigger:trigger('Open modal')},
h(Input,{'aria-label':'Dialog value',defaultValue:'Project'}),h(Select,{'aria-label':'Access',defaultValue:'private',onKeyDown:event=>{if(event.key==='Escape')setSelectKeys(n=>n+1);if(preventSelectKeys)event.preventDefault()}},h('option',{value:'private'},'Private'),h('option',{value:'team'},'Team')),
h('output',{'aria-label':'Select key callbacks'},String(selectKeys)),h('label',null,h('input',{type:'checkbox',checked:preventSelectKeys,onChange:event=>setPreventSelectKeys(event.target.checked)}),'Prevent select keys'),
h('label',null,h('input',{type:'checkbox',checked:frozen,onChange:e=>setFrozen(e.target.checked)}),'Freeze closing'),
h('label',null,h('input',{type:'checkbox',checked:outside,onChange:e=>setOutside(e.target.checked)}),'Outside closing'),
h(Popover,{title:'Nested settings',trigger:trigger('Nested popup')},h(Input,{'aria-label':'Nested value'})),
h(Dialog,{title:'Confirm changes',trigger:trigger('Nested modal')},h('p',null,'Confirm this choice.')),
h('form',{method:'dialog'},h('button',{type:'submit'},'Native close'))),h(Button,{id:'after'},'After'))}
createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("development")},build:{write:false,minify:true,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"OverlayFixture"}}});
  const outputs=(Array.isArray(result)?result:[result]).flatMap(item=>"output" in item?item.output:[]);
  const js=outputs.filter(item=>item.type==="chunk").map(item=>item.type==="chunk"?item.code:"").join("\n");
  const css=outputs.filter(item=>item.type==="asset"&&item.fileName.endsWith(".css")).map(item=>item.type==="asset"?String(item.source):"").join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css}body{min-height:2000px}</style></head><body><main id="app"></main><script>${js.replace(/<\/script/gi,"<\\/script")}</script></body></html>`;
}
async function open(page:Page){bundle??=fixture();const html=await bundle;await page.route("**/__overlays.html",route=>route.fulfill({contentType:"text/html",body:html}));await page.goto("/__overlays.html")}

test("Select key callbacks preserve nested Escape ownership and cancellation",async({page})=>{
  await open(page);await page.getByRole("button",{name:"Open modal",exact:true}).click();
  const dialog=page.getByRole("dialog",{name:"Edit project",exact:true}),select=dialog.getByRole("combobox",{name:"Access",exact:true});
  await select.click();await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Select key callbacks")).toHaveText("1");
  await page.keyboard.press("Escape");await expect(dialog).toBeHidden();
  await page.getByRole("button",{name:"Open modal",exact:true}).click();
  await expect(dialog.getByLabel("Select key callbacks")).toHaveText("2");
  await dialog.getByRole("checkbox",{name:"Prevent select keys",exact:true}).check();
  await select.click();await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeVisible();await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Select key callbacks")).toHaveText("3");
});

test("Tooltip uses hover/focus, retains hoverable content and dismisses without stealing focus",async({page})=>{
  await open(page);const help=page.getByRole("button",{name:"Help",exact:true});
  await expect(help).toHaveAccessibleDescription("Helpful context");
  await help.hover();const tip=page.getByRole("tooltip");await expect(tip).toBeVisible();
  await tip.hover();await page.waitForTimeout(180);await expect(tip).toBeVisible();
  await help.focus();await expect(help).toHaveAccessibleDescription("Helpful context");await expect(help).toBeFocused();
  await page.keyboard.press("Escape");await expect(tip).toBeHidden();await expect(help).toBeFocused();
  await page.locator("#after").focus();await page.mouse.move(2,2);await help.focus();await expect(tip).toBeVisible();
  await page.locator("#after").focus();await expect(tip).toBeHidden();
});

test("Popover owns its top-layer placement, theme, outside/Tab dismissal and focus return",async({page})=>{
  await open(page);const trigger=page.getByRole("button",{name:"Settings",exact:true});
  await trigger.click();const popup=page.getByRole("dialog",{name:"Settings",exact:true});
  await expect(popup).toBeVisible();await expect(page.getByRole("textbox",{name:"Popover value",exact:true})).toBeFocused();
  await expect(popup).toHaveCSS("background-color","rgb(35, 36, 37)");
  await page.keyboard.press("Escape");await expect(popup).toBeHidden();await expect(trigger).toBeFocused();
  await trigger.click();await page.getByRole("link",{name:"Popover link"}).focus();await page.keyboard.press("Tab");
  await expect(popup).toBeHidden();await expect(trigger).not.toBeFocused();
  await trigger.click();await page.locator("#before").click();await expect(popup).toBeHidden();await expect(page.locator("#before")).toBeFocused();
  await page.getByRole("button",{name:"Frozen popup",exact:true}).click();await expect(page.getByRole("dialog",{name:"Frozen popup",exact:true})).toBeHidden();
  await trigger.evaluate(node=>Object.assign(node.style,{position:"fixed",right:"0px",bottom:"0px"}));await trigger.click();
  const box=(await popup.boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(7);expect(box.x+box.width).toBeLessThanOrEqual(page.viewportSize()!.width-7);expect(box.y+box.height).toBeLessThanOrEqual(page.viewportSize()!.height-7);
  await expect(popup).toHaveAttribute("data-side","top");
});

test("Dialog traps focus, handles nested layers and Select, restores scroll and native-close ownership",async({page})=>{
  await open(page);const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
  await page.evaluate(()=>{document.documentElement.style.setProperty("overflow","auto","important")});
  const width=await page.evaluate(()=>document.documentElement.clientWidth);
  const trigger=page.getByRole("button",{name:"Open modal",exact:true});await trigger.click();
  const dialog=page.getByRole("dialog",{name:"Edit project",exact:true});await expect(dialog).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.clientWidth)).toBe(width);
  await expect(page.getByRole("textbox",{name:"Dialog value"})).toBeFocused();
  await page.locator("#before").evaluate(node=>(node as HTMLElement).focus());expect(await dialog.evaluate(node=>node.contains(document.activeElement))).toBe(true);
  await dialog.getByRole("button",{name:"Native close"}).focus();await page.keyboard.press("Tab");await expect(dialog.getByRole("button",{name:"Close",exact:true})).toBeFocused();
  await page.keyboard.press("Shift+Tab");await expect(dialog.getByRole("button",{name:"Native close"})).toBeFocused();
  const select=dialog.getByRole("combobox",{name:"Access"});await select.click();await expect(page.getByRole("listbox")).toBeVisible();await page.keyboard.press("Escape");await expect(page.getByRole("listbox")).toBeHidden();await expect(dialog).toBeVisible();
  await dialog.getByRole("button",{name:"Nested popup"}).click();const popup=page.getByRole("dialog",{name:"Nested settings",exact:true});await expect(popup).toBeVisible();
  await page.keyboard.press("Escape");await expect(popup).toBeHidden();await expect(dialog).toBeVisible();
  await dialog.getByRole("button",{name:"Nested modal"}).click();const nested=page.getByRole("dialog",{name:"Confirm changes",exact:true});await expect(nested).toBeVisible();
  await page.keyboard.press("Escape");await expect(nested).toBeHidden();await expect(dialog).toBeVisible();
  expect(await page.evaluate(()=>getComputedStyle(document.documentElement).overflow)).toBe("hidden");
  await dialog.getByRole("checkbox",{name:"Outside closing"}).uncheck();await page.mouse.click(2,2);await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();
  expect(await page.evaluate(()=>[document.documentElement.style.overflow,document.documentElement.style.getPropertyPriority("overflow")])).toEqual(["auto","important"]);
  await trigger.click();await dialog.getByRole("checkbox",{name:"Freeze closing"}).check();await page.keyboard.press("Escape");await expect(dialog).toBeVisible();
  await dialog.evaluate(node=>(node as HTMLDialogElement).close());await expect.poll(()=>dialog.evaluate(node=>(node as HTMLDialogElement).open)).toBe(true);
  await dialog.getByRole("checkbox",{name:"Freeze closing"}).uncheck();await dialog.getByRole("button",{name:"Native close"}).click();await expect(dialog).toBeHidden();
  expect(errors).toEqual([]);
});

test("Overlay catalog examples work on mobile and preserve their playground frames",async({page},info)=>{
  for(const slug of ["tooltip","popover","dialog"]){
    await page.goto(`/components/${slug}`);const stage=page.locator(".preview-stage"),before=(await stage.boundingBox())!,trigger=stage.getByRole("button").first();
    if(slug==="tooltip")await trigger.focus();else await trigger.click();
    const layer=page.getByRole(slug==="tooltip"?"tooltip":"dialog");await expect(layer).toBeVisible();
    expect((await stage.boundingBox())!.height).toBeCloseTo(before.height,1);
    const box=(await layer.boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(page.viewportSize()!.width+1);
    expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
    await page.screenshot({path:`.artifacts/${slug}-${info.project.name}.png`});
    await page.keyboard.press("Escape");await expect(layer).toBeHidden();
  }
});

test("Anchored overlays follow layout changes, RTL and enlarged text within viewport bounds",async({page})=>{
  await open(page);const trigger=page.getByRole("button",{name:"Settings",exact:true});await trigger.click();
  const popup=page.getByRole("dialog",{name:"Settings",exact:true});await expect(popup).toBeVisible();
  await trigger.evaluate(node=>{Object.assign(node.style,{position:"fixed",left:"100px",top:"180px",width:"80px"});node.dir="rtl"});
  await popup.evaluate(node=>{node.style.width="160px"});
  await expect.poll(async()=>{const a=(await trigger.boundingBox())!,b=(await popup.boundingBox())!;return Math.abs(a.x+a.width-b.x-b.width)}).toBeLessThan(1);
  await page.setViewportSize({width:320,height:600});await page.evaluate(()=>{document.documentElement.style.fontSize="24px"});
  await expect.poll(async()=>{const b=(await popup.boundingBox())!;return b.x>=11&&b.x+b.width<=309&&b.y>=11&&b.y+b.height<=589}).toBe(true);
});

test("Native popover closure respects controlled ownership and default nested layers survive Strict Mode",async({page})=>{
  await open(page);const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
  await page.getByRole("button",{name:"Owned popup",exact:true}).click();const popup=page.getByRole("dialog",{name:"Owned popup",exact:true});
  await popup.getByRole("checkbox",{name:"Freeze popup",exact:true}).check();
  await popup.evaluate(node=>(node as HTMLElement).hidePopover());await expect.poll(()=>popup.evaluate(node=>node.matches(":popover-open"))).toBe(true);
  await popup.getByRole("checkbox",{name:"Freeze popup",exact:true}).uncheck();
  await popup.evaluate(node=>(node as HTMLElement).hidePopover());await expect(popup).toBeHidden();
  await page.getByRole("button",{name:"Mount open dialog",exact:true}).click();
  const dialog=page.getByRole("dialog",{name:"Default dialog",exact:true}),nested=page.getByRole("dialog",{name:"Default nested popup",exact:true});
  await expect(dialog).toBeVisible();await expect(nested).toBeVisible();await expect(page.getByRole("textbox",{name:"Default nested input"})).toBeFocused();
  await page.keyboard.press("Escape");await expect(nested).toBeHidden();await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");await expect(dialog).toBeHidden();expect(errors).toEqual([]);
});

test("Overlay close actions are named square IconButtons with centered decorative crosses",async({page})=>{
  for(const slug of ["popover","dialog"]){
    await page.goto(`/components/${slug}`);await page.locator(".preview-stage").getByRole("button").first().click();
    const panel=page.getByRole("dialog"),close=panel.getByRole("button",{name:"Close",exact:true});
    await expect(close).toHaveClass(/flood-icon-button/);await expect(close).toHaveText("");
    const button=(await close.boundingBox())!,glyph=(await close.locator("svg").boundingBox())!,shell=(await panel.boundingBox())!;
    expect(button.width).toBeCloseTo(button.height,1);
    expect(glyph.x+glyph.width/2).toBeCloseTo(button.x+button.width/2,1);expect(glyph.y+glyph.height/2).toBeCloseTo(button.y+button.height/2,1);
    expect(button.y-shell.y).toBeCloseTo(shell.x+shell.width-button.x-button.width,1);
    await close.focus();await expect(close).toBeFocused();await close.press("Enter");await expect(panel).toBeHidden();
  }
});
