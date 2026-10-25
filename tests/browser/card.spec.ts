import {test,expect,type Page} from "@playwright/test";
import {build} from "vite";
import {resolve} from "node:path";
import {mkdir,writeFile} from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
let bundle:Promise<string>;
async function fixture(){
  const file=(p:string)=>JSON.stringify(resolve(p).replaceAll("\\","/"));
  const directory=resolve(`.artifacts/card-${process.pid}`),entry=resolve(directory,"entry.mjs");await mkdir(directory,{recursive:true});
  await writeFile(entry,`import React,{StrictMode,useState,useRef} from ${file("node_modules/react/index.js")};import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,Card,Button,Menu,Text}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};
const h=React.createElement;
function App(){const[count,C]=useState(0),ref=useRef();return h(FloodRoot,null,h('h2',null,'Example cards'),
h(Card,{id:'complete',ref,title:'Project details',description:'Keep your team in sync.',headingLevel:3,actions:h(Menu,{label:'Card options',trigger:p=>h(Button,{...p},'Options'),items:[{id:'edit',label:'Edit details'}],onAction:()=>C(n=>n+1)}),footer:h(Button,{onClick:()=>C(n=>n+1)},'Save')},h(Text,{as:'p',size:'compact'},'Project body')),
h(Card,{id:'body-only'},'Body only'),h(Card,{id:'footer-only',footer:'Footer only'}),h(Card,{id:'empty'}),h(Card,{id:'zero',title:0,description:0,footer:0},0),h(Card,{id:'hidden',hidden:true,title:'Hidden card'}),h('output',{'aria-label':'Actions'},String(count)),h(Button,{onClick:()=>{ref.current.dataset.ref='working';ref.current.hidden=true}},'Hide through ref'));}
createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("development")},build:{write:false,minify:true,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"CardFixture"}}});
  const outputs=(Array.isArray(result)?result:[result]).flatMap(v=>"output"in v?v.output:[]);
  const js=outputs.filter(v=>v.type==="chunk").map(v=>v.type==="chunk"?v.code:"").join("\n"),css=outputs.filter(v=>v.type==="asset"&&v.fileName.endsWith(".css")).map(v=>v.type==="asset"?String(v.source):"").join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Card verification</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}body{margin:16px}#app>.flood-root{display:flex;flex-direction:column;gap:16px;align-items:flex-start}</style></head><body><header><h1>Card verification</h1></header><main id="app"></main><script>${js.replace(/<\/script/gi,"<\\/script")}</script></body></html>`;
}
async function openFixture(page:Page){bundle??=fixture();await page.route("**/__card.html",async route=>route.fulfill({contentType:"text/html",body:await bundle}));await page.goto("/__card.html");}



test("Card keeps semantic headings, independent controls, native props and refs",async({page})=>{
 await openFixture(page);const card=page.locator('#complete');await expect(card.getByRole('heading',{level:3})).toHaveText('Project details');await expect(card).not.toHaveAttribute('role','button');await expect(card).not.toHaveAttribute('tabindex');await card.getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('output')).toHaveText('1');await card.getByRole('button',{name:'Options',exact:true}).click();await page.getByRole('menuitem',{name:'Edit details'}).click();await expect(page.locator('output')).toHaveText('2');await expect(card.getByRole('button',{name:'Options',exact:true})).toBeFocused();await page.getByRole('button',{name:'Hide through ref'}).click();await expect(card).toBeHidden();await expect(card).toHaveAttribute('data-ref','working');await expect(page.locator('#hidden')).toBeHidden();
});
test("Card omits absent sections and preserves numeric content",async({page})=>{
 await openFixture(page);await expect(page.locator('#empty > *')).toHaveCount(0);await expect(page.locator('#body-only > *')).toHaveCount(1);await expect(page.locator('#footer-only > *')).toHaveCount(1);await expect(page.locator('#zero')).toHaveText('0000');const footer=await page.locator('#footer-only > div').evaluate(el=>({padding:getComputedStyle(el).paddingTop,border:getComputedStyle(el).borderTopWidth}));expect(footer).toEqual({padding:'0px',border:'0px'});
});
test("Card maintains compact title grouping without accumulated spacing",async({page})=>{
 await openFixture(page);const gaps=await page.locator('#complete').evaluate(el=>{const heading=el.querySelector('h3')!.getBoundingClientRect(),intro=el.querySelector('.flood-card__intro')!,description=intro.lastElementChild!.getBoundingClientRect(),body=el.querySelector('.flood-card__body')!.getBoundingClientRect(),header=el.querySelector('.flood-card__header')!.getBoundingClientRect();return{title:description.top-heading.bottom,body:body.top-header.bottom};});expect(gaps.title).toBeGreaterThanOrEqual(0);expect(gaps.title).toBeLessThanOrEqual(5);expect(gaps.body).toBeGreaterThan(gaps.title);
 const results=await new AxeBuilder({page}).analyze();expect(results.violations).toEqual([]);
});
test("Card catalog controls update code and keep preview stable",async({page})=>{
 await page.goto('/components/card');const stage=page.locator('.workbench-stage'),card=stage.locator('.flood-card');await expect(card).toBeVisible();const height=(await stage.boundingBox())!.height;await page.getByRole('checkbox',{name:'Card prop showFooter',exact:true}).uncheck();await expect(card.locator('.flood-card__footer')).toHaveCount(0);expect((await stage.boundingBox())!.height).toBe(height);await page.getByRole('checkbox',{name:'Card prop showActions',exact:true}).uncheck();await expect(card.locator('.flood-card__actions')).toHaveCount(0);await expect(page.locator('.component-workbench')).toBeVisible();
});
test("Card examples reflow with large text and keep menu visible",async({page},info)=>{
 await page.goto('/playground/content');const section=page.locator('#cards');await section.scrollIntoViewIfNeeded();await expect(section.locator('.flood-card')).toHaveCount(2);if(info.project.name === 'desktop'){const bottoms=await section.locator('.flood-card__footer').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().bottom));expect(Math.abs(bottoms[0]-bottoms[1])).toBeLessThanOrEqual(1);}await section.screenshot({path:`.artifacts/card-${info.project.name}.png`});await page.evaluate(()=>document.documentElement.style.fontSize='24px');expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);await section.getByRole('button',{name:'Save preferences',exact:true}).click();await expect(section.getByRole('status')).toHaveText('Preferences saved locally.');await section.getByRole('button',{name:'Notification options',exact:true}).click();const menu=page.getByRole('menu',{name:'Notification options'});await expect(menu).toBeVisible();const rect=(await menu.boundingBox())!;expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(page.viewportSize()!.width+1);await page.keyboard.press('Escape');
});
