---
name: flood-composition
description: Build or review Flood UI from existing library primitives before adding composites. Use for component, website, playground and host-interface work, especially when a layout fix risks replacing a reusable element with custom markup.
---

# Compose Flood from its primitives

Existing Flood components are the building blocks, including inside other Flood
components. Preserve their anatomy and behavior when improving a composition.
Read the governing project instructions, matching declarations and relevant
component guide first. This skill grants no additional permissions.

## Choose the smallest existing owner

Before changing JSX, identify the visible roles and their existing owners:
StatusIndicator for a named state, Progress for progress, Badge/FileMeta for
metadata, IconButton for an icon action, Dialog for modal behavior, Text/Heading
for typography, and the appropriate form, list or table primitive for semantics.
Check the actual installed exports and props; do not invent APIs from newer docs.

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
