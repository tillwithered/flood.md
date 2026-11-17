---
name: flood-data-display
description: Assemble Flood tables, lists, cards and file records with long or changing data. Use for content hierarchy, overflow, row actions and data-state composition.
---

# Compose meaningful data structures

Use AgentHandoff to inspect a recorded transfer of responsibility. Keep the
intended recipient visible in failure and unavailable states. Show the outcome
of the enclosing run separately from the handoff event.

Use CollectionImportReview before a collection import. Show the destination
and assessed exclusions together. Preserve the difference between zero eligible
items and an unavailable assessment. Use BatchResult for outcomes after import.

Use MigrationHistory to compare recorded versions across named sources. Report
Missing only for a readable history that confirms absence. Use Unknown when
the source was not observed. Treat a recorded entry as history evidence and
verify actual schema state independently before proposing a repair.

Use BillPaymentSchedule within a bill to show its outstanding balance and
each partial payment. Keep scheduled and awaiting-release payments distinct
from paid ones. The unscheduled amount is a portion of the remaining balance.
Use reported amounts and dates from the host, including explicit zero for a
paid bill and an unavailable state when records could not be retrieved.

Use ExpenseSettlement to show who pays whom on a reimbursement or repayment.
Show the amount of the specific transfer. Treat approval and processing as
separate from a completed payment, and mark an externally paid transfer only
after it is recorded by the host.
Use RefundLinkSummary to show a refund alongside its accepted original purchase.
Show the individual refund amount even when several refunds point to the same
charge. Preserve the difference between a confirmed unlinked refund and
unavailable details. Explain a restriction beside the accepted link.
Use ReceiptMatchReview when someone needs to compare receipt and transaction
values side by side. Preserve both source values and identify differences from
the host's recorded evidence. Report missing evidence as unavailable and source
the verification outcome independently. Use PolicyEvaluation for rule checks.

Use EvidenceChecklist to show which requested materials are missing, received,
accepted or waived. Preserve a visible difference between delivery and review.
Use ApprovalRequest for the decision on the parent record. Keep changes and
focus recovery in the host, especially when a row action disappears after use.

Use ScheduledTaskList to show registered tasks and their triggers. Show a next
run only for an active timed task when the scheduler confirms it. Keep the
accepted pause or resume state in view while a change is pending.
Use ScheduledRunHistory when someone is investigating what happened to one
job. Name manual triggers and show the scheduled time of a skip in place of
a start time. Keep elapsed measurements distinct from completed durations.

Use StorageBucketPolicy to show effective object read access and upload limits
for one bucket. Public read access says nothing about write access. Preserve
the difference between unrestricted MIME types and unavailable policy data.
Use VolumeMountSummary to show a persistent volume’s runtime attachment,
copyable path and recorded capacity. A configured path can be pending and a
detached volume can still report usage. Keep attachment and usage independent.

Use TemporarySpendLimit to review a short-lived change to a card or fund.
Show the base limit and requested increase separately. Show the effective
limit and confirmed reset only while the host reports the increase active.
Label a predicted reset on a pending request as expected.

Use ExpenseAllocationReview to compare a saved allocation with the current
expense total. Keep recorded amounts visible after settlement changes the total.
Use ExpenseAllocationForm when the user can correct and save the split.
Use TemporaryAccessLink after the host issues a download or upload link.
Keep its resource, permission and expiration visible together. Update the
reference clock at expiry and let the storage service enforce access.

Use AdvisorFinding when a diagnostic has identified a specific resource and
its practical impact. Give severity and evidence from the host. Keep observed
facts separate from a proposed repair and expose only remediation controls this
viewer has permission to use.

Use ServiceAvailability when comparing several services over the same period
boundaries. Keep current state independent from the historical summary, align
missing observations as unknown, and link to published incidents when the
reader needs details from an individual event. Use UptimeHistory for one strip.

Use ContentReportStatus to show an accepted report and the reporter-visible
decision in a history or detail panel. Show an in-review phase only when the
service exposes it. Supply a safe record title and omit restricted details.
Use ContentReportForm to collect a report and keep the draft during submission.

Use RevealValue for concealed read-only values with an explicit show action.
Use MutedWordList to review active personal word and tag rules. Show the
matching scope and any exception or expiration beside the term. The host
evaluates matches, policy and expiration. Use ContentAdvisory for an optional
deliberate reveal. Pass mediaRatio for a
single inline image or video so surrounding content stays in place.
The host decides which content can be revealed and when to fetch it.
When the value has a Copy action, check both states at the actual panel width
with touch targets enabled. The actions can sit beneath the value so its prefix
remains readable. Confirm the concealed value cannot be copied through the row.
For adjacent request IDs with a shared prefix, use `preserveEnd` on
TruncatedText or CopyableValue in truncate mode. Exercise two IDs that differ
only at the end and verify the visible suffix and exact clipboard value.
In a detail drawer, use DescriptionList `layout="columns"` for short facts
that people scan as pairs. Check that a CopyableValue aligns with its label.
When enlarged text makes the container too narrow, the pairs stack.

Use ApiKeyList for a credential inventory with scope and lifecycle state.
Use PasskeyList for registered sign-in keys. Distinguish confirmed unused
keys from missing usage data. Confirm removal by name and keep eligibility,
authentication and focus recovery with the host.
Use EnvironmentVariableList for the readable configuration of one environment.
Pass named reference targets and sealed metadata without secret values. Use
KeyValueEditor for editable drafts and StagedChanges to review pending changes.
Use display-safe fingerprints for secret keys and an explicit public-value
resolver for copyable publishable keys. Keep secret issuance and permission
checks in the host. Verify a revoked key has no active controls and that a
successful revocation leaves focus on a stable destination.

