---
name: flood-records
description: Compose record lists and detail views with a clear metadata hierarchy. Use for crowded status/category/priority/date rows, drifting scan positions or deciding between a list and a comparison table.
---

# Select information for the current decision

Read the task and installed DataListItem, Table/DataTable, DescriptionList and
feedback contracts relevant to it. Start with what the user needs to recognize,
compare or act on before opening a record. A record's available schema is not the
content specification for every surface. Use the
[interface-content workflow](../flood-interface-content/SKILL.md) for wording and
[hierarchy workflow](../flood-hierarchy/SKILL.md) for visual relationships.

Use ApprovalChain to show who has decided and where a request is waiting. Group
reviewers who act in parallel under their actual stage, and identify a delegate
with the identity they represent. Use ApprovalRequest for the decision form.
Read the accepted route and outcomes from the host.

Use RecordRelationSuggestion when a service proposes a connection that needs
human review. Keep the target link, reason and decision controls available in
the same row. When a duplicate will merge into a selected record, use
RecordMergeReview to name both records and show where their related data goes.
Keep the destination and its reference readable during pending and retry.
Use RecordRelations after the host accepts a simple link.

Use ChangeRegion for block-level edits. Preserve the wrapper when the marker
clears so the reading position stays stable. Give the marker an accessible
label and keep the actual review controls in the host.
For document-backed review, read `recipe:document-review` for TextRevision,
TextAnnotation and CommentThread. Use ReplyReference in a published comment
when its original would be hard to locate. When the original is already
obvious from the thread, omit the reference. Give same-page sources a unique
CommentThreadItem.anchorId and show an unavailable label when the viewer no
longer has access to the message. Use QuotedPost when the quoted content itself
should be readable in the new message. Supply only the excerpt and media the
viewer may read. Keep the original link independent of any attachment
actions. In an existing details section, use embedded QuotedPost so the
excerpt shares that surface. Give the original link a recognizable source
label, and include a timestamp when it helps locate the exchange.
Use TextAnnotation for discussion of existing
words. Preserve the thread if its anchor is removed, and keep
ordinary thread resolution independent of the text decision.
Use FeedAttribution above an entry when the reason it appears is useful
context, such as a repost. Keep the original author with the entry. Link the
attribution only when the destination matches the person or source named.
Use PublicationPreview for an article with an independent subscription
action for the named publication. Keep that action outside the article link.
Keep the accepted subscription visible while the host processes a change.
Use one UnreadMarker before the first unread item in a chronological view.
Pass the host's visible boundary to CommentThread; focus for a jump belongs on
the target message. Keep the marker passive and remove it when the read update
is accepted.
Use ThreadTrigger below a parent message when its replies open in a separate
panel. Keep the count visible, show unread only for confirmed unseen replies,
and pass the panel's controls to the trigger. Use CommentThread for the replies.
Use TypingIndicator beside a composer for transient participant presence.
Give it a short localized label, let the host expire typing events, and
preserve the composer position between typing and idle.
Use MessageReceipt for delivery feedback on one outgoing message. Reflect
only transport and read states confirmed for the viewer. Pair a failed state
with a separate host-owned retry control when retry is available.
Use GroupReadReceipt beside the timestamp when a group message has confirmed
readers the viewer can inspect. Omit identities withheld by privacy settings.
An empty roster can fall back to the last confirmed MessageReceipt state.
Use ParticipantPopover to disclose a complete roster, including a short role
when the relationship affects the task. Keep subscription controls with the
host and use AvatarGroup when visible identities are part of the record.
Use CollaboratorPresence in the current record toolbar when readers need to
inspect confirmed viewing or editing activity. Keep an empty live roster
distinct from unavailable presence, and clearly qualify a retained snapshot.
Use NotificationSubscription for the viewer's notification scope on one
record. Keep the accepted mode visible during a request and leave the
previous mode selected if the host declines the change.
Use SaveToCollection when a record has a personal save action and can belong
to several named collections. Keep the accepted memberships visible while the
host processes a change. Use a searchable picker when collections are paged or
too numerous for a short menu.
Use ReminderControl to schedule a personal follow-up while keeping the record
in place. Show the accepted time beside the trigger. The host resolves presets
at activation and owns delivery and cancellation.
Use SnoozeMenu when an existing item should leave a queue temporarily and
return at a chosen time. Keep the accepted schedule visible until the host
confirms a change. If acceptance removes the item, move focus to the next item
or the queue heading. Keep ordinary subscription preferences independent.
Use ReplyAudience near Send or Publish when a draft can restrict who may reply.
Supply the actual policy choices and keep the selected rule visible. Changing
that rule preserves the draft. The host accepts and enforces the restriction.

