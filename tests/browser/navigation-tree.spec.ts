import {test,expect,type Page} from '@playwright/test';
import {build} from 'vite';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
let bundle:Promise<string>;
async function fixture(){
 const file=(path:string)=>JSON.stringify(resolve(path).replaceAll('\\','/'));
 const dir=resolve(`.artifacts/navigation-tree-${process.pid}`),entry=resolve(dir,'entry.mjs');await mkdir(dir,{recursive:true});
 await writeFile(entry,`import React,{useState,StrictMode}from ${file('node_modules/react/index.js')};import{createRoot}from ${file('node_modules/react-dom/client.js')};import{FloodRoot,NavigationTree,Button}from ${file('packages/react/dist/index.js')};import ${file('packages/react/dist/styles.css')};const h=React.createElement;
function App(){const[expanded,E]=useState(['guides']),[freeze,F]=useState(false),[removed,R]=useState(false),[moved,M]=useState(false),[events,V]=useState('');const items=[{value:'home',label:'Home',href:'#home'},{value:'guides',label:'Guides',href:'#guides',children:removed?[]:[...(!moved?[{value:'install',label:'Installation',href:'#install'}]:[]),{value:'advanced',label:'Advanced',children:[{value:'deploy',label:'Deployment with a long wrapping label',href:'#deploy'}]}]},{value:'resources',label:'Resources',children:moved?[{value:'install',label:'Installation',href:'#install'}]:[]},{value:'disabled',label:'Unavailable',href:'#disabled',disabled:true,children:[{value:'hidden',label:'Hidden',href:'#hidden'}]},{value:'loading',label:'Extensions',content:h('span',{role:'status'},'Loading extensionsвЂ¦')},{value:'external',label:'External',href:'#external',linkProps:{target:'_blank',rel:'noreferrer',onClick:event=>V(event.ctrlKey?'modified':'plain')}}];return h(FloodRoot,{style:{maxWidth:'28rem',padding:'1rem'}},h('h1',null,'Navigation checks'),h('input',{'aria-label':'Outside'}),h(NavigationTree,{label:'Docs navigation',items,currentValue:'install',defaultExpandedValues:['guides','resources']}),h('label',null,h('input',{type:'checkbox',checked:freeze,onChange:event=>F(event.target.checked)}),'Refuse changes'),h(NavigationTree,{label:'Controlled navigation',items,expandedValues:expanded,onExpandedValuesChange:values=>{V(values.join(','));if(!freeze)E(values)}}),h(Button,{onClick:()=>E([])},'Collapse externally'),h(Button,{onClick:()=>R(true)},'Remove descendants'),h(Button,{onClick:()=>M(true)},'Move descendant'),h('output',{'aria-label':'Events'},events),h('div',{id:'install'},'Destination'));}createRoot(document.getElementById('app')).render(h(StrictMode,null,h(App)));`);
 const result=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{write:false,cssCodeSplit:false,lib:{entry,formats:['iife'],name:'NavigationFixture'}}});const output=Array.isArray(result)?result[0].output:result.output;
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Navigation tree</title><style>'+output.filter(x=>x.type==='asset'&&x.fileName.endsWith('.css')).map(x=>(x as any).source).join('')+'</style></head><body><main id="app"></main><script>'+output.filter(x=>x.type==='chunk').map(x=>(x as any).code).join('')+'</script></body></html>';
}
async function open(page:Page){bundle??=fixture();await page.route('**/__navigation-tree.html',async route=>route.fulfill({contentType:'text/html',body:await bundle}));await page.goto('/__navigation-tree.html');await expect(page.getByRole('heading',{name:'Navigation checks'})).toBeVisible();}
const nav=(page:Page,name='Docs navigation')=>page.getByRole('navigation',{name,exact:true});

