---
name: flood-spacing
description: Diagnose Flood spacing, density, nested radii and alignment from rendered geometry. Use for large gaps, crowded rows or shifting compositions.
---

# Measure the relationship

Read the [spacing reference](../spacing.md), installed component anatomy and
host content requirements. Existing user-approved geometry governs the task.
Use the [visible spacing review](../spacing.md#judge-the-space-you-can-see)
when a rendered relationship feels crowded or loose despite matching tokens.

Identify what a gap separates: indicator/text, title/description, related choices,
independent actions, sections, or nested surfaces. Do not propagate one gap to
every wrapper. Stack and Inline organize relationships; component padding and
line height still contribute to the visible distance.

Named fields use space-1 between label and control. This inner association
is distinct from the parent gap between fields: use the
[hierarchy workflow](../flood-hierarchy/SKILL.md) for task/group/field rhythm.
Do not stack a host spacer on top of the Dialog-owned body inset.

## Find the owner

Inspect bounding rectangles plus computed padding, margin, gap, minimum height
and line height. For centered repeated rows, visible glyph separation includes
row height minus glyph height plus the row gap. A zero gap can still be spacious.

Remove redundant space at the layer that creates it. Preserve the choice glyph
and label pair, explicit icon dimensions and nonoverlapping click targets. Avoid
negative margins or transforms that merely hide a bad parent relationship.

For a nested surface, compare its radius with the outer radius minus the actual
inset/stroke. Do not force unrelated actions to follow that formula. Compare
top/bottom and start/end insets around a nested InputGroup action optically.

Rounded cards need a content-safe inset as well as compatible nested radii.
Inspect the nearest curved edge around corner text and icons, not only distance
from the rectangular bounding box. Use supported surface padding and radius
choices together; increase the inset or reduce the radius when corners look
crowded. Do not impose a universal padding-equals-radius formula on all cards.

Give sibling sections an explicit parent-owned gap. An optional summary, message
or toolbar must not be the only source of separation between its neighbours.
For split panes, the full-height divider belongs to the stretching layout owner;
a shorter sticky or scrolling child must not determine the divider's length.

Distinguish a real component from its preview scene. Fixed preview height and
reserved feedback space can prevent a demo from jumping; they should not impose
an empty message row or fixed height on every production field.

## Establish shared alignment tracks

Before composing repeated rows, define the logical start inset, leading glyph
column, text start and trailing action center. Header, group label, body rows and
footer that belong to one navigation/record surface must inherit those tracks;
independent local padding on every row is not a shared grid. Reserve a missing
icon column when peer rows have icons. Align badges and disclosure controls by
their centers even when their visible shapes and hit areas differ.

Nested content needs a deliberate rule: an iconless child can begin on its
parent's text track; a deeper hierarchy may have another consistent indent.
Do not let a child start between the parent icon and label merely because a
generic padding token happened to fit. Larger brand art is an intentional size
exception, not permission to move its label off the shared text track.

Keep alignment stable when a scrollbar appears. Budget its clearance once at the
surface owner; use existing edge spacing when it safely contains the track rather
than adding a permanent empty column to every slot. Sidebar uses that edge lane.
Generic ScrollArea still needs contentInset="scrollbar" when content would reach
under its track. Do not disable that protection globally.
Compare outer start/end clearance against the actual container in both expanded
and compact states. Center an icon-only rail against the full rail, not the
remainder after a one-sided gutter. A scrollbar appearing must not shift body
tracks relative to the fixed header/footer. Full-viewport workspaces without
document overflow must not reserve a document scrollbar strip.
Test expanded/compact, missing icons, badges/disclosures, long labels, RTL and
enlarged text. Measure rendered glyph centers, text starts and action centers
across distant rows; include the header and footer. Correct the owning primitive
or parent track instead of adding per-item offsets, transforms or replacement UI.
A build, equal row height or zero overflow does not prove these axes align.

## Evidence

Check short/wrapping labels, optional descriptions/messages/actions, all relevant
sizes, narrow width, enlarged text and both pointer modes. Rows can grow for
content; compact spacing must not clip text or overlap touch targets. Check a
sibling using the same recipe after a shared correction. Report actual measures
and rendered evidence, not only the declaration that was changed.

No horizontal overflow does not prove a readable layout. Inspect the actual
remaining copy width and body height after padding, title/description, fixed
actions and scrollbar space. A thin scrolling slot or words broken into fragments
is a failure even when every rectangle technically fits. Correct the owning
container's responsive budget without shrinking the user's enlarged text.
For settings and detail drawers, measure title-to-description,
description-to-body, and the pitch between visible controls independently.
An optional description should sit in the header slot. Separate that group
from the body with more space than the gap inside it. For repeated switches,
count their existing hit-area height before adding row gaps.
