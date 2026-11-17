# DataTable

Use `paginationPresentation="compact"` for a tight table footer when previous
and next are enough. Localize the page position through `labels.pagePosition`.
Use `paginationPresentation="arrows"` when the visible result range supplies
enough context. `labels.pageNumber` formats the digits in numbered pagination.

Use `showSelection="replace-results"` to show the selected count in place
of the result range. The range returns when selection clears. When a
BulkActionBar already displays the count, use `showSelection={false}` and
keep the table's accessible selection status.

A native table composed from Flood Table, Checkbox, Button, Pagination and
feedback components. It sorts and pages one complete client-side collection.
It does not fetch data, virtualize rows or implement spreadsheet/grid keyboard
navigation. Links and controls in cells keep ordinary native Tab behavior.

```tsx
<DataTable
  caption="Projects"
  selectable
  pageSize={5}
  columns={[
    {id: "name", label: "Project", sortable: true},
    {id: "members", label: "Members", sortable: true, align: "end"},
  ]}
  rows={[
    {id: "design", label: "Design system", cells: {name: "Design system", members: 12}},
    {id: "website", label: "Website", cells: {name: "Website", members: 4}},
  ]}
/>
```

Import DataTable and shared styles from `@flood-md/react`; render inside FloodRoot.
Column and row IDs must be nonempty and unique. Each row's `cells` is a record
keyed by column ID. Cells may contain Badge, Link, Menu or other React content.
Supply `label` for a readable row-selection name; otherwise the row ID is used.

In a ready empty table, the empty-state message carries the result. The default
result range appears when there are visible rows. A supplied `labels.results`
can still provide a project-specific summary for an empty page.

## Sorting

Only `sortable` columns get a sort button. Activation cycles ascending,
descending, then original source order. A sorted header exposes `aria-sort`.
String cells use locale-aware numeric collation; numbers compare numerically.
Use `row.sortValues[columnId]` for rich cells. Missing or null sort values stay
last in both directions. Ties retain source order. Do not mutate arrays in place.

`sort` / `onSortChange` control sorting; `defaultSort` initializes local state.
A sort request also requests page 1. If controlled, accept the proposed state
in the host; rejecting it leaves the corresponding rendered value unchanged.
The host must coordinate sort, page and selection when controlling several props.

## Column visibility

Offer column visibility when people working with the same table need different
subsets of fields. For a compact table with a fixed set of task-relevant fields,
use the default layout. Horizontal overflow alone is a reason to review the
layout and local scrolling.

Set `showColumnVisibility` to add a Columns menu to the table toolbar. The
checkbox items apply immediately and keep the menu open for further changes.
Reset columns restores the initial visibility and widths.
When the table already has search and filters, place the supplied Columns
control in that row through the `toolbar` render function. CollectionToolbar
accepts it in its `actions` slot beside Filters. Its command group wraps on
narrow layouts.
If the screen already has a View options or Display settings menu, put column
visibility there and pass `hiddenColumnIds` to DataTable. Use one entry point
per table. Keep this preference with the table layout so it stays independent
of search and row filters.

```tsx
<DataTable
  caption="Projects"
  showColumnVisibility
  columns={columns}
  rows={rows}
  toolbar={({ columns: columnsControl }) => (
    <CollectionToolbar
      label="Project tools"
      searchValue={search}
      onSearchValueChange={setSearch}
      filterContent={filters}
      actions={columnsControl}
    />
  )}
  defaultHiddenColumnIds={["region"]}
  hiddenColumnIds={hiddenIds}
  onHiddenColumnIdsChange={setHiddenIds}
/>
```

Initialize controlled `hiddenIds` in the host. Omit it for local state initialized
by `defaultHiddenColumnIds`. To persist a layout, save the proposed IDs in the
host. Pass `hiddenColumnIds` on its own to apply a layout with your own controls.
Unknown IDs are ignored. Mark an essential column with `hideable: false`.

