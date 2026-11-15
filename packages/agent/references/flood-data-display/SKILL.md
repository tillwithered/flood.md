---
name: flood-data-display
description: Assemble Flood tables, lists, cards and file records with long or changing data. Use for content hierarchy, overflow, row actions and data-state composition.
---

# Compose meaningful data structures

Use RatingValue to display an observed score. Choose fractional stars for a
card with room and the compact score for dense rows. Keep the scale consistent
among comparable rows. A missing rating needs its own state, and zero remains a
valid score. Use Rating when people can enter their own score.
Use RatingSummary when the distribution matters alongside the score. Pass
counts from the same set of reviews, keep the scale consistent across peers,
and use the empty state when no ratings are present.

Use Timestamp for event metadata. Keep date formats and time zones consistent
among comparable events. Preserve a civil date as entered. Give relative time
an explicit shared reference so timestamps in one feed agree. Show an absolute
date when the user needs an exact date for a decision or audit.

Use ActivityTimeline when a long history scans better in named periods.
Keep the order and date grouping in the host. Keep the same timestamp format
across groups and give each period enough separation to scan without dividers.
Use Timeline for a short history or when times need a shared schedule column.

Use Avatar presence for known availability beside an identity. Pass the same
localized state through AuthorMeta or AvatarGroup when those components own the
identity. Keep important status text visible when it changes the next action.
Leave presence absent for people whose availability is unknown.
Use AuthorMeta with inline metadata for a short date beside the name and the
default stacked layout for secondary identity such as a role. Truncate a name
only when the visible prefix identifies the person. The full name remains
available on hover and keyboard focus. Use AvatarGroup with separated spacing
when individual faces need to stay distinct even without presence marks.

Use CopyableValue for an exact value and its adjacent copy action. Keep wrapping
when the whole value must be read in place. In a dense row, use truncate only
when the prefix is recognizable and the whole value is available on inspection.
If similar values differ only at the end, make that distinction visible.
Use RevealValue for a read-only token that starts concealed. Name the action
for the token and enable copy only when it belongs in the workflow. The host
owns authorization and retrieval.

Enable selection when it has a real consequence: a bulk operation, comparison or
another requested selection task. Do not add checkboxes merely because the table
supports them. Exercise the resulting action with the actual accepted scope.
For DataList, pass the host's accepted selection through DataListItem selection.
Name each checkbox for its record and keep links and per-record commands
independent. Use reserveSelectionSpace when filtering can leave only rows
without a checkbox. Compare the leading edge before and after selecting.
Use the same selection track on ListSkeleton for the initial load of that list.
Use Card selection for independent bulk selection of a record in a gallery.
Keep the checkbox at the trailing edge of the first row. Give the title and
description space to read when header actions move below them.
CheckCard is a form choice whose surface toggles the option. Keep actions and
links usable beside the record checkbox. If the card's footer reads as part of
the same section, use footerDivider={false} and match it in CardSkeleton.

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
- For a collection that users repeatedly filter, preserve the important column
  tracks at the same viewport as results change. Compare the populated, filtered
  and no-results states. A table can keep its outer width while its headers move
  because the body is empty. Where stable scan positions matter, use the
  supported column sizing to keep the tracks instead of sizing from the rows.
  Bounded Table and DataTable already keep clearance for their own overlay rail.
  Reuse that clearance and compare column edges across the overflow threshold.
- Match initial loading placeholders to the layout users will scan after
  loading. Use ListSkeleton for a DataList and DataTable loadingAppearance
  "skeleton" for table rows. Match density, expected row count and media
  tracks. Keep the toolbar and column layout stable. Keep accepted records
  visible during a background refresh when they are still safe to act on.
  Use DataTable refreshing for feedback without disabling those controls.
- Offer column visibility when users need different subsets of fields for real
  tasks in the same table. Leave it off for compact tables with a fixed task.
  Use one layout control per table. If the screen already has View options or
  Display settings, put column visibility there and pass `hiddenColumnIds`.
  Otherwise enable `showColumnVisibility`. If the table already has search and
  filters, use the `toolbar` render function and put its Columns control in
  `CollectionToolbar.actions` to share the existing tool row. Keep the record
  identity visible with `hideable: false` and save preferences by column ID in
  the host. Keep layout preferences independent of the data query. Verify that
  visibility changes preserve page, selection and sort.
