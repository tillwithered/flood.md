import {canonicalDate, daysInMonth, parseDate, type DateParts} from "./date-value.js";

export function monthParts(month: string): DateParts | undefined {
  return /^\d{4}-\d{2}$/.test(month) ? parseDate(`${month}-01`) : undefined;
}
export function monthShift(month: string, delta: number): string {
  const parts = monthParts(month)!;
  const index = Math.min(9999 * 12 - 1,Math.max(0,(Number(parts.year)-1)*12 + Number(parts.month)-1 + delta));
  return `${String(Math.floor(index/12)+1).padStart(4,"0")}-${String(index%12+1).padStart(2,"0")}`;
}
export function dateOrdinal(date: string): number {
  const parts = parseDate(date)!;const year = Number(parts.year), month = Number(parts.month), previous = year-1;
  let days = previous*365 + Math.floor(previous/4) - Math.floor(previous/100) + Math.floor(previous/400);
  for (let m=1;m<month;m++) days += daysInMonth(year,m);
  return days + Number(parts.day)-1;
}
export const lastDateOrdinal = dateOrdinal("9999-12-31");
export function dateFromOrdinal(ordinal: number): string | undefined {
  if (ordinal < 0 || ordinal > lastDateOrdinal) return;
  let low=1,high=9999;
  while (low<high) {const middle=Math.ceil((low+high)/2);if (dateOrdinal(`${String(middle).padStart(4,"0")}-01-01`)<=ordinal) low=middle;else high=middle-1;}
  let remaining=ordinal-dateOrdinal(`${String(low).padStart(4,"0")}-01-01`), month=1;
  while (remaining>=daysInMonth(low,month)) {remaining-=daysInMonth(low,month);month++;}
  return canonicalDate({year:String(low),month:String(month),day:String(remaining+1)});
}
export const dateWeekday = (date: string) => (dateOrdinal(date)+1)%7;
export function moveDateMonth(date: string, delta: number): string {
  const parts = parseDate(date)!, month = monthShift(date.slice(0,7),delta), next = monthParts(month)!;
  return `${month}-${String(Math.min(Number(parts.day),daysInMonth(Number(next.year),Number(next.month)))).padStart(2,"0")}`;
}
/** Intl receives an actual UTC date without Date.UTC's special handling of years 0–99. */
export function formattingDate(date: string): Date {
  const parts = parseDate(date)!, result = new Date(0);
  result.setUTCFullYear(Number(parts.year),Number(parts.month)-1,Number(parts.day));result.setUTCHours(12,0,0,0);
  return result;
}