Use KeyRotationSummary in the review step when the replacement is known.
Show the current and replacement fingerprints if names are similar. State
when the previous key stops working using the actual retirement policy.
The host owns confirmation, authorization and any secret presentation.

Use RatingValue to display an observed score. Choose fractional stars for a
card with room and the compact score for dense rows. Keep the scale consistent
among comparable rows. A missing rating needs its own state, and zero remains a
valid score. Use Rating when people can enter their own score.
Use RatingSummary when the distribution matters alongside the score. Pass
counts from the same set of reviews, keep the scale consistent across peers,
and use the empty state when no ratings are present. Use RatingBreakdown when the host already
shows the aggregate score. In a filterable breakdown, keep the full counts
while the selected star changes only the review results.

Use Timestamp for event metadata. Keep date formats and time zones consistent
among comparable events. Preserve a civil date as entered. Give relative time
an explicit shared reference so timestamps in one feed agree. Show an absolute
date when the user needs an exact date for a decision or audit.

Use TimestampLink when event metadata doubles as a permanent link to a
specific entry. Point it at a stable route or unique fragment and keep the
visible time in any accessible label that disambiguates repeated entries.

Use ProfileSummary when readers need an identity with a bio, short facts or
profile actions. Use AuthorMeta for the identity alone. Keep links and the
FollowButton independent and let the surrounding list, panel or overlay supply
the surface. Check long handles and omit facts unavailable to the viewer.
Use StarterPackPreview to preview a curated group of people and feeds. Keep
counts tied to the supplied pack and link to a destination where the user can
inspect the full selection. Following and subscribing belong to that workflow.

Use JsonInspector to search or copy part of an API payload or tool input.
Use RowChangeDetails for a selected database event with row snapshots.
Distinguish unavailable or partial captures from a field whose value is null.
Use MediaCredit in a Figure caption to give a saved asset its maker,
publication and date when known. Mark an unverified source explicitly.
Use FilteredImage when a viewer preference blurs an image carrying a known
classification. Keep the entire tile out of the gallery when hidden. The
classification and access decisions belong to the host.

Use SourceList to collect evidence behind an answer. Preserve the marker
shared with the inline Citation when one exists, and keep each citation
close to the claim it supports. Give a source a link only when the viewer has
a usable destination. Check long titles and publishers at the panel width.
Use ToolCall to name an invocation and show its host-reported state while
keeping safe input and output details one disclosure away. Keep an open
invocation stable when its output arrives. Use a single announcement owner
for a stream of parallel calls. Use ToolCallGroup for one visible workflow
step with several invocations. Check that a failed call stays easy to find
while other calls are active and expanded details survive status updates.
Use CodeSnippet to show raw text without branch selection. Keep active
selection and the full JSON Pointer available when keys repeat at different
depths. Exercise a match inside an unopened branch and copy one nested value.

Use LiveFollowControl when another stream view owns scrolling and retention.
Pause following when a user scrolls back to inspect entries. Keep the current
entry in place while paused, and resume only within the stream viewport.
Use LogContext when someone needs events around one search result. Keep the
same environment and service constraints, and restore the previous result
view on close. Add earlier and later records by stable ID and keep the selected
event in place as preceding records are inserted.
Use LogViewer for a live event stream, and LogRow when another list owns the
viewport. Keep stable event IDs and leave transport and retention in the host.
When people inspect a payload or scroll back, preserve the visible position and
offer an explicit way to resume following. Use AuditTimeline for grouped history.
Enable searchable when the reader needs to move between matches in the current
log window. Use a host-side query for records beyond that window or when
search needs to cover structured payloads. Show the actual scope in the label.

Use DependencySchedule to explain a single project's start-date conflict with
its prerequisite's finish. Distinguish a forecast from a planned finish, and
leave the result incomplete when a date is absent. Use DependencyGraph when
jobs or assets have branching prerequisites. A
linear Steps control suits a fixed sequence of stages. Verify a parallel branch,
a node with several prerequisites and the equivalent list presentation.

Use TraceWaterfall for overlapping or nested operation durations on one time
axis. Supply all spans in milliseconds from a shared origin. Keep the domain
based on the full trace when a branch closes, and let the host choose a new
domain for a selected time window. Inspect the same mark before and after
collapsing a branch. Enable controlled span zoom when readers need to inspect an
operation's interval. Reset returns to the base domain and leaves disclosure
state intact. Use WaterfallChart for a running total.

Use DatabaseSessionList to inspect database sessions and observed lock waits.
Keep a confirmed wait visible when no blocker can be disclosed. Link visible
blockers to their sessions and keep termination and permission checks in the host.
Use QueryPlan to inspect individual operations in a database execution plan.
Selection changes the detail pane and keeps focus in the operation tree. Keep
estimates distinct from measurements. Preserve planner cost units, and label
measured time and rows as per-loop values when the source reports averages.
Use Duration for elapsed measurements. Keep the same unit and precision
within a comparison column and sort by the measured milliseconds. Display a
missing measurement explicitly when its absence matters.
Use ImportColumnMapping after parsing source columns. Keep a skipped column
distinct from an undecided assignment, retain source examples during
validation, and bind import eligibility to the verified mapping revision.
Use IndexRecommendation for an advised index with before and after cost
estimates and exact SQL for review. Keep startup and total cost distinct.
Keep migration approval and execution in the host.

