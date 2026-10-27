import {forwardRef, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState} from "react";
import type {TooltipProps,PopoverProps,DialogProps,OverlayTriggerProps} from "./index.js";
import {IconButton,ScrollArea,VisuallyHidden} from "./index.js";
import {positionLayer,registerLayer,returnFocus,lockScroll,tabbables} from "./overlay-runtime.js";
import {mergeDescriptions} from "./field-state.js";
const useBrowserLayoutEffect=typeof window==="undefined"?useEffect:useLayoutEffect;
function useCurrent<T>(value:T){const ref=useRef(value);useBrowserLayoutEffect(()=>{ref.current=value});return ref;}
function focusContent(panel:HTMLElement,preferred?:HTMLElement|null){
  const available=(node:HTMLElement|null|undefined):node is HTMLElement=>Boolean(node?.isConnected&&panel.contains(node)&&!node.matches(":disabled")&&!node.closest("[hidden],[inert]")&&node.getClientRects().length&&getComputedStyle(node).visibility!=="hidden");
  const candidates=[preferred,...panel.querySelectorAll<HTMLElement>('[autofocus],[data-flood-autofocus]'),...tabbables(panel.querySelector<HTMLElement>(".flood-overlay-body")??panel),...tabbables(panel),panel];
  for(const target of candidates){
    if(!available(target))continue;
    const previous=panel.ownerDocument.activeElement;
    target.focus({preventScroll:true});
    // A host focus handler may intentionally redirect focus elsewhere.
    if(panel.ownerDocument.activeElement===target||panel.ownerDocument.activeElement!==previous)return;
  }
}
function OverlayClose({label,onClick}:{label:string;onClick:()=>void}){
  return <IconButton label={label} size="sm" variant="subtle" className="flood-overlay-close" onClick={onClick}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="m4 4 16 16M20 4 4 20" /></svg>
  </IconButton>;
}

