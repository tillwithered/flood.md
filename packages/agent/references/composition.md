# Compose an interface

For spacing, density or nested-geometry decisions, read [Spacing](spacing.md).
Measure the complete row geometry before adding a gap to repeated controls.

Start with content and the user's interaction. Use the installed exports shown
in flood/DESIGN.md; no invented props, new component library or copied registry.

1. Choose semantic Heading levels independently of visual size. Text handles
   supporting copy; keep the content hierarchy quieter than the primary task.
2. Compose vertical rhythm with Stack and wrapping rows with Inline. Surface
   represents a real container/elevation, not a wrapper around every element.
3. Keep action widths intrinsic. A full-width action is an explicit host choice.
   Controls fill a responsive form parent such as min(100%, 26rem); min-inline-size:0
   belongs on constrained grid/flex children. Inspect the actual wrapper tree.
4. Keep a choice glyph and its label together: .5rem within Checkbox/Radio/Switch;
   use an explicit Inline gap="4" (1rem) between separate choices. Center the row;
   never use space-between to pull a single label away from its indicator.
5. Use Field's callback props on the control. Keep name/value/required/form/reset
   behavior and wire submission/validation in the host. Button type defaults to
   button, so choose submit/reset deliberately. Link navigates.
6. Standalone secondary actions use subtle. Ghost needs an existing toolbar or
   clear parent context. Loading must leave a meaningful action name.

In Next.js import CSS once in app/layout.tsx. State, event callbacks and Field's
function child belong in a client component. Keep serializable compositions on
the server where useful. Flood does not save data or define permissions.

Use IconSlot for host SVGs and IconButton for named icon-only actions. Retain
the icon license; slot dimensions must control the artwork. A local semantic
adapter such as @/ui/button may re-export Flood, but does not change React APIs.

Before handing off, inspect a real composed screen at narrow and wide widths,
not only isolated controls. See [verification](verification.md).

For constrained overflow, use installed ScrollArea when available. Set height or
maxHeight on its viewport, choose the needed axis, and provide a useful accessible
name. Rails overlay content with insets; keep essential content out of the rail
zone through the default `contentInset="scrollbar"`. Use explicit `"none"` only
when host padding already protects essential content, or overlap is intentional.
The engine
shortens rails near rounded clipping corners; do not add ad-hoc per-page rail
offsets. Do not hide native scrolling as a CSS-only
substitute for an overlay engine. Check wheel, touch, keyboard, thumb drag, resize
and RTL; preserve the native forced-colors fallback.

## label and group foundations

Field already composes Label. Use standalone Label when assembling an associated
control outside Field; its required marker does not set native required. Keep IDs
unique. Use Fieldset and its legend for related controls, with hint/message/error
on the group and individual labels on each control. A disabled native fieldset
disables descendants except controls in its first legend. Fieldset does not own
selected values or replace a RadioGroup/CheckboxGroup selection contract. Preserve
these semantics in nested groups and native form submission.

## selection groups

Use RadioGroup for one string value and CheckboxGroup for a string array. Supply
name, legend and options with unique values; disable individual options when
needed. Use value/onValueChange for host-controlled selection, or defaultValue
for local selection. RadioGroup required is native; validate CheckboxGroup
selection counts in the host. Read repeated checkbox form values with getAll.
The group forwards Fieldset descriptions/status and native form ownership.
Form reset restores uncontrolled defaults and preserves controlled values;
canceled reset is ignored and reset does not emit onValueChange.

## connected controls

ButtonGroup contains direct Button/IconButton actions with compatible sizes and
an accessible group label. Tab navigation is ordinary; do not invent toolbar
arrow-key behavior. InputGroup wraps one native text-like Input; Field callback
props and ref target that input. start/end slots provide host-owned text/icons/
actions; they are not submitted values or labels. className/style own the wrapper.
Disable addon actions explicitly when the task needs it. Preserve a single field
perimeter and distinguish input focus from action focus. Use supported installed
exports; these constructs are available in 0.2.3.

Nested actions in InputGroup use the group's height and equal space-1 optical
insets, with inner radius = field radius minus inset. Button size still controls
text/icon/padding; do not compensate with extra margins. Touch targets may grow
the shell. Text-only addons keep the field's reading padding.

ButtonGroup accepts Button and named IconButton children, including mixed groups;
full separators follow its orientation. InputGroup start/end independently accept
short text, decorative icons or named actions. Plain addons are subtle; actions
keep action colors. Explain units in the label/description. Prefixes are not masks
or automatically submitted value fragments; compose complete values in the host.

Toggle is a pressed native action: keep its name stable, use pressed/onPressedChange
or defaultPressed, and label iconOnly artwork. ToggleGroup uses unique options
and string-array values in both single/multiple modes; single can be cleared.
Arrow/Home/End navigate focus; Enter/Space activate; ordinary Tab order remains.
Do not use these as form inputs, required radios or tabs. No automatic native
form reset/submission is provided. Default props initialize only; host state owns
controlled values. Available in 0.2.3.

