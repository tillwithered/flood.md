# DatePicker

DatePicker combines Flood's segmented DateField with its Popover and Calendar.
Type the date or open the calendar using the trailing icon button. Available in
the unpublished 0.2.7 candidate; a source preview does not update an npm install.

```tsx
import {DatePicker} from "@flood-md/react";

<DatePicker
  label="Delivery date"
  name="delivery"
  defaultValue="2026-10-26"
  min="2026-01-01"
  max="2027-12-31"
  today="2026-10-26"
  required
/>
```

`value`/`defaultValue` are empty or valid Gregorian ISO `YYYY-MM-DD` dates. The
value contains no time or time zone. DateField owns segment editing, partial or
invalid drafts, native validity and the single named hidden form input. Calendar
selection updates that same value and requests that the popup close. Only a
complete date accepted by the field's bounds and controlled value is submitted;
an invalid draft never submits a previous date. `onValueChange` receives a valid
date or `""` as the date is cleared or becomes incomplete/invalid.

Use `value` with `onValueChange` for host-owned selection. A host may refuse a
requested date; the displayed committed value and submitted value remain governed
by the supplied value. Uncontrolled form reset restores the initial default date
without firing a change callback. A prevented reset preserves the current draft.
Controlled reset retains the host value. The explicit `form` attribute supports
controls placed outside their owning form.

`open`/`defaultOpen` and `onOpenChange` control disclosure independently of date
selection. Escape and outside interaction use the shared Popover behavior; Escape
returns focus to the trigger. `Alt+ArrowDown` inside the field opens the calendar.
The calendar initially focuses its active date and supports its own keyboard
navigation. A host can prevent the DatePicker key handler through `onKeyDown`.

`disabled`, a native disabled fieldset, and `readOnly` disable the calendar trigger
and prevent an interactive popup. Read-only date text remains focusable/selectable.
Disabling or making an open picker read-only requests closure. A controlled open
value cannot override the disabled/read-only restriction.

DateField's `order`, `segmentLabels`, `messages`, `status`, `invalid`, `hideLabel`,
description and size props keep their existing meanings. Calendar's `locale`
localizes month/day names; `weekStartsOn` sets the first weekday explicitly. It
does not change DateField's explicit segment order, ASCII digits or `/` separators.
Customize `calendarLabel`, `openCalendarLabel`, `previousMonthLabel` and
`nextMonthLabel` for the host language. Defaults name the popup and trigger from
the field label. `today` supplies a deterministic ISO date for rendering and tests.

The ref targets DateField's root div. This composition adds no date-range,
non-Gregorian calendar, time-zone, backend or validation service API.

The calendar panel uses the full field as its geometry reference rather than the icon button. It matches wider fields and has a preferred minimum of 20rem for readable calendar content when the field is narrower. ResizeObserver tracks responsive field changes; available visual viewport width takes precedence over that minimum. TimePicker and selection lists keep their own width contracts.
