import {forwardRef,useEffect,useImperativeHandle,useLayoutEffect,useRef,useState,type CSSProperties} from "react";
import {TimeField,Popover,IconButton,ListBox,ScrollArea,type TimePickerProps} from "./index.js";
import {parseTime,timeSeconds} from "./time-value.js";
const useBrowserLayoutEffect=typeof window==="undefined"?useEffect:useLayoutEffect;
const triggerSizes={sm:"xs",md:"sm",lg:"md",xl:"lg"}as const;
export const ClockTimePicker=/* @__PURE__ */ forwardRef<HTMLDivElement,TimePickerProps>(function ClockTimePicker({
  label,value,defaultValue="",onValueChange,precision="minute",step:explicitStep,interval:explicitInterval,
  min,max,open:controlledOpen,defaultOpen=false,onOpenChange,panelLabel,openTimeLabel,
  disabled=false,readOnly=false,controlSize="md",form,className,onKeyDown,...props
},ref){
  const step=explicitStep??(precision==="minute"?60:1),interval=explicitInterval??Math.ceil(1800/step)*step;
  if(!Number.isSafeInteger(step)||step<1||!Number.isSafeInteger(interval)||interval<1||interval%step!==0||(precision==="minute"&&(step%60!==0||interval%60!==0)))throw new Error("Flood TimePicker interval must be positive seconds compatible with step and precision");
  if((min!==undefined&&!parseTime(min,precision))||(max!==undefined&&!parseTime(max,precision))||(min&&max&&min>max))throw new Error("Flood TimePicker requires canonical ordered clock bounds");
  const first=min?timeSeconds(parseTime(min,precision)!):0,last=max?timeSeconds(parseTime(max,precision)!):precision==="minute"?86340:86399;
  const count=Math.floor((last-first)/interval)+1;if(count>1000)throw new Error("Flood TimePicker interval must limit the list to at most 1000 options");
  const options=Array.from({length:count},(_,index)=>{
    const seconds=first+index*interval,value=[Math.floor(seconds/3600),Math.floor(seconds%3600/60),...(precision==="second"?[seconds%60]:[])].map(n=>String(n).padStart(2,"0")).join(":");
    return {value,label:value};
  });
  const root=useRef<HTMLDivElement>(null),positionReference=useRef<HTMLElement|null>(null),list=useRef<HTMLDivElement>(null);
  useImperativeHandle(ref,()=>root.current!,[]);
  const initial=useRef(defaultValue),[local,setLocal]=useState(defaultValue),[localOpen,setOpen]=useState(defaultOpen),[width,setWidth]=useState<number>(),[inheritedDisabled,setInheritedDisabled]=useState(false);
  const committed=value??local,requestedOpen=controlledOpen??localOpen,blocked=disabled||readOnly||inheritedDisabled;
  const current=useRef({value,controlledOpen,committed});current.current={value,controlledOpen,committed};
  const nativeDisabled=()=>root.current?.querySelector<HTMLInputElement>("input[data-time-segment]")?.matches(":disabled")??false;
  const request=(next:boolean)=>{if(next&&(blocked||nativeDisabled()))return;if(controlledOpen===undefined)setOpen(next);onOpenChange?.(next);};
  const change=(next:string)=>{if(blocked||nativeDisabled())return;if(value===undefined)setLocal(next);onValueChange?.(next);};
  useBrowserLayoutEffect(()=>{
    const control=root.current?.querySelector<HTMLElement>(".flood-time-field__control");if(!control)return;positionReference.current=control;
    const update=()=>{const next=control.getBoundingClientRect().width;if(next>0)setWidth(next);};update();const Observer=control.ownerDocument.defaultView?.ResizeObserver,observer=Observer?new Observer(update):undefined;observer?.observe(control);
    return()=>{observer?.disconnect();positionReference.current=null;};
  },[]);
  useEffect(()=>{
    const node=root.current;if(!node)return;const update=()=>setInheritedDisabled(nativeDisabled());update();const observer=new node.ownerDocument.defaultView!.MutationObserver(update);
    for(let ancestor=node.parentElement;ancestor;ancestor=ancestor.parentElement)if(ancestor.localName==="fieldset")observer.observe(ancestor,{attributes:true,attributeFilter:["disabled"]});return()=>observer.disconnect();
  },[disabled]);
  useEffect(()=>{if(blocked&&requestedOpen){if(controlledOpen===undefined)setOpen(false);onOpenChange?.(false);}},[blocked,requestedOpen]);
  useEffect(()=>{
    const owner=root.current?.querySelector<HTMLInputElement>('input[type="hidden"]')?.form;if(!owner)return;const timers=new Set<ReturnType<typeof setTimeout>>();
    const reset=(event:Event)=>{const timer=setTimeout(()=>{timers.delete(timer);if(event.defaultPrevented)return;if(current.current.value===undefined)setLocal(initial.current);if(current.current.controlledOpen===undefined)setOpen(false);},0);timers.add(timer);};
    owner.addEventListener("reset",reset);return()=>{owner.removeEventListener("reset",reset);timers.forEach(clearTimeout);};
  },[form]);
  const title=panelLabel??`${label} options`;
  return <TimeField {...props} ref={root} label={label} value={committed} defaultValue={defaultValue} onValueChange={change}
    precision={precision} step={step} min={min} max={max} form={form} disabled={disabled} readOnly={readOnly} controlSize={controlSize}
    className={["flood-time-picker",className].filter(Boolean).join(" ")} onKeyDown={event=>{
      onKeyDown?.(event);if(!event.defaultPrevented&&!event.nativeEvent.isComposing&&event.keyCode!==229&&event.altKey&&event.key==="ArrowDown"&&(event.target as HTMLElement).matches("input[data-time-segment]")){event.preventDefault();request(true);}
    }} end={<Popover title={title} open={!blocked&&requestedOpen} onOpenChange={request} disabled={blocked} initialFocusRef={list} positionReference={positionReference}
      className="flood-time-picker__panel" style={{"--flood-time-picker-width":width?`${width}px`:undefined}as CSSProperties}
      trigger={trigger=><IconButton {...trigger} label={openTimeLabel??`Choose time: ${label}`} variant="ghost" size={triggerSizes[controlSize]}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></IconButton>}>
      <ScrollArea className="flood-time-picker__scroll" orientation="vertical" tabIndex={-1}>
        <ListBox ref={list} label={title} hideLabel selectionBehavior="manual" options={options} value={options.some(option=>option.value===committed)?committed:""} controlSize={controlSize}
          onValueChange={next=>{change(typeof next==="string"?next:next[0]??"");request(false);}}/>
      </ScrollArea>
    </Popover>}/>;
});
