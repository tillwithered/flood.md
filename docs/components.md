# Components

## Dark foundations · 0.2.3

This guide describes the **0.2.3** API. See the [base component inventory](base-components.md)
for the complete set. The 0.2.3 APIs extend earlier 0.2 releases; they do not
modify older npm versions. Existing 0.1.1 installs follow their
version-specific guides.

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
| Text | `as`: span / p / div (span); `size`: lead / body / compact / label / helper (body); `tone`: default / subtle / error / success / warning / info (default) | Typography; label size alone does not associate a control |
| Heading | `level`: 1–6 (2); `size`: display / large / page / section (page) | Semantic level is independent of visual size; reserve display for marketing |
| Stack | `gap` (4), native div props | Vertical composition |
| Inline | `gap` (2); `align`: start / center / end / baseline (center) | Wrapping horizontal composition |
| Surface | `elevation`: default / raised / overlay (default); `padding` (6) | Visual container; overlay is not a dialog, portal, or focus trap |
| Divider | Native hr props | Semantic separator; grouping must not rely on its faint line alone |
| IconSlot | `size` (md); optional `label` | Host SVG adapter; decorative without label |
| IconButton | Required `label`; Button props; subtle by default | Names the action; child icon stays decorative |
| CodeSnippet | Required `code` string; optional `action`; native div props/ref | Selectable wrapping code; host owns copy behavior and feedback |

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
| Select | `invalid`; `controlSize`: sm / md / lg / xl (md) | Custom single-select popup; native options, values/forms/ref and inline multiple listbox |
| Field | `label`, `hint`, `error`, `id`, `required`, `describedBy`, function child | Spread supplied props onto one Input/Textarea or source Select |
| Checkbox | Required `label` | Native checkbox and visible label |
| Radio | Required `label` | Shared name and host fieldset/legend for a group |
| Switch | Required `label` | Native checkbox with switch semantics |
| Link | Native anchor props | Navigation rather than state-changing actions |

Reference Button minimum heights are 24/28/32/40/44/48/56px, implemented in rem.
Input/Textarea sizes use 32/40/44/48px equivalents. Wrapped content can grow;
touch targets need contextual verification. Field required shows a marker and
forwards native required. describedBy merges external description IDs with
hint/error IDs; preserve the supplied associations when composing the control.

Keep action width intrinsic and form width responsive at the parent. A choice's
indicator/label gap is .5rem; separate choices usually use `Inline gap="4"`
(1rem) with centered row alignment. Inline's default remains gap="2". See the
[layout guide](layout.md) for full-width opt-in, form widths and grouping examples.

### Select

Select is available in 0.2.3.
Use it only with matching package declarations. Single selection uses a Flood
trigger and listbox popup rather than the operating system's dropdown. A native
select remains the form-value/ref bridge. The application supplies ordinary
option and optgroup children:

```tsx
"use client";

import { Field, FloodRoot, Select } from "@flood-md/react";

export function NotificationPreference() {
  return (
    <FloodRoot>
      <Field label="Notifications" hint="Choose when to hear from us" required>
        {(control) => (
          <Select {...control} name="notifications" defaultValue="daily" controlSize="md">
            <optgroup label="Email summaries">
              <option value="daily">Daily summary</option>
              <option value="weekly">Weekly summary</option>
            </optgroup>
            <option value="none">No email summaries</option>
          </Select>
        )}
      </Field>
    </FloodRoot>
  );
}
```

`controlSize` is visual sizing; native numeric `size` is the number of visible
options. `multiple` and `size` greater than one render an inline native listbox,
without a dropdown arrow or operating-system popup. Controlled value/onChange,
defaultValue, name, required, disabled, form and the HTMLSelectElement ref retain
their native form contract through the bridge. The custom popup is a single-choice
listbox, not a general menu or searchable combobox engine.
Select has no native readOnly state. Do not invent a readOnly interaction by
preventing keyboard events; use a suitable non-editable presentation when needed.

The visible trigger carries Field's label, descriptions, required and invalid
states. Keyboard focus stays on that trigger while the active option is exposed
through `aria-activedescendant`:

- Arrow Up/Down opens the popup, then moves among available options. Home/End
  highlights the first/last available option. Navigation alone does not commit.
- Enter or Space opens the popup or commits its active option. Tab commits an
  active option and continues to the next focusable element.
