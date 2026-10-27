import {useEffect,useRef,useState} from "react";
import {Button,Grid} from "./index.js";

export interface CalendarPeriodChoice {value:string;label:string;name:string;selected:boolean;disabled:boolean;}
/** Internal Calendar view, not another picker or overlay. */
export function CalendarPeriodGrid({choices,label,onChoose,autoFocus,disabled,focusValue,readOnly}:{choices:CalendarPeriodChoice[];label:string;onChoose:(value:string)=>void;autoFocus:boolean;disabled:boolean;focusValue?:string;readOnly?:boolean}){
  const root=useRef<HTMLDivElement>(null);
  const first=choices.find(choice=>choice.value===focusValue&&!choice.disabled)??choices.find(choice=>choice.selected&&!choice.disabled)??choices.find(choice=>!choice.disabled);
  const [active,setActive]=useState(first?.value);
  const roving=choices.some(choice=>choice.value===active&&!choice.disabled)?active:first?.value;
  useEffect(()=>{if(autoFocus)root.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus({preventScroll:true});},[autoFocus]);
  return <Grid ref={root} columns={3} gap="1" className="flood-calendar__periods" role="group" aria-label={label}>
    {choices.map(choice=><Button key={choice.value} data-calendar-period={choice.value} className="flood-calendar__period-choice" size="sm" variant={choice.selected?"subtle":"ghost"}
      tabIndex={!disabled&&choice.value===roving?0:-1} disabled={disabled||choice.disabled} aria-disabled={readOnly||undefined} aria-pressed={choice.selected} aria-label={choice.name}
      onFocus={()=>setActive(choice.value)} onClick={()=>onChoose(choice.value)}>{choice.label}</Button>)}
  </Grid>;
}
