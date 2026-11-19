# Edit product variants

[Open the working variant matrix](/playground/product-variants).

Use EditableGrid when people need to enter or paste values for several variants at once. Use a TagInput for each named option axis and generate the matrix from those values. Keep the axes read-only within each row. Mark incompatible combinations in their own row and make their offer fields read-only. In this example, adding XL to Sizes produces a valid Slate variant and an incompatible Sand combination. Use DataTable when the primary task is finding and inspecting variants.

## Preserve a variant across edits

Derive a stable variant ID from its product and option IDs. A label, SKU, or display position can change. Store accepted and pending values separately. Show the product, option axes, and edited fields in one workspace. Put price units in the heading when all rows use the same currency. Store money as an exact decimal string.

Validate values before applying them to the draft. Check uniqueness against the complete proposed matrix so one clipboard batch can exchange two SKUs. Reject the full batch if a cell is invalid or another variant would keep the same SKU. Leave accepted values, geometry, and keyboard focus in place. EditableGrid supplies the editing state and positions its error next to the affected cell. Confirm the error names the field or conflicting identifier.

Save the draft in one operation. Keep it available while awaiting a response and after a recoverable error. Discard restores the last accepted values. This example saves in local React state and resets when the page is reloaded.

<!-- flood:product-variants -->
