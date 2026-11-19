# Version history

Use DataList for saved snapshots when people need to compare or restore a specific revision. Keep the version being inspected distinct from the accepted current version. Show the author and exact time, and use ChangeList for structured fields or CodeDiff for prepared text differences.

<!-- flood:version-history -->

Restoring creates a new version from the chosen snapshot. The host verifies permission and the expected current revision, accepts the restore atomically and reloads the version list and comparison. Keep old revisions accessible. If the current revision changed, ask the user to review the new comparison before submitting it again.

Check the current/selected distinction, cancel and focus return, network rejection, and the accepted history after success. Verify that opening a snapshot never mutates the record.
