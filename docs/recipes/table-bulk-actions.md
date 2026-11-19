# Table bulk actions

## Wire the three owners

- Pass CollectionToolbar to DataTable's toolbar slot. Put search and quick
  filters there. Use CollectionToolbar.onClear and canClear for Clear filters
  in the same control group. Keep a single reset entry for the active query.
  Set `controlSize="sm"` on the desktop query row and its quick-filter Select.
  Its peer command uses `size="sm"`. Give the filter enough width for its longest
  value and the search enough room for the queries users typically enter.
  Use `align="split"` when search leads a wide table and quick filters and
  commands form a separate group at the far edge.
- Place BulkActionBar outside the table with `placement="viewport"`. Pass
  `showSelection={false}` to DataTable so the visible count appears once.
  Keep the filter controls in place as selection changes.
- Use AlertDialog for confirmation and ToastRegion for the accepted result.
  The host owns the filter values, selected IDs and proposal.

Use `TableBulkActionsScreen` as the full-window entry. Its
`AppShell scroll="content" scrollOrientation="vertical"` owns the vertical
scrolling. Reset the host body's default margin. Padded content can use
`scrollContentInset="none"` to preserve its width when the scrollbar appears.
Keep the fixed bulk overlay out of normal flow and horizontal scrolling inside
DataTable. The embedded preview uses `TableBulkActions` from the same source.
[Try the collection workspace](/playground/collections).

## Choose the operation scope

DataTable receives the complete filtered local collection. Its select-all checkbox selects
the current page; selected IDs on other pages are retained. The action uses all
selected eligible IDs in that collection. A protected row cannot be selected.
Remote selection, permissions, transport and server results remain host-owned;
this recipe does not imply selection of every remote search result.

Read workflow:composition, workflow:data-display and workflow:navigation for the
composition and toolbar. Apply feedback/accessibility/verification when checking
the operation. The knowledge catalog links the actual component contracts.

<!-- flood:table-bulk-actions -->

## Ownership and checks

Capture the proposed IDs when opening confirmation. Cancel must preserve rows
and selection. Confirm changes only the eligible IDs in that captured proposal.
The example then clears selection, reports the actual local count and allows
restoring the initial collection. A real asynchronous host needs separate pending,
failure and retry handling; do not report success before an accepted result.

Check no selection, select-all on one page, selection across pages, the protected
row, cancel and confirm, reset, keyboard focus restoration and narrow layout.
Check that Clear filters belongs to the toolbar and that selecting rows leaves the toolbar and table edges stable.
