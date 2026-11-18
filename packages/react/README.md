# @flood-md/react

Original React 18.3/19 components for TypeScript and Next.js App Router. Native
HTML semantics and refs, no third-party component library or Tailwind dependency.

Named imports support tree shaking in optimizing ES-module bundlers. Import the
shared stylesheet explicitly; styles are not split by component.

Use `RatingSummary` to present a weighted score and its distribution together.
Pass counts in ascending order from one star through the highest score. The
summary stacks in a narrow surface. The host supplies the review data.

Use `ImageComparison` to inspect two aligned images in the same frame. Supply
matching crops, alternative text and short version labels. The divider can
move with a pointer or keyboard. Use `value` and `onValueChange` when the host
owns the visible percentage of the original image.

Use `ImageGallery` for a set of images inspected in one dialog. It shares the
fitted and intrinsic-size views of `ImagePreview`, loads the active source on
demand and cycles through items by stable ID.
Set `navigation="thumbnails"` and provide a small `thumbnailSrc` per item for
direct selection in a horizontal rail.

Use `RevealValue` for a read-only value that starts visually concealed. Name
the reveal action and enable the optional clipboard action when needed. Keep
authorization and retrieval in the host.

Use `AuthorMeta metadataPlacement="inline"` for a short date beside a name.
Use `nameOverflow="truncate"` in a narrow row with a recognizable name prefix.
Clipped names are available on hover and keyboard focus. Use
`AvatarGroup spacing="separated"` to keep each face distinct in a group.
Use `layout="fit"` in a width-constrained row to keep the avatars and overflow
on a single line. Pair it with `overflowPresentation="popover"` when readers
need to see the remaining people.

In a person `Combobox`, pass `avatar` on the options. The input keeps one
leading slot for the committed avatar or the search glyph during editing.
For a visible selection list, `ListBox` accepts the same option avatars.
Its surface appearance uses Flood overlay scrolling without a layout gutter.

Use `SearchTrigger` to open a CommandPalette from a toolbar or sidebar.
`iconOnly` preserves the accessible action name in tight layouts. Supply
`shortcut` and `aria-keyshortcuts` after wiring the shortcut in the host.
Use `KeyboardShortcut` for combinations of keys. Choose `presentation="compact"`
when the combination shares space with a label or icon. Use `label` to spell
out platform glyphs for assistive technology.
Use `Breadcrumb layout="compact"` in a constrained header. It retains the
first and current pages while a popover keeps earlier destinations reachable.

Use `CountBadge` for passive counts. Its visual cap preserves the exact
accessible value. Compact navigation can show a dot with a localized count
through `NavigationItem compactBadge`.
Use `NotificationTrigger` as the header action for an inbox overlay. Pass the
accepted unread count from the host and use `formatUnread` for localized speech.

Use `DataListItem selection` when a list supports a bulk action. The host owns
the checked IDs, and peers share a leading checkbox track. Set
`DataList reserveSelectionSpace` when the track should survive filtering.
Use `Card selection` for a record in a selectable gallery. The Card uses the
same named checkbox behavior as DataListItem. The checkbox stays at the top
trailing edge while wide header actions can reflow below the introduction. Match `footerDivider` in a
CardSkeleton when using a footer separated by spacing alone.

Use `TableSkeleton` for a plain table's first load. Match the real headers,
column widths and density. For `DataTable`, use `loadingAppearance="skeleton"`
and set `placeholderLines: 2` on columns that show secondary text.

Use `FileName` for a file name in a cell or link. Choose `nameOverflow="truncate"`
on `FileItem` or `UploadItem` when the visible prefix and extension can identify
the file. The full name remains available on hover and keyboard focus.
Use `UploadItem` with host-owned transfer and processing states. Add
`onPause` and `onResume` for resumable transfers, and preserve the last known
percentage while paused. Use `processing` when the file has arrived and
still needs server-side work before it is available.
Use `FileItem downloadHref` for a separate download beside a preview or
filename link. `UploadItem` offers it after a successful upload. The action
uses `IconLink`, a named native anchor with `IconButton` geometry.
Use `ImagePreview zoomable` when people need to inspect an image at its
intrinsic size. It opens fitted and scrolls the image independently in actual
size mode.
Use `FileCard` in a file gallery when a thumbnail helps identify the asset.
Give peer cards the same `thumbnailRatio`. File details and selection use the
same contracts as FileName, FileMeta and Card.
FileCard uses the top `Card media` slot by default. Set
`thumbnailPlacement="body"` for filename-first layouts. When a Card has a
top image, set the same `mediaRatio` on its CardSkeleton.
Set `previewPlacement="thumbnail"` to place `onPreview` over the artwork.
Use a host-controlled ImagePreview or ImageGallery for inspection.
Use `FileThumbnail` for a decorative image beside a filename or in a gallery
tile. FileItem, UploadItem and FileCard accept `thumbnailSrc` and share its
stable fallback.
Use `FileList appearance="plain"` inside a Drawer or another surface that
already groups its files. Inside a compact attachment, `metadataVariant="plain"`
keeps the file size readable without a second fill. Pass `format={null}` when
the filename itself gives sufficient format information.

Use `NoResults` when search or filters exclude every record. Keep the controls
available and pass a reset focus ref when reset replaces the empty view.
Use `EmptyState` when the collection itself has no records.

Use `CapacityMeter` for usage against a fixed quota. It keeps the actual amount
visible after the fill reaches capacity. Use `Meter reference` to mark a named
point on the same scale as a bounded measurement.

Use `CompositionBar` to show parts of one total in a compact horizontal track
with visible category values or shares.
Use `MetricGroup` for related metrics that share a value axis. Its responsive
grid aligns values and keeps labels on one line. Clipped labels disclose
the full text on hover or keyboard focus. Set `layout="rows"` in a narrow summary column to align labels
and values to opposite edges. In a very narrow container, each value stacks
under its own label. Both layouts support the shared panel surface.

Use `Timestamp` for date and time metadata in lists, comments and records.
Pass a civil date or a zoned ISO instant for formatting, or provide your own
text as children. Specify `relativeTo` when displaying elapsed time.

Use `Avatar` with `presence` to show availability beside a person’s photo or
initials. Supply a localized label and keep the same presence when the person
appears in an `AuthorMeta` row or `AvatarGroup`. Use visible status text when
people need the state to decide what to do.

Use `ColorPalette` for predefined choices and `ColorPicker` to edit an
arbitrary opaque RGB color or submit it with a form. The picker uses the
shared palette and inline Slider readouts for RGB values.

Use `RatingValue` for a stored rating, with fractional stars in cards or
`appearance="compact"` in dense rows. Pass `null` when the rating is absent.
Use `Rating` to collect a new whole-star response.

Use `HelpTip` in `Field labelAside` for brief definitions or examples people
can open with a tap, click or keyboard. Keep instructions needed to complete
the field in its visible hint.

Use `FileTrigger` to hand new browser picks to an attachment queue or import
action. Use `FileInput` when the selected files belong in native FormData.
Add drag and drop with `FileDropTarget` for a host-owned queue, or `Dropzone`
when the files belong to the form. Queue entries and transfer states can use
`UploadList`. Validate files received from either input path in the host.
Use `UploadQueue` when the heading, file intake and scrolling transfer list
belong to one region. Supply stable entry IDs and host-owned states. Use
`maxListHeight` to limit the rows to the available space below the picker.
`AvatarPicker` shows a stored photo or a local File preview and gives the host
choose, replace and remove callbacks. The host validates and saves the image.

Give Combobox or MultiSelect options an `avatar` for people and teams. Their
selected value or Tag carries that same artwork. Keep the full name in the
option's `label`. Use a Tag's `avatar` prop for the same compact treatment
outside a selection control.

Use `SplitButton` for a default action with related alternatives, such as
exporting a PDF with CSV and JSON available in a connected menu. Pass native
props for the default action through `primaryButtonProps` and handle menu
commands with `onAction`. Name both the group and the menu with localized text.

Place `FormActions` at the end of a native form. Supply buttons with
their own submit or reset types. Use `SaveStatus` for compact feedback
from the host save state, and keep field errors next to their controls.
Use `NumberRangeField` for exact lower and upper bounds. It submits two
independently named `NumberInput` values. The host validates their relationship
and can pass one shared `error`. Use `NumberInput appearance="plain"` when a
single numeric value needs more room and visible step buttons add little.
Use `Steps` to show the sequence, and `StepProgress` to show the current
stage and position in a narrow form. The host owns validation and navigation.
Use `SettingGroup` for rows with independent actions or row-layout switches.
Use `Field layout="adaptive"` for a labeled editable value in the same group.
The hint stays with its label and validation feedback stays with the control.
Use `RadioCard` and `CheckCard` for choices with supporting details. Their
metadata moves beneath the description in a narrow card.
`SettingRow` can show the current value beside its action, with adaptive
wrapping that gives the label room on narrow panels.
Use `valueOverflow="truncate"` for a short-identifiable plain value in a dense
row. `TruncatedText` keeps one line and discloses the full text on hover or
focus only when it clips.
Use `CopyableValue` for a visible URL or identifier with a compact, named copy
action. Long values wrap and the copy action remains adjacent.
Use `ExpandableText` for optional plain-text excerpts in cards and comments.
It shows a toggle when the passage exceeds its line limit at the rendered
width. Set `lines` to a positive integer, or use the three-line default.
Localize `moreLabel` and `lessLabel`. Use `expanded` and `onExpandedChange`
for host-owned state. The full text stays in the same paragraph throughout;
use Collapsible for mixed content that includes links or controls.
Use `maxVisibleTags` on MultiSelect and TagInput when a control needs a
compact summary. The count expands the remaining tags. All accepted values
stay in the field's description and form data.

Use `ListSkeleton` for the initial load of a DataList. Match the list's
density, media, descriptions, metadata and dividers, and supply a localized
loading label. DataTable can use `loadingAppearance="skeleton"` to place
decorative rows inside the existing table.
Use `CardSkeleton` for the initial load of a Card with a short text body. Match
the card's density, elevation, optional slots and expected body line count.
Give a group of loading cards one localized status message.
DataTable defaults to a spinner. Use
`refreshing` during a background request while the current rows stay usable.
Use `EmptyState` for missing content and `ErrorState` when a request failed.
Both support inline layouts for panels. Pass `onRetry` and `retrying` to
`ErrorState` when the host can recover the content.

Sheet is a bottom-aligned Drawer for short tasks, navigation and touch-friendly
choices. It fits short content, caps long content to the viewport, and keeps
Drawer dismissal, focus restoration, body scrolling and the optional footer.

