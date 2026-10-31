# Record metadata decisions

Use with the records workflow. These cases demonstrate different outcomes for
similar fields; they are not templates or a forbidden-word list.

| Situation | Decision | Reason |
| --- | --- | --- |
| Browsing suggestions; title/summary identify the item, status guides opening | Keep identity/summary together; a stable trailing state is useful; consider category/date near the copy | Four unrelated trailing values should not dictate the summary width |
| A support queue is triaged by state, priority, assignee and due time | Keep those attributes in named comparison columns | Moving priority into details would obstruct the actual task |
| A suggestion's category is Error but its state is In progress | Use category treatment and lifecycle StatusIndicator; name category in ambiguous details | Classification is not a failed save or error announcement |
| A low-priority item and high-priority item have the same state | Preserve priority if comparing urgency matters; accent only the meaningful distinction | Urgency and lifecycle are separate dimensions, not competing dots |
| A file list must compare format, size and transfer progress | Reuse FileMeta, StatusIndicator and Progress within the file owners | Generic text or a row of handmade chips would duplicate existing primitives |
| An invoice register is used to compare due amounts and payment states | Use named columns, retain units and relevant dates | These fields are core comparisons rather than optional decoration |
| Created and updated render the same day in a casual browsing detail | Consider one date if the second event adds no decision value | A short screen need not repeat equivalent visible information |
| An audit detail needs exact creation and modification times on the same day | Keep both named events with sufficient precision/timezone context | Equal formatted dates do not establish identical events |
| A first-use collection has an empty-state title and a visible create action | Omit a redundant zero counter unless another task needs it | Repeating emptiness does not help the next action |
| Filters reduce an existing collection to zero | Show the no-results state and a relevant reset; preserve needed result announcements | This is a recoverable query state, not first-use onboarding |
| Several short records align in an example but long statuses shift other values | Establish shared columns or change the record composition | Equal Inline gaps do not create common scan positions |
| An inspector flags a priority/date as unowned supporting copy | Evaluate its selection, triage or history purpose | Neither automatic removal nor semantic wrappers prove useful content |

A compact browsing row might place category and recency with its copy and keep
one state at the trailing edge. A comparison table may need several such attributes
visible together. Decide from the task before choosing presentation. Do not fix
crowding by hiding a required field, replacing Flood components or modifying user
record content. Record these choices in development notes, not as extra UI captions.
