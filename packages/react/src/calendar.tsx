import {forwardRef,useEffect,useId,useImperativeHandle,useMemo,useRef,useState} from "react";
import type {ReactNode} from "react";
import type {CalendarProps} from "./index.js";
import {Button,IconButton,IconSlot,VisuallyHidden} from "./index.js";
import {CalendarPeriodGrid} from "./calendar-period-grid.js";
import {dateInRange,parseDate,daysInMonth} from "./date-value.js";
import {dateFromOrdinal,dateOrdinal,dateWeekday,formattingDate,lastDateOrdinal,monthParts,monthShift,moveDateMonth} from "./calendar-value.js";

const cx=(...values:Array<string|undefined|false>)=>values.filter(Boolean).join(" ");
const titleCase=(text:string,locale:string)=>text.replace(/^\p{L}/u,letter=>letter.toLocaleUpperCase(locale));
function ViewChevron(){return <IconSlot size="sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></IconSlot>;}
export interface CalendarDayMetadata {rangeStart?:boolean;rangeEnd?:boolean;inRange?:boolean;preview?:boolean;unavailable?:boolean;}
export interface CalendarGridProps extends Omit<CalendarProps,"value"|"defaultValue"|"onValueChange"|"onDateSelect"> {
  selectedDate?:string;
  isSelected?:(date:string)=>boolean;
  dayMetadata?:(date:string)=>CalendarDayMetadata;
  onDayActivate?:(date:string)=>void;
  onDayPreview?:(date:string|undefined)=>void;
  multiple?:boolean;
  footer?:ReactNode;
}
/** One original grid/focus engine shared by single-date and range calendars. */
export const CalendarGrid=/* @__PURE__ */ forwardRef<HTMLDivElement,CalendarGridProps>(function CalendarGrid({
  label,selectedDate="",isSelected,dayMetadata,onDayActivate,onDayPreview,multiple=false,footer,visibleMonth,defaultVisibleMonth,onVisibleMonthChange,
  min,max,disabled=false,readOnly=false,isDateDisabled,weekStartsOn=0,locale="en-US",autoFocus=false,
  granularity="day",showViewControls=true,viewLabels,today,previousMonthLabel="Previous month",nextMonthLabel="Next month",id:explicitId,className,onKeyDown,onBlur,onPointerLeave,...props
},forwardedRef){
  if(!label.trim()||!previousMonthLabel.trim()||!nextMonthLabel.trim())throw new Error("Flood Calendar requires nonempty calendar and navigation labels");
  for(const [key,date]of [["selectedDate",selectedDate],["min",min],["max",max],["today",today]]as const)if(date!==undefined&&(date!==""||key!=="selectedDate")&&!parseDate(date))throw new Error(`Flood Calendar ${key} must be a valid ISO Gregorian date`);
  for(const month of [visibleMonth,defaultVisibleMonth])if(month!==undefined&&!monthParts(month))throw new Error("Flood Calendar month must be YYYY-MM from 0001 to 9999");
  if(min&&max&&min>max)throw new Error("Flood Calendar min must not follow max");
  if(!Number.isInteger(weekStartsOn)||weekStartsOn<0||weekStartsOn>6)throw new Error("Flood Calendar weekStartsOn must be 0 to 6");
  const [clock]=useState(()=>today??new Date().toISOString().slice(0,10));
  const actualToday=today??clock,selected=selectedDate;
  const clampMonth=(month:string)=>min&&month<min.slice(0,7)?min.slice(0,7):max&&month>max.slice(0,7)?max.slice(0,7):month;
  const initialMonth=useRef(defaultVisibleMonth??clampMonth((selected||actualToday).slice(0,7)));
  const [localMonth,setLocalMonth]=useState(initialMonth.current),month=visibleMonth??localMonth;
  const baseView=granularity==="day"?"days":granularity==="month"?"months":"years";
  const [view,setView]=useState<"days"|"months"|"years">(baseView),[focusView,setFocusView]=useState(false);
  const year=Number(month.slice(0,4)),yearPage=(value:number)=>Math.min(9988,1+Math.floor((value-1)/12)*12);
  const [yearStart,setYearStart]=useState(()=>yearPage(year));
  const monthName=titleCase(new Intl.DateTimeFormat(locale,{calendar:"gregory",timeZone:"UTC",month:"long"}).format(formattingDate(`${month}-01`)),locale);
  const viewNames={month:viewLabels?.month??"Month",year:viewLabels?.year??"Year",previous:viewLabels?.previous??"Previous",next:viewLabels?.next??"Next"};
  if(!Object.values(viewNames).every(text=>text.trim()))throw new Error("Flood Calendar view labels must be nonempty");
  const firstDate=`${month}-01`,firstOrdinal=dateOrdinal(firstDate),startOrdinal=firstOrdinal-((dateWeekday(firstDate)-weekStartsOn+7)%7);
  const [focused,setFocused]=useState(selected&&selected.slice(0,7)===month?selected:firstDate);
  const root=useRef<HTMLDivElement>(null),buttons=useRef(new Map<string,HTMLButtonElement>()),pendingFocus=useRef<string|undefined>(undefined);
  const generated=useId(),id=explicitId??`flood-calendar-${generated}`;
  useImperativeHandle(forwardedRef,()=>root.current!,[]);
  const [inheritedDisabled,setInheritedDisabled]=useState(false),effectiveDisabled=disabled||inheritedDisabled;
  const [direction,setDirection]=useState(props.dir??"ltr");
  const formatters=useMemo(()=>({month:new Intl.DateTimeFormat(locale,{calendar:"gregory",timeZone:"UTC",month:"long",year:"numeric"}),day:new Intl.DateTimeFormat(locale,{calendar:"gregory",timeZone:"UTC",weekday:"long",month:"long",day:"numeric",year:"numeric"}),weekday:new Intl.DateTimeFormat(locale,{calendar:"gregory",timeZone:"UTC",weekday:"short"}),weekdayLong:new Intl.DateTimeFormat(locale,{calendar:"gregory",timeZone:"UTC",weekday:"long"}),number:new Intl.NumberFormat(locale,{useGrouping:false})}),[locale]);
  const monthLabel=formatters.month.format(formattingDate(firstDate));
  const dates=Array.from({length:42},(_,index)=>dateFromOrdinal(startOrdinal+index));
  const roving=dates.includes(focused)?focused:selected&&dates.includes(selected)?selected:firstDate;
  const blocked=(date:string)=>!dateInRange(date,min,max)||!!isDateDisabled?.(date);
  const daySelected=(date:string)=>isSelected?isSelected(date):selected===date;
  const attributes=(date:string|undefined)=>{const state=date?dayMetadata?.(date):undefined;return {"data-range-start":state?.rangeStart||undefined,"data-range-end":state?.rangeEnd||undefined,"data-in-range":state?.inRange||undefined,"data-range-preview":state?.preview||undefined,"data-range-unavailable":state?.unavailable||undefined};};
  const focusDay=(date:string)=>{setFocused(date);root.current?.ownerDocument.defaultView?.requestAnimationFrame(()=>buttons.current.get(date)?.focus({preventScroll:true}));};
  const requestMonth=(next:string)=>{if(next===month)return;if(visibleMonth===undefined)setLocalMonth(next);onVisibleMonthChange?.(next);};
  const switchView=(next:typeof view)=>{if(next==="years")setYearStart(yearPage(year));setFocusView(true);setView(next);};
  const restoreDays=()=>{setView(baseView);setFocusView(false);root.current?.ownerDocument.defaultView?.requestAnimationFrame(()=>{
    const target=baseView==="days"?buttons.current.get(roving):root.current?.querySelector<HTMLButtonElement>('[data-calendar-period][tabindex="0"]');target?.focus({preventScroll:true});
  });};
  const choosePeriod=(period:string)=>{
    if(effectiveDisabled)return;
    const target=clampMonth(view==="years"?`${period}-${month.slice(5)}`:period);
    pendingFocus.current=undefined;
    if((granularity==="month"&&view==="months")||granularity==="year"){
      if(readOnly)return;requestMonth(target);onDayActivate?.(view==="years"?`${period}-01-01`:`${period}-01`);return;
    }
    requestMonth(target);setView(baseView);setFocusView(false);
    root.current?.ownerDocument.defaultView?.requestAnimationFrame(()=>{
      if(baseView==="days")focusDay(`${visibleMonth??target}-01`);
      else root.current?.querySelector<HTMLButtonElement>('[data-calendar-period][tabindex="0"]')?.focus({preventScroll:true});
    });
  };
  useEffect(()=>{setView(baseView);setYearStart(yearPage(year));},[granularity]);
  useEffect(()=>{if(baseView==="years")setYearStart(yearPage(year));},[month]);
  const move=(date:string)=>{
    const targetMonth=date.slice(0,7);
    if(targetMonth!==month){pendingFocus.current=date;requestMonth(targetMonth);}else focusDay(date);
  };
  useEffect(()=>{
    const pending=pendingFocus.current;
    if(pending?.slice(0,7)===month){pendingFocus.current=undefined;focusDay(pending);}
    else setFocused(selected&&selected.slice(0,7)===month?selected:`${month}-01`);
  },[month]);
  useEffect(()=>{
    if(!autoFocus||effectiveDisabled)return;
    const frame=root.current?.ownerDocument.defaultView?.requestAnimationFrame(()=>{const node=root.current;if(node&&node.getClientRects().length&&node.ownerDocument.defaultView!.getComputedStyle(node).visibility!=="hidden")buttons.current.get(roving)?.focus({preventScroll:true});});
    return()=>{if(frame!==undefined)root.current?.ownerDocument.defaultView?.cancelAnimationFrame(frame);};
  },[autoFocus,effectiveDisabled]);
  useEffect(()=>{
    const node=root.current?.querySelector<HTMLInputElement>("input[data-calendar-disabled-probe]");if(!node)return;
    const update=()=>setInheritedDisabled(node.matches(":disabled"));update();
    const observer=new node.ownerDocument.defaultView!.MutationObserver(update);let ancestor=root.current?.parentElement;
    while(ancestor){if(ancestor.localName==="fieldset")observer.observe(ancestor,{attributes:true,attributeFilter:["disabled"]});ancestor=ancestor.parentElement;}
    return()=>observer.disconnect();
  },[disabled]);
  useEffect(()=>{
    const node=root.current;if(!node)return;
    const update=()=>setDirection(node.ownerDocument.defaultView!.getComputedStyle(node).direction);update();
    const observer=new node.ownerDocument.defaultView!.MutationObserver(update);let ancestor:HTMLElement|null=node;
    while(ancestor){observer.observe(ancestor,{attributes:true,attributeFilter:["dir"]});ancestor=ancestor.parentElement;}
    return()=>observer.disconnect();
  },[props.dir]);
  const previous=clampMonth(monthShift(month,-1)),next=clampMonth(monthShift(month,1));
  const previousDisabled=effectiveDisabled||month==="0001-01"||!!min&&month<=min.slice(0,7),nextDisabled=effectiveDisabled||month==="9999-12"||!!max&&month>=max.slice(0,7);
  const minYear=Number(min?.slice(0,4)??1),maxYear=Number(max?.slice(0,4)??9999);
  const periodPreviousDisabled=effectiveDisabled||(view==="years"?yearStart<=minYear:year<=minYear),periodNextDisabled=effectiveDisabled||(view==="years"?yearStart+11>=maxYear:year>=maxYear);
  const navigatePeriod=(offset:number)=>{if(view==="years")setYearStart(current=>Math.max(1,Math.min(9988,current+offset*12)));else requestMonth(clampMonth(monthShift(month,offset*12)));};
  const periodChoices=view==="days"?[]:Array.from({length:12},(_,index)=>{
    const value=view==="years"?String(yearStart+index).padStart(4,"0"):`${month.slice(0,4)}-${String(index+1).padStart(2,"0")}`;
    const monthStart=`${value}-01`,monthEnd=view==="months"?`${value}-${String(daysInMonth(year,index+1)).padStart(2,"0")}`:"";
    return {value,label:view==="years"?String(yearStart+index):titleCase(new Intl.DateTimeFormat(locale,{month:"short",calendar:"gregory",timeZone:"UTC"}).format(formattingDate(`2000-${String(index+1).padStart(2,"0")}-01`)),locale),
      name:view==="years"?String(yearStart+index):new Intl.DateTimeFormat(locale,{month:"long",year:"numeric",calendar:"gregory",timeZone:"UTC"}).format(formattingDate(monthStart)),
      selected:view==="years"?selected.slice(0,4)===value:selected.slice(0,7)===value,
      disabled:view==="years"?yearStart+index<minYear||yearStart+index>maxYear:Boolean(min&&monthEnd<min||max&&monthStart>max)};
  });
  return <div {...props} id={id} ref={root} className={cx("flood-calendar",className)} role="group" aria-label={label} data-disabled={effectiveDisabled||undefined} data-readonly={readOnly||undefined} data-view={view} data-calendar-direction={direction}
    onBlur={event=>{onBlur?.(event);if(event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget as Node))pendingFocus.current=undefined;}}
    onPointerLeave={event=>{onPointerLeave?.(event);if(event.defaultPrevented)return;const focused=root.current?.ownerDocument.activeElement as HTMLElement|null;onDayPreview?.(focused&&root.current?.contains(focused)?focused.dataset.calendarDate:undefined);}}
    onKeyDown={event=>{
      onKeyDown?.(event);if(event.defaultPrevented||event.nativeEvent.isComposing||event.keyCode===229||event.altKey||event.metaKey)return;
      if(event.key==="Escape"&&view!==baseView){event.preventDefault();event.stopPropagation();restoreDays();return;}
      const period=(event.target as HTMLElement).dataset.calendarPeriod;
      if(period&&view!=="days"){
        if(effectiveDisabled||event.ctrlKey)return;
        const index=periodChoices.findIndex(choice=>choice.value===period),rtl=direction==="rtl";
        const step=event.key==="ArrowUp"?-3:event.key==="ArrowDown"?3:event.key==="ArrowLeft"?(rtl?1:-1):event.key==="ArrowRight"?(rtl?-1:1):0;
        if(!step&&event.key!=="Home"&&event.key!=="End")return;
        event.preventDefault();let next=event.key==="Home"?0:event.key==="End"?periodChoices.length-1:index+step;
        while(next>=0&&next<periodChoices.length&&periodChoices[next].disabled)next+=step||(event.key==="Home"?1:-1);
        if(next>=0&&next<periodChoices.length)root.current?.querySelector<HTMLButtonElement>(`[data-calendar-period="${periodChoices[next].value}"]`)?.focus({preventScroll:true});
        return;
      }
      const target=event.target as HTMLButtonElement,date=target.dataset.calendarDate;if(!date||target.matches(":disabled")||effectiveDisabled)return;
      const rtl=root.current?.ownerDocument.defaultView?.getComputedStyle(root.current).direction==="rtl";
      let candidate:string|undefined;const ordinal=dateOrdinal(date);
      if(event.key==="ArrowLeft"||event.key==="ArrowRight")candidate=dateFromOrdinal(Math.min(lastDateOrdinal,Math.max(0,ordinal+(event.key==="ArrowLeft"?-1:1)*(rtl?-1:1))));
      else if(event.key==="ArrowUp"||event.key==="ArrowDown")candidate=dateFromOrdinal(Math.min(lastDateOrdinal,Math.max(0,ordinal+(event.key==="ArrowUp"?-7:7))));
      else if(event.key==="Home"||event.key==="End"){const offset=(dateWeekday(date)-weekStartsOn+7)%7;candidate=dateFromOrdinal(Math.min(lastDateOrdinal,Math.max(0,ordinal+(event.key==="Home"?-offset:6-offset))));}
      else if(event.key==="PageUp"||event.key==="PageDown")candidate=moveDateMonth(date,(event.key==="PageUp"?-1:1)*(event.shiftKey?12:1));
      if(!candidate||event.ctrlKey)return;
      event.preventDefault();if(min&&candidate<min)candidate=min;if(max&&candidate>max)candidate=max;move(candidate);
    }}>
    <span id={`${id}-label`} className="flood-visually-hidden">{label}</span>
    <input type="hidden" data-calendar-disabled-probe disabled={disabled}/>
    <div className="flood-calendar__header">
      <VisuallyHidden id={`${id}-month`} aria-live="polite" aria-atomic="true">{view==="years"?`${yearStart}–${Math.min(9999,yearStart+11)}`:view==="months"?year:monthLabel}</VisuallyHidden>
      <div className="flood-calendar__month">
        {showViewControls&&granularity==="day"?<Button variant="subtle" size="sm" disabled={effectiveDisabled} aria-label={`${viewNames.month}: ${monthName}`} aria-pressed={view==="months"} onClick={()=>view==="months"?restoreDays():switchView("months")}>{monthName}<ViewChevron/></Button>:granularity==="day"?<span>{monthName}</span>:null}{granularity==="day"?" ":null}
        {showViewControls&&granularity!=="year"?<Button variant="subtle" size="sm" disabled={effectiveDisabled} aria-label={`${viewNames.year}: ${year}`} aria-pressed={view==="years"} onClick={()=>view==="years"?restoreDays():switchView("years")}>{view==="years"?`${yearStart}–${Math.min(9999,yearStart+11)}`:year}<ViewChevron/></Button>:<span>{granularity==="year"?`${yearStart}–${Math.min(9999,yearStart+11)}`:year}</span>}
      </div>
      <div className="flood-calendar__navigation">
        <IconButton label={view==="days"?previousMonthLabel:`${viewNames.previous} ${viewNames.year}`} variant="ghost" size="sm" disabled={view==="days"?previousDisabled:periodPreviousDisabled} onClick={event=>{pendingFocus.current=undefined;if(!event.currentTarget.matches(":disabled")){if(view==="days")requestMonth(previous);else navigatePeriod(-1);}}}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></IconButton>
        <IconButton label={view==="days"?nextMonthLabel:`${viewNames.next} ${viewNames.year}`} variant="ghost" size="sm" disabled={view==="days"?nextDisabled:periodNextDisabled} onClick={event=>{pendingFocus.current=undefined;if(!event.currentTarget.matches(":disabled")){if(view==="days")requestMonth(next);else navigatePeriod(1);}}}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m10 6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></IconButton>
      </div>
    </div>
    <div className="flood-calendar__body">
    {view==="days"?<div className="flood-calendar__grid" role="grid" aria-labelledby={`${id}-label ${id}-month`} aria-readonly={readOnly||undefined} aria-multiselectable={multiple||undefined}>
      <div className="flood-calendar__week" role="row">{Array.from({length:7},(_,index)=>{const date=formattingDate(dateFromOrdinal(7+((weekStartsOn+index+6)%7))!);return <span className="flood-calendar__weekday" role="columnheader" key={index}><abbr title={formatters.weekdayLong.format(date)}>{titleCase(formatters.weekday.format(date),locale)}</abbr></span>;})}</div>
      {Array.from({length:6},(_,week)=><div className="flood-calendar__week" role="row" key={week}>{dates.slice(week*7,week*7+7).map((date,index)=><div {...attributes(date)} className="flood-calendar__cell" role="gridcell" key={date??`empty-${index}`} aria-selected={date?daySelected(date):undefined} aria-disabled={date?blocked(date)||undefined:undefined}>
        {date&&<button type="button" className="flood-calendar__day" data-calendar-date={date} data-selected={daySelected(date)||undefined} data-outside={date.slice(0,7)!==month||undefined} data-today={date===actualToday||undefined}
          ref={node=>{if(node)buttons.current.set(date,node);else buttons.current.delete(date);}} data-flood-autofocus={autoFocus&&date===roving||undefined} tabIndex={!effectiveDisabled&&date===roving?0:-1} disabled={disabled} aria-disabled={blocked(date)||readOnly||undefined} aria-label={formatters.day.format(formattingDate(date))} aria-current={date===actualToday?"date":undefined}
          onFocus={()=>{setFocused(date);if(!effectiveDisabled&&!readOnly)onDayPreview?.(date);}} onPointerEnter={event=>{if(event.pointerType!=="touch"&&!effectiveDisabled&&!readOnly)onDayPreview?.(date);}}
          onClick={event=>{if(effectiveDisabled||readOnly||blocked(date)||event.currentTarget.matches(":disabled"))return;move(date);onDayActivate?.(date);}}>{formatters.number.format(Number(date.slice(8)))}</button>}
      </div>)}</div>)}
    </div>
    :<CalendarPeriodGrid key={view} focusValue={view==="years"?String(year).padStart(4,"0"):month} choices={periodChoices} label={view==="years"?viewNames.year:`${viewNames.month}: ${year}`} onChoose={choosePeriod} autoFocus={focusView||autoFocus} disabled={effectiveDisabled} readOnly={readOnly&&(granularity==="year"||granularity==="month"&&view==="months")}/> }
    </div>
    {footer}
  </div>;
});

