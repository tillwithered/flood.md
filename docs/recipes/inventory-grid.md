# Inventory grid

Use EditableGrid for cell-level edits and rectangular clipboard selection. This
example filters and sorts 1,600 records, keeps the product column visible and
updates the stock summary when a validated edit commits.

<!-- flood:inventory-grid -->

Keep filtering, sorting and calculated totals in the host. Supply stable row IDs
and validate the entire change batch before applying it. The example uses one
local dataset. For remote data, send the current sort and filters to the server
and state what the summary covers.

Virtualized rows use a fixed height and render single-line values. Use the
default nonvirtual presentation when cells need multiline content. Use DataTable
when the primary operation is selecting records or opening row details.
