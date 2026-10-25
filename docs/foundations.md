# Foundations tokens · 0.2.4 source candidate

This guide describes the **0.2.4 source candidate** foundation exports. Keep Flood packages at
matching exact versions. Existing 0.1.1 installs use their earlier token contract.

Foundations separates fixed reference values (`ref`) from semantic roles (`sys`).
The compiler also supports component aliases (`comp`) and isolated experiments
(`exp`); no component-specific tokens are shipped in this first profile.

The 0.2.3 neutral dark profile has 168 public semantic roles. Five roles added
since 0.2.2 define scrollbar size, inset, minimum
thumb length and thumb/rest-hover colors. Geometry uses rem; the viewport stays
natively scrollable and overlay tracks reserve no layout gutter. Version 0.2.2 adds
`sys.type.display.*` (5.5rem size, 1.12 line height, 500 weight, -.04em tracking)
for marketing headings, `sys.type.lead.*` (1.375rem, 1.45, 400, -.01em) for
supporting marketing copy, and `sys.font.mono` for code. Existing product typography
retains its metrics. Responsive page composition remains the host's responsibility.

## Use the neutral dark profile

```tsx
import "@flood-md/tokens/foundations.css";

<section data-flood-foundations="neutral" data-flood-theme="dark">
  <p className="example">Content</p>
</section>;
```

```css
.example {
  color: var(--flood-sys-color-content-default);
  background: var(--flood-sys-color-surface-canvas);
}
```

Both attributes belong on the same scope element. This opt-in token stylesheet
defines tokens and `color-scheme`; React components adopt these roles inside
`FloodRoot` when the React stylesheet is imported. It does not enable an
incomplete light theme. The preset and theme are
separate dimensions. Only `neutral` + `dark` is currently supplied.

## Inspect names and decisions

```ts
import { tokenNames, type TokenName } from "@flood-md/tokens/foundations";

const role: TokenName = "sys.color.content.default";
const cssVariable = tokenNames[role]; // --flood-sys-color-content-default
```

`foundations.manifest.json` describes public roles, types, status, usage limits,
resolved values, aliases and dependencies for each supplied context. Internal
reference tokens are absent from the TypeScript lookup and are not listed as
public manifest entries; alias/dependency metadata can still name their IDs.
`neutral.dark.tokens.json` is a resolved diagnostic DTCG document including the
internal reference graph's values. Internal names are not customization promises.

The dark profile covers surfaces, content, filled primary/subtle actions,
contextual ghost actions, field and feedback colors, focus, typography, spacing,
radii, control sizing, motion and local stacking levels. Subtle content is for
short supplementary metadata, not a universal small-body-text color or an
automatic APCA pass. Required small helper text uses `sys.color.content.helper`.

### Role families

All IDs below have the `sys.` prefix; CSS names replace dots with hyphens and
prepend `--flood-`. The generated typed lookup is the complete contract.

| Family | Roles |
| --- | --- |
| `font` | `sans` (Inter, Arial, sans-serif), `mono` |
| `type` | `display`, `lead`, `large`, `page`, `section`, `body`, `compact`, `label`, `helper`, `control`; each has `size`, `line-height`, `weight`, `tracking` |
| `space` | `0`, `1`, `2`, `3`, `4`, `6`, `8`, `12`; one step = .25rem |
| `radius` | `field` 1rem, `block` 1.5rem, `surface` 2rem, `action` pill, `indicator` .375rem |
| `control` | `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`; each has `height`, `text-size`, `line-height`, `padding-inline`, `icon-size`, `gap` |
| `size` | `touch`, `choice`, `switch-width`, `switch-height`, `switch-thumb`, `indicator.sm/md/lg`, `keycap.sm/md/lg`, `container.sm/md/lg`, `grid.min-item` |
| `color.action` | `primary`, `subtle`, `on-surface`, `ghost`; each has `rest`, `hover`, `pressed`, `content`, `disabled`, `disabled-content`; destructive action content has its own `danger.content` |
| `color.field` | `background`, `border`, `boundary`, `content`, `placeholder`, `disabled`, `disabled-content` |
| `color.feedback` | `error`, `success`, `warning`, `info` |
| `color.selection` | `background`, `content` |
| `focus`, `stroke` | Focus width/offset and decorative stroke width; independent of field validation |
| `scrollbar` | `size`, `inset`, `min-thumb`; thumb colors live under color.scrollbar |
| `color` | Surface/content, decorative border/divider, accent, focus, loading placeholder, indicator track/fill/accent and scrollbar rest/hover |
| `motion` | `duration-fast`, `duration-normal`, `duration-reduced`, `easing` |
| `layer` | `base`, `sticky`, `popover`, `modal`, `toast` |

### Inter typography

Size equivalents assume a 16px root for illustration. Flood does not set the
host's root font size. Sizes use rem, line heights use ratios and tracking uses
em. Font weights are 400/500. The React stylesheet bundles the Inter variable
normal/italic fonts and their SIL Open Font License; it loads locally from the installed package.
The token-only stylesheet does not load fonts: token-only consumers supply
their own font setup with Latin/Cyrillic coverage as needed. Fallback metrics
can differ.

| Role | Size / line height | Weight | Tracking |
| --- | --- | --- | --- |
| display | 88 / 98.56 | 500 | -.04em |
| lead | 22 / 31.9 | 400 | -.01em |
| large | 32 / 40 | 500 | -.02em |
| page | 24 / 32 | 500 | -.02em |
| section | 20 / 28 | 500 | -.015em |
| body | 16 / 24 | 400 | -.01em |
| compact | 14 / 20 | 400 | -.01em |
| label | 13 / 18 | 400 | -.01em |
| helper | 12 / 18 | 400 | -.01em |
| control | 14 / 20 | 500 | -.005em |

