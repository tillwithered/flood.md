/** Gregorian civil dates, deliberately independent of Date, time zones and calendars. */
export type DateSegment = "year" | "month" | "day";
export type DateParts = Record<DateSegment, string>;
export const emptyDateParts = (): DateParts => ({year:"", month:"", day:""});
export function daysInMonth(year: number, month: number): number {
  return month === 2 ? (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28) : [4,6,9,11].includes(month) ? 30 : 31;
}
export function canonicalDate(parts: DateParts): string | undefined {
  if (!/^\d{1,4}$/.test(parts.year) || !/^\d{1,2}$/.test(parts.month) || !/^\d{1,2}$/.test(parts.day)) return;
  const y = Number(parts.year), m = Number(parts.month), d = Number(parts.day);
  if (y < 1 || y > 9999 || m < 1 || m > 12 || d < 1 || d > daysInMonth(y,m)) return;
  return `${String(y).padStart(4,"0")}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
export function parseDate(value: string): DateParts | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
  const [year,month,day] = value.split("-"); const parts = {year,month,day};
  return canonicalDate(parts) === value ? parts : undefined;
}
export const dateInRange = (value: string, min?: string, max?: string) => (!min || value >= min) && (!max || value <= max);
export const isEmptyDate = (parts: DateParts) => !parts.year && !parts.month && !parts.day;
export function stepDatePart(parts: DateParts, part: DateSegment, direction: number, edge?: "start" | "end"): DateParts {
  const next = {...parts}; const max = part === "year" ? 9999 : part === "month" ? 12 : daysInMonth(Number(parts.year) || 2000,Number(parts.month) || 1);
  const current = Number(parts[part]); const number = edge === "start" ? 1 : edge === "end" ? max : current ? (current - 1 + direction + max) % max + 1 : direction > 0 ? 1 : max;
  next[part] = String(number).padStart(part === "year" ? 4 : 2,"0");
  if (part !== "day" && Number(next.day)) next.day = String(Math.min(Number(next.day),daysInMonth(Number(next.year) || 2000,Number(next.month) || 1))).padStart(2,"0");
  return next;
}
