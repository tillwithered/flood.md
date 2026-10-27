import {test,expect,type Page} from "@playwright/test";
import {build} from "vite";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
let bundled:Promise<string>;
async function fixture(){
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll("\\","/"));const directory=resolve(`.artifacts/time-compositions-${process.pid}`);await mkdir(directory,{recursive:true});const entry=resolve(directory,"entry.mjs");
  await writeFile(entry,`import React,{useState}from ${file("node_modules/react/index.js")};import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,TimePicker,Calendar,DatePicker,DateTimeRangePicker,Button,Checkbox}from ${file("packages/react/dist/index.js")};import ${file("packages/react/dist/styles.css")};const h=React.createElement;
function App(){const[readOnly,R]=useState(false),[disabled,D]=useState(false),[cancel,C]=useState(false),[month,M]=useState('2026-10'),[refuse,F]=useState(false),[requested,Q]=useState('');const initial={start:{date:'2026-10-27',time:'09:00'},end:{date:'2026-10-27',time:'18:00'}};return h(FloodRoot,null,h('h1',null,'Time compositions'),
h('form',{id:'time-form',onReset:e=>{if(cancel)e.preventDefault()},onSubmit:e=>e.preventDefault()},h('fieldset',{disabled},h('legend',null,'Time'),h(TimePicker,{id:'clock',label:'Start time',name:'time',defaultValue:'09:30',min:'08:00',max:'18:00',interval:1800,readOnly}),h(Button,{type:'reset'},'Reset time'))),
h('form',{id:'range-form',onReset:e=>{if(cancel)e.preventDefault()},onSubmit:e=>e.preventDefault()},h('fieldset',{disabled},h('legend',null,'Range'),h(DateTimeRangePicker,{id:'range',label:'Booking',defaultValue:initial,value:refuse?initial:undefined,onValueChange:next=>Q(JSON.stringify(next)),startDateName:'startDate',startTimeName:'startTime',endDateName:'endDate',endTimeName:'endTime',required:true,readOnly}),h(Button,{type:'reset'},'Reset range'))),
h(Calendar,{id:'month-navigation',label:'Choose month',granularity:'month',value:month,onValueChange:M,min:'2020-03',max:'2035-09'}),h(Calendar,{id:'year-navigation',label:'Choose year',granularity:'year',defaultValue:'2026',min:'2020',max:'2035'}),h(Calendar,{id:'calendar',label:'Standalone calendar',onValueChange:Q,defaultValue:'2026-10-27',today:'2026-10-27',readOnly}),h(DatePicker,{label:'Single date',defaultValue:'2026-10-27'}),
h(Checkbox,{label:'Read only',checked:readOnly,onChange:e=>R(e.currentTarget.checked)}),h(Checkbox,{label:'Disable fieldsets',checked:disabled,onChange:e=>D(e.currentTarget.checked)}),h(Checkbox,{label:'Cancel reset',checked:cancel,onChange:e=>C(e.currentTarget.checked)}),h(Checkbox,{label:'Refuse range',checked:refuse,onChange:e=>F(e.currentTarget.checked)}),h('output',{'aria-label':'Requested'},requested));}createRoot(document.getElementById('app')).render(h(App));`);
  const result=await build({configFile:false,logLevel:"silent",define:{"process.env.NODE_ENV":JSON.stringify("production")},build:{write:false,cssCodeSplit:false,lib:{entry,formats:["iife"],name:"TimeCompositions"}}});
  const output=(Array.isArray(result)?result:[result]).flatMap(x=>"output"in x?x.output:[]);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Time compositions</title><style>'+output.filter(x=>x.type==="asset"&&x.fileName.endsWith(".css")).map(x=>(x as any).source).join("")+'body{margin:1rem;background:#181818;color:white}main{max-width:34rem}</style></head><body><main id="app"></main><script>'+output.filter(x=>x.type==="chunk").map(x=>(x as any).code).join("")+'</script></body></html>';
}
async function open(page:Page){bundled??=fixture();await page.route("**/__time-compositions.html",async route=>route.fulfill({contentType:"text/html",body:await bundled}));await page.goto("/__time-compositions.html");}
const data=(page:Page,id:string)=>page.locator(`#${id}`).evaluate((form:HTMLFormElement)=>Object.fromEntries(new FormData(form)));
test("TimePicker uses list keyboard selection, bounds, native reset and readonly",async({page})=>{
 await open(page);const trigger=page.locator('#time-form').getByRole('button',{name:'Choose time: Start time',exact:true});await trigger.click();const panel=page.getByRole('dialog',{name:'Start time options',exact:true});await expect(panel).toBeVisible();
 await expect(panel.getByRole('option',{name:'07:30',exact:true})).toHaveCount(0);await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(panel).toBeHidden();expect(await data(page,'time-form')).toEqual({time:'10:00'});await expect(trigger).toBeFocused();
 await page.getByRole('button',{name:'Reset time',exact:true}).click();await expect.poll(()=>data(page,'time-form')).toEqual({time:'09:30'});
 await page.getByRole('checkbox',{name:'Read only',exact:true}).check();await expect(trigger).toBeDisabled();await expect.poll(()=>data(page,'time-form')).toEqual({time:'09:30'});
});
async function chooseYear(panel: ReturnType<Page["getByRole"]>, year:number){
 await panel.getByRole('button',{name:/^Year:/}).click();
 while(!await panel.getByRole('button',{name:String(year),exact:true}).count())await panel.getByRole('button',{name:'Next Year',exact:true}).click();
 await panel.getByRole('button',{name:String(year),exact:true}).click();
}
test("Calendar month and year selection share the bounded calendar views",async({page})=>{
 await open(page);const calendar=page.locator('#month-navigation');await chooseYear(calendar,2030);
 await expect(calendar.getByRole('button',{name:'February 2030',exact:true})).toBeVisible();
 await calendar.getByRole('button',{name:'February 2030',exact:true}).click();await expect(calendar.getByRole('button',{name:'February 2030',exact:true})).toHaveAttribute('aria-pressed','true');
 await calendar.getByRole('button',{name:/^Year:/}).click();await calendar.getByRole('button',{name:'Previous Year',exact:true}).click();await calendar.getByRole('button',{name:'2020',exact:true}).click();await expect(calendar.getByRole('button',{name:'January 2020',exact:true})).toBeDisabled();await expect(calendar.getByRole('button',{name:'Previous Year',exact:true})).toBeDisabled();
 const years=page.locator('#year-navigation');await years.getByRole('button',{name:'2024',exact:true}).click();await expect(years.getByRole('button',{name:'2024',exact:true})).toHaveAttribute('aria-pressed','true');await expect(years.getByRole('grid')).toHaveCount(0);
});

