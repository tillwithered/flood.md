# Calendar

The month and year buttons switch the body of this calendar between days, months
and years. They do not open another layer. Choose a year to return to the days of
that year, or a month to return to its days. Navigation does not select a date or
close the surrounding DatePicker. Escape from a navigation view restores days;
Escape from days remains available to the surrounding layer.

`showViewControls={false}` retains a plain heading. `viewLabels` supplies `month`,
`year`, `previous` and `next` translations. The 0.2.8 source candidate consolidates
the unpublished MonthYearPicker into Calendar, replacing `showMonthYearPicker`
and `monthYearLabels` with these view controls.

## Selection precision

`granularity` defaults to `day`. Use the same Calendar for choosing a month or a
year. Values, defaults, bounds and callback values match the selected precision:

| granularity | Value and bounds | Initial view |
| --- | --- | --- |
| `day` | `YYYY-MM-DD` | Days |
| `month` | `YYYY-MM` | Months |
| `year` | `YYYY` | Years |

```tsx
<Calendar label="Reporting month" granularity="month" defaultValue="2026-10" />
<Calendar label="Reporting year" granularity="year" defaultValue="2026" />
```

In month mode, choosing a year returns to months; choosing a month commits it.
In year mode, choosing a year commits it. `onDateSelect` also receives the chosen
precision. RangeCalendar always selects days. `isDateDisabled` applies to day
selection only; month and year modes use their matching min/max bounds.

A Gregorian calendar with six stable week rows in day view. Calendar has no popup,
text input, form value or range-selection behavior; compose a date field and layer
around it when those are needed.

```tsx
import {Calendar} from "@flood-md/react";

<Calendar
  label="Delivery date"
  defaultValue="2026-10-26"
  today="2026-10-26"
  min="2026-01-01"
  max="2027-12-31"
  weekStartsOn={1}
/>
```

In day mode, `value` / `defaultValue` are ISO `YYYY-MM-DD` dates or `""`. Clicking or
pressing Enter/Space on an available day requests `onValueChange(date)`. Clicking
the selected day does not clear it. `onDateSelect(date)` reports every allowed
activation, including the already selected day; use it to close a composed picker
without misreporting a value change. Blocked/read-only/disabled activations do not
invoke either callback. Controlled selection stays owned by the host;
moving keyboard focus does not change selection.

`visibleMonth` / `defaultVisibleMonth` use `YYYY-MM`. Month navigation requests
`onVisibleMonthChange(month)`; selection and displayed month are separate axes.
The initial uncontrolled month follows the selected date, then today, clamped to
`min` / `max` unless `defaultVisibleMonth` is explicit. Pass `today` for deterministic
server rendering and tests. Otherwise the initial clock is today's UTC calendar
date, captured once per mounted calendar. Changing `value` does not implicitly
change the displayed month after mount; control `visibleMonth` for that behavior.

Arrow keys move by one day or week, with physical Left/Right reversed in RTL.
Home/End choose the start/end of the configured week. PageUp/PageDown move a month,
and Shift+PageUp/PageDown move a year, clamping the day to the destination month.
Native Tab traverses one roving day plus the available navigation controls. Month
navigation preserves focus on its button; keyboard navigation carries focus to
the requested day only after a controlled month change is accepted. A refused
month change preserves the currently focused day. `onKeyDown` runs first and can
prevent Flood's keyboard handling. IME/composing keys are ignored.

`min` / `max` are inclusive ISO dates. `isDateDisabled(date)` can block additional
days without embedding business rules in the library. Blocked dates retain their
accessible name and may receive arrow/pointer focus for discovery; they expose
`aria-disabled` and never select. Keyboard movement is bounded by min/max and
the supported domain `0001-01-01` through `9999-12-31`. Additional blocked dates
are not skipped, so long unavailable intervals do not cause unbounded searches.
`readOnly` preserves focus and navigation while blocking selection. `disabled`
and native disabled fieldsets disable the actual day and navigation buttons.

`locale` defaults to `en-US`. Month, weekday, day-number and accessible full-date
labels use built-in Intl formatters with **Gregorian calendar and UTC explicitly
selected**. `weekStartsOn` remains an explicit 0 (Sunday) through 6 (Saturday),
independent of locale. Translate `label`, `previousMonthLabel` and
`nextMonthLabel` for your interface. No alternative calendar system or implicit
locale-based week-start detection is promised.

`autoFocus` focuses the roving day when the calendar is visible. It also marks
that day for Flood Popover's initial-focus handling, so a calendar can be composed
inside a layer without focusing hidden content. The ref targets the root div.

The header and six date rows preserve a stable layout between months. Adjacent
month dates remain visible with subdued text. Today has a separate mark from the
persistent selected state. Seven responsive columns fit their host; allow roughly
22rem for a comfortable calendar, especially for touch. Enlarged text and narrow
hosts keep the columns in bounds instead of forcing page overflow. This component
does not submit a named form input or implement native required validation.