- Enable resizing for columns with variable-length content when readers need
  control over width. Use logical start pinning for record identity and logical
  end for recurring actions when horizontal scrolling would hide them. Persist
  widths by column ID with visibility, and verify keyboard resize, reset, RTL
  and access to the unpinned middle at the smallest intended width.
- Choose short one-line column labels and use DataTable's `unit` badge for
  a shared short unit. Preserve the complete label when a narrow column
  truncates it. Compare the label, sort icon and resize grip on the same row.
- Use DataTable's row disclosure for short details the reader needs while
  scanning parent records. Compose a named nested Table for related line items.
  Keep the disclosure and any record-opening action independent. Use a Drawer
  or separate page for longer detail or editing tasks.
- Use Sparkline when the shape of a series helps a comparison. Supply a label
  that describes the trend, use a shared scale for comparing magnitudes, and
  show decision-critical numbers as text. If a rich trend cell is sortable,
  define the metric it sorts by and supply its raw value.
  Keep the same tone across rows of one metric. A soft area fill supports the
  stroke and follows the same gaps. Reserve semantic tones for meaning and
  keep numbers and labels readable independently of color.
- DescriptionList expresses named values; DataList/DataListItem express records.
  Card/Section/Surface organize groups without inventing a second typography or
  spacing system. A heading's semantic level does not prescribe its visual size.
- For a compact fact with a recognizable prefix, set DescriptionList item
  valueOverflow=truncate. Check the full text on focus and keep a copy action
  available when users need the original string. Keep rich values free to wrap.
- When a ValueChange or ChangeList appears in both an inspector and a page,
  use the adaptive comparison layout. Check the width of the value column
  itself so the before/after labels remain readable inside a narrow list.
- Keep row actions as named Flood Button/IconButton/Menu controls. Do not turn
  a whole row into a competing clickable wrapper around its nested actions.
- FileItem/FileMeta/UploadItem and their list owners compose file presentation;
  use their existing format/size/status/progress primitives. Selection, transport
  and preview are separate host operations. Do not manufacture upload completion.
- Use FileCard when a thumbnail helps people recognize a file in a gallery.
  Keep one thumbnail ratio for comparable assets. For artwork whose full bounds
  matter, use contain. Keep filename links, selection and download independent.
  Give artwork-first galleries top-aligned media so longer titles cannot move
  thumbnail rows. Match the ratio in the loading placeholder.
- Use FileThumbnail for the artwork frame beside a file identity. Pass a
  thumbnailSrc to FileItem or UploadItem to use the same fallback and keep
  nearby labels and actions still during image loading.
- Use FileName for identity in a cell or link, and nameOverflow on a file or
  upload row. Wrap when a hidden part distinguishes the files. In a dense list,
  truncate only when the visible prefix and extension give enough context.
- Preserve native image alt/fallback semantics and aspect constraints. Decorative
  artwork should not duplicate an adjacent accessible identity.
- Use FileList's panel for a standalone collection, plain within a surface that
  already groups the files, and embedded for attachments inside a conversation
  or timeline. When a visible extension identifies the type, omit the repeated
  format and use plain size metadata on the attachment's existing surface.
- Use FileDropTarget with UploadList when a host-owned queue accepts files by
  picker and drop. Use Dropzone for files submitted with the form. Keep
  validation and transfer state in the host.
- Use UploadQueue for a complete transfer region that keeps its picker and
  header visible while rows scroll. Keep entry IDs stable across progress,
  retry and state updates. When a visible picker is the next step, omit
  a second empty-state prompt.

## Compare options on shared criteria

Use ComparisonTable when a decision needs the same criteria across several
options. Put the options in columns and the criteria in rows. Keep units
consistent and show the difference between a known zero and missing evidence.
If an option is featured, name its role in the header. Check that the pinned
criterion stays readable as people scroll to the last option in a narrow panel.

## Choose a chart by the question

