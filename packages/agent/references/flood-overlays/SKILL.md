---
name: flood-overlays
description: Compose or review Flood dialogs, drawers, popovers, menus and anchored selection surfaces. Use for popup geometry, nested dismissal or focus ownership.
---

# Give each layer an owner

Use the actual installed overlay and trigger contract; see
[accessibility](../accessibility.md) for native/dialog/menu behavior. Tooltip is
noninteractive help; interactive content needs the appropriate Popover or dialog.
Do not put an action inside a tooltip or apply application-menu roles to site links.

## Preserve trigger and state

Forward trigger props/ref onto one mounted native action. Preserve its accessible
name and open/controls semantics. Choose host-controlled open state or a default,
and test a host refusing an open/close request. Do not claim control state changed
merely because a callback ran. The host owns persistent values in unmounted panels.

Modal and nonmodal focus are different: do not add a trap to every floating
surface or remove a modal's background inertness. Escape dismisses the active
layer; a nested menu/select must not also close its parent dialog. Restore opener
focus unless the host intentionally moved it elsewhere.

Task Dialog titles and body insets use their own recipe; do not reuse compact
popup caption typography for the modal task. The
[hierarchy workflow](../flood-hierarchy/SKILL.md) owns title/group/field relations.

## Inspect the actual host

Check placement at viewport edges, resize, narrow/enlarged text, RTL and parent
scrolling. Selection popups and calendar popups have distinct content geometry;
use the supported field/anchor sizing behavior, not a universal fixed width.
DatePicker calendar panels have a 20rem preferred minimum, bounded by available
viewport width; narrow anchors need not force cramped calendar content. Selection
lists and time lists retain their separate contracts.
Verify nested radii/insets, surface distinction over a parent Surface and that
essential content stays outside scrollbar rails. No clipping or noisy duplicate
contours should be concealed with extra wrappers.

Drawers must reach the selected viewport edge even with a page scrollbar gutter.
For a shared Drawer correction check all supported sides; in a host composition
check the sides that host actually uses. Check long scrollable content, title/description spacing
and the close IconButton. Verify scroll locking/restoration and nested focus in
the real composition. CSS elevation tokens alone do not implement these behaviors.

Inspect the useful reading area, not only whether the panel fits the viewport.
At enlarged text, inherited padding and a long fixed header/footer can consume
the body. Keep enough width for readable text and enough height to review it;
allow a reachable whole-panel scroll fallback when fixed chrome cannot fit.
Do not shorten every host title or reduce the user's font size to conceal a
shared Drawer sizing problem.