Use VersionHistory when people switch between saved checkpoints of one
artifact and inspect the selected version. Keep restoring separate from
selection. Identify the checkpoint in the confirmation and update the current
version only after the host accepts the restore.

Before JSX, make a short field -> decision -> list/detail placement record in
development notes. Include the reason for an omitted field; do not place this
planning text in the interface. Read the
[decision examples](../record-decisions.md) when meanings or placement are unclear.

## Choose the record structure

For a multiline comment or observation, use DataListItem with
`layout="content"` when available in the installed version. The avatar
anchors to the author row. In a narrow DataList, the trailing commands and
metadata start below the copy on the same edge. Keep links and commands
independent, use a timestamp when it helps interpret the entry, and preserve
authored copy as data.

- Use DataList/DataListItem when identity, a useful summary and opening the record
  are primary. Keep the title and summary as one readable unit. Give secondary
  attributes a subordinate relationship rather than filling every trailing slot.
  In a narrow DataList, a default row with both metadata and actions moves them
  below the title and description. Check the title edge and the trailing action
  edge at the actual list width, including in a drawer on desktop.
- If users compare several independent attributes across records, use Table or
  DataTable with actual named columns. A long Inline of unrelated values at each
  row end is not a substitute for comparison columns.
  For cursor-backed tables, use DataTable's cursor mode and pass
  cursorPagination. It places navigation in the shared footer and can show
  the known range. Keep cursor, sort and request state in the host.
- Use AmountBreakdown after invoice, billing or approval detail when the
  subtotal, taxes, credits and final amount help verify the total. Pass
  formatted values and the authoritative total from the host. If the enclosing
  table already prints the same total, keep one visible total in the workflow.
- Use CurrencyConversion when the same transaction has amounts in two
  currencies. Keep the ISO codes visible, mark estimated values, and show the
  statement amount as pending until it is available. Use a provider-reported
  rate when available. Treat fees as separate reported amounts.
- Use DescriptionList for named values in details. Each item requires a unique,
  stable string `id` alongside `term` and `description`. A detail view can expose
  more information than a list; it does not need to repeat the list's chip arrangement.
  When one value needs the full width for reading, set `layout="stacked"` on
  that item and keep peer facts on their shared tracks. Check the longest value
  and any copy action at the actual panel width.

Use MetadataList for related secondary facts that travel with a record title.
DataListItem details places them in the copy column. Keep comparison values in
the trailing metadata track and independent actions in the actions slot.
Supply each fact once and keep its meaning readable without a decorative icon.
  Use its grid for short overview facts that can sit side by side. Use shared
  term/value columns to scan a longer list. In Metric, use unit for a trailing
  abbreviation and let the host format prefixes and numbers.
- Use a DescriptionList item's `action` for a utility that belongs to a single
  fact, such as copying a reference number. Give the control a name that
  identifies the value. Check that longer values wrap and the action stays
  visible and reachable at the actual panel width.
- Selection is not navigation. A record list does not become ListBox merely
  because users click its entries. Retain a real Link and independent actions.

When a scan signal is useful at the trailing edge, keep its position stable
across sibling records. Test the longest and missing values, not only equal sample
strings. Multiple right-justified values with variable lengths produce shifting
pseudo-columns even when their gaps match. Use an explicit common comparison
structure or move secondary attributes into the copy area.

## Distinguish metadata roles before styling

