# @flood-md/react

Original React 18.3/19 components for TypeScript and Next.js App Router. Native
HTML semantics and refs, no third-party component library or Tailwind dependency.

This package documents the **0.2.2** API and clearly marked current-source
additions. Keep Flood package versions aligned and follow the guide matching
your installed declarations; source changes do not modify an existing npm release.

```tsx
import "@flood-md/react/styles.css";
import { Button, FloodRoot, Heading, Stack, Text } from "@flood-md/react";

export function Welcome() {
  return (
    <FloodRoot>
      <Stack gap="4">
        <Heading level={1}>Welcome</Heading>
        <Text as="p" size="compact">Your workspace is ready.</Text>
        <Button>Open workspace</Button>
      </Stack>
    </FloodRoot>
  );
}
```

FloodRoot selects the neutral dark foundations profile: locally bundled Inter
with its original SIL OFL notice, semantic colors, relative typography/spacing,
radii, control sizes and state recipes. No new light foundations profile is
included. Legacy controls outside FloodRoot keep their earlier theme behavior.

Exports: FloodRoot, Text, Heading, Stack, Inline, Surface, Divider, IconSlot,
IconButton, CodeSnippet, Button, Input, Textarea, Checkbox, Radio, Switch, Field and Link,
plus TypeScript prop types. Current source also exports Label, Fieldset, RadioGroup, CheckboxGroup, ButtonGroup, InputGroup, Toggle, ToggleGroup, SegmentedControl, Collapsible, Accordion, Tooltip, Popover, Dialog, Tabs, Breadcrumb, Pagination, Select
and ScrollArea beyond published 0.2.2. Button variants are solid/subtle/outline/ghost;
sizes are 2xs/xs/sm/md/lg/xl/2xl. Prefer subtle for standalone secondary actions;
ghost belongs in a clear parent context. Loading disables activation.

Heading adds `size="display"` for large marketing headings: 5.5rem / 1.12,
weight 500, tracking -.04em. Existing heading sizes retain their metrics.
Text adds `size="lead"` for introductory copy: 1.375rem / 1.45, weight 400,
tracking -.01em. The body role remains unchanged.
CodeSnippet takes required `code: string`, optional `action: ReactNode` and
native div props/ref. It escapes/selects/wraps code and uses the semantic mono
font stack; the host owns copy actions and status messages. Both additions are
compatible extensions in 0.2.2; they do not replace existing defaults.

Input/Textarea controlSize is sm/md/lg/xl; native Input size is preserved.
Current source adds `status="error" | "warning" | "success" | "info"` to Input,
Textarea, Select and Field. Use Field's `message` for a description associated
with the control; spreading its callback props forwards status too. Existing
`error`, `invalid` or affirmative `aria-invalid` override positive statuses.
Only error sets aria-invalid; warning, success and info do not reject a value.
These visual/ARIA states do not replace native constraints or host validation.

Input/Textarea `readOnly` preserves focus, selection, copying and form submission
while preventing edits. Inside dark foundations it uses a canvas background and
quiet dashed perimeter at rest; focus retains the solid 2px accent. It differs
from disabled, which prevents ordinary focus and omits the value from submission.
Native HTML readOnly applies to text-like input types and Textarea; it is not a
Select or checkbox state. Explain why a value is read only in the surrounding UI.

Dark fields use one quiet uniform `color.field.border` perimeter; focus replaces it with a 2px
accent without a gap or layout shift. Textarea scrolls its content without a
native resize grip by default; hosts can opt into resizing through the native
style prop, for example `style={{ resize: "vertical" }}`.
Field uses `{props => <Input {...props} />}`. Its required prop forwards native
required and displays a marker; describedBy merges external IDs with hint/error
associations. Checkbox/Radio/Switch require a visible label. IconSlot accepts
host SVG artwork without bundling an icon pack.

## Current source additions: Select and choice layout

The repository source adds **Select**; it is not an export of the existing
published 0.2.2 package. It accepts native select props/ref, options and optgroups,
plus `invalid` and `controlSize="sm" | "md" | "lg" | "xl"` (md by default).
Use Field's callback props on Select to associate the label and descriptions.
Single selection uses a custom Flood trigger/listbox popup with a native select
bridge for form values and the HTMLSelectElement ref. Native numeric `size` and
`multiple` retain an inline listbox without a dropdown chevron or OS popup.
For single selection, arrows/Home/End highlight without committing; Enter,
Space or Tab commits, and Escape closes without changing the value. Typeahead
matches option labels. Focus stays on the trigger; `ref.current.focus()` targets
it while the ref itself remains the native select. Read changes from
`event.currentTarget.value` and keep required/disabled/form props on Select.
Use ordinary option/optgroup children with text labels; an option is not an
arbitrary interactive slot. See the usage guide for reset and controlled values.

