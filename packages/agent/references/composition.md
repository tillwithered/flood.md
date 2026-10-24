# Compose an interface

For spacing, density or nested-geometry decisions, read [Spacing](spacing.md).
Measure the complete row geometry before adding a gap to repeated controls.

Start with content and the user's interaction. Use the installed exports shown
in flood/DESIGN.md; no invented props, new component library or copied registry.

1. Choose semantic Heading levels independently of visual size. Text handles
   supporting copy; keep the content hierarchy quieter than the primary task.
2. Compose vertical rhythm with Stack and wrapping rows with Inline. Surface
   represents a real container/elevation, not a wrapper around every element.
3. Keep action widths intrinsic. A full-width action is an explicit host choice.
   Controls fill a responsive form parent such as min(100%, 26rem); min-inline-size:0
   belongs on constrained grid/flex children. Inspect the actual wrapper tree.
4. Keep a choice glyph and its label together: .5rem within Checkbox/Radio/Switch;
   use an explicit Inline gap="4" (1rem) between separate choices. Center the row;
   never use space-between to pull a single label away from its indicator.
5. Use Field's callback props on the control. Keep name/value/required/form/reset
   behavior and wire submission/validation in the host. Button type defaults to
   button, so choose submit/reset deliberately. Link navigates.
6. Standalone secondary actions use subtle. Ghost needs an existing toolbar or
   clear parent context. Loading must leave a meaningful action name.

In Next.js import CSS once in app/layout.tsx. State, event callbacks and Field's
function child belong in a client component. Keep serializable compositions on
the server where useful. Flood does not save data or define permissions.

Use IconSlot for host SVGs and IconButton for named icon-only actions. Retain
the icon license; slot dimensions must control the artwork. A local semantic
adapter such as @/ui/button may re-export Flood, but does not change React APIs.

Before handing off, inspect a real composed screen at narrow and wide widths,
not only isolated controls. See [verification](verification.md).

For constrained overflow, use installed ScrollArea when available. Set height or
maxHeight on its viewport, choose the needed axis, and provide a useful accessible
name. Rails overlay content with insets; keep essential content out of the rail
zone through the default `contentInset="scrollbar"`. Use explicit `"none"` only
when host padding already protects essential content, or overlap is intentional.
The engine
shortens rails near rounded clipping corners; do not add ad-hoc per-page rail
offsets. Do not hide native scrolling as a CSS-only
substitute for an overlay engine. Check wheel, touch, keyboard, thumb drag, resize
and RTL; preserve the native forced-colors fallback.

## label and group foundations

Field already composes Label. Use standalone Label when assembling an associated
control outside Field; its required marker does not set native required. Keep IDs
unique. Use Fieldset and its legend for related controls, with hint/message/error
on the group and individual labels on each control. A disabled native fieldset
disables descendants except controls in its first legend. Fieldset does not own
selected values or replace a RadioGroup/CheckboxGroup selection contract. Preserve
these semantics in nested groups and native form submission.

## selection groups

Use RadioGroup for one string value and CheckboxGroup for a string array. Supply
name, legend and options with unique values; disable individual options when
needed. Use value/onValueChange for host-controlled selection, or defaultValue
for local selection. RadioGroup required is native; validate CheckboxGroup
selection counts in the host. Read repeated checkbox form values with getAll.
The group forwards Fieldset descriptions/status and native form ownership.
Form reset restores uncontrolled defaults and preserves controlled values;
canceled reset is ignored and reset does not emit onValueChange.

## connected controls

ButtonGroup contains direct Button/IconButton actions with compatible sizes and
an accessible group label. Tab navigation is ordinary; do not invent toolbar
arrow-key behavior. InputGroup wraps one native text-like Input; Field callback
props and ref target that input. start/end slots provide host-owned text/icons/
actions; they are not submitted values or labels. className/style own the wrapper.
Disable addon actions explicitly when the task needs it. Preserve a single field
perimeter and distinguish input focus from action focus. Use supported installed
exports; these constructs are available in 0.2.3.