export const DateCalendar=/* @__PURE__ */ forwardRef<HTMLDivElement,CalendarProps>(function DateCalendar({value,defaultValue="",onValueChange,onDateSelect,granularity="day",min,max,isDateDisabled,...props},ref){
  const valid=(date:string)=>granularity==="day"?!!parseDate(date):granularity==="month"?!!monthParts(date):/^\d{4}$/.test(date)&&Number(date)>=1&&Number(date)<=9999;
  if(!["day","month","year"].includes(granularity))throw new Error("Flood Calendar granularity must be day, month or year");
  for(const date of [value,defaultValue,min,max])if(date!==undefined&&date!==""&&!valid(date))throw new Error("Flood Calendar values and bounds must match granularity");
  if(isDateDisabled&&granularity!=="day")throw new Error("Flood Calendar isDateDisabled applies only to day selection");
  const [local,setLocal]=useState(defaultValue),selected=value??local;
  const start=(date:string)=>granularity==="day"?date:granularity==="month"?`${date}-01`:`${date}-01-01`;
  const end=(date:string)=>granularity==="day"?date:granularity==="year"?`${date}-12-31`:`${date}-${String(daysInMonth(Number(date.slice(0,4)),Number(date.slice(5)))).padStart(2,"0")}`;
  return <CalendarGrid {...props} ref={ref} granularity={granularity} min={min?start(min):undefined} max={max?end(max):undefined} isDateDisabled={isDateDisabled} selectedDate={selected?start(selected):""} onDayActivate={date=>{const next=granularity==="day"?date:granularity==="month"?date.slice(0,7):date.slice(0,4);if(selected!==next){if(value===undefined)setLocal(next);onValueChange?.(next);}onDateSelect?.(next);}}/>;
});