- Escape, another trigger click or an outside click closes without committing.
  Scrolling outside the listbox or resizing the viewport also closes it.
- Typing an option's label highlights a match. Disabled options and disabled
  optgroups cannot be selected. Long lists scroll within the popup.

The public ref points to the native select bridge; `ref.current.focus()` focuses
the visible trigger. Read selected values from `onChange`'s native select
`currentTarget` or from FormData. Uncontrolled `defaultValue` participates in
form reset; controlled `value` remains the host's responsibility. Required
validation focuses the trigger and associates its validation message. Keep the
ordinary option/optgroup children and explicit option values; the popup displays
their text labels rather than arbitrary interactive option content.

### custom choice appearance

Checkbox and Radio use custom Flood indicators inside the dark scope while
retaining real native inputs. The indicator is a fixed 1.125rem square within
layout, not a flexible column; long labels wrap without shrinking its shape.
Labels sit .5rem away and are centered with the indicator. Do not spread one
choice across a row using space-between. Separate choices use the parent gap.

The browser still owns keyboard activation, checked/defaultChecked, name/value,
required/disabled, reset and submission. Forced colors restores native indicator
appearance. Radio groups need a shared name and host fieldset/legend. Switch uses
its own native checkbox track and the same close-label grouping principle.

Prefer subtle for standalone secondary actions. Ghost needs a clear parent
context, such as a toolbar. Selected is persistent state, not transient pressed.
Loading disables activation and sets aria-busy while retaining meaningful text;
the host owns completion announcements and focus management. Readonly is distinct
from disabled. Explain unavailable actions outside a disabled element when needed.

### Contrast and customization

Dark fields use one quiet `color.field.border` perimeter without a separate bottom
edge or inset shadow. The stronger `color.field.boundary` role is an explicit
choice for compositions that need it. Quiet outlines do not establish 3:1
non-text contrast; evaluate recognition against the actual surface. Focus is a
2px accent boundary without offset or a second contour;
its configurable pink default is provisional, not a complete brand palette.
Invalid styling must not erase the focus indicator.

Textarea hides the native resize grip by default and scrolls overflowing content.
Hosts can enable resizing with `style={{ resize: "vertical" }}`; the native rows,
value and form contracts remain unchanged.

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


## ScrollArea

Rails avoid rounded corners on the viewport and clipping ancestors automatically.
Default `contentInset="scrollbar"` keeps text and full-width row backgrounds clear
of overlay rails. Explicit `contentInset="none"` adds no padding; use it when the
host already provides enough space. Safety padding affects wrapping, not viewport
width, and is applied only on overflowing axes while overlay scrolling is enhanced.

Use ScrollArea for a constrained scroll region, not every arbitrary wrapper.
Orientation is vertical by default, with horizontal/both alternatives. Its ref,
style, className and native div props target the actual native scroll viewport.
Set a height/maxHeight for vertical overflow and an accessible label when needed.
Tracks overlay content with token-defined insets; they do not take a layout gutter.
Keep the default safety padding unless host spacing already protects text/actions.

Wheel/touch/keyboard scrolling stays native. The overlay thumb supports dragging
and track clicks; it follows resizing, content changes and RTL. Forced colors
restores a visible native bar as a deliberate accessibility fallback. ScrollArea
is available in 0.2.3.

## Field status and read-only values

Input, Textarea, Select and Field accept `status="error" | "warning" | "success" | "info"`.
Use no status for the neutral default. Field associates its `message` with the
control and forwards status through callback props:

```tsx
<Field label="Project name" status="warning" message="Check this name before continuing.">
  {control => <Input {...control} defaultValue="New project" />}
</Field>
```

Only error sets aria-invalid. Existing error, invalid or affirmative aria-invalid
wins over a positive status. Native constraints and application validation still
belong to the host. Warnings and information do not block editing or submission.
Use explanatory text; color alone must not carry the meaning. Text already
supports these feedback tones. Layout primitives and generic buttons do not gain
validation states merely to match the fields.

`readOnly` prevents edits to text-like Input/Textarea while preserving focus,
selection, copying and submitted values. The dark field has a quiet dashed
resting border and canvas background; its focused border remains solid accent.
Disabled fields have different semantics. Select, Checkbox and Radio have no
native read-only state. The playground includes a short read-only explanation.

These API additions are available in 0.2.3.
## Visually hidden external labels

