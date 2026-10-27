# DateRangePicker

One DateRangeField and one RangeCalendar inside one Popover, selecting a single
continuous interval.

```tsx
<DateRangePicker label="Travel dates" startName="departure" endName="return"
  defaultValue={{start: "2026-10-10", end: "2026-10-14"}}
  today="2026-10-26" calendarLabel="Choose travel dates"
  openCalendarLabel="Choose dates" />
```

The first available date starts a partial range and keeps the popup open. The
second completes an ordered range and requests close. Earlier end gestures swap
endpoints; equal dates are allowed. Hover/focus previews do not commit. Typed
endpoints stay editable and do not silently reorder reversed text.

`value` / `defaultValue` and `onValueChange` use DateRangeValue, including partial
starts. Controlled hosts must accept partial values to advance selection. `open`,
`defaultOpen` and `onOpenChange` independently own the one popup. Escape or outside
dismissal keeps an accepted partial draft, which blocks submission until completed
or cleared. Native reset restores uncontrolled defaults and requests close;
cancelled reset does neither.

Alt+Down on an endpoint opens the calendar. Initial focus goes to the roving day;
Escape/completion restore the icon trigger through Popover. Readonly, disabled
and native disabled fieldsets block opening and selection. A later disabled state
dismisses the layer. The popup observes the full endpoint pair and clamps to the
viewport; its geometry reference is separate from its focus-restoration trigger.
Calendar uses the popup surface/inset instead of nesting another bordered card.

DateRangeField supplies atomic names, native forms, ordering, required, bounds,
status, IME and controlled-refusal validation. `isDateDisabled` blocks endpoints;
`isRangeDisabled` decides interval availability. Interior disabled dates are
allowed without that interval predicate. The same rules apply to typed ranges.

Translate `calendarLabel`, `openCalendarLabel`, navigation labels, `rangeLabels`,
endpoint labels, `segmentLabels`, `messages` and `rangeMessages` as needed. Intl
labels are Gregorian UTC with explicit `locale` and `weekStartsOn`; pass `today`
for deterministic rendering. See [RangeCalendar](./range-calendar.md) and
[DateRangeField](./date-range-field.md) for contracts and limits.