Inside FloodRoot, Checkbox/Radio use Flood's custom tick/dot appearance on real
native inputs. Values, checked/defaultChecked, keyboard, forms and refs remain
native; forced colors restores native indicators. The glyph stays 1.125rem square,
with a .5rem label gap and centered alignment. Switch also keeps its label close.
Use `Inline gap="4"` for a 1rem gap between separate choices; Inline's default
gap="2" is unchanged. Buttons retain intrinsic width; full width is a deliberate
host opt-in. See [layout rules](../../docs/layout.md) and
[Select usage](../../docs/components.md#current-source-select).

Import CSS once in Next app/layout.tsx. Add "use client" to host components
using state/callbacks or Field's function child. Override semantic --flood-sys-*
variables on the scope after the import. Surface overlay is visual elevation,
not dialog behavior. The focus accent remains configurable and provisional.

See [components](../../docs/components.md), [foundations](../../docs/foundations.md)
and [Inter provenance](src/fonts/README.md). Verify contrast, focus, keyboard,
narrow layouts and text scaling in your actual application.


## Current source: Label and Fieldset

Label forwards native label attributes and an HTMLLabelElement ref. Connect its
htmlFor to a unique control ID, or nest one labelable control. Its required marker
is decorative; required belongs on the actual control. Field composes this Label.

Fieldset forwards native fieldset attributes/ref and takes a required legend.
It provides hint/message/error/status and merges their IDs with aria-describedby.
Error wins over advisory feedback. Descriptions belong to the group rather than
being copied onto every child. Disabled uses native descendant behavior: controls
in the first legend are exempt. Avoid interactive legend content unless intended.
Disabled values are omitted from native FormData; nested fieldsets preserve HTML
rules. Styling removes the browser border but retains the actual fieldset/legend.
It does not own choice values, implement a selection model or validate children.

```tsx
<Fieldset legend="Notifications" hint="Choose the updates you want.">
  <Checkbox label="Product updates" name="updates" defaultChecked />
  <Checkbox label="Release notes" name="releases" />
</Fieldset>
```

## Current source: ButtonGroup and InputGroup

ButtonGroup requires a label and direct Button/IconButton children of compatible
sizes. It joins visible edges with finite field radii and one full separator along the joined edge, supports
horizontal/vertical orientation and keeps normal Tab/disabled/action behavior.
It does not implement a toolbar or selection model. Do not wrap actions in extra
DOM elements; fragments are fine. Avoid overflow clipping around focused actions.

InputGroup accepts text-like Input props plus start/end ReactNode adornments.
The ref, id, name, value, handlers and ARIA attributes target the actual input;
className/style target the wrapper. dir/lang/hidden apply to the shell as well.
Use Field's callback or an associated Label. Adornments are visual and are not
included in the submitted value or used as a replacement for a label.
Native required, readOnly and disabled remain input states; host-owned addon
buttons need their own names, callbacks and disabled policy. Direct Flood Button/IconButton addons inherit their height from the group, with
an equal space-1 inset against the top, bottom and nearest logical edge; their
finite radius follows the shell radius minus that inset. Their size prop still
controls text, icon and horizontal padding. Coarse pointers grow the shell to
preserve the nested action's touch target. Arbitrary addon content can grow it too.
Input focus uses the shared perimeter, while an addon action keeps its own focus.
Use scoped host layout for group width. Textarea/Select require other compositions.
Both exports are unreleased beyond published 0.2.2.

```tsx
<Field label="Website">
  {control => <InputGroup {...control} start="https://" placeholder="example.com" />}
</Field>
```

## Current source: RadioGroup and CheckboxGroup

Both compose Fieldset and the existing native Radio/Checkbox controls. Supply a
legend, a name for the inputs and an options array with unique string values,
visible labels and optional disabled flags. The ref targets HTMLFieldSetElement.
Orientation is vertical by default; horizontal wraps. Disabled, hint, status,
message and error follow Fieldset. These exports are unreleased beyond 0.2.2.
Choice groups use compact sm-height rows without an additional vertical gap.
Coarse pointers retain the touch-target minimum. Wrapping labels can grow a row;
the indicator remains explicitly sized. Horizontal groups keep space-4 between
columns. Legend/helper spacing belongs to the group rather than each option.

RadioGroup uses a string value/defaultValue and onValueChange(string).
CheckboxGroup uses an array value/defaultValue and onValueChange(string[]).
Omitting value selects uncontrolled mode; otherwise update value in the host.
Native form reset restores the latest defaultValue in uncontrolled mode and
preserves the host's controlled value. A canceled reset does nothing; reset does
not call onValueChange. Values for missing options remain in state but are not
submitted. Disabled options are omitted from FormData.

Name applies to inputs, not the fieldset. CheckboxGroup submits repeated entries;
read them with FormData.getAll(name). The form prop associates every input with
an external form. RadioGroup required uses native single-choice validity.
CheckboxGroup intentionally has no required/min/max prop: validate the array in
the host and describe errors through status/message. Empty/fully disabled options
need a host decision about whether submission is meaningful.

```tsx
<RadioGroup name="visibility" legend="Visibility" defaultValue="private"
  options={[{ value: "private", label: "Private" }, { value: "team", label: "Team" }]} />
```

## Current source: overlay ScrollArea

ScrollArea keeps native wheel, touch and keyboard scrolling while drawing inset
tracks above content. Set height/maxHeight on its viewport through style; choose
orientation vertical (default), horizontal or both. The HTMLDivElement ref and
native div props/className/style target that actual scroll viewport. Supply an
accessible label when it is a standalone scroll region. Tracks do not reserve
layout width; inner content padding keeps text clear of them by default. Forced colors and unavailable
enhancement restore native scrollbars rather than hide scrolling access.

Rails automatically shorten near rounded corners on the viewport or a clipping
ancestor, including asymmetric corners. This does not add a gutter. The default
`contentInset="scrollbar"` protects text and full-width interactive rows: while
an overlay rail is present, the inner content receives logical end padding for
that axis (rail size plus two insets). The viewport keeps its full width; row
backgrounds and text stop before the rail. Explicit `contentInset="none"` preserves
edge-to-edge content when the host already provides safe padding. The default
padding can wrap text and change content height. Native
fallback scrollbars retain their platform behavior.

```tsx
<ScrollArea aria-label="Activity" style={{ maxHeight: "12rem" }}>
  <Stack gap="4">{/* Long activity content */}</Stack>
</ScrollArea>
```

This export is an unreleased source addition beyond published 0.2.2. The website
uses the same component for code, tables and navigation; Select reuses its internal
scroll viewport. See [layout](../../docs/layout.md) for constrained compositions.

InputGroup start/end are independent slots: use short prefixes (`https://`, `+7`,
`@`, currency), suffixes (`kg`, `%`, `USD`) or named Button/IconButton actions on
either side. Plain addons use subtle content color; actions retain their action
color. Include necessary units/format in the accessible label or description.
Prefixes are not masks and are not prepended to submitted values automatically;
normalization and complete phone/URL values belong to the host. Do not hide an
interactive addon from assistive technology. ButtonGroup supports text buttons,
IconButton or a mixture; every icon-only action needs its own accessible name.


## Current source: Toggle and ToggleGroup

Toggle uses a native button with aria-pressed and type=button. Use defaultPressed
for local state or pressed/onPressedChange for controlled state. Keep its visible
or accessible name stable across changes. Native onClick runs first; calling
preventDefault cancels the state change. Disabled/loading prevent activation.
iconOnly wraps host artwork in IconSlot; supply aria-label for that action.
Sizes and variants follow Button. The ref targets HTMLButtonElement.

ToggleGroup takes a label and unique-value options with label, optional icon and
disabled. selectionMode is multiple by default; single permits at most one value
and allows clearing it. Both modes use string arrays: defaultValue for local
state, value/onValueChange for host state. Controlled values do not update unless
the host updates them. Keep the selection mode stable, or remount/reset state
when changing it. Missing-option values remain in host/local state; trim them in
the host if needed. Empty options render an empty named group.

Tab visits each enabled toggle. Orientation-aware arrows (including RTL), Home
and End move focus, skip disabled options and do not select. Enter/Space activate.
The group retains intrinsic action widths rather than breaking words or compressing
icons. In constrained layouts use an enclosing horizontal ScrollArea, icon-only
actions or vertical orientation. The ref targets HTMLDivElement. iconOnly requires icons and uses option labels as
accessible names. Text+icon and text-only options are supported too.

These are pressed action buttons, not tabs, radio inputs or switches. No hidden
inputs, automatic form submission or native form-reset behavior is added. For
form fields use RadioGroup/CheckboxGroup; for panels use a future tabs component.
Uncontrolled default props initialize state only. Both exports are unreleased
additions planned for the next 0.2.3 patch; all package manifests remain 0.2.2
until the release is explicitly prepared and verified.

```tsx
<Toggle defaultPressed onPressedChange={active => console.log(active)}>Bold</Toggle>
<ToggleGroup label="Text formatting" defaultValue={["bold"]}
  options={[{value: "bold", label: "Bold"}, {value: "italic", label: "Italic"}]} />
```


## Current source: SegmentedControl

SegmentedControl is a segmented presentation of Flood RadioGroup with native
radio inputs, a visible label/legend and shared inset surface. Supply label,
name and unique-value options (string label, optional icon/disabled). Use short
labels for a small set of modes. Default orientation is horizontal; vertical,
iconOnly and fullWidth are supported. iconOnly requires each option's icon and
keeps its label available to assistive technology. fullWidth distributes equal
width to horizontal segments. controlSize is sm/md/lg/xl; touch targets may grow
the shared shell. Intrinsic groups retain readable labels rather than compressing
icons; use a constrained ScrollArea or another orientation if needed.

value/onValueChange use a single string; defaultValue initializes local state.
An absent or unmatched initial value leaves the group unselected. Once selected,
clicking the current segment cannot clear it; controlled host state can clear it.
Keep names unique among independent groups in the same form. Native name, form,
required, disabled fieldsets and reset are preserved through RadioGroup. Reset
restores the latest defaultValue for local state, preserves controlled host
values, respects cancellation and does not call onValueChange. Empty/missing
options are not invented. No automatic fallback to the first option is applied.

Tab reaches the selected enabled radio (browser defaults apply if none is
selected). Arrows focus and select, wrapping and skipping disabled options;
horizontal left/right follow RTL. Home/End select the first/last enabled item.
Space selects without clearing. A canceled native onKeyDown skips Flood's
keyboard enhancement. Enter retains native radio/form behavior. The ref targets
HTMLFieldSetElement. Hint/message/error/status follow Fieldset.

Use SegmentedControl for one value/mode, ToggleGroup for optional pressed actions
and actual tabs for associated tab panels. This does not implement tab panels.
Source-only addition planned for 0.2.3; manifests remain aligned at 0.2.2 until
release preparation. No publication is implied by the current source.

```tsx
<SegmentedControl label="Time range" name="period" defaultValue="day"
  options={[{value: "day", label: "Day"}, {value: "week", label: "Week"},
    {value: "month", label: "Month"}]} />
```


## Current source: visually hidden external labels

Field and Fieldset accept hideLabel (false by default). It visually hides the real
Label or legend, preserving its association and accessible name, while removing
the label's layout row and spacing. The required label/legend prop remains required.
RadioGroup, CheckboxGroup and SegmentedControl inherit hideLabel. Required native
controls, descriptions, error/status, group names and form behavior are unchanged.
Keep essential instructions in a visible hint/message when they are needed.
Use textual label content; do not put interactive elements inside hidden labels.

For Input/Textarea/Select/InputGroup apply hideLabel to their surrounding Field,
not the native control. Input aria-label/aria-labelledby remain available when
the host deliberately provides its own labeling. Placeholder is not a label.
ButtonGroup/ToggleGroup already expose their group label as an accessible name;
this flag does not hide button text or the per-option labels of Checkbox/Radio/
Switch. Standalone icon actions still need an accessible name.

```tsx
<Field label="Search projects" hideLabel>
  {control => <Input {...control} type="search" />}
</Field>
<SegmentedControl label="Time range" hideLabel name="period" defaultValue="day"
  options={[{value:"day",label:"Day"},{value:"week",label:"Week"}]} />
```

This compatible prop addition is source-only for the pending 0.2.3 patch; it is
not available in the existing published 0.2.2 package. It requires Flood CSS.


## Current source: Collapsible and Accordion

Collapsible takes a plain-text title, React children and open/onOpenChange or
local defaultOpen. Default closed; native Enter/Space activate its named button.
The trigger owns aria-expanded and aria-controls with stable instance IDs. Its
optional headingLevel adds a native h2–h6 around the button. Disabled affects the
trigger only; content inside an open panel remains interactive. controlSize is
sm/md/lg/xl. Native div props, className/style and HTMLDivElement ref target the
root; title names the trigger rather than the root's HTML title attribute.

Accordion takes an accessible group label and unique-value items with title,
content and optional disabled. expansionMode is single by default (one or none
open), or multiple. Both use string-array value/onValueChange or defaultValue.
The default headingLevel is 3; choose 2–6 to match surrounding headings. Up/Down,
Home/End focus enabled top-level triggers without changing expansion. Tab reaches
triggers and open panel controls normally; Enter/Space open/close. Nested accordions
keep their own keyboard navigation. The ref targets the group div. There is no
visible group caption to hide; headings and trigger titles remain visible.

Defaults initialize local state only. Controlled state needs host updates; keep
expansionMode stable or reconcile/remount when switching. Duplicate item values
and multiple expanded values in single mode are rejected. Missing-item values
remain in state until the host removes them. Disabled does not force panels shut.

Both share the same original disclosure anatomy. Panels stay mounted with native
hidden when closed, preserving local content state while removing hidden content
from focus/navigation. Existing form values and constraints remain native even
when hidden; manage inactive form fields in the host. If programmatic closing
hides focused content, focus returns to the enabled trigger unless already moved
elsewhere. Hosts own focus if the trigger is disabled or its whole item is removed.
There is no built-in Escape-to-close, form reset or persistence. Panels change
visibility immediately; only the chevron animates, with reduced motion disabling
that transition. No extra landmark regions are created per panel.

```tsx
<Collapsible title="Advanced settings"><Input aria-label="Project prefix" /></Collapsible>
<Accordion label="Questions" headingLevel={2} items={[
  {value:"install",title:"How do I install Flood?",content:"Install the packages."},
]} />
```

Source-only additions planned for 0.2.3; manifests remain aligned at 0.2.2 until
release preparation. Import Flood CSS and use FloodRoot for dark foundations.

Disclosure corner geometry: Accordion headers have square internal seams. Only
the first header has upper shell corners, and only a closed last header has lower
shell corners. An open Collapsible header has square lower corners where its
panel begins. Hover backgrounds follow that same shape without clipping focus.


## Current source: Tooltip, Popover and Dialog

All three use a trigger render function: `trigger={props => <Button {...props}>Open</Button>}`.
Forward every supplied prop and ref to one actual Button/native button in the same
document. Keep it mounted and visible while its overlay is open. Compose any host
handlers with the supplied ones, rather than replacing them; merge existing
aria-describedby with Tooltip's supplied value if adding another description.
These client interactions require modern native Popover API / dialog showModal
support. No older-browser polyfill is bundled. Native top-layer placement keeps
the panel in its original DOM/theme scope and avoids overflow clipping.

Tooltip takes text-only content, side (top default), align (center default),
delay in milliseconds (300 default) and disabled. Keyboard focus shows immediately;
mouse/pen hover uses the delay. Moving onto the tooltip keeps it visible. Escape
dismisses until a new focus/hover interaction. It never moves focus; content is
associated via aria-describedby. disabled suppresses the tooltip, not its trigger
action. Touch hover is not relied on; essential instructions belong in visible
content. Use Popover for interactive content; tooltip text is not a button's name.

Popover takes a visible title, children, trigger, side (bottom), align (start),
open/onOpenChange or local defaultOpen. It is a nonmodal dialog: focus enters its
content, but Tab is not trapped. Escape, outside pointer and focus leaving request
closing. The upper-end close action is an IconButton with a decorative cross; closeLabel
configures its accessible name. initialFocusRef can
choose an enabled element inside the panel; otherwise content gets initial focus.
Disabled prevents trigger activation. The div ref/className/style/native props
target the actual panel. Side flips and coordinates clamp near viewport edges;
scroll, viewport resize and layout changes reposition it. Native hidePopover requests state changes and a controlled owner can refuse
closure. Engine owns top/left,
position and available-size variables. Logical start/end alignment follows RTL.

Dialog uses native showModal for backdrop, inert background and nested modal
behavior. It takes title, optional plain description, children, trigger and the
same controlled/local state, disabled trigger, closeLabel and initialFocusRef.
Its upper-end close action also uses IconButton.
Escape requests closure of the topmost layer. closeOnOutsideClick defaults true;
turning it off preserves Escape and the explicit close action. Tab/Shift+Tab cycle
inside the modal, including nested nonmodal content; background scrolling is
locked without changing layout width and restored when the last modal closes.
Root props/style and HTMLDialogElement ref target the actual dialog. Native
close/method=dialog requests state changes; a controlled owner can refuse them.

Popover/Dialog children mount while open and unmount when closed. Keep persistent
form data in the host. Defaults initialize once; controlled owners must update
open. On closing, focus returns to the connected enabled trigger when appropriate;
focus deliberately moved elsewhere is preserved for nonmodal dismissal. Hosts own
fallback focus if a trigger disappears or is disabled. Choose safe initial focus
for consequential actions. Complex dialog content need not be flattened into a
single description; use its visible structure. No menu/listbox semantics are
implied by Popover. No opening/closing animation is applied in this first slice.

```tsx
<Tooltip content="Additional context" trigger={p => <Button {...p}>Help</Button>} />
<Popover title="Settings" trigger={p => <Button {...p}>Settings</Button>}>
  <Input aria-label="Project name" />
</Popover>
<Dialog title="Create a project" trigger={p => <Button {...p}>Open dialog</Button>}>
  <Field label="Project name">{p => <Input {...p} />}</Field>
</Dialog>
```

Source-only additions planned for the pending 0.2.3 patch; package manifests
remain aligned at 0.2.2. Use Flood CSS and FloodRoot. These are original native
implementations, without a third-party component/positioning library.


## Current source: Tabs, Breadcrumb and Pagination

Tabs connects unique-value items (label, content, optional icon/disabled) to a
named tablist and retained panels. Use defaultValue for local state or
value/onValueChange for controlled state. Missing, invalid or individually disabled
selection derives the first available item without a change callback. Reconcile
host values when changing items. Global disabled disables tab controls while
leaving the selected panel visible. iconOnly requires all icons and keeps labels
as accessible names. Native div props/ref target the root.

One enabled tab is in the Tab sequence. Orientation-aware arrows, Home/End move
focus, wrapping and skipping disabled tabs; horizontal start/end follows RTL.
activationMode is automatic (arrow navigation activates) or manual (Enter/Space
activate). Manual focus resets to active tab on leaving the list. Panels are
focusable, labelled by their tabs and retained with hidden when inactive, preserving
state and native form constraints. Hosts own inactive-field validation. External
selection changes return focus from a hidden panel to the selected tab if needed.
Horizontal overflow uses Flood ScrollArea; vertical layout wraps its tab labels.
Sizes are controlSize sm/md/lg/xl. There is no tab deletion/loading/fetch model.

Breadcrumb uses an accessible nav label (Breadcrumb by default), an ordered items
array of label/optional href, and a decorative separator (/ by default). The last
item always has aria-current=page, as a native link or text. Parent links preserve
browser navigation; host routes and client interception remain host-owned. It
wraps and supports long labels. Native nav props/ref target HTMLElement.

Pagination is controlled: page/pageCount are required positive safe integers,
1 <= page <= pageCount; omit the component for empty datasets. Host must reconcile
page when count changes. onPageChange requests local updates; getHref renders
native route links instead of buttons. In link mode onPageChange is notification,
not navigation cancellation; modifier clicks retain native behavior. Host routing
can intercept the bubbling nav click. Current page uses aria-current, and boundary
Previous/Next controls have no active href or disabled native buttons. disabled
makes every control noninteractive. No callback fires for the current page.

siblingCount 0/1/2 gives at most 5/7/9 numeric/ellipsis slots plus Previous/Next,
independent of pageCount magnitude. Ellipses are decorative. controlSize matches
field sizes; wrapping prevents narrow-width overflow and touch controls retain
44px targets. label, previousLabel, nextLabel and pageLabel localize naming.
The native nav ref is HTMLElement. This component does not fetch data or own URLs.

```tsx
<Tabs label="Project sections" items={[
  {value:"overview",label:"Overview",content:"Project context."},
  {value:"activity",label:"Activity",content:"Recent updates."},
]} />
<Breadcrumb items={[{label:"Projects",href:"/projects"},{label:"Flood"}]} />
<Pagination page={1} pageCount={20} getHref={page => `?page=${page}`} />
```

All three are source-only additions for the pending 0.2.3 patch; manifests remain
aligned at 0.2.2. Use Flood styles and FloodRoot for the neutral dark profile.
