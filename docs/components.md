# Components

## Dark foundations · 0.2.4 source candidate

This guide describes the **0.2.4 source candidate** API. See the [base component inventory](base-components.md)
for the complete set. New APIs extend earlier 0.2 releases; source changes do not
modify published npm versions. Existing 0.1.1 installs follow their
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


## Badge, Spinner, Skeleton and Avatar · 0.2.4

These original primitives are compatible additions in the 0.2.4 source candidate.
Import Flood CSS and use FloodRoot. Verify registry publication before installing.
Native span props and refs target their roots; className/style remain host overrides.

Badge is a noninteractive span: size sm/md/lg, tone neutral/accent/error/warning/
success/info and variant subtle/outline. Its text carries the meaning; color is
supplementary. It has no selection, dismissal, click-action or live-region model.
Use a separate named action when needed instead of treating it as a button.

Spinner defaults to size md and label="Loading". Localize label for standalone
status. decorative hides it and its label from assistive technology. Button
loading uses the same Spinner decoratively, inherits its icon size and retains
its accessible button name and aria-busy. Announcements belong at the appropriate
host level; do not create one live region for each decorative loading graphic.
Reduced motion stops rotation. This indicator does not measure completion.

Skeleton is always aria-hidden. shape is text/rounded/circle; width and height
accept CSS dimensions (numbers are React CSS pixels), and style overrides them.
Prefer relative dimensions. For a circle supply equal dimensions. animate defaults
true; reduced motion and forced colors stop animation. Match the final geometry;
Skeleton does not fetch, detect loading or announce changes. The host owns busy
state, loading text and replacement with real content. Do not add interactive children.

Avatar requires name, accepts src, fallback text, size sm/md/lg, shape circle/
rounded and decorative. The root exposes one named image; the internal image has
empty alt and is hidden from assistive technology. Use decorative beside an
already visible equivalent name. Defaults use the first letters of the first two
whitespace-separated name parts; override fallback for your locale or naming rules.
The image overlays the fallback only after successful load; an error retains the
fallback. A new src remounts the image load state, including returning to an earlier
source. The root stays the same size. This API does not upload or crop images.

```tsx
<Badge tone="success">Active</Badge>
<Spinner label="Loading workspace" />
<Skeleton width="12rem" />
<Avatar name="Alex Morgan" src="/team/alex.webp" />
```


## Progress, Meter and Alert · 0.2.4

Progress describes task completion. label is required; max defaults to 100 and
value is a finite number in 0..max. Omit value for indeterminate progress; its
progressbar then omits aria-valuenow. Meter describes a measurement in a bounded
range, such as storage or battery. It requires value, with min=0 and max=100 by
default. Require finite min < max, a finite range span, and min <= value <= max.
Invalid ranges/values throw RangeError; they are not silently clamped.

Both support size sm/md/lg, semantic tone, hideLabel and valueText. Tone defaults
to accent for Progress and neutral for Meter. valueText supplies localized,
human-readable units; it also appears beside the caption. hideLabel visually
hides the caption while retaining the accessible name and valueText. The bar's
role is progressbar or meter; neither becomes a live region. Native div props,
className/style and HTMLDivElement ref target the wrapper; the internal bar owns
its ARIA range and label associations. Wrapper ARIA props stay on the wrapper; use valueText for range-specific wording. No keyboard model,
threshold calculation, fetching, timers or task cancellation is built in.
Reduced motion stops indeterminate movement and value transitions. Forced colors
preserves the track boundary and fill. Use a host loading message when needed.

Alert is an inline message, with optional plain-text title and React children.
Tones are neutral/info/success/warning/error; info is the default. Meaning must
remain in the text. Original decorative status glyphs are included; icon accepts
noninteractive host artwork, and icon={null} removes it without an empty column.
The title is message content, not the root's HTML title tooltip or a document heading.
Native div props/className/style/ref target the root.

