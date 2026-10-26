import {forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties} from "react";
import type {ResizablePanelsProps} from "./index.js";
const clamp = (value:number,min:number,max:number) => Math.max(min,Math.min(max,Math.round(value*1e6)/1e6));
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const resizeKeys = new Set(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"]);
interface Drag {
  pointerId:number;
  origin:number;
  initial:number;
  requested:number;
  orientation:"horizontal"|"vertical";
  rtl:boolean;
  handle:HTMLDivElement;
  restore:()=>void;
}
function lockDocument(document:Document,cursor:string) {
  const style=document.documentElement.style;
  const entries=["user-select","-webkit-user-select","cursor"].map(name=>({name,value:style.getPropertyValue(name),priority:style.getPropertyPriority(name),owned:name === "cursor" ? cursor : "none"}));
  for(const entry of entries)style.setProperty(entry.name,entry.owned,"important");
  return()=>{for(const entry of entries){if(style.getPropertyValue(entry.name)!==entry.owned || style.getPropertyPriority(entry.name)!=="important")continue;if(entry.value)style.setProperty(entry.name,entry.value,entry.priority);else style.removeProperty(entry.name);}};
}

/** Two bounded panes with a dedicated separator track; percentages exclude that track. */
export const ResizablePaneGroup = forwardRef<HTMLDivElement,ResizablePanelsProps>(function ResizablePaneGroup({
  label,main,secondary,orientation="horizontal",value,defaultValue=50,onValueChange,onValueCommit,
  min=10,max=90,step=1,largeStep=10,disabled=false,id:explicitId,className,style,
  onPointerDown,onPointerMove,onPointerUp,onPointerCancel,onLostPointerCapture,onKeyDown,onKeyUp,onBlur,...props
}, forwardedRef) {
  if(!label.trim())throw new Error("Flood ResizablePanels requires a nonempty separator label");
  if(orientation!=="horizontal" && orientation!=="vertical")throw new Error("Flood ResizablePanels orientation must be horizontal or vertical");
  if(![min,max].every(Number.isFinite) || min<0 || max>100 || min>=max)throw new Error("Flood ResizablePanels bounds must satisfy 0 <= min < max <= 100");
  if(![step,largeStep].every(number=>Number.isFinite(number) && number>0))throw new Error("Flood ResizablePanels keyboard steps must be positive finite percentages");
  for(const entry of [value,defaultValue])if(entry!==undefined && (!Number.isFinite(entry) || entry<0 || entry>100))throw new Error("Flood ResizablePanels values must be finite percentages from 0 to 100");
  const generated=useId(),id=explicitId ?? `flood-resizable-${generated}`,mainId=`${id}-main`,secondaryId=`${id}-secondary`;
  const root=useRef<HTMLDivElement>(null),handle=useRef<HTMLDivElement>(null),first=useRef<HTMLDivElement>(null),second=useRef<HTMLDivElement>(null);
  useImperativeHandle(forwardedRef,()=>root.current!,[]);
  const [local,setLocal]=useState(defaultValue),[dragging,setDragging]=useState(false),percent=clamp(value ?? local,min,max);
  const drag=useRef<Drag|undefined>(undefined),keyboard=useRef(false),alive=useRef(true),restoreSeparatorFocus=useRef(false);
  const current=useRef({percent,value,min,max,orientation,disabled,onValueChange,onValueCommit});current.current={percent,value,min,max,orientation,disabled,onValueChange,onValueCommit};
  const bindPane=(node:HTMLDivElement|null,reference:{current:HTMLDivElement|null},inactive:boolean)=>{
    reference.current=node;if(!node)return;
    if(inactive && node.contains(node.ownerDocument.activeElement))restoreSeparatorFocus.current=true;
    // Set the native property so React 18 does not receive an unknown boolean prop.
    node.inert=inactive;
  };
  useBrowserLayoutEffect(()=>{
    if(restoreSeparatorFocus.current){restoreSeparatorFocus.current=false;handle.current?.focus({preventScroll:true});}
  });
  const publish=(next:number)=>{
    const state=current.current,bounded=clamp(next,state.min,state.max);
    if(state.value===undefined){current.current.percent=bounded;setLocal(bounded);}
    state.onValueChange?.(bounded);
  };
  const commitAccepted=()=>queueMicrotask(()=>{if(alive.current)current.current.onValueCommit?.(current.current.percent);});
  const finish=(commit:boolean,restore=true)=>{
    const gesture=drag.current;if(!gesture)return;
    drag.current=undefined;
    gesture.restore();
    try{if(gesture.handle.hasPointerCapture(gesture.pointerId))gesture.handle.releasePointerCapture(gesture.pointerId);}catch{/* Capture may already be released by the browser or node removal. */}
    if(alive.current)setDragging(false);
    if(!alive.current)return;
    if(!commit && restore && current.current.value===undefined){const start=clamp(gesture.initial,current.current.min,current.current.max);if(start!==current.current.percent)publish(start);}
    if(commit)commitAccepted();
  };
  const move=(event:{pointerId:number;clientX:number;clientY:number})=>{
    const gesture=drag.current;if(!gesture || gesture.pointerId!==event.pointerId || current.current.disabled)return;
    const a=first.current?.getBoundingClientRect(),b=second.current?.getBoundingClientRect();if(!a || !b)return;
    const available=gesture.orientation === "horizontal" ? a.width+b.width : a.height+b.height;
    if(!Number.isFinite(available) || available<=0)return;
    const coordinate=gesture.orientation === "horizontal" ? event.clientX : event.clientY;if(!Number.isFinite(coordinate))return;
    const direction=gesture.orientation === "horizontal" && gesture.rtl ? -1 : 1;
    const next=clamp(gesture.initial+(coordinate-gesture.origin)*direction/available*100,current.current.min,current.current.max);
    if(next!==gesture.requested){gesture.requested=next;publish(next);}
  };
  useEffect(()=>{
    alive.current=true;
    return()=>{alive.current=false;keyboard.current=false;finish(false,false);};
  },[]);
  useEffect(()=>{if(drag.current)finish(false);keyboard.current=false;},[disabled,orientation,min,max]);
  useEffect(()=>{
    if(!dragging || !root.current)return;
    const document=root.current.ownerDocument,view=document.defaultView;
    const cancel=()=>finish(false),visibility=()=>{if(document.hidden)cancel();};
    view?.addEventListener("blur",cancel);document.addEventListener("visibilitychange",visibility);
    return()=>{view?.removeEventListener("blur",cancel);document.removeEventListener("visibilitychange",visibility);};
  },[dragging]);
  return <div {...props} id={id} ref={root} className={["flood-resizable-panels",className].filter(Boolean).join(" ")}
    data-orientation={orientation} data-disabled={disabled || undefined} data-dragging={dragging || undefined}
    style={{...style,"--flood-main-weight":`${percent}fr`,"--flood-secondary-weight":`${100-percent}fr`} as CSSProperties}
    onPointerDown={event=>{
      onPointerDown?.(event);
      const separator=handle.current,node=root.current;
      if(event.defaultPrevented || current.current.disabled || drag.current || event.button!==0 || event.isPrimary===false || !separator?.contains(event.target as Node) || !node)return;
      const a=first.current?.getBoundingClientRect(),b=second.current?.getBoundingClientRect(),horizontal=orientation === "horizontal";
      if(!a || !b || (horizontal ? a.width+b.width : a.height+b.height)<=0 || !Number.isFinite(horizontal ? event.clientX : event.clientY))return;
      separator.focus({preventScroll:true});
      if(current.current.disabled || current.current.orientation!==orientation || !separator.isConnected)return;
      try{separator.setPointerCapture(event.pointerId);}catch{return;}
      event.preventDefault();
      keyboard.current=false;
      drag.current={pointerId:event.pointerId,origin:horizontal ? event.clientX : event.clientY,initial:current.current.percent,requested:current.current.percent,orientation,rtl:node.ownerDocument.defaultView?.getComputedStyle(node).direction === "rtl",handle:separator,restore:lockDocument(node.ownerDocument,horizontal ? "col-resize" : "row-resize")};
      setDragging(true);
    }}
    onPointerMove={event=>{onPointerMove?.(event);if(!event.defaultPrevented)move(event);}}
    onPointerUp={event=>{
      let accepted=false;
      try{onPointerUp?.(event);accepted=!event.defaultPrevented;if(accepted)move(event);}
      finally{if(drag.current?.pointerId===event.pointerId)finish(accepted);}
    }}
    onPointerCancel={event=>{try{onPointerCancel?.(event);}finally{if(drag.current?.pointerId===event.pointerId)finish(false);}}}
    onLostPointerCapture={event=>{try{onLostPointerCapture?.(event);}finally{if(drag.current?.pointerId===event.pointerId)finish(false);}}}
    onKeyDown={event=>{
      onKeyDown?.(event);if(event.defaultPrevented || event.target!==handle.current || event.nativeEvent.isComposing || event.keyCode===229 || event.altKey || event.ctrlKey || event.metaKey)return;
      if(event.key==="Escape" && drag.current){event.preventDefault();finish(false);return;}
      if(current.current.disabled || drag.current || !resizeKeys.has(event.key))return;
      const horizontal=orientation === "horizontal",rtl=root.current?.ownerDocument.defaultView?.getComputedStyle(root.current).direction === "rtl";
      const direction=horizontal ? event.key==="ArrowRight" ? (rtl ? -1 : 1) : event.key==="ArrowLeft" ? (rtl ? 1 : -1) : 0 : event.key==="ArrowDown" ? 1 : event.key==="ArrowUp" ? -1 : 0;
      if(!direction && event.key!=="Home" && event.key!=="End")return;
      event.preventDefault();
      const state=current.current,next=clamp(event.key==="Home" ? min : event.key==="End" ? max : state.percent+direction*(event.shiftKey ? largeStep : step),min,max);
      if(next!==state.percent){keyboard.current=true;publish(next);}
    }}
    onKeyUp={event=>{onKeyUp?.(event);if(event.target===handle.current && (event.key==="Home" || event.key==="End" || (orientation==="horizontal" ? ["ArrowLeft","ArrowRight"] : ["ArrowUp","ArrowDown"]).includes(event.key)) && keyboard.current){keyboard.current=false;if(!event.defaultPrevented)commitAccepted();}}}
    onBlur={event=>{try{onBlur?.(event);}finally{if(event.target===handle.current && keyboard.current){keyboard.current=false;if(!event.defaultPrevented)commitAccepted();}}}}>
    <div ref={node=>bindPane(node,first,percent===0)} id={mainId} aria-hidden={percent===0 || undefined} className="flood-resizable-panels__panel">{main}</div>
    <div ref={handle} role="separator" tabIndex={disabled ? -1 : 0} aria-disabled={disabled || undefined} aria-label={label}
      aria-orientation={orientation === "horizontal" ? "vertical" : "horizontal"} aria-controls={`${mainId} ${secondaryId}`} aria-valuemin={min} aria-valuemax={max} aria-valuenow={percent} aria-valuetext={`${Number(percent.toFixed(2))}%`}
      className="flood-resizable-panels__separator" />
    <div ref={node=>bindPane(node,second,percent===100)} id={secondaryId} aria-hidden={percent===100 || undefined} className="flood-resizable-panels__panel">{secondary}</div>
  </div>;
});
