---
name: flood-feedback
description: Choose Flood status, progress, alert, loading and empty-state feedback with honest operation state. Use for meaningful messages and announcement ownership.
---

# Describe what actually happened

Use installed declarations and [accessibility](../accessibility.md). Assign the
visible role before choosing color: StatusIndicator names a state, Badge marks
metadata, Progress describes task progress, Meter describes a bounded measurement,
Alert gives contextual feedback and EmptyState explains missing content.
Use NoResults for a collection narrowed by search or filters. Keep the relevant
input or filter in place and provide one reset action. If that action sits in
the empty region, return focus to a persistent control before replacing it.
Use NotificationInbox when people revisit persistent updates and filter by
unread state. Open destinations via NotificationItem links and let the host
own accepted read state. Keep the filter in place after a read action.
Use NotificationTrigger for the header action that opens that inbox. Derive
the button's unread count from accepted host data so its marker clears when
the inbox is caught up. The overlay owns expanded state and return focus.
Use NotificationInbox appearance=overlay for the floating inbox. It keeps the
filter and read action close and uses the unread dot for scan emphasis.
For a first load, use its loading state and match the placeholder media and
description to the accepted rows. Keep the error visible during an in-place
retry so the retry action can retain focus.
For the initial load of a plain Table, match its structure with TableSkeleton.
In DataTable, use the built-in skeleton state. Set two placeholder lines only
where the loaded cell normally includes secondary text.
Use Metric state loading for a pending value and unavailable when a value
cannot be shown. Keep real zeroes visible. In a group, keep accepted sibling
values while one measure loads. If a refresh can retain a valid value, keep it
visible and let the host announce the refresh at the region level.

For several record attributes, use the [records skill](../flood-records/SKILL.md).
A category called Error is not a failed operation; priority is not lifecycle state.
Choose the semantic owner before its appearance, and keep essential triage data
visible even when reducing decorative emphasis.

## Keep one owner for each message

- Status text must distinguish pending, success, failure, cancellation and local
  preview state. A callback firing or elapsed timer is not a completed backend
  operation. Do not display a success count, upload or save that did not occur.
- Unknown Progress has no known percentage; Meter has no unknown state. A useful
  label/valueText explains units when a percentage would be misleading.
- Use CapacityMeter for fixed quotas that usage can exceed. Pass actual usage
  and a capacity in the same units. Use warningAt only when the product has a
  defined threshold. Keep the actual amount and the limit in the readout.
- Use the Meter reference mark for a named point inside the displayed scale.
  Use BulletChart to compare actual and target values across several rows.
- Use ProgressRing for a single task in a compact row or card. Supply localized
  valueText when someone needs the exact amount. Use Spinner for a short busy
  state with no meaningful amount, and DonutChart for categories within a total.
  Keep a named progressbar even when the ring stands alone.
- For Progress and Meter inside compact rows or panels, use `layout="inline"`
  when the caption and a readable track fit on one line. Check the longest
  localized caption and value at the actual width. The track moves below
  the caption as space runs out.
- In UploadList, exercise the longest localized upload status at the actual
  list width. Keep the track measurable and the cancel or retry action
  reachable if the status and track wrap.
- Use UploadItem paused for an accepted pause and keep the last confirmed
  transfer percentage. A paused transfer with no known percentage has no
  animated track. Use processing when the bytes have arrived and the file is
  still being scanned or processed. Show success when the file is ready.
- Alert/Toast/live-region choices depend on urgency. Keep static explanation
  silent unless a change requires announcement; do not add multiple live regions
  around a composite's existing announcement. Announce does not imply a visible
  style change or guarantee speech from every assistive technology.
- Spinner retains a meaningful accessible label where standalone. Skeleton is
  decoration, not another announced task. Preserve the existing reduced-motion
  behavior without introducing a new animation system.
- Use LoadingState when a visible message identifies a pending region that
  has no accepted content. Match nearby EmptyState and ErrorState layouts.
  In DataTable, `loadingAppearance="message"` uses the table's one announcement
  owner. Keep existing results visible on refresh.
