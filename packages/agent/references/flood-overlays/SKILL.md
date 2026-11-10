---
name: flood-overlays
description: Compose or review Flood dialogs, drawers, popovers, menus and anchored selection surfaces. Use for popup geometry, nested dismissal or focus ownership.
---

# Give each layer an owner

Use the actual installed overlay and trigger contract; see
[accessibility](../accessibility.md) for native/dialog/menu behavior. Tooltip is
noninteractive help; interactive content needs the appropriate Popover or dialog.
Do not put an action inside a tooltip or apply application-menu roles to site links.

For a short Select trigger, verify that the open list can fit the longest
ordinary label, then repeat near the viewport edge with a very long label.

## Preserve trigger and state

Forward trigger props/ref onto one mounted native action. Preserve its accessible
name and open/controls semantics. Choose host-controlled open state or a default,
and test a host refusing an open/close request. Do not claim control state changed
merely because a callback ran. The host owns persistent values in unmounted panels.

Tooltip can attach to a real Link or Button through HTMLElement-safe trigger
props. Preserve the ref, hover/focus handlers and descriptions together with the
host handlers. Do not turn a navigation link into a button to add a hint. Raw
tooltip buttons in forms keep an explicit type="button". A control sharing Tooltip
and Popover composes both refs and suppresses its hint while the popover is open;
the interactive layer owns Escape and focus then.

Modal and nonmodal focus are different: do not add a trap to every floating
surface or remove a modal's background inertness. Escape dismisses the active
layer; a nested menu/select must not also close its parent dialog. Restore opener
focus unless the host intentionally moved it elsewhere.

Task Dialog titles and body insets use their own recipe; do not reuse compact
popup caption typography for the modal task. The
[hierarchy workflow](../flood-hierarchy/SKILL.md) owns title/group/field relations.

Use CommandPalette for modal search. Its search header and results share one
overlay surface. Forward the trigger and keep the modal title and input label
specific to the task. Use loading for an in-flight request, and let the host
control permissions, navigation and shortcuts.

## Inspect the actual host

Use a Drawer for a short record task that needs the list as context. Use a
route when the record needs a shareable address, substantial editing space, or
its own navigation and history. After a Drawer save, restore the initiating
control if it remains in the result set. Choose a stable list control when the
edit changes filter membership. See `recipe:record-management`.

Choose Drawer width using the longest real title, body copy and form controls.
Compare `md` and `lg` with a populated record. Use the description slot for
brief context and compose independent body sections with Section, Stack,
DescriptionList or Fieldset as appropriate. Put the next action in the footer
when it must stay reachable during scrolling. Avoid repeating the heading
as a section name or showing two equivalent dismiss actions in a clean state.

Overlay material establishes the nested neutral control context automatically.
Compare its fields, secondary actions, selection and supporting chips with their
canvas counterparts. Avoid opaque dark action islands or hiding the entire
surface distinction behind a strong border/shadow. Glass needs an opaque
fallback and a reduced-transparency path. A nested Surface resets its own
material; a nested chooser becomes a new floating owner. Verify both cases.

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
