# DataTable

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
an automatic callback. Pass a complete collection, not a single server page.
For server pagination, compose Table and Pagination with your query state.

## States and presentation

`state="loading"` replaces rows with Spinner and marks the region busy.
`state="error"` shows Alert and an optional retry Button through `onRetry`.
An empty ready collection shows the empty message. Sorting, selection and page
controls are blocked while loading or errored. Existing selection is retained.

`density`, `striped`, `hideCaption` and `minWidth` adapt presentation. Horizontal
overflow stays in the existing ScrollArea. Keep the caption meaningful even when
visually hidden. The ref points to the outer container; native DOM props apply
there. `labels` localizes states, sort/selection names, counts and pagination.
Application filters, permission checks, bulk actions and cross-page data fetching
belong to the host. See the Filter bar recipe for a composed example.