`Field` and `Fieldset` accept `hideLabel`, inherited by `RadioGroup`,
`CheckboxGroup` and `SegmentedControl`. The actual label/legend remains available
to assistive technology and retains its association, but no longer occupies a
layout row. Keep the required `label`/`legend` prop supplied. Use this where the
surrounding interface already makes the visible purpose clear. Descriptions,
required semantics and validation continue to work.

For Input, Textarea, Select and InputGroup, apply this to the enclosing Field:

```tsx
<Field label="Search projects" hideLabel>
  {control => <Input {...control} type="search" />}
</Field>
```

Do not use placeholder as a replacement name, hide interactive label content,
or remove the individual labels of choices. ButtonGroup/ToggleGroup already
have accessible group names without a visible heading. `hideLabel` is a
compatible addition in 0.2.3.

## Disclosure components

`Collapsible` combines a native named button and a retained panel. Use `title`,
children and `defaultOpen`, or controlled `open`/`onOpenChange`. `Accordion`
groups unique-value items with plain-text titles and React content; its
`expansionMode` is `single` (one or none) or `multiple`, using string-array
`value`/`onValueChange` or `defaultValue`. Set `headingLevel` for the surrounding
document; Accordion defaults to 3. Native div props/ref target each root.

Enter/Space toggle; Accordion Up/Down/Home/End focus available top-level headers
without opening panels. Tab also reaches open panel controls. Disabled affects
the trigger, not the contents of an already open panel. Panel content stays
mounted with native `hidden`, so native form values and constraints remain;
manage inactive fields in the host. Programmatic closing returns panel focus to
the enabled trigger if focus has not already moved elsewhere. Removed or disabled
triggers require host focus management.

Panels change visibility immediately. Only the chevron animates, and reduced
motion disables that transition. Both APIs are available in 0.2.3.


## Contextual overlays

Tooltip, Popover and Dialog take a trigger render function. Forward all supplied
props and ref onto one actual button: `trigger={p => <Button {...p}>Open</Button>}`.
Modern native Popover API and dialog showModal are required; the panels remain
in their DOM/theme scope while appearing in the browser top layer.

Tooltip provides text-only hover/focus help through aria-describedby and never
moves focus. Escape dismisses; hovering the tooltip keeps it visible. Do not put
interactive or essential instructions only in Tooltip. Popover is a named,
nonmodal dialog with interactive children; outside pointer, focus leaving and
Escape dismiss it without trapping Tab. Dialog is modal: native inert background,
focus entry/cycle/return, nested layers and scroll restoration. Its outside
closing can be disabled independently of Escape. Both provide an explicit close
button and configurable closeLabel/initialFocusRef.

Popover/Dialog use open/onOpenChange or defaultOpen. Closed children unmount, so
persistent form state belongs in the host. Owners must update controlled state
and keep triggers connected/visible. Positioning flips/clamps at viewport edges
and follows logical RTL alignment. These APIs are available in 0.2.3.
See the React package guide for full contracts.


## Navigation components

Link remains a native anchor. Its optional `variant` (solid/subtle/outline/ghost)
and `size` use the same recipes as Button for navigation that looks like an
action. The default `variant="text"` inherits typography and stays underlined;
size only applies to button variants. Keep href/target and ordinary browser
navigation; use Button for state changes. No nested buttons, role=button,
disabled or loading behavior. This opt-in extension is available in 0.2.3.

Tabs owns a named tablist and linked panels; use unique-value items, controlled
value/onValueChange or defaultValue. Arrows select by default; manual activation
uses Enter/Space. Tab leaves the roving tablist. Inactive panels stay mounted and
hidden, so form constraints remain native; manage inactive fields in the host.
Missing/disabled values fall back to the first available item. Vertical, icon-only
and four control sizes are supported; horizontal overflow uses Flood ScrollArea.
The active tab joins the content on one shared surface in either orientation.
The outer container owns the quiet perimeter; panel content needs no extra card.

Breadcrumb renders an ordered path of native links; the last item is current,
with or without a link. Separators are decorative. Pagination takes a controlled
page/pageCount and onPageChange for local lists or getHref for real links. It
validates positive safe-integer ranges, bounds visible page slots via siblingCount
0/1/2 and disables unavailable endpoints. Localized names and sizes are configurable.
Use compact counts on narrow hosts; wrapping preserves navigation without clipping.

These three APIs are available in 0.2.3. See the
package guide for detailed ownership, fallback and keyboard contracts.