Control heights are 24/28/32/40/44/48/56px equivalents. Their icon sizes are
14/16/16/20/20/24/24px equivalents. These are minimum visual heights, not fixed
clipping boxes. Touch target size, neighboring targets, long translations and
increased text spacing require separate checks. Small controls are not ordinary
text-field defaults.

### Boundaries, focus and motion

Version 0.2.3 uses the quiet `color.field.border` (#383838), matching the
container-outline tone, for ordinary Input, Textarea, Select, unchecked choices,
Switch and outline Button borders. It is one uniform perimeter, with no extra
bottom edge or inset contour. The stronger `color.field.boundary` (#8a8a8a)
remains available for an explicit contrast requirement; it is not the default.

The quiet outline and field fill do not reach 3:1 against neighboring dark
surfaces. This visual profile therefore does not establish WCAG 1.4.11 compliance
for controls whose recognition depends on those signals. Preserve labels and
evaluate the complete host composition; use a stronger role when required.
Text contrast and APCA guidance remain separate from outline styling.

A host can opt into stronger fields without overriding the independent focus role:

```css
/* Import after the Flood stylesheet; apply this attribute to FloodRoot. */
.flood-root[data-control-contrast="strong"] {
  --flood-sys-color-field-border: var(--flood-sys-color-field-boundary);
}
```

Error, selected and focus
states need semantic markup and a visible cue beyond color where applicable.

Focus uses `focus.width` 2px and `focus.offset` 0px. `color.focus.ring` currently
uses provisional pink #ff5ca8; it is configurable and is not a finalized brand
palette. It must remain visible when error or selected styles are present.
Color-pair tests cover supplied dark surfaces; these are not a whole-component
WCAG or APCA conformance claim. Validate text role, size and weight together.

For example, APCA `apca-w3` 0.1.9 gives white text on canvas Lc −106.77,
helper #ededed on canvas Lc −95.00 (overlay: −91.00), and subtle #b2b2b2 on
overlay Lc −55.54. These values do not certify the 12px/400 helper recipe:
that version's font lookup recommends approximately 15.5px at weight 400 for
Lc 95. Small helper text is a compact supporting role; provide readable main
instructions and validate the actual content, device and enlargement behavior.
Do not use subtle text or feedback accent colors for small required instructions
merely because a WCAG color-pair calculation passes.

Motion values are an initial interaction recipe: 100ms fast, 160ms normal,
0ms reduced, with state easing. Consumers must apply the reduced value under
`prefers-reduced-motion: reduce` and avoid relying on motion to convey state.
Layer values express local order only; they do not implement portals, trapping
focus, dismissal, scroll locking or an overlay stack.

## Override and scope

Override a public `sys` variable on its scope element, using inline styles or a
stylesheet loaded afterward. Aliases remain CSS `var()` references. Nested
scopes repeat both attributes so dependent aliases resolve against the nested
values rather than inheriting already computed aliases from the parent.

Arbitrary descendant overrides without a new scope are not supported. Portal
containers must explicitly receive the same scope attributes and overrides.
Changing an internal `ref` value is useful for diagnostics but not a stable API.

## Source and compiler profile

Only `packages/tokens/src/tokens.json` authors values. Its versioned Flood
envelope contains `legacy`, `sets.shared`, `sets.palette`, `sets.theme` and
`presets`. This envelope is not itself a DTCG Format document. Sets contain
nested tokens with explicit `$type`, `$value`, `$description` and `md.flood`
metadata. Build artifacts are generated and must not be edited.

The first compiler profile supports sRGB color, nonnegative px/rem dimension,
signed em dimension (for tracking),
ms/s duration, finite number, numeric fontWeight, fontFamily and cubicBezier.
Aliases refer to whole tokens using `{sys.color.content.default}` syntax.
Composite types, JSON Pointer references, group inheritance, density modifiers,
other color spaces and the full DTCG Resolver API are not supported; unsupported
input fails instead of being silently coerced. This is not a full DTCG
implementation or a claim of accessibility conformance.

Build rejects missing/cyclic references, mismatched types, overlapping sets,
invalid names and CSS-name collisions, disallowed layer dependencies,
cross-component aliases, and stable-to-experimental dependencies. All supplied
contexts must expose the same public role/type contract. Palette/reference
values are fixed; themes choose roles instead of changing reference values.

## Compatibility

Existing `@flood-md/tokens` JSON and `tokens.css` retain their shared/light/dark
contract and `--flood-*` names. Existing React controls outside `FloodRoot` keep
using those tokens; old custom overrides continue to apply there. Inside
`FloodRoot`, the dark foundation roles control the component recipe. Legacy
overrides do not automatically override separately scoped foundation roles.

Version 0.2.2 adds these exports without replacing an existing npm version.
Publication must be verified separately; source version numbers are not proof.


The 0.2.4 source candidate adds sixteen semantic roles, bringing the dark profile
to 184 roles. Existing role values remain unchanged:

- sys.color.accent.content and sys.color.loading.placeholder separate accent text
  and loading fills from focus and action states.
- sys.color.indicator.track/fill/accent and sys.size.indicator.sm/md/lg control
  bounded indicators without borrowing control or focus roles.
- sys.color.action.danger.content styles destructive actions independently from
  validation messages and keyboard focus.

- sys.size.keycap.sm/md/lg provide independent relative heights for keyboard hints.

- sys.size.container.sm/md/lg and sys.size.grid.min-item supply relative layout bounds.