test("Calendar swaps year/month views in place and restores days in the same DatePicker popup",async({page})=>{
 await open(page);const calendar=page.locator('#calendar');const original=await calendar.boundingBox();await chooseYear(calendar,2024);await expect(calendar.getByRole('grid')).toHaveAccessibleName(/October 2024/);
 await calendar.getByRole('button',{name:'Month: October',exact:true}).click();await calendar.getByRole('button',{name:'June 2024',exact:true}).click();await expect(calendar.getByRole('grid')).toHaveAccessibleName(/June 2024/);await expect(page.locator('output[aria-label=Requested]')).toHaveText('');expect((await calendar.boundingBox())!.height).toBeCloseTo(original!.height,0);
 await page.getByRole('button',{name:'Open calendar: Single date',exact:true}).click();const picker=page.getByRole('dialog',{name:'Single date calendar',exact:true});const box=await picker.boundingBox();await chooseYear(picker,2032);await expect(picker.getByRole('grid')).toHaveAccessibleName(/2032/);await expect(page.getByRole('dialog')).toHaveCount(1);
 await picker.getByRole('button',{name:'Month: October',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(1);await picker.getByRole('button',{name:'June 2032',exact:true}).click();await expect(picker.getByRole('grid')).toHaveAccessibleName(/June 2032/);expect((await picker.boundingBox())!.height).toBeCloseTo(box!.height,0);await expect(picker).toBeVisible();
});

test("DateTimeRangePicker rejects reversed and incomplete endpoints atomically, then resets",async({page})=>{
 await open(page);const form=page.locator('#range-form'),endHour=form.getByRole('spinbutton',{name:'End time, Hour',exact:true});
 await endHour.fill('08');expect(await form.evaluate((f:HTMLFormElement)=>f.checkValidity())).toBe(false);expect(Object.values(await data(page,'range-form'))).toEqual(['','','','']);
 await endHour.fill('19');expect(await form.evaluate((f:HTMLFormElement)=>f.checkValidity())).toBe(true);expect((await data(page,'range-form')).endTime).toBe('19:00');
 await form.getByRole('spinbutton',{name:'End time, Minute',exact:true}).fill('');expect(Object.values(await data(page,'range-form'))).toEqual(['','','','']);
 await page.getByRole('heading',{name:'Time compositions'}).click();await page.getByRole('button',{name:'Reset range',exact:true}).click();await expect(endHour).toHaveValue('18');expect((await data(page,'range-form')).endTime).toBe('18:00');
});
test("DateTimeRangePicker controlled refusal, reset cancellation and inherited disabled stay explicit",async({page})=>{
 await open(page);const form=page.locator('#range-form');await page.getByRole('checkbox',{name:'Refuse range',exact:true}).check();await form.getByRole('spinbutton',{name:'Start time, Minute',exact:true}).fill('30');
 expect(Object.values(await data(page,'range-form'))).toEqual(['','','','']);await page.getByRole('heading',{name:'Time compositions'}).click();expect((await data(page,'range-form')).startTime).toBe('09:00');
 await page.getByRole('checkbox',{name:'Refuse range',exact:true}).uncheck();await form.getByRole('spinbutton',{name:'End time, Hour',exact:true}).fill('19');await page.getByRole('checkbox',{name:'Cancel reset',exact:true}).check();await page.getByRole('button',{name:'Reset range',exact:true}).click();expect((await data(page,'range-form')).endTime).toBe('19:00');
 await page.getByRole('checkbox',{name:'Disable fieldsets',exact:true}).check();expect(await data(page,'range-form')).toEqual({});await expect(page.locator('#time-form').getByRole('button',{name:'Choose time: Start time',exact:true})).toBeDisabled();
});

test("TimePicker matches date action insets and shows the selected time in one scroll owner",async({page})=>{
 await open(page);const form=page.locator('#time-form'),trigger=form.getByRole('button',{name:'Choose time: Start time',exact:true});
 const timeInset=await form.locator('.flood-time-field__control').evaluate(n=>n.getBoundingClientRect().right-n.querySelector('button')!.getBoundingClientRect().right);
 const dateInset=await page.locator('.flood-date-field__control').first().evaluate(n=>n.getBoundingClientRect().right-n.querySelector('button')!.getBoundingClientRect().right);
 expect(timeInset).toBeCloseTo(dateInset,0);expect(timeInset).toBeLessThanOrEqual(5);
 await form.getByRole('spinbutton',{name:'Start time, Hour',exact:true}).fill('17');await trigger.click();
 const panel=page.getByRole('dialog',{name:'Start time options',exact:true});
 await expect(panel.locator('.flood-overlay-header')).toHaveCount(0);
 expect(await panel.evaluate(n=>[...n.querySelectorAll<HTMLElement>('*')].filter(e=>e.scrollHeight>e.clientHeight+2&&['auto','scroll'].includes(getComputedStyle(e).overflowY)).length)).toBe(1);
 await expect.poll(()=>panel.getByRole('option',{name:'17:30',exact:true}).evaluate(n=>{const row=n.getBoundingClientRect(),viewport=n.closest('.flood-scroll-area__viewport')!.getBoundingClientRect();return row.top>=viewport.top-1&&row.bottom<=viewport.bottom+1;})).toBe(true);
});

test("DateTimeRangePicker has three visible headings and four independently named fields",async({page})=>{
 await open(page);const range=page.locator('#range');await expect(range.locator('.flood-legend')).toHaveText(['Booking','Start','End']);
 const labels=await range.locator('.flood-date-field > .flood-label,.flood-time-field > .flood-label').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().width));
 expect(labels).toHaveLength(4);expect(labels.every(width=>width<=1)).toBe(true);
 for(const label of ['Start time, Hour','End time, Hour'])await expect(range.getByRole('spinbutton',{name:label,exact:true})).toBeVisible();
 for(const label of ['Open calendar: Start date','Open calendar: End date'])await expect(range.getByRole('button',{name:label,exact:true})).toBeVisible();
});

test("Calendar view keyboard stays in the popup, Escape returns to days, then closes",async({page})=>{
 await open(page);await page.getByRole('button',{name:'Open calendar: Single date',exact:true}).click();const picker=page.getByRole('dialog',{name:'Single date calendar',exact:true});
 await picker.getByRole('button',{name:'Year: 2026',exact:true}).click();await expect(picker.getByRole('button',{name:'2026',exact:true})).toBeFocused();
 await page.keyboard.press('ArrowLeft');await expect(picker.getByRole('button',{name:'2025',exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(picker.getByRole('grid')).toHaveAccessibleName(/October 2025/);
 await picker.getByRole('button',{name:'Month: October',exact:true}).click();await expect(picker.getByRole('button',{name:'October 2025',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(picker.getByRole('grid')).toBeVisible();await expect(picker).toBeVisible();await page.keyboard.press('Escape');await expect(picker).toBeHidden();
});
