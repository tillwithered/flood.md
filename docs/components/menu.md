# Menu preferences

Menu combines commands and controlled preferences in one action popup. Use Select,
Combobox or MultiSelect when the value belongs to a form field.

```tsx
const [notifications, setNotifications] = useState(true);
const [density, setDensity] = useState("compact");

<Menu label="View options"
  trigger={props => <Button {...props} variant="subtle">View options</Button>}
  items={[
    {id: "notifications", type: "checkbox", label: "Notifications",
      checked: notifications, onCheckedChange: setNotifications},
    {id: "divider", type: "separator"},
    ...["compact", "comfortable"].map(value => ({
      id: value, type: "radio" as const, group: "Density", label: value,
      checked: density === value, onCheckedChange: () => setDensity(value),
    })),
  ]}
/>
```

Checkbox items accept boolean or `"mixed"`. Activation requests `true` from a mixed
state. Radio items request `true` only when not already checked. The host updates
the state and keeps at most one checked radio per group. Group labels must be
nonempty and items in each radio group must be contiguous.

Preference items stay open on Enter, Space or click. Set `closeOnSelect` to dismiss
after activation. They do not call `onAction`. Ordinary commands still dismiss and
call `onAction`. Disabled items remain discoverable by keyboard but cannot activate.
Focus, typeahead and Escape follow the same contract for all three item types.

This compatible addition is part of the unpublished 0.2.7 source candidate.
