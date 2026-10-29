---
name: flood-accessibility
description: Review Flood interface names, keyboard flow, focus, perception and reflow in the actual host. Use for interaction or accessibility acceptance.
---

# Review an actual task

Use [accessibility](../accessibility.md) and the installed component's contract.
A scanner result is supporting evidence, not certification of an application.

## Trace the task from entry to completion

- Identify the name, role, state and instruction for each actionable control.
  Retain native semantics before adding ARIA. A placeholder, color or tooltip
  alone is not an adequate field name or required instruction.
- If a visible label is intentionally hidden, preserve the supplied label/legend
  through the supported API and verify its contextual meaning and focus reveal.
  Do not remove the label or invent unsupported hideLabel props on bare controls.
- Complete the task with keyboard only, including reverse navigation, cancel,
  invalid submission and recovery. Distinguish roving focus, selection and
  activation; arrow behavior follows the specific component contract.
- After pointer activation of a custom keyboard-owning control, inspect actual
  focus before testing keys. Some browsers do not mouse-focus native buttons;
  a custom combobox cannot rely on that default. Preserve an intentional focus
  move made by the host callback rather than forcing focus back afterward.
- Check the accent focus perimeter in combinations with invalid, selected and
  read-only states. It must remain visible without changing layout or hiding
  beneath a rail, sticky region or overlay. Closing an overlay returns focus
  appropriately without overriding a deliberate host focus move.
- Evaluate text with its actual size, weight and composited background using
  applicable WCAG checks and supplementary APCA guidance. Decorative lines are
  different from necessary control/state indicators; do not relabel a necessary
  cue as decoration to avoid checking it. APCA is not WCAG conformance.
- Exercise narrow width, root text enlargement, long content, RTL where supported,
  forced colors and the existing reduced-motion fallback. These checks do not
  introduce new animation or theme requirements.

For assistive-technology announcements, inspect live-region semantics and test
with the actual technology when available. Do not report audible announcements
from a DOM role alone. Record any device/technology that was not tested.
