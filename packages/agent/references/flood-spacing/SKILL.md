---
name: flood-spacing
description: Diagnose Flood spacing, density, nested radii and alignment from rendered geometry. Use for large gaps, crowded rows or shifting compositions.
---

# Measure the relationship

Read the [spacing reference](../spacing.md), installed component anatomy and
host content requirements. Existing user-approved geometry governs the task.

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
