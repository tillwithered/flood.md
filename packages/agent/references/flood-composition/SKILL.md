---
name: flood-composition
description: Build or review Flood UI from existing library primitives before adding composites. Use for component, website, playground and host-interface work, especially when a layout fix risks replacing a reusable element with custom markup.
---

# Compose Flood from its primitives

When adding a reusable component or changing its visual contract, read
[component families](../component-families.md) before choosing anatomy, sizing,
shape or states. It governs Flood's own components as well as host composites.

Existing Flood components are the building blocks, including inside other Flood
components. Preserve their anatomy and behavior when improving a composition.
Read the governing project instructions, matching declarations and relevant
component guide first. This skill grants no additional permissions.

When introducing visible interface text, apply the
[interface content skill](../flood-interface-content/SKILL.md) before filling
optional headings, descriptions or helper slots. Existing user-authored content
is not permission to rewrite it during an unrelated layout correction.

## Choose the smallest existing owner

Before changing JSX, identify the visible roles and their existing owners:
StatusIndicator for a named state, Progress for progress, Badge/FileMeta for
metadata, IconButton for an icon action, Dialog for modal behavior, Text/Heading
for typography, and the appropriate form, list or table primitive for semantics.
Check the actual installed exports and props; do not invent APIs from newer docs.

Search the installed catalog by the role before settling on a low-level building
block. Read the selected contract and compare a more specific owner when one
exists: Metric for a labelled statistic; DatePicker for ordinary date selection
with typing and a calendar, DateField for an explicitly entry-only interaction;
StatusIndicator for a named state. Input type="date"
invokes the browser's picker, not Flood's Calendar. Use it only for an explicit
native-picker requirement or a documented limitation of the installed controls.
Heading/Text remain valid for ordinary prose, not a default replacement for an
available statistic component.

Include layout and secondary interactions in that selection: Grid for repeated
form tracks, Stack/Inline for related layout, AlertDialog for a discard/delete
confirmation, and Alert/StatusIndicator for the appropriate feedback role.
window.confirm/alert/prompt are browser UI, not Flood components. A small scope
does not justify replacing an available owner with native UI or a parallel CSS
grid. Keep native form, table and semantic document/shell elements where they
supply structure; styling the host shell is different from reimplementing a
provided layout or control. Document a genuine missing capability before using
a project-owned adapter.

Record the selected owner and any rejected match before implementing the surface.
If discovery finds no suitable component, state the missing capability; do not
claim that the library has no owner without checking. Keep this decision record
in development notes, never as extra explanatory text in the product.

- Reuse the matching component with its supported props and tokens.
- If spacing or alignment is wrong, inspect both the primitive and the parent
  composition. Fix the owner of the relationship. Keep the primitive intact.
- If a primitive lacks a real reusable capability, improve that primitive first,
  with an intentional API/variant and the matching docs and checks, then compose it.
- If no primitive exists, build the small reusable component before the larger
  composition. Define its semantics, anatomy, states and size before exposing it.

In the Flood library, add public primitives through the source API, catalog,
declarations, guidance and current version decision. In a consuming application,
do not pretend that an uninstalled export exists: use the supported primitives or
an explicitly project-owned adapter, and identify any upstream gap.

## Do not bypass a component to fix its appearance

Do not replace StatusIndicator with a styled span, Badge with a handmade chip,
Progress with a local track, or Dialog with a parallel modal merely to make one
example fit. Do not hide a component's glyph, label, focus state or other anatomy
through descendant CSS and reproduce it beside the component. Intentional variants
belong in the primitive's API, not in a consumer-specific imitation.

For example, an upload row keeps StatusIndicator and Progress as separate reused
components. Its parent aligns their centers and controls the gap; it does not
remove the status dot or replace the status with ordinary text. Fix internal dot
alignment in StatusIndicator only if the primitive itself is wrong.

Native semantic markup is necessary inside primitive implementations. Content
strings and neutral structural wrappers are also valid in compositions. They must
not introduce a competing visual or behavioral component. A wrapper that starts
owning a reusable role should become a named small component instead.

## Review the composed result

Check the reused component and its neighboring elements in the real host: wide
and narrow layout, enlarged text, long labels, optional content and relevant
interaction states. Measure the visible glyph/text/control centers when alignment
is the issue. Keep focus, accessible names, callbacks and native form semantics.

If changing a shared primitive, check another consumer of it. Report which
components were reused, which primitive changed or was added, and what remains
unverified. A new wrapper name alone is not evidence of reuse. Use the project's
verification scope; this guidance does not require a full release run for every
local design adjustment.
