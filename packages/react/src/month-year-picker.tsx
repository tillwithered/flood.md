import {forwardRef,useId,useState} from "react";
import {Popover,Button,Select,NumberInput,Label,Stack,IconSlot,type MonthYearPickerProps} from "./index.js";
import {monthParts,formattingDate} from "./calendar-value.js";
export const MonthYearNavigation=/* @__PURE__ */ forwardRef<HTMLDivElement,MonthYearPickerProps>(function MonthYearNavigation({
  value,onValueChange,min,max,locale="en-US",disabled=false,label="Choose month and year",monthLabel="Month",yearLabel="Year",applyLabel="Apply",className,...props
},ref){
  if(!monthParts(value)||(min!==undefined&&!monthParts(min))||(max!==undefined&&!monthParts(max))||(min&&max&&min>max))throw new Error("Flood MonthYearPicker requires ordered canonical YYYY-MM values");
  if(![label,monthLabel,yearLabel,applyLabel].every(text=>text.trim()))throw new Error("Flood MonthYearPicker requires nonempty labels");
  const id=useId(),[open,setOpen]=useState(false),[year,setYear]=useState<number|null>(Number(value.slice(0,4))),[month,setMonth]=useState(value.slice(5));
  const formatted=new Intl.DateTimeFormat(locale,{month:"long",year:"numeric",calendar:"gregory",timeZone:"UTC"}).format(formattingDate(`${value}-01`));
  const monthFormatter=new Intl.DateTimeFormat(locale,{month:"long",calendar:"gregory",timeZone:"UTC"});
  const proposal=year!==null&&Number.isInteger(year)&&year>=1&&year<=9999?`${String(year).padStart(4,"0")}-${month}`:"";
  const valid=Boolean(proposal&&(!min||proposal>=min)&&(!max||proposal<=max));
  const apply=()=>{if(!valid||disabled)return;onValueChange?.(proposal);setOpen(false);};
  return <Popover {...props} ref={ref} title={label} open={open} onOpenChange={next=>{if(next){setYear(Number(value.slice(0,4)));setMonth(value.slice(5));}setOpen(next);}}
    disabled={disabled} className={["flood-month-year-picker",className].filter(Boolean).join(" ")}
    trigger={trigger=><Button {...trigger} variant="ghost" size="sm" className="flood-month-year-picker__trigger">{formatted}<IconSlot size="sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></IconSlot></Button>}>
    <Stack gap="3" onKeyDown={event=>{if(event.key==="Enter"&&(event.target as HTMLElement).matches("input")){event.preventDefault();apply();}}}>
      <Stack gap="1"><Label htmlFor={`${id}-month`}>{monthLabel}</Label><Select id={`${id}-month`} controlSize="sm" value={month} onChange={event=>setMonth(event.currentTarget.value)}>
        {Array.from({length:12},(_,index)=>{const code=String(index+1).padStart(2,"0"),candidate=`${String(year??1).padStart(4,"0")}-${code}`;return <option key={code} value={code} disabled={Boolean(min&&candidate<min||max&&candidate>max)}>{monthFormatter.format(formattingDate(`2000-${code}-01`))}</option>;})}
      </Select></Stack>
      <Stack gap="1"><Label htmlFor={`${id}-year`}>{yearLabel}</Label><NumberInput id={`${id}-year`} aria-label={yearLabel} controlSize="sm" value={year} min={Number(min?.slice(0,4)??1)} max={Number(max?.slice(0,4)??9999)} onValueChange={setYear}/></Stack>
      <Button variant="subtle" size="sm" disabled={!valid} onClick={apply}>{applyLabel}</Button>
    </Stack>
  </Popover>;
});
