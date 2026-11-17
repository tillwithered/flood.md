import {test,expect,type Page} from '@playwright/test';
import {build} from 'vite';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
let bundle:Promise<string>;
async function fixture(){
 const file=(p:string)=>JSON.stringify(resolve(p).replaceAll('\\','/')),directory=resolve(`.artifacts/utility-${process.pid}`);await mkdir(directory,{recursive:true});const entry=resolve(directory,'entry.mjs');await writeFile(entry,`import React,{useEffect,useState}from ${file('node_modules/react/index.js')};import{createRoot}from ${file('node_modules/react-dom/client.js')};import{FloodRoot,CopyButton,ToastRegion,Button,Checkbox}from ${file('packages/react/dist/index.js')};import ${file('packages/react/dist/styles.css')};const h=React.createElement;function App(){const[items,I]=useState([{id:'first',title:'First notice',duration:400},{id:'second',title:'Second notice',duration:400}]),[keep,K]=useState(false),[requests,R]=useState(0),[error,E]=useState(''),[timerReady,T]=useState('');useEffect(()=>T(items[0]?.id??''),[items]);return h(FloodRoot,null,h('h1',null,'Utility controls'),h(CopyButton,{value:'local test',resetDelay:500,onCopyError:e=>E(e.message)}),h('fieldset',{disabled:true},h('legend',null,'Unavailable'),h(CopyButton,{value:'blocked',copyLabel:'Disabled copy'})),h(Button,{onClick:()=>I([{id:'first',title:'First notice',duration:400},{id:'second',title:'Second notice',duration:400}])},'Restore queue'),h(Checkbox,{label:'Keep notices',checked:keep,onChange:e=>K(e.currentTarget.checked)}),h(ToastRegion,{label:'Empty region',inline:true,items:[],onDismiss:()=>{}}),h(ToastRegion,{label:'Active notices',inline:true,limit:1,items,onDismiss:id=>{R(n=>n+1);if(!keep)I(current=>current.filter(x=>x.id!==id))}}),h(Button,null,'After region'),h('output',{'aria-label':'Dismiss requests'},String(requests)),h('output',{'aria-label':'Copy error'},error),h('output',{'aria-label':'Timer ready'},timerReady));}createRoot(document.getElementById('app')).render(h(App));`);
 const result=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':'"production"'},build:{write:false,cssCodeSplit:false,lib:{entry,formats:['iife'],name:'Fixture'}}});const output=Array.isArray(result)?result[0].output:result.output;return '<!doctype html><html lang="en"><head><title>Utility checks</title><style>'+output.filter(x=>x.type==='asset'&&x.fileName.endsWith('.css')).map(x=>(x as any).source).join('')+'</style></head><body><main id="app"></main><script>'+output.filter(x=>x.type==='chunk').map(x=>(x as any).code).join('')+'</script></body></html>';
}
async function open(page:any){bundle??=fixture();await page.route('**/__utility.html',async(route:any)=>route.fulfill({contentType:'text/html',body:await bundle}));await page.goto('/__utility.html');}
// Freeze before mounting: installed clocks otherwise keep advancing during browser actions.
async function freezeClock(page:Page){
 const start=new Date('2026-10-26T12:00:00Z');
 await page.clock.install({time:start});
 await page.clock.pauseAt(new Date(start.getTime()+1000));
}
async function timersReady(page:Page,id:string){
 // The fixture parent effect runs after the newly visible toast's timer effect.
 await expect(page.getByRole('status',{name:'Timer ready',exact:true})).toHaveText(id);
}

