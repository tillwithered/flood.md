# Base component inventory

The current source exports **29 components**, including the unreleased Select, ScrollArea,
Label, Fieldset, RadioGroup, CheckboxGroup, ButtonGroup, InputGroup, Toggle, ToggleGroup and SegmentedControl additions. Published 0.2.2
exports 18 components and does not include these eleven exports. They use original Flood implementations, React 18.3/19 APIs
and TypeScript declarations. Import `@flood-md/react/styles.css` once and place
new compositions inside `FloodRoot`.

## Structure and presentation

| Export | Responsibility |
| --- | --- |
| `Label` (unreleased source) | Native label association and an optional required marker |
| `FloodRoot` | Explicit neutral/dark scope; local Inter and semantic roles |
| `Text` | Lead, body, compact, label and helper typography with semantic tone |
| `Heading` | Independent semantic heading level and display/large/page/section appearance |
| `Stack` | Vertical layout with token spacing |
| `Inline` | Wrapping horizontal layout and alignment |
| `Surface` | Default/raised/overlay visual surface with token padding |
| `ScrollArea` (unreleased source) | Native viewport with inset overlay scrollbars; no content gutter |
| `Divider` | Semantic separator with a quiet decorative line |
| `IconSlot` | Sized adapter for a host-supplied SVG; optional accessible label |
| `IconButton` | Button composition with a required action label and decorative icon |
| `CodeSnippet` | Selectable wrapping code and an optional host-owned action slot |

IconButton composes the Button control; this grouping describes how the base
kit is used, not a separate rendering engine. IconSlot supplies geometry rather
than glyph artwork. Preserve the license of any icon pack used by the host.

## Controls and field composition in current source

| Export | Responsibility |
| --- | --- |
| `Toggle` (unreleased source) | Native pressed action with controlled/local state |
| `SegmentedControl` (unreleased source) | Native single choice in a shared inset surface, preserving forms and reset |
| `ToggleGroup` (unreleased source) | Optional single/multiple pressed actions with keyboard focus navigation |
| `ButtonGroup` (unreleased source) | Connected independent actions with ordinary Tab navigation |
| `InputGroup` (unreleased source) | One native input with host-owned start/end adornments |
| `Button` | Native action, explicit submit/reset, loading and disabled behavior |
| `Input` | Native input props/ref and independent visual control sizing |
| `Textarea` | Native multiline input, scrolling and validation styling |
| `Select` (unreleased source) | Custom single-select popup; native options/forms/ref bridge or inline native listbox |
| `Checkbox` | Native checkbox with a required visible label |
| `Radio` | Native radio with a visible label; the host owns group name and legend |
| `Switch` | Native checkbox behavior exposed with switch semantics |
| `RadioGroup` (unreleased source) | Single choice with group state and native radio semantics |
| `CheckboxGroup` (unreleased source) | Multiple choices with an array value and native checkbox semantics |
| `Fieldset` (unreleased source) | Native fieldset/legend, inherited disabled and group descriptions |
| `Field` | Associates one input with label, required marker, hints and errors |
| `Link` | Native anchor for navigation |

## Sizes and states

Button/IconButton sizes are `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl` with
minimum heights equivalent to 24/28/32/40/44/48/56px at a 16px reference root.
Dimensions use rem; the host controls root sizing. Input/Textarea/source Select support
`controlSize` sm/md/lg/xl (32/40/44/48px equivalents). Input's native numeric
`size` prop retains its HTML meaning. Small visual controls still need adequate
non-overlapping touch targets; wrapping labels can increase their height.

Source Select provides a custom single-choice trigger/listbox popup and preserves
native values/forms/ref through a select bridge. Numeric `size` and `multiple`
remain inline native listboxes without a dropdown chevron. Supply ordinary
option/optgroup children. This addition is not a published 0.2.2 export.

In current source, Checkbox/Radio draw Flood indicators on real native inputs;
forced colors restores native appearance. Glyphs keep a 1.125rem footprint and
.5rem label gap, with centered rows. Use explicit `Inline gap="4"` for a 1rem
gap between choices; Inline's default gap="2" stays unchanged. Keep Button
width intrinsic unless the host opts into a full-width action. The
[layout guide](layout.md) shows responsive widths and complete compositions.

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

## Additions in 0.2.2

`Heading size="display"` uses 5.5rem / 1.12, weight 500 and -.04em tracking.
Heading level remains independent of visual size; existing sizes are unchanged.
Responsive marketing layouts may refine the display size within their own scope.

`Text size="lead"` uses 1.375rem / 1.45, weight 400 and -.01em tracking for
introductory copy. The 1rem body role and its existing metrics are unchanged.

`CodeSnippet` accepts required `code: string`, optional `action: ReactNode` and
native div props/ref. Code is escaped, selectable and wraps without adding a
network or clipboard dependency. Provide a Button/IconButton and copy status
from the host when needed; the snippet does not announce a successful copy by itself.

These additions follow the explicitly selected pre-1.0 0.2.X policy: preserve
existing APIs/defaults and release compatible additions with matching declarations,
documentation and checks. Breaking changes require a separate version decision.

## Scope and customization

The base profile is dark only and contains 168 current-source public semantic token roles (163 in published 0.2.2).
Override `--flood-sys-*` variables on the foundation scope. The bundled Inter
font retains its OFL license. Legacy controls outside FloodRoot keep their
earlier light/dark contract; legacy variables do not automatically override the
new scoped roles.

Fields use one quiet field.border perimeter without a separate bottom edge;
keyboard focus follows the field with a configurable 2px accent and no offset.
Keep focus visible in invalid/selected states. Test actual text contrast,
keyboard use, forced colors, reduced motion, narrow widths and enlarged text.
The [foundations guide](foundations.md) records APCA and small-text limitations.

Surface's overlay appearance does not implement a dialog or focus trap. This
base release supplies no general menu/searchable-combobox/dialog engine, new light profile, material
effects or backend operations. The `/foundations` and `/team` Next.js examples
demonstrate local composition and form behavior without saving data or sending
invitations to a service. See [component API details](components.md).