Use CodeDiff for prepared source changes with line numbers and context.
Use ChangedFileList as the index when a review covers several files. Keep the
path's link and the review control independent. Supply stable file IDs and
preserve the list position while the host accepts a review-state update.
Use DiffStat beside a changed file or patch heading when the scope of the count
is clear. Match counts to the active file or filter. Show the optional proportion
only where comparing additions and deletions helps people scan the patch.
Use HttpMethod in a dedicated method column. Preserve the recorded case and
keep the response outcome in its own field. Use EndpointLabel for the method
and display-safe path in a request row. Use
HttpStatus for an actual response, and use a named application state when the
request has no response. Keep paths recognizable in narrow columns and verify
the full path is reachable when clipped.
Use HttpRequestRow when a diagnostic list shows the endpoint, outcome, and
elapsed time together. Remove sensitive query data upstream. Distinguish
requests still in progress from requests that ended without a response.
Use HttpExchangeDetails in the selected request’s detail pane. Feed it only
authorized, redacted captures. Preserve the order of repeated headers and
distinguish an empty captured body from a body that was never recorded.
Use GitRef for a branch, tag or commit shown as record metadata. Keep the
reference kind independent from the environment or deployment result. Preserve
the branch suffix when several names share a prefix, and check that the full
value is reachable after clipping. Use EnvironmentSwitcher for changing scope.
Use CommitList for an ordered Git history with commit messages and optional
destinations. Enable copy when users need the exact hash. Keep the short
identifier and the full hash in the same record. Use VersionHistory when the
task is to inspect or restore snapshots of a document or application record.
Use Mention for an account referred to within a comment or update. Give it a
destination when the host has resolved that account. Keep unresolved mentions
as readable text and keep author identity in AuthorMeta.
Use DeploymentHistory for multiple deployments scoped to one service or
environment. Keep the deployment serving traffic visible while a replacement
is building or has failed. Show stage-level diagnostics in PipelineRun and only
render actions eligible for that record. Verify the phase update leaves focus
on the same action when it remains available.
Use ReleaseTargetMatrix to read one release across environments or channels.
Show each target's live version alongside the reported rollout of that release.
Keep the last confirmed live version visible when the new rollout fails.
Use DeploymentHandoff to track two named releases during one active handoff.
Distinguish preparation, overlap, drain and completion with the state
reported by the service. Keep the previous release marked as serving if the
replacement fails before takeover. Show an expected end only for the current
overlap or drain and keep RolloutAllocation for an editable traffic split.
Use ServiceRuntimeStatus for a service that sleeps while idle. Distinguish
sleep, startup, running, a reported wake failure and unavailable runtime data.
Show measured startup time only when supplied by the host.
Use DeploymentHealthCheck in the detail of a rollout that waits for endpoint
readiness. Show the latest probe and the host-reported gate outcome
independently. The elapsed bar measures the timeout budget.
Use CheckRunList for independent checks on one revision. Report missing,
skipped and neutral checks distinctly. Accept blocking status from the host
and link each check to its own evidence when available.
Use ReviewRevision when prior approval can expire after new changes. Show the
reviewed and current commit together when the reviewed commit is known. Give
the comparison link a label that matches the evidence it opens.
See recipe:code-review for file selection and a discussion anchored to a line
and side of the patch.
Use StagedChanges to review a pending draft across resources, with independent
discard actions if the host supports them. Keep the apply decision outside the
review. Verify that discarding a row preserves the other changes and returns
focus to a surviving control when the row leaves.
Use EnvironmentSyncReview when a plan transfers changes between two environments.
Keep the source and destination names visible and show removals before the apply
action. Invalidate a plan when its endpoint pair changes. Verify that a missing
or stale plan cannot be applied and that a confirmed empty plan reads distinctly.

Use ValueChange and ChangeList for changes to record fields. In a long source
review, exercise expanded context and an action on a specific line.
Use recipe:code-editor-workspace for authoring an executable query beside its
results. The application supplies the editor engine and query execution.
Use recipe:version-history for browsing saved snapshots. Compare with the
accepted current version and preserve existing history when restoring a snapshot.

Use MediaTranscript for captions that seek in a player. Keep playback time in
the host and verify that reading earlier cues pauses following, while returning
to playback scrolls only the transcript viewport.
Use MediaSeekBar for arbitrary seeks in a recording. Use the same accepted
position for the transcript and timeline. Pass downloaded intervals from the
player, keeping gaps between them visible. Disable seeking until duration is known.
Use MediaChapterList when users need to scan named sections of a recording.
Share playback time and seek handling with MediaSeekBar. Add non-interactive
chapter marks to the bar and keep named seek actions in the chapter list.
Use MediaTrimRange to choose a contiguous clip, with start, end and retained
length visible. Keep the source and time axis fixed while editing the interval.
Keep preview, export and cancellation in the host.

Use EditableGrid when cells are the task, such as updating several inventory
counts. Use DataTable for browsing records and open Editable for one small
record change. Keep one active cell, a visibly distinct range, and the editor
focus separate. Reject a whole paste when any target is protected, invalid or
outside the grid. Keep accepted data, saving and its undo history in the host.
Keep the editor inset to the cell and align numeric values to the same end edge
before and during editing. Keep neighbouring row and column geometry stable.
Check edit cancellation, returning focus, and a paste into a mixed-validity
range at the actual content width.

Use ReorderList for a collection whose order changes the task. Keep the grip
visible and supply a stable ID for each item. Apply the same placement rules
to pointer and keyboard. Choose between insertion before or after an item and
placement inside a container. Show one unambiguous candidate, keep the order
stable until accepted, and exercise cancelled and rejected moves with focus.

