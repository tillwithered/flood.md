---
name: flood-hierarchy
description: Establish visual hierarchy, shared form tracks and vertical rhythm in Flood screens, forms and overlays. Use when titles, groups and labels compete or a composed interface feels flat; not a fixed page template.
---

# Structure before emphasis

Start with the user's task, reading order and installed component contracts.
Distinguish the task title, genuinely independent groups, field labels, input
values and actions before choosing their size or color. A short form may need
only its task title and labels. Do not add a legend, subtitle, card or divider
merely to create visual levels. Meaning comes from the interface-content workflow;
this workflow makes that meaning visible.

## Assign each relationship to its owner

- Dialog owns its task heading and the body inset. Its dark title uses the
  dialog-title role (1.25rem / 600); it is distinct from compact popup captions.
- Field owns the label-to-control relationship: space-1 (.25rem) in the dark
  profile. DateField/TimeField already use that relationship. Leave room between
  independent fields instead of increasing the gap inside every label/control pair.
- Field labels use field-label typography (.8125rem / 500) and readable primary
  content color. Do not shrink every label or fade necessary labels to manufacture
  hierarchy; units, required markers, errors and accessible associations remain.
- Fieldset defaults to a compact label-sized legend for related choices. Use
  legendSize="section" for a necessary independent form section: group-title
  typography (1rem / 600) and space-4 before its fields. A legend is still a native
  group label, not a new document heading level. Optional hint/choice relationships
  keep their compact component-owned spacing.
- Grid owns common tracks; Stack and Inline own relationships between fields,
  groups and actions. Never duplicate component anatomy with styled text.

These are installed recipe defaults, not permission to use missing APIs in an
older package or to override private selectors in a host stylesheet.

## Establish a shared frame

Use one Grid for related rows that should share vertical edges. Two equal tracks
are a useful starting point for four short fields; long names and descriptions
can span the width. Numeric content being short does not by itself justify a
narrower track in only one row. If a specialized width is necessary, preserve the
common grid or deliberately separate that group and check its visual relationship.
Do not repair a whole-frame mismatch with manual widths on individual controls.

Choose the user's reading order first. In an ordinary date/time form, a pair of
calendar and time controls can share tracks with a later pair of duration/status
controls. This is an example, not an appointment-specific template. Independent
semantic grouping can justify another order. Do not turn every group into a box.

## Choose a rhythm, not a uniform gap

For an ordinary desktop form, start with space-6 between field rows and space-8
between independent groups or before the closing action row. The Dialog body
inset is already space-6: do not add the same inset again to the first child.
Keep a label nearer its control than the next field and a group title nearer
its own fields than the next group. Dense filters, table editors and choice lists
have different budgets; apply their component recipes instead of spreading this
form rhythm everywhere.

Treat action order/alignment as part of the task. An end-aligned cancel/primary
pair can finish a short desktop dialog clearly. This is not a universal order:
respect host conventions, direction, destructive confirmation and keyboard flow.
Do not add a footer surface or separator unless it resolves a real boundary.

Record lists and details need an information budget as well as type hierarchy.
Use the [records workflow](../flood-records/SKILL.md) for metadata placement,
comparison columns and status/category/priority meanings; do not give every
attribute equal visual emphasis.

## Verify the relationships

Read the actual title/group/label styles; inspect the rendered result rather
than comparing font-size declarations alone. Check complete text and long values,
not only empty inputs. Measure the left/right edges of corresponding controls
across rows, including nested padding and optional fields. A shared outer Grid
alone is not proof that the input edges align.

At the host's desktop baseline include 1280px with 24px root text as well as
normal 1280/1440px views. Ensure the final action remains reachable if the dialog
needs to scroll. Open actual date/selection popups: a calendar needs readable
content width even when its anchor is narrow; a selection list has a different
width contract. Keep viewport collision limits and nested Escape/focus ownership.

Report the consequential choices and actual evidence outside the product UI.
An empty inspector result does not establish hierarchy, necessary copy or visual
quality. Preserve a failed clean run; improve the library/guidance owner before
starting a fresh evaluation, rather than editing the historical result.
