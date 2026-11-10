import {forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState} from "react";
import {Button, Menu, type MenubarProps} from "./index.js";
import {tabbables} from "./overlay-runtime.js";
const useBrowserLayoutEffect=typeof window==="undefined"?useEffect:useLayoutEffect;

export const ApplicationMenubar=/* @__PURE__ */ forwardRef<HTMLDivElement,MenubarProps>(function ApplicationMenubar({
  label,menus,openValue,defaultOpenValue=null,onOpenValueChange,onAction,controlSize="sm",disabled=false,className,onKeyDown,onKeyDownCapture,...props
},ref){
  if(!label.trim()||menus.some(menu=>!menu.id.trim()||!menu.label.trim())||new Set(menus.map(menu=>menu.id)).size!==menus.length)throw new Error("Flood Menubar requires unique named menus");
  const root=useRef<HTMLDivElement>(null);useImperativeHandle(ref,()=>root.current!,[]);
  const [local,setLocal]=useState(defaultOpenValue),[active,setActive]=useState<string>();
  const requested=openValue===undefined?local:openValue;
  const enabled=menus.filter(menu=>!disabled&&!menu.disabled),open=enabled.some(menu=>menu.id===requested)?requested:null;
  const current=useRef(open);current.current=open;
  const activeId=enabled.some(menu=>menu.id===active)?active:enabled[0]?.id;
  const request=(next:string|null)=>{if(openValue===undefined)setLocal(next);onOpenValueChange?.(next);};
  const trigger=(id:string)=>[...root.current?.querySelectorAll<HTMLButtonElement>('[data-menubar-trigger]')??[]].find(node=>node.dataset.menubarTrigger===id);
  const move=(id:string,delta:number)=>{
    const at=enabled.findIndex(menu=>menu.id===id),next=enabled[(at+delta+enabled.length)%enabled.length];if(!next)return;
    setActive(next.id);if(open)request(next.id);else trigger(next.id)?.focus({preventScroll:true});
  };
  useBrowserLayoutEffect(()=>{if(open)setActive(open);},[open]);
  useEffect(()=>{if(requested&&!open)request(null);},[requested,open]);
  return <div {...props} ref={root} role="menubar" aria-label={label} aria-orientation="horizontal" aria-disabled={disabled||undefined}
    tabIndex={enabled.length?undefined:0} className={["flood-menubar",className].filter(Boolean).join(" ")}
    onKeyDownCapture={event=>{
      onKeyDownCapture?.(event);
      if(event.defaultPrevented||event.key!=="Tab"||event.altKey||event.ctrlKey||event.metaKey||!open)return;
      // Capture also sees nested menus; their ordinary Menu Tab contract returns
      // to its trigger, while an application menubar exits the whole bar.
      const anchor=trigger(open),scope=anchor?.closest('dialog[open]')??anchor?.ownerDocument.body;
      if(anchor&&scope){const stops=tabbables(scope as HTMLElement),at=stops.indexOf(anchor);
        const next=event.shiftKey?stops.slice(0,at).reverse().find(node=>!root.current?.contains(node)):stops.slice(at+1).find(node=>!root.current?.contains(node));
        if(next){event.preventDefault();event.stopPropagation();next.focus();request(null);}}
    }}
    onKeyDown={event=>{
      onKeyDown?.(event);if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.nativeEvent.isComposing)return;
      const source=(event.target as HTMLElement).closest<HTMLElement>('[data-menubar-trigger]');if(!source)return;
      const id=source.dataset.menubarTrigger!,rtl=getComputedStyle(event.currentTarget).direction==="rtl";
      if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();move(id,event.key===(rtl?"ArrowLeft":"ArrowRight")?1:-1);}
      else if(event.key==="Home"||event.key==="End"){event.preventDefault();const next=event.key==="Home"?enabled[0]:enabled.at(-1);if(next){setActive(next.id);trigger(next.id)?.focus();}}
    }}>
    {menus.map(menu=><Menu key={menu.id} label={menu.label} items={menu.items} open={open===menu.id} disabled={disabled||menu.disabled} controlSize={controlSize}
      onOpenChange={next=>{if(next)request(menu.id);else if(current.current===menu.id)request(null);}}
      onAction={id=>onAction?.(menu.id,id)}
      onKeyDown={event=>{
        if(event.altKey||event.ctrlKey||event.metaKey||event.nativeEvent.isComposing)return;
        const rtl=getComputedStyle(root.current!).direction==="rtl",forward=event.key===(rtl?"ArrowLeft":"ArrowRight");
        if((forward||(event.key===(rtl?"ArrowRight":"ArrowLeft"))) && !(forward&&(event.target as HTMLElement).closest('[aria-haspopup="menu"]'))){event.preventDefault();event.stopPropagation();move(menu.id,forward?1:-1);}
      }}
      trigger={binding=><Button {...binding} role="menuitem" data-menubar-trigger={menu.id} tabIndex={menu.id===activeId?0:-1} variant="ghost" size={controlSize}
        onFocus={()=>setActive(menu.id)} onPointerEnter={()=>{if(open&&open!==menu.id&&!disabled&&!menu.disabled)request(menu.id);}}>{menu.label}</Button>}/>) }
  </div>;
});
