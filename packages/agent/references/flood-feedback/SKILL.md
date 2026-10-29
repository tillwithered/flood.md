---
name: flood-feedback
description: Choose Flood status, progress, alert, loading and empty-state feedback with honest operation state. Use for meaningful messages and announcement ownership.
---

# Describe what actually happened

Use installed declarations and [accessibility](../accessibility.md). Assign the
visible role before choosing color: StatusIndicator names a state, Badge marks
metadata, Progress describes task progress, Meter describes a bounded measurement,
Alert gives contextual feedback and EmptyState explains missing content.

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
- EmptyState needs a reason and an appropriate next action when available. Its
  icon/illustration and action remain existing primitives with consistent geometry.

## Evidence

Trigger the operation and observe each applicable transition, including failure
and retry. Check optional description/action/icon slots, long messages and text
enlargement. Keep content visible without stealing focus merely to announce it.
Reserve feedback space in a demo when needed for a stable sample, not universally
inside every production component. Report audible announcement behavior only
when it was actually tested with the relevant assistive technology.
