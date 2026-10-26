# Base component architecture

The 0.2.5 uses original React18.3/19 components and TypeScript
declarations. The website catalog and individual component pages are generated
from the [source catalog](../apps/website/src/component-catalog.json) and declarations.
Use the catalog for inventory and the [component guide](components.md) for composition.
Source availability does not establish npm publication. Match installed versions.

## Compose responsibilities

| Layer | Responsibility and examples |
| --- | --- |
| Scope and tokens | FloodRoot selects semantic roles from the single token source |
| Geometry and type | Container, Grid, Stack, Inline, Surface, Divider, AspectRatio, Text, Heading |
| Accessible/media atoms | VisuallyHidden, IconSlot, Image, List with native li children |
| Actions | Button → IconButton/Toggle; Link retains real anchor semantics |
| Structured forms | Label/Fieldset/Field → Input/Textarea/Select and native choices → groups/InputGroup/SegmentedControl |
| Disclosure/navigation | Collapsible/Accordion/Tabs/Pagination reuse Button and Link while owning their specific keyboard semantics |
| Feedback/content | Spinner, Progress/Meter, Alert, Badge, Skeleton, Avatar, Card, EmptyState compose shared type, surface and icon geometry |
| Layers and scrolling | ScrollArea supplies protected scrolling; Menu/Popover/Tooltip/Dialog share layer mechanics with distinct contracts |

A native form is still the host's form. Card is structured Surface containment,
not another control. A native list is not ListBox; Table is not a sorting/fetching
DataTable engine. Group categories are search/navigation aids, not architecture
levels, and variants do not count as independent components.

## Shared contracts

Import @flood-md/react/styles.css once and opt into FloodRoot. Relative geometry
follows host root text size. Keep semantic tokens separate from internal reference
values; customize scoped public roles. Normal and italic Inter faces are bundled.

Controls retain native refs, form names, constraints and browser behavior. Choice
mixed state belongs to Checkbox; checked still determines submitted data. Loading,
readonly, disabled, validation errors and advisory tones are distinct contracts.
Quiet decorative borders are not an automatic accessibility certification.

Use component-specific keyboard behavior and let modified keys/IME reach the host.
Hidden slots must not reserve empty visual groups. Preserve labels, descriptions,
focus, RTL and narrow-width access. Keep specialized native structures (caption,
legend, li, th) rather than replacing them with generic wrappers for apparent reuse.
See [foundations](foundations.md), [layout](layout.md) and [agent guide](agents.md).

## Numeric controls (0.2.5 candidate)

NumberInput composes InputGroup, Input and two named IconButton actions. Ref, id,
name, form, required, native validation and Field associations target the real
number input. Values are finite numbers or null for empty input. onValueChange
reports edits and steps. min/max clamp typed values on blur; step mismatch keeps
native validation rather than silently rewriting a deliberate typed value.
Uncontrolled form reset restores the initial value. Controlled state belongs to
the host. readOnly preserves selection and prevents step actions. Translate
increaseLabel/decreaseLabel for localized applications. This API does not format
currency, parse locale group separators or intercept mouse-wheel scrolling.

Slider uses one value or an ordered pair in value/defaultValue and returns a new
array through onValueChange. Each native range input remains a separate keyboard
and assistive-technology target. Values snap to min-based steps, handles cannot
cross and Tab order stays stable. Supply thumbLabels for translated, contextual
names. A shared name submits one or two form entries; uncontrolled reset restores
initial values. Horizontal geometry follows inherited RTL. min/max must be finite
and increasing and step positive. showValue controls the visible readout;
hideLabel preserves the group legend. Provide feedback text alongside status.
Read-only remains focusable. Touch assistive technology requires real-device
verification before claiming complete support. No vertical or arbitrary-count
multi-handle API is supplied in this release candidate.

## Combobox (0.2.5 candidate)

Combobox is editable single selection from a defined collection. Compose it with
Field exactly like Input; its ref, id, required validation and native input events
target the visible text input. Options contain unique nonempty value/label pairs,
optional description/keywords and disabled state. Local search folds accents and
case in labels/keywords. Only the chosen option ID is submitted under name; typed
search text is transient. Enter commits the active option; Escape/Tab/outside
interaction discards an uncommitted query. Emptying the field requests clearing.

value/onValueChange give controlled selection; defaultValue gives uncontrolled
selection, restored by form reset. An unavailable controlled ID displays/submits
empty. readOnly preserves copying and blocks all selection/clear actions.
Disabled choices remain discoverable but cannot be newly chosen. clearable only
controls the visible clear action; keyboard text editing remains available.
Translate listLabel/toggleLabel/clearLabel/emptyMessage/invalidSelectionMessage.
The visible input retains focus with aria-activedescendant pointing into a
listbox; the shared native Popover layer and ScrollArea handle containment,
positioning, clipping and scrolling. No arbitrary text submission, multi-selection,
remote fetching or virtualization is supplied. Native Popover API is required,
as for Flood Select. Test touch assistive technology on actual target devices.

