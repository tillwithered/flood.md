import { forwardRef, useImperativeHandle, useRef } from "react";
import { parseDate } from "./date-value.js";
import { mergeDescriptions } from "./field-state.js";
import type { TimestampProps, TooltipTriggerProps } from "./index.js";
import { AnchoredOverlay } from "./overlays.js";

export function parseInstant(value: string, owner = "Timestamp"): Date {
  const parts = /^(\d{4}-\d{2}-\d{2})(T(?:[01]\d|2[0-3]):[0-5]\d)(?::([0-5]\d)(?:\.(\d+))?)?(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(value);
  if (!parts || !parseDate(parts[1])) {
    throw new Error(`Flood ${owner} requires an ISO timestamp with an explicit offset`);
  }
  const [, date, time, seconds = "00", fraction, offset] = parts;
  const milliseconds = fraction ? `.${fraction.slice(0, 3).padEnd(3, "0")}` : "";
  return new Date(`${date}${time}:${seconds}${milliseconds}${offset}`);
}

const relativeUnits = [
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
] as const;

function formatTimestamp(dateTime: string, format: NonNullable<TimestampProps["format"]>, locale: string, timeZone: string, relativeTo?: string) {
  const civil = format === "date" && relativeTo === undefined && parseDate(dateTime);
  const event = civil ? new Date(`${dateTime}T00:00:00Z`) : parseInstant(dateTime);
  if (relativeTo !== undefined) {
    const seconds = (event.getTime() - parseInstant(relativeTo).getTime()) / 1000;
    const difference = Math.abs(seconds);
    if (difference < 4 * relativeUnits[0][1]) {
      const [unit, step] = relativeUnits.find(([, interval]) => difference >= interval) ?? relativeUnits[4];
      return new Intl.RelativeTimeFormat(locale, {numeric:"always", style:"short"}).format(Math.trunc(seconds / step), unit);
    }
  }
  const options: Intl.DateTimeFormatOptions = {timeZone:civil ? "UTC" : timeZone};
  if (format !== "time") options.dateStyle = "medium";
  if (format !== "date") options.timeStyle = "short";
  return new Intl.DateTimeFormat(locale, options).format(event);
}

export const EventTimestamp = /* @__PURE__ */ forwardRef<HTMLTimeElement, TimestampProps>(function EventTimestamp({
  dateTime, children, format = "date", relativeTo, showExactTime = false, timeZone = "UTC", lang, size = "helper", className, ...props
}, ref) {
  const locale = lang || "en";
  const content = children ?? formatTimestamp(dateTime, format, locale, timeZone, relativeTo);
  const hasExactTime = showExactTime && relativeTo !== undefined && !props.hidden;
  const time = useRef<HTMLTimeElement>(null);
  useImperativeHandle(ref, () => time.current!, [hasExactTime]);

  function renderTime(trigger?: TooltipTriggerProps) {
    return <time {...props}
      ref={node => { time.current = node; trigger?.ref(node); }}
      dateTime={dateTime} lang={children == null ? locale : lang}
      className={["flood-timestamp", className].filter(Boolean).join(" ")} data-size={size}
      data-exact-time={trigger ? "" : undefined}
      tabIndex={props.tabIndex ?? (trigger ? 0 : undefined)}
      aria-describedby={mergeDescriptions(props["aria-describedby"], trigger?.["aria-describedby"])}
      onPointerEnter={trigger ? event => { props.onPointerEnter?.(event); trigger.onPointerEnter?.(event); } : props.onPointerEnter}
      onPointerLeave={trigger ? event => { props.onPointerLeave?.(event); trigger.onPointerLeave?.(event); } : props.onPointerLeave}
      onFocus={trigger ? event => { props.onFocus?.(event); trigger.onFocus?.(event); } : props.onFocus}
      onBlur={trigger ? event => { props.onBlur?.(event); trigger.onBlur?.(event); } : props.onBlur}>
      {content}
    </time>;
  }

  if (!hasExactTime) return renderTime();
  const exact = new Intl.DateTimeFormat(locale, {
    timeZone, year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    second: "2-digit", timeZoneName: "short",
  }).format(parseInstant(dateTime));
  return <AnchoredOverlay kind="tooltip" inlineTooltip side="top" align="center" content={exact}
    lang={locale} dir={props.dir} trigger={renderTime} />;
});
