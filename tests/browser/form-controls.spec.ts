import {test,expect,type Page,type Locator} from '@playwright/test';
import {build} from 'vite';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { chooseSelectOption } from "./select-helpers";

test("RatingBreakdown filters reviews without changing the original counts", async ({page}) => {
  await page.goto("/components/rating-breakdown");
  const distribution = page.getByRole("list", {name:"Ratings by star"});
  const results = page.getByRole("list", {name:"Customer reviews"});
  const five = distribution.getByRole("button", {name:"5 stars, 2 ratings"});
  const two = distribution.getByRole("button", {name:"2 stars, 1 rating"});
  await expect(results.getByRole("listitem")).toHaveCount(4);
  await expect(distribution.getByRole("button", {name:"3 stars, 0 ratings"})).toBeDisabled();
  const dimensions = await five.boundingBox();
  await five.press("Enter");
  await expect(five).toHaveAttribute("aria-pressed", "true");
  await expect(five).toBeFocused();
  await expect(results.getByRole("listitem")).toHaveCount(2);
  await expect(two).toHaveAttribute("aria-pressed", "false");
  const selectedDimensions = (await five.boundingBox())!;
  expect(selectedDimensions.width).toBeCloseTo(dimensions!.width, 0);
  expect(selectedDimensions.y).toBeCloseTo(dimensions!.y, 0);
  await two.click();
  await expect(two).toHaveAttribute("aria-pressed", "true");
  await expect(five).toHaveAttribute("aria-pressed", "false");
  await expect(results.getByRole("listitem")).toHaveCount(1);
  await expect(results).toContainText("The download timed out twice.");
  await two.press("Space");
  await expect(results.getByRole("listitem")).toHaveCount(4);
  await five.press("Enter");
  await page.getByRole("checkbox", {name:"RatingBreakdown prop filterable"}).uncheck();
  await expect(results.getByRole("listitem")).toHaveCount(4);
  await expect(distribution.getByRole("button")).toHaveCount(0);
  await expect(distribution.getByRole("meter", {name:"5 stars"})).toHaveAttribute("aria-valuenow", "2");
});

test("RatingSummary derives the score, total and aligned bars from the rating counts", async ({page}, info) => {
  await page.setViewportSize({width:1440,height:940});
  await page.goto("/components/rating-summary");
  const summary = page.getByRole("group",{name:"Rating breakdown"});
  const panel = page.locator(".preview-stage .flood-surface").filter({has:summary});
  const distribution = summary.getByRole("list");
  const tracks = distribution.getByRole("meter");
  await expect(summary.getByRole("img",{name:"4.7 out of 5"})).toBeVisible();
  await expect(summary.locator(".flood-rating-summary__count")).toHaveText("128 ratings");
  await expect(tracks).toHaveCount(5);
  await expect(tracks.first()).toHaveAccessibleName("5 stars");
  await expect(tracks.first()).toHaveAttribute("aria-valuemax","128");
  await expect(tracks.first()).toHaveAttribute("aria-valuenow","102");
  await expect(distribution.getByRole("meter",{name:"2 stars"})).toHaveAttribute("aria-valuenow","0");
  await page.evaluate(()=>document.fonts.ready);
  const overview = summary.locator(".flood-rating-summary__overview");
  expect((await distribution.boundingBox())!.x).toBeGreaterThan((await overview.boundingBox())!.x);
  await panel.screenshot({path:info.outputPath("rating-summary-wide.png")});
  const edges = await tracks.evaluateAll(nodes=>nodes.map(node=>{
    const {left,right}=node.getBoundingClientRect();
    return [left,right];
  }));
  expect(edges.every(edge=>edge[0]===edges[0][0]&&edge[1]===edges[0][1])).toBe(true);

  await page.getByRole("checkbox",{name:"RatingSummary prop narrow"}).check();
  expect((await distribution.boundingBox())!.y).toBeGreaterThan((await overview.boundingBox())!.y);
  await panel.screenshot({path:info.outputPath("rating-summary-narrow.png")});
  const scenario = page.getByRole("combobox",{name:"Scenario",exact:true});
  await chooseSelectOption(scenario,"single");
  await expect(summary.getByRole("img",{name:"4 out of 5"})).toBeVisible();
  await expect(summary.locator(".flood-rating-summary__count")).toHaveText("1 rating");
  await chooseSelectOption(scenario,"ten-star");
  await expect(tracks).toHaveCount(10);
  await expect(tracks.first()).toHaveAccessibleName("10 stars");
  await summary.evaluate(node=>{node.dir="rtl";});
  expect(await summary.evaluate(node=>node.scrollWidth-node.clientWidth)).toBeLessThanOrEqual(1);
  await summary.evaluate(node=>{node.removeAttribute("dir");});
  await chooseSelectOption(scenario,"empty");
  await expect(summary.getByRole("img",{name:"No ratings"})).toBeVisible();
  await expect(tracks).toHaveCount(0);
  await panel.screenshot({path:info.outputPath("rating-summary-empty.png")});
});