| Meaning | Existing owner / treatment |
| --- | --- |
| Lifecycle or operation state | StatusIndicator with accurate text; color is supplementary |
| Category, type or membership | Badge when a tag-shaped marker helps recognition; otherwise named/subordinate text |
| Priority or urgency | PriorityIndicator in an explicitly named column or field when urgency drives comparison. Keep one presentation across peers. Choose icon only where the rank is recognizable and the full label is available on hover and keyboard focus. |
| Creation, update, due or event time | Identify the event and appropriate precision; do not treat every date as a status |
| An available operation | Button/IconButton/Menu; do not make an informational badge look actionable |

A category named Error is not necessarily a failed operation. Do not choose
error styling or an announcement from that word alone. Use clear labels in
ambiguous contexts, especially details with several similar-looking values.
A priority is not a second lifecycle status. Do not make all attributes colorful
chips or interchangeable status dots. Keep StatusIndicator rather than hand-drawing
its state text/dot to fit a preferred arrangement.
Use its chip presentation for a compact, tinted lifecycle state. Match the size
of nearby badges and use the same status presentation across peer records.

Use AuthorMeta when a person needs an avatar and visible name, with a role or
timestamp when it helps identify the person or event. Use Comment when an
attributed message needs body content and its own actions. Use a native time
element for dates. Give secondary commands named ghost icon affordances and
keep their targets on the body axis. Use CommentThread for related messages
and give the list a visible heading or accessible name.
Use AvatarGroup for a collection of people. Use its fit layout in a bounded
row where multiple lines would change the row height. Enable its overflow popover
when readers need the remaining names in place, such as in a project card.
Check full names, focus return and scrolling when many people are hidden.
Nest replies under the item they answer. Keep short branches visible and
give larger ones a named disclosure. Use the thread's own indentation and
connectors so a reply stays attached to its parent when the message grows.
In a collapsed branch, the connector leads to the disclosure on the parent
message's text edge. Expand it to verify that the same track continues to
the reply avatars, including at narrow widths and in right-to-left layouts.
Separate peer comments and inbox updates through spacing and hierarchy first.
Enable dividers when those cues leave dense adjacent items hard to distinguish.
Use CommentComposer beside the thread
for a controlled draft. Keep the writing prompt and visible submit label
specific to the task. For a targeted reply, supply the person's name in
replyContext so it appears above the draft and describes the editor. Omit
replyContext for a top-level comment. The host owns the reply target,
submission and focus return if cancellation closes the editor.
Pass onReply on Comment or its thread item for the standard reply action.
Focus the draft when it opens and return focus to that action on cancellation.
Use ImageAnnotations when a discussion refers to a specific part of an image.
Use coordinates from that image and keep its original proportions. Show the
associated ReviewThread in a persistent panel when the user checks multiple points.
Use ImageFocalPoint in an image edit form when banner and card crops need to
keep the same subject in frame. Store the physical coordinates with the host
record and show representative cover crops alongside the editable source.
Use ReviewThread when a discussion itself can be resolved and reopened.
Keep the original messages reachable in either state. Show a resolution when
it records the accepted decision. Pass onResolvedChange only for an allowed
action and pass pending and error from the host. Keep the accepted resolved
value and focused action in place while the request runs or is refused.
Put FileList and ReactionButton in the dedicated Comment slots. Reactions
share the command row and keep their count visible when copy and other
secondary commands are quiet. Update the reaction count and pressed state
together from the accepted host state.
Pass ReactionPicker to Comment's reactionPicker slot. Its trigger stays next
to existing reactions. Reveal it with secondary actions when no reactions exist.
Use ProjectHealth in an overview or collection. Lead with the missing or
overdue report when it changes the next action. Qualify the old assessment
as historical and keep a route to its source available when one exists.
Use ProjectUpdate for a posted project-health report with a narrative, author
and date. Include the project name when the enclosing region mixes projects.
Show recorded field changes when their exact values clarify the update. Keep
posting, history and the snapshot values in the host.
Use ServiceIncident for one service incident. Lead with its current phase
and user-facing impact. Put dated updates in newest-first order and phrase
their titles around what changed. Use UptimeHistory for an availability window
and Timeline for a mixed event feed. The host supplies published incident data.
Use MaintenanceWindow for one published service window. Surface the affected
scope, explicitly zoned interval, phase and user-facing impact together. A
clock change can repeat a wall time, so preserve both offsets when they differ.
Use RecurrenceEditor for editing a repeating schedule.
For a mixed activity feed, use Timeline mode="activity" layout="feed". Keep
simple events in a compact heading and time row. Use rich content only for
the attachment, mention or thread the event refers to. Use layout="schedule"
when times need a shared leading track, and supply explicit names for
intervals such as handoffs rather than relying on connector style alone.
ActivityTimeline and AuditTimeline connect periods by default, including dates
with one event. Verify the join on the actual surface. Add connector="none"
to the preceding event when the history has a deliberate break.
Use ValueChange for the previous and current values of a named field.
Use ChangeList when one event changes several fields. Put field changes in
that event's content and keep actor and time in the event header. Omit the
missing side for additions or removals. Use stacked values when wrapping
would obscure which value came first. In a tight inspector or timeline, verify
localized Before and After labels stay attached to their own values, including
when each label sits above its value. Keep the field's existing presentation,
such as a status chip.
Use AuditTimeline when readers scan grouped events and open field changes
only for the event they need. Verify each disclosure opens independently
and that events with no field changes have no disclosure. Use ActivityTimeline
for feeds with mixed content such as comments, files and field changes.
Use FileList appearance="embedded" for attachments and Alert
appearance="inline" for brief contextual warnings in the feed. Reactions
belong to the specific Comment even when the thread appears in Timeline.
Use CollectionCard for a destination that groups several items. Keep its
title visible and use CollectionCover as passive artwork in other collection
compositions. Use distinct actions for tasks like copying a collection link.
For a gallery where image inspection is a frequent task, use FileCard with
previewPlacement="thumbnail". Use renderPreview on FileCard or FileItem and
pass the supplied trigger directly to ImagePreview or ImageGallery. Use
DocumentPreview for review across numbered pages. This keeps the file's named
button as the opener and the focus target when the preview closes. UploadItem
makes the same preview available once the file reaches success.
Keep filename navigation, downloads and selection as separate controls.
Use AltTextDisclosure beside an image when readers need to inspect its authored
description. Use the same value for the native image alt. Keep its control
separate from any preview button, and use Figure for editorial captions.
Use ImageAltTextEditor when authors edit an image's alternative text. Keep the
preview bounded and its own accessible text independent of the draft. Apply
the publishing limit and decorative-image decision from the host.
Use FileCardGrid for a gallery whose descriptions or available commands vary.
Keep thumbnail ratio, placement and density consistent across cards. Compare
the artwork and footer axes within a row, then narrow the grid and verify the
source order and loading geometry.
Choose minItemWidth at a width where a card's filename and controls still
fit. Use maxColumns to cap the number on a wide surface. Check just before
a new column fits for an artwork frame that has grown too tall.
In a narrow file list, check the visible name prefix, extension and complete
size with touch targets enabled. Keep a single preview beside the copy when it
fits. Multiple commands can move below the copy. In truncation mode, verify
that focus reveals the full name and that the preview returns focus.
Use ImageComparison when the reviewer needs to see what changed between two
images of the same subject. Match the crop, give both versions short labels
and alternative text, and verify that both endpoints keep the frame in place.
Use NotificationList and NotificationItem for persistent inbox updates. Keep
the title link independent from its read command, and let the host own the
unread state. Supply the time and supporting context needed to recognize the update.
In a narrow inbox, the timestamp and read action move beneath the copy. Check
the title edge, the trailing action edge and focus after marking a row as read.

