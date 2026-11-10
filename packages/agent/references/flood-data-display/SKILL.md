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

Use CollectionViewSwitcher for accepted view choice and applicable commands,
separate from CollectionToolbar's working query controls. Offer update only for
an editable changed definition; keep rename name-only. The component requests IDs,
while the host owns acceptance, persistence and confirmation. Return naming and
deletion dialogs to its selectRef when their original action may disappear.

For one finite-choice property/operator/value row, use FilterCondition rather
than reassembling differently sized controls. A property change clears the
previous property's values in the proposed draft. Empty values are incomplete,
not an instruction to broaden the accepted query. The host owns Apply/Cancel,
duplicate-property policy and focus to another condition or Add after removal.
Text/date/number predicates need a deliberate supported editor; do not pretend
the finite-choice row implements arbitrary query semantics.

FilterGroup composes those rows for a flat finite-choice draft. It owns row IDs,
all/any controls and accepted row-change focus; the host owns Apply/Cancel and
query evaluation. Preserve accepted rows when addition limits or duplicate
policies change. Do not turn a new empty row into a broad accepted query or
wrap an empty group in decorative onboarding. Keep group labels contextual;
individual hidden legends/control names remain available to assistive technology.

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
  Mark comparable quantities and amounts with DataTable column `numeric` or
  Table header/cell `data-numeric` for logical end alignment and tabular digits.
  Keep identifiers, such as postal codes and account numbers, aligned as text
  even when they contain only digits. Preserve formatted units and use raw sort
  values when localized text or rich cells would sort differently.
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

Use Table for short static details, such as receipt lines. When DataTable owns
sorting or selection and its result range adds no useful information, set
`showResults={false}`. Keep the range when it helps explain pagination or
the scope of filtered results. Selection feedback and page controls remain.

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

Group collection controls by the task they affect. At a wide viewport, use the
available inline space for related search and filter controls. Keep view selection
and its management actions together, and make the result list reachable without
passing several sparse control rows. Add a row when it improves grouping or is
needed for wrapping, rather than assigning a row to each control type. Preserve
logical reading and keyboard order when the same groups wrap at enlarged text or
a narrow viewport. A collection host chooses the layout for its actual content.
Match the heights and typography of fields and actions sharing a control row.
Review the rendered sizes together. Keep management actions beside the view they
affect unless the wider composition gives their separation a clear purpose.

Default to at most two secondary filter controls beside a collection search.
When more than two filter properties are available, put the secondary choices
behind one Filters trigger. Count properties, including inactive filters, rather
than counting component names. Search, view selection, sorting and record actions
have different roles and do not count toward this filter limit. Keep applied
conditions visible as removable summaries and keep Clear filters reachable.
An explicitly primary filter can stay visible when the task warrants it. Move
secondary controls earlier if their labels or enlarged text already crowd the
row. Preserve draft/apply/cancel semantics and meaningful labels inside the panel.
When its trigger supplies the shared context, a nearby value can omit repeated
property text. A summary outside the panel needs its property named again.

Use CollectionToolbar for the search/filter query row, with accepted summaries
and a staged editor in filterContent. Keep saved views outside it. The fieldset
uses normal Tab navigation; do not place its editable search in a roving Toolbar.
Reuse FilterGroup for finite-choice drafts. The host owns validation, Apply,
Cancel, request execution and reset scope; canClear must include quickFilters
state when that slot is used. Preserve any-match meaning in summaryPrefix.
Inactive Clear filters reserves space and leaves the accessibility tree. Removal
and reset focus the persistent Filters trigger, or search without a panel.

DataTable supports ready/loading/error states. Use emptyContent to compose
EmptyState and a meaningful next action inside a ready empty table instead of
removing its headers. Distinguish no records from no matches; only the latter
offers reset of an active query. Custom empty content must not stand in for a
read failure or pending request. After reset removes the action, focus a persistent
query control. Omit emptyContent for the ordinary labels.empty message.

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
Use BulkActionBar for a compact selected-record command rail; it composes
Toolbar and OverflowActions and keeps one row with a pill exterior. Prefer two
visible commands; at most three, with lower-priority commands in More. Use a
general Toolbar for unrelated editing controls rather than adding them here.
Show the actual selected count, distinguish page selection from the collection
scope, and keep clearing selection separate from resetting filters. Confirm
consequential actions against a captured list of IDs. Pending work targets that
snapshot even if the visible query changes. On success remove only those IDs
from current selection and reconcile pagination. Preserve accepted records and
selection after rejection, and retry the captured proposal. Give disappearing
action bars an intentional focus destination. Keep confirmation dialogs outside
the Toolbar's roving descendants.
A floating selection bar can keep record layout stable while selection changes.
Anchor it to the viewport with safe-area spacing and a bounded width. Measure
actual height and reserve scroll clearance so final rows and pagination remain
reachable. Verify its menus near the viewport edge and keep modal confirmation
in the dialog layer.
Read recipe:record-workspace from the matching installed catalog for a working
composition and its limits.
