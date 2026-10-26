# DateTimeRangePicker

Two DateTimePicker endpoints under a Fieldset, with an ordered civil range.
DatePicker, Calendar, TimePicker and their smaller controls retain their behavior.

```tsx
<DateTimeRangePicker label="Booking"
  defaultValue={{start: {date: "2026-10-27", time: "09:00"},
    end: {date: "2026-10-27", time: "18:00"}}}
  startDateName="startDate" startTimeName="startTime"
  endDateName="endDate" endTimeName="endTime" required />
```

Import from `@flood-md/react` and load its stylesheet once. `value`, `defaultValue`
and `onValueChange` use `{start: {date, time}, end: {date, time}}`. Dates use
YYYY-MM-DD; times use HH:mm or HH:mm:ss with `precision="second"`.

End may equal start, but cannot precede it. Incomplete, reversed or unaccepted
controlled edits exclude all four submitted values together. Optional blank
ranges are valid; `required` requires both complete endpoints. `minDate`,
`maxDate` and `step` constrain editing. `interval` configures time suggestions.
`incompleteMessage` and `reversedMessage` localize validation feedback.

The four names submit separate civil values, without UTC conversion, timezone
inference or DST resolution. Validate timezone and business rules in the host.
Readonly retains accepted complete ordered values; disabled excludes submission.
Native reset restores uncontrolled defaults and respects reset cancellation.

Use `hideLabel`, endpoint labels, field labels, `locale`, `order`, `controlSize`,
`description` and `status` to adapt the composition.
