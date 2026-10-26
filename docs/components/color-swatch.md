# ColorSwatch

A small, named sample of one opaque RGB color. The first contract accepts
`#rgb` and `#rrggbb`, normalizing both to six-digit lowercase hex. It deliberately
does not interpret CSS expressions, named colors, alpha or gradients.

```tsx
import {ColorSwatch} from "@flood-md/react";

<ColorSwatch value="#ff4f9a" label="Flood pink, #ff4f9a" size="md" />
```

`label` is required and becomes the image's accessible name. A color alone is
not a sufficient way to identify a choice or status; supply adjacent text when
the color carries meaning. Use `aria-hidden` for a redundant decorative sample.
The forwarded ref points to its span. `sm`, `md` and `lg` select sample geometry;
they do not introduce a click target. Wrap it in an appropriately named Button
when selection is intended, as ColorPicker does for presets.

ColorSwatch is presentation only: no callbacks, form value or implicit clipboard
action. Host styles can change geometry through `className` or `style`; the
validated `value` owns the sample's background color.
