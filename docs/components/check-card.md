# CheckCard

A native checkbox inside a label that makes the entire content card clickable.
Use for independent options; use RadioCard when only one option may be chosen.

```tsx
<CheckCard
  label="Product updates"
  description="A monthly summary of new features."
  metadata="Monthly"
  name="updates"
  value="product"
/>
```

Import CheckCard from `@flood-md/react`, import shared styles once and render
within FloodRoot. `checked` / `defaultChecked` and `onChange` follow native
checkbox conventions. `indeterminate` is a host-derived mixed state, not a third
form value. The ref points to the native input; `id`, `name`, `form`, `required`,
disabled fieldsets, validity and form reset retain browser behavior.

`label` must be a nonempty string. `description`, `icon` and `metadata` are
optional noninteractive content. Do not nest buttons, links or editable controls
inside a card label. The label supplies the accessible name; description and
metadata supply the accessible description. Icons are decorative.

`readOnly` keeps the choice focusable, announces it as unavailable for changes,
blocks mouse/keyboard changes and bypasses required validation while preserving
its current form value. `disabled` excludes it from submission and Tab order.
`density="compact"` reduces padding. Focus uses the card perimeter; selected
state uses the existing selection surface and a visible native-style indicator.
