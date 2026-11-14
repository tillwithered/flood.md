# Table bulk actions

Compose DataTable, Toolbar, Button and AlertDialog with host-owned selection and
operation state. There is no separate BulkActions import. The runnable example
uses the same typed source as this page and only changes an in-memory collection.

For a screen with search and filters, put those controls in one
[CollectionToolbar](https://flood.md/components/collection-toolbar) and use
[BulkActionBar](https://flood.md/components/bulk-action-bar) for transient
selection actions. [Open the collection workspace](/playground/collections) to
try this layout. When the action bar shows the selection count, suppress the
duplicate count in the table footer. Verify that selecting the first row leaves
the toolbar and table in place.

## Choose the operation scope

DataTable receives the complete local collection. Its select-all checkbox selects
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
Use the table's ScrollArea rather than letting its minimum width overflow the
page. StatusIndicator owns the action result; do not replace it with custom
status markup. Scope and rendered quality require actual host checks, not just
a passing knowledge lookup.