Use KanbanBoard when a move changes the item's group or status. Show an
empty destination as a valid group without inventing an item. Keep the move
menu available for both in-lane ordering and moving across lanes. Use open lanes on a workspace canvas
and contained lanes when an independent lane needs a visible boundary. Let the
card title scan above its description and metadata. Check a lane with several
cards and an adjacent empty lane. The hit area can extend below its contents.
Use `onCardOpen` to open host-owned details from the card title. Keep the grip
and move menu as independent targets. Open a card after moving it and check
that closing its details returns focus to the title in the destination lane.
Use `cardLayout="project"` when a project portfolio needs room for the
assignee, target date or an independent signal such as project health. Keep
the icon decorative and let the lane label carry the grouping status. Use
`dragActivation="card"` to add mouse and pen pickup from open card areas on
read-mostly boards. Keep the dedicated grip as the starting point on boards
with many interactive card elements and for touch pickup.
Check moving within and across columns
with the relevant input methods, including a denied
transition. Keep loading, business transitions and their accepted order in
the host.
Use StackTrace for an ordered call stack, or StackFrame when the diagnostics
screen owns its own list. Pass resolved source context and verify that the
reported source line is marked while frames without context keep their location.

Use ActivityTimeline when a long history scans better in named periods.
Keep the order and date grouping in the host. Keep the same timestamp format
across groups and give each period enough separation to scan without dividers.
Use Timeline for a short history or when times need a shared schedule column.

Use RecoveryWindow beside a restore form to explain a continuous range of
available instants and show where the candidate falls. Use the same display
zone as the form. The application validates the actual restore target before
confirmation. Use BackupPicker for discrete snapshots and supply the actual
capture time, availability and blocked reason. Start with no selection when the
user must deliberately choose which data to recover. Use BackupRestoreDialog
to confirm the exact point, destination and known impact. Revalidate the
selection before submission and let the host execute the restore.

Use Avatar presence for known availability beside an identity. Pass the same
localized state through AuthorMeta or AvatarGroup when those components own the
identity. Keep important status text visible when it changes the next action.
Leave presence absent for people whose availability is unknown.
Use AuthorMeta with inline metadata for a short date beside the name and the
default stacked layout for secondary identity such as a role. Truncate a name
only when the visible prefix identifies the person. The full name remains
available on hover and keyboard focus. Use AvatarGroup with separated spacing
when individual faces need to stay distinct even without presence marks.

Use CopyableValue for an exact value and its adjacent copy action. Keep wrapping
when the whole value must be read in place. In a dense row, use truncate only
when the prefix is recognizable and the whole value is available on inspection.
If similar values differ only at the end, make that distinction visible.
Use ReplicationStatus to compare a primary and its read replicas or to inspect
a replica-only scope. Readiness and freshness are separate facts. Show the
reported health and a measured lag independently, and preserve missing lag as
unavailable. The host defines when a prior measurement has become stale.
Use ServiceEndpointList when operators need several network addresses in
view. Show the reported reachability and protocol together. Keep a TCP
proxy port in the copied address. Omit the address while it is unassigned.
Use NetworkAllowlist to show which sources may connect to a named endpoint.
Use the effective network mode supplied by the host. Keep an empty allowlist
distinct from unrestricted access or a known block. Preserve readable and
copyable IPv6 ranges at narrow widths.

Use ConnectionDetails when a connection method determines both an exact
connection string and the values entered separately in a client. Use short
method descriptions to distinguish the environments they support. Give a blocked
profile an unavailable reason and withhold its endpoint. If the current method
disappears, ask for a new selection. Supply credential placeholders in copyable strings.
Use RevealValue for a read-only token that starts concealed. Name the action
for the token and enable copy only when it belongs in the workflow. The host
owns authorization and retrieval.

Enable selection when it has a real consequence: a bulk operation, comparison or
another requested selection task. Do not add checkboxes merely because the table
supports them. Exercise the resulting action with the actual accepted scope.
For DataList, pass the host's accepted selection through DataListItem selection.
Name each checkbox for its record and keep links and per-record commands
independent. Use reserveSelectionSpace when filtering can leave only rows
without a checkbox. Compare the leading edge before and after selecting.
Use the same selection track on ListSkeleton for the initial load of that list.
Use Card selection for independent bulk selection of a record in a gallery.
Keep the checkbox at the trailing edge of the first row. Give the title and
description space to read when header actions move below them.
CheckCard is a form choice whose surface toggles the option. Keep actions and
links usable beside the record checkbox. If the card's footer reads as part of
the same section, use footerDivider={false} and match it in CardSkeleton.
When the loaded Card has selection, set reserveSelectionSpace on CardSkeleton.
Compare the title track and trailing checkbox position as loading resolves in
the narrowest supported column.
For a file gallery's initial load, use FileCardSkeleton. Match the thumbnail
ratio and placement, whether selection is available, and the expected footer
commands. Once the file record is known, FileCard can render while its image loads.

For ranked links to documents or records, use SearchResultItem in DataList.
When the match lives outside the title, show a short relevant excerpt and name
its field if that helps identify the match. Link to the matched location when
the host can address it. Use the host's actual literal match for emphasis.

For search, multiple conditions or saved query definitions, read
recipe:collection-views from the installed catalog when available. Separate the
working query, an uncommitted condition draft, a named saved definition and the
result/selection state. Save filters and supported sort, not result IDs. Name-only
edits must not commit dirty filters; deleting a view must not delete records.
Give search and filter clearing separate scopes when each has its own control.
Use Reset view to restore the selected definition, including sort. If either
available clear action already restores that definition, show that action once.
Reset/revalidate page and selection when the query changes. Preferences read
failure need not hide an independently loaded collection, but must block writes
to that failed store and must not be disguised as an empty saved-view list.
For a location collection with a map, use recipe:map-and-list. Keep one chosen
ID across markers and rows, and keep the list usable when the map is unavailable.

