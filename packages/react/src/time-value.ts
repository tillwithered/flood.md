/** Clock times in one 24-hour day. No Date, locale conversion or timezone arithmetic. */
export type TimePrecision = "minute" | "second";
export type TimeSegment = "hour" | "minute" | "second";
export type TimeParts = Record<TimeSegment,string>;
export const emptyTimeParts = (): TimeParts => ({hour:"",minute:"",second:""});
export const isEmptyTime = (parts:TimeParts, precision:TimePrecision) => !parts.hour && !parts.minute && (precision === "minute" || !parts.second);
export function canonicalTime(parts:TimeParts, precision:TimePrecision): string | undefined {
  const names:TimeSegment[] = precision === "second" ? ["hour","minute","second"] : ["hour","minute"];
  if (names.some(name => !/^\d{1,2}$/.test(parts[name]) || Number(parts[name]) > (name === "hour" ? 23 : 59))) return;
  return names.map(name => parts[name].padStart(2,"0")).join(":");
}
export function parseTime(value:string, precision:TimePrecision): TimeParts | undefined {
  if (!(precision === "second" ? /^\d{2}:\d{2}:\d{2}$/ : /^\d{2}:\d{2}$/).test(value)) return;
  const [hour,minute,second=""] = value.split(":");
  const parts = {hour,minute,second};
  return canonicalTime(parts,precision) === value ? parts : undefined;
}
export const timeSeconds = (parts:TimeParts) => Number(parts.hour)*3600 + Number(parts.minute)*60 + Number(parts.second);
export const timeInRange = (value:string,min?:string,max?:string) => (!min || value >= min) && (!max || value <= max);
export const timeOnStep = (parts:TimeParts,step:number,min?:string,precision:TimePrecision="minute") => (timeSeconds(parts)-(min ? timeSeconds(parseTime(min,precision)!) : 0)) % step === 0;
function fromSeconds(seconds:number,precision:TimePrecision):TimeParts {
  return {hour:String(Math.floor(seconds/3600)).padStart(2,"0"),minute:String(Math.floor(seconds%3600/60)).padStart(2,"0"),second:precision === "second" ? String(seconds%60).padStart(2,"0") : ""};
}
export function stepTimePart(parts:TimeParts,precision:TimePrecision,part:TimeSegment,direction:number,step:number,min?:string,max?:string,edge?:"start"|"end"):TimeParts {
  const base = min ? timeSeconds(parseTime(min,precision)!) : 0;
  const ceiling = max ? timeSeconds(parseTime(max,precision)!) : precision === "second" ? 86399 : 86340;
  const last = Math.floor((ceiling-base)/step);
  if (edge) return fromSeconds(base+(edge === "start" ? 0 : last)*step,precision);
  if (isEmptyTime(parts,precision)) return fromSeconds(direction > 0 ? base : base+last*step,precision);
  const bounded = (name:TimeSegment) => /^\d{1,2}$/.test(parts[name]) ? Math.min(Number(parts[name]),name === "hour" ? 23 : 59) : 0;
  const current = bounded("hour")*3600 + bounded("minute")*60 + (precision === "second" ? bounded("second") : 0);
  const unit = part === "hour" ? 3600 : part === "minute" ? 60 : 1;
  const proposed = current + direction*Math.max(step,unit);
  const position = direction > 0 ? Math.ceil((proposed-base)/step) : Math.floor((proposed-base)/step);
  return fromSeconds(base+Math.max(0,Math.min(last,position))*step,precision);
}
