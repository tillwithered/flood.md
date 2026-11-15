---
name: flood-screen-composition
description: Choose the layout, reading order and first useful action for a Flood screen. Use for new screens or when an existing page is hard to scan, compare or act on.
---

# Compose for the user's task

Identify the information the user needs to find, the decision they need to
make, and what they can do next. Arrange the first viewport so that it reveals
the page's purpose and the next useful content or control. Keep local actions
with the item or region they affect. A passive view may need no primary button.
In a multi-route product, establish the shared frame and transition rules with
[application structure](../flood-application-structure/SKILL.md) first.

Choose a screen structure before choosing surfaces, cards or emphasis.

| User task | Useful starting structure | Inspect in the rendered screen |
| --- | --- | --- |
| Understand an offer on a landing page | Lead with the offer and a relevant next action. Put product evidence near the claim it supports. Use a split hero when the visual helps explain the product. | Read the opening with the image absent and at narrow width. The offer, evidence and action still follow a meaningful order. |
| Find or compare records | Put search and filters next to their results. Use a list for recognition and a table when readers compare the same attributes across rows. | Find an item by title, then compare one value across several rows without losing the column or confusing it with status. |
| Monitor or decide | Start with the decision or the signal that changes it. Put a summary near the chart, queue or record that explains it. Use separate surfaces for genuinely independent scopes. | Identify what needs attention and follow the visible path to its detail or action. Remove repeated summaries and metrics with no decision to support. |
| Complete a form or edit | Keep related fields in reading order. Show a review step when correcting a consequential submission warrants one. Preserve entered answers when going back. | Follow labels, input, error and next action with the keyboard. Exercise Back or Cancel and verify which data and focus survive. |
| Find an answer in documentation | Use informative section headings and place examples next to the explanation they demonstrate. Add an outline when the document has enough sections to make it useful. | Find an answer by scanning headings, then locate its example without reading unrelated sections. |

Use [composition](../flood-composition/SKILL.md) to choose the installed
component owners. Use [hierarchy](../flood-hierarchy/SKILL.md) when related
titles, groups and controls need visual separation.
Once the regions are chosen, use [layout composition](../flood-layout-composition/SKILL.md)
to align them and decide how they share width. For a consequential decision or
monitoring summary, use [decision design](../flood-decision-design/SKILL.md)
to determine what evidence belongs on the screen.

## Choose the page and scroll owner

Identify this decision before composing the toolbar, table, form or details.
Choose by the task and the existing host layout. A polished toolbar inside a
document-scrolling workspace still leaves scroll ownership unresolved.

| User context | Owner and starting point | Transition to verify |
| --- | --- | --- |
| Persistent app navigation and a working area with independent overflow | Reuse the host shell or take the installed `recipe:navigation-workspace` as the starting point for AppShell and Sidebar. | Move between destinations with short and long content. Check that the shell's intended regions own scroll, and verify destination focus. |
| Full-window queue with selection and actions | Use the full-window entry of `recipe:table-bulk-actions` as the starting point. Keep toolbar and selection state with the collection. | Filter from overflowing rows to a collection that fits, clear the filter, then select and act. Verify scroll ownership and the table and toolbar edges across the change. |
| Inspect or edit a record during repeated work in a collection | Start with `recipe:record-management`. Keep the existing shell. Choose details in a Drawer for a bounded task or a route when the record needs a stable URL or its own work area. | Return to the collection with the applicable query, scroll position and focus. Try a record that leaves the result set after editing. |
| Lead someone through a document, article or simple standalone page | Use ordinary document flow and one document scroll. Local overflow can still have a dedicated owner, such as a wide table. | Read through the full document, then exercise the local overflow. Check that it does not widen the document. |

Use the installed catalog or MCP matching the package version to read the
recipe and its entry points. A recipe's embedded example can rely on another
shell. Check its full-window entry when copying it into a standalone app.
For a workspace using AppShell, exercise the
[browser scroll assertion](../rendered-review.md#require-workspace-scroll-in-browser-tests)
in both relevant data states, including a browser with classic scrollbars.
Record which shell, scroll owner and return context the route actually uses.

### Choose navigation from real destinations

List the destinations users can actually reach before assigning a navigation
region. A standalone queue or settings screen can use `AppShell scroll="content"`
with an `AppTopBar` when it needs shell context. Give a new standalone screen
with one destination the working width. Keep collection statuses, filters and
record details within the task. Reuse an existing host sidebar where it serves
the rest of the application.

Use Sidebar when people routinely move between persistent destinations or a
meaningful hierarchy. Give essential table columns enough room at the smallest
supported desktop width. If docked navigation competes with them, compare the
expanded and compact widths before choosing a collapsed rail, a drawer, or a
different column layout. Keep intentional horizontal overflow inside the table
and exercise access to its last column with the controls users have.

## Treat scanning patterns as observations

F-shaped scanning can appear in undifferentiated prose. Give readers useful
section headings and put distinguishing words early. A diagonal or Z-shaped
path can be a hypothesis for a sparse, image-led composition. Judge it using
that screen's content and task. For repeated comparisons, keep equivalent
labels or values on predictable tracks. Check the semantic and keyboard order
as columns stack or writing direction changes. A screenshot alone cannot
establish where users look.

## Review the assembled screen

Inspect one real populated screen at the intended width and the narrowest
supported width or enlarged text size. Walk the task without relying on
explanatory copy. Check whether a heading, surface, badge or metric earns its
place by identifying scope, grouping related content or supporting a decision.
Follow an empty or failure state when relevant. Record one concrete layout
decision and the observed result outside the interface.

See [NN/g's eyetracking research](https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/),
its [study of alternating image–text layouts](https://www.nngroup.com/articles/zigzag-page-layout/),
and the [GOV.UK review-before-submission pattern](https://design-system.service.gov.uk/patterns/check-answers/).