test("ProfileSummary keeps identity and actions reachable at narrow width", async ({page}) => {
  await page.goto("/components/profile-summary");
  const stage = page.locator(".preview-stage");
  const summary = stage.locator(".flood-profile-summary");
  await expect(summary.getByRole("list", {name:"Profile facts"})).toContainText("248 followers");
  await page.getByRole("checkbox", {name:"ProfileSummary prop narrow"}).check();
  await page.getByRole("checkbox", {name:"ProfileSummary prop longProfile"}).check();
  await expect(summary.getByText("@alexandra-konstantinova.design.example", {exact:true})).toBeVisible();
  await expect.poll(() => summary.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await summary.getByRole("button", {name:"Follow Alexandra Konstantinova", exact:true}).press("Enter");
  await expect(summary.getByRole("button", {name:"Following Alexandra Konstantinova, unfollow"})).toBeFocused();
  await page.getByRole("checkbox", {name:"ProfileSummary prop details"}).uncheck();
  await expect(summary.getByRole("list", {name:"Profile facts"})).toHaveCount(0);
  await expect(summary.getByText("Alexandra Konstantinova", {exact:true})).toBeVisible();
});

test("FollowButton keeps its width and focus across subscription actions", async ({page}) => {
  await page.goto("/components/follow-button");
  const follow = page.getByRole("button", {name: "Follow Maya Chen", exact: true});
  const following = page.getByRole("button", {name: "Following Maya Chen, unfollow"});
  const requested = page.getByRole("button", {name: "Requested Maya Chen, cancel request"});
  const pending = page.getByRole("checkbox", {name: "FollowButton prop pending"});
  const width = (await follow.boundingBox())!.width;
  await pending.check();
  await follow.focus();
  await expect(follow).toHaveAttribute("aria-busy", "true");
  await follow.press("Enter");
  await expect(follow).toBeFocused();
  await expect(following).toHaveCount(0);
  expect((await follow.boundingBox())!.width).toBeCloseTo(width, 0);
  await pending.uncheck();
  await follow.press("Enter");
  await expect(following).toBeFocused();
  expect((await following.boundingBox())!.width).toBeCloseTo(width, 0);
  await following.press("Space");
  await expect(follow).toBeFocused();
  await page.getByRole("checkbox", {name: "FollowButton prop privateProfile"}).check();
  await follow.click();
  await expect(requested).toBeFocused();
  expect((await requested.boundingBox())!.width).toBeCloseTo(width, 0);
  await requested.press("Enter");
  await expect(follow).toBeFocused();
});

test('CopyButton writes only from enabled clicks and preserves label geometry', async ({page}, info) => {
 await page.addInitScript(() => {
  (window as any).copies = [];
  Object.defineProperty(navigator, 'clipboard', {
   configurable: true, value: { writeText: async (text: string) => {
    if ((window as any).failCopy) throw new Error('Clipboard denied');
    (window as any).copies.push(text);
   } },
  });
 });
 await open(page);
 const copy = page.getByRole('button', {name: 'Copy', exact: true});
 const geometry = () => page.locator('.flood-copy-button').first().evaluate(button => {
  const icon = button.querySelector(':scope > .flood-icon')!.getBoundingClientRect();
  const label = button.querySelector('.flood-action-labels > [data-visible]')!.getBoundingClientRect();
  const box = button.getBoundingClientRect();
  return {gap: label.left - icon.right, left: icon.left - box.left, right: box.right - label.right, width: box.width};
 });
 const idle = await geometry();
 expect(Math.abs(idle.left - idle.right)).toBeLessThan(1);
 await copy.click();
 const copied = page.getByRole('button', {name: 'Copied', exact: true});
 await expect(copied).toBeVisible();
 await expect.poll(geometry).toEqual(idle);
 await expect(copied.locator('.flood-icon-swap__glyph[data-active]')).toHaveCSS('opacity', '1');
 await copied.screenshot({path: info.outputPath('copy-button-copied.png')});
 expect(await page.evaluate(() => (window as any).copies)).toEqual(['local test']);
 await expect(page.getByRole('button', {name: 'Disabled copy'})).toBeDisabled();
 await expect(copy).toBeVisible();
 await page.evaluate(() => (window as any).failCopy = true);
 await copy.click();
 await expect(page.getByRole('button', {name: 'Failed', exact: true})).toBeVisible();
 await expect.poll(geometry).toEqual(idle);
 await expect(page.getByRole('status', {name: 'Copy error'})).toHaveText('Clipboard denied');
});

test('icon-only CopyButton keeps its square target and announces the copy result', async ({ page }) => {
 await page.addInitScript(() => {
  Object.defineProperty(navigator, 'clipboard', {
   configurable: true, value: { writeText: async (value: string) => { document.body.dataset.copiedValue = value; } },
  });
 });
 await page.goto('/components/copy-button');
 const iconOnly = page.getByRole('checkbox', { name: 'CopyButton prop iconOnly', exact: true });
 await iconOnly.check();
 const stage = page.locator('.workbench-stage');
 const button = stage.getByRole('button', { name: 'Copy', exact: true });
 const { width, height } = (await button.boundingBox())!;
 expect(width).toBeCloseTo(height);
 await button.focus();
 await button.press('Enter');
 const copied = stage.getByRole('button', { name: 'Copied', exact: true });
 await expect(copied).toBeVisible();
 await expect(stage.getByRole('status')).toHaveText('Copied');
 await expect(page.locator('body')).toHaveAttribute('data-copied-value', 'npm install @flood-md/react');
 expect((await copied.boundingBox())!.width).toBeCloseTo(width);
});
test('ToastRegion pauses visible timers and starts queued timers only on display',async({page})=>{
 await freezeClock(page);await open(page);await timersReady(page,'first');const region=page.getByRole('region',{name:'Active notices'});await page.mouse.move(1,1);await page.clock.runFor(150);await region.locator('.flood-toast').hover({position:{x:10,y:10}});await page.clock.runFor(700);await expect(region.getByText('First notice',{exact:true})).toBeVisible();await page.mouse.move(1,1);await page.clock.runFor(300);await expect(region.getByText('Second notice',{exact:true})).toBeVisible();await timersReady(page,'second');await page.clock.runFor(450);await expect(region.locator('.flood-toast')).toHaveCount(0);
});
test('ToastRegion F8 skips empty regions and manual dismiss does not later expire twice',async({page})=>{
 await freezeClock(page);await open(page);await timersReady(page,'first');await page.getByRole('checkbox',{name:'Keep notices'}).check();await page.keyboard.press('F8');const close=page.getByRole('button',{name:'Dismiss notification: First notice'});await expect(close).toBeFocused();await page.clock.runFor(600);await expect(close).toBeVisible();await close.click();await page.getByRole('button',{name:'After region'}).focus();await page.mouse.move(1,1);await page.clock.runFor(600);await expect(page.getByRole('status',{name:'Dismiss requests'})).toHaveText('1');
});

test('overflowing toasts keep their width and scroll keyboard focus into view', async ({page}) => {
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto('/components/toast-region');
  await page.getByRole('checkbox',{name:'ToastRegion prop inline'}).check();
  await page.getByRole('checkbox',{name:'ToastRegion prop longText'}).check();
  const region = page.getByRole('region',{name:'Notifications',exact:true});
  await region.evaluate(node=>{
    node.style.inlineSize = '16rem';
    node.style.maxBlockSize = '11rem';
  });
  const viewport = region.locator('.flood-toast-region__viewport');
  const cards = region.getByRole('listitem');
  const initial = (await cards.first().boundingBox())!.width;
  const add = page.getByRole('button',{name:'Show notification',exact:true});
  await add.click();
  await add.click();
  await expect(cards).toHaveCount(3);
  await expect(viewport).toHaveAttribute('data-scrollbars','overlay');
  await expect(region.locator('.flood-scroll-area__track--vertical')).toBeVisible();
  expect((await cards.first().boundingBox())!.width).toBeCloseTo(initial,0);
  const close = cards.last().getByRole('button');
  await close.evaluate(node=>node.focus({preventScroll:true}));
  await expect(close).toBeFocused();
  await expect.poll(() => viewport.evaluate(node=>node.scrollTop)).toBeGreaterThan(0);
  const [bounds,target] = await Promise.all([viewport.boundingBox(),close.boundingBox()]);
  expect(target!.y + target!.height).toBeLessThanOrEqual(bounds!.y + bounds!.height + 1);
});

test('floating retry preview clears the studio controls and updates the notice on retry', async ({page}) => {
  await page.goto('/components/toast-region');
  await page.getByRole('checkbox',{name:'ToastRegion prop showAction'}).check();
  const region = page.getByRole('region',{name:'Notifications',exact:true});
  const card = region.getByRole('listitem');
  const reference = page.getByRole('button',{name:/^Reference/});
  await expect(region.getByRole('alert')).toContainText('Could not save project preferences');
  await expect.poll(async () => {
    const [notice, control] = await Promise.all([card.boundingBox(),reference.boundingBox()]);
    return control!.y - notice!.y - notice!.height;
  }).toBeGreaterThanOrEqual(8);
  await region.getByRole('button',{name:'Retry save'}).click();
  await expect(region.getByRole('status')).toHaveText('Preferences saved');
  await expect(region.getByRole('button',{name:'Retry save'})).toHaveCount(0);
});
