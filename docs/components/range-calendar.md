# RangeCalendar

One calendar selects one continuous, inclusive Gregorian interval. It shares
Calendar's original grid, six week rows, focus, RTL, navigation, Intl labels and
disabled-fieldset behavior.

```tsx
<RangeCalendar label="Travel dates" defaultValue={{start: "", end: ""}}
  today="2026-10-26" min="2026-01-01" max="2027-12-31"
  onValueChange={setRange} />
```

`DateRangeValue` is `{start: string; end: string}`. Each endpoint is an ISO
`YYYY-MM-DD` date or `""`; both empty is empty, one endpoint is partial. The first
available activation starts a range and the second completes it. An earlier
second date normalizes chronological order. Equal endpoints are allowed. After
completion, activating a day starts a new range. Hover and keyboard focus preview
an interval without committing values or marking preview-only dates selected.
Touch uses the same two activations, without requiring hover.

`onValueChange(range)` includes partial starts. `onRangeSelect(range)` reports a
completed allowed activation and can close a composed picker. Controlled hosts
must accept partial values to advance the two-phase selection. Refusing a partial
request preserves the owned range; refusing completion preserves the owned anchor.

`isDateDisabled(date)` blocks endpoints. **Interior disabled dates are allowed
unless `isRangeDisabled(range)` rejects the interval.** Supply an efficient
interval predicate for blackout periods or reservations that forbid crossing
unavailable days. This avoids scanning millions of dates on every hover. Rejected
completion keeps the anchor, announces unavailable and does not emit completion.
The selection remains one continuous interval, never disconnected dates. Min/max
are inclusive.

`rangeLabels={{chooseStart, chooseEnd, unavailable}}` localizes instructions.
Committed days expose `aria-selected`; the grid is multiselectable. Calendar's
`locale`, `weekStartsOn`, `today`, navigation labels, controlled `visibleMonth`,
`autoFocus`, `readOnly` and `disabled` retain their contracts. See
[Calendar](./calendar.md) for keyboard and Gregorian UTC details. No native form
submission, popup, duration limits, disconnected ranges or other calendars are
built in. Use DateRangeField for editable validation and DateRangePicker for a
single composed popup.
