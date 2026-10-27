import type {DateRangeValue} from "./index.js";
import {dateInRange,parseDate} from "./date-value.js";

export const emptyDateRange=():DateRangeValue=>({start:"",end:""});
export const sameDateRange=(a:DateRangeValue,b:DateRangeValue)=>a.start===b.start&&a.end===b.end;
export function checkDateRange(range:DateRangeValue,name="value"):void{
  if(!range||typeof range.start!=="string"||typeof range.end!=="string"||[range.start,range.end].some(date=>date!==""&&!parseDate(date)))throw new Error(`Flood date range ${name} requires ISO Gregorian start/end dates or empty strings`);
}
export const completeDateRange=(range:DateRangeValue)=>!!range.start&&!!range.end&&range.start<=range.end;
export const orderedDateRange=(a:string,b:string):DateRangeValue=>a<=b?{start:a,end:b}:{start:b,end:a};
export const emptyRange=(range:DateRangeValue)=>!range.start&&!range.end;
export function availableDateRange(range:DateRangeValue,min?:string,max?:string,isDateDisabled?:(date:string)=>boolean,isRangeDisabled?:(range:DateRangeValue)=>boolean):boolean{
  return completeDateRange(range)&&dateInRange(range.start,min,max)&&dateInRange(range.end,min,max)&&!isDateDisabled?.(range.start)&&!isDateDisabled?.(range.end)&&!isRangeDisabled?.(range);
}
