# MonthYearPicker

A controlled month navigator composed from Popover, Select and NumberInput.
It navigates Gregorian months without selecting a day.

```tsx
const [month, setMonth] = useState("2026-10");
<MonthYearPicker value={month} onValueChange={setMonth}
  min="2000-01" max="2050-12" />
```

Import the component from `@flood-md/react`, `useState` from React, and the shared
stylesheet once. Values and bounds use YYYY-MM; years range from 1 to 9999.
`locale` formats month names. `label`, `monthLabel`, `yearLabel` and `applyLabel`
localize the controls.

Changes remain drafts until Apply or Enter in the year field. Closing cancels
the draft. Out-of-range drafts cannot be applied. The host owns acceptance of
`onValueChange`; `disabled` prevents navigation.

Calendar uses this navigator by default. Set `showMonthYearPicker={false}` for
the plain month heading, or use `monthYearLabels` to localize navigation labels.
Previous/next month controls remain available. Navigation does not select a date.
