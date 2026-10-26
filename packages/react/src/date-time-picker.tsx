import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {DatePicker, TimeField, Fieldset, type DateTimePickerProps} from "./index.js";

/** A civil date and wall-clock time. The host owns timezone conversion. */
export const CivilDateTimePicker = /* @__PURE__ */ forwardRef<HTMLDivElement, DateTimePickerProps>(function CivilDateTimePicker({
  label, hideLabel=false, value, defaultValue={date:"",time:""}, onValueChange,
  dateLabel="Date", timeLabel="Time", dateName, timeName, form, required=false,
  disabled=false, readOnly=false, controlSize="md", precision="minute", order="month-day-year",
  locale="en-US", minDate, maxDate, minTime, maxTime, step, status, description, className, ...props
}, ref) {
  const [local,setLocal]=useState(defaultValue);
  const root=useRef<HTMLDivElement>(null), initial=useRef(defaultValue);
  useImperativeHandle(ref,()=>root.current!,[]);
  useEffect(()=>{
    const owner=root.current?.querySelector<HTMLInputElement>("input")?.form;
    if(!owner)return;
    const timers=new Set<ReturnType<typeof setTimeout>>();
    const reset=(event:Event)=>{const timer=setTimeout(()=>{timers.delete(timer);if(!event.defaultPrevented)setLocal(initial.current);},0);timers.add(timer);};
    owner.addEventListener("reset",reset);
    return()=>{owner.removeEventListener("reset",reset);timers.forEach(clearTimeout);};
  },[form]);
  const selected=value ?? local;
  const change=(part:"date"|"time", next:string)=>{
    if(disabled || readOnly)return;
    const updated={...selected,[part]:next};
    if(value === undefined)setLocal(updated);
    onValueChange?.(updated);
  };
  // Each field owns native validity, reset and submission. Values are deliberately
  // separate: neither a timezone nor an instant is inferred from this pair.
  return <div {...props} ref={root} className={["flood-date-time-picker",className].filter(Boolean).join(" ")}>
    <Fieldset legend={label} hideLabel={hideLabel} hint={description} disabled={disabled}>
      <div className="flood-date-time-picker__fields">
        <DatePicker label={dateLabel} value={value === undefined ? undefined : selected.date}
          defaultValue={defaultValue.date} onValueChange={next=>change("date",next)}
          name={dateName} form={form} required={required} disabled={disabled} readOnly={readOnly}
          controlSize={controlSize} order={order} locale={locale} min={minDate} max={maxDate} status={status}/>
        <TimeField label={timeLabel} value={value === undefined ? undefined : selected.time}
          defaultValue={defaultValue.time} onValueChange={next=>change("time",next)}
          name={timeName} form={form} required={required} disabled={disabled} readOnly={readOnly}
          controlSize={controlSize} precision={precision} min={minTime} max={maxTime} step={step} status={status}/>
      </div>
    </Fieldset>
  </div>;
});
