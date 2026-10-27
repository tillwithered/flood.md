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

The live playground separates action, preference and mixed examples. Keep destructive actions last in a separate group. Selection indicators occupy the trailing edge so combined icon/preference rows do not reserve two leading columns.

## Submenus

Use `type: "submenu"` with its own nonempty `items` array for a related group of
commands or preferences. All IDs remain unique across the tree. Each level has
its own radio groups, keyboard navigation and typeahead. Empty, separator-only
child menus, duplicate IDs and cyclic item arrays are rejected.

```tsx
<Menu
  label="Project actions"
  trigger={props => <Button {...props}>Project actions</Button>}
  items={[
    {id: "rename", label: "Rename"},
    {id: "export", type: "submenu", label: "Export", items: [
      {id: "export-pdf", label: "PDF"},
      {id: "export-text", label: "Plain text"},
    ]},
  ]}
  onAction={id => handleAction(id)}
/>
```

Right opens a submenu and Left returns to its parent in left-to-right layouts;
the keys reverse in RTL. Enter and Space also open it. Escape dismisses only the
deepest open level. A command requests dismissal of the whole tree; controlled
`open` can refuse this request. Checkbox/radio preferences keep their current
stay-open behavior at every level, unless `closeOnSelect` is set.

Tab leaves the whole tree for the next stop after the original root trigger;
Shift+Tab returns to that trigger. It does not navigate from an internal
tabindex=-1 submenu item. Focus changes deliberately made by the host are
preserved during cleanup.

Mouse hover uses a cancellable 150ms intent delay. Leaving an item before the
delay cancels opening; crossing another row briefly does not immediately switch
an existing submenu. Moving into an open child panel keeps it open. Clicking a
mouse-hover-opened parent keeps it open; touch taps explicitly toggle the child.
Disabled submenu parents remain discoverable by keyboard but cannot open.

Submenus use the same native top layer and floating material as Menu. Each
viewport handles its own long content; no blanket nowrap rule is added. Use
ContextMenu when activation belongs to a content region instead of a button.