## Tags and multiple selection (0.2.5 candidate)

Tag presents a compact noninteractive label with an optional decorative icon and
removal action. The host owns removal and focus recovery when a standalone tag
leaves a collection. Plain text supplies a default Remove name; rich content
requires removeLabel. Translate removeLabel for localized applications. disabled
prevents removal while keeping the label readable. removeButtonProps supplies
native action details, including keyboard/focus handling; Tag owns button type,
accessible name, disabled state and onRemove. A Tag does not select itself, link
to a route, or expose the semantic tones of Badge.

MultiSelect composes Tag and the shared Combobox search/layer model. Its public
value/defaultValue are arrays of unique nonempty option IDs. onValueChange returns
a fresh array. Forms submit one entry per valid selected option under the same
name; empty selection submits no entries. Query text is not submitted. Native
required validity means at least one selected option, including a locked selection.
Uncontrolled reset restores the initial array; controlled selection stays host-owned.

Enter toggles the active suggestion and keeps the list open. Backspace in an empty
input removes the last editable tag; a logical backward arrow at the caret start
focuses the last removable tag. Tag actions support logical arrows, Delete,
Backspace, Enter/Space and Escape back to the input. The input is the ordinary Tab
entry after hydration; standalone Tag actions retain normal native Tab order.
Modified/IME text editing remains native. Disabled selected options cannot be
removed, and Clear selection preserves them. Read-only blocks selection/removal
while labels remain readable and selectable as text. Translate removeItemLabel
and the inherited clear/toggle/list/empty/validation messages.

Tags wrap naturally. The search input and suffix actions form a single editor row;
they move together when tokens consume a line. Nested radii account for the field
inset. Coarse-pointer removal targets remain distinct and at least size.touch.
There is no arbitrary freeform tagging, remote data access, virtualization or
standalone TagGroup selection/navigation engine in this candidate.

Selection-field action defaults: Combobox and MultiSelect show only the disclosure
chevron by default. Set clearable=true to add the explicit clear-selection action.
MultiSelect tags keep their individual removal buttons; keyboard editing remains
available. This default is part of the unpublished 0.2.5 design candidate.


SearchInput and PasswordInput join the unpublished 0.2.5 candidate. Both compose
InputGroup with native input props, Field feedback, ref, sizes and form ownership.
SearchInput uses type=search and a decorative leading icon; clearable defaults to
true and clearLabel names its sole suffix action. Clearing dispatches native input
editing, restores input focus and respects read-only/disabled. The host owns search
results and submission. PasswordInput keeps one visibility action; use
visible/onVisibleChange or defaultVisible, and localize showPasswordLabel and
hidePasswordLabel. Revealing retains the value and caret; read-only permits reveal.
Use autocomplete appropriate to the host form. Both accept accessible names via
Field, aria-label or aria-labelledby. These controls add no authentication logic.


FileInput (unpublished 0.2.5) composes a native file input with Flood field geometry,
IconSlot and one optional clear IconButton. Pass Field's render props for its
accessible name/description/status. Native name, form, required, accept, multiple,
capture and input ref remain available. onChange is a native React change handler;
onFilesChange receives a new readonly File array for selection and clear. Do not
pass value/defaultValue/readOnly; FileList belongs to the browser. Uncontrolled
form reset clears the summary; cancelling the chooser keeps its prior selection.
Localize placeholder and clearLabel. Long names truncate visually, and the host
owns upload, file validation and progress. accept only guides the chooser.


FileInput multiple selection exposes a collapsible file list with full names and
localized file sizes (lang controls number formatting), and a count in the picker.
Translate selectionLabel and removeFileLabel. Individual removal updates the native
FileList through DataTransfer, then emits the same change callbacks as selection.
Focus moves to the next/previous remove action, or back to the input when empty.
clearable=false disables individual and global removal UI. In multiple mode, picking again appends files to the current selection; cancel
preserves it. Repeated files are deduplicated by name, size, type, lastModified and
relative path, without reading their contents. Single mode replaces its selection. The host remains responsible for upload.


AlertDialog (unpublished 0.2.5) is a concise confirmation, composed from Flood's
native modal layer and Button. Supply title, description, trigger and onConfirm.
Cancel receives initial focus; Escape cancels; outside clicks do not dismiss.
Tab containment, background inertness, scroll lock and return focus reuse Dialog.
Translate confirmLabel/cancelLabel. onConfirm runs before requesting close, while
onCancel covers Cancel/Escape. Use open/onOpenChange for controlled state and
confirmDisabled to disable confirmation. Callbacks are not awaited; the host owns
async requests, pending UI and errors. Use Dialog for forms/complex content.


