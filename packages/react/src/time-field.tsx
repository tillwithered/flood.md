import {forwardRef, useEffect, useId, useImperativeHandle, useRef, useState} from "react";
import {Label, type TimeFieldProps} from "./index.js";
import {mergeDescriptions, resolveFieldStatus} from "./field-state.js";
import {canonicalTime, emptyTimeParts, isEmptyTime, parseTime, stepTimePart, timeInRange, timeOnStep, type TimeParts, type TimeSegment} from "./time-value.js";
const cx = (...values:Array<string|false|undefined>) => values.filter(Boolean).join(" ");

export const SegmentedTimeField = /* @__PURE__ */ forwardRef<HTMLDivElement,TimeFieldProps>(function SegmentedTimeField({
  label,hideLabel=false,value,defaultValue="",onValueChange,precision="minute",min,max,step:explicitStep,
  required=false,readOnly=false,disabled=false,name,form,controlSize="md",invalid=false,status,description,
  segmentLabels,messages,id:explicitId,className,onKeyDown,onPaste,onBlur,"aria-describedby":describedBy,"aria-invalid":ariaInvalid,...props
}, forwardedRef) {
  if (precision !== "minute" && precision !== "second") throw new Error("Flood TimeField precision must be minute or second");
  if (!label.trim()) throw new Error("Flood TimeField requires a nonempty label");
  const step = explicitStep ?? (precision === "minute" ? 60 : 1);
  if (!Number.isSafeInteger(step) || step <= 0 || (precision === "minute" && step % 60 !== 0)) throw new Error("Flood TimeField step must be positive integer seconds compatible with precision");
  for (const [key,entry] of [["value",value],["defaultValue",defaultValue],["min",min],["max",max]] as const) {
    if (entry !== undefined && entry !== "" && !parseTime(entry,precision)) throw new Error(`Flood TimeField ${key} must match its canonical 24-hour precision`);
  }
  if (min === "" || max === "" || (min && max && min > max)) throw new Error("Flood TimeField requires ordered same-day bounds");
  const labels = {hour:segmentLabels?.hour ?? "Hour",minute:segmentLabels?.minute ?? "Minute",second:segmentLabels?.second ?? "Second"};
  if (!Object.values(labels).every(text => text.trim()) || (messages && Object.values(messages).some(text => text !== undefined && !text.trim()))) throw new Error("Flood TimeField segment labels and supplied messages must be nonempty");
  const generated=useId(),id=explicitId ?? `flood-time-${generated}`;
  const root=useRef<HTMLDivElement>(null),bridge=useRef<HTMLInputElement>(null),inputs=useRef<Partial<Record<TimeSegment,HTMLInputElement|null>>>({}),lastFocused=useRef<TimeSegment>("hour");
  useImperativeHandle(forwardedRef,()=>root.current!,[]);
  const ordered:TimeSegment[]=precision === "second" ? ["hour","minute","second"] : ["hour","minute"];
  const initial=useRef(defaultValue),[local,setLocal]=useState(defaultValue),committed=value ?? local;
  const [parts,setParts]=useState<TimeParts>(()=>parseTime(committed,precision) ?? emptyTimeParts());
  const [touched,setTouched]=useState(false),[inheritedDisabled,setInheritedDisabled]=useState(false);
  const effectiveDisabled=disabled || inheritedDisabled,composing=useRef<TimeSegment|undefined>(undefined),snapshot=useRef(parts),lastPublished=useRef(committed);
  const settled=composing.current ? snapshot.current : parts,canonical=canonicalTime(settled,precision),empty=isEmptyTime(settled,precision);
  const inRange=Boolean(canonical && timeInRange(canonical,min,max)),onStep=Boolean(canonical && timeOnStep(settled,step,min,precision));
  const proposal=empty ? "" : canonical && inRange && onStep ? canonical : undefined;
  const pendingAcceptance=value !== undefined && proposal !== undefined && proposal !== value;
  const message=pendingAcceptance ? messages?.invalid ?? "Enter a valid time." : empty ? required ? messages?.required ?? "Enter a time." : "" : !canonical ? messages?.invalid ?? "Enter a valid time." : !inRange ? messages?.outOfRange ?? "Enter a time within the allowed range." : !onStep ? messages?.stepMismatch ?? "Enter a time matching the allowed step." : "";
  const current=useRef({value,committed,parts});current.current={value,committed,parts};
  useEffect(()=>{
    if (value !== undefined && value !== lastPublished.current) setParts(parseTime(value,precision) ?? emptyTimeParts());
    if (value !== undefined) lastPublished.current=value;
  },[value,precision]);
  useEffect(()=>{
    for (const part of ["hour","minute","second"] as const) inputs.current[part]?.setCustomValidity(part === "hour" && !effectiveDisabled && !readOnly ? message : "");
  },[message,effectiveDisabled,readOnly,precision]);
  useEffect(()=>{
    const node=inputs.current.hour;if(!node)return;
    const update=()=>setInheritedDisabled(node.matches(":disabled"));update();
    const observer=new node.ownerDocument.defaultView!.MutationObserver(update);
    for(let ancestor=node.parentElement;ancestor;ancestor=ancestor.parentElement)if(ancestor.localName === "fieldset")observer.observe(ancestor,{attributes:true,attributeFilter:["disabled"]});
    return()=>observer.disconnect();
  },[disabled]);
  useEffect(()=>{
    const owner=bridge.current?.form;if(!owner)return;
    const timers=new Set<ReturnType<typeof setTimeout>>();
    const reset=(event:Event)=>{const timer=setTimeout(()=>{
      timers.delete(timer);if(event.defaultPrevented || !root.current)return;
      const next=current.current.value === undefined ? initial.current : current.current.committed;
      if(current.current.value === undefined)setLocal(next);
      composing.current=undefined;setParts(parseTime(next,precision) ?? emptyTimeParts());setTouched(false);lastPublished.current=next;
    },0);timers.add(timer);};
    owner.addEventListener("reset",reset);return()=>{owner.removeEventListener("reset",reset);timers.forEach(clearTimeout);};
  },[form,precision]);
  const blocked=()=>Boolean(readOnly || effectiveDisabled || inputs.current.hour?.matches(":disabled"));
  const select=(part:TimeSegment)=>{const node=inputs.current[part];node?.focus({preventScroll:true});node?.select();};
  const change=(next:TimeParts)=>{
    if(blocked())return;
    setParts(next);
    const time=canonicalTime(next,precision),nextValue=time && timeInRange(time,min,max) && timeOnStep(next,step,min,precision) ? time : "";
    if(value === undefined)setLocal(nextValue);
    if(lastPublished.current !== nextValue){lastPublished.current=nextValue;onValueChange?.(nextValue);}
  };
  const edit=(part:TimeSegment,raw:string)=>{
    if(!/^\d*$/.test(raw))return;
    const text=raw.slice(0,2);change({...current.current.parts,[part]:text});
    const next=ordered[ordered.indexOf(part)+1];if(text.length === 2 && next)select(next);
  };
  const errorShown=touched && !effectiveDisabled && !readOnly && Boolean(message),resolvedStatus=resolveFieldStatus(status,invalid || errorShown,ariaInvalid);
  const descriptionId=description ? `${id}-description` : undefined,errorId=errorShown ? `${id}-error` : undefined;
  const descriptions=mergeDescriptions(describedBy,descriptionId,errorId);
  return <div {...props} ref={root} id={id} className={cx("flood-time-field",className)} data-disabled={effectiveDisabled || undefined}
    onBlur={event=>{
      onBlur?.(event);if(event.defaultPrevented || event.currentTarget.contains(event.relatedTarget as Node|null) || composing.current)return;
      setTouched(true);
      const draft=canonicalTime(current.current.parts,precision),isEmpty=isEmptyTime(current.current.parts,precision);
      if(value !== undefined && (isEmpty || (draft && timeInRange(draft,min,max) && timeOnStep(current.current.parts,step,min,precision))) && (isEmpty ? "" : draft) !== value){setParts(parseTime(value,precision) ?? emptyTimeParts());lastPublished.current=value;}
      else if(draft && timeInRange(draft,min,max) && timeOnStep(current.current.parts,step,min,precision))setParts(parseTime(draft,precision)!);
    }}
    onKeyDown={event=>{
      onKeyDown?.(event);if(event.defaultPrevented || event.nativeEvent.isComposing || composing.current || event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)return;
      const target=event.target as HTMLInputElement,part=target.getAttribute("data-time-segment") as TimeSegment|null;
      if(!part || inputs.current[part] !== target)return;
      const index=ordered.indexOf(part),rtl=root.current?.ownerDocument.defaultView?.getComputedStyle(root.current).direction === "rtl";
      const offset=(event.key === "ArrowLeft" ? -1 : 1)*(rtl ? -1 : 1);
      if((event.key === "ArrowLeft" || event.key === "ArrowRight") && ordered[index+offset]){event.preventDefault();select(ordered[index+offset]);return;}
      if(readOnly && event.key === "Backspace"){event.preventDefault();return;}
      if(blocked())return;
      if(["ArrowUp","ArrowDown","Home","End"].includes(event.key)){event.preventDefault();change(stepTimePart(current.current.parts,precision,part,event.key === "ArrowDown" ? -1 : 1,step,min,max,event.key === "Home" ? "start" : event.key === "End" ? "end" : undefined));target.select();}
      else if(event.key === "Backspace" && !parts[part] && index>0){event.preventDefault();select(ordered[index-1]);}
    }}
    onPaste={event=>{
      onPaste?.(event);if(event.defaultPrevented || blocked() || composing.current || !ordered.some(part=>inputs.current[part] === event.target))return;
      const parsed=parseTime(event.clipboardData.getData("text/plain").trim(),precision);if(parsed){event.preventDefault();change(parsed);}
    }}>
    <Label htmlFor={`${id}-hour`} id={`${id}-label`} required={required} className={hideLabel ? "flood-visually-hidden" : undefined}>{label}</Label>
    <div role="group" aria-labelledby={`${id}-label`} aria-describedby={descriptions} className={cx("flood-time-field__control",`flood-control--${controlSize}`)} data-status={resolvedStatus} data-readonly={readOnly || undefined} data-disabled={effectiveDisabled || undefined}
      onClick={event=>{
        if(event.defaultPrevented || effectiveDisabled || inputs.current.hour?.matches(":disabled") || (event.target as HTMLElement).closest("input"))return;
        select(ordered.find(part=>!current.current.parts[part]) ?? (ordered.includes(lastFocused.current) ? lastFocused.current : "hour"));
      }}>
      {ordered.map((part,index)=><span key={part} className="flood-time-field__part">
        {index>0 && <span className="flood-time-field__separator" aria-hidden="true">:</span>}
        <input ref={node=>{inputs.current[part]=node;}} id={`${id}-${part}`} data-time-segment={part} className="flood-time-field__segment" type="text" role="spinbutton" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={2} form={form}
          aria-label={`${label}, ${labels[part]}`} aria-valuemin={0} aria-valuemax={part === "hour" ? 23 : 59}
          aria-valuenow={/^\d{1,2}$/.test(parts[part]) && Number(parts[part]) <= (part === "hour" ? 23 : 59) ? Number(parts[part]) : undefined} aria-valuetext={parts[part] || undefined}
          aria-invalid={resolvedStatus === "error" || undefined} aria-required={required || undefined} aria-describedby={descriptions}
          value={parts[part]} disabled={disabled} readOnly={readOnly} placeholder={part === "hour" ? "HH" : part === "minute" ? "MM" : "SS"}
          onFocus={event=>{lastFocused.current=part;event.currentTarget.select();}} onClick={event=>event.currentTarget.select()}
          onChange={event=>{if(blocked())return;const raw=event.currentTarget.value;if(composing.current === part)setParts(previous=>({...previous,[part]:raw}));else edit(part,raw);}}
          onCompositionStart={()=>{if(blocked())return;snapshot.current=current.current.parts;composing.current=part;}}
          onCompositionEnd={event=>{composing.current=undefined;if(blocked()){setParts(snapshot.current);return;}if(/^\d*$/.test(event.currentTarget.value))edit(part,event.currentTarget.value);else setParts(snapshot.current);}}
          onInvalid={()=>setTouched(true)}/>
      </span>)}
    </div>
    <input ref={bridge} type="hidden" name={name} form={form} value={canonical && (readOnly || inRange && onStep) && (value === undefined || canonical === value) ? canonical : ""} disabled={disabled}/>
    {description && <div id={descriptionId} className="flood-time-field__description">{description}</div>}
    {errorShown && <div id={errorId} role="alert" className="flood-time-field__error">{message}</div>}
  </div>;
});
