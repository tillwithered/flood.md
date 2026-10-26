import {forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties} from "react";
import type {DatePickerProps} from "./index.js";
import {Calendar, DateField, IconButton, Popover} from "./index.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const triggerSizes = {sm:"xs", md:"sm", lg:"md", xl:"lg"} as const;

/** Calendar selection and keyboard date entry share one DateField value/form bridge. */
export const CalendarDatePicker = forwardRef<HTMLDivElement, DatePickerProps>(function CalendarDatePicker({
  value, defaultValue = "", onValueChange, open: controlledOpen, defaultOpen = false, onOpenChange,
  calendarLabel, openCalendarLabel, locale, weekStartsOn, today, previousMonthLabel, nextMonthLabel,
  label, disabled = false, readOnly = false, controlSize = "md", min, max, form,
  className, onKeyDown, ...props
}, forwardedRef) {
  const panelLabel = calendarLabel ?? `${label} calendar`;
  const triggerLabel = openCalendarLabel ?? `Open calendar: ${label}`;
  if (!panelLabel.trim() || !triggerLabel.trim()) throw new Error("Flood DatePicker calendar labels must be nonempty");
  const root = useRef<HTMLDivElement>(null);
  const positionReference = useRef<HTMLElement | null>(null);
  const [fieldWidth, setFieldWidth] = useState<number>();
  useImperativeHandle(forwardedRef, () => root.current!, []);
  const initial = useRef(defaultValue), [localValue, setLocalValue] = useState(defaultValue);
  const [localOpen, setLocalOpen] = useState(defaultOpen), [inheritedDisabled, setInheritedDisabled] = useState(false);
  const committed = value ?? localValue, requestedOpen = controlledOpen ?? localOpen;
  const blocked = disabled || readOnly || inheritedDisabled;
  const current = useRef({value, controlledOpen, onValueChange, onOpenChange, requestedOpen});
  current.current = {value, controlledOpen, onValueChange, onOpenChange, requestedOpen};
  const requestOpen = (next: boolean) => {
    if (current.current.controlledOpen === undefined) setLocalOpen(next);
    current.current.onOpenChange?.(next);
  };
  const nativeDisabled = () => root.current?.querySelector<HTMLInputElement>("input[data-segment]")?.matches(":disabled") ?? false;
  const changeDate = (next: string) => {
    if (blocked || nativeDisabled()) return;
    if (current.current.value === undefined) setLocalValue(next);
    current.current.onValueChange?.(next);
  };
  useBrowserLayoutEffect(() => {
    const control = root.current?.querySelector<HTMLElement>(".flood-date-field__control");
    if (!control) return;
    positionReference.current = control;
    const update = () => { const width = control.getBoundingClientRect().width; if (width > 0) setFieldWidth(previous => previous === width ? previous : width); };
    update();
    const view = control.ownerDocument.defaultView;
    const observer = view?.ResizeObserver ? new view.ResizeObserver(update) : undefined;
    observer?.observe(control);
    return () => { observer?.disconnect(); if (positionReference.current === control) positionReference.current = null; };
  }, []);
  useBrowserLayoutEffect(() => {
    const node = root.current; if (!node) return;
    const update = () => setInheritedDisabled(nativeDisabled());
    update();
    const observer = new node.ownerDocument.defaultView!.MutationObserver(update);
    let ancestor = node.parentElement;
    while (ancestor) {
      if (ancestor.localName === "fieldset") observer.observe(ancestor, {attributes:true, attributeFilter:["disabled"]});
      ancestor = ancestor.parentElement;
    }
    return () => observer.disconnect();
  }, [disabled]);
  useEffect(() => {
    if (blocked && current.current.requestedOpen) {
      if (current.current.controlledOpen === undefined) setLocalOpen(false);
      current.current.onOpenChange?.(false);
    }
  }, [blocked, requestedOpen]);
  useEffect(() => {
    const owner = root.current?.querySelector<HTMLInputElement>('input[type="hidden"]')?.form;
    if (!owner) return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const reset = (event: Event) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (event.defaultPrevented) return;
        if (current.current.value === undefined) setLocalValue(initial.current);
        if (current.current.requestedOpen) {
          if (current.current.controlledOpen === undefined) setLocalOpen(false);
          current.current.onOpenChange?.(false);
        }
      }, 0);
      timers.add(timer);
    };
    owner.addEventListener("reset", reset);
    return () => {owner.removeEventListener("reset", reset); for (const timer of timers) clearTimeout(timer);};
  }, [form]);
  return <DateField {...props} ref={root} label={label} value={committed} onValueChange={changeDate}
    disabled={disabled} readOnly={readOnly} controlSize={controlSize} min={min} max={max} form={form}
    className={["flood-date-picker", className].filter(Boolean).join(" ")}
    onKeyDown={event => {
      onKeyDown?.(event);
      if (!event.defaultPrevented && !event.nativeEvent.isComposing && event.keyCode !== 229 &&
        !blocked && !nativeDisabled() && event.altKey && !event.ctrlKey && !event.metaKey && event.key === "ArrowDown" &&
        (event.target as HTMLElement).matches("input[data-segment]")) {
        event.preventDefault(); requestOpen(true);
      }
    }}
    end={<Popover title={panelLabel} className="flood-date-picker__panel" align="end" positionReference={positionReference}
      style={{"--flood-date-picker-width": fieldWidth === undefined ? undefined : `${fieldWidth}px`} as CSSProperties}
      open={!blocked && requestedOpen} onOpenChange={requestOpen} disabled={blocked}
      trigger={trigger => <IconButton {...trigger} label={triggerLabel} variant="ghost" size={triggerSizes[controlSize]}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>
        </svg>
      </IconButton>}>
      <Calendar label={panelLabel} value={committed} min={min} max={max} locale={locale}
        weekStartsOn={weekStartsOn} today={today} previousMonthLabel={previousMonthLabel} nextMonthLabel={nextMonthLabel}
        autoFocus onValueChange={changeDate} onDateSelect={() => {
          if (blocked || nativeDisabled()) return;
          requestOpen(false);
        }} />
    </Popover>} />;
});