SegmentedControl composes native RadioGroup for one value/mode: label, unique form
name and string-label options, with optional artwork. Use value/onValueChange or
defaultValue; it does not clear when the selected item is pressed again. Arrows
select, Home/End select endpoints, Space checks; Enter keeps native form behavior.
Native form/required/disabled/reset behavior remains. Use actual tabs for panels,
not SegmentedControl. Choose short labels, icons or vertical orientation for
constrained widths; fullWidth distributes segments equally. iconOnly retains
accessible option labels. Available in 0.2.3.

Collapsible: title + children, open/onOpenChange or defaultOpen. Accordion composes
Collapsible via unique value/title/content items; string-array selection in single
(one or none) or multiple expansionMode. Choose headingLevel for host structure.
Enter/Space activate; Accordion Up/Down/Home/End focus enabled top-level headers,
not nested disclosures. Panels stay mounted and hidden, so form values and native
constraints persist. Disabled only prevents trigger activation. Programmatic
closing returns panel focus to an enabled trigger if focus has not moved elsewhere;
host owns focus for removed/disabled triggers. Only chevron motion, reduced-motion
aware; no height animation or per-panel landmark flood. Available in 0.2.3.

Tooltip/Popover/Dialog: trigger is a render function; forward every
supplied prop/ref to one connected visible Button in the same document. Tooltip
content is text only. Use Popover for interactive contextual UI and Dialog for a
modal task. Controlled open/onOpenChange needs host updates; initial defaults are
not synchronization. Closed Popover/Dialog children unmount, so keep persistent
form values in host state. initialFocusRef chooses a safe element in the panel;
closeLabel localizes the explicit close action. Native top-layer APIs preserve
FloodRoot theme scope without body portals. Avoid overriding positioning fields.
Native Popover/dialog support is required, no legacy polyfill. Available in 0.2.3.

Link defaults to text; opt-in solid/subtle/outline/ghost and
Button sizes share the button recipe without changing native anchor semantics.
Use href/target for navigation, Button for actions; never nest the two or add
role=button. Link has no disabled/loading contract. Available in 0.2.3.
Tabs switches linked content panels (not modes or radio values) on a shared
contained surface. Avoid a second enclosing card inside the panel; selected fill
joins the panel without an additional underline. Arrows activate by default,
or focus only with activationMode=manual; Enter/Space commit. One tab
stop, RTL/orientation aware, disabled skip. Panels stay mounted/hidden and retain
native form constraints. Controlled/missing/disabled selected values derive first
available; host reconciles values. Breadcrumb is an ordered native link hierarchy,
last item current. Pagination is controlled page/pageCount with onPageChange or
getHref; host owns data/routes and empty states. Counts must be positive safe
integers in range; siblingCount 0/1/2 bounds window size. Native modifier navigation,
localized names, unavailable endpoints and narrow wrapping stay intact. Available in 0.2.3.


## Metadata, loading and identity · 0.2.4

Use Badge for noninteractive metadata with meaningful text. Spinner is indeterminate loading; use decorative inside a control already named by its owner. Button loading already composes it. Skeleton reserves geometry and is always hidden from AT; the host owns aria-busy and loading text. Avatar requires name and supports src/fallback; choose decorative beside an equivalent visible name. Keep image and fallback geometry fixed. None of these primitives fetch data or provide upload behavior.


Progress is task completion; omit value for unknown progress. Meter is a bounded measurement and always requires value. Both need label and finite increasing ranges; invalid values throw. Use valueText for localized units and hideLabel for visually hidden captions. Wrapper refs and native div props do not replace the internal range semantics. Alert is inline feedback: title optional, host actions inside children, icon=null to omit artwork. Tone and announcement are independent. No task manager, validation engine, automatic dismissal or Toast queue is supplied. Available in 0.2.4.


DescriptionList uses native dl/dt/dd for related readonly properties; use unique item IDs, meaningful term text and formatted description content. Inline layout stacks according to container width; it does not label editable controls. Table owns caption and a horizontal Flood ScrollArea. Supply native table sections and correct th scope/id/headers relationships; className/style/ref target the actual table. Use data-numeric for numeric cells and style.minWidth for wide tables. Cell actions stay ordinary focusable controls; do not imply DataTable sorting, selection or fetching. Available in 0.2.4.


Menu is a dedicated action-menu contract, not Popover with arbitrary buttons. Forward supplied trigger props/ref to Button/IconButton. Use unique IDs and nonempty labels; separators are noninteractive, disabled items discoverable but inert, danger is visual intent only. onAction requests closing then calls host logic. No href, submenu or checkbox/radio behavior is supplied. Items/shortcuts do not install global key bindings. Place Table row actions inside a cell, with an IconButton name that includes the row identity. Available in 0.2.4.

