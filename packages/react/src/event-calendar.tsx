import { forwardRef, useEffect, useRef, useState } from "react";
import { Button, Heading, IconButton, Popover, Stack, Text, type CalendarEvent, type EventCalendarProps } from "./index.js";
import { dateFromOrdinal, dateOrdinal, dateWeekday, formattingDate, monthParts, monthShift } from "./calendar-value.js";
import { parseDate } from "./date-value.js";


function DayOverflow({ dateLabel, events, labels, compact = false }: {
  dateLabel: string;
  events: readonly CalendarEvent[];
  labels: EventCalendarProps["labels"];
  compact?: boolean;
}) {
  const [activeId, setActiveId] = useState<string>();
  const active = events.find(event => event.id === activeId);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const returnTo = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (active) detailHeading.current?.focus({preventScroll:true});
    else if (returnTo.current) buttons.current.get(returnTo.current)?.focus({preventScroll:true});
  }, [active?.id]);
  const countText = compact ? labels?.events?.(events.length) ?? `${events.length} ${events.length === 1 ? "event" : "events"}`
    : labels?.more?.(events.length) ?? `+${events.length} more`;
  return (
    <Popover title={dateLabel} onOpenChange={open => { if (!open) { returnTo.current=undefined; setActiveId(undefined); } }} trigger={trigger => (
      <Button {...trigger} size="sm" variant={compact ? "subtle" : "ghost"} className="flood-event-calendar__event"
        aria-label={`${countText}, ${dateLabel}`}>
        {compact ? events.length : countText}
      </Button>
    )}>
      <Stack gap="2">
        {active ? (
          <>
            <Button size="sm" variant="subtle" onClick={() => setActiveId(undefined)}>{labels?.back ?? "Back"}</Button>
            <Heading level={4} size="group" ref={detailHeading} tabIndex={-1}>{active.title}</Heading>
            <div>{active.detail}</div>
          </>
        ) : events.map(event => event.detail ? (
          <Button key={event.id} size="sm" variant="ghost"
            ref={node=>{ if (node) buttons.current.set(event.id,node); else buttons.current.delete(event.id); }}
            onClick={() => { returnTo.current=event.id; setActiveId(event.id); }}>{event.title}</Button>
        ) : <Text key={event.id}>{event.title}</Text>)}
      </Stack>
    </Popover>
  );
}

/** A read-and-inspect month calendar for host-owned events and actions. */
export const EventCalendar = /* @__PURE__ */ forwardRef<HTMLDivElement, EventCalendarProps>(function EventCalendar({
  label, month, events, onMonthChange, today, locale = "en", weekStartsOn = 1, maxVisibleEvents = 2, labels, className, ...props
}, ref) {
  if (!monthParts(month)) throw new Error("Flood EventCalendar requires a month in YYYY-MM form");
  if (!Number.isInteger(maxVisibleEvents) || maxVisibleEvents < 0) {
    throw new Error("Flood EventCalendar requires a nonnegative number of visible events");
  }
  const start = `${month}-01`;
  const startOrdinal = dateOrdinal(start) - (dateWeekday(start) - weekStartsOn + 7) % 7;
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  const weekdayFull = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });
  const monthFormat = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC", calendar: "gregory" });
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC", calendar: "gregory" });
  const dayNumber = new Intl.NumberFormat(locale);
  const days = Array.from({ length: 7 }, (_, index) => formattingDate(`2024-01-${String(7 + (weekStartsOn + index) % 7).padStart(2, "0")}`));
  const previous = monthShift(month, -1);
  const next = monthShift(month, 1);
  const byDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    if (!parseDate(event.date) || !event.date.startsWith(month)) continue;
    const dayEvents = byDate.get(event.date);
    if (dayEvents) dayEvents.push(event);
    else byDate.set(event.date, [event]);
  }
  return (
    <div {...props} ref={ref} className={["flood-event-calendar", className].filter(Boolean).join(" ")}>
      <div className="flood-event-calendar__header">
        <Heading level={3} size="section" aria-live="polite">{monthFormat.format(formattingDate(start))}</Heading>
        <div className="flood-event-calendar__controls">
          <IconButton label={labels?.previous ?? "Previous month"} variant="ghost" disabled={previous === month} onClick={() => onMonthChange(previous)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
          </IconButton>
          <IconButton label={labels?.next ?? "Next month"} variant="ghost" disabled={next === month} onClick={() => onMonthChange(next)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
          </IconButton>
        </div>
      </div>
      <table className="flood-event-calendar__table" aria-label={label}>
        <thead><tr>{days.map(day => <th key={day.valueOf()} scope="col" aria-label={weekdayFull.format(day)}>{weekday.format(day)}</th>)}</tr></thead>
        <tbody>{Array.from({ length: 6 }, (_, week) => (
          <tr key={week}>{days.map((_, day) => {
            const date = dateFromOrdinal(startOrdinal + week * 7 + day);
            if (!date?.startsWith(month)) return <td key={day} />;
            const dateLabel = dateFormat.format(formattingDate(date));
            const dayEvents = byDate.get(date) ?? [];
            return (
              <td key={date} aria-label={dateLabel} aria-current={date === today ? "date" : undefined}>
                <div className="flood-event-calendar__day">
                  <Text size="label">{dayNumber.format(Number(date.slice(-2)))}</Text>
                  {dayEvents.length > 0 && <div className="flood-event-calendar__full-events">
                  {dayEvents.slice(0, maxVisibleEvents).map(event => event.detail ? (
                    <Popover key={event.id} title={event.title} trigger={trigger => (
                      <Button {...trigger} size="sm" variant="subtle" className="flood-event-calendar__event">{event.title}</Button>
                    )}>{event.detail}</Popover>
                  ) : <Text key={event.id} size="compact" className="flood-event-calendar__event">{event.title}</Text>)}
                  {dayEvents.length > maxVisibleEvents &&
                    <DayOverflow dateLabel={dateLabel} events={dayEvents.slice(maxVisibleEvents)} labels={labels} />}
                  </div>}
                  {dayEvents.length > 0 && <div className="flood-event-calendar__compact-events">
                    <DayOverflow dateLabel={dateLabel} events={dayEvents} labels={labels} compact />
                  </div>}
                </div>
              </td>
            );
          })}</tr>
        ))}</tbody>
      </table>
    </div>
  );
});
