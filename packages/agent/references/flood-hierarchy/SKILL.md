---
name: flood-hierarchy
description: Establish visual hierarchy, shared form tracks and vertical rhythm in Flood screens, forms and overlays. Use when titles, groups and labels compete or a composed interface feels flat; not a fixed page template.
---

Use PageHeader for the page's main heading and page-wide actions. Use Section
for a named block within the page. Keep breadcrumbs outside the header and
collection filters next to the collection. Add supporting copy only when it
changes what the user can understand or do on this page.

# Structure before emphasis

Start with the user's task, reading order and installed component contracts.
Distinguish the task title, genuinely independent groups, field labels, input
values and actions before choosing their size or color. A short form may need
only its task title and labels. Do not add a legend, subtitle, card or divider
merely to create visual levels. Meaning comes from the interface-content workflow;
this workflow makes that meaning visible.
Use [typography](../flood-typography/SKILL.md) when a choice depends on type
roles, wrapping, reading measure or numeric comparison.

## Assign each relationship to its owner

- Dialog owns its task heading and the body inset. Its dark title uses the
  dialog-title role (1.25rem / 600); it is distinct from compact popup captions.
- For independent blocks inside a record Drawer, use Section with
  `headingSize="group"` when installed. Keep the Drawer title one level stronger
  visually. Set the semantic heading level separately. Start with a tighter gap
  from each heading to its content and space-8 between independent sections.
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

For a compact settings form, start with the page heading, section legends,
and ordinary Field labels. Check that each level is recognizable by size,
weight and proximity. Use space-6 between sections as a starting point.
Repeated switch rows already provide a full hit area. Keep those rows close
and align the switches on one shared edge within a readable column.
Check actual row centers and wrapping at enlarged text.

Keep a label visually nearer its control than the next field and a group title
nearer its own fields than the next group. Inspect the rendered line height,
control padding and fill before adjusting a parent gap. Dialog already supplies
its body inset. Compare one change in size, weight, contrast, or spacing at a
time using the [spacing review](../spacing.md#judge-the-space-you-can-see).

Treat action order/alignment as part of the task. An end-aligned cancel/primary
pair can finish a short desktop dialog clearly. This is not a universal order:
respect host conventions, direction, destructive confirmation and keyboard flow.
Do not add a footer surface or separator unless it resolves a real boundary.

## Scale and emphasis of actions

Identify the action's scope from what it changes. Match size to the working
region, prominence to the decision, and activation area to the supported
input. Consider the painted surface, glyph, target and reserved track
separately.

| Region | Starting point | Check in the rendered UI |
| --- | --- | --- |
| Page header | A named creation or submission action can lead. A larger size can fit a spacious header with one clear next step. | Compare the action with the heading and neighboring controls at the supported widths. |
| Collection toolbar | Give peer tools a shared scale and alignment. Use closer gaps inside a related group and a distinct interval from neighboring tasks. | Search, filters and column settings stay legible and aligned with real labels. Check that the layout holds after selection or filtering. |
| Repeated row | Keep secondary commands compact with a predictable trailing edge. Use visible text when an icon alone is ambiguous. | Compare rows with long names and missing values. Verify the action remains findable and operable. |
| Modal or drawer | Put the decision beside the actions that resolve it. A recognizable close glyph can remain quiet on a steady surface. | Check the close control at rest and with keyboard focus. Check its target and the backing surface independently of the glyph. |

### Choose control sizes by working region

Choose a scale before composing each group. Start at `sm` for dense desktop
table tools, in-row actions and compact navigation controls. Start at `md` for
ordinary form fields and actions, where a reader needs more room to enter a value.
Use `lg` or `xl` for supported controls that lead a standalone task, such as
a primary search entry or a prominent action with space around it. Check each
family's supported size props and preserve its touch target on coarse pointers.

In a collection toolbar, choose one size for peer search, filters and commands.
Set `controlSize` on a standalone SearchInput or Select, and `size` on its peer
Button. With CollectionToolbar, set its `controlSize` for built-in tools and pass
the corresponding size to the controls supplied in slots. Give the search the
width its query needs. Size filter triggers around their longest visible value
and icon. Check height, baseline, label clipping and fit at the actual width.

Choose the strongest action within the current task region. Save can lead in
settings; clearing a filter can lead in an empty result; a read-only detail
may need no primary action. When the governing scope changes, update emphasis
with it. For example, a selection count belongs alongside selection actions,
and a persistent read-only or impersonation notice identifies the scope of
the whole workspace.

Inspect the entire region before increasing sizes or adding a filled surface.
Use the existing foundations roles for glyph size, focus and interaction
geometry. At crowded widths preserve the task and choose which related
controls should move together. For example, a short toolbar can expose one
frequent filter while moving secondary criteria into its filter surface.

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