When priority has its own comparison column and uses Badge, render every
populated priority with the same Badge size and variant. Use neutral for
ordinary or low priority and warning for urgency that changes triage. Keep the
priority word visible and sort on the underlying priority value. A missing
priority can use the table's ordinary missing-value treatment.

Keep table statuses on one line. Start with concise labels that distinguish all
states in that column, then budget space for the longest localized label. If a
compact column is useful and users already recognize its distinct state glyphs,
use StatusIndicator's icon presentation with the full label. Check the glyphs
without color. In a view already filtered to one status, include the status
column only when it helps the user compare records or act on them.

Use ellipsis when the visible prefix still distinguishes the item, and expose
the full value on hover and keyboard focus. Use DataTable's string-cell overflow
option for applicable columns. In navigation, controls and narrow rows, check
real labels before shrinking a track. If the visible fragment could identify the
wrong item, use a clearer short label, a wider track, local scroll or a details
view. Keep dates, amounts and other decisive values intact. Use natural wrapping
for descriptions and other content whose role supports multiple lines. Essential
information stays reachable on touch through a visible label or details action.

There is no universal badge limit. For a browsing list, start with identity and
one useful scan signal; admit further visible metadata when it changes selection
or action. For triage, priority may be essential even when every item is normal.
Do not hide necessary comparisons just to make a screenshot quieter. Conversely,
a default low/medium priority does not automatically need a separate visual accent.

