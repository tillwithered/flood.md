---
name: flood-data-display
description: Assemble Flood tables, lists, cards and file records with long or changing data. Use for content hierarchy, overflow, row actions and data-state composition.
---

# Compose meaningful data structures

Use the installed component contracts and
[composition workflow](../flood-composition/SKILL.md). Start with the content's
relationships, not a wrapper around every piece of text.

Keep visual/test fixtures separate from the host's working records unless sample
data is explicitly part of the task. Do not seed a new user's persisted list with
fictional business records just to fill a screen. Use isolated test state for
populated screenshots and exercise the real empty state. When samples are required,
identify them at the relevant boundary, without adding repeated demo narration.

- Table/DataTable preserve caption, headers, cell relationships and documented
  sorting/selection behavior. A footer represents a summary and should be
  visually distinguishable without relying on a heavy border everywhere.
- DescriptionList expresses named values; DataList/DataListItem express records.
  Card/Section/Surface organize groups without inventing a second typography or
  spacing system. A heading's semantic level does not prescribe its visual size.
- Keep row actions as named Flood Button/IconButton/Menu controls. Do not turn
  a whole row into a competing clickable wrapper around its nested actions.
- FileItem/FileMeta/UploadItem and their list owners compose file presentation;
  use their existing format/size/status/progress primitives. Selection, transport
  and preview are separate host operations. Do not manufacture upload completion.
- Preserve native image alt/fallback semantics and aspect constraints. Decorative
  artwork should not duplicate an adjacent accessible identity.

## Choose the information, not all available slots

For record lists/details, apply the [records skill](../flood-records/SKILL.md)
before filling metadata and actions. Identity, supporting context, lifecycle state,
priority and timestamps have different purposes. Use Table/DataTable when users
need several named comparisons; a trailing Inline of values is not a column model.

## Exercise data and geometry

Test no records, one record, long/wrapping names, absent optional media/actions,
loading, error/retry and selection/sorting where available. Keep error text useful
without inserting a second empty-state design or moving unrelated controls.
Align file title/metadata and status/progress by their intended row relationship;
do not hide a StatusIndicator dot or replace Progress with a custom track.

For an editable table, compare the centre of plain amounts and row actions with
the neighbouring input controls. Table centres record/action and editable rows
by default; opt into cellVerticalAlign="top" only for deliberate prose alignment.
Use the shared cellVerticalAlign contract rather than
moving text with transforms or overriding Input, NumberInput or Button internals.
Native style on an individual host-owned td/th can express an exceptional cell.
Do not depend on a low-specificity descendant CSS override. Check the rendered
centres; equal cell padding alone does not establish alignment.

Also inspect readable column widths with long neighbouring records. A centred
cell can still be wrong when a status or date is fragmented into single letters.
Table and StatusIndicator preserve word-based intrinsic width by default; keep
that recipe rather than applying global overflow-wrap:anywhere. Deliberate
technical identifier cells can opt into data-wrap="anywhere". Otherwise use
local scrolling or appropriate column budgets, not an empty no-overflow claim.

Use the documented local overflow owner, with a meaningful accessible name. Focus
the last action/cell and check that a rail or rounded corner does not cover it.
Compare narrow/wide, enlarged text and RTL. Locale-sensitive text in prerendered
examples needs consistent server/client locale to avoid hydration differences.
