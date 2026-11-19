# Cascader

Choose a specific leaf from categories that read naturally as successive
levels. Use TreeSelect when the relationships are better understood in an
expanded tree or the task requires selecting a branch itself.

```tsx
import {Cascader} from "@flood-md/react";

export function ShippingRegion() {
  return <Cascader label="Shipping region" name="region" options={[
    {id: "eu", label: "Europe", children: [
      {id: "de", label: "Germany"},
      {id: "fr", label: "France"},
    ]},
    {id: "asia", label: "Asia", children: [
      {id: "kz", label: "Kazakhstan"},
    ]},
  ]} />;
}
```

Options use nonempty IDs unique among their siblings. Pass the complete
leaf path to `value` or `defaultValue`. Opening a branch displays its
children without changing the accepted value. Choosing the leaf publishes
the path to `onValueChange` and closes the popup. A named form submits
the accepted path as a JSON array, or an empty string if no leaf is selected.

Use Up and Down within a column. Enter and Space open the active branch or
accept the active leaf. Left and Right move between levels according to
reading direction. Escape dismisses the popup and returns focus to the
trigger. At narrow widths the popup shows a single level with a Back action.
