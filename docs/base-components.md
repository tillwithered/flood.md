# Base component inventory · 0.2.0

The base dark design system exports **17 components: nine primitives and eight
native controls**. They use original Flood implementations, React 18.3/19 APIs
and TypeScript declarations. Import `@flood-md/react/styles.css` once and place
new compositions inside `FloodRoot`.

## Nine primitives

| Export | Responsibility |
| --- | --- |
| `FloodRoot` | Explicit neutral/dark scope; local Inter and semantic roles |
| `Text` | Body, compact, label and helper typography with semantic tone |
| `Heading` | Independent semantic heading level and large/page/section appearance |
| `Stack` | Vertical layout with token spacing |
| `Inline` | Wrapping horizontal layout and alignment |
| `Surface` | Default/raised/overlay visual surface with token padding |
| `Divider` | Semantic separator with a quiet decorative line |
| `IconSlot` | Sized adapter for a host-supplied SVG; optional accessible label |
| `IconButton` | Button composition with a required action label and decorative icon |

IconButton composes the Button control; this grouping describes how the base
kit is used, not a separate rendering engine. IconSlot supplies geometry rather
than glyph artwork. Preserve the license of any icon pack used by the host.

## Eight controls

| Export | Responsibility |
| --- | --- |
| `Button` | Native action, explicit submit/reset, loading and disabled behavior |
| `Input` | Native input props/ref and independent visual control sizing |
| `Textarea` | Native multiline input, resizing and validation styling |
| `Checkbox` | Native checkbox with a required visible label |
| `Radio` | Native radio with a visible label; the host owns group name and legend |
| `Switch` | Native checkbox behavior exposed with switch semantics |
| `Field` | Associates one input with label, required marker, hints and errors |
| `Link` | Native anchor for navigation |

## Sizes and states

Button/IconButton sizes are `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl` with
minimum heights equivalent to 24/28/32/40/44/48/56px at a 16px reference root.
Dimensions use rem; the host controls root sizing. Input/Textarea support
`controlSize` sm/md/lg/xl (32/40/44/48px equivalents). Input's native numeric
`size` prop retains its HTML meaning. Small visual controls still need adequate
non-overlapping touch targets; wrapping labels can increase their height.

Button defaults to solid/md and `type="button"`. Variants are solid, subtle,
outline and ghost. Use filled subtle for standalone secondary actions; ghost
requires a clear parent context. Hover/pressed are transient; persistent state
uses semantic attributes such as `aria-pressed`. Loading disables activation,
retains meaningful text and sets `aria-busy`.

Inputs preserve native value/defaultValue, name, required, readonly, disabled
and form behavior. Spread Field's function-child props onto its input to retain
IDs and descriptions. Validation rules, asynchronous work, announcements and
focus management belong to the host. State/callbacks and Field composition use
a client component in Next.js.

## Scope and customization

The base profile is dark only and contains 154 public semantic token roles.
Override `--flood-sys-*` variables on the foundation scope. The bundled Inter
font retains its OFL license. Legacy controls outside FloodRoot keep their
earlier light/dark contract; legacy variables do not automatically override the
new scoped roles.

Fields combine a quiet outline with a necessary stronger bottom boundary;
keyboard focus follows the field with a configurable 2px accent and no offset.
Keep focus visible in invalid/selected states. Test actual text contrast,
keyboard use, forced colors, reduced motion, narrow widths and enlarged text.
The [foundations guide](foundations.md) records APCA and small-text limitations.

Surface's overlay appearance does not implement a dialog or focus trap. This
base release supplies no menu/select/dialog engine, new light profile, material
effects or backend operations. The `/foundations` and `/team` Next.js examples
demonstrate local composition and form behavior without saving data or sending
invitations to a service. See [component API details](components.md).