Use CollectionViewSwitcher for accepted view choice and applicable commands,
separate from CollectionToolbar's working query controls. Offer update only for
an editable changed definition; keep rename name-only. The component requests IDs,
while the host owns acceptance, persistence and confirmation. Return naming and
deletion dialogs to its selectRef when their original action may disappear.

For one finite-choice property/operator/value row, use FilterCondition rather
than reassembling differently sized controls. A property change clears the
previous property's values in the proposed draft. Empty values are incomplete,
not an instruction to broaden the accepted query. The host owns Apply/Cancel,
duplicate-property policy and focus to another condition or Add after removal.
Text/date/number predicates need a deliberate supported editor; do not pretend
the finite-choice row implements arbitrary query semantics.

FilterGroup composes those rows for a flat finite-choice draft. It owns row IDs,
all/any controls and accepted row-change focus; the host owns Apply/Cancel and
query evaluation. Preserve accepted rows when addition limits or duplicate
policies change. Do not turn a new empty row into a broad accepted query or
wrap an empty group in decorative onboarding. Keep group labels contextual;
individual hidden legends/control names remain available to assistive technology.

Use the installed component contracts and
[composition workflow](../flood-composition/SKILL.md). Start with the content's
relationships, not a wrapper around every piece of text.

Keep visual/test fixtures separate from the host's working records unless sample
data is explicitly part of the task. Do not seed a new user's persisted list with
fictional business records just to fill a screen. Use isolated test state for
populated screenshots and exercise the real empty state. When samples are required, identify their provenance in the test brief/README.
A visible distinction is needed where it changes interpretation or action, such
as sample records mixed with real records. Do not automatically add a permanent
Demo badge to the shell of an explicitly requested isolated prototype; follow
the interface-content workflow for contextual placement.

- Table/DataTable preserve caption, headers, cell relationships and documented
  sorting/selection behavior. A footer represents a summary and should be
  visually distinguishable without relying on a heavy border everywhere.
  Mark comparable quantities and amounts with DataTable column `numeric` or
  Table header/cell `data-numeric` for logical end alignment and tabular digits.
  Keep identifiers, such as postal codes and account numbers, aligned as text
  even when they contain only digits. Preserve formatted units and use raw sort
  values when localized text or rich cells would sort differently.
- For a collection that users repeatedly filter, preserve the important column
  tracks at the same viewport as results change. Compare the populated, filtered
  and no-results states. A table can keep its outer width while its headers move
  because the body is empty. Use DataTable columnLayout="fixed" with intentional
  column widths and a readable minimum table width where scan positions matter.
  Leave room for the identity column and allow horizontal scrolling when key
  labels and actions no longer fit. Use automatic sizing when the content
  should determine the tracks.
  Bounded Table and DataTable already keep clearance for their own overlay rail.
  Reuse that clearance and compare column edges across the overflow threshold.
- Match initial loading placeholders to the layout users will scan after
  loading. Use ListSkeleton for a DataList and DataTable loadingAppearance
  "skeleton" for table rows. Match density, expected row count and media
  tracks. Keep the toolbar and column layout stable. Keep accepted records
  visible during a background refresh when they are still safe to act on.
  Use DataTable refreshing for feedback without disabling those controls.
  Use DataFreshness beside the collection when the age of the displayed data
  affects a decision. The update status can change while the timestamp stays at
  the last accepted snapshot. Advance it when the collection accepts fresh data.
- Offer column visibility when users need different subsets of fields for real
  tasks in the same table. Leave it off for compact tables with a fixed task.
  Use one layout control per table. If the screen already has View options or
  Display settings, put column visibility there and pass `hiddenColumnIds`.
  Otherwise enable `showColumnVisibility`. If the table already has search and
  filters, use the `toolbar` render function and put its Columns control in
  `CollectionToolbar.actions` to share the existing tool row. Keep the record
  identity visible with `hideable: false` and save preferences by column ID in
  the host. Keep layout preferences independent of the data query. Verify that
  visibility changes preserve page, selection and sort.
- Enable resizing for columns with variable-length content when readers need
  control over width. Use logical start pinning for record identity and logical
  end for recurring actions when horizontal scrolling would hide them. Persist
  widths by column ID with visibility, and verify keyboard resize, reset, RTL
  and access to the unpinned middle at the smallest intended width.
- Choose short one-line column labels and use DataTable's `unit` badge for
  a shared short unit. Preserve the complete label when a narrow column
  truncates it. Compare the label, sort icon and resize grip on the same row.
- Use DataTable's row disclosure for short details the reader needs while
  scanning parent records. Compose a named nested Table for related line items.
  Keep the disclosure and any record-opening action independent. Use a Drawer
  or separate page for longer detail or editing tasks.
- Use Sparkline when the shape of a series helps a comparison. Supply a label
  that describes the trend, use a shared scale for comparing magnitudes, and
  show decision-critical numbers as text. If a rich trend cell is sortable,
  define the metric it sorts by and supply its raw value.
  Keep the same tone across rows of one metric. A soft area fill supports the
  stroke and follows the same gaps. Reserve semantic tones for meaning and
  keep numbers and labels readable independently of color.
- DescriptionList expresses named values; DataList/DataListItem express records.
  Card/Section/Surface organize groups without inventing a second typography or
  spacing system. A heading's semantic level does not prescribe its visual size.
- For a compact fact with a recognizable prefix, set DescriptionList item
  valueOverflow=truncate. Check the full text on focus and keep a copy action
  available when users need the original string. Keep rich values free to wrap.