## Distribute information between list and details

For a table row whose main action opens an in-place Drawer, use DataTable's
`primaryAction` when the installed version provides it. Title and metadata
share a compact cell, pointer activation extends across the row, and a native
button provides the keyboard entry. Keep checkbox, links and menus independent.
For a real destination, preserve a Link. Use the table toolbar and matching
edge inset when the heading, filters, cells and footer share one surface.

For search, filters and transient selection commands together, start with
`recipe:table-bulk-actions`. Use `CollectionToolbar.onClear` for query reset in
the toolbar and BulkActionBar for selected-row commands. For a full-window
workspace with a changing row count, start from the recipe's
`TableBulkActionsScreen` entry. It uses
`AppShell scroll="content" scrollOrientation="vertical"` as the vertical
scroll owner, including when the page has no app chrome. If workspace padding
already clears the overlay rail, set `scrollContentInset="none"` to keep the
content width stable when the rail appears. Keep fixed actions outside that
ScrollArea and wide table scrolling inside the table. Test populated and empty
views with space-reserving system scrollbars enabled. Check which element
scrolls, that the document reserves zero scrollbar width, and that table edges
stay put when the app scrollbar appears or disappears.

Use BulkActionBar placement="viewport" outside the table toolbar and any
transformed container that would capture fixed positioning. For a selectable
FileCardGrid, start from `recipe:file-gallery`. Keep the accepted selected IDs in the gallery host and use the
same bar for actions on those IDs. Keep individual previews and downloads
on their own cards. Budget any needed
bottom clearance in the base layout so selecting rows preserves both the table
position and the scroll height. Use `showSelection={false}` when BulkActionBar displays the count.
The table still announces selection and can show its result range and pagination.
When the table owns the visible count, use `showSelection="replace-results"`
to share one footer slot. Check the first and last selection at a narrow width
and compare the table and pagination positions.
Give the rail a stable width budget while allowing its capsule to hug its
controls. On a dense rail, use morePresentation="icon" with a descriptive
moreLabel. Check that a long count still leaves room for More and Clear.
When a bordered Surface wraps a flush table, apply `overflow: clip` to that
frame. Keep horizontal scrolling on the table's own ScrollArea. Verify the
outline at both lower corners with a visible footer and check keyboard focus at
the frame's edges.

If a detail table's total summarizes its rows, put it in Table's `tfoot`. Use a
row header for the label and align the amount with the corresponding numeric
column. The existing footer border separates it from the last item. Use an
external summary when its scope includes data beyond the table.

Give a queue's summaries only the prominence they earn in the task. If a
count changes which work to pick up, make the relevant scope clear. If the
table already exposes the decision, compare a quiet inline count with a
separate metric surface before spending the first viewport on summaries.

Classify a collection toolbar control by the thing it changes:

| What changes | Owner |
| --- | --- |
| One selected value filters the same table | SegmentedControl for a few visible choices, Select when the choices need a compact menu |
| The current panel and its associated content | Tabs |
| The current destination | Link |
| An operation runs | Button |

For example, Pending and Reviewed can filter one table even when each state shows
different columns. Use the installed SegmentedControl when its value model fits.
Read its component contract before composing the toolbar. Keep one table and
preserve applicable search and sorting; reset a page or close a detail only when
the new result invalidates it. Keep focus on the selected control. Exercise arrow
keys and check that the selected value updates the rows and accessible state.

