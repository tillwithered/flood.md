import {test,expect,type Page} from '@playwright/test';
import {build} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
let bundled:Promise<string>;
async function fixture(){
  const file=(path:string)=>JSON.stringify(resolve(path).replaceAll('\\','/'));
  const directory=resolve(`.artifacts/grouped-form-${process.pid}`);await mkdir(directory,{recursive:true});
  const entry=resolve(directory,'entry.mjs');
  await writeFile(entry,`import React,{useState}from ${file('node_modules/react/index.js')};import{createRoot}from ${file('node_modules/react-dom/client.js')};
import{FloodRoot,Button}from ${file('packages/react/dist/index.js')};import{GroupedForm}from ${file('apps/website/src/recipes/grouped-form.tsx')};import ${file('packages/react/dist/styles.css')};const h=React.createElement;
function App(){const[show,S]=useState(true),[values,V]=useState('');return h(FloodRoot,null,h(GroupedForm,{showBillingEmail:show,onApply:data=>V(JSON.stringify(Object.fromEntries(data)))}),h(Button,{onClick:()=>S(!show)},'Toggle billing email'),h('output',{'aria-label':'Applied values'},values));}createRoot(document.getElementById('app')).render(h(App));`);
  const result=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{write:false,cssCodeSplit:false,lib:{entry,formats:['iife'],name:'GroupedFormFixture'}}});
  const output=(Array.isArray(result)?result:[result]).flatMap(x=>'output'in x?x.output:[]);
  return '<!doctype html><html><head><meta charset="utf-8"><style>'+output.filter(x=>x.type==='asset'&&x.fileName.endsWith('.css')).map(x=>(x as any).source).join('')+'body{margin:0;background:#181818}main{max-width:72rem;margin:auto;padding:1rem}</style></head><body><main id="app"></main><script>'+output.filter(x=>x.type==='chunk').map(x=>(x as any).code).join('')+'</script></body></html>';
}
async function open(page:Page){bundled??=fixture();await page.setViewportSize({width:1440,height:1100});await page.route('**/__grouped-form',async route=>route.fulfill({contentType:'text/html',body:await bundled}));await page.goto('/__grouped-form');await page.getByRole('group',{name:'Identity',exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);}
test.beforeEach(async({},info)=>{test.skip(info.project.name==='mobile','Recipe verification uses its declared desktop composition scope');});
async function tracks(page:Page){
  const boxes=await page.locator('form .flood-surface').evaluateAll(groups=>groups.map(group=>{const r=group.getBoundingClientRect();return{x:r.x,right:r.right,width:r.width};}));
  expect(boxes).toHaveLength(4);
  for(const [a,b] of [[0,2],[1,3]]){
    expect(Math.abs(boxes[a].x-boxes[b].x)).toBeLessThanOrEqual(1);
    expect(Math.abs(boxes[a].right-boxes[b].right)).toBeLessThanOrEqual(1);
  }
  expect(Math.abs(boxes[0].width-boxes[1].width)).toBeLessThanOrEqual(1);
  return boxes;
}
test('peer form groups share tracks with optional fields, long labels and enlarged text',async({page})=>{
  await open(page);await tracks(page);
  const before=await tracks(page);await page.getByRole('button',{name:'Toggle billing email'}).click();
  await expect(page.getByRole('textbox',{name:'Billing email',exact:true})).toHaveCount(0);
  expect(await tracks(page)).toEqual(before);
  await page.getByRole('textbox',{name:'Contact email',exact:true}).evaluate(input=>{
    const label=document.querySelector(`label[for="${input.id}"]`)!;label.textContent='Primary contact email for scheduling and notifications';
  });
  await page.evaluate(()=>document.documentElement.style.fontSize='24px');
  await page.setViewportSize({width:1280,height:1100});await tracks(page);
  await page.screenshot({path:'.artifacts/grouped-form-enlarged.png',fullPage:true});
});
test('group layout preserves label ownership, required validation and native submission',async({page})=>{
  await open(page);
  await page.getByRole('button',{name:'Apply settings',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Workspace name',exact:true})).toBeFocused();
  await expect(page.getByRole('status',{name:'Applied values'})).toBeEmpty();
  await page.getByRole('textbox',{name:'Workspace name',exact:true}).fill('Design');
  await page.getByRole('textbox',{name:'Contact email',exact:true}).fill('team@example.com');
  await page.getByRole('button',{name:'Apply settings',exact:true}).click();
  const values=JSON.parse(await page.getByRole('status',{name:'Applied values'}).innerText());
  expect(values.workspace).toBe('Design');expect(values.contactEmail).toBe('team@example.com');
  expect(values.language).toBe('en');expect(values.timezone).toBe('UTC');
});
