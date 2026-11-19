# Merge duplicate records

[Open the working merge example](/playground/merge-records).

Use ComparisonTable when a decision involves the same attributes across records. Keep stable record IDs in the column headings when names coincide. Show shared values once the merge is proposed. Require a choice only for differing values that affect the resulting record.

Keep the surviving record ID and each conflicting field's source independent. Switching the survivor should preserve selected values when those sources remain available. Label choices with their value and source so the user can compare before committing.

Request confirmation when the merge removes a record or redirects its relationships. Show the exact proposed values before applying them. State which ID survives, what happens to the other ID, and any relationships that would be lost. Cancel preserves the proposed choices and returns focus to the opener. After success, focus the resulting record when the trigger is gone.

For a remote merge, submit both record IDs, their versions and the resolution together. The host must decide how links, history and permissions move, check versions before writing, and update accepted records atomically. This example illustrates the field decision and confirmation with local fixture data.

<!-- flood:merge-records -->
