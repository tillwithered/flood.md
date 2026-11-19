import { forwardRef } from "react";
import { StatusIndicator, Timestamp, VisuallyHidden, type DeadlineStatusProps, type DeadlineStatusState } from "./index.js";
import { parseInstant } from "./timestamp.js";

const deadlineUnits = [
  ["week", 604_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
  ["second", 1_000],
] as const;

const tones = {
  remaining: "neutral",
  "due-soon": "warning",
  "due-now": "warning",
  overdue: "error",
  paused: "neutral",
} as const;

function getState(remaining: number, warningWithinMinutes: number, paused: boolean): DeadlineStatusState {
  if (paused) return "paused";
  if (remaining < 0) return "overdue";
  if (remaining === 0) return "due-now";
  return remaining <= warningWithinMinutes * 60_000 ? "due-soon" : "remaining";
}

function formatDuration(ms: number, locale: string): string {
  const magnitude = Math.abs(ms);
  const [unit, step] = deadlineUnits.find(([, step]) => magnitude >= step) ?? deadlineUnits[4];
  return new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "short" })
    .format(Math.max(1, Math.floor(magnitude / step)));
}

function defaultLabel(state: DeadlineStatusState, duration: string): string {
  switch (state) {
    case "remaining": return `${duration} left`;
    case "due-soon": return `Due in ${duration}`;
    case "due-now": return "Due now";
    case "overdue": return `${duration} overdue`;
    case "paused": return "Paused";
  }
}

export const DueStatus = /* @__PURE__ */ forwardRef<HTMLSpanElement, DeadlineStatusProps>(function DueStatus(
  {
    deadline, now, paused = false, warningWithinMinutes = 0, timeZone = "UTC", size = "md",
    presentation = "label", showDeadline = true, formatStatus = defaultLabel, deadlineLabel = "Deadline",
    lang = "en", className, ...props
  },
  ref,
) {
  if (!Number.isFinite(warningWithinMinutes) || warningWithinMinutes < 0 || !deadlineLabel.trim()) {
    throw new Error("Flood DeadlineStatus requires a nonnegative warning threshold and a deadline label");
  }
  const instant = parseInstant(deadline, "DeadlineStatus");
  const reference = parseInstant(now, "DeadlineStatus");
  const remaining = instant.getTime() - reference.getTime();
  const state = getState(remaining, warningWithinMinutes, paused);
  const duration = state === "paused" || state === "due-now" ? "" : formatDuration(remaining, lang);
  const exact = new Intl.DateTimeFormat(lang, {
    timeZone, year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    second: "2-digit", timeZoneName: "short",
  }).format(instant);
  const year = new Intl.DateTimeFormat(lang, {timeZone, year: "numeric"});
  const sameYear = year.format(instant) === year.format(reference);
  const visibleTime = new Intl.DateTimeFormat(lang, {
    timeZone, year: sameYear ? undefined : "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", second: instant.getUTCSeconds() === 0 ? undefined : "2-digit",
    timeZoneName: "short",
  }).format(instant);

  return <span {...props} ref={ref} lang={lang} data-state={state}
    className={["flood-deadline-status", className].filter(Boolean).join(" ")}>
    <StatusIndicator label={formatStatus(state, duration)} presentation={presentation} size={size} tone={tones[state]}/>
    {showDeadline
      ? <Timestamp dateTime={deadline} lang={lang} timeZone={timeZone} relativeTo={now}
          aria-label={`${deadlineLabel}: ${exact}`} showExactTime={visibleTime !== exact}>{visibleTime}</Timestamp>
      : <VisuallyHidden>{deadlineLabel}: <Timestamp dateTime={deadline} lang={lang}>{exact}</Timestamp></VisuallyHidden>}
  </span>;
});
