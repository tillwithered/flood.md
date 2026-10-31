# Record workspace

[Open the working composition](/playground/content#record-workspace).

This host-owned example combines a common page header, native destination links,
filters, applied tags, dataset selection, confirmation and a resizable editor.
It uses the same typed source in the playground and this document. It adds no
AppShell, FilterBar or persistence import to the library.

## Data and lifecycle ownership

The example starts with an empty collection when its key is absent. It never
replaces a malformed or unreadable collection with sample records. A failed read
blocks writes and offers retry, an export of the available raw snapshot and an
explicit replacement confirmation. Replacing records is a user action, not an
automatic recovery routine. Mount a separate instance/key for another collection.

A failed write retains accepted records and the current draft. Explicit Cancel
abandons that draft and its save error. Opening another record or destination with
edits requires confirmation. The collection's unresolved read error has a separate
lifetime. The example's local storage is a host adapter, not a recommended backend
for a production service or a guarantee of durable backups.

## Query and selection scope

The default loader filters/sorts a local snapshot, then returns one page through
the same async boundary as a remote loader. DataTable uses server paginationMode
and never slices that page again. An AbortController and request generation
discard late responses. Changing a filter resets the page and selection. Sorting
resets the page; selection retains its IDs. The current page's checkbox selects
only those rows. Bulk confirmation captures the proposed IDs before applying
the operation, and a failed write leaves that selection available for retry.

Injecting a real loader requires validating its payload and supplying a coherent
total/page result. Transport, permissions, reconciliation with other writers,
authorization and production data durability remain host responsibilities.

## Composition and geometry

NavigationList owns destinations, Grid/Stack own the shell and shared field
tracks, and the header stays at the same top anchor in short and long views.
The pane separator uses ResizablePanels. Table/DataTable keep dense horizontal
overflow in their own region. The editor's Grid can reduce its track count with
enlarged text; label gaps still come from Field. No centering wrapper or bespoke
input/status/progress implementation repairs the layout.

<!-- flood:record-workspace -->

## Verification boundaries

Exercise missing/read-failed/malformed/write-failed storage, retry, explicit
replacement, failed save → Cancel → reopen, native required validation, paging,
sorting, late response rejection, captured bulk IDs, browser back/forward and
1280/1440 widths with 16px/24px root text. Test the last action in each scroll
owner. A fixture's schema or a quiet observer result is not a complete UX,
accessibility or remote-service certification.