- For an initial card load, match CardSkeleton to the Card's density, short
  body line count and optional slots. Compare the card's top and bottom edges
  at replacement. Announce loading once across a card grid. During a refresh,
  preserve accepted cards and put the busy state on the relevant region.
- EmptyState identifies the actual condition. A title can be enough; add a
  description only for new decision-relevant information, not an instruction
  repeating a visible action. Its icon/action use existing primitives.
- Use ErrorState when a failed region cannot display its content. Match its
  layout and density to the related EmptyState. Use the inline layout for
  smaller sections, a named retry if recovery is possible, and visible
  feedback for retrying. Keep one announcement owner and give focus a
  stable destination when recovery replaces the action.
- Use the row layout for compact empty and error states inside a bounded
  collection. Check that the recovery action moves below the message as
  space runs out. Keep an existing visible filter reset as the single owner
  of that action. DataTable errorContent supports a custom ErrorState and
  labels.error names the failure for its existing announcement.

## Scope feedback to its operation

Use a floating ToastRegion for the result of a discrete action in a collection
that is still usable. Keep a failed action's toast available while its retry
is offered, and preserve the operation's captured targets. Test overflow with
several long messages and verify that focusing an action scrolls the stack
without shifting card widths. Start at bottom-end
and keep the toast clear of selection actions. Use an inline Alert when the message belongs to
the affected section, for example when a read failure blocks the table itself.
Use Alert's action slot for a named recovery that belongs to the message.
The command stays outside the announcement and moves below the message when
width is limited. Use Flood Button variants so hover and press inherit the Alert tone.

Associate a message with the operation and record that produced it. Preserve
entered data after refusal and keep a useful error while that operation remains
unresolved. A successful retry clears/replaces its failure. Explicitly discarding
the draft ends that draft's save error; it must not follow the user to a list or
another record. Ignore late results belonging to an abandoned operation.

Do not solve this with an automatic timer inside Alert or by clearing every
message on navigation. A collection-wide read failure can still block editing
after changing views and must remain until resolved. The host's state model owns
that distinction; the feedback primitive only presents the supplied state.

## Evidence

After a collection action, check that its result is visible at the current
scroll position and that success, refusal, retry and dismissal leave the
table header and scroll height in place.

Trigger the operation and observe each applicable transition, including failure
and retry. Also follow failure → explicit discard → list → reopen a saved record;
the abandoned draft's failure must be gone and the saved data unchanged. Distinguish
that from a still-unresolved collection-wide error. Check optional description/action/icon slots, long messages and text
enlargement. Keep content visible without stealing focus merely to announce it.
Reserve feedback space in a demo when needed for a stable sample, not universally
inside every production component. Report audible announcement behavior only
when it was actually tested with the relevant assistive technology.

## Distinguish persistence failures from emptiness

Missing, valid, malformed, read-failed and write-failed are distinct states. A
read/parse failure is not permission to initialize samples or overwrite records.
Keep the raw snapshot where available and block editing/writes until recovery
succeeds or the user explicitly replaces that collection. Offer a named retry
and, when useful, a recovery export. A missing key can initialize an empty list;
fixture records declared in a test brief must not mask read failure.

A refused write preserves the last accepted collection and the current draft.
Discarding that draft ends its own save error, not an unresolved collection read
error. Accept results only for the current request/draft generation. These are
host-state decisions; Alert itself does not read storage or own recovery.

Describe the observed failure without inventing its cause. A refused browser
write can mean quota, denied access or another storage failure; do not prescribe
clearing data or freeing space unless that cause is actually known. Retain the
draft and offer an applicable retry/recovery action first.

Build write proposals without mutating the accepted collection or the current
draft in place. A rejected save must not append history, change status or alter
the next retry before acceptance. Retry should propose one operation, not repeat
side effects from the failed attempt. When a read failed, do not present invented
zero totals or an empty collection as if the data had loaded successfully.
