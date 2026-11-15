import {test,expect,type Page} from "@playwright/test";
import {build} from "vite";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {chooseSelectOption} from "./select-helpers";
let bundled:Promise<string>;
async function fixture(){
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll("\\","/"));
  const directory=resolve(`.artifacts/collection-cards-${process.pid}`);await mkdir(directory,{recursive:true});
  const entry=resolve(directory,"entry.mjs");
  await writeFile(entry,`import React,{useState}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,CheckCard,RadioCard,CheckCardGroup,RadioCardGroup,Fieldset,Stack,DataList,DataListItem,Link,Button,Checkbox}from ${file("packages/react/dist/index.js")};
import ${file("packages/react/dist/styles.css")};const h=React.createElement;
function App(){const[readOnly,R]=useState(false),[disabled,D]=useState(false),[count,C]=useState(0),[accept,A]=useState(false),[checked,S]=useState(false);return h(FloodRoot,null,h('h1',null,'Collection cards'),
h('form',{id:'choices',onSubmit:e=>e.preventDefault()},h(Fieldset,{legend:'Options',disabled},h(Stack,{gap:'2'},
h(CheckCard,{id:'updates',label:'Product updates',description:'Monthly release notes',metadata:'Monthly',name:'updates',value:'yes',required:true,readOnly,onChange:()=>C(x=>x+1)}),
h(CheckCard,{label:'Aggregate selection',indeterminate:true,readOnly,disabled}),
h(Fieldset,{legend:'Plan'},h(Stack,{gap:'2'},h(RadioCard,{id:'starter',label:'Starter',name:'plan',value:'starter',description:'Personal projects',metadata:'Free',defaultChecked:true,readOnly}),h(RadioCard,{id:'team',label:'Team',name:'plan',value:'team',description:'Shared projects',metadata:'$12 per month',readOnly}))))),h(Button,{type:'reset'},'Reset')),
h(CheckCard,{label:'Controlled',checked,onChange:e=>{C(x=>x+1);if(accept)S(e.currentTarget.checked)}}),
h(Checkbox,{label:'Read only',checked:readOnly,onChange:e=>R(e.currentTarget.checked)}),h(Checkbox,{label:'Disable choices',checked:disabled,onChange:e=>D(e.currentTarget.checked)}),h(Checkbox,{label:'Accept',checked:accept,onChange:e=>A(e.currentTarget.checked)}),
h('form',{id:'card-groups'},h(RadioCardGroup,{legend:'Billing cycle',name:'billing',required:true,options:[{value:'monthly',label:'Monthly'},{value:'annual',label:'Annual'},{value:'legacy',label:'Legacy',disabled:true}]}),h(CheckCardGroup,{legend:'Alerts',name:'alerts',defaultValue:['security'],options:[{value:'security',label:'Security updates'},{value:'billing',label:'Billing updates'}]}),h(Button,{type:'reset'},'Reset card groups')),
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
test("card groups preserve required validation, repeated native form values and reset",async({page})=>{
  await open(page);
  const form=page.locator("#card-groups");
  const monthly=form.getByRole("radio",{name:"Monthly",exact:true});
  const annual=form.getByRole("radio",{name:"Annual",exact:true});
  const billing=form.getByRole("checkbox",{name:"Billing updates",exact:true});
  const valid=()=>form.evaluate((node:HTMLFormElement)=>node.checkValidity());
  const values=()=>form.evaluate((node:HTMLFormElement)=>[...new FormData(node)]);
  expect(await valid()).toBe(false);
  await monthly.check();
  await monthly.press("ArrowDown");
  await expect(annual).toBeChecked();
  await billing.press("Space");
  expect(await valid()).toBe(true);
  expect(await values()).toEqual([["billing","annual"],["alerts","security"],["alerts","billing"]]);
  await form.getByRole("button",{name:"Reset card groups"}).click();
  await expect(annual).not.toBeChecked();
  await expect(billing).not.toBeChecked();
  expect(await values()).toEqual([["alerts","security"]]);
});
test("card groups keep comparison facts aligned and selection survives reflow",async({page}, info)=>{
  await page.setViewportSize({width:1440,height:940});
  await page.goto("/components/check-card-group");
  const group=page.getByRole("group",{name:"Email subscriptions",exact:true});
  const cards=group.locator(".flood-choice-card");
  await expect(cards).toHaveCount(3);
  await page.evaluate(()=>document.fonts.ready);
  const positions=(selector:string)=>group.locator(selector).evaluateAll(nodes=>nodes.map(node=>{
    const {x,y}=node.getBoundingClientRect();
    return {x,y};
  }));
  const row=await positions(".flood-choice-card");
  const facts=await positions(".flood-choice-card__metadata");
  expect(row[0].y).toBeCloseTo(row[2].y,1);
  expect(row[0].x).toBeLessThan(row[2].x);
  expect(facts[0].y).toBeCloseTo(facts[1].y,1);
  await group.screenshot({path:info.outputPath("check-card-group-wide.png")});
  await page.getByRole("checkbox",{name:"CheckCardGroup prop narrow"}).check();
  const stack=await positions(".flood-choice-card");
  expect(stack[0].x).toBeCloseTo(stack[2].x,1);
  expect(stack[0].y).toBeLessThan(stack[2].y);
  await expect(group.getByRole("checkbox",{name:"Security advisories"})).toBeChecked();
  await group.screenshot({path:info.outputPath("check-card-group-narrow.png")});
  await chooseSelectOption(page.getByRole("combobox",{name:"CheckCardGroup prop indicatorPlacement"}),"end");
  const selected=group.getByRole("checkbox",{name:"Security advisories"});
  const title=group.getByText("Security advisories",{exact:true});
  const border=(index:number)=>cards.nth(index).evaluate(node=>getComputedStyle(node).borderColor);
  expect(await border(1)).not.toBe(await border(0));
  expect((await selected.boundingBox())!.x).toBeGreaterThan((await title.boundingBox())!.x);
  await group.evaluate(node=>node.dir="rtl");
  expect((await selected.boundingBox())!.x).toBeLessThan((await title.boundingBox())!.x);
  await page.getByRole("checkbox",{name:"CheckCardGroup prop disabled"}).check();
  await expect(selected).toBeDisabled();
  await expect(selected).toBeChecked();
  expect(await border(1)).toBe(await border(0));
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

for (const {slug,name,role,label,metadata} of [
  {slug:"check-card",name:"CheckCard",role:"checkbox",label:"Product updates",metadata:"Monthly"},
  {slug:"radio-card",name:"RadioCard",role:"radio",label:"Team",metadata:"$12 / month"},
] as const) {
  test(`${name} keeps metadata attached to its choice when the card narrows`, async ({page}) => {
    await page.setViewportSize({width:1440,height:940});
    await page.emulateMedia({reducedMotion:"reduce"});
    await page.goto(`/components/${slug}`);
    const stage = page.locator(".preview-stage");
    const choice = stage.getByRole(role,{name:label,exact:true});
    const card = choice.locator("..");
    const paint = () => card.evaluate(node=>getComputedStyle(node).backgroundColor);
    const copy = card.locator(".flood-choice-card__copy");
    const fact = card.getByText(metadata,{exact:true});
    const description = await card.locator(".flood-choice-card__description").innerText();
    await expect(choice).toHaveAccessibleDescription(`${description} ${metadata}`);
    const [wideCopy,wideFact] = await Promise.all([copy.boundingBox(),fact.boundingBox()]);
    expect(wideFact!.x).toBeGreaterThan(wideCopy!.x);
    const rest = await paint();
    await card.hover();
    const hover = await paint();
    expect(hover).not.toBe(rest);
    await page.getByRole("checkbox",{name:`${name} prop narrow`,exact:true}).check();
    const [narrowCopy,narrowFact] = await Promise.all([copy.boundingBox(),fact.boundingBox()]);
    expect(narrowFact!.x).toBeCloseTo(narrowCopy!.x,0);
    expect(narrowFact!.y).toBeGreaterThan(narrowCopy!.y + narrowCopy!.height);
    const size = (await card.boundingBox())!;
    if (role === "radio") {
      await stage.getByRole("radio",{name:"Starter",exact:true}).focus();
      await page.keyboard.press("ArrowDown");
    } else {
      await choice.press("Space");
    }
    await expect(choice).toBeChecked();
    await expect(choice).toBeFocused();
    expect(await paint()).not.toBe(hover);
    expect((await card.boundingBox())!.height).toBe(size.height);
  });
}
