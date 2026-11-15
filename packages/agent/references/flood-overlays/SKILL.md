---
name: flood-overlays
description: Compose or review Flood dialogs, drawers, popovers, menus and anchored selection surfaces. Use for popup geometry, nested dismissal or focus ownership.
---

# Give each layer an owner

Use the actual installed overlay and trigger contract; see
[accessibility](../accessibility.md) for native/dialog/menu behavior. Tooltip is
noninteractive help; interactive content needs the appropriate Popover or dialog.
Do not put an action inside a tooltip or apply application-menu roles to site links.
Use HelpTip for a brief optional explanation the user can explicitly open,
including on touch. Name the actual subject of the help. Keep fill instructions
or errors that the user needs to act on visible beside the corresponding field.

For a short Select trigger, verify that the open list can fit the longest
ordinary label, then repeat near the viewport edge with a very long label.

## Preserve trigger and state

Use ImageGallery to inspect several related images in the same dialog.
Keep the next and previous controls in place through loading and failure.
Use thumbnail navigation when users can identify a target by its artwork.
Supply small thumbnail sources and keep the current image and keyboard focus
visually distinct along the rail.
Intrinsic-size inspection owns its own scrolling, including the arrow keys.

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
When a Menu or Dialog-family action can remove or disable its opener, pass
`getFallbackFocus` to resolve a reachable target after the close commits.
Choose the next surviving record by its identity or return to the search
field when the action leaves an empty result. Test focus with the opener
still present, after its removal and after a deliberate focus change.

Task Dialog titles and body insets use their own recipe; do not reuse compact
popup caption typography for the modal task. The
[hierarchy workflow](../flood-hierarchy/SKILL.md) owns title/group/field relations.

Use ImagePreview for one image in a dialog. Enable zoomable for images people
need to inspect at full resolution. Check fit, loading and failure in the same
frame, then scroll the enlarged image by keyboard, pointer or touch. Keep the
overlay header and its dismiss control reachable while the viewport scrolls.

Use CommandPalette for modal search. Reuse a destination's navigation glyph
when it helps identify the result. Add a shortcut hint only when the host
registers that binding. Check mixed rows after filtering to an iconless result.
Its search header and results share one
overlay surface. Forward the trigger and keep the modal title and input label
specific to the task. Use loading for an in-flight request, and let the host
control permissions, navigation and shortcuts.

## Carry the application contract into each surface

A page, Dialog, Drawer and Sheet are different containers within the same
application. Before composing a new one, compare an existing surface with the
same task: identify its task title, independent groups, label/control relations,
content edges and action scope. Reuse those relationships through the installed
owners. A narrower container does not justify a second form style or a new
meaning for the same action. Use the [hierarchy workflow](../flood-hierarchy/SKILL.md)
for the shared roles and the [layout workflow](../flood-layout-composition/SKILL.md)
for their arrangement.

| Relationship | Preserve across surfaces | Adapt to the task and available space |
| --- | --- | --- |
| Identity and hierarchy | The task name, recognizable field labels and distinction between task, group and field | PageHeader owns a route title; the overlay owns its title. Use the surface's title role rather than copying the page heading size into a modal. Omit groups that add no meaning. |
| Alignment | A deliberate leading content edge, common form tracks and an action edge for each working region | Establish these axes within each surface's own inset. A narrower form can collapse Grid tracks in reading order; it does not need the page's absolute coordinates. |
| Rhythm | Labels remain nearer their controls than neighboring fields; group headings remain nearer their content than the next group | Choose supported spacing for the density and text size. Preserve the relative grouping when reducing columns; do not compress every gap equally or add wrappers around every group. |
| Controls and actions | Equivalent operations retain names, meaning, emphasis and coherent peer sizes in equivalent working regions | A compact row command and a form submission can have different sizes. Move a whole action group when it no longer fits, keeping its order, names and reachability. |
| Material | The same semantic field, action, focus and destructive roles | Let the overlay establish its material context. Canvas and overlay fills need not be identical; do not force equality with descendant overrides. |

The surface owns its outer inset. Its body composition owns spacing between
sections; Field and other primitives own their internal spacing. Check the
actual installed anatomy before adding body padding, especially when composing
Sheet lists versus Drawer forms. Align header, body and footer content within
their intended region without stacking a second inset merely because content
was extracted into a reusable form. Prefer Section, Fieldset, Grid, Stack and
Inline to parallel headings, field rows or action bars.

Equivalent actions depend on outcome, not their caption alone. Save should
commit the same draft and surface the same validation wherever that editor
appears. Cancel discards a draft under the host's policy; a close glyph may
instead dismiss a read-only detail. Do not treat those as equivalent without
checking pending edits. Keep feedback associated with the operation and the
affected fields, including when the presentation changes. Read the
[feedback workflow](../flood-feedback/SKILL.md) for operation lifetime.

### Adapt the container without restarting the task

Choose a container from the task first. Dialog fits a bounded decision; Drawer
keeps a short record task connected to its collection; Sheet fits a short touch
task. A long editor needing its own address or navigation can remain a route at
every width. Do not automatically turn every desktop page into a mobile Sheet.

If the host adapts a Drawer into a Sheet, keep one active modal owner. Preserve
record identity, draft values, errors and accepted selections outside a panel
that may unmount. Decide how focus and the reading position transfer when the
container changes while open; prevent the outgoing modal's restoration from
stealing focus from the incoming task. A breakpoint must not submit, discard or
open a second copy of the form. Flood supplies the individual overlay contracts;
responsive switching and state transfer remain host responsibilities.
When switching containers can remount the opener, retain a host reference to
the current opener or another meaningful action and pass a live resolver via
`getFallbackFocus`. Resolve it after close against the surviving DOM. In the
browser, resize in both directions before pressing Escape and check that focus
returns to the opener or the chosen fallback, including when the opener was
temporarily replaced during the transition.

Drawer and Sheet expose a footer slot for reachable task actions. Dialog does
not expose that slot in this contract: compose its action group in children
with existing primitives. Do not invent a shared footer or responsive prop.
At narrow widths, keep the decision and its action group in reading order and
check the final action with long labels and enlarged text. Use one deliberate
scroll owner rather than adding an independently scrolling form inside an
already scrolling body.

For example, a short supplier editor can open in a Drawer from a collection
and in a Sheet on a phone. Both keep the same field order, group hierarchy and
Save/Cancel outcomes; two-column contact fields become one column. The phone's
width and touch interaction change geometry, not the meaning of Save. If the
editor grows into several navigable sections, choose a route rather than
shrinking it into the original short-task container.

Compare the originating page and open overlay in the same captured scene, then
inspect title/body/action details. Exercise opening, editing, validation,
resize while open, save and dismissal. Check shared control edges, group rhythm,
reachable actions, retained values and focus return at ordinary and enlarged
text. For stable conditions, assert that only one modal is active and the draft
survives the host's presentation change. Record intentional differences and
link inspected evidence; shared imports alone do not prove visual continuity.

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

Use Sheet when a short touch task, navigation list or option list needs the
width of the phone. Keep the current choice visible on its trigger and compose
single-choice options with ListBox. Commit on selection, keep the previous value
on dismissal, and return focus to the trigger. Use one scrolling body and keep
long content, the close action and safe-area padding reachable.

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
