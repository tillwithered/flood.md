import {forwardRef,useEffect,useId,useImperativeHandle,useLayoutEffect,useRef,useState} from "react";
import type {DateRangeFieldProps,DateRangeValue} from "./index.js";
import {DateField} from "./index.js";
import {mergeDescriptions} from "./field-state.js";
import {canonicalDate,isEmptyDate,type DateParts} from "./date-value.js";
import {availableDateRange,checkDateRange,completeDateRange,emptyDateRange,emptyRange,sameDateRange} from "./date-range-value.js";

const cx=(...values:Array<string|false|undefined>)=>values.filter(Boolean).join(" ");
const useBrowserLayoutEffect=typeof window==="undefined"?useEffect:useLayoutEffect;
/** Two original DateFields share one atomic range contract and two canonical form bridges. */
export const PairedDateRangeField=forwardRef<HTMLDivElement,DateRangeFieldProps>(function PairedDateRangeField({
  label,hideLabel=false,value,defaultValue=emptyDateRange(),onValueChange,startName,endName,
  startLabel="Start date",endLabel="End date",min,max,required=false,disabled=false,readOnly=false,
  isDateDisabled,isRangeDisabled,rangeMessages,validationMessage,status,invalid,description,
  order="month-day-year",controlSize="md",segmentLabels,messages,end,form,
  id:explicitId,className,onBlur,onKeyDown,onKeyDownCapture,"aria-describedby":describedBy,...props
},forwardedRef){
  if(!label.trim()||!startLabel.trim()||!endLabel.trim())throw new Error("Flood DateRangeField requires nonempty range and endpoint labels");
  checkDateRange(defaultValue,"defaultValue");if(value!==undefined)checkDateRange(value);
  const initial=useRef({...defaultValue}),[local,setLocal]=useState(()=>({...defaultValue})),committed=value??local;
  const [draft,setDraft]=useState<DateRangeValue>(()=>({...committed}));
  const root=useRef<HTMLDivElement>(null),startBridge=useRef<HTMLInputElement>(null),endBridge=useRef<HTMLInputElement>(null);
  const generated=useId(),id=explicitId??`flood-date-range-${generated}`;
  useImperativeHandle(forwardedRef,()=>root.current!,[]);
  const lastPublished=useRef({...committed}),current=useRef({value,committed,draft});current.current={value,committed,draft};
  const labels={incomplete:rangeMessages?.incomplete??"Enter both dates.",reversed:rangeMessages?.reversed??"The end date must not precede the start date.",unavailable:rangeMessages?.unavailable??"This date range is unavailable."};
  if(!Object.values(labels).every(text=>text.trim()))throw new Error("Flood DateRangeField relationship messages must be nonempty");
  const available=availableDateRange(draft,min,max,isDateDisabled,isRangeDisabled),empty=emptyRange(draft);
  const pending=value!==undefined&&(empty||available)&&!sameDateRange(draft,value);
  const relationship=pending?messages?.invalid??"Enter a valid date range.":empty?(required?labels.incomplete:""):!draft.start||!draft.end?labels.incomplete:draft.start>draft.end?labels.reversed:!available?labels.unavailable:"";
  const constraint=relationship||(validationMessage?.trim()?validationMessage:"");
  const errorEndpoint=!draft.start||!!draft.start&&!!isDateDisabled?.(draft.start)?"start":"end";
  const descriptionId=description?`${id}-description`:undefined;
  useBrowserLayoutEffect(()=>{
    if(value!==undefined&&!sameDateRange(value,lastPublished.current))setDraft({...value});
    if(value!==undefined)lastPublished.current={...value};
  },[value?.start,value?.end]);
  useEffect(()=>{
    const owner=startBridge.current?.form;if(!owner)return;
    const timers=new Set<ReturnType<typeof setTimeout>>();
    const reset=(event:Event)=>{const timer=setTimeout(()=>{timers.delete(timer);if(event.defaultPrevented)return;const next=current.current.value===undefined?initial.current:current.current.committed;if(current.current.value===undefined)setLocal({...next});setDraft({...next});lastPublished.current={...next};},0);timers.add(timer);};
    owner.addEventListener("reset",reset);return()=>{owner.removeEventListener("reset",reset);for(const timer of timers)clearTimeout(timer);};
  },[form]);
  const change=(part:"start"|"end",date:string)=>{
    if(disabled||readOnly||root.current?.querySelector<HTMLInputElement>("input[data-segment]")?.matches(":disabled"))return;
    const next={...current.current.draft,[part]:date};current.current.draft=next;setDraft(next);
    if(value===undefined)setLocal(next);
    if(!sameDateRange(next,lastPublished.current)){lastPublished.current={...next};onValueChange?.(next);}
  };
  const readEndpoint=(part:"start"|"end")=>{
    const parts:DateParts={year:"",month:"",day:""};
    root.current?.querySelectorAll<HTMLInputElement>(`[data-range-endpoint="${part}"] input[data-segment]`).forEach(node=>{parts[node.dataset.segment as keyof DateParts]=node.value;});
    return isEmptyDate(parts)?"":canonicalDate(parts);
  };
  const accepted=(available||empty)&&!constraint&&(value===undefined||sameDateRange(draft,value));
  const firstPart=order.split("-")[0];
  return <div {...props} id={id} ref={root} role="group" aria-labelledby={`${id}-label`} aria-describedby={mergeDescriptions(describedBy,descriptionId)} className={cx("flood-date-range-field",className)}
    onKeyDownCapture={event=>{onKeyDownCapture?.(event);onKeyDown?.(event);}} onBlur={event=>{
      onBlur?.(event);if(event.currentTarget.contains(event.relatedTarget as Node|null))return;
      const start=readEndpoint("start"),finish=readEndpoint("end");
      const next=start!==undefined&&finish!==undefined?{start,end:finish}:undefined;
      if(value!==undefined&&next&&(emptyRange(next)||availableDateRange(next,min,max,isDateDisabled,isRangeDisabled))&&!sameDateRange(next,value)){setDraft({...value});lastPublished.current={...value};}
      else if(constraint)queueMicrotask(()=>{const anchor=root.current?.querySelector<HTMLInputElement>(`[data-range-endpoint="${errorEndpoint}"] input[data-segment]`);if(anchor&&!anchor.matches(":disabled"))anchor.checkValidity();});
    }}>
    <label id={`${id}-label`} htmlFor={`${id}-start-${firstPart}`} className={cx("flood-label",hideLabel&&"flood-visually-hidden")}>{label}</label>
    <div className={cx("flood-date-range-field__fields",`flood-control--${controlSize}`)}>
      <div data-range-endpoint="start"><DateField id={`${id}-start`} label={`${label}, ${startLabel}`} hideLabel value={draft.start} onValueChange={date=>change("start",date)}
        min={min} max={max} required={required} disabled={disabled} readOnly={readOnly} controlSize={controlSize} order={order} segmentLabels={segmentLabels} messages={messages} form={form}
        status={status} invalid={invalid} aria-invalid={props["aria-invalid"]} aria-describedby={mergeDescriptions(describedBy,descriptionId)} validationMessage={errorEndpoint==="start"?constraint:undefined}/></div>
      <span className="flood-date-range-field__separator" aria-hidden="true">–</span>
      <div data-range-endpoint="end"><DateField id={`${id}-end`} label={`${label}, ${endLabel}`} hideLabel value={draft.end} onValueChange={date=>change("end",date)}
        min={min} max={max} required={required} disabled={disabled} readOnly={readOnly} controlSize={controlSize} order={order} segmentLabels={segmentLabels} messages={messages} form={form}
        status={status} invalid={invalid} aria-invalid={props["aria-invalid"]} aria-describedby={mergeDescriptions(describedBy,descriptionId)} validationMessage={errorEndpoint==="end"?constraint:undefined} end={end}/></div>
    </div>
    <input ref={startBridge} type="hidden" name={startName} form={form} value={accepted?draft.start:""} disabled={disabled}/>
    <input ref={endBridge} type="hidden" name={endName} form={form} value={accepted?draft.end:""} disabled={disabled}/>
    {description&&<div id={descriptionId} className="flood-date-range-field__description">{description}</div>}
  </div>;
});
