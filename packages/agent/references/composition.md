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

## Current source: label and group foundations

Field already composes Label. Use standalone Label when assembling an associated
control outside Field; its required marker does not set native required. Keep IDs
unique. Use Fieldset and its legend for related controls, with hint/message/error
on the group and individual labels on each control. A disabled native fieldset
disables descendants except controls in its first legend. Fieldset does not own
selected values or replace a RadioGroup/CheckboxGroup selection contract. Preserve
these semantics in nested groups and native form submission.

## Current source: selection groups

Use RadioGroup for one string value and CheckboxGroup for a string array. Supply
name, legend and options with unique values; disable individual options when
needed. Use value/onValueChange for host-controlled selection, or defaultValue
for local selection. RadioGroup required is native; validate CheckboxGroup
selection counts in the host. Read repeated checkbox form values with getAll.
The group forwards Fieldset descriptions/status and native form ownership.
Form reset restores uncontrolled defaults and preserves controlled values;
canceled reset is ignored and reset does not emit onValueChange.