Use `ActivityTimeline` to group a longer history into named periods. Give
each group a stable ID, display label and optional machine-readable date.
Choose `headingLevel` for the surrounding document and `density="compact"`
in a narrow panel. Pass `emptyContent` when an empty history needs a message.

Timeline supports `mode="activity"` for recorded events without progress
markers or step announcements. Its default `mode="progress"` still supplies
complete, current and upcoming states. The host supplies ordered events and
formatted times.
Use `ValueChange` for a previous and current value. Omit the absent side
for an addition or removal. Use `ChangeList` for named changes from one
event and compose it in the Timeline content slot or a detail panel.
Use `layout="adaptive"` to show the arrow on wide rows and label each side
when the comparison is narrow. The same treatment is available through
`ChangeList valueLayout="adaptive"`.
In activity mode, `layout="feed"` puts time beside the event heading, while
`layout="schedule"` gives times a shared leading track when supplied. Optional item content
can compose file rows, threads or contextual messages on the same timeline.
Use `FileList appearance="embedded"` for small attachments in a message or
event. `Alert appearance="inline"` presents a short caution within its context.
The default presentations support standalone lists and banners.

SegmentedControl options can display a `count` alongside the label, for example
`{value: "pending", label: "Pending", count: 2}`. Use this for a small, mutually
exclusive choice that updates one collection. The count is read with the visible
label and does not change the submitted value.

StatusIndicator labels stay on one line and show a tooltip when clipped. Use
`presentation="icon"` with a recognizable `icon` in a compact status column.
Use `presentation="chip"` for a tinted state at the same scale as nearby badges.
Use `presentation="wrap"` for longer messages. DataTable columns can opt plain
text cells into the same single-line behavior with `cellOverflow: "truncate"`.

`AuthorMeta` combines a person's avatar, name and optional role or timestamp.
`MetadataList` groups short supporting facts such as dates, teams and counts.
Use it in the `details` slot of DataListItem when the facts belong with its
title and description. Use `metadata` for a trailing value compared across rows.
`Comment` composes that attribution with a message and optional actions. Pass
machine-readable dates with a native `time` element. Thread state and actions
belong to the host.
Use `CommentThread` for an ordered group of related messages with optional
dividers and nested replies. Give long reply branches a localized
`repliesDisclosure.label`. Use `CommentComposer` for a compact controlled
draft next to the thread. It uses `MessageComposer` with compact comment
defaults. Both accept `replyContext` for a specific recipient. It sits in a
small header above the input surface and is read as its description. The comment send action
defaults to Reply with context and Post otherwise. Localize it with `sendLabel`.
In a constrained composer, set `maxVisibleAttachments` to collapse a long file
list behind a count. Collapsed files remain attached. Localize the accessible
list and disclosure with `attachmentsLabel`, `moreAttachmentsLabel` and
`fewerAttachmentsLabel`.
Comments reveal secondary action slots on hover and focus with a
fine pointer and keep them visible on touch. Use `actionVisibility="always"`
for actions that should be visible at rest.
Pass `onReply` to a Comment or CommentThread item for the shared reply
action. The host opens the editor and manages focus when it closes.
CommentThread and NotificationList use spacing between items by default.
Enable `dividers` when dense adjacent items need a clearer boundary.
Put attachments and reactions in their respective Comment slots. Reactions
stay visible beside copy and other commands in one row. `ReactionButton`
uses Toggle semantics and takes its count and pressed state from the host.
`ReactionPicker` presents a short list of named choices and restores focus
after selection. Pass it to Comment's `reactionPicker` slot so it stays
visible with existing reactions and appears with the actions on an empty row.
Pass `selected` for a reaction already applied by the current user.
`onSelect(id, selected)` supplies the requested next state.

`NotificationList` groups persistent inbox updates. Narrow lists give the title
and description their own row, then align time and actions below.
`NotificationItem` aligns
unread markers and optional media across rows. The title can be a native
destination link, while the optional read control uses a separate host callback.
Use `NotificationInbox` for All and Unread views of a supplied collection.
The host accepts read changes by updating `items`. Use `markingAllRead` to keep
the bulk action focused during a request. A focused row that disappears
returns focus to the current filter.
During the first request, use `state="loading"` and match
`loadingPlaceholder` to expected row anatomy. An error can expose `onRetry`;
set `retrying` to keep that action focused until the request finishes.

Settings can use `Fieldset layout="aligned"` for direct Field children and
`Switch layout="row"` for a trailing switch. `Switch description` is read
separately from its name. Use `SettingRow` when the setting has an independent
command or a link into details. `SwitchGroup` aligns row switches inside a
native fieldset with shared disabled state. A read-only Switch stays focusable
and retains its checked value in form data.

Version 0.2.12 adds opt-in DataTable column visibility. Set
`showColumnVisibility` for the Columns menu, and supply `hiddenColumnIds` and
`onHiddenColumnIdsChange` when the host saves preferences. The active sort and
record-opening columns stay visible. See [DataTable](../../docs/components/data-table.md).
Pass the Columns control from `toolbar={({ columns }) => …}` into
`CollectionToolbar.actions` to keep it alongside search and filters.

The 0.2.11 candidate adds optional DataTable row `primaryAction` for opening an
in-place detail panel, plus `toolbar` and `inset="roomy"` for a shared table edge.
The title is a native button and the rest of the row also responds to pointer
activation. Nested controls keep their own actions.
Set `numeric: true` on a DataTable column of comparable amounts or quantities
for logical end alignment and tabular digits. An explicit `align` still applies.

The 0.2.11 candidate adds optional compact NavigationTree item `flyout` settings
for mouse-hover previews and a separate positioning reference. Click, keyboard
and touch activation still work. Popover `focusOnOpen` defaults to true; use false
for a pointer preview that preserves the current keyboard focus.

In the 0.2.11 candidate, `NavigationItem.trailingAction` adds a named sibling
control to an expanded row. `NavigationTree` items accept the same slot.
Enable `branchGuides` on a tree or Sidebar group for visual depth cues.
Choose `Sidebar.headerLayout="inline"` to put the identity and collapse button
on one line while expanded. The stacked layout keeps the original toggle position.

CommandPalette (0.2.11 candidate) provides modal search over pages or commands.
It shares the CommandList item contract and supports grouped results, disabled
items, loading and two densities. The host supplies actions and any shortcut.

Tooltip trigger props are HTMLElement-safe: render the existing Link or Button
directly and forward its ref, hover/focus handlers and aria-describedby. Tooltip
does not add button type, popup or navigation semantics. Raw button triggers
inside forms keep an explicit type="button". Popover/Menu retain button trigger
contracts. When one control owns both Tooltip and Popover, compose both refs,
handlers and descriptions, and disable the tooltip while the interactive layer
is open so Escape and focus remain owned by that layer.

IconButton iconSize (0.2.11 candidate) sizes its inner IconSlot independently of
the interactive size. It defaults to size; shrinking a supporting glyph must
not shrink its target or bypass IconSlot with a custom SVG width. Existing glyph
roles at a 16px root are 2xs=14px, xs/sm=16px and md/lg=20px.

This package documents the **0.2.14** source API. Keep Flood package versions aligned and follow the guide matching
your installed declarations; source changes do not modify an existing npm release.

NavigationItem (0.2.11 candidate) is the shared small row for destinations,
commands and disclosures. Supply label and either href for a native Link or
onAction for a Button command. disclosure supplies expanded, onExpandedChange,
label and optional controls/disabled. With disclosure alone, the full primary
row toggles the branch; with href or onAction, disclosure is a separate sibling
IconButton. The row shares its visual surface across both controls, without
nested interactive elements or making a link click toggle expansion. Current,
ancestorCurrent, focus and disclosure expansion are separate states. icon,
reserveIcon, trailing and description are optional anatomy, not required filler.
Compact rows keep their accessible label and optional Tooltip; NavigationTree
owns any branch hierarchy and compact Popover, not NavigationItem itself.
Raw compact NavigationItem cannot combine a separate primary destination/action
and disclosure: use the NavigationTree branch composition, which retains the
parent destination alongside children in its flyout. trailing is noninteractive
metadata; independent controls belong in their own sibling action anatomy.
Set `labelOverflow="truncate"` on NavigationItem or NavigationTree for
single-line labels that reveal the full name from the existing link or button.
Sidebar uses that presentation by default. Set `labelOverflow="wrap"` where
labels need to stay fully readable at rest.

NavigationGroup (0.2.11 candidate) composes related children with optional label,
hideLabel, headingAction and separator. collapsible uses the existing Collapsible;
expanded/onExpandedChange or defaultExpanded control only the group disclosure.
defaultExpanded is true. A collapsible group requires a nonempty label; hideLabel
omits the visual title while preserving the toggle name. collapseDisabled disables
only that disclosure, not arbitrary child destinations or heading actions.
Compact presentation keeps children available and preserves the accepted expanded
choice for return to expanded navigation. Heading actions remain available on the
compact axis. Collapsible headerAction supplies a sibling action in its own header,
so a group command need not be nested in the disclosure button or moved elsewhere.

Sidebar (0.2.11 candidate) composes grouped NavigationTree destinations and a
bounded ScrollArea between fixed header/footer slots. NavigationGroup owns each
section's optional presentation; NavigationTree composes NavigationItem rows.
Supply label
and choose variant="quiet" (default) for restrained inactive navigation and
rectangular current rows, or standard for the stronger pill recipe. This is a
scoped component recipe using existing roles, not a global theme change.
Supply groups `{id,label,items}` and currentValue; item values must be globally unique. Set a
height on the host. Expanded width defaults to 16rem; collapsed rail is 4.5rem (5rem for coarse pointers).
collapsed/defaultCollapsed/onCollapsedChange are independent of the route and
expandedValues/defaultExpandedValues/onExpandedValuesChange. Controlled refusal
preserves accepted state. side is logical start/end; size matches NavigationTree.
Header/footer accept ReactNode or `({collapsed}) => ReactNode`; adapt their content
explicitly. collapsible=false omits the toggle. Localize collapseLabel,
expandLabel and expandItemLabel; group/item labels supply the navigation names.
The component does not add preference storage, routing, a mobile drawer or shortcuts.
Groups can set hideLabel to omit redundant visible section titles while retaining
nav names. headingAction, separator and collapsible/expanded group configuration
are independent of branch expandedValues. headerSeparator/footerSeparator are
independent opt-in shell choices and default false. Header/footer content must
follow the mode contract: common icon/text tracks when expanded and one full-rail
axis for the actual brand, toggle, destinations and account target when compact.
currentKind defaults to page; location identifies a current global
module. Compose a flat compact Sidebar as a GlobalRail and another Sidebar as
its ContextBar, keeping route, module, expansion and visibility in the host.