Use Metric for a current value, MetricCard for a prominent value and its
optional history on a dashboard surface, and Sparkline for a compact trend in a row.
Use MetricGroup when related values are read together. Give each metric a short
name that still identifies it when clipped. Put units and comparison periods
in their own slots. In stacked metrics, allow a little more breathing room
above the value and keep the comparison close below it. Check the shared value axis with the longest localized
label and exercise the full-label tooltip on hover and keyboard focus.
Add a single panel when the metrics need a surface of their own.
Use `layout="rows"` for related measures in a drawer or summary column.
Keep the label and comparison with their own value when the row stacks.
Use the trend context slot to name the comparison baseline next to its change.
Use MetricDelta for a standalone comparison in a list or table. In a metric
use its trend slot. Keep the signed change legible without color and choose
semantic tone for the outcome. Use a chip when someone scans neighboring values
for changes. Use plain when the main metric already has enough emphasis.
For MetricCard, let the chart follow the value's loading state when both come
from the same request. Override chartLoading only when the history loads
independently. Check that the chart and comparison keep their place while loading.
Use `chartLoading={true}` when history is pending and the host has no chart node
yet. Keep the label visible. Give the value the strongest type role, the change a
compact role, and the baseline a quiet text role.
Keep the chart and comparison grounded in the same measure. Use
LineChart for comparing observations over ordered, equally spaced categories,
BarChart for comparing discrete groups such as actual and planned values per
team, and BarList for ranking a few comparable nonnegative values. Sort BarList
items in the host and retain their exact labels, values and units. Use the same
domain or max across panels that readers must compare. Keep zero distinct
from a missing observation and identify comparison series by line pattern
as well as color. In a LineChart review, traverse dates by keyboard and check
that the value readout exposes missing data without inventing a value.
Keep the value readout compact and close to the active marker, within the plot's
bounds. Keep the marker clear where the readout approaches the edge. Show the
active category on the axis, where it stays tied to the guide. Exercise a dense
series as well as a short one and keep only the axis labels that fit.
Enable LineChart's numeric axis when the reader needs to estimate levels
or compare them at a glance.
Use DonutChart for mutually exclusive parts of one total. Group small categories
only when a combined bucket is meaningful, and prefer BarList for precise
comparisons between similar values. Check zero and empty separately. Keep the
center readout as the single source for an inspected category's name and share.
Keep pointer inspection continuous through the visual gaps between segments.
Check that the center readout moves directly to the next share at each boundary.
Give segments the same visual emphasis when the readout shows the total. Keep
category colors stable and emphasize only the inspected segment's outline.
Use a quiet categorical palette and the same accent and translucent fill as
the other charts. Reserve feedback colors for data that actually carries
success, warning or error meaning.

