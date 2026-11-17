# Map import columns

[Open the working mapping](/playground/import-mapping).

After parsing a CSV, use ImportColumnMapping to show each source column with an example and the field it fills. Use the existing upload state for transport. Give each source column a stable ID even when two columns have the same heading.

Keep the mapping as a draft until verification succeeds. Offer an explicit “Skip” choice in the column mapping. Check that required targets are mapped and each target is assigned at most once. Keep source examples visible if verification fails. For an invalid value, return the source column ID and the file row number, then link the error summary to the affected mapping control. The host owns parser errors, accepted mappings and submission.

Only a successful check for the current mapping enables import. Bind a pending check to its input revision, so a response from a previous mapping cannot unlock the action. To see the data error in this example, skip Work email, map Old email to Email, and check. This local fixture simulates one parsed row with one recoverable error.

<!-- flood:import-mapping -->