type AnchoredProps=(TooltipProps|PopoverProps)&{kind:"tooltip"|"popover"};
export const AnchoredOverlay=/* @__PURE__ */ forwardRef<HTMLDivElement,AnchoredProps>(function AnchoredOverlay(allProps,forwardedRef){
  const {kind,trigger,side="bottom",align="start",disabled=false,id:explicitId,className,style,...native}=allProps;
  const pop=allProps as PopoverProps,tip=allProps as TooltipProps;
  const [local,setLocal]=useState(kind==="popover"?Boolean(pop.defaultOpen):false);
  const open=kind==="tooltip"?local:pop.open??local;
  const anchor=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null),generated=useId();
  const id=explicitId??`flood-overlay-${generated}`,setAnchor=useCallback((node:HTMLButtonElement|null)=>{anchor.current=node},[]);
  const hovered=useRef(false),overPanel=useRef(false),focused=useRef(false),suppressed=useRef(false);
  const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const clear=()=>{clearTimeout(timer.current);timer.current=undefined;};
  const request=(next:boolean)=>{if(kind==="tooltip"||pop.open===undefined)setLocal(next);if(kind==="popover")pop.onOpenChange?.(next);};
  const close=()=>{clear();if(kind==="tooltip"){suppressed.current=true;overPanel.current=false;}request(false);};
  const current=useCurrent({close,request,disabled,open,initialFocusRef:pop.initialFocusRef,positionReference:pop.positionReference});
  const positionReference=()=>{const node=current.current.positionReference?.current;return node?.isConnected&&node.ownerDocument===panel.current?.ownerDocument?node:anchor.current;};
  useImperativeHandle(forwardedRef,()=>panel.current!,[]);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  useEffect(()=>{if(kind==="tooltip"&&disabled){clear();setLocal(false)}},[disabled,kind]);
  const leave=()=>{clear();if(!hovered.current&&!overPanel.current&&!focused.current){suppressed.current=false;timer.current=setTimeout(()=>request(false),120)}};
  const enter=(immediate=false)=>{clear();if(disabled||suppressed.current)return;if(immediate)setLocal(true);else timer.current=setTimeout(()=>setLocal(true),Number.isFinite(tip.delay)?Math.max(0,tip.delay??300):300);};
  useBrowserLayoutEffect(()=>{
    if(!open||!panel.current)return;
    const element=panel.current,document=element.ownerDocument,view=document.defaultView!;
    let alive=true,unregister=()=>{},frame=0;
    const start=()=>{
      if(!alive||!anchor.current?.isConnected)return;
      const parent=anchor.current.closest("dialog");if(parent&&!parent.open){frame=view.requestAnimationFrame(start);return;}
      if(typeof element.showPopover!=="function")throw new Error("Flood overlays require the native Popover API");
      element.style.visibility="hidden";element.showPopover();positionLayer(positionReference()!,element,side,align);
      unregister=registerLayer(document,{panel:element,anchor:()=>anchor.current,close:()=>current.current.close(),tooltip:kind==="tooltip"});
      if(kind==="popover")focusContent(element,current.current.initialFocusRef?.current);
      const update=()=>{if(!alive)return;if(anchor.current?.isConnected)positionLayer(positionReference()!,element,side,align);frame=view.requestAnimationFrame(update)};
      frame=view.requestAnimationFrame(update);
    };
    start();
    const toggle=(event:Event)=>{
      if(!alive||(event as ToggleEvent).newState!=="closed"||element.matches(":popover-open")||!current.current.open)return;
      current.current.request(false);
      queueMicrotask(()=>{if(alive&&current.current.open&&element.isConnected&&!element.matches(":popover-open")&&anchor.current?.isConnected){element.showPopover();positionLayer(positionReference()!,element,side,align);if(kind==="popover")focusContent(element,current.current.initialFocusRef?.current)}});
    };
    element.addEventListener("toggle",toggle);
    return ()=>{alive=false;view.cancelAnimationFrame(frame);unregister();element.removeEventListener("toggle",toggle);if(kind==="popover")returnFocus(element,anchor.current);if(element.matches(":popover-open"))element.hidePopover();};
  },[open,side,align,kind]);

  const triggerProps:OverlayTriggerProps={ref:setAnchor,type:"button",...(kind==="tooltip"?{
    "aria-describedby":disabled?undefined:id,
    onPointerEnter:event=>{if(event.pointerType==="touch")return;hovered.current=true;enter();},
    onPointerLeave:()=>{hovered.current=false;leave();},onFocus:()=>{focused.current=true;enter(true)},onBlur:()=>{focused.current=false;leave()},
  }:{disabled,"aria-haspopup":"dialog","aria-expanded":open,"aria-controls":id,onClick:()=>request(!open)})};
  // Remove component-only props before forwarding native div attributes.
  const {title:unusedTitle,chrome:unusedChrome,content:unusedContent,children:unusedChildren,open:unusedOpen,defaultOpen:unusedDefault,onOpenChange:unusedChange,delay:unusedDelay,closeLabel:unusedClose,initialFocusRef:unusedFocus,positionReference:unusedPosition,...attributes}=native as Partial<PopoverProps&TooltipProps>;
  return <>{trigger(triggerProps)}<div {...attributes} ref={panel} id={id} popover="manual" role={kind==="tooltip"?"tooltip":"dialog"} aria-labelledby={kind==="popover"?`${id}-title`:undefined}
    tabIndex={kind==="popover"?-1:undefined} data-chrome={kind==="popover"?pop.chrome:undefined} className={["flood-overlay-panel",kind==="tooltip"?"flood-tooltip":"flood-popover",className].filter(Boolean).join(" ")} style={style}
    onPointerEnter={event=>{attributes.onPointerEnter?.(event);if(kind==="tooltip"){overPanel.current=true;clear()}}} onPointerLeave={event=>{attributes.onPointerLeave?.(event);if(kind==="tooltip"){overPanel.current=false;leave()}}}>
    {kind==="tooltip"?tip.content:<>{pop.chrome==="minimal"?<VisuallyHidden><h2 id={`${id}-title`}>{pop.title}</h2></VisuallyHidden>:<div className="flood-overlay-header"><h2 id={`${id}-title`} className="flood-overlay-title">{pop.title}</h2><OverlayClose label={pop.closeLabel??"Close"} onClick={close} /></div>}{open&&<div className="flood-overlay-body">{pop.children}</div>}</>}
  </div></>;
});

