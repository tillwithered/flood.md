import {forwardRef,useEffect,useId,useImperativeHandle,useLayoutEffect,useRef,useState,type ReactNode} from "react";
import type {TabsProps,BreadcrumbProps,PaginationProps} from "./index.js";
import {OverlayScrollArea} from "./scroll-area.js";
import {pageWindow} from "./page-window.js";
const useBrowserLayoutEffect=typeof window==="undefined"?useEffect:useLayoutEffect;

export const TabNavigation=forwardRef<HTMLDivElement,TabsProps>(function TabNavigation({label,items,value,defaultValue,onValueChange,activationMode="automatic",orientation="horizontal",controlSize="md",disabled=false,iconOnly=false,className,onKeyDown,id:explicitId,...props},ref){
  const generated=useId(),id=explicitId??`flood-tabs-${generated}`;
  const [local,setLocal]=useState(defaultValue),[focused,setFocused]=useState<string>();
  const root=useRef<HTMLDivElement>(null),list=useRef<HTMLDivElement>(null),focusedPanel=useRef<string|undefined>(undefined);
  useImperativeHandle(ref,()=>root.current!,[]);
  if(new Set(items.map(item=>item.value)).size!==items.length)throw new Error("Flood tab values must be unique");
  if(iconOnly&&items.some(item=>!item.icon))throw new Error("Flood icon-only tabs require icons");
  const available=items.filter(item=>!item.disabled),enabled=disabled?[]:available;
  const selected=available.find(item=>item.value===(value??local))?.value??available[0]?.value;
  const tabStop=enabled.some(item=>item.value===focused)?focused:selected;
  const select=(next:string)=>{if(next===selected)return;if(value===undefined)setLocal(next);onValueChange?.(next);};
  useBrowserLayoutEffect(()=>{
    if(focusedPanel.current===undefined||focusedPanel.current===selected)return;
    const index=items.findIndex(item=>item.value===focusedPanel.current),panel=root.current?.ownerDocument.getElementById(`${id}-panel-${index}`);
    const active=root.current?.ownerDocument.activeElement;
    if(active===root.current?.ownerDocument.body||panel?.contains(active??null)){
      const next=items.findIndex(item=>item.value===selected);root.current?.ownerDocument.getElementById(`${id}-tab-${next}`)?.focus();
    }
    focusedPanel.current=undefined;
  },[selected,id,items]);
  return <div {...props} ref={root} id={id} className={["flood-tabs",className].filter(Boolean).join(" ")} data-orientation={orientation} onKeyDown={event=>{
    onKeyDown?.(event);if(event.defaultPrevented)return;
    const buttons=Array.from(list.current?.querySelectorAll<HTMLButtonElement>(':scope > button[role="tab"]:not(:disabled)')??[]),index=buttons.indexOf(event.target as HTMLButtonElement);
    if(index<0)return;const rtl=getComputedStyle(event.currentTarget).direction==="rtl";
    const nextKey=orientation==="vertical"?"ArrowDown":rtl?"ArrowLeft":"ArrowRight",previousKey=orientation==="vertical"?"ArrowUp":rtl?"ArrowRight":"ArrowLeft";
    const next=event.key==="Home"?0:event.key==="End"?buttons.length-1:event.key===nextKey?(index+1)%buttons.length:event.key===previousKey?(index-1+buttons.length)%buttons.length:-1;
    if(next>=0){event.preventDefault();buttons[next].focus();if(activationMode==="automatic")select(buttons[next].dataset.value!);}
  }}>
    <OverlayScrollArea orientation={orientation} tabIndex={-1} className="flood-tabs__scroll">
      <div ref={list} role="tablist" aria-label={label} aria-orientation={orientation} className="flood-tabs__list" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setFocused(undefined)}}>
        {items.map((item,index)=><button key={item.value} id={`${id}-tab-${index}`} type="button" role="tab" aria-selected={item.value===selected} aria-controls={`${id}-panel-${index}`} data-value={item.value}
          disabled={disabled||item.disabled} tabIndex={item.value===tabStop?0:-1} aria-label={iconOnly?item.label:undefined} className={`flood-button flood-button--ghost flood-button--${controlSize} flood-tab${iconOnly?" flood-icon-button":""}`} onFocus={()=>setFocused(item.value)} onClick={()=>select(item.value)}>
          {item.icon&&<span className={`flood-icon flood-icon--${controlSize}`} aria-hidden="true">{item.icon}</span>}{!iconOnly&&item.label}
        </button>)}
      </div>
    </OverlayScrollArea>
    {items.map((item,index)=><div key={item.value} id={`${id}-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} tabIndex={0} hidden={item.value!==selected} className="flood-tabs__panel"
      onFocusCapture={()=>{focusedPanel.current=item.value}} onBlurCapture={event=>{if(!event.currentTarget.hidden)focusedPanel.current=undefined}}>{item.content}</div>)}
  </div>;
});

export const BreadcrumbNavigation=forwardRef<HTMLElement,BreadcrumbProps>(function BreadcrumbNavigation({items,label="Breadcrumb",separator="/",className,...props},ref){
  return <nav {...props} ref={ref} aria-label={label} className={["flood-breadcrumb",className].filter(Boolean).join(" ")}><ol>
    {items.map((item,index)=><li key={index}>{index>0&&<span className="flood-breadcrumb__separator" aria-hidden="true">{separator}</span>}
      {item.href!==undefined?<a className="flood-link" href={item.href} aria-current={index===items.length-1?"page":undefined}>{item.label}</a>:<span aria-current={index===items.length-1?"page":undefined}>{item.label}</span>}
    </li>)}
  </ol></nav>;
});

export const PageNavigation=forwardRef<HTMLElement,PaginationProps>(function PageNavigation({page,pageCount,onPageChange,getHref,siblingCount=1,controlSize="sm",disabled=false,label="Pagination",previousLabel="Previous page",nextLabel="Next page",pageLabel=page=>`Page ${page}`,className,...props},ref){
  const pages=pageWindow(page,pageCount,siblingCount);
  const control=(target:number,text:ReactNode,name:string,unavailable=false)=>{
    const inactive=disabled||unavailable,current=target===page;
    const shared={className:`flood-button flood-button--subtle flood-button--${controlSize} flood-page`,"aria-label":name,"aria-current":current&&!unavailable?"page" as const:undefined};
    if(getHref)return inactive?<span {...shared} role="link" aria-disabled="true">{text}</span>:<a {...shared} href={getHref(target)} onClick={event=>{if(!event.defaultPrevented&&event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&!current)onPageChange?.(target)}}>{text}</a>;
    return <button {...shared} type="button" disabled={inactive} onClick={()=>{if(!current)onPageChange?.(target)}}>{text}</button>;
  };
  const arrow=(previous:boolean)=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={previous?"m15 5-7 7 7 7":"m9 5 7 7-7 7"}/></svg>;
  return <nav {...props} ref={ref} aria-label={label} className={["flood-pagination",className].filter(Boolean).join(" ")}><ul>
    <li>{control(page-1,arrow(true),previousLabel,page===1)}</li>
    {pages.map(item=><li key={item} aria-hidden={typeof item==="string"?true:undefined}>{typeof item==="number"?control(item,String(item),pageLabel(item)):<span className="flood-page-gap">…</span>}</li>)}
    <li>{control(page+1,arrow(false),nextLabel,page===pageCount)}</li>
  </ul></nav>;
});
