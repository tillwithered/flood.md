import {forwardRef,useEffect,useState} from "react";
import type {DateRangeValue,RangeCalendarProps} from "./index.js";
import {CalendarGrid} from "./calendar.js";
import {availableDateRange,checkDateRange,completeDateRange,emptyDateRange,orderedDateRange,sameDateRange} from "./date-range-value.js";

export const DateRangeCalendar=/* @__PURE__ */ forwardRef<HTMLDivElement,RangeCalendarProps>(function DateRangeCalendar({
  value,defaultValue=emptyDateRange(),onValueChange,onRangeSelect,isRangeDisabled,rangeLabels,
  min,max,isDateDisabled,className,...props
},ref){
  checkDateRange(defaultValue,"defaultValue");if(value!==undefined)checkDateRange(value);
  const [local,setLocal]=useState(defaultValue),range=value??local;
  const [preview,setPreview]=useState<string|undefined>();
  const anchor=range.start||range.end,partial=!range.start||!range.end;
  const tentative=anchor&&partial&&preview?orderedDateRange(anchor,preview):undefined;
  const available=(next:DateRangeValue)=>availableDateRange(next,min,max,isDateDisabled,isRangeDisabled);
  const unavailable=!!tentative&&!available(tentative);
  const labels={chooseStart:rangeLabels?.chooseStart??"Choose a start date.",chooseEnd:rangeLabels?.chooseEnd??"Choose an end date.",unavailable:rangeLabels?.unavailable??"This date range is unavailable."};
  if(!Object.values(labels).every(text=>text.trim()))throw new Error("Flood RangeCalendar labels must be nonempty");
  useEffect(()=>setPreview(undefined),[range.start,range.end]);
  const visual=tentative??(completeDateRange(range)?range:anchor?{start:anchor,end:anchor}:undefined);
  return <CalendarGrid {...props} ref={ref} min={min} max={max} isDateDisabled={isDateDisabled}
    className={["flood-range-calendar",className].filter(Boolean).join(" ")}
    selectedDate={range.start||range.end} multiple
    isSelected={date=>completeDateRange(range)?date>=range.start&&date<=range.end:date===anchor}
    dayMetadata={date=>({rangeStart:visual?.start===date,rangeEnd:visual?.end===date,inRange:!!visual&&date>=visual.start&&date<=visual.end,preview:!!tentative&&date>=tentative.start&&date<=tentative.end,unavailable:unavailable&&!!tentative&&date>=tentative.start&&date<=tentative.end})}
    onDayPreview={setPreview} onDayActivate={date=>{
      const next=anchor&&partial?orderedDateRange(anchor,date):{start:date,end:""};
      if(next.end&&!available(next)){setPreview(date);return;}
      setPreview(undefined);
      if(!sameDateRange(next,range)){if(value===undefined)setLocal(next);onValueChange?.(next);}
      if(next.end)onRangeSelect?.(next);
    }}
    footer={<div className="flood-range-calendar__instruction" role="status" aria-live="polite">{unavailable?labels.unavailable:anchor&&partial?labels.chooseEnd:labels.chooseStart}</div>}/>
});
