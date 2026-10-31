import {test,expect,type Page} from '@playwright/test';
import {build} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
let bundle:Promise<string>;
async function fixture(){
 const path=(p:string)=>JSON.stringify(resolve(p).replaceAll('\\','/'));
 const dir=resolve(`.artifacts/record-workspace-${process.pid}`);await mkdir(dir,{recursive:true});
 const entry=resolve(dir,'entry.tsx');
 await writeFile(entry,`import React,{StrictMode}from ${path('node_modules/react/index.js')};import{createRoot}from ${path('node_modules/react-dom/client.js')};
import{FloodRoot}from ${path('packages/react/dist/index.js')};import{RecordWorkspace}from ${path('apps/website/src/recipes/record-workspace.tsx')};import ${path('packages/react/dist/styles.css')};
let denied=false;const store={getItem:k=>{if(new URLSearchParams(location.search).has('denyread'))throw Error('denied');return localStorage.getItem(k)},setItem:(k,v)=>{if(denied)throw Error('quota');localStorage.setItem(k,v)}};
window.denyWrites=v=>{denied=v};
async function loader({records,search,status,page,pageSize,sort}){await new Promise(r=>setTimeout(r,search==='old'?120:5));let rows=records.filter(r=>(status==='all'||r.status===status)&&r.name.toLowerCase().includes(search.toLowerCase()));if(sort)rows.sort((a,b)=>a.name.localeCompare(b.name)*(sort.direction==='ascending'?1:-1));return{total:rows.length,rows:rows.slice((page-1)*pageSize,page*pageSize)}};
createRoot(document.getElementById('app')).render(<StrictMode><FloodRoot style={{padding:'2rem'}}><RecordWorkspace storageKey="projects" storage={store} loadPage={loader}/></FloodRoot></StrictMode>);`);
 const result=await build({configFile:false,logLevel:'silent',esbuild:{jsx:'automatic'},define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{write:false,cssCodeSplit:false,lib:{entry,formats:['iife'],name:'Workspace'}}});
 const out=Array.isArray(result)?result[0].output:result.output;
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Projects</title><style>'+out.filter(x=>x.type==='asset'&&x.fileName.endsWith('.css')).map(x=>(x as any).source).join('')+'</style></head><body><main id="app"></main><script>'+out.filter(x=>x.type==='chunk').map(x=>(x as any).code).join('')+'</script></body></html>';
}
async function open(page:Page,raw:string|null=null,query=''){
 bundle??=fixture();await page.route('**/__record-workspace*',async r=>r.fulfill({contentType:'text/html',body:await bundle}));
 await page.addInitScript(raw=>{localStorage.clear();if(raw!==null)localStorage.setItem('projects',raw);},raw);
 await page.goto('/__record-workspace'+query);await expect(page.getByRole('heading',{name:'Projects',exact:true})).toBeVisible();
}
const seeded=JSON.stringify({version:1,records:Array.from({length:8},(_,i)=>({id:'p'+i,name:'Project '+i,owner:'Owner '+i,status:i===7?'archived':'active'}))});
test('missing, malformed and denied reads remain distinct and replacement is explicit',async({page})=>{
 await open(page,'{bad');await expect(page.getByText('Projects could not be read.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'New project',exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>localStorage.getItem('projects'))).toBe('{bad');
 await page.getByRole('button',{name:'Replace collection',exact:true}).click();await page.getByRole('button',{name:'Keep working',exact:true}).click();expect(await page.evaluate(()=>localStorage.getItem('projects'))).toBe('{bad');
 await page.getByRole('button',{name:'Replace collection',exact:true}).click();await page.getByRole('button',{name:'Replace',exact:true}).click();await expect(page.getByRole('heading',{name:'No projects',exact:true})).toBeVisible();
 expect(JSON.parse((await page.evaluate(()=>localStorage.getItem('projects')))!)).toEqual({version:1,records:[]});
 await page.goto('/__record-workspace?denyread');await expect(page.getByText('Projects could not be read.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Export recovery snapshot',exact:true})).toHaveCount(0);
});
test('failed save retains edits until explicit cancel, then reopening uses accepted data',async({page})=>{
 await open(page,seeded);await page.getByRole('row').filter({hasText:'Project 0'}).getByRole('button',{name:'Edit',exact:true}).click();
 const name=page.getByRole('textbox',{name:'Project name',exact:false});await name.fill('Unsaved edit');await page.evaluate(()=>{(window as any).denyWrites(true)});
 await page.getByRole('button',{name:'Save project',exact:true}).click();await expect(page.getByText('Changes could not be saved. Try again.',{exact:true})).toBeVisible();await expect(name).toHaveValue('Unsaved edit');
 await name.fill('Still unsaved');await expect(page.getByText('Changes could not be saved. Try again.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('row').filter({hasText:'Project 0'}).getByRole('button',{name:'Edit',exact:true}).click();await expect(name).toHaveValue('Project 0');await expect(page.getByText('Changes could not be saved. Try again.',{exact:true})).toHaveCount(0);
 await page.evaluate(()=>{(window as any).denyWrites(false)});await name.fill('Accepted edit');await page.getByRole('button',{name:'Save project',exact:true}).click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('projects')!).records[0].name)).toBe('Accepted edit');
});
test('late query, paging, captured selection and stable navigation use one host state',async({page})=>{
 await open(page,seeded);const heading=page.getByRole('heading',{name:'Projects',exact:true});const y=(await heading.boundingBox())!.y;
 const search=page.getByRole('searchbox',{name:'Search projects',exact:true});await search.fill('old');await search.fill('Project 1');await expect(page.getByRole('row').filter({hasText:'Project 1'})).toHaveCount(1);await page.waitForTimeout(150);await expect(page.getByRole('row').filter({hasText:'Project 1'})).toHaveCount(1);
 await page.getByRole('button',{name:'Clear filters',exact:true}).click();await page.getByRole('checkbox',{name:'Select Project 0',exact:true}).check();await page.getByRole('button',{name:'Next page',exact:true}).click();await page.getByRole('checkbox',{name:'Select Project 5',exact:true}).check();
 await page.getByRole('button',{name:'Delete selected',exact:true}).click();await page.getByRole('button',{name:'Delete projects',exact:true}).click();await expect(page.getByRole('button',{name:'Delete selected',exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('projects')!).records.map((r:any)=>r.id))).toEqual(['p1','p2','p3','p4','p6','p7']);
 await page.getByRole('link',{name:'Overview',exact:true}).click();expect((await page.getByRole('heading',{name:'Overview',exact:true}).boundingBox())!.y).toBeCloseTo(y,0);
 await page.getByRole('link',{name:'Projects',exact:true}).click();expect((await heading.boundingBox())!.y).toBeCloseTo(y,0);
 await page.getByRole('button',{name:'New project',exact:true}).click();await page.getByRole('textbox',{name:'Project name',exact:false}).fill('Draft');await page.getByRole('link',{name:'Overview',exact:true}).click();await expect(page.getByRole('alertdialog',{name:'Discard changes?',exact:true})).toBeVisible();await page.getByRole('button',{name:'Keep working',exact:true}).click();await expect(page.getByRole('textbox',{name:'Project name',exact:false})).toHaveValue('Draft');
});
test('shared header and editor remain reachable with enlarged text',async({page})=>{
 await page.setViewportSize({width:1280,height:1000});await open(page,seeded);await page.evaluate(()=>{document.documentElement.style.fontSize='24px'});await page.getByRole('button',{name:'New project',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'Project name',exact:false})).toBeVisible();await page.getByRole('button',{name:'Save project',exact:true}).scrollIntoViewIfNeeded();await expect(page.getByRole('button',{name:'Save project',exact:true})).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(1281);
});
