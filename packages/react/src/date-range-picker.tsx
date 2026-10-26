import {forwardRef,useEffect,useImperativeHandle,useLayoutEffect,useRef,useState} from "react";
import type {CSSProperties} from "react";
import type {DateRangePickerProps} from "./index.js";
import {DateRangeField,IconButton,Popover,RangeCalendar} from "./index.js";
import {emptyDateRange} from "./date-range-value.js";

const useBrowserLayoutEffect=typeof window==="undefined"?useEffect:useLayoutEffect;
const triggerSizes={sm:"xs",md:"sm",lg:"md",xl:"lg"}as const;
export const CalendarDateRangePicker=/* @__PURE__ */ forwardRef<HTMLDivElement,DateRangePickerProps>(function CalendarDateRangePicker({
  value,defaultValue=emptyDateRange(),onValueChange,open:controlledOpen,defaultOpen=false,onOpenChange,
  label,calendarLabel,openCalendarLabel,locale,weekStartsOn,today,previousMonthLabel,nextMonthLabel,rangeLabels,
  disabled=false,readOnly=false,controlSize="md",min,max,isDateDisabled,isRangeDisabled,form,className,onKeyDown,...props
},forwardedRef){
  const panelLabel=calendarLabel??`${label} calendar`,triggerLabel=openCalendarLabel??`Open calendar: ${label}`;
  if(!panelLabel.trim()||!triggerLabel.trim())throw new Error("Flood DateRangePicker requires nonempty calendar and trigger labels");
  const root=useRef<HTMLDivElement>(null),positionReference=useRef<HTMLElement|null>(null);
  useImperativeHandle(forwardedRef,()=>root.current!,[]);
  const initial=useRef({...defaultValue}),[localValue,setLocalValue]=useState(()=>({...defaultValue}));
  const [localOpen,setLocalOpen]=useState(defaultOpen),[inheritedDisabled,setInheritedDisabled]=useState(false),[fieldWidth,setFieldWidth]=useState<number>();
  const committed=value??localValue,requestedOpen=controlledOpen??localOpen,blocked=disabled||readOnly||inheritedDisabled;
  const current=useRef({value,committed,controlledOpen,requestedOpen});current.current={value,committed,controlledOpen,requestedOpen};
  const nativeDisabled=()=>root.current?.querySelector<HTMLInputElement>("input[data-segment]")?.matches(":disabled")??false;
  const requestOpen=(next:boolean)=>{if(current.current.controlledOpen===undefined)setLocalOpen(next);onOpenChange?.(next);};
  const change=(next:typeof committed)=>{if(blocked||nativeDisabled())return;if(value===undefined)setLocalValue({...next});onValueChange?.(next);};
  useBrowserLayoutEffect(()=>{
    const fields=root.current?.querySelector<HTMLElement>(".flood-date-range-field__fields");if(!fields)return;
    positionReference.current=fields;
    const update=()=>{const width=fields.getBoundingClientRect().width;if(width>0)setFieldWidth(previous=>previous===width?previous:width);};update();
    const view=fields.ownerDocument.defaultView,observer=view?.ResizeObserver?new view.ResizeObserver(update):undefined;observer?.observe(fields);
    return()=>{observer?.disconnect();if(positionReference.current===fields)positionReference.current=null;};
  },[]);
  useBrowserLayoutEffect(()=>{
    const node=root.current;if(!node)return;
    const update=()=>setInheritedDisabled(nativeDisabled());update();
    const observer=new node.ownerDocument.defaultView!.MutationObserver(update);let ancestor=node.parentElement;
    while(ancestor){if(ancestor.localName==="fieldset")observer.observe(ancestor,{attributes:true,attributeFilter:["disabled"]});ancestor=ancestor.parentElement;}
    return()=>observer.disconnect();
  },[disabled]);
  useEffect(()=>{if(blocked&&requestedOpen){if(controlledOpen===undefined)setLocalOpen(false);onOpenChange?.(false);}},[blocked,requestedOpen]);
  useEffect(()=>{
    const owner=root.current?.querySelector<HTMLInputElement>('input[type="hidden"]')?.form;if(!owner)return;
    const timers=new Set<ReturnType<typeof setTimeout>>();
    const reset=(event:Event)=>{const timer=setTimeout(()=>{timers.delete(timer);if(event.defaultPrevented)return;if(current.current.value===undefined)setLocalValue({...initial.current});if(current.current.requestedOpen){if(current.current.controlledOpen===undefined)setLocalOpen(false);onOpenChange?.(false);}},0);timers.add(timer);};
    owner.addEventListener("reset",reset);return()=>{owner.removeEventListener("reset",reset);for(const timer of timers)clearTimeout(timer);};
  },[form]);
  return <DateRangeField {...props} ref={root} label={label} value={committed} onValueChange={change}
    disabled={disabled} readOnly={readOnly} controlSize={controlSize} min={min} max={max} isDateDisabled={isDateDisabled} isRangeDisabled={isRangeDisabled} form={form}
    className={["flood-date-range-picker",className].filter(Boolean).join(" ")}
    onKeyDown={event=>{
      onKeyDown?.(event);
      if(!event.defaultPrevented&&!event.nativeEvent.isComposing&&event.keyCode!==229&&!blocked&&!nativeDisabled()&&event.altKey&&!event.ctrlKey&&!event.metaKey&&event.key==="ArrowDown"&&(event.target as HTMLElement).matches("input[data-segment]")){event.preventDefault();requestOpen(true);}
    }}
    end={<Popover title={panelLabel} className="flood-date-range-picker__panel" align="end" positionReference={positionReference}
      style={{"--flood-date-range-picker-width":fieldWidth?`${fieldWidth}px`:undefined}as CSSProperties}
      open={!blocked&&requestedOpen} onOpenChange={requestOpen} disabled={blocked}
      trigger={trigger=><IconButton {...trigger} label={triggerLabel} variant="ghost" size={triggerSizes[controlSize]}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg></IconButton>}>
      <RangeCalendar label={panelLabel} value={committed} min={min} max={max} isDateDisabled={isDateDisabled} isRangeDisabled={isRangeDisabled}
        locale={locale} weekStartsOn={weekStartsOn} today={today} previousMonthLabel={previousMonthLabel} nextMonthLabel={nextMonthLabel} rangeLabels={rangeLabels}
        autoFocus onValueChange={change} onRangeSelect={()=>{if(!blocked&&!nativeDisabled())requestOpen(false);}}/>
    </Popover>}/>;
});