The current sort column and columns carrying row primary actions remain visible.
The menu marks the sort column and disables its visibility toggle. If a saved
preference hides that column, it takes effect when sorting moves elsewhere or is
cleared. At least one data column stays visible. Visibility changes preserve
row selection, pagination and sorting. Localize the menu through `labels.columns`,
`labels.resetColumns` and `labels.sortedColumn`.

Choose `minWidth` to suit the smallest intended layout. A fixed minimum still
applies after hiding columns. Use `minWidth="min-content"` when the table should
size to the remaining columns and scroll locally when they need more space.

## Column widths and pinning

Set `state="loading"` and `loadingAppearance="skeleton"` to keep the table
header and show decorative placeholders on the existing column tracks. Set
`loadingRowCount` to the expected number of rows, up to `pageSize`. It
defaults to five or the page size, whichever is smaller. Provide
`defaultColumnWidths` or controlled widths when column positions must remain
fixed across a load. Set `placeholderLines: 2` on columns with a title and a
secondary line so the loading row reserves that height. Intrinsically sized
columns can expand when real values arrive.

Set `columnLayout="fixed"` for a collection where users scan the same columns
before and after filtering, loading or an empty result. Set `column.width` for
columns that need a deliberate share and leave a flexible column to take the
remaining space. Choose `minWidth` so the table scrolls before essential labels
or actions become unreadable. Use the default `auto` layout when row content
should determine the column widths.
In expandable collections, pass `defaultExpandedIds={[]}` (or a controlled
`expandedIds`) to reserve the disclosure track when the rows are absent.
Keep the identity column visible across results with `hideable: false`.

Use `refreshing` with `state="ready"` for background requests while the
accepted rows remain safe to use. The progress cue follows the table header
without changing its height or blocking selection, sorting or paging.
Localize it with `labels.refreshing`. Keep the request, its errors and
acceptance of updated rows in the host.

Set `resizable: true` on columns whose content benefits from an adjustable
width. Use `width` for the initial CSS width and `minWidth` / `maxWidth` for
resize limits in CSS pixels. Drag the horizontal-arrow handle at the edge of
the header or focus it and use Left/Right. With a mouse, the handle appears
when the pointer reaches the column edge. It stays visible during a drag or
keyboard focus and on touch-first devices.
Home and End move to the limits. Hold Shift with an arrow key for a larger
step. Localize the handle through `labels.resizeColumn`.

`defaultColumnWidths` initializes widths by ID in CSS pixels. To persist
them with a view, use `columnWidths` and `onColumnWidthsChange` alongside
the visibility preferences. The same Columns menu resets both preferences.

Set `pinned: "start"` on a record identity column, or `pinned: "end"` on a
column with a recurring action. Pinned columns stay on the logical edge
while the table scrolls horizontally. When the pinned area leaves too little
space for other columns, all columns scroll together.

Set `maxViewportHeight` to give the table its own vertical scroll area.
Add `stickyHeader` to keep column names and header controls in view within
that area. The toolbar and pagination sit outside the scrolling viewport.
Leave enough height to show the header and several body rows together.
The table keeps a stable clearance at the logical end for its overlay
scrollbar as rows are added or removed.

Keep column labels short. DataTable lays them out on one line and truncates
the visible label when a column is resized below its text width. The full
name stays available to assistive technology. An overflowing label opens a
Flood Tooltip on hover or keyboard focus.
Pass a short `unit` such as `"USD"` or `"kg"` to display it beside the label
as a badge. Put the unit in the header when it applies to every row.

Use `StatusIndicator` with a short, single-line label for row status. In a
compact status column, `presentation="icon"` accepts a recognizable glyph and
keeps the full label available through Tooltip and assistive technology.
Use the same StatusIndicator size throughout the column so icon backplates
and text-status dots share one leading track, including in RTL.
For a priority column that uses `Badge`, use the same size and variant for
each populated value. A neutral badge suits ordinary priority and a warning
badge can emphasize urgent work. Supply the underlying value in `sortValues`.
For a plain string column whose visible prefix remains meaningful, use
`cellOverflow: "truncate"` with a suitable column width. A clipped value gains
a tooltip on pointer hover and keyboard focus. Rich cells, primary actions and
multi-line descriptions keep their own layout. Keep decisive and ambiguous
values readable by giving them space or a visible details view.

