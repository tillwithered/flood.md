# Components

## Dark foundations — unreleased next minor

The source additions below target the next aligned `0.2.0` release. Manifests
still read `0.1.1`; this does not mean these additions are available from npm.
Use the documentation matching the installed version.

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

### New primitives

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

### Additions to existing controls

- Button adds `variant="subtle"` and sizes `2xs/xs/sm/md/lg/xl/2xl`, with solid/md
  defaults. Reference minimum heights are 24/28/32/40/44/48/56px, implemented in
  rem. Wrapped content can grow; touch targets need contextual verification.
- Input/Textarea add `controlSize="sm|md|lg|xl"` with md default and reference
  heights 32/40/44/48px. Input's native `size` prop remains available.
- Field adds `required`, which shows a marker and forwards native required, and
  `describedBy` for external description IDs merged with hint/error IDs. Spread
  its supplied props onto exactly one Input/Textarea to preserve associations.
- Checkbox/Radio/Switch preserve native form semantics and visible labels.

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

## Published 0.1.1 contract

Import controls from `@flood-md/react` and import `@flood-md/react/styles.css`
once at the application root. Components forward native HTML props and refs,
except Field, which provides associations through its function child.

| Component | Flood-specific props | Notes |
| --- | --- | --- |
| Button | `variant`: solid / outline / ghost; `size`: sm / md; `loading` | Defaults to `type="button"`; loading disables activation |
| Input | `invalid` | Native input props such as name, type, required and autoComplete |
| Textarea | `invalid` | Native textarea props such as rows and maxLength |
| Checkbox | required `label` | Native checkbox with its visible label |
| Radio | required `label` | Use a shared name and a fieldset/legend for a group |
| Switch | required `label` | Native checkbox with switch semantics |
| Field | `label`, `hint`, `error`, `id`, function child | Pass the supplied props to one Input or Textarea |
| Link | native anchor props | Use for navigation; Button is for actions |

## A form field

This example belongs in a Next.js client component because Field takes a function
child. Server components may render Flood components with serializable props.

```tsx
"use client";
import { Button, Field, Input } from "@flood-md/react";

export function ProfileForm() {
  return (
    <form>
      <Field label="Name" hint="Shown on your profile">
        {(control) => (
          <Input {...control} name="name" autoComplete="name" required />
        )}
      </Field>
      <Button type="submit">Save</Button>
    </form>
  );
}
```

Supply `error` on Field when validation fails. It connects the error text and
invalid state to the control. Flood does not submit data or perform validation
requests: your application owns those behaviors. A controlled input should use
React's normal value/onChange or checked/onChange pair.

The shipped [TypeScript interfaces](../packages/react/src/index.tsx) are the full
API reference. See the [Next.js example](../examples/next/app/profile-form.tsx)
for client interaction. Automated accessibility checks cover the fixtures; check
keyboard use, labels, focus and contrast in your actual composition as well.
