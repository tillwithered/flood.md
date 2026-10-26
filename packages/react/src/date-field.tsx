import {forwardRef, useEffect, useId, useImperativeHandle, useRef, useState} from "react";
import type {DateFieldProps} from "./index.js";
import {resolveFieldStatus, mergeDescriptions} from "./field-state.js";
import {canonicalDate, dateInRange, daysInMonth, emptyDateParts, isEmptyDate, parseDate, stepDatePart, type DateParts, type DateSegment} from "./date-value.js";

const orders: Record<string, DateSegment[]> = {"month-day-year":["month","day","year"], "day-month-year":["day","month","year"], "year-month-day":["year","month","day"]};
const cx = (...values: Array<string | undefined | false>) => values.filter(Boolean).join(" ");

export const SegmentedDateField = forwardRef<HTMLDivElement, DateFieldProps>(function SegmentedDateField({
  label, hideLabel = false, value, defaultValue = "", onValueChange, min, max,
  required = false, readOnly = false, disabled = false, name, form, controlSize = "md",
  invalid = false, status, description, order = "month-day-year", segmentLabels, messages, end,
  id: explicitId, className, onBlur, onKeyDown, "aria-describedby": describedBy, "aria-invalid": ariaInvalid, ...props
}, forwardedRef) {
  if (!label.trim()) throw new Error("Flood DateField requires a nonempty label");
  for (const [key,entry] of [["value",value],["defaultValue",defaultValue],["min",min],["max",max]] as const) {
    if (entry !== undefined && entry !== "" && !parseDate(entry)) throw new Error(`Flood DateField ${key} must be an ISO Gregorian date from 0001 to 9999`);
  }
  if (min === "" || max === "" || (min && max && min > max)) throw new Error("Flood DateField requires an ordered nonempty date range");
  const ordered = orders[order];
  if (!ordered) throw new Error("Flood DateField order is unsupported");
  const labels = {year:segmentLabels?.year ?? "Year",month:segmentLabels?.month ?? "Month",day:segmentLabels?.day ?? "Day"};
  if (!Object.values(labels).every(text => text.trim())) throw new Error("Flood DateField segment labels must be nonempty");
  if (messages && Object.values(messages).some(text => text !== undefined && !text.trim())) throw new Error("Flood DateField validation messages must be nonempty");
  const generated = useId(), id = explicitId ?? `flood-date-${generated}`;
  const root = useRef<HTMLDivElement>(null), bridge = useRef<HTMLInputElement>(null);
  const inputs = useRef<Partial<Record<DateSegment, HTMLInputElement | null>>>({});
  const lastFocused = useRef<DateSegment | undefined>(undefined);
  useImperativeHandle(forwardedRef, () => root.current!, []);
  const initial = useRef(defaultValue), [local, setLocal] = useState(defaultValue);
  const committed = value ?? local;
  const [parts, setParts] = useState<DateParts>(() => parseDate(committed) ?? emptyDateParts());
  const [touched, setTouched] = useState(false), [inheritedDisabled, setInheritedDisabled] = useState(false);
  const effectiveDisabled = disabled || inheritedDisabled;
  const composing = useRef<DateSegment | undefined>(undefined), compositionSnapshot = useRef(parts), lastPublished = useRef(committed);
  const settledParts = composing.current ? compositionSnapshot.current : parts;
  const canonical = canonicalDate(settledParts), empty = isEmptyDate(settledParts);
  const inRange = !!canonical && dateInRange(canonical,min,max);
  const candidate = empty ? "" : inRange ? canonical : undefined;
  const pendingAcceptance = value !== undefined && candidate !== undefined && candidate !== value;
  const message = pendingAcceptance ? messages?.invalid ?? "Enter a valid date." : empty ? (required ? messages?.required ?? "Enter a date." : "") : !canonical ? messages?.invalid ?? "Enter a valid date." : !inRange ? messages?.outOfRange ?? "Enter a date within the allowed range." : "";
  const current = useRef({value, committed, onValueChange, parts}); current.current = {value,committed,onValueChange,parts};
  useEffect(() => {
    if (value !== undefined && value !== lastPublished.current) setParts(parseDate(value) ?? emptyDateParts());
    if (value !== undefined) lastPublished.current = value;
  }, [value]);
  useEffect(() => {
    for (const part of ordered) inputs.current[part]?.setCustomValidity(part === ordered[0] && !effectiveDisabled && !readOnly ? message : "");
  }, [message,effectiveDisabled,readOnly,order]);
  useEffect(() => {
    const node = inputs.current[ordered[0]]; if (!node) return;
    const update = () => setInheritedDisabled(node.matches(":disabled")); update();
    const observer = new node.ownerDocument.defaultView!.MutationObserver(update);
    let ancestor = node.parentElement;
    while (ancestor) { if (ancestor.localName === "fieldset") observer.observe(ancestor,{attributes:true,attributeFilter:["disabled"]}); ancestor = ancestor.parentElement; }
    return () => observer.disconnect();
  }, [disabled,order]);
  useEffect(() => {
    const owner = bridge.current?.form; if (!owner) return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const reset = (event: Event) => { const timer = setTimeout(() => {
      timers.delete(timer);
      if (event.defaultPrevented) return;
      const next = current.current.value === undefined ? initial.current : current.current.committed;
      if (current.current.value === undefined) setLocal(next);
      setParts(parseDate(next) ?? emptyDateParts()); setTouched(false); lastPublished.current = next;
    },0); timers.add(timer); };
    owner.addEventListener("reset",reset);
    return () => {owner.removeEventListener("reset",reset);for (const timer of timers) clearTimeout(timer);};
  }, [form]);
  const select = (part: DateSegment) => { const node = inputs.current[part]; node?.focus(); node?.select(); };
  const change = (next: DateParts) => {
    if (readOnly || effectiveDisabled || inputs.current[ordered[0]]?.matches(":disabled")) return;
    setParts(next);
    const date = canonicalDate(next); const nextValue = date && dateInRange(date,min,max) ? date : "";
    if (value === undefined) setLocal(nextValue);
    if (lastPublished.current !== nextValue) {lastPublished.current = nextValue;onValueChange?.(nextValue);}
  };
  const edit = (part: DateSegment, raw: string) => {
    if (!/^\d*$/.test(raw)) return;
    const limit = part === "year" ? 4 : 2;
    const text = raw.slice(0,limit); change({...current.current.parts,[part]:text});
    if (text.length === limit && ordered.indexOf(part) < 2) select(ordered[ordered.indexOf(part)+1]);
  };
  const errorShown = touched && !effectiveDisabled && !readOnly && !!message;
  const resolvedStatus = resolveFieldStatus(status,invalid || errorShown,ariaInvalid);
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = errorShown ? `${id}-error` : undefined;
  return <div {...props} id={id} ref={root} className={cx("flood-date-field",className)} data-disabled={effectiveDisabled || undefined}
    onBlur={event => {
      onBlur?.(event);
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        setTouched(true);
        const date = canonicalDate(current.current.parts);
        const draft = isEmptyDate(current.current.parts) ? "" : date && dateInRange(date,min,max) ? date : undefined;
        if (value !== undefined && draft !== undefined && draft !== value) {setParts(parseDate(value) ?? emptyDateParts());lastPublished.current = value;}
      }
    }} onKeyDown={event => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.nativeEvent.isComposing || composing.current || event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLInputElement;
      const part = target.getAttribute("data-segment") as DateSegment | null;
      if (!part || inputs.current[part] !== target) return;
      const index = ordered.indexOf(part);
      const rtl = root.current && root.current.ownerDocument.defaultView!.getComputedStyle(root.current).direction === "rtl";
      const offset = (event.key === "ArrowLeft" ? -1 : 1) * (rtl ? -1 : 1);
      if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && index + offset >= 0 && index + offset <= 2) {event.preventDefault();select(ordered[index+offset]);return;}
      if (readOnly || effectiveDisabled || target.matches(":disabled")) return;
      if (["ArrowUp","ArrowDown","Home","End"].includes(event.key)) {event.preventDefault();change(stepDatePart(current.current.parts,part,event.key === "ArrowDown" ? -1 : 1,event.key === "Home" ? "start" : event.key === "End" ? "end" : undefined));target.select();}
      if (event.key === "Backspace" && !parts[part] && index > 0) {event.preventDefault();select(ordered[index-1]);}
    }}>
    <label className={cx("flood-label",hideLabel && "flood-visually-hidden")} id={`${id}-label`} htmlFor={`${id}-${ordered[0]}`}>{label}</label>
    <div className={cx("flood-date-field__control",`flood-control--${controlSize}`)} role="group" aria-labelledby={`${id}-label`} aria-describedby={mergeDescriptions(describedBy,descriptionId,errorId)}
      data-size={controlSize} data-status={resolvedStatus} data-readonly={readOnly || undefined} data-disabled={effectiveDisabled || undefined}
      onClick={event => {
        if (event.defaultPrevented || effectiveDisabled || (event.target as HTMLElement).closest("input,button,a,.flood-date-field__end")) return;
        const part = ordered.find(part => !parts[part]) ?? lastFocused.current ?? ordered[0];
        if (!inputs.current[part]?.matches(":disabled")) select(part);
      }}>
      {ordered.map((part,index) => <span className="flood-date-field__part" key={part}>
        {index > 0 && <span className="flood-date-field__separator" aria-hidden="true">/</span>}
        <input id={`${id}-${part}`} ref={node => {inputs.current[part] = node;}} className="flood-date-field__segment" data-segment={part}
          type="text" role="spinbutton" inputMode="numeric" autoComplete="off" spellCheck={false} form={form}
          aria-label={`${label}, ${labels[part]}`} aria-valuemin={1} aria-valuemax={part === "year" ? 9999 : part === "month" ? 12 : daysInMonth(Number(parts.year)||2000,Number(parts.month)||1)}
          aria-valuenow={parts[part] && Number(parts[part]) >= 1 && Number(parts[part]) <= (part === "year" ? 9999 : part === "month" ? 12 : daysInMonth(Number(parts.year)||2000,Number(parts.month)||1)) ? Number(parts[part]) : undefined}
          aria-valuetext={parts[part] || undefined} aria-invalid={resolvedStatus === "error" || undefined} aria-required={required || undefined}
          aria-describedby={mergeDescriptions(describedBy,descriptionId,errorId)}
          placeholder={part === "year" ? "YYYY" : part === "month" ? "MM" : "DD"}
          value={parts[part]} disabled={disabled} readOnly={readOnly}
          onFocus={event => { lastFocused.current = part; event.currentTarget.select(); }}
          onClick={event => event.currentTarget.select()}
          onChange={event => {if (composing.current === part) setParts(previous => ({...previous,[part]:event.target.value}));else edit(part,event.target.value);}}
          onCompositionStart={() => {compositionSnapshot.current = current.current.parts;composing.current = part;}}
          onCompositionEnd={event => {composing.current = undefined;edit(part,event.currentTarget.value);}}
          onPaste={event => {if (readOnly || effectiveDisabled) return;const parsed = parseDate(event.clipboardData.getData("text/plain").trim());if (parsed) {event.preventDefault();change(parsed);}}}
          onInvalid={() => setTouched(true)}/>
      </span>)}
      {end != null && <div className="flood-date-field__end">{end}</div>}
    </div>
    <input ref={bridge} type="hidden" name={name} form={form} value={inRange && (value === undefined || canonical === value) ? canonical : ""} disabled={disabled}/>
    {description && <div id={descriptionId} className="flood-date-field__description">{description}</div>}
    {errorShown && <div id={errorId} className="flood-date-field__error">{message}</div>}
  </div>;
});
