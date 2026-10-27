# Select all

An aggregate checkbox derives its state from the selectable collection. Keep
unavailable rows outside that collection. This recipe adds no component export.

```tsx
"use client";
import {useState} from "react";
import {Checkbox, Stack} from "@flood-md/react";

export function Selection() {
  const items = ["Design", "Engineering", "Support"];
  const [selected, setSelected] = useState<string[]>([]);
  const all = items.every(item => selected.includes(item));
  const some = items.some(item => selected.includes(item));
  return <Stack gap="2">
    <Checkbox label="Select all" checked={all} indeterminate={some && !all}
      onChange={event => setSelected(event.currentTarget.checked ? [...items] : [])} />
    {items.map(item => <Checkbox key={item} label={item} checked={selected.includes(item)}
      onChange={event => {
        const checked = event.currentTarget.checked;
        setSelected(previous => checked ? [...previous, item] : previous.filter(value => value !== item));
      }} />)}
  </Stack>;
}
```

Read `checked` before scheduling an update if the event may outlive the handler.
For remote collections, specify whether Select all means the visible page,
filtered results or every record. A client-side array does not imply server-wide
selection. Keep selection counts and bulk-action permissions in the host.
