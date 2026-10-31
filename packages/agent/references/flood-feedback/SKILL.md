---
name: flood-feedback
description: Choose Flood status, progress, alert, loading and empty-state feedback with honest operation state. Use for meaningful messages and announcement ownership.
---

# Describe what actually happened

Use installed declarations and [accessibility](../accessibility.md). Assign the
visible role before choosing color: StatusIndicator names a state, Badge marks
metadata, Progress describes task progress, Meter describes a bounded measurement,
Alert gives contextual feedback and EmptyState explains missing content.

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
- Alert/Toast/live-region choices depend on urgency. Keep static explanation
  silent unless a change requires announcement; do not add multiple live regions
  around a composite's existing announcement. Announce does not imply a visible
  style change or guarantee speech from every assistive technology.
- Spinner retains a meaningful accessible label where standalone. Skeleton is
  decoration, not another announced task. Preserve the existing reduced-motion
  behavior without introducing a new animation system.
- EmptyState identifies the actual condition. A title can be enough; add a
  description only for new decision-relevant information, not an instruction
  repeating a visible action. Its icon/action use existing primitives.

## Scope feedback to its operation

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

Trigger the operation and observe each applicable transition, including failure
and retry. Also follow failure → explicit discard → list → reopen a saved record;
the abandoned draft's failure must be gone and the saved data unchanged. Distinguish
that from a still-unresolved collection-wide error. Check optional description/action/icon slots, long messages and text
enlargement. Keep content visible without stealing focus merely to announce it.
Reserve feedback space in a demo when needed for a stable sample, not universally
inside every production component. Report audible announcement behavior only
when it was actually tested with the relevant assistive technology.