interface ModalOverlayProps extends DialogProps { showCloseButton?: boolean; role?: "dialog" | "alertdialog"; scrollBody?: boolean; footer?: import("react").ReactNode; }
export const ModalOverlay=/* @__PURE__ */ forwardRef<HTMLDialogElement,ModalOverlayProps>(function ModalOverlay({showCloseButton=true,scrollBody=false,footer,title,description,trigger,children,open:controlled,defaultOpen=false,onOpenChange,disabled=false,closeLabel="Close",closeOnOutsideClick=true,initialFocusRef,id:explicitId,className,onKeyDown,"aria-describedby":describedBy,...props},forwardedRef){
  const [local,setLocal]=useState(defaultOpen),open=controlled??local;
  const dialog=useRef<HTMLDialogElement>(null),anchor=useRef<HTMLButtonElement>(null),generated=useId(),id=explicitId??`flood-dialog-${generated}`;
  const request=(next:boolean)=>{if(controlled===undefined)setLocal(next);onOpenChange?.(next);};
  const current=useCurrent({open,request,closeOnOutsideClick,initialFocusRef});
  const setAnchor=useCallback((node:HTMLButtonElement|null)=>{anchor.current=node},[]);
  useImperativeHandle(forwardedRef,()=>dialog.current!,[]);
  useBrowserLayoutEffect(()=>{
    if(!open||!dialog.current)return;const element=dialog.current,document=element.ownerDocument;
    const view=document.defaultView!;let alive=true,frame=0,dispose=()=>{};
    const start=()=>{
    if(!alive)return;
    const parent=element.parentElement?.closest("dialog");if(parent&&!parent.open){frame=view.requestAnimationFrame(start);return;}
    if(typeof element.showModal!=="function")throw new Error("Flood Dialog requires native showModal");
    const previous=document.activeElement as HTMLElement|null;
    if(scrollBody)element.dataset.drawerDirection=getComputedStyle(element).direction;
    element.showModal();const unlock=lockScroll(document);
    const unregister=registerLayer(document,{panel:element,anchor:()=>anchor.current,modal:true,close:()=>current.current.request(false),outside:()=>{if(current.current.closeOnOutsideClick)current.current.request(false)}});
    // Escape always closes, even when outside dismissal is disabled.
    const cancel=(event:Event)=>{event.preventDefault();current.current.request(false)};
    const closed=()=>{if(element.open||!current.current.open)return;current.current.request(false);queueMicrotask(()=>{if(current.current.open&&element.isConnected&&!element.open){element.showModal();focusContent(element,current.current.initialFocusRef?.current)}})};
    element.addEventListener("cancel",cancel);element.addEventListener("close",closed);
    focusContent(element,current.current.initialFocusRef?.current);
    dispose=()=>{unregister();unlock();element.removeEventListener("cancel",cancel);element.removeEventListener("close",closed);if(element.open)element.close();returnFocus(element,anchor.current??previous);};
    };start();return()=>{alive=false;view.cancelAnimationFrame(frame);dispose()};
  },[open]);
  return <>{trigger({ref:setAnchor,type:"button",disabled,"aria-haspopup":"dialog","aria-expanded":open,"aria-controls":id,onClick:()=>request(true)})}<dialog {...props} ref={dialog} id={id} aria-modal="true" aria-labelledby={`${id}-title`}
    aria-describedby={mergeDescriptions(describedBy,Boolean(description)&&`${id}-description`)} className={["flood-dialog",className].filter(Boolean).join(" ")} onKeyDown={event=>{
      onKeyDown?.(event);if(event.defaultPrevented||event.key!=="Tab")return;
      const items=tabbables(event.currentTarget),first=items[0],last=items.at(-1),active=event.currentTarget.ownerDocument.activeElement;
      if(!first){event.preventDefault();return;}
      if(event.shiftKey&&(active===first||!items.includes(active as HTMLElement))){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&(active===last||!items.includes(active as HTMLElement))){event.preventDefault();first.focus();}
    }}><div className="flood-overlay-header"><h2 id={`${id}-title`} className="flood-overlay-title">{title}</h2>{showCloseButton&&<OverlayClose label={closeLabel} onClick={()=>request(false)} />}</div>
    {description&&<p id={`${id}-description`} className="flood-overlay-description">{description}</p>}{open&&(scrollBody?<div className="flood-drawer__body"><ScrollArea className="flood-overlay-body" style={{height:"100%"}}>{children}</ScrollArea></div>:<div className="flood-overlay-body">{children}</div>)}{open&&footer&&<div className="flood-drawer__footer">{footer}</div>}
  </dialog></>;
});
