import {test,expect,type Page} from "@playwright/test";
import {build} from "vite";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
let bundled:Promise<string>;
async function fixture(){
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll("\\","/"));
  const directory=resolve(`.artifacts/collection-cards-${process.pid}`);await mkdir(directory,{recursive:true});
  const entry=resolve(directory,"entry.mjs");
  await writeFile(entry,`import React,{useState}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,CheckCard,RadioCard,Fieldset,Stack,DataList,DataListItem,Link,Button,Checkbox}from ${file("packages/react/dist/index.js")};
import ${file("packages/react/dist/styles.css")};const h=React.createElement;
function App(){const[readOnly,R]=useState(false),[disabled,D]=useState(false),[count,C]=useState(0),[accept,A]=useState(false),[checked,S]=useState(false);return h(FloodRoot,null,h('h1',null,'Collection cards'),
h('form',{id:'choices',onSubmit:e=>e.preventDefault()},h(Fieldset,{legend:'Options',disabled},h(Stack,{gap:'2'},
h(CheckCard,{id:'updates',label:'Product updates',description:'Monthly release notes',metadata:'Monthly',name:'updates',value:'yes',required:true,readOnly,onChange:()=>C(x=>x+1)}),
h(CheckCard,{label:'Aggregate selection',indeterminate:true,readOnly,disabled}),
h(Fieldset,{legend:'Plan'},h(Stack,{gap:'2'},h(RadioCard,{id:'starter',label:'Starter',name:'plan',value:'starter',description:'Personal projects',metadata:'Free',defaultChecked:true,readOnly}),h(RadioCard,{id:'team',label:'Team',name:'plan',value:'team',description:'Shared projects',metadata:'$12 per month',readOnly}))))),h(Button,{type:'reset'},'Reset')),
h(CheckCard,{label:'Controlled',checked,onChange:e=>{C(x=>x+1);if(accept)S(e.currentTarget.checked)}}),
h(Checkbox,{label:'Read only',checked:readOnly,onChange:e=>R(e.currentTarget.checked)}),h(Checkbox,{label:'Disable choices',checked:disabled,onChange:e=>D(e.currentTarget.checked)}),h(Checkbox,{label:'Accept',checked:accept,onChange:e=>A(e.currentTarget.checked)}),
h(DataList,{'aria-label':'Projects'},h(DataListItem,{title:h(Link,{href:'#design'},'Design system with a very long descriptive project title'),description:'Foundations and reusable components with long supporting text that wraps naturally.',metadata:'Updated today',actions:h(Button,{onClick:()=>C(x=>x+1)},'Manage')}),h(DataListItem,{title:'Website',description:'Documentation and examples'})),h('output',{'aria-label':'Changes'},count));}
createRoot(document.getElementById('app')).render(h(App));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("production")},build:{write:false,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"CollectionCards"}}});
  const output=(Array.isArray(result)?result:[result]).flatMap(x=>"output"in x?x.output:[]);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Collection cards</title><style>'+output.filter(x=>x.type==="asset"&&x.fileName.endsWith(".css")).map(x=>(x as any).source).join("")+'body{margin:1rem;background:#181818;color:white}main{max-width:34rem}</style></head><body><main id="app"></main><script>'+output.filter(x=>x.type==="chunk").map(x=>(x as any).code).join("")+'</script></body></html>';
}
async function open(page:Page){bundled??=fixture();await page.route("**/__collection-cards.html",async route=>route.fulfill({contentType:"text/html",body:await bundled}));await page.goto("/__collection-cards.html");}
const data=(page:Page)=>page.locator("#choices").evaluate((form:HTMLFormElement)=>Object.fromEntries(new FormData(form)));

test("CheckCard label, native form validity, mixed state and reset",async({page})=>{
  await open(page);const check=page.getByRole("checkbox",{name:"Product updates",exact:true});
  expect(await page.locator("#choices").evaluate((form:HTMLFormElement)=>form.checkValidity())).toBe(false);
  await page.getByText("Monthly release notes",{exact:true}).click();await expect(check).toBeChecked();
  expect(await data(page)).toEqual({updates:"yes",plan:"starter"});
  await expect(page.getByRole("checkbox",{name:"Aggregate selection"})).toHaveAttribute("aria-checked","mixed");
  await page.getByRole("button",{name:"Reset",exact:true}).click();await expect(check).not.toBeChecked();
});
test("RadioCard preserves exclusive selection and native arrow navigation",async({page})=>{
  await open(page);await page.locator("#starter").focus();await page.keyboard.press("ArrowDown");
  await expect(page.locator("#team")).toBeChecked();await expect(page.locator("#starter")).not.toBeChecked();
  expect((await data(page)).plan).toBe("team");
  await expect(page.getByRole("radio",{name:"Team",exact:true})).toHaveAccessibleDescription("Shared projects $12 per month");
});
test("Read-only choices remain focusable and block keyboard changes; disabled values are excluded",async({page})=>{
  await open(page);await page.getByRole("checkbox",{name:"Read only",exact:true}).check();
  await page.locator("#updates").focus();await page.keyboard.press("Space");await expect(page.locator("#updates")).not.toBeChecked();
  await page.locator("#starter").focus();await page.keyboard.press("ArrowDown");await expect(page.locator("#starter")).toBeChecked();
  await expect(page.getByLabel("Changes",{exact:true})).toHaveText("0");
  expect(await page.locator("#choices").evaluate((form:HTMLFormElement)=>form.checkValidity())).toBe(true);
  await page.getByRole("checkbox",{name:"Disable choices",exact:true}).check();
  await expect(page.locator("#updates")).toBeDisabled();expect(await data(page)).toEqual({});
});
test("CheckCard controlled refusal and acceptance remain host owned",async({page})=>{
  await open(page);const control=page.getByRole("checkbox",{name:"Controlled",exact:true});
  await control.click();await expect(control).not.toBeChecked();
  await page.getByRole("checkbox",{name:"Accept",exact:true}).check();await control.check();await expect(control).toBeChecked();
});
test("DataList keeps independent links/actions and wraps at enlarged root text",async({page})=>{
  await open(page);const list=page.getByRole("list",{name:"Projects"});await expect(list.getByRole("listitem")).toHaveCount(2);
  await list.getByRole("button",{name:"Manage"}).click();await expect(page.getByLabel("Changes",{exact:true})).toHaveText("1");
  await list.getByRole("link").click();await expect(page).toHaveURL(/#design$/);
  await page.evaluate(()=>document.documentElement.style.fontSize="20px");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
