# TimePicker

A TimeField with a Popover containing a scrollable ListBox. Manual clock entry
and suggested times share one canonical value: HH:mm, or HH:mm:ss with
`precision="second"`. This is local clock time, without timezone conversion.

```tsx
<TimePicker label="Start time" name="startTime" defaultValue="09:30"
  min="08:00" max="18:00" interval={1800} />
```

Import from `@flood-md/react` and import its stylesheet once. `interval` is the
suggestion spacing in seconds; `step` controls valid manual entries. The interval
must be a positive multiple of the step and compatible with the precision. The
list supports at most 1,000 options. Manual entries need not occur in the list.

Arrow keys move through suggestions; Enter or a click confirms and closes.
Alt+ArrowDown opens from a time segment. Escape cancels without changing the
value. The popup follows the field width and preserves Popover focus behavior.

The compact popup uses minimal Popover chrome and a plain ListBox inside one
ScrollArea. It has no redundant title row or second scroll container, and opens
with the selected suggestion visible. Its trailing action matches DatePicker.

`value`/`defaultValue`/`onValueChange` follow TimeField. `open`, `defaultOpen` and
`onOpenChange` control the popup. `panelLabel` and `openTimeLabel` localize its
names. Readonly fields retain values and prevent opening; disabled fields do not
submit. Native reset restores the initial uncontrolled value unless cancelled.

Precision is part of the value format. For a controlled format change, provide a
matching canonical value. For an uncontrolled format switch, remount with
`key={precision}` and a matching default, rather than changing an initial-only
`defaultValue` on the existing instance.
