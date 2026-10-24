# Components

## Dark foundations · 0.2.1

This guide describes the **0.2.1** API. See the [base component inventory](base-components.md)
for the complete set. Existing 0.1.1 installs follow their version-specific guides.

Import the same stylesheet and wrap new compositions in `FloodRoot` to select
neutral/dark. Existing controls outside it retain legacy light/dark behavior.
This slice has no new light foundations profile.

```tsx
"use client";
import {
  Button, Field, FloodRoot, Heading, Inline, Input,
  Stack, Surface, Text,
} from "@flood-md/react";

export function DarkProfileForm() {
  return (
    <FloodRoot>
      <Surface>
        <Stack gap="6">
          <Stack gap="2">
            <Heading level={1}>Profile</Heading>
            <Text as="p" size="compact" tone="subtle">
              Choose how your name appears to your team.
            </Text>
          </Stack>
          <form>
            <Stack gap="4">
              <Field label="Name" hint="Shown on your profile" required>
                {(control) => (
                  <Input {...control} name="name" autoComplete="name" />
                )}
              </Field>
              <Inline>
                <Button type="submit">Save changes</Button>
                <Button variant="subtle" type="reset">Reset</Button>
              </Inline>
            </Stack>
          </form>
        </Stack>
      </Surface>
    </FloodRoot>
  );
}
```

Import `@flood-md/react/styles.css` once in Next `app/layout.tsx`. Field's function
child and state/callbacks belong in client components. Serializable compositions
may render from server components; the React entry retains its client boundary.

### Primitives

| Component | Props and defaults | Contract |
| --- | --- | --- |
| FloodRoot | Native div props | Explicit neutral/dark scope; does not mutate document theme |
| Text | `as`: span / p / div (span); `size`: body / compact / label / helper (body); `tone`: default / subtle / error / success / warning / info (default) | Typography; label size alone does not associate a control |
| Heading | `level`: 1–6 (2); `size`: large / page / section (page) | Semantic level is independent of visual size |
| Stack | `gap` (4), native div props | Vertical composition |
| Inline | `gap` (2); `align`: start / center / end / baseline (center) | Wrapping horizontal composition |
| Surface | `elevation`: default / raised / overlay (default); `padding` (6) | Visual container; overlay is not a dialog, portal, or focus trap |
| Divider | Native hr props | Semantic separator; grouping must not rely on its faint line alone |
| IconSlot | `size` (md); optional `label` | Host SVG adapter; decorative without label |
| IconButton | Required `label`; Button props; subtle by default | Names the action; child icon stays decorative |

Space keys are strings `"0"`, `"1"`, `"2"`, `"3"`, `"4"`, `"6"`, `"8"`, `"12"`:
0/4/8/12/16/24/32/48px equivalents at a 16px reference root. Actual dimensions
use rem and follow the host root size; Flood does not impose 16px or a 62.5% reset.

Inter is bundled locally with its original SIL OFL notice. No font CDN is needed.
The profile uses real 400/500 weights, automatic optical sizing and role-specific
line-height/tracking. At the reference root, text roles are body 16/24, compact
14/20, label 13/18, helper 12/18; headings are large 32/40, page 24/32, section
20/28. These are rem-based sizes, not fixed px. Hosts may override the font family.

IconSlot supplies geometry, not artwork or an icon-pack dependency. Supply a
licensed SVG from the host and retain its notices. Icons alongside visible text
remain decorative. IconButton requires a nonempty action label; an icon-only
button should not be named after the glyph. Avoid fixed inline SVG dimensions
that override slot sizing.

### Controls

| Component | Flood-specific props | Contract |
| --- | --- | --- |
| Button | `variant`: solid / subtle / outline / ghost; `size`: 2xs / xs / sm / md / lg / xl / 2xl; `loading` | Solid/md by default; native type defaults to button |
| Input | `invalid`; `controlSize`: sm / md / lg / xl (md) | Native name/type/required/autoComplete/ref and size remain available |
| Textarea | `invalid`; `controlSize`: sm / md / lg / xl (md) | Native rows/maxLength/form props and ref remain available |
| Field | `label`, `hint`, `error`, `id`, `required`, `describedBy`, function child | Spread supplied props onto one Input/Textarea |
| Checkbox | Required `label` | Native checkbox and visible label |
| Radio | Required `label` | Shared name and host fieldset/legend for a group |
| Switch | Required `label` | Native checkbox with switch semantics |
| Link | Native anchor props | Navigation rather than state-changing actions |

Reference Button minimum heights are 24/28/32/40/44/48/56px, implemented in rem.
Input/Textarea sizes use 32/40/44/48px equivalents. Wrapped content can grow;
touch targets need contextual verification. Field required shows a marker and
forwards native required. describedBy merges external description IDs with
hint/error IDs; preserve the supplied associations when composing the control.

Prefer subtle for standalone secondary actions. Ghost needs a clear parent
context, such as a toolbar. Selected is persistent state, not transient pressed.
Loading disables activation and sets aria-busy while retaining meaningful text;
the host owns completion announcements and focus management. Readonly is distinct
from disabled. Explain unavailable actions outside a disabled element when needed.

### Contrast and customization

Dark fields combine a quiet outline with a stronger bottom boundary. Keep the
necessary boundary or re-evaluate its replacement against actual neighboring
surfaces. Focus is a 2px accent boundary without offset or a second contour;
its configurable pink default is provisional, not a complete brand palette.
Invalid styling must not erase the focus indicator.

Host overrides come after the stylesheet and should target semantic
`--flood-sys-*` variables within FloodRoot. Decorative lines and necessary control
boundaries have distinct roles. WCAG non-text contrast applies to necessary
visual information; APCA text guidance depends on font size, weight and actual
foreground/background. Subtle text is not automatically suitable for every size.
Do not lower the opacity of a whole component to mute one border.

Verify keyboard use, labels, focus/invalid combinations, narrow screens, long
translations, text enlargement/spacing, forced colors and reduced motion in the
actual application. Fixture checks do not establish complete application
accessibility or WCAG 3 conformance.

## Native controls and compatibility

Checkbox, Radio and Switch require a visible label prop. Radios in a group share
a name and belong in a host fieldset/legend. Link forwards native anchor props;
use it for navigation. Native refs and form props are forwarded by the controls.
Flood does not fetch data, choose validation rules or persist application state.

The published 0.1.1 controls remain compatible outside FloodRoot with their older
theme variables. Their original API did not include the new primitives or the
seven-size foundations scale. Use 0.2 scoped roles inside FloodRoot rather than
expecting legacy theme overrides to change the new profile automatically.

The [TypeScript interfaces](../packages/react/src/index.tsx) define exact native
prop/ref types. Next.js examples include `/foundations` for form/state behavior
and `/team` for a composed team-settings screen with contextual actions. These
are runnable fixtures, not backend services.