- When a ValueChange or ChangeList appears in both an inspector and a page,
  use the adaptive comparison layout. Check the width of the value column
  itself so the before/after labels remain readable inside a narrow list.
- Keep row actions as named Flood Button/IconButton/Menu controls. Do not turn
  a whole row into a competing clickable wrapper around its nested actions.
- FileItem/FileMeta/UploadItem and their list owners compose file presentation;
  use their existing format/size/status/progress primitives. Selection, transport
  and preview are separate host operations. Do not manufacture upload completion.
- Use FileCard when a thumbnail helps people recognize a file in a gallery.
  Keep one thumbnail ratio for comparable assets. For artwork whose full bounds
  matter, use contain. Keep filename links, selection and download independent.
  Give artwork-first galleries top-aligned media so longer titles cannot move
  thumbnail rows. Match the ratio in the loading placeholder.
- Use FileThumbnail for the artwork frame beside a file identity. Pass a
  thumbnailSrc to FileItem or UploadItem to use the same fallback and keep
  nearby labels and actions still during image loading.
- Use FilePath when a review or resource row needs a full path. Keep the file
  name visible before its directory. Use Breadcrumb for navigable segments.
- Use FileName for identity in a cell or link, and nameOverflow on a file or
  upload row. Wrap when a hidden part distinguishes the files. In a dense list,
  truncate only when the visible prefix and extension give enough context.
- Preserve native image alt/fallback semantics and aspect constraints. Decorative
  artwork should not duplicate an adjacent accessible identity.
- Use FileList's panel for a standalone collection, plain within a surface that
  already groups the files, and embedded for attachments inside a conversation
  or timeline. When a visible extension identifies the type, omit the repeated
  format and use plain size metadata on the attachment's existing surface.
- Use FileDropTarget with UploadList when a host-owned queue accepts files by
  picker and drop. Use Dropzone for files submitted with the form. Keep
  validation and transfer state in the host.
- Use UploadQueue for a complete transfer region that keeps its picker and
  header visible while rows scroll. Keep entry IDs stable across progress,
  retry and state updates. When a visible picker is the next step, omit
  a second empty-state prompt.

## Compare options on shared criteria

Use ComparisonTable when a decision needs the same criteria across several
options. Put the options in columns and the criteria in rows. Keep units
consistent and show the difference between a known zero and missing evidence.
If an option is featured, name its role in the header. Check that the pinned
criterion stays readable as people scroll to the last option in a narrow panel.

## Choose a chart by the question

Use Metric for a current value, MetricCard for a prominent value and its
optional history on a dashboard surface, and Sparkline for a compact trend in a row.
Use CycleCapacity before a cycle begins to compare planned work with an
estimate in the same unit. Keep the basis visible when known. Reaching an
estimate informs planning and does not establish a quota.
Use CycleProgress to compare completed work and changing scope over one
cycle. Keep the original scope and latest values distinct. Use observations
in one unit and preserve the final snapshot when showing a closed cycle.
Use MetricGroup when related values are read together. Give each metric a short
name that still identifies it when clipped. Put units and comparison periods
in their own slots. In stacked metrics, allow a little more breathing room
above the value and keep the comparison close below it. Check the shared value axis with the longest localized
label and exercise the full-label tooltip on hover and keyboard focus.
Add a single panel when the metrics need a surface of their own.
Use `layout="rows"` for related measures in a drawer or summary column.
Keep the label and comparison with their own value when the row stacks.
Use the trend context slot to name the comparison baseline next to its change.
Use MetricDelta for a standalone comparison in a list or table. In a metric
use its trend slot. Keep the signed change legible without color and choose
semantic tone for the outcome. Use a chip when someone scans neighboring values
for changes. Use plain when the main metric already has enough emphasis.
For MetricCard, let the chart follow the value's loading state when both come
from the same request. Override chartLoading only when the history loads
independently. Check that the chart and comparison keep their place while loading.
For history with a visible caption or a taller plot, set `chartMinHeight` to
the rendered height including the caption. Compare loading and ready at the
card's narrowest supported width.
Use `chartLoading={true}` when history is pending and the host has no chart node
yet. Keep the label visible. Give the value the strongest type role, the change a
compact role, and the baseline a quiet text role.
In a MetricGroup summary column, check the longest localized number and its
unit at the actual panel width. The row gives longer values more room while
clipped labels retain their tooltip. Choose a smaller value size or a broader
layout if the complete number still wraps.
Keep the chart and comparison grounded in the same measure. Use
LineChart for comparing observations over ordered, equally spaced categories,
BarChart for comparing discrete groups such as actual and planned values per
team, and BarList for ranking a few comparable nonnegative values. Sort BarList
items in the host and retain their exact labels, values and units. Use the same
domain or max across panels that readers must compare. Keep zero distinct
from a missing observation and identify comparison series by line pattern
as well as color. In a LineChart review, traverse dates by keyboard and check
that the value readout exposes missing data without inventing a value.
Keep BarList in journey order for recipe:conversion-funnel. Label the rate
denominator and preserve raw counts when switching how conversion is measured.
Keep the value readout compact and close to the active marker, within the plot's
bounds. Keep the marker clear where the readout approaches the edge. Show the
active category on the axis, where it stays tied to the guide. Exercise a dense
series as well as a short one and keep only the axis labels that fit.
Enable LineChart's numeric axis when the reader needs to estimate levels
or compare them at a glance.
Use DonutChart for mutually exclusive parts of one total. Group small categories
only when a combined bucket is meaningful, and prefer BarList for precise
comparisons between similar values. Check zero and empty separately. Keep the
center readout as the single source for an inspected category's name and share.
Keep pointer inspection continuous through the visual gaps between segments.
Check that the center readout moves directly to the next share at each boundary.
Give segments the same visual emphasis when the readout shows the total. Keep
category colors stable and emphasize only the inspected segment's outline.
Use a quiet categorical palette and the same accent and translucent fill as
the other charts. Reserve feedback colors for data that actually carries
success, warning or error meaning.

