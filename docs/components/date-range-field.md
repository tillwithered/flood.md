# DateRangeField

Two original DateFields form one labelled range, with relationship validation and
atomic native form values. There is no popup.

```tsx
<DateRangeField label="Travel dates" startName="departure" endName="return"
  defaultValue={{start: "2026-10-10", end: "2026-10-14"}}
  min="2026-01-01" max="2027-12-31" required />
```

`value` / `defaultValue` use `DateRangeValue`: `{start, end}`, each a valid ISO
Gregorian date or `""`. Empty and partial endpoints are supported. Reversed
complete dates remain editable invalid drafts; typing does not silently swap
endpoints. Equal dates are allowed. `onValueChange` includes partial and invalid
relationship drafts, while each endpoint remains canonical or empty.

`startName` and `endName` are separate native names. Only a complete, ordered,
available, accepted pair submits both dates. Empty optional ranges submit both
empty strings. Partial, reversed, out-of-bounds or unavailable ranges submit
**both empty strings** and block native submission through a visible DateField
segment. No old endpoint is submitted beside a new one. Native calendar,
required and IME validity stay owned by DateField; `validationMessage` adds the
relationship declaratively without a hidden validation proxy or overriding an
invalid-date message.

`isDateDisabled` blocks endpoints; `isRangeDisabled` validates the whole interval.
Disabled interior dates do not automatically reject a range. Use the same
predicates in a calendar when business rules forbid crossing them.
`rangeMessages={{incomplete, reversed, unavailable}}` localizes relationships;
DateField's `messages` localizes required, invalid and bounds messages.

`label` names the range. `startLabel` / `endLabel` default to Start date / End date
and distinguish accessible segment names. Endpoint labels are visually hidden;
`hideLabel` hides the main label. `order`, `segmentLabels`, `controlSize`, `status`,
`invalid`, `description`, native `form`, readonly, disabled and fieldsets retain
their field contracts. The pair stacks inside narrow containers. `end` is an
addon on the end endpoint, intended for composition. Ref targets the root div.

Controlled hosts may accept or refuse drafts. Refused valid pairs and optional
clears block submission until accepted and revert to the owned value on leaving
the whole range. Incomplete/invalid text remains for correction. Native reset
restores uncontrolled defaults without callbacks; controlled fields restore their
owned value. Cancelled resets preserve drafts. `onKeyDown` runs before endpoint
handling and can prevent it. See [DateField](./date-field.md) for segment keys,
ASCII digit/locale limits and the Gregorian domain 0001 through 9999.