announcement defaults to off for static messages. polite uses role=status;
assertive uses role=alert. Choose urgency deliberately for dynamically inserted
content. Announcements depend on actual assistive technology; initial static
markup is not guaranteed to be read aloud. No focus movement, auto-dismiss,
timeout or built-in close/action button is supplied. Compose named host actions
inside children when needed. Alert is separate from Dialog and future Toast.

See the [WAI Meter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/meter/),
[Alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) and
[progressbar definition](https://www.w3.org/TR/wai-aria-1.2/#progressbar).

```tsx
<Progress label="Uploading files" value={60} valueText="60%" />
<Progress label="Preparing workspace" />
<Meter label="Storage used" min={0} max={100} value={75} valueText="75 of 100 GB" />
<Alert tone="warning" title="Storage is almost full">
  Free some space before your next upload.
</Alert>
```


## DescriptionList and Table · 0.2.4

DescriptionList renders native dl groups, each with dt and dd. items is a readonly
array of {id, term, description}; IDs must be unique and nonempty, and are React
keys rather than DOM anchors. term is text and description is ReactNode, so a
value can include a Badge, Link or other meaningful content. The host formats
values and supplies fallback text for missing data. An empty items array stays
an empty list, without invented placeholder content. Native dl props,
className/style and HTMLDListElement ref target the list.

layout defaults inline: term and value share a row. It becomes stacked below a
22rem component container width, independently of viewport width. layout=stacked
always puts the value below its term. Density defaults compact; comfortable adds
space between pairs, without inflating the term/value relationship. dividers is
false by default and adds quiet separators when enabled. This is not an editable
form and its terms do not label controls; use Field/Fieldset for form inputs.

Table wraps an actual HTML table in Flood's horizontal ScrollArea. caption is
required and must be meaningful; hideCaption visually hides it without removing
the accessible table name. children owns native thead/tbody/tfoot/colgroup markup
and th/td associations. Supply scope=col or scope=row for simple headers, and
explicit id/headers associations for complex spanning headers. Do not add another
caption child. See [WAI table guidance](https://www.w3.org/WAI/tutorials/tables/).

Table density defaults comfortable; compact reduces vertical cell padding.
striped is false by default. Native tfoot rows use a quiet tinted background and
medium-weight text to distinguish summaries; the top separator stays decorative.
data-numeric on a th or td uses logical end alignment,
tabular figures and no wrapping for numbers. data-align=start/center/end overrides
alignment explicitly. Text cells wrap; set style.minWidth to preserve room for a
wide table, and the containing ScrollArea handles overflow. The host owns dates,
units, totals, empty rows/colSpan and any cell actions. Avoid interactive whole rows.

Native table props, className/style and HTMLTableElement ref target the table,
not its viewport. dir/lang/hidden also govern the containing scroll area.
scrollLabel names that viewport independently and defaults to caption. The native
table keeps its own caption; viewport keyboard scrolling does not turn it into a
grid widget. Keep action controls inside cells normally focusable. No sorting,
selection, data fetching, pagination, sticky header or virtualization is implied.
This is the compositional table primitive, not a DataTable engine.

```tsx
<DescriptionList items={[
  {id:"project",term:"Project",description:"Flood"},
  {id:"version",term:"Version",description:"0.2.4"},
]} />
<Table caption="Workspace projects" style={{minWidth:"32rem"}}>
  <thead><tr><th scope="col">Project</th><th scope="col" data-numeric>Members</th></tr></thead>
  <tbody><tr><th scope="row">Flood</th><td data-numeric>12</td></tr></tbody>
</Table>
```


## Menu · 0.2.4

Menu is an original action menu using Flood's positioning/layer stack and the
native Popover API. label names the menu; there is no extra visible caption.
trigger is a render function receiving OverlayTriggerProps: forward all props
and ref to one persistent Button/IconButton/native button, and compose existing
handlers rather than replacing the supplied ones. The trigger exposes
aria-haspopup=menu, aria-expanded and aria-controls. disabled affects the trigger,
not actions inside a menu the controlled host keeps open.

items is a readonly array of action items {id,label,icon?,shortcut?,disabled?,tone?}
or separators {id,type:"separator"}. IDs must be unique and nonempty, action
labels nonempty, and at least one action must exist. The optional item type is
item. Icons must be decorative, noninteractive artwork. shortcut is display-only,
not an installed keyboard binding or part of the accessible action name. Destructive
actions use tone=danger; that visual treatment does not perform confirmation or
execute any business operation. Disabled items remain focusable with aria-disabled,
but neither pointer nor keyboard activation calls onAction or closes the menu.

Enter/Space/ArrowDown open at the first action; ArrowUp opens at the last.
Inside: Up/Down wrap, Home/End choose edges, printable label-prefix typeahead
matches items (repeated characters cycle). Separators are not focusable. Enter
or Space activates through a native button. Escape closes the top menu and
returns focus. Tab moves to the next focusable control after the trigger;
Shift+Tab returns to the trigger. The menu does not trap focus. Outside pointer
or focus departure requests dismissal and preserves deliberately moved focus.

open/onOpenChange is controlled, or use defaultOpen for initial local state.
The host may refuse a close request. onAction(id) requests closing before calling
the host; the host owns business logic, asynchronous work and errors. If it moves
focus elsewhere or opens a Dialog, normal focus restoration must not steal it.
Actions mount while open and unmount on close. The persistent popup ref and native
div props/className/style target its panel. Engine-owned coordinates and available
space variables belong to positioning; side/align follow Popover conventions.
controlSize is sm/md/lg/xl (sm default); pointer-coarse targets retain touch size.

The popup uses Flood ScrollArea for long action lists, bounded to the available
viewport. Its inner corners follow shell padding and border geometry. Focus is
inset to stay visible. There is no href/navigation-item, submenu, checkbox/radio,
context-menu trigger or menubar contract in this first action-menu component.
Use ordinary Link for ordinary navigation; keep different selection models separate.

See [WAI Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) and
[Menu keyboard patterns](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/).

```tsx
<Menu label="Project actions"
  trigger={props => <Button {...props}>Project actions</Button>}
  items={[{id:"rename",label:"Rename…"},{id:"divider",type:"separator"},
    {id:"delete",label:"Delete project",tone:"danger"}]}
  onAction={id => chooseProjectAction(id)}
/>
```

### Toolbar and Kbd (0.2.4)

Toolbar groups Button, IconButton, Toggle, native buttons/links and Menu triggers
under one named action panel. After hydration it uses one Tab entry, directional
arrows, Home/End and optional looping. Disabled/hidden actions are skipped. Arrows
move focus, not activation. Horizontal order follows writing direction. In vertical
toolbars open Menu with Enter/Space; horizontal menus retain Up/Down opening.
Keep text inputs and independent selection widgets outside this action-only API.
Native child handlers and refs remain attached; Toolbar owns their tabIndex while
mounted and restores original attributes on cleanup. Without JavaScript, native
child Tab order remains available. Use a meaningful required label.

Kbd renders native kbd markup with sm/md/lg sizes and relative keycap heights.
It displays a key or combination; the host implements real shortcuts. It is not
interactive. Menu shortcut hints reuse Kbd and remain hidden from item names.

```tsx
<Toolbar label="Editor actions">
  <Button variant="ghost">Undo</Button>
  <Toggle variant="ghost">Bold</Toggle>
  <Button variant="ghost">Share</Button>
</Toolbar>
<Kbd>Ctrl</Kbd> + <Kbd>K</Kbd>
```

### Card (0.2.4)

Card composes Surface into a header, body and footer. Optional title, description,
actions and footer accept React content; children are the body. Missing slots
create no empty section. Use Surface when only a background/padding is needed.

Card is a noninteractive div. Put Button, Link or Menu in actions/footer and keep
its container out of the Tab order. Do not make the entire card clickable around
nested controls. Native div props, styles and HTMLDivElement ref target the root.
The title prop is heading content, not an HTML tooltip; supply phrasing content.
headingLevel defaults to 2; choose the correct hierarchy for the host page.

Compact/comfortable density controls existing spacing tokens. Header actions wrap
without clipping menus or focus indicators. Footer uses a quiet separator; a
footer-only card has no redundant separator. Elevation is default or raised.
No data access, selection or interactive-card behavior is implied.

```tsx
<Card title="Project details" description="Keep your team in sync."
  footer={<Button variant="subtle">Open project</Button>}>
  <Text as="p" size="compact">A calm place for the next idea.</Text>
</Card>
```

## Structural, media and accessible primitives · 0.2.4

Container centers a max-width box with logical gutters. size sm/md/lg uses
40/64/80rem bounds including padding; full removes the max. gutter uses Space.
Grid defaults to auto-fit with a16rem semantic minimum clamped to available
width. gap uses Space. minItemWidth overrides the auto minimum; explicit columns
(1/2/3/4/6/12) remain fixed. Grid is ordinary layout, never an ARIA grid widget.

VisuallyHidden preserves content in the accessibility tree using span/div. Default
is for noninteractive content. Use focusable for a skip link: focus-within reveals
its wrapper; style the actual link's focus. This is different from aria-hidden or
conditional rendering. Native captions/legends may use the same hiding utility
without an invalid generic wrapper. Spinner and hidden indicator captions compose
VisuallyHidden.

AspectRatio reserves responsive media geometry before loading, accepting a finite
positive ratio (16/9 default). Direct img/video/iframe children fill its box. It
does not clip focus or make arbitrary long content fit; the host owns alternative
text, captions, media controls and deliberate cropping. Image is a native img
with required alt (empty for decorative content), cover/contain fit and preserved
srcSet/sizes/loading/decoding/dimensions/events/ref. No optimizer, fetch engine or
fallback is implied. Avatar composes Image for its own loading lifecycle. Supply
image dimensions or AspectRatio to reserve space.

List renders native ul/ol with native li children and token gap. ordered selects
ol; start/reversed apply there. start must be a safe integer. marker=false retains
explicit list semantics for platforms that drop lists without visible markers.
This is content, not ListBox selection or arrow navigation.

EmptyState composes Stack, Heading, Text, IconSlot and Inline. Required title,
optional description, decorative icon and actions explain absent content; choose
headingLevel for the host hierarchy. It is static, with no automatic focus or
announcement. compact/comfortable density controls padding. The host implements
real actions and decides whether asynchronously changed results need announcing.

Checkbox adds indeterminate for a host-controlled mixed presentation after
hydration. checked independently determines form submission; mixed does not mean
a third submitted value. The host owns aggregate/select-all values. Native reset
and ref access remain available. Radio and Switch do not expose indeterminate.

ButtonGroup/ToggleGroup retain their keyboard contracts and locally scroll when
a connected row cannot fit. InputGroup actions keep words intact and can wrap to
a new row while the input retains usable space. Plain string adornments are bidi
isolated; for protocols/phones with explicit direction pass a bdi dir=ltr node.
Keep very long addon content concise. Hidden native choices hide their label too.

Dark foundations bundle both normal and italic Inter, including Cyrillic, with
original OFL notices. Color alone never communicates validation or progress.

CodeSnippet codeDirection defaults to ltr independently of RTL parent action layout; choose rtl/auto explicitly for content that needs it. Native dir still applies to the wrapper. Protected ScrollArea reveals focused descendants fully when needed, composes the host focus handler and avoids scrolling to nested top-layer controls.

Checkbox, Radio and Switch apply native hidden/dir/lang to their visible label wrapper as well as the input, so a component-local language/direction applies to its whole choice.
