# ColorPicker

An original, inline RGB editor composed from Flood's Input, Label and Slider.
It exposes one opaque color through a hex field, three keyboard-accessible RGB
channels and optional preset choices. No operating-system color dialog opens.

```tsx
import {ColorPicker} from "@flood-md/react";

<ColorPicker
  label="Brand color"
  name="brandColor"
  defaultValue="#ff4f9a"
  presets={["#ff4f9a", "#79a9ff", "#ffffff", "#181818"]}
  required
/>
```

`value` and `defaultValue` accept empty, `#rgb` or `#rrggbb`. Nonempty values and
presets must be valid opaque hex; unsupported values throw rather than silently
becoming black. `onValueChange` receives a normalized lowercase `#rrggbb` or an
empty string. Alpha, CSS colors, gradients, color-space conversion and an
eyedropper are outside this first API.

Use `value` with `onValueChange` for host-owned state. A host may refuse a change;
its supplied value continues to govern the sample, channels and form value.
Incomplete or invalid hex remains an editable draft without firing a callback.
An invalid draft blocks native form submission and contributes an empty named
value, never an old color. Valid short hex keeps its typed spelling while focused,
allowing continued entry of all six digits; blur normalizes the visible field to
the accepted color. The validation message appears after blur or native invalidation.
`required` rejects an empty color. `invalidMessage` supplies localized validation
copy. The forwarded ref points to the native hex input for focus and validity.

An uncontrolled form reset restores the initial default without firing a change
callback. A canceled reset preserves the edit; a controlled reset preserves the
host's value. The explicit `form` prop associates all native controls and the
single named canonical hidden value with an external form. Disabled controls
follow native fieldset behavior and are excluded from submission. `readOnly`
keeps the hex value selectable and prevents channel/preset edits; the accepted
color remains in form data and required validation does not block submission.

`hideLabel` visually hides the group name without removing its association.
`controlSize` controls the hex input's geometry; RGB sliders use the compact
shared slider recipe. `hexLabel`, `channelLabels` (red, green, blue order) and
`presetsLabel` provide localization. Presets are ordinary buttons with their hex
value as an accessible name and `aria-pressed` for selection, so they do not rely
on hue alone. The panel fits its parent and uses relative dimensions.
