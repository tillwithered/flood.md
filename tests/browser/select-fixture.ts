import { build } from "vite";
import { resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { expect, type Page } from "@playwright/test";

let bundled: Promise<string> | undefined;

async function fixtureHtml(): Promise<string> {
  const file = (path: string) => JSON.stringify(resolve(path).replaceAll("\\", "/"));
  const source = `
import React,{useRef,useState}from ${file("node_modules/react/index.js")};
import{createRoot}from ${file("node_modules/react-dom/client.js")};
import{FloodRoot,Stack,Field,Select,Button,Checkbox}from ${file("packages/react/dist/index.js")};
import ${file("packages/react/dist/styles.css")};
const h=React.createElement;
function Fixture(){
 const form=useRef(null), native=useRef(null);
 const[prevent,setPrevent]=useState(false),[status,setStatus]=useState(''),[rejected,setRejected]=useState('');
 const choices=[h('option',{value:'',disabled:true,key:'placeholder'},'Choose a region'),
  h('optgroup',{label:'Unavailable regions',disabled:true,key:'disabled'},h('option',{value:'blocked'},'Blocked region')),
  h('optgroup',{label:'Available regions',key:'available'},...['Alpha','Alpine','Beta'].map(label=>h('option',{value:label.toLowerCase(),key:label},label))),
  ...Array.from({length:30},(_,index)=>h('option',{value:'option-'+(index+1),key:index},'Option '+String(index+1).padStart(2,'0')))];
 return h(FloodRoot,{style:{minHeight:'100vh',padding:'1rem'}},h('h1',null,'Select contract fixture'),
  h('div',{id:'positioning-box',style:{maxWidth:'24rem'}},
   h('form',{ref:form,onReset:event=>{if(prevent)event.preventDefault()},onSubmit:event=>{event.preventDefault();setStatus(JSON.stringify(Object.fromEntries(new FormData(form.current))))}},
    h(Stack,{gap:'4'},
     h(Field,{id:'contract-region',label:'Region',required:true,hint:'Choose one available region'},props=>h(Select,{...props,ref:native,name:'region',defaultValue:''},...choices)),
     h(Button,{type:'button',onClick:()=>{native.current.focus();setStatus(native.current.tagName)}},'Focus forwarded ref'),
     h(Button,{type:'submit'},'Submit selection'),h(Button,{type:'reset'},'Reset selection'),
     h(Checkbox,{label:'Prevent reset',checked:prevent,onChange:event=>setPrevent(event.currentTarget.checked)}),
     h('output',{'aria-label':'Form result'},status)))),
  h('div',{id:'short-positioning-box'},h(Field,{label:'Locked choice'},props=>h(Select,{...props,value:'alpha',dir:'rtl',tabIndex:3,'data-contract':'forwarded',onChange:event=>setRejected(event.currentTarget.value)},h('option',{value:'alpha'},'Alpha'),h('option',{value:'beta'},'Beta')))),
  h('output',{'aria-label':'Rejected change'},rejected));
}createRoot(document.getElementById('app')).render(h(Fixture));`;
  const entry = resolve(`.artifacts/select-contract-${process.pid}/entry.mjs`);
  await mkdir(resolve(`.artifacts/select-contract-${process.pid}`), { recursive: true });
  await writeFile(entry, source);
  const result = await build({
    configFile: false, root: process.cwd(), logLevel: "silent",
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: { write: false, minify: true, cssCodeSplit: false, lib: { entry, formats: ["iife"], name: "SelectContractFixture" } },
  });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(item => "output" in item ? item.output : []);
  const script = outputs.filter(item => item.type === "chunk").map(item => item.type === "chunk" ? item.code : "").join("\n");
  const css = outputs.filter(item => item.type === "asset" && item.fileName.endsWith(".css")).map(item => item.type === "asset" ? String(item.source) : "").join("\n");
  if (!script || !css) throw new Error("Select contract fixture did not bundle actual JS/CSS");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Select contract</title><style>body{margin:0}${css}</style></head><body><main id="app"></main><script>${script.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
}

export async function openSelectFixture(page: Page) {
  bundled ??= fixtureHtml();
  const html = await bundled;
  await page.route("**/__flood-select-contract.html", route => route.fulfill({ contentType: "text/html", body: html }));
  await page.goto("/__flood-select-contract.html");
  await expect(page.getByRole("heading", { name: "Select contract fixture" })).toBeVisible();
}