Use CompositionBar for the same parts in a compact card or panel when category
readouts need to stay visible. Keep category order stable across the bar, its
list and related charts. Use rows for long labels or aligned amounts. Zero
categories keep their readouts and take no space in the track. Use a percent
BarChart for comparisons across multiple groups or periods.
Keep the LineChart and BarChart legends off by default. The inspection readout
already names the series. Enable showLegend when a reader needs to identify
series before interacting or when the chart is presented as a static image.
Use Heatmap to find dense and quiet intersections across two labelled axes.
Compare matrices on the same max and keep missing observations distinct from
zero. Check exact values by keyboard and pointer with both axis labels present.
Keep hit areas contiguous across visual gutters so inspection stays continuous.
Show exact values in a compact tooltip anchored to the inspected cell. Check
that it stays inside the chart at the edges and leaves the matrix in place.
Anchor every BarChart to a shared zero baseline. Use stacked bars for additive
parts and grouped bars for alternatives such as actual versus plan. Keep the
series order consistent across stacks. Check positive and negative directions,
missing values, and exact values with pointer and keyboard at the narrowest width.
Use BarChart's percent layout to compare how the composition changes across
categories with different totals. Keep the raw values in the readout and leave
the column empty when its total is zero.
Use smooth interpolation only when it preserves the observed extrema and
breaks at missing values. Keep rank labels and values aligned independently
of the fill widths.
Use the same accent, translucent fills, tabular values and fast highlight
motion across chart families. Use the LineChart stroke weight for data marks
and keep guides, grids and tooltip borders quieter.
For LineChart, BarChart, DonutChart and Histogram, check that Escape dismisses
the readout, leaves focus on the plot and allows arrow keys to resume inspection.
DonutChart returns to its central total. Keep zero observations distinguishable
from an empty dataset.
Use ScatterChart for paired numeric observations, RangeChart for observed
intervals, and BulletChart for actual values against targets. Give every axis
or bound its unit and keep shared domains consistent across panels.
Use WaterfallChart to explain a sequence of changes and checkpoints. Use
Histogram to show frequencies across numeric intervals and BoxPlot to compare
summaries across groups. Label the units and keep bin edges or scales consistent
when comparing distributions. Name the meaning of the whiskers in the chart
context when it affects interpretation.
Keep Histogram bins contiguous for inspection. A small visual inset separates
the marks while preserving the numeric interval and its full hit area.
When a filter applies to several views of one dataset, derive every view from
the same filtered observations. Keep comparable scales and bin edges stable
across filter changes so a change in height reflects the data.
For Histogram and BoxPlot cards in one row, set a shared
`--flood-chart-plot-height` to align their tick rows. State shared units once
in the surrounding title and keep them in exact values or axis names.
Use DumbbellChart for two measurements of the same group. Preserve endpoint
identity with hollow and filled marks even when the values cross or coincide.
Keep a pointer guide continuous across the plot
while the readout shows exact recorded samples. A visual marker may follow
the curve between samples where data is continuous. Preserve gaps in the
series and keep keyboard inspection tied to discrete samples.

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
Size quick filters within their own toolbar slot. A Select fills its available
width. Give each trigger a compact, bounded width that fits its longest current
value and the disclosure icon. Let the group reflow when the toolbar actually
runs out of room. At the intended desktop width, inspect whether search, quick
filters and row commands fit on the same line with their labels intact. At the
constrained width, check the wrap order or move secondary choices under Filters.
For a dense desktop table, explicitly use `controlSize="sm"` on CollectionToolbar
and on Selects in `quickFilters`, and `size="sm"` on custom peer buttons. Choose
`md` for a roomier query row whose controls and target area need that size. Use
the [control sizing guidance](../flood-hierarchy/SKILL.md#choose-control-sizes-by-working-region)
for the rest of the screen.
When its trigger supplies the shared context, a nearby value can omit repeated
property text. A summary outside the panel needs its property named again.

Use CollectionToolbar for the search/filter query row, with accepted summaries
and a staged editor in filterContent. Keep saved views outside it. The fieldset
uses normal Tab navigation; do not place its editable search in a roving Toolbar.
When a view or status selector occupies the start of a shared row, set
`align="end"` on CollectionToolbar to place search and filters as a group at
the trailing edge. Compare the last visible control to the row's content edge,
including when there is only a quick filter and no Filters button. Let the groups
wrap in order at a narrower size.

When the toolbar spans a wide table and search is its primary entry point, use
`align="split"`. Align search with the table's leading inset. Put independent
quick filters, reset and table commands at the trailing inset. For a narrow
collection or a task that combines text and criteria on every query, keep those
controls near search using `align="stretch"` and let commands occupy the end.
In both cases, keep applied criteria near their controls and keep reset scope
clear. In split layout, reserve reset before quick filters so their end anchor
stays fixed. At reduced width, let groups reflow in search,
filters, commands order or move secondary criteria into Filters. Empty space can
separate groups with different roles. A long gap within one group weakens its
relationship.
Reuse FilterGroup for finite-choice drafts. The host owns validation, Apply,
Cancel, request execution and reset scope; canClear must include quickFilters
state when that slot is used. Preserve any-match meaning in summaryPrefix.
Inactive Clear filters reserves space and leaves the accessibility tree. Removal
and reset focus the persistent Filters trigger, or search without a panel.

DataTable supports ready/loading/error states. Use emptyContent to compose
EmptyState and a meaningful next action inside a ready empty table instead of
removing its headers. Distinguish no records from no matches; only the latter
offers reset of an active query. When the toolbar owns reset, use the empty state
to identify the result and leave the existing reset reachable in the toolbar.
Custom empty content must not stand in for a read failure or pending request.
After reset removes the action, focus a persistent query control. Omit
emptyContent for the ordinary labels.empty message.
The default ready-state result range appears with visible rows. When supplying
labels.results, use an empty-page summary only if it adds information to the
empty-state message.

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
