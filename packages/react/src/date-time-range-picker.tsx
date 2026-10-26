import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from "react";
import {Fieldset,Stack,DateTimePicker,type DateTimeRangePickerProps,type DateTimeRangeValue,type DateTimeValue} from "./index.js";
import {parseDate,dateInRange} from "./date-value.js";
import {parseTime,timeOnStep} from "./time-value.js";
const empty=():DateTimeRangeValue=>({start:{date:"",time:""},end:{date:"",time:""}});
const copy=(value:DateTimeRangeValue):DateTimeRangeValue=>({start:{...value.start},end:{...value.end}});
const signature=(value:DateTimeRangeValue)=>[value.start.date,value.start.time,value.end.date,value.end.time].join("|");

export const CivilDateTimeRangePicker=/* @__PURE__ */ forwardRef<HTMLDivElement,DateTimeRangePickerProps>(function CivilDateTimeRangePicker({
  label,hideLabel=false,value,defaultValue=empty(),onValueChange,startDateName,startTimeName,endDateName,endTimeName,
  startLabel="Start",endLabel="End",startDateLabel="Start date",startTimeLabel="Start time",endDateLabel="End date",endTimeLabel="End time",
  form,required=false,disabled=false,readOnly=false,controlSize="md",precision="minute",order="month-day-year",locale="en-US",
  minDate,maxDate,step:explicitStep,interval,status,description,incompleteMessage="Complete both dates and times.",reversedMessage="End must not precede start.",className,onBlur,...props
},ref){
  if(![label,startLabel,endLabel,startDateLabel,startTimeLabel,endDateLabel,endTimeLabel,incompleteMessage,reversedMessage].every(text=>text.trim()))throw new Error("Flood DateTimeRangePicker requires nonempty labels and messages");
  const initial=useRef(copy(defaultValue)),[local,setLocal]=useState(()=>copy(defaultValue)),[proposal,setProposal]=useState<DateTimeRangeValue>();
  const selected=value??local,sourceSignature=signature(selected),requested=proposal&&signature(proposal)!==sourceSignature;
  const root=useRef<HTMLDivElement>(null);useImperativeHandle(ref,()=>root.current!,[]);
  useEffect(()=>{setProposal(undefined);},[sourceSignature]);
  const complete=Boolean(parseDate(selected.start.date)&&parseDate(selected.end.date)&&parseTime(selected.start.time,precision)&&parseTime(selected.end.time,precision));
  const blank=Object.values(selected).every(endpoint=>!endpoint.date&&!endpoint.time);
  const ordered=complete&&`${selected.start.date}T${selected.start.time}`<=`${selected.end.date}T${selected.end.time}`;
  const step=explicitStep??(precision==="minute"?60:1);
  const available=complete&&(readOnly||[selected.start,selected.end].every(endpoint=>dateInRange(endpoint.date,minDate,maxDate)&&timeOnStep(parseTime(endpoint.time,precision)!,step,undefined,precision)));
  const accepted=Boolean(complete&&ordered&&available&&!requested);
  const constraint=requested?incompleteMessage:!complete?(blank&&!required?"":incompleteMessage):!ordered?reversedMessage:"";
  const change=(part:"start"|"end",next:DateTimeValue)=>{
    if(disabled||readOnly||root.current?.querySelector<HTMLInputElement>("input")?.matches(":disabled"))return;
    const update={...selected,[part]:next};if(value===undefined)setLocal(update);else setProposal(update);onValueChange?.(update);
  };
  useEffect(()=>{
    const owner=root.current?.querySelector<HTMLInputElement>("input")?.form;if(!owner)return;const timers=new Set<ReturnType<typeof setTimeout>>();
    const reset=(event:Event)=>{const timer=setTimeout(()=>{timers.delete(timer);if(event.defaultPrevented)return;if(value===undefined)setLocal(copy(initial.current));setProposal(undefined);},0);timers.add(timer);};
    owner.addEventListener("reset",reset);return()=>{owner.removeEventListener("reset",reset);timers.forEach(clearTimeout);};
  },[form,value===undefined]);
  const shared={form,required,disabled,readOnly,controlSize,precision,order,locale,minDate,maxDate,step,timeInterval:interval,status,hideFieldLabels:true};
  return <div {...props} ref={root} className={["flood-date-time-range-picker",className].filter(Boolean).join(" ")} onBlur={event=>{
    onBlur?.(event);if(!event.defaultPrevented&&!event.currentTarget.contains(event.relatedTarget as Node|null))setProposal(undefined);
  }}>
    <Fieldset legend={label} hideLabel={hideLabel} hint={description} disabled={disabled}>
      <Stack gap="4">
        <DateTimePicker {...shared} label={startLabel} dateLabel={startDateLabel} timeLabel={startTimeLabel} value={selected.start} defaultValue={initial.current.start} onValueChange={next=>change("start",next)} validationMessage={constraint}/>
        <DateTimePicker {...shared} label={endLabel} dateLabel={endDateLabel} timeLabel={endTimeLabel} value={selected.end} defaultValue={initial.current.end} onValueChange={next=>change("end",next)}/>
      </Stack>
    </Fieldset>
    {[[startDateName,selected.start.date],[startTimeName,selected.start.time],[endDateName,selected.end.date],[endTimeName,selected.end.time]].map(([name,part],index)=>name&&<input key={index} type="hidden" name={name} form={form} value={accepted?part:""} disabled={disabled}/>)}
  </div>;
});