Give the status switch and the results a shared start edge. When the switch
sits above a separately framed table, let a parent Stack own the gap. Start with
space-4 and measure from the visible switch outline to the table frame. When the
switch lives inside the table toolbar, use the toolbar's spacing and alignment.
Keep separately painted borders from touching. If the controls wrap, preserve
that separation and check that the filter's current value still reads in full.

Put controls that change which records match under Filters. Put optional fields
and layout controls under Columns or Display. Use the DataTable toolbar's
Columns control in the same tool row as search and filters. Keep view preferences
out of the applied-filter chips and query reset. Check both directions: hiding
an optional field preserves the matching rows, and clearing filters preserves
the chosen columns. See [the collection example](../record-decisions.md#filters-and-display).

Use TagGroup for accepted labels that need removal or count disclosure. In a
CollectionToolbar, set `appliedFilterDisplay.maxVisibleTags` when the accepted
chips crowd the main controls. Keep the count adjacent to the visible chips.
Expanding it should reveal the accepted values without changing the query.

Give each reset operation one location in a collection state. When the toolbar
already clears the same search or filters, let the empty state report the result
and keep the recovery action in the toolbar. A separate clear-search affordance
is useful when it clears only the query and preserves filters.

Protect enough width for the identity and useful summary. Category and recency
can read as secondary information near the title; status may stay in a stable
trailing position. This is one pattern, not a required arrangement. DataListItem
slots accept composition from supported Flood primitives; check their actual
content types before using them. Do not override private slot layout or wrap
ordinary metadata in invented semantics merely to silence an inspector.

In details, group named attributes by purpose. Place the principal state where it
informs action; avoid an unlabeled strip of state, category and priority that asks
the user to infer their meanings. User descriptions remain content, not interface
copy to shorten. A heading or Surface around a description must earn its role;
it is not mandatory for every text field.

Creation and modification describe different events. Keep both when history or
recency matters. If displayed values repeat and the distinction adds no current
value, one visible date may suffice; if exact time matters, use adequate precision
instead of suppressing the distinction based only on equal formatted dates.

## Compose collection states deliberately

Use the `recipe:record-management` material when users need to find a record,
edit it and continue working through the same list. Keep the applied query,
filters, ordering, page and scroll with the mounted collection. After saving,
reapply the current filter to the updated data. If the source row disappears,
return focus to a surviving list control such as search. In a long list, verify
the scroll position and focus separately after both Save and Cancel.

For a table-to-Drawer flow, give DataTable's primary action the record title
and open the same Drawer from the row surface and keyboard action. Group facts
in DescriptionList and related rows in a captioned Table. Keep the Drawer body
as the vertical scroll owner and keep the edit or save action in its footer.
Use floating feedback for the save result so the table stays in place.

Keep search and a frequently used filter visible when there is room. Put
occasional or grouped criteria behind a named Filters action. Show applied
criteria at the list edge so users can tell why a record is missing.

First-use empty, filtered no-results, loading and read failure are different
states. Keep a relevant reset/action and meaningful feedback. A result count can
help filtering or pagination; do not automatically add Found: 0 beside an empty
collection message that already establishes there are no records. Never remove
an accessible update announcement merely to remove a duplicate visible sentence;
check announcement ownership in the feedback workflow.

A product header, page title and section heading must answer different questions.
Do not add a generic product/category eyebrow plus a title plus a sentence restating
it just because the shell has slots. Real branding and navigation context can
justify persistent chrome; preserve that purpose rather than applying a text ban.

## Verify across several records and states

Use isolated fixtures, not fictional records persisted into the user's app. Check
several short and long titles, every meaningful state, differing category/priority
lengths, missing metadata and long dates. Inspect scan positions and copy width
at normal and enlarged text, including 1280px/root24px for the desktop baseline.
No page overflow alone does not prove that the title has readable width.

Open details and return; exercise filters, no-results/reset and row actions.
Check reading order, Link names and action focus separately from visual alignment.
Review each visible attribute's decision value outside the product UI. An optional
observer may flag useful metadata or miss a crowded row; record the contextual
keep/move/name/omit decision rather than treating its output as editorial approval.