Sidebar places its overlay scrollbar inside the existing outer edge spacing.
Header, body and footer keep the same tracks without an additional reserved
column, whether navigation overflows or not.
NavigationTree rows share NavigationItem's space-3 start inset, icon/text tracks
and deliberate columns for actual trailing anatomy. Iconless descendants begin at the parent text track; missing
peer icons reserve a slot. Header content should use the same icon size and gap.

NavigationTree rows use space-1 between peers and before an expanded branch;
group separation remains owned by Sidebar.

NavigationTree compact (0.2.11 candidate) exposes an icon rail: leaf destinations
remain links, disabled items remain unavailable, branches use Popover with full
navigation. flyoutSide controls its physical placement; Sidebar resolves its own
side and RTL direction. Branch selection closes the flyout and preserves current
destination/expanded state independently. trailing composes meaningful metadata
such as Badge in expanded rows. Flood tooltips identify compact destinations on
hover and focus while preserving the actual link/button; an open branch flyout
suppresses its hint. Missing icons use a neutral fallback glyph. Current ancestor styling does not
claim aria-current on a non-current parent.

DataTable emptyContent (0.2.11 candidate) accepts a composed EmptyState and
applicable actions inside the existing full-width body cell. It renders only
when state="ready" has no visible rows; loading/error retain Spinner/Alert and
retry ownership. Omitting it preserves labels.empty. Keep header/sort context
and distinguish an empty collection from no matching results in host content.
Reset filters in the host and return focus to a persistent query control.

CollectionViewSwitcher (0.2.11 candidate) composes a hidden-label Select and
applicable view commands. Supply views `{id,name,disabled?}`, controlled value
and onValueChange. Optional actions/onAction use the OverflowActions contract:
one command renders Button directly, multiple commands adapt through overflow.
The host owns saved queries, persistence, naming, confirmation and recovery.
Keep it separate from CollectionToolbar; selectRef gives host dialogs a stable
focus destination. controlSize defaults to sm; disabled blocks choice/commands.
Localize label, actionsLabel, moreLabel, view names and supplied action labels.
Its multi-action rail uses OverflowActions containerVariant="plain" to match
the adjacent field height. Toolbar variant="plain" removes its material and
outer inset; contained remains the default for standalone rails. Button variant
and toolbar containerVariant remain independent in OverflowActions.

CollectionToolbar (0.2.11 candidate) composes a named search field, applied Tag
summaries, reserved Clear filters action and end-aligned Filters Popover. Supply
controlled searchValue/onSearchValueChange; appliedFilters and onRemoveFilter
describe accepted conditions. filterContent supplies the host's staged editor.
The host owns Apply/Cancel, query execution, validation and saved views. Omit
filterContent for search/summary-only use. onClear is optional; canClear describes
whether the host has anything to reset, including slot-owned quickFilters.
Clearing and tag removal focus Filters (or search without a panel). The root is
a fieldset with ordinary Tab navigation, not an action-only roving toolbar.
Use summaryPrefix for meaningful all/any context, localized labels for controls,
and keep saved-view management outside this query row. Narrow containers move
summaries below search/actions; no material surface is added.

FilterGroup (0.2.11 candidate) composes FilterCondition rows and SegmentedControl
for a flat finite-choice draft. Supply label, properties, controlled value
`{match:"all"|"any", conditions:[{id,property,operator,values}]}` and onValueChange.
Rows keep stable IDs. All/any appears at two conditions; an empty group offers
Add condition without extra explanatory chrome. New rows use an available
enabled property and empty values. Duplicate properties are prevented for new
choices by default; allowDuplicateProperties and maxConditions can change that
policy. Existing accepted rows are preserved when constraints change.
Accepted additions/removals restore useful focus; refused proposals retain state
and focus. The host owns application, validation, persistence and query semantics.
controlSize defaults to sm; labels and conditionLabels localize group/row text.

FilterCondition (0.2.11 candidate) composes Fieldset, Field, Grid, two Selects,
MultiSelect and an optional removal IconButton. Supply a named label, properties
with finite options, controlled value `{property, operator: "is" | "is-not", values}`
and onValueChange. Property changes propose an empty values array; operator
changes preserve values. Empty values remain a draft for host validation.
No query execution or Apply/Cancel state is built in. controlSize defaults to sm;
labels localizes names/operator text and hideLabel defaults to true for a named
row. disabled blocks all interaction; onRemove is optional. A wide host gets one
row with a larger value track; container queries reflow narrow rows. Hosts own
duplicate-property policy and focus after removal.
MultiSelect shows its placeholder only while no values are selected. With chips
and an empty query, the editor reserves only its real action/caret budget;
typing expands the search area. A needless placeholder row must not enlarge the
control, while actual chip overflow can still wrap without clipping values.

Toolbar supports shape="rounded" (default) or "pill". OverflowActions uses
shape="pill" by default and forwards that capability to Toolbar; choose rounded
for the earlier geometry. A horizontal pill toolbar stays on one scrollable rail.
Read-only text controls retain keyboard focus and copying while preventing edits
and picker activation; they are not disabled controls.

Tabs uses `variant="contained"` by default. Choose `variant="line"` for page
sections with a selection marker along the edge next to the panel. Use
`variant="pill"` for capsule tabs and `variant="round"` for rounded rectangles
on an existing surface. All variants support horizontal and vertical orientation
and the same keyboard behavior.

Version 0.2.10 adds Fieldset legendSize="label" | "section"
(default label). Independent section legends use a 1rem/600 role; named fields
retain their 13px-equivalent label size with a .25rem inner gap. Dialog task
titles use 1.25rem/600 and a 1.5rem body inset. These dark-profile recipe changes
do not enlarge compact Popover captions or default choice legends. DatePicker
calendar panels prefer at least 20rem when available, bounded by the viewport.

Version 0.2.9 improves constrained file rows, Drawer readability and Select pointer
focus without changing public signatures or token values.

Version 0.2.8 adds TimePicker, DateTimeRangePicker, unified Calendar day/month/year views,
HoverCard, ColorSwatch, ColorPicker, TreeSelect,
DateTimePicker, DataList, DataListItem, CheckCard, RadioCard, DataTable, FileItem/FileList, FileMeta, UploadItem/UploadList and ImagePreview. Color values are opaque RGB hex; TreeSelect selects one item;
DateTimePicker retains separate civil date and clock fields without inferring a
timezone. Each component has a live catalog example and public prop reference.

ListBox in the 0.2.8 source also supports native required validation, descriptions,
semantic feedback and host-owned validation messages. Readonly bypasses validity;
disabled excludes form values. See its guide for controlled selection and reset.