Use CompositionBar for the same parts in a compact card or panel when category
readouts need to stay visible. Keep category order stable across the bar, its
list and related charts. Use rows for long labels or aligned amounts. Zero
categories keep their readouts and take no space in the track. Use a percent
BarChart for comparisons across multiple groups or periods.
Keep the LineChart and BarChart legends off by default. The inspection readout
already names the series. Enable showLegend when a reader needs to identify
series before interacting or when the chart is presented as a static image.
Use Heatmap to find dense and quiet intersections across two labelled axes.
Compare matrices on the same max and keep missing observations distinct from
zero. Check exact values by keyboard and pointer with both axis labels present.
Keep hit areas contiguous across visual gutters so inspection stays continuous.
Show exact values in a compact tooltip anchored to the inspected cell. Check
that it stays inside the chart at the edges and leaves the matrix in place.
Anchor every BarChart to a shared zero baseline. Use stacked bars for additive
parts and grouped bars for alternatives such as actual versus plan. Keep the
series order consistent across stacks. Check positive and negative directions,
missing values, and exact values with pointer and keyboard at the narrowest width.
Use BarChart's percent layout to compare how the composition changes across
categories with different totals. Keep the raw values in the readout and leave
the column empty when its total is zero.
Use smooth interpolation only when it preserves the observed extrema and
breaks at missing values. Keep rank labels and values aligned independently
of the fill widths.
Use the same accent, translucent fills, tabular values and fast highlight
motion across chart families. Use the LineChart stroke weight for data marks
and keep guides, grids and tooltip borders quieter.
For LineChart, BarChart, DonutChart and Histogram, check that Escape dismisses
the readout, leaves focus on the plot and allows arrow keys to resume inspection.
DonutChart returns to its central total. Keep zero observations distinguishable
from an empty dataset.
Use ScatterChart for paired numeric observations, RangeChart for observed
intervals, and BulletChart for actual values against targets. Give every axis
or bound its unit and keep shared domains consistent across panels.
Use WaterfallChart to explain a sequence of changes and checkpoints. Use
Histogram to show frequencies across numeric intervals and BoxPlot to compare
summaries across groups. Label the units and keep bin edges or scales consistent
when comparing distributions. Name the meaning of the whiskers in the chart
context when it affects interpretation.
Keep Histogram bins contiguous for inspection. A small visual inset separates
the marks while preserving the numeric interval and its full hit area.
When a filter applies to several views of one dataset, derive every view from
the same filtered observations. Keep comparable scales and bin edges stable
across filter changes so a change in height reflects the data.
For Histogram and BoxPlot cards in one row, set a shared
`--flood-chart-plot-height` to align their tick rows. State shared units once
in the surrounding title and keep them in exact values or axis names.
Use DumbbellChart for two measurements of the same group. Preserve endpoint
identity with hollow and filled marks even when the values cross or coincide.
Keep a pointer guide continuous across the plot
while the readout shows exact recorded samples. A visual marker may follow
the curve between samples where data is continuous. Preserve gaps in the
series and keep keyboard inspection tied to discrete samples.

## Choose the information, not all available slots

For record lists/details, apply the [records skill](../flood-records/SKILL.md)
before filling metadata and actions. Identity, supporting context, lifecycle state,
priority and timestamps have different purposes. Use Table/DataTable when users
need several named comparisons; a trailing Inline of values is not a column model.

Use Table for short static details, such as receipt lines. When DataTable owns
sorting or selection and its result range adds no useful information, set
`showResults={false}`. Keep the range when it helps explain pagination or
the scope of filtered results. Selection feedback and page controls remain.

## Exercise data and geometry

Test no records, one record, long/wrapping names, absent optional media/actions,
loading, error/retry and selection/sorting where available. Keep error text useful
without inserting a second empty-state design or moving unrelated controls.
Align file title/metadata and status/progress by their intended row relationship;
do not hide a StatusIndicator dot or replace Progress with a custom track.

For an editable table, compare the centre of plain amounts and row actions with
the neighbouring input controls. Table centres record/action and editable rows
by default; opt into cellVerticalAlign="top" only for deliberate prose alignment.
Use the shared cellVerticalAlign contract rather than
moving text with transforms or overriding Input, NumberInput or Button internals.
Native style on an individual host-owned td/th can express an exceptional cell.
Do not depend on a low-specificity descendant CSS override. Check the rendered
centres; equal cell padding alone does not establish alignment.

Also inspect readable column widths with long neighbouring records. A centred
cell can still be wrong when a status or date is fragmented into single letters.
Table and StatusIndicator preserve word-based intrinsic width by default; keep
that recipe rather than applying global overflow-wrap:anywhere. Deliberate
technical identifier cells can opt into data-wrap="anywhere". Otherwise use
local scrolling or appropriate column budgets, not an empty no-overflow claim.

Use the documented local overflow owner, with a meaningful accessible name. Focus
the last action/cell and check that a rail or rounded corner does not cover it.
Compare narrow/wide, enlarged text and RTL. Locale-sensitive text in prerendered
examples needs consistent server/client locale to avoid hydration differences.

## Declare remote and selection ownership