Toolbar groups actions with one Tab entry after hydration. Use Button/IconButton/Toggle, native buttons/links and Menu triggers. Arrows move focus; Enter/Space activate the native control. Keep independent selection widgets and text fields outside this action-only toolbar. In a vertical toolbar Enter/Space opens Menu; Up/Down remain toolbar navigation. Use Kbd for display-only keyboard hints and implement actual bindings in the host. Available in 0.2.4.

Card is structured Surface containment: title/description/header actions, body children and footer. Missing slots add no empty sections. Choose compact/comfortable density; preserve the tight title-description relationship. Use appropriate headingLevel. Keep root noninteractive and place named controls inside, never a card-wide click handler around nested actions. Use Surface for unstructured containment.

Compose lower-level responsibilities: Container/Grid and Stack/Inline arrange; Surface contains; Card structures; Image/AspectRatio reserve media; List preserves native li. EmptyState composes the shared typography/icon/action atoms. Use VisuallyHidden for supplemental noninteractive text or focusable reveal for skip links. Do not replace native caption/legend structures with generic wrappers solely for reuse. Mixed Checkbox is host-owned aggregation, with checked still controlling submission.

NumberInput composes InputGroup/Input/IconButton for finite numeric values or null.
Use Field for label and feedback, min/max/step for native validity and explicit
translated increaseLabel/decreaseLabel for step actions. Do not replace it with a
styled text box that loses numeric forms. Slider receives an array of one value or
an ordered pair; use thumbLabels to distinguish bounds, preserve native keyboard
controls and keep explanatory feedback visible. Range handles cannot cross.
Both support controlled/uncontrolled state, form reset and read-only presentation.
Available in the 0.2.5 source candidate; do not imply registry availability.

Combobox is editable single selection from explicit option values. Use Field for
its input name/description associations, never submit typed search text as an ID.
Arrow keys move the active suggestion; Enter commits, Escape cancels the search.
Use descriptive labels/keywords, keep disabled choices inert, and translate the
list/clear/toggle/empty/validation messages. Read-only selection remains selectable
for copying. Native forms/reset and required validity apply to the selected ID.
Do not imply freeform values, async fetching, multiple selection or virtualization.

Tag is label content with an optional named native removal action; it is not a
status Badge or Toggle. The host owns removal/state and standalone focus recovery.
Provide removeLabel for rich content and localization. MultiSelect composes Tag
and the shared Combobox search/layer model with an array of selected option IDs.
Never pass arrays to Combobox or submit search text as selected values. Use Field
for associations/feedback. Preserve repeated form entries, reset and required
selection validity. Disabled selected items stay selected through clear/remove;
read-only blocks edits. Do not shrink touch targets to force tags into a row.
Let tags wrap while the search editor and its suffix actions remain together.

Keep selection-field chrome calm: Combobox/MultiSelect show only the chevron by
default. Add clearable=true only when a separate clear-selection action is useful;
individual MultiSelect tags already expose named removal actions.


SearchInput and PasswordInput are field controls in the unpublished 0.2.5 candidate.
Compose them with Field and pass its control props. SearchInput uses native search
editing and one clear action (clearable=true); the host owns filtering/submission.
Read-only hides clear. PasswordInput has a single show/hide action with localized
showPasswordLabel/hidePasswordLabel, controlled visible/onVisibleChange or initial
defaultVisible. Read-only still allows reveal. Native refs, autocomplete and forms
remain owned by the host. Do not add another suffix chevron or browser clear icon.


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


The unpublished 0.2.5 candidate separates floating surfaces from modal surfaces.
Nine additional semantic roles bring the dark profile to 193 roles; previous token
values remain intact. surface.floating is the opaque fallback;
surface.floating-translucent, border.floating, selection.floating, shadow.floating
and effect.floating blur/saturation/shadow-offset/shadow-blur define the floating
material. Select, Combobox, MultiSelect, Menu, Popover and Tooltip share it; Dialog
and Drawer retain surface.overlay. Backdrop filtering is progressive enhancement;
reduced transparency uses the opaque fill and forced colors use system colors.
Keep text opaque and evaluate it against the actual composited background.


The unpublished 0.2.5 expansion includes AvatarGroup/StatusIndicator/Figure/
Blockquote/InlineCode/Metric/Timeline; NavigationList/Steps/Section/Split/Center/
SkipLink; ListBox/PinInput/Rating/Dropzone/CharacterCount; CopyButton/ToastRegion.
Compose these before inventing equivalent host wrappers. Read each generated
component contract and docs/base-components.md. Keep collection IDs stable, form
names explicit, labels localized, state meaning independent of color and visible
content within relative geometry. Native chooser/clipboard/OTP semantics do not
supply upload/auth/server logic. Toast queues, actions and navigation state remain
host-owned. No third-party component implementation was introduced.
