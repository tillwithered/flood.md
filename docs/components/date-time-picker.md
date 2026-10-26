# DateTimePicker

Compose a DatePicker and TimePicker under one named Fieldset. This is a civil
date and wall-clock time, not a timezone-aware instant. The first version uses
independent date bounds and daily time bounds.

```tsx
<DateTimePicker
  label="Schedule"
  dateName="scheduledDate"
  timeName="scheduledTime"
  defaultValue={{date: "2026-10-26", time: "09:30"}}
  required
/>
```

Import DateTimePicker from `@flood-md/react` and the shared stylesheet once.
`value` / `defaultValue` have `{date, time}` shape; callbacks report that pair.
Empty or incomplete edits report an empty string for the affected part.
`dateName` and `timeName` submit separate canonical values. Both fields retain
their own validity and form-reset behavior. Optional fields may submit a partial
pair; use `required` when both are necessary. Validate relationships in the host.

`precision="second"` uses HH:mm:ss instead of HH:mm. `minDate` / `maxDate`
are YYYY-MM-DD; `minTime` / `maxTime` are clock bounds matching the precision.
`step` is measured in seconds. There is no UTC conversion, DST resolution or
combined datetime min/max. Preserve explicit timezone selection in your app.

`hideLabel` hides the group legend visually; the date and time keep their own
labels. `dateLabel`, `timeLabel`, `order` and `locale` adapt the presentation.
The pair stacks on narrow screens. `readOnly` preserves accepted values and
prevents editing; `disabled` excludes values from form submission.

`hideFieldLabels` visually hides individual date/time labels while retaining their
accessible names. DateTimeRangePicker uses this to avoid repeating four labels.

`timeInterval` sets suggestion spacing in seconds. The time popup uses the same
bounds and step as manual entry. `validationMessage` lets a parent composition
associate an additional native validation constraint with the date field.