Drawer (unpublished 0.2.5) reuses Dialog's modal behavior with an edge-panel layout.
side is logical start/end (default end) or top/bottom; size sm/md/lg sets the
cross-axis extent to 20/26/34rem within the viewport. Vertical panels fill height,
horizontal panels fill width. Use footer for host-owned actions; only body content
scrolls with Flood ScrollArea. Header/close action/footer remain visible. Native
ref, controlled open/onOpenChange, outside dismissal and initialFocusRef match
Dialog. Translate closeLabel/title/description; reduced motion disables entry
animation. Closing is immediate. There is no swipe/drag gesture or auto-save logic.


## Expanded component set in the unpublished 0.2.5 candidate

### Content and typography additions in 0.2.5

AvatarGroup composes the existing Avatar in a native named list with static
count overflow. It does not hide extra interactive items or invent an overflow
menu. Keep unique item IDs, nonempty names and a positive max. Translate
`overflowLabel` when its default English count is not suitable.

StatusIndicator pairs a decorative dot with visible status text. Tone never
replaces the wording. `announce` opts changing labels into a polite status region;
static labels do not announce on every page load.

Figure uses native figure/figcaption and keeps its host-provided media and caption
in DOM order. The media still needs its own alt text or accessible name.
Blockquote keeps cite as a source URL and optional attribution as visible credit.
InlineCode is a native inline code fragment; it escapes text, performs no syntax
highlighting and wraps long identifiers by default. Use CodeSnippet for code blocks.

Metric is a labeled value expressed as a native definition list. Formatting,
calculation and trend wording belong to the host. Direction and tone are separate:
a lower error rate can be good. Include that meaning in the trend label.

Timeline preserves supplied event order in a named ordered list, with at most one
current event. Markers are decorative; localized state labels keep states readable
to assistive technology. dateTime and the visible timeLabel are host-owned; no
sorting, timezone conversion or live announcement is implied.


### Navigation and composition

NavigationList is a named native navigation list with grouped destinations and one
aria-current page. The host owns URLs and currentValue. Steps is an ordered progress
sequence; state labels carry meaning beyond color. It becomes interactive only
with onStepChange, which requests a host-owned currentValue update. Disabled steps
remain visible. Translate statusLabels; do not present Steps as tabs.

Section owns a labelled native section, heading level, optional supporting text
and header actions. Split composes main/aside content in a container-responsive
two-pane grid; logical side and ratio do not introduce resizing gestures. Collapse
thresholds follow the container, preserving DOM reading order. Center constrains
and centers content without adding a content surface. SkipLink remains a native
fragment link, is revealed on keyboard focus and focuses its existing target.

### Form and collection controls

ListBox is a visible collection for one ID or an array of IDs. It supports native
hidden form values, reset, typeahead and directional keyboard selection. Options
are local; there is no virtualization, remote fetching or freeform entry. PinInput
is one native OTP editor with segmented visual slots, paste/edit/reset behavior,
one-time-code autocomplete and numeric/alphanumeric modes. Its name submits the
whole string; it does not verify an identity or send a code. Numeric mode uses
ASCII digits; alphanumeric mode accepts Latin letters and digits.

Rating uses a named native radio group. Supply label and name, keep current value
within max and localize getValueLabel. Native required, disabled, forms and reset
remain available. Read-only blocks changes while preserving inspection. Dropzone
composes FileInput with a file-drop affordance; files stay in the real FileList and
multiple picks/drops append with metadata deduplication. It does not upload files;
the host owns file validation, server processing and progress. CharacterCount is
an advisory output using a supplied string or count; it does not enforce a limit
or mutate an editor. Keep its meaning explicit near the corresponding input.

### Clipboard and notifications

CopyButton writes its value through the browser Clipboard API on activation. A
secure context and clipboard permission are required. onCopied/onCopyError let the
host react; manual fallback belongs to the host. Localize all result labels. Labels
reserve their shared width and a polite status announces success/failure.

ToastRegion takes a host-owned items array and onDismiss. IDs are unique/nonempty;
limit controls the visible queue. Ordinary messages default to five seconds;
errors and messages with actions persist unless a duration is explicitly supplied.
Zero duration persists. Visible timers pause on hover, focus and hidden documents;
queued timers start when displayed. F8 focuses the first nonempty visible region;
hotkey=false disables it. Error messages use alert announcements; other messages
use polite status. Actions do not implicitly dismiss. Localize label, closeLabel
and message/action text. inline embeds a region; fixed mode uses normal document
stacking. A contextual notification inside a modal belongs in that modal's tree.
There is no singleton store, upload engine or promise-notification API.
