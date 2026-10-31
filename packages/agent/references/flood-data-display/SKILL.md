---
name: flood-data-display
description: Assemble Flood tables, lists, cards and file records with long or changing data. Use for content hierarchy, overflow, row actions and data-state composition.
---

# Compose meaningful data structures

Enable selection when it has a real consequence: a bulk operation, comparison or
another requested selection task. Do not add checkboxes merely because the table
supports them. Exercise the resulting action with the actual accepted scope.

For search, multiple conditions or saved query definitions, read
recipe:collection-views from the installed catalog when available. Separate the
working query, an uncommitted condition draft, a named saved definition and the
result/selection state. Save filters and supported sort, not result IDs. Name-only
edits must not commit dirty filters; deleting a view must not delete records.
Reset/revalidate page and selection when the query changes. Preferences read
failure need not hide an independently loaded collection, but must block writes
to that failed store and must not be disguised as an empty saved-view list.

Use the installed component contracts and
[composition workflow](../flood-composition/SKILL.md). Start with the content's
relationships, not a wrapper around every piece of text.

Keep visual/test fixtures separate from the host's working records unless sample
data is explicitly part of the task. Do not seed a new user's persisted list with
fictional business records just to fill a screen. Use isolated test state for
populated screenshots and exercise the real empty state. When samples are required, identify their provenance in the test brief/README.
A visible distinction is needed where it changes interpretation or action, such
as sample records mixed with real records. Do not automatically add a permanent
Demo badge to the shell of an explicitly requested isolated prototype; follow
the interface-content workflow for contextual placement.

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

## Declare remote and selection ownership

Client DataTable receives the complete local collection. Server paginationMode
receives one already sorted page, controlled page/onPageChange and totalRows;
sortable server columns require controlled sort/onSortChange. Do not locally
slice or sort a server page. Reconcile page when a filter reduces its total.
The host owns query identity and abort/request generations so a late response
cannot replace the current query. Present loading/error explicitly rather than
labeling old rows as an accepted new page.

Server page selection covers supplied rows only. Dataset scope requires controlled
selectedIds and host validation of IDs beyond that page. Select-page never means
select every search result. Clear/revalidate selection on query or permission
changes. Capture confirmed IDs and keep the proposal after an operation refusal.
Read recipe:record-workspace from the matching installed catalog for a working
composition and its limits.