## Row details and trends

For inline editing, supply controls through the row's `cells`. Use a
`Badge` inside a named `Menu` trigger for a status, and `Editable` for
an amount. Commit changes by stable row ID. Supply the committed primitive
through `sortValues` so sorting tracks the accepted value in a rich cell.
Use `Editable.validate` to keep an invalid draft open with a message.

Supply `row.expandedContent` to give a record an independent disclosure
button. Its detail row spans the visible columns, including table controls.
The detail content fits the visible table viewport as its columns scroll.
Compose a nested Flood Table with its own caption for short related records
such as line items. When the first column label identifies the group, keep it
in the header row alongside the other labels. A branch guide connects the
parent's disclosure to the expanded group. Sorting, selection and pagination operate on parent
records. Use `defaultExpandedIds` for initial state or
`expandedIds` / `onExpandedChange` for controlled state.
Localize the controls and header through `labels.expandRow`,
`labels.collapseRow` and `labels.rowDetails`.

Use [Sparkline](sparkline.md) for a short series within a cell. Use one shared
`domain` for rows whose magnitudes should be comparable. Keep the latest value
or period change visible when it is needed for decisions. A sortable trend
column needs a numerical `sortValues` entry per row that matches the header.

## Selection and pagination

`selectable` enables multiple selection. `selectedIds` / `onSelectionChange`
control it; `defaultSelectedIds` initializes local state. Checkbox labels name
the current-page aggregate and individual rows. The aggregate becomes mixed
when only some selectable visible rows are selected.

**Select all means the current page.** Selection on other pages is preserved.
Rows with `selectionDisabled` cannot be selected. Removed and unavailable IDs
are ignored when rendering, counting and proposing new selection; no callback is
automatically fired just because the input collection changed. This selection
does not write hidden form inputs or imply selection of remote records.

`page` / `onPageChange`, `defaultPage` and positive `pageSize` control pagination.
When rows shrink, the visible page clamps to the final available page without
an automatic callback. In client mode pass a complete collection. For server
pages, use `paginationMode="server"` with controlled page, `totalRows`, and
controlled sort when columns are sortable.

For an API with opaque cursors, use `paginationMode="cursor"` and pass the
current batch as `rows`. Set `cursorPagination.previous` and
`cursorPagination.next` to native link targets or host request callbacks.
Use `cursorPagination.pending` during a callback request. An optional
`cursorPagination.position` shows a known range in the footer's result slot.
The footer accepts cursor controls even when the current batch has no rows.
With sortable columns, provide controlled `sort` and `onSortChange` and restart
from the appropriate cursor when the query changes. Selection defaults to the
loaded page. For controlled dataset selection, localize the count with
`labels.cursorSelection`.

## States and presentation

`state="loading"` shows a Spinner by default. Use `loadingAppearance="message"`
for a compact LoadingState with a visible `labels.loading` message. It uses the
table's single status announcement and pairs with a compact row ErrorState.
`state="error"` shows ErrorState
and enables its retry action if you supply `onRetry`. An empty ready collection
shows `emptyContent` or the localized fallback message. Each spanning message
stays in the visible table area during horizontal scrolling. Sorting, selection
and page controls are blocked while loading or errored. Existing selection is
retained.

Provide `errorContent` to customize a failed read, for example with a compact
`ErrorState layout="row"` and a host-managed retry. Keep `labels.error` consistent
with the visible failure message, and restore focus when recovery removes the
action. In a filtered empty result, use the existing filter reset when it is
already visible in the toolbar.

`density`, `striped`, `hideCaption` and `minWidth` adapt presentation. Horizontal
overflow stays in the existing ScrollArea. Keep the caption meaningful even when
visually hidden. The ref points to the outer container; native DOM props apply
there. `labels` localizes states, sort/selection names, counts and pagination.
Application filters, permission checks, bulk actions and cross-page data fetching
belong to the host. See the Filter bar recipe for a composed example.