Group collection controls by the task they affect. At a wide viewport, use the
available inline space for related search and filter controls. Keep view selection
and its management actions together, and make the result list reachable without
passing several sparse control rows. Add a row when it improves grouping or is
needed for wrapping, rather than assigning a row to each control type. Preserve
logical reading and keyboard order when the same groups wrap at enlarged text or
a narrow viewport. A collection host chooses the layout for its actual content.
Match the heights and typography of fields and actions sharing a control row.
Review the rendered sizes together. Keep management actions beside the view they
affect unless the wider composition gives their separation a clear purpose.

Default to at most two secondary filter controls beside a collection search.
When more than two filter properties are available, put the secondary choices
behind one Filters trigger. Count properties, including inactive filters, rather
than counting component names. Search, view selection, sorting and record actions
have different roles and do not count toward this filter limit. Keep applied
conditions visible as removable summaries and keep Clear filters reachable.
An explicitly primary filter can stay visible when the task warrants it. Move
secondary controls earlier if their labels or enlarged text already crowd the
row. Preserve draft/apply/cancel semantics and meaningful labels inside the panel.
Size quick filters within their own toolbar slot. A Select fills its available
width. Give each trigger a compact, bounded width that fits its longest current
value and the disclosure icon. Let the group reflow when the toolbar actually
runs out of room. At the intended desktop width, inspect whether search, quick
filters and row commands fit on the same line with their labels intact. At the
constrained width, check the wrap order or move secondary choices under Filters.
For a dense desktop table, explicitly use `controlSize="sm"` on CollectionToolbar
and on Selects in `quickFilters`, and `size="sm"` on custom peer buttons. Choose
`md` for a roomier query row whose controls and target area need that size. Use
the [control sizing guidance](../flood-hierarchy/SKILL.md#choose-control-sizes-by-working-region)
for the rest of the screen.
When its trigger supplies the shared context, a nearby value can omit repeated
property text. A summary outside the panel needs its property named again.

Use CollectionToolbar for the search/filter query row, with accepted summaries
and a staged editor in filterContent. Keep saved views outside it. The fieldset
uses normal Tab navigation; do not place its editable search in a roving Toolbar.
When a view or status selector occupies the start of a shared row, set
`align="end"` on CollectionToolbar to place search and filters as a group at
the trailing edge. Compare the last visible control to the row's content edge,
including when there is only a quick filter and no Filters button. Let the groups
wrap in order at a narrower size.

When the toolbar spans a wide table and search is its primary entry point, use
`align="split"`. Align search with the table's leading inset. Put independent
quick filters, reset and table commands at the trailing inset. For a narrow
collection or a task that combines text and criteria on every query, keep those
controls near search using `align="stretch"` and let commands occupy the end.
In both cases, keep applied criteria near their controls and keep reset scope
clear. In split layout, reserve reset before quick filters so their end anchor
stays fixed. At reduced width, let groups reflow in search,
filters, commands order or move secondary criteria into Filters. Empty space can
separate groups with different roles. A long gap within one group weakens its
relationship.
Reuse FilterGroup for finite-choice drafts. The host owns validation, Apply,
Cancel, request execution and reset scope; canClear must include quickFilters
state when that slot is used. Preserve any-match meaning in summaryPrefix.
Inactive Clear filters reserves space and leaves the accessibility tree. Removal
and reset focus the persistent Filters trigger, or search without a panel.

DataTable supports ready/loading/error states. Use emptyContent to compose
EmptyState and a meaningful next action inside a ready empty table instead of
removing its headers. Distinguish no records from no matches; only the latter
offers reset of an active query. When the toolbar owns reset, use the empty state
to identify the result and leave the existing reset reachable in the toolbar.
Custom empty content must not stand in for a read failure or pending request.
After reset removes the action, focus a persistent query control. Omit
emptyContent for the ordinary labels.empty message.
The default ready-state result range appears with visible rows. When supplying
labels.results, use an empty-page summary only if it adds information to the
empty-state message.

Client DataTable receives the complete local collection. Server paginationMode
receives one already sorted page, controlled page/onPageChange and totalRows;
sortable server columns require controlled sort/onSortChange. Do not locally
slice or sort a server page. Reconcile page when a filter reduces its total.
The host owns query identity and abort/request generations so a late response
cannot replace the current query. Present loading/error explicitly rather than
labeling old rows as an accepted new page.

Server page selection covers supplied rows only. Dataset scope requires controlled
selectedIds and host validation of IDs beyond that page. Select-page never means
select every search result. Clear/revalidate selection on query or permission
changes. Capture confirmed IDs and keep the proposal after an operation refusal.
Use BulkActionBar for a compact selected-record command rail; it composes
Toolbar and OverflowActions and keeps one row with a pill exterior. Prefer two
visible commands; at most three, with lower-priority commands in More. Use a
general Toolbar for unrelated editing controls rather than adding them here.
Show the actual selected count, distinguish page selection from the collection
scope, and keep clearing selection separate from resetting filters. Confirm
consequential actions against a captured list of IDs. Pending work targets that
snapshot even if the visible query changes. On success remove only those IDs
from current selection and reconcile pagination. Preserve accepted records and
selection after rejection, and retry the captured proposal. Give disappearing
action bars an intentional focus destination. Keep confirmation dialogs outside
the Toolbar's roving descendants.
A floating selection bar can keep record layout stable while selection changes.
Anchor it to the viewport with safe-area spacing and a bounded width. Measure
actual height and reserve scroll clearance so final rows and pagination remain
reachable. Verify its menus near the viewport edge and keep modal confirmation
in the dialog layer.
Read recipe:record-workspace from the matching installed catalog for a working
composition and its limits.