Version 0.2.7 adds Tree for application object selection and NavigationTree for
nested native links. Both use globally unique item values and independent
controlled/uncontrolled expansion. Tree keeps keyboard focus separate from
single/multiple selection, with host-owned deferred branches. NavigationTree
preserves native links, modifier navigation and Tab order with separate disclosure
buttons. Neither component fetches, virtualizes or writes form values. See the
[Tree](https://flood.md/components/tree) and
[NavigationTree](https://flood.md/components/navigation-tree) guides; check their
release status against your installed version.

```tsx
import "@flood-md/react/styles.css";
import { Button, FloodRoot, Heading, Stack, Text } from "@flood-md/react";

export function Welcome() {
  return (
    <FloodRoot>
      <Stack gap="4">
        <Heading level={1}>Welcome</Heading>
        <Text as="p" size="compact">Your workspace is ready.</Text>
        <Button>Open workspace</Button>
      </Stack>
    </FloodRoot>
  );
}
```

FloodRoot selects the neutral dark foundations profile: locally bundled Inter
with its original SIL OFL notice, semantic colors, relative typography/spacing,
radii, control sizes and state recipes. No new light foundations profile is
included. Legacy controls outside FloodRoot keep their earlier theme behavior.

Exports: FloodRoot, Text, Heading, Stack, Inline, Surface, Divider, IconSlot,
IconButton, CodeSnippet, Button, Input, Textarea, Checkbox, Radio, Switch, Field and Link,
plus TypeScript prop types. Version 0.2.3 also exports Label, Fieldset, RadioGroup, CheckboxGroup, ButtonGroup, InputGroup, Toggle, ToggleGroup, SegmentedControl, Collapsible, Accordion, Tooltip, Popover, Dialog, Tabs, Breadcrumb, Pagination, Select
and ScrollArea. Button variants are solid/subtle/outline/ghost;
sizes are 2xs/xs/sm/md/lg/xl/2xl. Prefer subtle for standalone secondary actions;
ghost belongs in a clear parent context. Loading disables activation.

Version 0.2.3 adds LinkProps with `variant="text" | "solid" | "subtle" |
"outline" | "ghost"` and the same seven `size` values as Button. The default
text link keeps its existing appearance and inherits text size; size affects
only button variants. These variants reuse Button's geometry, tokens and states
while retaining a real anchor, href, ref, target and browser modifier navigation.
Use Button for actions; do not add role=button or nest a Button in a Link.
There is no disabled/loading navigation API. This compatible opt-in extension
is available in 0.2.3.

Heading adds `size="display"` for large marketing headings: 5.5rem / 1.12,
weight 500, tracking -.04em. Existing heading sizes retain their metrics.
Text adds `size="lead"` for introductory copy: 1.375rem / 1.45, weight 400,
tracking -.01em. The body role remains unchanged.
CodeSnippet takes required `code: string`, optional `action: ReactNode` and
native div props/ref. It escapes/selects/wraps code and uses the semantic mono
font stack; the host owns copy actions and status messages. Both additions are
compatible extensions in 0.2.2; they do not replace existing defaults.

Input/Textarea controlSize is sm/md/lg/xl; native Input size is preserved.
Version 0.2.3 adds `status="error" | "warning" | "success" | "info"` to Input,
Textarea, Select and Field. Use Field's `message` for a description associated
with the control; spreading its callback props forwards status too. Existing
`error`, `invalid` or affirmative `aria-invalid` override positive statuses.
Only error sets aria-invalid; warning, success and info do not reject a value.
These visual/ARIA states do not replace native constraints or host validation.

Input/Textarea `readOnly` preserves focus, selection, copying and form submission
while preventing edits. Inside dark foundations it uses a canvas background and
quiet dashed perimeter at rest; focus retains the solid 2px accent. It differs
from disabled, which prevents ordinary focus and omits the value from submission.
Native HTML readOnly applies to text-like input types and Textarea; it is not a
Select or checkbox state. Explain why a value is read only in the surrounding UI.

Dark fields use one quiet uniform `color.field.border` perimeter; focus replaces it with a 2px
accent without a gap or layout shift. Textarea scrolls its content without a
native resize grip by default; hosts can opt into resizing through the native
style prop, for example `style={{ resize: "vertical" }}`.
Field uses `{props => <Input {...props} />}`. Its required prop forwards native
required and displays a marker; describedBy merges external IDs with hint/error
associations. Checkbox/Radio/Switch require a visible label. IconSlot accepts
host SVG artwork without bundling an icon pack.

## Select and choice layout

Version 0.2.3 adds **Select**. It accepts native select props/ref, options and optgroups,
plus `invalid` and `controlSize="sm" | "md" | "lg" | "xl"` (md by default).
Use Field's callback props on Select to associate the label and descriptions.
Single selection uses a custom Flood trigger/listbox popup with a native select
bridge for form values and the HTMLSelectElement ref. Native numeric `size` and
`multiple` retain an inline listbox without a dropdown chevron or OS popup.
For single selection, arrows/Home/End highlight without committing; Enter,
Space or Tab commits, and Escape closes without changing the value. Typeahead
matches option labels. Focus stays on the trigger; `ref.current.focus()` targets
it while the ref itself remains the native select. Read changes from
`event.currentTarget.value` and keep required/disabled/form props on Select.
Use ordinary option/optgroup children with text labels; an option is not an
arbitrary interactive slot. See the usage guide for reset and controlled values.

Inside FloodRoot, Checkbox/Radio use Flood's custom tick/dot appearance on real
native inputs. Values, checked/defaultChecked, keyboard, forms and refs remain
native; forced colors restores native indicators. The glyph stays 1.125rem square,
with a .5rem label gap and centered alignment. Switch also keeps its label close.
Use `Inline gap="4"` for a 1rem gap between separate choices; Inline's default
gap="2" is unchanged. Buttons retain intrinsic width; full width is a deliberate
host opt-in. See [layout rules](../../docs/layout.md) and
[Select usage](../../docs/components.md#select).

Import CSS once in Next app/layout.tsx. Add "use client" to host components
using state/callbacks or Field's function child. Override semantic --flood-sys-*
variables on the scope after the import. Surface overlay is visual elevation,
not dialog behavior. The focus accent remains configurable and provisional.

See [components](../../docs/components.md), [foundations](../../docs/foundations.md)
and [Inter provenance](src/fonts/README.md). Verify contrast, focus, keyboard,
narrow layouts and text scaling in your actual application.


## Label and Fieldset

Label forwards native label attributes and an HTMLLabelElement ref. Connect its
htmlFor to a unique control ID, or nest one labelable control. Its required marker
is decorative; required belongs on the actual control. Field composes this Label.

Fieldset forwards native fieldset attributes/ref and takes a required legend.
It provides hint/message/error/status and merges their IDs with aria-describedby.
Error wins over advisory feedback. Descriptions belong to the group rather than
being copied onto every child. Disabled uses native descendant behavior: controls
in the first legend are exempt. Avoid interactive legend content unless intended.
Disabled values are omitted from native FormData; nested fieldsets preserve HTML
rules. Styling removes the browser border but retains the actual fieldset/legend.
It does not own choice values, implement a selection model or validate children.

```tsx
<Fieldset legend="Notifications" hint="Choose the updates you want.">
  <Checkbox label="Product updates" name="updates" defaultChecked />
  <Checkbox label="Release notes" name="releases" />
</Fieldset>
```

## ButtonGroup and InputGroup

ButtonGroup requires a label and direct Button/IconButton children of compatible
sizes. It joins visible edges with finite field radii and one full separator along the joined edge, supports
horizontal/vertical orientation and keeps normal Tab/disabled/action behavior.
It does not implement a toolbar or selection model. Do not wrap actions in extra
DOM elements; fragments are fine. Avoid overflow clipping around focused actions.

InputGroup accepts text-like Input props plus start/end ReactNode adornments.
The ref, id, name, value, handlers and ARIA attributes target the actual input;
className/style target the wrapper. dir/lang/hidden apply to the shell as well.
Use Field's callback or an associated Label. Adornments are visual and are not
included in the submitted value or used as a replacement for a label.
Native required, readOnly and disabled remain input states; host-owned addon
buttons need their own names, callbacks and disabled policy. Direct Flood Button/IconButton addons inherit their height from the group, with
an equal space-1 inset against the top, bottom and nearest logical edge; their
finite radius follows the shell radius minus that inset. Their size prop still
controls text, icon and horizontal padding. Coarse pointers grow the shell to
preserve the nested action's touch target. Arbitrary addon content can grow it too.
Input focus uses the shared perimeter, while an addon action keeps its own focus.
Use scoped host layout for group width. Textarea/Select require other compositions.
Both exports are available in 0.2.3.

```tsx
<Field label="Website">
  {control => <InputGroup {...control} start="https://" placeholder="example.com" />}
</Field>
```

## RadioGroup and CheckboxGroup

Both compose Fieldset and the existing native Radio/Checkbox controls. Supply a
legend, a name for the inputs and an options array with unique string values,
visible labels and optional disabled flags. The ref targets HTMLFieldSetElement.
Orientation is vertical by default; horizontal wraps. Disabled, hint, status,
message and error follow Fieldset. These exports are available in 0.2.3.
Choice groups use compact sm-height rows without an additional vertical gap.
Coarse pointers retain the touch-target minimum. Wrapping labels can grow a row;
the indicator remains explicitly sized. Horizontal groups keep space-4 between
columns. Legend/helper spacing belongs to the group rather than each option.

RadioGroup uses a string value/defaultValue and onValueChange(string).
CheckboxGroup uses an array value/defaultValue and onValueChange(string[]).
Omitting value selects uncontrolled mode; otherwise update value in the host.
Native form reset restores the latest defaultValue in uncontrolled mode and
preserves the host's controlled value. A canceled reset does nothing; reset does
not call onValueChange. Values for missing options remain in state but are not
submitted. Disabled options are omitted from FormData.

Name applies to inputs, not the fieldset. CheckboxGroup submits repeated entries;
read them with FormData.getAll(name). The form prop associates every input with
an external form. RadioGroup required uses native single-choice validity.
CheckboxGroup intentionally has no required/min/max prop: validate the array in
the host and describe errors through status/message. Empty/fully disabled options
need a host decision about whether submission is meaningful.

```tsx
<RadioGroup name="visibility" legend="Visibility" defaultValue="private"
  options={[{ value: "private", label: "Private" }, { value: "team", label: "Team" }]} />
```

## overlay ScrollArea

ScrollArea keeps native wheel, touch and keyboard scrolling while drawing inset
tracks above content. Set height/maxHeight on its viewport through style; choose
orientation vertical (default), horizontal or both. The HTMLDivElement ref and
native div props/className/style target that actual scroll viewport. Supply an
accessible label when it is a standalone scroll region. Tracks do not reserve
layout width; inner content padding keeps text clear of them by default. Forced colors and unavailable
enhancement restore native scrollbars rather than hide scrolling access.

Rails automatically shorten near rounded corners on the viewport or a clipping
ancestor, including asymmetric corners. This does not add a gutter. The default
`contentInset="scrollbar"` protects text and full-width interactive rows: while
an overlay rail is present, the inner content receives logical end padding for
that axis (rail size plus two insets). The viewport keeps its full width; row
backgrounds and text stop before the rail. Explicit `contentInset="none"` preserves
edge-to-edge content when the host already provides safe padding. The default
padding can wrap text and change content height. Native
fallback scrollbars retain their platform behavior.

AppShell content mode uses the same ScrollArea. For a workspace whose layout
already provides clearance, `scrollContentInset="none"` keeps the content
width stable when rails appear. The default protects edge-to-edge content.

```tsx
<ScrollArea aria-label="Activity" style={{ maxHeight: "12rem" }}>
  <Stack gap="4">{/* Long activity content */}</Stack>
</ScrollArea>
```

This export is available in 0.2.3. The website
uses the same component for code, tables and navigation; Select reuses its internal
scroll viewport. See [layout](../../docs/layout.md) for constrained compositions.

InputGroup start/end are independent slots: use short prefixes (`https://`, `+7`,
`@`, currency), suffixes (`kg`, `%`, `USD`) or named Button/IconButton actions on
either side. Plain addons use subtle content color; actions retain their action
color. Include necessary units/format in the accessible label or description.
Prefixes are not masks and are not prepended to submitted values automatically;
normalization and complete phone/URL values belong to the host. Do not hide an
interactive addon from assistive technology. ButtonGroup supports text buttons,
IconButton or a mixture; every icon-only action needs its own accessible name.


## Toggle and ToggleGroup

Toggle uses a native button with aria-pressed and type=button. Use defaultPressed
for local state or pressed/onPressedChange for controlled state. Keep its visible
or accessible name stable across changes. Native onClick runs first; calling
preventDefault cancels the state change. Disabled/loading prevent activation.
iconOnly wraps host artwork in IconSlot; supply aria-label for that action.
Sizes and variants follow Button. The ref targets HTMLButtonElement.

ToggleGroup takes a label and unique-value options with label, optional icon and
disabled. selectionMode is multiple by default; single permits at most one value
and allows clearing it. Both modes use string arrays: defaultValue for local
state, value/onValueChange for host state. Controlled values do not update unless
the host updates them. Keep the selection mode stable, or remount/reset state
when changing it. Missing-option values remain in host/local state; trim them in
the host if needed. Empty options render an empty named group.

Tab visits each enabled toggle. Orientation-aware arrows (including RTL), Home
and End move focus, skip disabled options and do not select. Enter/Space activate.
The group retains intrinsic action widths rather than breaking words or compressing
icons. In constrained layouts use an enclosing horizontal ScrollArea, icon-only
actions or vertical orientation. The ref targets HTMLDivElement. iconOnly requires icons and uses option labels as
accessible names. Text+icon and text-only options are supported too.

These are pressed action buttons, not tabs, radio inputs or switches. No hidden
inputs, automatic form submission or native form-reset behavior is added. For
form fields use RadioGroup/CheckboxGroup; for panels use Tabs.
Uncontrolled default props initialize state only. Both exports are available in 0.2.3.

```tsx
<Toggle defaultPressed onPressedChange={active => console.log(active)}>Bold</Toggle>
<ToggleGroup label="Text formatting" defaultValue={["bold"]}
  options={[{value: "bold", label: "Bold"}, {value: "italic", label: "Italic"}]} />
```


## SegmentedControl

SegmentedControl is a segmented presentation of Flood RadioGroup with native
radio inputs, a visible label/legend and shared inset surface. Supply label,
name and unique-value options (string label, optional icon/disabled). Use short
labels for a small set of modes. Default orientation is horizontal; vertical,
iconOnly and fullWidth are supported. iconOnly requires each option's icon and
keeps its label available to assistive technology. fullWidth distributes equal
width to horizontal segments. controlSize is sm/md/lg/xl; touch targets may grow
the shared shell. Intrinsic groups retain readable labels rather than compressing
icons; use a constrained ScrollArea or another orientation if needed.

value/onValueChange use a single string; defaultValue initializes local state.
An absent or unmatched initial value leaves the group unselected. Once selected,
clicking the current segment cannot clear it; controlled host state can clear it.
Keep names unique among independent groups in the same form. Native name, form,
required, disabled fieldsets and reset are preserved through RadioGroup. Reset
restores the latest defaultValue for local state, preserves controlled host
values, respects cancellation and does not call onValueChange. Empty/missing
options are not invented. No automatic fallback to the first option is applied.

Tab reaches the selected enabled radio (browser defaults apply if none is
selected). Arrows focus and select, wrapping and skipping disabled options;
horizontal left/right follow RTL. Home/End select the first/last enabled item.
Space selects without clearing. A canceled native onKeyDown skips Flood's
keyboard enhancement. Enter retains native radio/form behavior. The ref targets
HTMLFieldSetElement. Hint/message/error/status follow Fieldset.

Use SegmentedControl for one value/mode, ToggleGroup for optional pressed actions
and actual tabs for associated tab panels. This does not implement tab panels.
Available in 0.2.3. Use matching installed declarations.

```tsx
<SegmentedControl label="Time range" name="period" defaultValue="day"
  options={[{value: "day", label: "Day"}, {value: "week", label: "Week"},
    {value: "month", label: "Month"}]} />
```


## visually hidden external labels

Field and Fieldset accept hideLabel (false by default). It visually hides the real
Label or legend, preserving its association and accessible name, while removing
the label's layout row and spacing while it has no focused descendants. The
required label/legend prop remains required.
RadioGroup, CheckboxGroup and SegmentedControl inherit hideLabel. Required native
controls, descriptions, error/status, group names and form behavior are unchanged.
Keep essential instructions in a visible hint/message when they are needed.
Prefer textual label content. Hidden labels/legends reveal while a descendant
has focus, then hide again when focus leaves. A supporting link in a Field label
or a control in a Fieldset first legend therefore retains visible keyboard focus;
React child state, refs and native first-legend disabled exceptions are preserved.
Do not nest another labelable control (button/input) inside a Field label.

For Input/Textarea/Select/InputGroup apply hideLabel to their surrounding Field,
not the native control. Input aria-label/aria-labelledby remain available when
the host deliberately provides its own labeling. Placeholder is not a label.
ButtonGroup/ToggleGroup already expose their group label as an accessible name;
this flag does not hide button text or the per-option labels of Checkbox/Radio/
Switch. Standalone icon actions still need an accessible name.

```tsx
<Field label="Search projects" hideLabel>
  {control => <Input {...control} type="search" />}
</Field>
<SegmentedControl label="Time range" hideLabel name="period" defaultValue="day"
  options={[{value:"day",label:"Day"},{value:"week",label:"Week"}]} />
```

This compatible prop addition is available in 0.2.3. It requires Flood CSS.


## Collapsible and Accordion

Collapsible takes a plain-text title, React children and open/onOpenChange or
local defaultOpen. Default closed; native Enter/Space activate its named button.
The trigger owns aria-expanded and aria-controls with stable instance IDs. Its
optional headingLevel adds a native h2–h6 around the button. Disabled affects the
trigger only; content inside an open panel remains interactive. controlSize is
sm/md/lg/xl. Native div props, className/style and HTMLDivElement ref target the
root; title names the trigger rather than the root's HTML title attribute.

Accordion takes an accessible group label and unique-value items with title,
content and optional disabled. expansionMode is single by default (one or none
open), or multiple. Both use string-array value/onValueChange or defaultValue.
The default headingLevel is 3; choose 2–6 to match surrounding headings. Up/Down,
Home/End focus enabled top-level triggers without changing expansion. Tab reaches
triggers and open panel controls normally; Enter/Space open/close. Nested accordions
keep their own keyboard navigation. The ref targets the group div. There is no
visible group caption to hide; headings and trigger titles remain visible.

Defaults initialize local state only. Controlled state needs host updates; keep
expansionMode stable or reconcile/remount when switching. Duplicate item values
and multiple expanded values in single mode are rejected. Missing-item values
remain in state until the host removes them. Disabled does not force panels shut.

Both share the same original disclosure anatomy. Panels stay mounted with native
hidden when closed, preserving local content state while removing hidden content
from focus/navigation. Existing form values and constraints remain native even
when hidden; manage inactive form fields in the host. If programmatic closing
hides focused content, focus returns to the enabled trigger unless already moved
elsewhere. Hosts own focus if the trigger is disabled or its whole item is removed.
There is no built-in Escape-to-close, form reset or persistence. Panels change
visibility immediately; only the chevron animates, with reduced motion disabling
that transition. No extra landmark regions are created per panel.

```tsx
<Collapsible title="Advanced settings"><Input aria-label="Project prefix" /></Collapsible>
<Accordion label="Questions" headingLevel={2} items={[
  {value:"install",title:"How do I install Flood?",content:"Install the packages."},
]} />
```

Available in 0.2.3. Import Flood CSS and use FloodRoot for dark foundations.

Disclosure corner geometry: Accordion headers have square internal seams. Only
the first header has upper shell corners, and only a closed last header has lower
shell corners. A standalone Collapsible has an inset, rounded trigger and a
separate gap before the revealed content. The trigger label and panel share
an inline edge.


## Tooltip, Popover and Dialog

All three use a trigger render function: `trigger={props => <Button {...props}>Open</Button>}`.
Forward every supplied prop and ref to one actual Button/native button in the same
document. Keep it mounted and visible while its overlay is open. Compose any host
handlers with the supplied ones, rather than replacing them; merge existing
aria-describedby with Tooltip's supplied value if adding another description.
These client interactions require modern native Popover API / dialog showModal
support. No older-browser polyfill is bundled. Native top-layer placement keeps
the panel in its original DOM/theme scope and avoids overflow clipping.

Tooltip takes text-only content, side (top default), align (center default),
delay in milliseconds (300 default) and disabled. Keyboard focus shows immediately;
mouse/pen hover uses the delay. Moving onto the tooltip keeps it visible. Escape
dismisses until a new focus/hover interaction. It never moves focus; content is
associated via aria-describedby. disabled suppresses the tooltip, not its trigger
action. Touch hover is not relied on; essential instructions belong in visible
content. Use Popover for interactive content; tooltip text is not a button's name.

Popover takes a visible title, children, trigger, side (bottom), align (start),
open/onOpenChange or local defaultOpen. It is a nonmodal dialog: focus enters its
content, but Tab is not trapped. Escape, outside pointer and focus leaving request
closing. The upper-end close action is an IconButton with a decorative cross; closeLabel
configures its accessible name. initialFocusRef can
choose an enabled element inside the panel; otherwise content gets initial focus.
Disabled prevents trigger activation. The div ref/className/style/native props
target the actual panel. Side flips and coordinates clamp near viewport edges;
scroll, viewport resize and layout changes reposition it. Native hidePopover requests state changes and a controlled owner can refuse
closure. Engine owns top/left,
position and available-size variables. Logical start/end alignment follows RTL.

Dialog uses native showModal for backdrop, inert background and nested modal
behavior. It takes title, optional plain description, children, trigger and the
same controlled/local state, disabled trigger, closeLabel and initialFocusRef.
Its upper-end close action also uses IconButton.
Escape requests closure of the topmost layer. closeOnOutsideClick defaults true;
turning it off preserves Escape and the explicit close action. Tab/Shift+Tab cycle
inside the modal, including nested nonmodal content; background scrolling is
locked without changing layout width and restored when the last modal closes.
Root props/style and HTMLDialogElement ref target the actual dialog. Native
close/method=dialog requests state changes; a controlled owner can refuse them.

Popover/Dialog children mount while open and unmount when closed. Keep persistent
form data in the host. Defaults initialize once; controlled owners must update
open. On closing, focus returns to the connected enabled trigger when appropriate;
focus deliberately moved elsewhere is preserved for nonmodal dismissal. Hosts own
fallback focus if a trigger disappears or is disabled. Choose safe initial focus
for consequential actions. Complex dialog content need not be flattened into a
single description; use its visible structure. No menu/listbox semantics are
implied by Popover. No opening/closing animation is applied in this first slice.

```tsx
<Tooltip content="Additional context" trigger={p => <Button {...p}>Help</Button>} />
<Popover title="Settings" trigger={p => <Button {...p}>Settings</Button>}>
  <Input aria-label="Project name" />
</Popover>
<Dialog title="Create a project" trigger={p => <Button {...p}>Open dialog</Button>}>
  <Field label="Project name">{p => <Input {...p} />}</Field>
</Dialog>
```

Available in 0.2.3. Use Flood CSS and FloodRoot. These are original native
implementations, without a third-party component/positioning library.


## Tabs, Breadcrumb and Pagination

Tabs connects unique-value items (label, content, optional icon/disabled) to a
named tablist and retained panels. Use defaultValue for local state or
value/onValueChange for controlled state. Missing, invalid or individually disabled
selection derives the first available item without a change callback. Reconcile
host values when changing items. Global disabled disables tab controls while
leaving the selected panel visible. iconOnly requires all icons and keeps labels
as accessible names. Native div props/ref target the root.

One enabled tab is in the Tab sequence. Orientation-aware arrows, Home/End move
focus, wrapping and skipping disabled tabs; horizontal start/end follows RTL.
activationMode is automatic (arrow navigation activates) or manual (Enter/Space
activate). Manual focus resets to active tab on leaving the list. Panels are
focusable, labelled by their tabs and retained with hidden when inactive, preserving
state and native form constraints. Hosts own inactive-field validation. External
selection changes return focus from a hidden panel to the selected tab if needed.
Horizontal overflow uses Flood ScrollArea; vertical layout wraps its tab labels.
Sizes are controlSize sm/md/lg/xl. There is no tab deletion/loading/fetch model.
The dark recipe is one contained surface: the active tab shares the panel's
background, while inactive tabs sit on the recessed navigation strip. Both
orientations share a single outer perimeter, without a separate panel border or
selection underline. Keep panel content free of redundant enclosing surfaces.

Breadcrumb uses an accessible nav label (Breadcrumb by default), an ordered items
array of label/optional href, and a decorative separator (/ by default). The last
item always has aria-current=page, as a native link or text. Parent links preserve
browser navigation; host routes and client interception remain host-owned. It
wraps and supports long labels. Native nav props/ref target HTMLElement.

Pagination is controlled: page/pageCount are required positive safe integers,
1 <= page <= pageCount; omit the component for empty datasets. Host must reconcile
page when count changes. onPageChange requests local updates; getHref renders
native route links instead of buttons. In link mode onPageChange is notification,
not navigation cancellation; modifier clicks retain native behavior. Host routing
can intercept the bubbling nav click. Current page uses aria-current, and boundary
Previous/Next controls have no active href or disabled native buttons. disabled
makes every control noninteractive. No callback fires for the current page.

siblingCount 0/1/2 gives at most 5/7/9 numeric/ellipsis slots plus Previous/Next,
independent of pageCount magnitude. Ellipses are decorative. controlSize matches
field sizes; wrapping prevents narrow-width overflow and touch controls retain
44px targets. label, previousLabel, nextLabel and pageLabel localize naming.
Use presentation="compact" to display the page position between the two arrows
in a narrow panel. Localize it via positionLabel. DataTable exposes the same
presentation through paginationPresentation and labels.pagePosition.
Use `presentation="arrows"` in a narrow footer that already shows a visible
result range. It keeps the current position available to assistive technology.

Use `CursorPagination` when the service provides previous and next cursors
without a total. Supply native `href` targets or `onSelect` callbacks. A missing
target leaves the arrow disabled. The optional `position` is host-owned and
can show the loaded range. Keep a callback target present while `pending`
is set so the initiating button retains focus and blocks repeat requests.
Use `formatPage` for localized digits, or `labels.pageNumber` on DataTable.
The native nav ref is HTMLElement. This component does not fetch data or own URLs.

```tsx
<Tabs label="Project sections" items={[
  {value:"overview",label:"Overview",content:"Project context."},
  {value:"activity",label:"Activity",content:"Recent updates."},
]} />
<Breadcrumb items={[{label:"Projects",href:"/projects"},{label:"Flood"}]} />
<Pagination page={1} pageCount={20} getHref={page => `?page=${page}`} />
```

All three are available in 0.2.3. Use Flood styles and FloodRoot for the neutral dark profile.


## Badge, Spinner, Skeleton and Avatar · 0.2.4

These original primitives are compatible additions in the 0.2.4.
Import Flood CSS and use FloodRoot. Verify registry publication before installing.
Native span props and refs target their roots; className/style remain host overrides.

Badge is a noninteractive span: size sm/md/lg, tone neutral/accent/error/warning/
success/info and variant subtle/outline. Its text carries the meaning; color is
supplementary. It has no selection, dismissal, click-action or live-region model.
Use a separate named action when needed instead of treating it as a button.

Spinner defaults to size md and label="Loading". Localize label for standalone
status. decorative hides it and its label from assistive technology. Button
loading uses the same Spinner decoratively, inherits its icon size and retains
its accessible button name and aria-busy. Announcements belong at the appropriate
host level; do not create one live region for each decorative loading graphic.
Reduced motion stops rotation. This indicator does not measure completion.

Skeleton is always aria-hidden. shape is text/rounded/circle; width and height
accept CSS dimensions (numbers are React CSS pixels), and style overrides them.
Prefer relative dimensions. For a circle supply equal dimensions. animate defaults
true; reduced motion and forced colors stop animation. Match the final geometry;
Skeleton does not fetch, detect loading or announce changes. The host owns busy
state, loading text and replacement with real content. Do not add interactive children.

Avatar requires name, accepts src, fallback text, size sm/md/lg, shape circle/
rounded and decorative. The root exposes one named image; the internal image has
empty alt and is hidden from assistive technology. Use decorative beside an
already visible equivalent name. Defaults use the first letters of the first two
whitespace-separated name parts; override fallback for your locale or naming rules.
The image overlays the fallback only after successful load; an error retains the
fallback. A new src remounts the image load state, including returning to an earlier
source. The root stays the same size. This API does not upload or crop images.

AvatarGroup shows up to `max` avatars followed by a count. Set
`overflowPresentation="popover"` to reveal the remaining people in place.
Use `overflowLabel` for the count's accessible name and `overflowTitle` for
the list's heading. The popover keeps long names readable and scrolls
independently when the number of people grows.

```tsx
<Badge tone="success">Active</Badge>
<Spinner label="Loading workspace" />
<Skeleton width="12rem" />
<Avatar name="Alex Morgan" src="/team/alex.webp" />
```


## Progress, Meter and Alert · 0.2.4

Progress describes task completion. label is required; max defaults to 100 and
value is a finite number in 0..max. Omit value for indeterminate progress; its
progressbar then omits aria-valuenow. Meter describes a measurement in a bounded
range, such as storage or battery. It requires value, with min=0 and max=100 by
default. Require finite min < max, a finite range span, and min <= value <= max.
Invalid ranges/values throw RangeError; they are not silently clamped.

Both support size sm/md/lg, semantic tone, hideLabel and valueText. Tone defaults
to accent for Progress and neutral for Meter. valueText supplies localized,
human-readable units; it also appears beside the caption. hideLabel visually
hides the caption while retaining the accessible name and valueText. The bar's
role is progressbar or meter; neither becomes a live region. Native div props,
className/style and HTMLDivElement ref target the wrapper; the internal bar owns
its ARIA range and label associations. Wrapper ARIA props stay on the wrapper; use valueText for range-specific wording. No keyboard model,
threshold calculation, fetching, timers or task cancellation is built in.
Reduced motion stops indeterminate movement and value transitions. Forced colors
preserves the track boundary and fill. Use a host loading message when needed.

Use `layout="inline"` in compact panels and rows. The caption sits beside
the track while space allows. When the caption would leave too little room
for the bar, the track moves below it. The default layout is `stacked`.

ProgressRing shares the Progress range and tone contract on a circular track.
Use it for a single operation in a compact row or card. Label and optional
localized valueText sit beside the ring and can wrap. With hideLabel, the
ring retains its accessible name and value text. An indeterminate ring
shows an arc at rest when motion is reduced.

Alert is an inline message, with optional plain-text title and React children.
Tones are neutral/info/success/warning/error; info is the default. Meaning must
remain in the text. Original decorative status glyphs are included; icon accepts
noninteractive host artwork, and icon={null} removes it without an empty column.
The title is message content, not the root's HTML title tooltip or a document heading.
Native div props/className/style/ref target the root.

announcement defaults to off for static messages. polite uses role=status;
assertive uses role=alert. Choose urgency deliberately for dynamically inserted
content. Announcements depend on actual assistive technology; initial static
markup is not guaranteed to be read aloud. No focus movement, auto-dismiss,
timeout or automatic action is supplied. Pass a named host control to `action`
to keep it separate from message announcements. It sits beside the text when
there is room and moves below in a narrow alert. Subtle and ghost actions inherit the feedback tint on
interactive states. Use a floating ToastRegion for brief operation results.
ToastRegion defaults to `placement="bottom-end"`. Choose `bottom-start`,
`top-end` or `top-start` for a different logical corner, or `inline` to
embed it in a layout. New floating cards enter from their placement edge.
Overflow scrolls within the notification stack using Flood ScrollArea. A focused
action scrolls into view within the stack.

See the [WAI Meter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/meter/),
[Alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) and
[progressbar definition](https://www.w3.org/TR/wai-aria-1.2/#progressbar).

```tsx
<Progress label="Uploading files" value={60} valueText="60%" />
<Progress label="Preparing workspace" />
<ProgressRing label="Exporting files" max={10} value={6} valueText="6 of 10 files" />
<Meter label="Storage used" min={0} max={100} value={75} valueText="75 of 100 GB" />
<Alert tone="warning" title="Storage is almost full">
  Free some space before your next upload.
</Alert>
```


## DescriptionList and Table · 0.2.4

DescriptionList renders native dl groups, each with dt and dd. items is a readonly
array of {id, term, description, action?}; IDs must be unique and nonempty, and are React
keys rather than DOM anchors. term is text and description is ReactNode, so a
value can include a Badge, Link or other meaningful content. The host formats
values and supplies fallback text for missing data. An empty items array stays
an empty list, without invented placeholder content. Native dl props,
className/style and HTMLDListElement ref target the list.

layout defaults inline: term and value share a row. Use `layout="columns"` to
retain shared term and value tracks for concise facts in a narrow inspector.
The default becomes stacked below a
22rem component container width, independently of viewport width. layout=stacked
always puts the value below its term. Density defaults compact; comfortable adds
space between pairs, without inflating the term/value relationship. dividers is
false by default and adds quiet separators when enabled. This is not an editable
form and its terms do not label controls; use Field/Fieldset for form inputs.
Use an item's `action` for a compact utility tied to that value, such as an
icon-only CopyButton with a specific accessible label. Actions align to the
trailing edge and can move below their value as space runs out.
Use an item's `valueOverflow="truncate"` for a plain identifier with a
recognizable prefix. The entire string remains available via the tooltip
and to any independent copy action.

Use `layout="grid"` for independent overview facts. It fits columns to the
container and keeps each value below its own term. Enable dividers to add
a top rule to each fact. For a prominent measure, Metric accepts `unit` for
a trailing abbreviation such as `ms` or `GB`. Format prefixes within `value`.

Use `ComparisonTable` for options that share a list of criteria. Pass stable
option IDs and key each row's cells by those IDs. Numeric criteria use tabular
figures and end alignment. The first column remains pinned while options scroll.
Use `unavailableLabel` for localized missing values and pass literal zero for
a measured zero. `featuredColumnId` adds a visual cue to a named option.

Table wraps an actual HTML table in Flood's horizontal ScrollArea. caption is
required and must be meaningful; hideCaption visually hides it without removing
the accessible table name. children owns native thead/tbody/tfoot/colgroup markup
and th/td associations. Supply scope=col or scope=row for simple headers, and
explicit id/headers associations for complex spanning headers. Do not add another
caption child. See [WAI table guidance](https://www.w3.org/WAI/tutorials/tables/).

Table density defaults comfortable; compact reduces vertical cell padding.
In 0.2.10, cellVerticalAlign defaults to "middle" for consistent
record/action and editable rows. Choose "top" for deliberate multiline prose
alignment or "bottom" when content requires it. This sets the shared cell recipe without consumer
specificity overrides. Native style on a particular th/td can override an
exceptional cell. DataTable manages its own header geometry separately.
striped is false by default. Native tfoot rows use a quiet tinted background and
medium-weight text to distinguish summaries; the top separator stays decorative.
data-numeric on a th or td uses logical end alignment,
tabular figures and no wrapping for numbers. data-align=start/center/end overrides
alignment explicitly. Text cells preserve word-based intrinsic widths and wrap
at word boundaries; a constrained long token can still use break-word fallback.
Use native data-wrap="anywhere" deliberately for a technical identifier cell
when fragmentation is preferable to local scrolling. StatusIndicator preserves
the same word-based minimum in tables and file rows. Set style.minWidth to preserve room for a
wide table, and the containing ScrollArea handles overflow. The host owns dates,
units, totals, empty rows/colSpan and any cell actions. Avoid interactive whole rows.

Native table props, className/style and HTMLTableElement ref target the table,
not its viewport. dir/lang/hidden also govern the containing scroll area.
scrollLabel names that viewport independently and defaults to caption. The native
table keeps its own caption; viewport keyboard scrolling does not turn it into a
grid widget. Keep action controls inside cells normally focusable. No sorting,
selection, data fetching, pagination, sticky header or virtualization is implied.
This is the compositional table primitive, not a DataTable engine.

```tsx
<DescriptionList items={[
  {id:"project",term:"Project",description:"Flood"},
  {id:"version",term:"Version",description:"0.2.4"},
]} />
<Table caption="Workspace projects" style={{minWidth:"32rem"}}>
  <thead><tr><th scope="col">Project</th><th scope="col" data-numeric>Members</th></tr></thead>
  <tbody><tr><th scope="row">Flood</th><td data-numeric>12</td></tr></tbody>
</Table>
```


## Menu · 0.2.4

Menu is an original action menu using Flood's positioning/layer stack and the
native Popover API. label names the menu; there is no extra visible caption.
trigger is a render function receiving OverlayTriggerProps: forward all props
and ref to one persistent Button/IconButton/native button, and compose existing
handlers rather than replacing the supplied ones. The trigger exposes
aria-haspopup=menu, aria-expanded and aria-controls. disabled affects the trigger,
not actions inside a menu the controlled host keeps open.

items is a readonly array of action items {id,label,icon?,shortcut?,disabled?,tone?}
or separators {id,type:"separator"}. IDs must be unique and nonempty, action
labels nonempty, and at least one action must exist. The optional item type is
item. Icons must be decorative, noninteractive artwork. shortcut is display-only,
not an installed keyboard binding or part of the accessible action name. Destructive
actions use tone=danger; that visual treatment does not perform confirmation or
execute any business operation. Disabled items remain focusable with aria-disabled,
but neither pointer nor keyboard activation calls onAction or closes the menu.

Enter/Space/ArrowDown open at the first action; ArrowUp opens at the last.
Inside: Up/Down wrap, Home/End choose edges, printable label-prefix typeahead
matches items (repeated characters cycle). Separators are not focusable. Enter
or Space activates through a native button. Escape closes the top menu and
returns focus. Tab moves to the next focusable control after the trigger;
Shift+Tab returns to the trigger. The menu does not trap focus. Outside pointer
or focus departure requests dismissal and preserves deliberately moved focus.

open/onOpenChange is controlled, or use defaultOpen for initial local state.
The host may refuse a close request. onAction(id) requests closing before calling
the host; the host owns business logic, asynchronous work and errors. If it moves
focus elsewhere or opens a Dialog, normal focus restoration must not steal it.
Actions mount while open and unmount on close. The persistent popup ref and native
div props/className/style target its panel. Engine-owned coordinates and available
space variables belong to positioning; side/align follow Popover conventions.
controlSize is sm/md/lg/xl (sm default); pointer-coarse targets retain touch size.

The popup uses Flood ScrollArea for long action lists, bounded to the available
viewport. Its inner corners follow shell padding and border geometry. Focus is
inset to stay visible. There is no href/navigation-item, submenu, checkbox/radio,
context-menu trigger or menubar contract in this first action-menu component.
Use ordinary Link for ordinary navigation; keep different selection models separate.

See [WAI Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) and
[Menu keyboard patterns](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/).

```tsx
<Menu label="Project actions"
  trigger={props => <Button {...props}>Project actions</Button>}
  items={[{id:"rename",label:"Rename…"},{id:"divider",type:"separator"},
    {id:"delete",label:"Delete project",tone:"danger"}]}
  onAction={id => chooseProjectAction(id)}
/>
```

### Toolbar and Kbd (0.2.4)

BulkActionBar (0.2.11 candidate) composes Toolbar and OverflowActions for selected
records. Supply label, selectionCount, items and onClear; onAction receives the
command ID. A zero count renders nothing. selectionLabel is the complete
localized count. The pill rail stays in one row, with two visible commands by
default; maxVisibleActions accepts 1, 2 or 3 and available width can reduce it
further. Remaining commands use More. pending disables all commands and clearing.
The visible pill hugs its contents within the space available to the rail.
Use `morePresentation="icon"` for dense rails and keep `moreLabel` descriptive.
counter="label" (default) shows the summary, "number" shows only the number with
the full accessible label, and "none" removes the counter slot. Label/number
slots reserve 7rem/3rem respectively, bounded on narrow rails, and use tabular
digits so changing selection does not move commands. counterWidth customizes
that reservation for translations or larger counts; long summaries truncate
visually while retaining their full text/title. A hidden counter frees its slot.
The host owns accepted changes, captured IDs, confirmation and focus after the
bar disappears. Positioning is host-owned: use a stable bounded width for a
floating rail, plus viewport safe-area spacing and measured scroll clearance.
For table selection, place the rail at the viewport's bottom center. Set
`showSelection={false}` on DataTable to keep its count available to assistive
technology while BulkActionBar displays the visible count.
For tables with their own visible count, `showSelection="replace-results"`
uses the result range's footer slot while rows are selected.

OverflowActions also accepts leading/trailing slots, maxVisibleActions and the
same morePresentation option. Slot
width is reserved before measuring commands; use action owners in those slots
and retain a stable containing width. Do not add form inputs to the Toolbar.

Toolbar groups Button, IconButton, Toggle, native buttons/links and Menu triggers
under one named action panel. After hydration it uses one Tab entry, directional
arrows, Home/End and optional looping. Disabled/hidden actions are skipped. Arrows
move focus, not activation. Horizontal order follows writing direction. In vertical
toolbars open Menu with Enter/Space; horizontal menus retain Up/Down opening.
A vertical pill centers its actions on a single axis. Use same-size icon controls
with accessible names for a compact rail. Use a rounded toolbar for a vertical
group of labeled actions.
Keep text inputs and independent selection widgets outside this action-only API.
Native child handlers and refs remain attached; Toolbar owns their tabIndex while
mounted and restores original attributes on cleanup. Without JavaScript, native
child Tab order remains available. Use a meaningful required label.

Kbd renders native kbd markup with sm/md/lg sizes and relative keycap heights.
It displays a key or combination; the host implements real shortcuts. It is not
interactive. Menu shortcut hints reuse Kbd and remain hidden from item names.

```tsx
<Toolbar label="Editor actions">
  <Button variant="ghost">Undo</Button>
  <Toggle variant="ghost">Bold</Toggle>
  <Button variant="ghost">Share</Button>
</Toolbar>
<Kbd>Ctrl</Kbd> + <Kbd>K</Kbd>
```

### Card (0.2.4)

Card composes Surface into a header, body and footer. Optional title, description,
actions and footer accept React content; children are the body. Missing slots
create no empty section. Use Surface when only a background/padding is needed.

Card is a noninteractive div. Put Button, Link or Menu in actions/footer and keep
its container out of the Tab order. Do not make the entire card clickable around
nested controls. Native div props, styles and HTMLDivElement ref target the root.
The title prop is heading content, not an HTML tooltip; supply phrasing content.
headingLevel defaults to 2; choose the correct hierarchy for the host page.

Compact/comfortable density controls existing spacing tokens. Header actions wrap
without clipping menus or focus indicators. Footer uses a quiet separator; a
footer-only card has no redundant separator. Elevation is default or raised.
No data access, selection or interactive-card behavior is implied.

```tsx
<Card title="Project details" description="Keep your team in sync."
  footer={<Button variant="subtle">Open project</Button>}>
  <Text as="p" size="compact">A calm place for the next idea.</Text>
</Card>
```

## Structural, media and accessible primitives · 0.2.4

Container centers a max-width box with logical gutters. size sm/md/lg uses
40/64/80rem bounds including padding; full removes the max. gutter uses Space.
Grid defaults to auto-fit with a16rem semantic minimum clamped to available
width. gap uses Space. minItemWidth overrides the auto minimum; explicit columns
(1/2/3/4/6/12) remain fixed. Grid is ordinary layout, never an ARIA grid widget.

VisuallyHidden preserves content in the accessibility tree using span/div. Default
is for noninteractive content. Use focusable for a skip link: focus-within reveals
its wrapper; style the actual link's focus. This is different from aria-hidden or
conditional rendering. Native captions/legends may use the same hiding utility
without an invalid generic wrapper. Spinner and hidden indicator captions compose
VisuallyHidden.

AspectRatio reserves responsive media geometry before loading, accepting a finite
positive ratio (16/9 default). Direct img/video/iframe children fill its box. It
does not clip focus or make arbitrary long content fit; the host owns alternative
text, captions, media controls and deliberate cropping. Image is a native img
with required alt (empty for decorative content), cover/contain fit and preserved
srcSet/sizes/loading/decoding/dimensions/events/ref. No optimizer, fetch engine or
fallback is implied. Avatar composes Image for its own loading lifecycle. Supply
image dimensions or AspectRatio to reserve space.

List renders native ul/ol with native li children and token gap. ordered selects
ol; start/reversed apply there. start must be a safe integer. marker=false retains
explicit list semantics for platforms that drop lists without visible markers.
This is content, not ListBox selection or arrow navigation.

EmptyState composes Stack, Heading, Text, IconSlot and Inline. Required title,
optional description, decorative icon and actions explain absent content; choose
headingLevel for the host hierarchy. It is static, with no automatic focus or
announcement. compact/comfortable density controls padding. The host implements
real actions and decides whether asynchronously changed results need announcing.
EmptyState and ErrorState share a row layout with trailing actions that wrap
under the message. DataTable accepts an ErrorState via `errorContent` when a
failed read needs a custom message or recovery.
Use LoadingState for a visible initial-loading message that shares those
layouts. DataTable exposes it through `loadingAppearance="message"`.

Checkbox adds indeterminate for a host-controlled mixed presentation after
hydration. checked independently determines form submission; mixed does not mean
a third submitted value. The host owns aggregate/select-all values. Native reset
and ref access remain available. Radio and Switch do not expose indeterminate.

ButtonGroup/ToggleGroup retain their keyboard contracts and locally scroll when
a connected row cannot fit. InputGroup actions keep words intact and can wrap to
a new row while the input retains usable space. Plain string adornments are bidi
isolated; for protocols/phones with explicit direction pass a bdi dir=ltr node.
Keep very long addon content concise. Hidden native choices hide their label too.

Dark foundations bundle both normal and italic Inter, including Cyrillic, with
original OFL notices. Color alone never communicates validation or progress.

CodeSnippet codeDirection defaults to ltr independently of RTL parent action layout; choose rtl/auto explicitly for content that needs it. Native dir still applies to the wrapper. Protected ScrollArea reveals focused descendants fully when needed, composes the host focus handler and avoids scrolling to nested top-layer controls.

Checkbox, Radio and Switch apply native hidden/dir/lang to their visible label wrapper as well as the input, so a component-local language/direction applies to its whole choice.


0.2.5 adds NumberInput (native numeric editing and integrated step actions) and Slider (one value or an ordered pair). Use matching declarations and the numeric controls guide in docs/base-components.md. Registry publication is separate from source availability.

Combobox adds editable single selection in 0.2.5. Reuse Field for the
label, use options with stable value/label pairs, and observe onValueChange for
the selected ID. Search query text is not form data. See docs/base-components.md
for reset, required, read-only, localized messages and native Popover requirements.

Tag and MultiSelect are compatible additions in 0.2.5.
Tag labels an item and optionally requests host-owned removal. MultiSelect uses
arrays of stable option IDs and composes those tags with the shared searchable
selection model. See docs/base-components.md for keyboard behavior, locked values,
readonly/required forms, focus recovery and relative nested geometry. Existing
Combobox continues to accept and return a single string.


SearchInput and PasswordInput join 0.2.5. Both compose
InputGroup with native input props, Field feedback, ref, sizes and form ownership.
SearchInput uses type=search and a decorative leading icon; clearable defaults to
true and clearLabel names its sole suffix action. Clearing dispatches native input
editing, restores input focus and respects read-only/disabled. The host owns search
results and submission. PasswordInput keeps one visibility action; use
visible/onVisibleChange or defaultVisible, and localize showPasswordLabel and
hidePasswordLabel. Revealing retains the value and caret; read-only permits reveal.
Use autocomplete appropriate to the host form. Both accept accessible names via
Field, aria-label or aria-labelledby. These controls add no authentication logic.

Use FieldChecklist for conditions evaluated by the host form. It supports
pending, met and unmet states, with a distinct mark and readable status for
each requirement. Use PasswordStrength beside a new-password field to show a
host-provided assessment and optional FieldChecklist. The assessment uses
Meter with an explicit localized valueText. Omit assessment until a result
is available. Pass results and requirements to the component while the form
owns the password, validation and announcements.


FileInput (0.2.5) composes a native file input with Flood field geometry,
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


AlertDialog (0.2.5) is a concise confirmation, composed from Flood's
native modal layer and Button. Supply title, description, trigger and onConfirm.
Line breaks in the description separate distinct thoughts while allowing each line to wrap.
Cancel receives initial focus; Escape cancels; outside clicks do not dismiss.
Tab containment, background inertness, scroll lock and return focus reuse Dialog.
Translate confirmLabel/cancelLabel. onConfirm runs before requesting close, while
onCancel covers Cancel/Escape. Use open/onOpenChange for controlled state and
confirmDisabled to disable confirmation. Callbacks are not awaited; the host owns
async requests, pending UI and errors. Use Dialog for forms/complex content.


Drawer (0.2.5) reuses Dialog's modal behavior with an edge-panel layout.
side is logical start/end (default end) or top/bottom; size sm/md/lg sets the
cross-axis extent to 20/26/34rem within the viewport. Vertical panels fill height,
horizontal panels fill width. Use footer for host-owned actions; only body content
scrolls with Flood ScrollArea. Header/close action/footer remain visible. Native
ref, controlled open/onOpenChange, outside dismissal and initialFocusRef match
Dialog. Translate closeLabel/title/description; reduced motion disables entry
animation. Closing is immediate. There is no swipe/drag gesture or auto-save logic.


The 0.2.5 separates floating surfaces from modal surfaces.
Nine additional semantic roles bring the dark profile to 193 roles; previous token
values remain intact. surface.floating is the opaque fallback;
surface.floating-translucent, border.floating, selection.floating, shadow.floating
and effect.floating blur/saturation/shadow-offset/shadow-blur define the floating
material. Select, Combobox, MultiSelect, Menu, Popover and Tooltip share it; Dialog
and Drawer retain surface.overlay. Backdrop filtering is progressive enhancement;
reduced transparency uses the opaque fill and forced colors use system colors.
Keep text opaque and evaluate it against the actual composited background.


The 0.2.5 component expansion adds native content/typography,
collection/form controls, navigation/layout and clipboard/notification primitives.
See docs/base-components.md and the per-component catalog for contracts and limits.
The CSS build assembles the original component styles into the shared stylesheet.


Section headingLevel controls native h2–h6 semantics. Its independent headingSize
uses the Heading roles (group/section/page/large/display), defaulting to section.
Choose group for a compact section inside a Drawer or another constrained panel.
Keep document hierarchy meaningful when changing visual emphasis.

## Editable and TagInput · 0.2.7

Use `TagGroup` to show accepted labels or removable tags. The host owns the
items and applies removal requests by ID. Set `maxVisibleTags` to disclose
extra tags behind a count. CollectionToolbar exposes the same option through
`appliedFilterDisplay` for accepted filters.

Editable provides inline single-line editing with a separate draft, save/cancel actions and committed named form values. See [Editable](../../docs/components/editable.md) for controlled ownership and blur behavior. TagInput creates free-form text tokens and submits repeated named values; it is distinct from fixed-option MultiSelect. See [TagInput](../../docs/components/tag-input.md) for delimiters, paste and validation.

Menu adds `MenuCheckboxItem` and `MenuRadioItem`. Both take controlled `checked` and `onCheckedChange`; radio items also require a `group` label and the host enforces one selected value per group. Checkbox `checked` also accepts `"mixed"`. Keep radio groups contiguous. Preferences stay open by default; set `closeOnSelect` to close after activation. Preference changes do not invoke `onAction`. Existing action items retain their behavior.

CommandList (0.2.7) provides grouped command filtering and invocation without a modal or form value. CommandList and CommandPalette share optional item icons and hints for host-registered shortcuts. See [CommandList](../../docs/components/command-list.md) for query ownership, keyboard navigation and loading/empty states.

DateField (0.2.7) edits a Gregorian civil date through native text segments, with ISO canonical values, bounds, explicit segment order and native invalid-draft form handling. It has no operating-system date popup. See [DateField](../../docs/components/date-field.md).

TimeField, Calendar and DatePicker (0.2.7) complete the first single-date/time entry family. See [TimeField](../../docs/components/time-field.md), [Calendar](../../docs/components/calendar.md) and [DatePicker](../../docs/components/date-picker.md). Calendar onDateSelect reports enabled activation, including the already selected date; onValueChange requests only changed values. DateField end accepts an optional trailing action.

Popover positionReference optionally supplies a connected same-document element ref for geometry while trigger semantics, dismissal and focus restoration remain on its button. DatePicker uses this to align its panel to the whole field, tracks field width responsively and clamps to the viewport. Available in the 0.2.7 source candidate.

DateRangeField, RangeCalendar and DateRangePicker (0.2.7) share ordered range values and the original Calendar grid. ResizablePanels adds real pointer/keyboard geometry above static Split. ErrorSummary links host validation to native controls. See each generated catalog page and its guide under docs/components/. DateField validationMessage adds an external native constraint after the field's own date validity.

Menu (0.2.7) supports recursive submenu items and ContextMenu reuses its native layer engine. Context triggers preserve the actual pointer/keyboard source; nested searches stay scoped, Escape unwinds one level and Tab exits through the root. See docs/components/menu.md and context-menu.md.

## Collection contracts in 0.2.11

Autocomplete submits free text, including strings outside its suggestions.
Combobox and MultiSelect continue submitting IDs. Search controls accept local
filtering (default) or manual filtering with controlled query/value and
optionsQuery identifying the result. A mismatched result stays nonselectable.
loadState distinguishes ready/loading/error; onRetry is an optional host action.
Use selectedOptions to retain a selected record's presentation while results
change. Query cancellation and transport stay with the host. Options may have
group labels; option IDs remain globally unique.

OverflowActions takes named command items, an onAction callback, optional priority,
size/variant and a localized moreLabel. It preserves source order and moves lower
priorities to an existing Menu. It is not a navigation-link container. Menubar
coordinates menus with controlled/uncontrolled openValue and roving triggers;
child commands reuse Menu. Use native links for destinations. Button/IconButton
tone="danger" uses existing semantic colors within FloodRoot, independently of
prominence. Tone itself does not confirm a destructive operation.

DataTable paginationMode="server" renders supplied rows without sorting/slicing.
Provide page/onPageChange and nonnegative totalRows; sortable columns also require
controlled sort (null when absent) and onSortChange. Reconcile an out-of-range page
when a query changes; ready rows must match pageSize/totalRows. Selection defaults
to the supplied page in server mode and the full collection in client mode.
Server selectionScope="dataset" requires controlled selectedIds/onSelectionChange;
the host validates IDs outside the page. Checkboxes only select the current page.
DataTable `paginationMode="cursor"` also renders the supplied batch in host
order. Set `cursorPagination` to put Previous and Next in the same footer.
An optional `position` shows a known range without requiring a total.
The host owns request execution and cancellation, remote query selection and
virtualization. DataTable supports optional column visibility, width preferences,
logical edge pinning and expandable record details. Use Sparkline for a compact
trend cell. See [DataTable](../../docs/components/data-table.md) and
[Sparkline](../../docs/components/sparkline.md).

MetricCard composes a medium-sized Metric and optional Sparkline on one Surface.
Set `metric.size="sm"` when a dashboard grid needs a quieter value.
The inline layout reflows the chart beneath the value at narrow widths.
Use `trend.context` for the comparison period next to the change label.
Use `MetricDelta` for that same comparison on its own in a row or table cell.
Its `chip` variant tints the change and keeps the comparison period outside.
Inside `Metric`, set `trend.variant` to choose the same treatment.
While the metric loads, the label stays visible and a supplied chart uses a
compact Skeleton. Use `chartLoading={true}` to reserve the plot before history
arrives, or `chartLoading={false}` to keep valid history during a value refresh.

DatePicker and DateRangePicker pass viewLabels to their calendars. Calendar panels
use minimal Popover chrome, with Escape/selection/trigger dismissal; there is no
separate hidden close-button API. DateTimePicker datePickerLabels/timePickerLabels
forward popup labels plus segmentLabels and validation messages. DateTimeRangePicker
exposes corresponding start/end label objects; outer field labels remain distinct.

Accordion and Collapsible accept `variant="flush"` for sections sharing a Drawer
or inspector surface. The default `framed` appearance is unchanged. Flush removes
the outer frame and horizontal inset; the parent owns that inset, while Accordion
keeps separators between items. Expansion, focus and mounted panel state are
unchanged. Combine with `controlSize="sm"` for compact inspector headings.
