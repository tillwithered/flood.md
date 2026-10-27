# TreeSelect

Choose one value from a hierarchy in a popup. TreeSelect composes Flood's Tree,
Popover and ScrollArea. It adds a named form value without turning an ordinary
navigation tree into a form control.

```tsx
import { TreeSelect } from "@flood-md/react";

<TreeSelect
  label="Destination"
  name="destination"
  required
  items={[
    { value: "design", label: "Design", selectable: false, children: [
      { value: "foundations", label: "Foundations" },
      { value: "components", label: "Components" },
    ] },
    { value: "engineering", label: "Engineering" },
  ]}
/>
```

The first version supports single selection. Values must be globally unique,
nonempty strings; labels must be nonempty. Set `selectable={false}` on a branch
used only to organize choices. Item expansion and selection remain separate.
`disabled`, `readOnly` and `selectable` on individual TreeItem objects have the
same meaning as in Tree. Data loading remains the host's responsibility.

Use `value` / `onValueChange` for controlled selection or `defaultValue` for local
state. Unknown or removed values display the placeholder and submit an empty
value. A selected disabled/read-only item remains a valid existing value, but
cannot be chosen as a new selection. The component does not silently clear data
when its choices change. There is no search, multiple selection or clear action
in this first contract.

`name` submits exactly one canonical item value. `form` associates an external
form. `required` blocks an empty editable selection and returns focus to the
visible control. `readOnly` preserves submission, allows focus, prevents opening
and bypasses required validation. Disabled controls, including controls inside a
disabled fieldset, do not submit or open. Form reset restores an uncontrolled
default value and closes the popup; a cancelled reset leaves it unchanged.

Enter, Space or Arrow Down on the trigger opens the popup. Inside, Tree handles
Arrow Up/Down, Home/End, typeahead and logical left/right expansion. Enter or Space
chooses the focused item. Escape closes and restores trigger focus. Tab and
outside interaction follow Popover's nonmodal dismissal behavior. Ancestors of
the initial selection start expanded. Supply `defaultExpandedValues`,
or control `expandedValues` / `onExpandedValuesChange`, for other initial paths.

The label stays accessible when `hideLabel` hides it visually. `controlSize`
supports sm/md/lg/xl. `invalid` and `status` use the shared field status recipe;
they do not invent validation rules. Use `invalidSelectionMessage` to localize
the required message. `placeholder` and `emptyMessage` are localizable too.
The ref points to the root div; focus the button inside it when composing a host
error summary.