test("rating readouts distinguish fractional, zero and absent values", async ({ page }) => {
  await page.goto("/components/rating-value");
  const stage = page.locator(".preview-stage");
  const rating = stage.getByRole("img");
  await expect(rating).toHaveAccessibleName("4.7 out of 5 from 128 ratings");
  await expect(rating.locator("svg[data-full]")).toHaveCount(4);
  const edges = await rating.locator("svg").evaluateAll(marks => marks.map(mark => mark.getBoundingClientRect().top));
  expect(new Set(edges).size).toBe(1);
  const partial = rating.locator("svg:not([data-full]) .flood-rating-value__fill");
  await expect(partial).toHaveCount(1);
  const ltr = await partial.evaluate(node => getComputedStyle(node).clipPath);
  await rating.evaluate(node => { node.dir = "rtl"; });
  expect(await partial.evaluate(node => getComputedStyle(node).clipPath)).not.toEqual(ltr);
  await expect(rating).not.toHaveAttribute("tabindex");

  await chooseSelectOption(page.getByRole("combobox", {name:"RatingValue prop appearance"}), "compact");
  await expect(rating.locator("svg")).toHaveCount(1);
  await expect(rating.getByText("4.7/5")).toBeVisible();
  await chooseSelectOption(page.getByRole("combobox", {name:"RatingValue prop value"}), "0");
  await expect(rating).toHaveAccessibleName("0 out of 5 from 128 ratings");
  await expect(rating.getByText("0/5")).toBeVisible();
  await chooseSelectOption(page.getByRole("combobox", {name:"RatingValue prop value"}), "unrated");
  await expect(rating).toHaveAccessibleName("No ratings");
  await expect(rating.locator("svg")).toHaveCount(0);
});

test("keyboard rating updates supersede the mouse preview", async ({ page }) => {
  await page.goto("/components/rating");
  const group = page.getByRole("radiogroup", {name:"Your experience"});
  const filled = group.locator(".flood-rating__choice[data-filled]");
  await group.getByRole("radio", {name:"5 of 5 stars"}).hover();
  await expect(filled).toHaveCount(5);
  await group.getByRole("radio", {name:"3 of 5 stars"}).press("ArrowLeft");
  await expect(group.getByRole("radio", {name:"2 of 5 stars"})).toBeChecked();
  await expect(filled).toHaveCount(2);
});

