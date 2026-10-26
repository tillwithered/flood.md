# ResizablePanels

Two content panes separated by an accessible, draggable resize track. Use `Split`
for responsive **static** layouts. ResizablePanels adds deliberate pointer and
keyboard interaction; it does not add application panels, saved layouts or a
workspace engine. This document describes an unpublished source API.

```tsx
import { ResizablePanels, Surface } from "@flood-md/react";

export function WorkspaceParts() {
  return <ResizablePanels label="Resize workspace panes" defaultValue={40}
    min={20} max={75} style={{height:"20rem"}}
    main={<Surface padding="4" style={{height:"100%"}}>Navigation</Surface>}
    secondary={<Surface padding="4" style={{height:"100%"}}>Workspace</Surface>} />;
}
```

## Geometry and values

`value` / `defaultValue` are the main pane's percentage of space **remaining after
subtracting the separator track**. Default: 50. Horizontal mode places main at
inline start (left in LTR, right in RTL); vertical places main at the top.
`orientation="horizontal"` is default. Vertical layouts need a definite host
height, such as the relative-unit height in the example.

`min` and `max` default to 10 and 90 percent and must satisfy
`0 <= min < max <= 100`. Values/defaults must be finite numbers from 0 to 100;
configured bounds clamp the displayed/interactive percentage. Bounds may be
fractional. The opposite pane gets the remainder. There is no automatic collapse,
extra pane count or pixel-based persistence in the first API. A pane at exactly
0% becomes natively inert and aria-hidden, so its clipped controls leave keyboard
navigation; restoring its size restores interaction. If it held focus when
programmatically reduced to zero, focus moves to the separator. Native inert is
set through the DOM ref for React 18/19 compatibility.

The host may style root width, height, padding and borders. Drag mapping measures
the actual two pane rectangles, excluding the dedicated track and host padding.
It guards zero-size geometry and updates the measured space during the gesture.
Do not override the engine's grid columns/rows or ratio CSS properties.
Panes bound their content; compose ScrollArea inside a pane when bounded scrolling
is required. Host content, data and overflow policy remain explicit compositions.

## Pointer and keyboard

The separator receives pointer capture. Dragging updates `onValueChange` with a
continuous percentage rounded to six decimal places. The focusable track owns its
layout space: a coarse-pointer track is at least the shared 44px-equivalent touch
size rather than extending an invisible hit area over content controls.

- Horizontal arrows resize along the inline axis, reversing in RTL. Vertical
  mode uses Up/Down. Orthogonal arrow keys remain available to the browser/host.
- `step` is the keyboard increment in percentage points, default 1. Shift uses
  `largeStep`, default 10. Both must be positive finite numbers.
- Home/End moves to min/max. Modifier shortcuts, composition and host-cancelled
  keys remain untouched. Keyboard changes commit on key release; moving focus
  away after a keyboard edit also ends that edit.
- Escape during pointer dragging cancels the gesture. Pointer cancellation,
  lost capture, window blur and document hiding also cancel it.
- Cancellation restores the starting value for an uncontrolled component and
  reports that restoration through `onValueChange` when needed. It emits no
  `onValueCommit`. A controlled pane remains at its host-owned accepted value.

`onValueCommit` reports the **applied accepted** percentage at pointer release or
keyboard completion, not a rejected controlled request. The callback runs after
the event's React updates can settle. If the host refuses `onValueChange`, visual
geometry and ARIA stay host-owned and the commit reflects that unchanged size.
If the host accepts state asynchronously, a later acceptance is a separate host
update; it is not retrospectively reported as part of an already ended gesture.

## Focus, state and cleanup

`label` is required and names the separator. The separator exposes its current
percentage, min/max, visual orientation and the controlled pane IDs. Panel
orientation and separator orientation differ: horizontal panes have a vertical
separator. The forwarded ref points to the root div; regular div handlers/styles
apply there. Root pointer/key handlers run before resizing and may prevent default.
A cancelled pointer-up is treated as cancellation, with normal cleanup.

`disabled` disables resizing and removes the separator from Tab order; it does
not disable buttons or other content inside the panes. A focused separator keeps
focus as sizes change. Selection/cursor styles are temporarily locked only during
pointer dragging, and original inline values/priorities are restored on completion,
cancellation or unmount. Distinct host style changes made during the gesture are
preserved. Unmount does not emit late state/commit callbacks.

Existing Flood spacing, divider, focus, selection and touch tokens supply all
visual rules. There are no new themes, animation dependencies or copied engines.
