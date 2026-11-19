---
name: flood-layout-composition
description: Arrange Flood screen regions and toolbar groups on shared edges. Use when search and filters need placement, sections fail to line up, or groups run out of room at narrower widths.
---

# Compose the space around the task

Use the primary work area to establish the grid. Mark the edges the eye should
follow between title, controls, content and actions. Reuse those edges via
Flood layout primitives. Give a nested region its own inset when it represents
another scope, and carry that inset through its title, content and actions.
Check painted edges and text starts separately: equal outer margins do not
align text when the child components have different internal padding.

## Decide how the row uses its width

| Situation | Starting point | What would change the choice |
| --- | --- | --- |
| Search and a few criteria serve one query | Keep them together on the same edge. Let search grow up to a useful query width. | Move a distinct set of result controls to the opposite edge when it has its own purpose and room for a visible gap. |
| Search finds records and a second group refines or configures results | Anchor query on the leading edge and the result tools on the trailing edge of the same collection frame. | Combine or move secondary criteria into Filters when groups collide. Preserve the search and the highest-use control. |
| Two comparable field groups share a form | Align corresponding controls on shared Grid tracks. Let a long field span those tracks. | Give a narrow control its own track only when its task differs and it still reads as part of the intended group. |
| A collection contains unequal-height media | Use Masonry when the list can read down each column. Keep items in source order and reserve the artwork dimensions. | Use Grid where comparison, priority or keyboard traversal needs a row-first sequence. |
| A bounded editor or detail panel has long text and short values | Limit prose to a readable measure. Align compact values and actions with the content region they govern. | Give a comparison table more room or its own scroll owner when it needs additional width. |

Use logical start and end. The choice to split a row depends on the actions'
scope, expected label lengths and available width. Free space by itself does
not give two neighboring controls separate jobs.

### Compare two collection toolbars

**Find one record with a combined query.** In a purchase queue, a person
repeatedly combines a purchase-order number, a supplier and a date range.
Keep search, supplier and dates together at the leading edge. Start with
CollectionToolbar `align="stretch"`. A separate Columns command can sit at
the trailing edge. Splitting the query just to fill the row makes the three
inputs harder to recognize as one operation.

**Browse a table and adjust the result set in place.** In an inventory
workspace, people frequently search SKU or name and occasionally adjust
warehouse, availability or displayed columns. Give search a predictable width
at the leading edge. Place the result tools at the trailing edge of the same
table frame with `align="split"`. If tabs already own the leading edge, keep
search and filters grouped on the opposite side with `align="end"` when they
fit. Read the installed
[collection toolbar guidance](../flood-data-display/SKILL.md) before wiring
slots, clear behavior or control sizes.

Start dense desktop peers at the same supported size and check the longest
expected values early. If the first collision is between groups, move secondary
criteria into Filters or let a whole group wrap in reading order. If the label
is clipped inside a Select that has room within its group, fix its trigger's
width or text treatment using [typography](../flood-typography/SKILL.md).
Use the existing row arrangement when its groups already read clearly.

Apply and clear a criterion in both layouts. The persistent controls keep
their anchors when the clear action appears or disappears. Any additional row
of applied criteria should have a deliberate place in the design.

## Separate groups with the least visual weight required

Start with little space inside related pairs, a clear interval between peer
groups, and more separation at a change of task. A heading can identify a
section, a line can separate dense adjacent groups, and a surface can mark an
independent boundary or state. Add the stronger treatment when the lighter one
leaves scope ambiguous. Avoid concentrating borders, padding and headings
around the same relationship.

For a crowded screen, identify the source of clutter before adding space.
Repeated decoration can be removed. Competing control groups can be combined
or progressively disclosed. Inconsistent alignment can be repaired without
changing density. If one region gets more width, verify the consequences for
the regions beside it. Leave spare room when it provides a quiet edge or keeps
an input from becoming excessively wide.

The shared-grid approach draws on Müller-Brockmann's grid practice. The
grouping choices draw on proximity and common-region research. Treat them as
starting structures whose success depends on task and content.

## Review the transitions

Inspect the populated screen at its normal width and where groups first collide.
Follow one leading and one trailing edge across regions that should align.
Filter a list, open a detail panel, or reveal an error as appropriate. Confirm
that controls stay with their results and rows only move to make room for
content that belongs in the flow. Check keyboard order after any rearrangement.
Use the [spacing skill](../flood-spacing/SKILL.md) to diagnose a measured gap.
