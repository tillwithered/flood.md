---
name: flood-visual-review
description: Review rendered Flood UI with Playwright or equivalent browser tooling. Use for visual bugs, screenshot feedback, new or changed UI, and visual regressions across interaction states.
---

# Review the UI in the browser

Open the actual route or component preview with representative data. For a
reported issue, reproduce its state with the user's viewport, input and browser
engine when relevant and available. For a new or changed UI, start with the user's
main task and exercise the affected states. A visual review request can produce
findings alone. When implementing a fix, repeat the same interaction after it.

## Capture and inspect

Use the project's Playwright setup or equivalent browser tooling. Reach states
with clicks, keyboard and scroll. Wait for fonts and the intended stable state
before a still capture. Keep motion enabled when investigating a jump or flicker;
use consecutive frames, video or a trace with screenshots. Confirm layout shifts
with measurements before and after the action when possible.

Save a screenshot of the changed region in its surrounding layout, then open the
image and inspect it at its intended size. Crop a detail if needed. For a fix,
capture before and after with the same data, viewport, scroll position and state
when the original is available. Keep the artifacts in the host's test output or
another ignored local directory and link the relevant evidence in the handoff.

| Surface | What to exercise and look for |
| --- | --- |
| Table or collection | Select and clear rows, apply a filter through to zero results, then open any affected row detail. Inspect the junction of the status switch, toolbar and table frame. Compare visible gaps, shared edges, clipped filter values and column tracks. Check whether the scrollbar or selection actions shift the table and whether recovery actions repeat. |
| Drawer, dialog or popup | Inspect the open state with real content, scroll to the last action and close it. Check the rhythm between title, description and body, internal clipping, overlay placement and visible keyboard focus. |
| Form or navigation | Walk the relevant keyboard path. Compare label/control gaps, peer text and icon axes, long labels and hierarchy. Exercise an affected error, expansion or selection. For failed submit, verify the message is readable during correction and check what receives focus. |

When a workspace changes height, use a browser with classic scrollbars enabled
and force overflow. Verify that the intended region scrolls. Compare its content
edges and `innerWidth - document.documentElement.clientWidth` before and after
filtering. A browser with hidden or overlay system rails can mask the gutter.
Use the [workspace scroll assertion](../rendered-review.md#require-workspace-scroll-in-browser-tests)
in both states so the browser test fails if the document takes over scrolling.

For a compact row, resize through the first overflow. Check the actual state
label or meaningful visible prefix, the row height and the full text on hover
and keyboard focus. Also check a long value that differs only at its end.
For an anchored overlay in a zoomable preview, repeat at a scale below and
above 100%. Check the gap and the expected alignment to the anchor, with room
on each side first, then near an edge where the viewport can shift the overlay.

Check the affected scope at the normal viewport and at a supported narrow or
enlarged-text setting when space is part of the risk. Read the rendered copy as
part of the task. Look for duplicated labels, decorative status and instructions
that repeat what the surrounding UI already says. Use the existing [rendered
review observer](../rendered-review.md) for additional clues if available.

For component work, use the [anatomy and states review](../component-families.md#review-the-anatomy-and-its-states)
to scope the evidence. Inspect the full composition for relationships and a
detail at its intended size for painted edges, glyphs and insets. Use repeated
frames when a still screenshot cannot show the issue.

For competing actions, inspect the whole working region first. Identify what
draws attention, what the user needs to act on, and how that order changes in
the next state. Then inspect glyph alignment, painted surfaces, target bounds
and focus at control scale. See [action hierarchy](../flood-hierarchy/SKILL.md#scale-and-emphasis-of-actions).

## Resolve and verify

For each material finding, record the route and state, the action to reproduce
it, the visible symptom, and a screenshot or measurement. Start with problems
that block the task, hide content or confuse the next action. If a bug repeats,
locate its shared owner using the [component family contract](../component-families.md)
and check another affected use after the fix.

Use browser assertions for stable invariants such as bounds, focus or scroll
position. A passing assertion still leaves visual hierarchy, copy and balance
to inspect. Report the states actually reviewed and any missing evidence. If the
target cannot run, or images cannot be inspected, say which visual checks remain
open and report the evidence you could obtain.

For a material completion claim, name the route and exercised transition,
report the observed outcome, and link the check or inspected artifact. Example:
filtering a populated collection to zero results preserves the toolbar edges;
attach both states and the edge measurement. Record unexercised cases as open
checks in the handoff.
