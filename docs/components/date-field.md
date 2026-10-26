# DateField

A single Gregorian calendar date entered through separate month, day and year
segments. This is a text date field, without a system date popup or calendar.

```tsx
import {DateField} from "@flood-md/react";

<DateField
  label="Delivery date"
  name="delivery"
  defaultValue="2026-10-26"
  min="2026-01-01"
  max="2027-12-31"
  required
/>
```

`value` / `defaultValue` are an empty string or a valid ISO `YYYY-MM-DD` date from
`0001-01-01` through `9999-12-31`. The calendar uses Gregorian leap-year rules;
there is no time, time zone or JavaScript Date conversion. Invalid initial dates
and reversed boundaries throw instead of silently normalizing.

`onValueChange(value)` receives a valid date inside `min` / `max`, or `""` when
the field is cleared, incomplete, invalid or outside its bounds. A partial draft
remains visible for correction. Out-of-range and partial dates never submit an
old hidden value. Optional empty fields are valid; optional incomplete fields are
invalid. The first segment holds native custom validity, so native form validation
blocks invalid submission and focuses an editable segment. `required` adds the
empty-date constraint. Error text appears after leaving the field or attempting
submission. `status` supports error, warning, success and info; `invalid` and
affirmative `aria-invalid` override advisory colors. Host validation is separate
from calendar validity. `validationMessage` adds a native application constraint
to the first visible segment and empties the named canonical value until cleared.
Own calendar, required, bounds and controlled-refusal messages take priority;
readonly/disabled retain native validation behavior. Use native submit handling
for application work after validation passes.

The segments are text inputs with spinbutton semantics and explicit numeric
bounds. Type ASCII digits, paste a full ISO date into any segment, use Up/Down to
step, Home/End for segment boundaries and Left/Right to select adjacent segments.
A completed two-digit month/day or four-digit year selects the next segment.
Month/year stepping clamps an existing day to the new month's last day; typing
an impossible date preserves the draft instead. Segments are individually tabbable.
IME composition is not stepped or advanced until composition ends.

`order` explicitly selects `month-day-year` (default), `day-month-year`, or
`year-month-day`. This first version uses ASCII digits and `/` separators; it does
not infer locale, implement other calendars or promise full international date
formatting. Customize segment names and validation messages:

```tsx
<DateField
  label="Дата доставки"
  order="day-month-year"
  segmentLabels={{day: "День", month: "Месяц", year: "Год"}}
  messages={{
    required: "Укажите дату.",
    invalid: "Проверьте дату.",
    outOfRange: "Дата вне доступного периода.",
  }}
/>
```

`hideLabel` hides only the visible label. The group and every segment retain their
names. `description` and `aria-describedby` associate supporting information;
provide a nonempty `label` even when visually hidden. The ref targets the root div;
`id` generates segment IDs ending in `-year`, `-month` and `-day`.

`readOnly` keeps text focusable/selectable while blocking edits. `disabled` and
native disabled fieldsets block changes and exclude the hidden canonical value
from FormData. `name` and `form` apply to the hidden successful input; only it
submits a named value. `controlSize` is sm/md/lg/xl with the same semantic sizing
as other fields. Touch layouts preserve the control's minimum touch height.

With controlled `value`, the host owns committed values. External changes replace
the draft; echoes of `onValueChange` preserve incomplete segment text. A refused
valid date or optional clear blocks native submission until accepted or reverted
when leaving the field. An invalid draft remains available for correction and
blocks native submission. Form reset restores uncontrolled
`defaultValue` without change callbacks; controlled fields return to their prop.
A cancelled reset leaves the draft untouched. There is no async validation,
date-range selection, date arithmetic across segments or calendar popup API.

Clicking the control background focuses the first incomplete segment, or the last focused segment when all segments are filled. Placeholder widths account for letter glyphs as well as tabular numbers. Visual date selection belongs to DatePicker/Calendar composition.
