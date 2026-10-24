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
plus TypeScript prop types. Current source also exports Label, Fieldset, RadioGroup, CheckboxGroup, ButtonGroup, InputGroup, Toggle, ToggleGroup, SegmentedControl, Select
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
