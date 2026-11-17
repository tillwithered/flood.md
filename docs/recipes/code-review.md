# Code review

Use ChangedFileList for a flat file index with review state, or Tree when reviewers navigate a directory hierarchy. Use CodeDiff for the selected patch. Keep a comment anchor as a file ID, a stable line ID and a side. The display number is useful to a reviewer, but a new patch can reuse the same number for a different line.

Place a DiffStat beside the selected file name when readers need the scope at a glance. Count the selected file's added and removed lines, including changes outside the currently visible context.

Let CodeDiff fold the unchanged lines and supply a named action via `renderLineAction`. Clicking it shows the related CommentThread below that file's diff. Preserve the draft for each anchor when moving between files or switching between unified and split. If a new patch loses an anchor, preserve its discussion and label it as detached.

The host supplies the patch, current diff revision and comment mutation. Update the thread after the application accepts the comment.

Show verification for that same revision in CheckRunList. Identify the checks that block the operation using the host's policy, and link results to their own logs.
Use ReviewRevision when a prior review can become stale. Supply the previous and current revisions when known, and point the comparison link to the changes the reviewer can act on.

[Try the code review workspace](/playground/code-review).

<!-- flood:code-review -->