Nested actions in InputGroup use the group's height and equal space-1 optical
insets, with inner radius = field radius minus inset. Button size still controls
text/icon/padding; do not compensate with extra margins. Touch targets may grow
the shell. Text-only addons keep the field's reading padding.

ButtonGroup accepts Button and named IconButton children, including mixed groups;
full separators follow its orientation. InputGroup start/end independently accept
short text, decorative icons or named actions. Plain addons are subtle; actions
keep action colors. Explain units in the label/description. Prefixes are not masks
or automatically submitted value fragments; compose complete values in the host.

Toggle is a pressed native action: keep its name stable, use pressed/onPressedChange
or defaultPressed, and label iconOnly artwork. ToggleGroup uses unique options
and string-array values in both single/multiple modes; single can be cleared.
Arrow/Home/End navigate focus; Enter/Space activate; ordinary Tab order remains.
Do not use these as form inputs, required radios or tabs. No automatic native
form reset/submission is provided. Default props initialize only; host state owns
controlled values. Available in 0.2.3.

SegmentedControl composes native RadioGroup for one value/mode: label, unique form
name and string-label options, with optional artwork. Use value/onValueChange or
defaultValue; it does not clear when the selected item is pressed again. Arrows
select, Home/End select endpoints, Space checks; Enter keeps native form behavior.
Native form/required/disabled/reset behavior remains. Use actual tabs for panels,
not SegmentedControl. Choose short labels, icons or vertical orientation for
constrained widths; fullWidth distributes segments equally. iconOnly retains
accessible option labels. Available in 0.2.3.

Collapsible: title + children, open/onOpenChange or defaultOpen. Accordion composes
Collapsible via unique value/title/content items; string-array selection in single
(one or none) or multiple expansionMode. Choose headingLevel for host structure.
Enter/Space activate; Accordion Up/Down/Home/End focus enabled top-level headers,
not nested disclosures. Panels stay mounted and hidden, so form values and native
constraints persist. Disabled only prevents trigger activation. Programmatic
closing returns panel focus to an enabled trigger if focus has not moved elsewhere;
host owns focus for removed/disabled triggers. Only chevron motion, reduced-motion
aware; no height animation or per-panel landmark flood. Available in 0.2.3.

Tooltip/Popover/Dialog: trigger is a render function; forward every
supplied prop/ref to one connected visible Button in the same document. Tooltip
content is text only. Use Popover for interactive contextual UI and Dialog for a
modal task. Controlled open/onOpenChange needs host updates; initial defaults are
not synchronization. Closed Popover/Dialog children unmount, so keep persistent
form values in host state. initialFocusRef chooses a safe element in the panel;
closeLabel localizes the explicit close action. Native top-layer APIs preserve
FloodRoot theme scope without body portals. Avoid overriding positioning fields.
Native Popover/dialog support is required, no legacy polyfill. Available in 0.2.3.

Link defaults to text; opt-in solid/subtle/outline/ghost and
Button sizes share the button recipe without changing native anchor semantics.
Use href/target for navigation, Button for actions; never nest the two or add
role=button. Link has no disabled/loading contract. Available in 0.2.3.
Tabs switches linked content panels (not modes or radio values) on a shared
contained surface. Avoid a second enclosing card inside the panel; selected fill
joins the panel without an additional underline. Arrows activate by default,
or focus only with activationMode=manual; Enter/Space commit. One tab
stop, RTL/orientation aware, disabled skip. Panels stay mounted/hidden and retain
native form constraints. Controlled/missing/disabled selected values derive first
available; host reconciles values. Breadcrumb is an ordered native link hierarchy,
last item current. Pagination is controlled page/pageCount with onPageChange or
getHref; host owns data/routes and empty states. Counts must be positive safe
integers in range; siblingCount 0/1/2 bounds window size. Native modifier navigation,
localized names, unavailable endpoints and narrow wrapping stay intact. Available in 0.2.3.