test('navigation hierarchy retains native lists, links, current page and separate disclosure controls',async({page,browserName})=>{
 await open(page);const root=nav(page);await expect(root.getByRole('tree')).toHaveCount(0);await expect(root.getByRole('list')).toHaveCount(2);await expect(root.getByRole('link',{name:'Installation',exact:true})).toHaveAttribute('aria-current','page');
 const guides=root.getByRole('button',{name:'Collapse Guides',exact:true});await expect(guides).toHaveAttribute('aria-expanded','true');await root.getByRole('link',{name:'Guides',exact:true}).click();await expect(guides).toHaveAttribute('aria-expanded','true');await guides.focus();await page.keyboard.press('Enter');await expect(root.getByRole('link',{name:'Installation',exact:true})).toHaveCount(0);await expect(root.getByRole('button',{name:'Expand Guides',exact:true})).toBeFocused();
 await page.keyboard.press('Space');await expect(root.getByRole('link',{name:'Installation',exact:true})).toBeVisible();
 const destination=root.getByRole('link',{name:'Installation',exact:true});
 // The Windows WebKit baseline skips ordinary anchors for both Tab and Alt+Tab.
 // Exercise actual link activation explicitly there; preserve native Tab coverage elsewhere.
 if(browserName==='webkit')await destination.focus();else await page.keyboard.press('Tab');
 await expect(destination).toBeFocused();await destination.press('Enter');await expect(page).toHaveURL(/#install$/);
});

test('disabled navigation omits anchors and expansion, while host loading content is explicit',async({page})=>{
 await open(page);const root=nav(page);await expect(root.getByRole('link',{name:'Unavailable',exact:true})).toHaveCount(0);await expect(root.locator('.flood-navigation-tree__text').filter({hasText:'Unavailable'})).toHaveAttribute('aria-disabled','true');await expect(root.getByRole('button',{name:'Expand Unavailable',exact:true})).toBeDisabled();await expect(root.getByRole('link',{name:'Hidden',exact:true})).toHaveCount(0);
 await root.getByRole('button',{name:'Expand Extensions',exact:true}).click();await expect(root.getByRole('status')).toHaveText('Loading extensionsвЂ¦');
});

test('controlled expansion honors refusal and external collapse restores a focused descendant to its disclosure',async({page})=>{
 await open(page);const root=nav(page,'Controlled navigation');await page.getByRole('checkbox',{name:'Refuse changes',exact:true}).check();await root.getByRole('button',{name:'Collapse Guides',exact:true}).click();await expect(root.getByRole('link',{name:'Installation',exact:true})).toBeVisible();await page.getByRole('checkbox',{name:'Refuse changes',exact:true}).uncheck();
 await root.getByRole('link',{name:'Installation',exact:true}).focus();await page.getByRole('button',{name:'Collapse externally',exact:true}).evaluate(node=>node.click());await expect(root.getByRole('button',{name:'Expand Guides',exact:true})).toBeFocused();await expect(root.getByRole('link',{name:'Installation',exact:true})).toHaveCount(0);
});

test('removing a focused branch descendant repairs to its surviving ancestor without stealing outside focus',async({page})=>{
 await open(page);const root=nav(page);await root.getByRole('link',{name:'Installation',exact:true}).focus();await page.getByRole('button',{name:'Remove descendants',exact:true}).evaluate(node=>node.click());await expect(root.getByRole('button',{name:'Collapse Guides',exact:true})).toBeFocused();
 await page.getByRole('textbox',{name:'Outside',exact:true}).focus();await page.getByRole('button',{name:'Collapse externally',exact:true}).evaluate(node=>node.click());await expect(page.getByRole('textbox',{name:'Outside',exact:true})).toBeFocused();
});

test('link targets, modifiers and host handlers retain native browser ownership',async({page})=>{
 await open(page);const link=nav(page).getByRole('link',{name:'External',exact:true});await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAttribute('rel','noreferrer');const result=await link.evaluate(node=>{const event=new MouseEvent('click',{bubbles:true,cancelable:true,ctrlKey:true});node.dispatchEvent(event);return event.defaultPrevented;});expect(result).toBe(false);await expect(page.getByRole('status',{name:'Events'})).toHaveText('modified');
});

test('a reparented stable value repairs focus through its latest ancestor when collapsed',async({page})=>{
 await open(page);const root=nav(page);await page.getByRole('button',{name:'Move descendant',exact:true}).evaluate(node=>node.click());await root.getByRole('link',{name:'Installation',exact:true}).focus();await root.getByRole('button',{name:'Collapse Resources',exact:true}).evaluate(node=>node.click());await expect(root.getByRole('button',{name:'Expand Resources',exact:true})).toBeFocused();await expect(root.getByRole('button',{name:'Collapse Guides',exact:true})).not.toBeFocused();
});

test('narrow enlarged RTL hierarchy wraps labels, reverses indentation and passes accessibility checks',async({page})=>{
 await page.setViewportSize({width:360,height:900});await open(page);await page.evaluate(()=>{document.documentElement.dir='rtl';document.documentElement.style.fontSize='24px';});const root=nav(page);await root.getByRole('button',{name:'Expand Advanced',exact:true}).click();const parent=(await root.getByRole('button',{name:'Collapse Advanced',exact:true}).locator('..').boundingBox())!,child=(await root.getByRole('link',{name:'Deployment with a long wrapping label',exact:true}).boundingBox())!;expect(child.x+child.width).toBeLessThan(parent.x+parent.width);expect(child.x).toBeGreaterThanOrEqual(0);expect(child.x+child.width).toBeLessThanOrEqual(360);expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});

test('navigation values, labels and recursive arrays are validated during rendering',async()=>{
 const React=await import('react');const{renderToString}=await import('react-dom/server');const{NavigationTree}=await import('../../packages/react/dist/index.js');const render=(items:any)=>renderToString(React.createElement(NavigationTree,{label:'Docs',items}));expect(()=>render([{value:'same',label:'Root'},{value:'branch',label:'Branch',children:[{value:'same',label:'Duplicate'}]}])).toThrow(/unique/);expect(()=>render([{value:'empty',label:' '}])).toThrow(/nonempty/);const cycle:any[]=[];cycle.push({value:'cycle',label:'Cycle',children:cycle});expect(()=>render(cycle)).toThrow(/recursive/);
});