test("compact rating marks keep full-size touch targets", async ({ browser, baseURL }) => {
  const context = await browser.newContext({baseURL, hasTouch:true, viewport:{width:390,height:844}});
  try {
    const page = await context.newPage();
    await page.goto("/components/rating");
    await page.getByRole("button", {name:"Size: md", exact:true}).tap();
    await page.getByRole("dialog", {name:"Size", exact:true}).getByRole("option", {name:"sm", exact:true}).tap();
    const star = page.getByRole("radio", {name:"4 of 5 stars"});
    const target = (await star.boundingBox())!;
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);
    await star.tap();
    await expect(star).toBeChecked();
  } finally {
    await context.close();
  }
});
let bundle:Promise<string>;
async function fixture(){
 const file=(p:string)=>JSON.stringify(resolve(p).replaceAll('\\','/'));const directory=resolve(`.artifacts/form-batch-${process.pid}`);await mkdir(directory,{recursive:true});const entry=resolve(directory,'entry.mjs');
 await writeFile(entry,`import React,{StrictMode,useState}from ${file('node_modules/react/index.js')};import{createRoot}from ${file('node_modules/react-dom/client.js')};import{FloodRoot,ListBox,PinInput,Rating,Dropzone,CharacterCount,Button}from ${file('packages/react/dist/index.js')};import ${file('packages/react/dist/styles.css')};const h=React.createElement,options=[{value:'react',label:'React'},{value:'vue',label:'Vue'},{value:'locked',label:'Unavailable',disabled:true},{value:'svelte',label:'Svelte'}];function App(){const[readonly,R]=useState(false),[disabled,D]=useState(false),[requested,Q]=useState(''),[pin,P]=useState('123456'),[owned,N]=useState(2);return h(FloodRoot,null,h('h1',null,'Form controls'),h('label',null,h('input',{type:'checkbox',checked:readonly,onChange:e=>R(e.target.checked)}),'Read only'),h('label',null,h('input',{type:'checkbox',checked:disabled,onChange:e=>D(e.target.checked)}),'Disable controls'),h('form',{id:'controls'},h(ListBox,{label:'Framework',options,name:'framework',defaultValue:'react',readOnly:readonly,disabled}),h(ListBox,{label:'Frameworks',options,name:'frameworks',defaultValue:['react'],multiple:true,readOnly:readonly,disabled}),h(ListBox,{label:'Fixed framework',options,value:'react',onValueChange:next=>Q(String(next))}),h(PinInput,{label:'Verification code',name:'code',defaultValue:'123456',onValueChange:P,readOnly:readonly,disabled,required:true}),h(PinInput,{label:'Fixed code',mode:'alphanumeric',length:4,value:'AB12',onValueChange:next=>Q(next)}),h(PinInput,{label:'Masked code',mode:'alphanumeric',length:4,mask:true,defaultValue:'1A'}),h(Rating,{label:'Experience',name:'experience',defaultValue:3,readOnly:readonly,disabled,required:true}),h(Rating,{label:'Owned rating',name:'owned-rating',value:owned,onValueChange:()=>{}}),h(Button,{onClick:()=>N(4)},'Set owned rating'),h(Dropzone,{label:'Attachments',name:'attachments',multiple:true,disabled,accept:'.pdf'}),h(CharacterCount,{value:pin,max:6,htmlFor:'code'}),h(Button,{type:'reset'},'Reset controls')),h('form',{id:'required'},h(Rating,{label:'Required rating',name:'required-rating',required:true}),h(Button,{type:'submit'},'Validate rating')),h('output',{id:'request'},requested));}createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
 const result=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':'"development"'},build:{write:false,cssCodeSplit:false,lib:{entry,formats:['iife'],name:'Fixture'}}});const output=Array.isArray(result)?result[0].output:result.output;return '<!doctype html><html lang="en"><head><title>Form batch</title><meta charset="utf-8"><style>'+output.filter(x=>x.type==='asset'&&x.fileName.endsWith('.css')).map(x=>(x as any).source).join('')+'form{display:grid;gap:1rem;margin-block:1rem}</style></head><body><main id="app"></main><script>'+output.filter(x=>x.type==='chunk').map(x=>(x as any).code).join('')+'</script></body></html>';
}
async function open(page:Page){bundle??=fixture();await page.route('**/__form-batch.html',async route=>route.fulfill({contentType:'text/html',body:await bundle}));await page.goto('/__form-batch.html');}
const fieldValues=(page:Page,name:string)=>page.locator('#controls').evaluate((node:HTMLFormElement,key)=>new FormData(node).getAll(key),name);
// Firefox discards ClipboardEventInit.clipboardData in synthetic events. Supply
// the explicit snapshot so this fixture exercises the same paste payload in every engine.
async function pasteText(input:Locator,text:string){
 await input.evaluate((node,value)=>{
  const data=new DataTransfer();data.setData('text/plain',value);
  const event=new ClipboardEvent('paste',{bubbles:true,cancelable:true});
  Object.defineProperty(event,'clipboardData',{value:data});node.dispatchEvent(event);
 },text);
}

test('ListBox keyboard selection, controlled refusal, read-only and reset preserve form values',async({page})=>{
 await open(page);const single=page.getByRole('listbox',{name:'Framework',exact:true});await single.focus();await single.press('ArrowDown');expect(await fieldValues(page,'framework')).toEqual(['vue']);await single.press('ArrowDown');expect(await fieldValues(page,'framework')).toEqual(['svelte']);await single.press('r');expect(await fieldValues(page,'framework')).toEqual(['react']);
 const multi=page.getByRole('listbox',{name:'Frameworks',exact:true});await multi.focus();await multi.press('ArrowDown');expect(await fieldValues(page,'frameworks')).toEqual(['react']);await multi.press('Space');expect(await fieldValues(page,'frameworks')).toEqual(['react','vue']);await page.getByRole('listbox',{name:'Fixed framework',exact:true}).press('ArrowDown');await expect(page.locator('#request')).toHaveText('vue');await expect(page.getByRole('listbox',{name:'Fixed framework',exact:true}).getByRole('option',{name:'React',exact:true})).toHaveAttribute('aria-selected','true');
 await page.getByRole('checkbox',{name:'Read only',exact:true}).check();await single.press('ArrowDown');expect(await fieldValues(page,'framework')).toEqual(['react']);await page.getByRole('button',{name:'Reset controls',exact:true}).click();await expect(multi.getByRole('option',{name:'Vue',exact:true})).toHaveAttribute('aria-selected','false');expect(await fieldValues(page,'frameworks')).toEqual(['react']);
});
test('PinInput keeps one native editor, sanitized paste, native editing and reset',async({page})=>{
 await open(page);const input=page.getByRole('textbox',{name:'Verification code',exact:true});await input.fill('12');await input.press('Backspace');await expect(input).toHaveValue('1');await input.press('Control+A');await pasteText(input,'123 456');await expect(input).toHaveValue('123456');expect(await fieldValues(page,'code')).toEqual(['123456']);expect(await input.evaluate((node:HTMLInputElement)=>node.checkValidity())).toBe(true);await input.fill('123');expect(await input.evaluate((node:HTMLInputElement)=>node.checkValidity())).toBe(false);await page.getByRole('checkbox',{name:'Read only',exact:true}).check();await pasteText(input,'654321');await expect(input).toHaveValue('123');await page.getByRole('button',{name:'Reset controls',exact:true}).click();await expect(input).toHaveValue('123456');
});
test('Rating uses native required radio groups, read-only behavior and native reset',async({page})=>{
 await open(page);const group=page.getByRole('radiogroup',{name:'Experience',exact:true});await group.getByRole('radio',{name:'4 of 5 stars',exact:true}).click();expect(await fieldValues(page,'experience')).toEqual(['4']);await page.keyboard.press('ArrowLeft');await expect(group.getByRole('radio',{name:'3 of 5 stars',exact:true})).toBeChecked();await page.getByRole('checkbox',{name:'Read only',exact:true}).check();await group.getByRole('radio',{name:'5 of 5 stars',exact:true}).click();await expect(group.getByRole('radio',{name:'3 of 5 stars',exact:true})).toBeChecked();expect(await fieldValues(page,'experience')).toEqual(['3']);await page.getByRole('checkbox',{name:'Read only',exact:true}).uncheck();await group.getByRole('radio',{name:'1 of 5 stars',exact:true}).click();await page.getByRole('button',{name:'Reset controls',exact:true}).click();await expect(group.getByRole('radio',{name:'3 of 5 stars',exact:true})).toBeChecked();
 await page.getByRole('button',{name:'Set owned rating',exact:true}).click();await page.getByRole('button',{name:'Reset controls',exact:true}).click();await expect(page.getByRole('radiogroup',{name:'Owned rating',exact:true}).getByRole('radio',{name:'4 of 5 stars',exact:true})).toBeChecked();expect(await fieldValues(page,'owned-rating')).toEqual(['4']);expect(await page.locator('#required').evaluate((node:HTMLFormElement)=>node.checkValidity())).toBe(false);await page.getByRole('radiogroup',{name:'Required rating',exact:true}).getByRole('radio',{name:'2 of 5 stars',exact:true}).click();expect(await page.locator('#required').evaluate((node:HTMLFormElement)=>node.checkValidity())).toBe(true);
});
test('Dropzone composes chooser and drops into the same FileList, deduplicates and rejects disabled drops',async({page})=>{
 await open(page);const zone=page.locator('.flood-dropzone'),input=page.getByLabel('Attachments',{exact:true});await input.setInputFiles({name:'first.pdf',mimeType:'application/pdf',buffer:Buffer.from('First')});const drop=()=>zone.evaluate(node=>{const data=new DataTransfer();data.items.add(new File(['Second'],'second.pdf',{type:'application/pdf',lastModified:100}));node.dispatchEvent(new DragEvent('dragenter',{dataTransfer:data,bubbles:true,cancelable:true}));node.dispatchEvent(new DragEvent('drop',{dataTransfer:data,bubbles:true,cancelable:true}));});await drop();await drop();expect(await input.evaluate((node:HTMLInputElement)=>Array.from(node.files!,file=>file.name))).toEqual(['first.pdf','second.pdf']);expect(await page.locator('#controls').evaluate((node:HTMLFormElement)=>new FormData(node).getAll('attachments').map(file=>(file as File).name))).toEqual(['first.pdf','second.pdf']);await page.getByRole('checkbox',{name:'Disable controls',exact:true}).check();await zone.evaluate(node=>{const data=new DataTransfer();data.items.add(new File(['Third'],'third.pdf',{type:'application/pdf'}));node.dispatchEvent(new DragEvent('drop',{dataTransfer:data,bubbles:true,cancelable:true}));});expect(await input.evaluate((node:HTMLInputElement)=>node.files!.length)).toBe(2);await page.getByRole('checkbox',{name:'Disable controls',exact:true}).uncheck();await page.getByRole('button',{name:'Reset controls',exact:true}).click();await expect(zone.locator('.flood-file-input__summary')).toHaveText('Choose files');
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);await page.setViewportSize({width:390,height:900});await page.evaluate(()=>document.documentElement.style.fontSize='24px');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'.artifacts/form-batch-narrow.png',fullPage:true});
});

test('PinInput alphanumeric catalog can erase a clicked first occupied slot and clear the whole code',async({page})=>{
 await page.goto('/components/pin-input');const mode=page.getByRole('combobox',{name:'PinInput prop mode',exact:true});await mode.click();await page.getByRole('option',{name:'alphanumeric',exact:true}).click();const stage=page.locator('.preview-stage'),input=stage.getByLabel('Verification code',{exact:true});await input.click();await input.pressSequentially('1aB2c3');await expect(input).toHaveValue('1aB2c3');for(let index=0;index<6;index++)await input.press('Backspace');await expect(input).toHaveValue('');
 await input.fill('1');const first=await stage.locator('[data-pin-slot]').first().boundingBox();await page.mouse.click(first!.x+first!.width/2,first!.y+first!.height/2);await input.press('Backspace');await expect(input).toHaveValue('');
 await input.fill('aB12');await input.press('Control+A');await input.press('Backspace');await expect(input).toHaveValue('');
});


test('PinInput occupied-slot editing supports removal, replacement, password masking and controlled refusal',async({page})=>{
 await open(page);
 const clickFirst=async(label:string)=>{const input=page.getByLabel(label,{exact:true});await input.scrollIntoViewIfNeeded();const slot=input.locator('..').locator('[data-pin-slot]').first(),box=await slot.boundingBox();await page.mouse.click(box!.x+box!.width/2,box!.y+box!.height/2);await expect(input).toBeFocused();return input;};
 const numeric=page.getByLabel('Verification code',{exact:true});
 for(let index=0;index<6;index++){await clickFirst('Verification code');await numeric.press('Backspace');}
 await expect(numeric).toHaveValue('');await expect(numeric.locator('..').locator('[data-pin-slot]')).toHaveText(['','','','','','']);
 await numeric.fill('123456');await clickFirst('Verification code');await numeric.press('9');await expect(numeric).toHaveValue('923456');await numeric.press('Control+A');await numeric.press('Backspace');await expect(numeric).toHaveValue('');
 const fixed=await clickFirst('Fixed code');await fixed.press('Backspace');await expect(page.locator('#request')).toHaveText('B12');await expect(fixed).toHaveValue('AB12');
 const masked=await clickFirst('Masked code');await masked.press('Backspace');await expect(masked).toHaveValue('A');await clickFirst('Masked code');await masked.press('Backspace');await expect(masked).toHaveValue('');
 await pasteText(masked,'a B12');await expect(masked).toHaveValue('aB12');await masked.press('Control+A');await masked.press('Backspace');await expect(masked).toHaveValue('');await page.getByRole('button',{name:'Reset controls',exact:true}).click();await expect(masked).toHaveValue('1A');await expect(numeric).toHaveValue('123456');
});
