# Motion

Flood uses short motion to show where an interface changed. Motion follows the
component's own state and respects the operating system's reduced-motion preference.

[Try motion and reduced motion](/playground/motion).

| Event | Typical duration | What moves |
| --- | --- | --- |
| Press and hover | 70–100 ms | Paint on actions, rows and options, plus a slight compression while holding a standalone control |
| Selection and disclosure | 100–160 ms | State paint, glyphs and revealed content |
| Menus and feedback arrivals | 180 ms | Opacity and small directional movement |
| Modal and drawer entrances | 240 ms | The arriving layer or its content |
| Brief dismissal where safe | 120 ms | A visual part with a reliable exit lifecycle |

Use `--flood-sys-motion-*` roles for Flood compositions. Set
`data-flood-motion="reduce"` on FloodRoot to also suppress component motion in
an application scope. This setting complements the system preference.

Focus, validation, semantics and state take effect immediately. Static content
and layout inherit behavior from their interactive owners. Sliders, drag,
resize and scrolling track input directly. Loading remains legible when its
indicator stops moving. Native layer dismissal is immediate where the browser
and React lifecycle remove its content together.
Floating toasts animate their message on arrival. Inline notices stay static
within the surrounding reading flow.

Use the versioned `workflow:motion` through the Flood CLI for implementation
and browser verification guidance.

## Component states

Each row lists components that share a motion owner. Compositions inherit the
behavior of their children. State updates and focus take effect immediately.

| Components | Motion and state behavior |
| --- | --- |
| `FloodRoot` | Applies the motion preference to its scope. Preference changes are immediate. |
| `Text`, `Heading`, `Kbd`, `KeyboardShortcut`, `VisuallyHidden`, `Blockquote`, `InlineCode`, `Timestamp`, `IconSlot`, `Label` | Static text and artwork. The containing control owns feedback. |
| `TruncatedText` | The visible line updates immediately and inherits Tooltip motion when the full value is revealed. |
| `Stack`, `Inline`, `Surface`, `Divider`, `Container`, `Grid`, `AspectRatio`, `Section`, `Split`, `Center`, `Fieldset`, `FormActions`, `SettingGroup` | Stable layout. Children own any appearance or interaction feedback. |
| `PageHeader`, `AppShell`, `AppTopBar` | Titles, layout and scroll position stay stable during reflow. Actions, Sidebar and Drawer own their interaction feedback. |
| `ScrollArea`, `ResizablePanels`, `Slider` | Direct pointer tracking. Only scrollbar hover paint eases. Resize, scroll and slider positions stay under the pointer. |
| `Button`, `IconButton`, `SearchTrigger`, `NotificationTrigger`, `Toggle`, `CopyButton`, `CopyableValue`, `RevealValue` | Hover paint and short press compression. Toggle holds selected paint. Copy shows its result glyph and NotificationTrigger clears its unread dot within the same bounds. RevealValue replaces the mask immediately. A Button with retain-focus loading swaps the content for a spinner. |
| `ButtonGroup`, `SplitButton`, `ToggleGroup`, `Toolbar`, `OverflowActions`, `BulkActionBar`, `Menubar` | Actions inherit Button and Menu feedback. Joined button surfaces keep their geometry. Bulk actions fade in when available. |
| `CommandList`, `ListBox`, `Tree`, `NavigationItem`, `NavigationList`, `NavigationTree`, `NavigationGroup`, `Sidebar` | Row paint, disclosure glyphs and optional flyouts. NavigationTree fades in branch content in place and removes it immediately on collapse. Sidebar eases between expanded and rail widths and truncates its row text to keep it on one line. Its toggle shows a filled keyboard focus state, with the system outline in forced colors. Focus, route and tree reflow update immediately. |
| `Link`, `IconLink`, `Breadcrumb`, `Pagination`, `CursorPagination`, `SkipLink`, `Steps` | Navigation is immediate. Button-style links share control feedback. A pending cursor request uses the existing retain-focus loading button. Step rows can ease their paint. Skip links appear immediately on focus. |
| `StepProgress` | The position track uses the shared Progress motion. The current step title and count update immediately. |
| `Tabs`, `SegmentedControl` | Selected paint and, for line tabs, an arriving indicator. Tabs reveal the visible panel with a short fade while selection and focus update immediately. |
| `Field`, `Input`, `Textarea`, `InputGroup`, `SearchInput`, `PasswordInput`, `NumberInput`, `NumberRangeField`, `PinInput`, `DateField`, `TimeField`, `DateRangeField`, `Editable`, `CharacterCount` | Field hover paint and inherited action feedback. Typing, caret, counts, validation and edit-mode focus are immediate. |
| `MessageComposer` | The embedded editor stays transparent on hover. Its caret and the existing surface border indicate focus. Buttons inherit press feedback. Updates to the draft, attachments and the Send / Stop slot are immediate. |
| `Checkbox`, `Radio`, `Switch`, `SwitchGroup`, `CheckboxGroup`, `RadioGroup`, `CheckCard`, `RadioCard`, `CheckCardGroup`, `RadioCardGroup`, `Rating` | Check and rating marks change paint, the switch thumb travels, and selectable cards ease selected paint. Values update immediately. |
| `RatingValue` | Fractional star paint and score update immediately as a single readout. |
| `RatingSummary` | The aggregate score and counts update immediately. The bucket fills follow Meter motion without moving the labels or tracks. |
| `SettingRow` | The row geometry stays stable. Its trailing action owns interaction feedback. |
| `Select`, `Combobox`, `Autocomplete`, `MultiSelect`, `TreeSelect`, `DatePicker`, `DateRangePicker`, `TimePicker`, `DateTimePicker`, `DateTimeRangePicker`, `ColorPicker`, `ColorPalette` | Inherit control, active option and layer motion. Typing, range editing, swatch changes and pointer tracking are immediate. |
| `Calendar`, `RangeCalendar` | Day selection paint. Month and year changes keep the grid stable and respond immediately. |
| `FileInput`, `FileTrigger`, `Dropzone`, `FileDropTarget`, `TagInput`, `Tag`, `TagGroup`, `FilterCondition`, `FilterGroup`, `CollectionToolbar`, `CollectionViewSwitcher` | Inherit button, field and layer feedback. Drag targets, file changes, chip removal and applied filters update immediately. |
| `Collapsible`, `Accordion` | Keep the header fixed and rotate its centered mark. Panel height expands and collapses in place. Closing immediately removes the panel from keyboard and assistive navigation and restores focus where needed. Reduced motion settles immediately. |
| `CodeSnippet`, `Card`, `DataList`, `DataListItem`, `FileItem`, `FileList`, `FileCard`, `FileThumbnail`, `AvatarGroup` | Embedded actions and avatars own motion. AvatarGroup inherits Popover motion in its interactive overflow mode. Selectable cards and list rows use Checkbox feedback and change their fill with stable geometry. FileThumbnail reserves the frame during loading and fallback. |
| `FileName` | A clipped name discloses the full value with Tooltip motion. The displayed prefix and extension follow the available width immediately. |
| `AuthorMeta`, `MetadataList`, `Comment`, `CommentThread`, `ExpandableText` | Attribution, supporting facts and message layout stay static. Comment actions may fade in on hover or keyboard focus. The action itself owns copy or other command feedback. ExpandableText reveals the passage immediately and keeps focus on the same toggle. |
| `ReactionButton` | Inherits Toggle press and selected feedback. The host supplies the accepted count and pressed state together. |
| `ReactionPicker` | Uses Popover entry and exit with an anchored trigger. Selecting a reaction closes the chooser and restores focus. |
| `NotificationInbox`, `NotificationList`, `NotificationItem` | Keep the unread marker track fixed. Read commands use existing button feedback. Changes to the filtered list render immediately and recover focus when a focused row leaves. |
| `CommentComposer` | Inherits MessageComposer interaction feedback. Context and action tracks stay stable while editing. |
| `Badge`, `CountBadge`, `DescriptionList`, `ValueChange`, `ChangeList`, `Table`, `ComparisonTable`, `Image`, `List`, `Figure`, `Metric`, `MetricDelta`, `MetricGroup`, `Timeline`, `ActivityTimeline`, `ColorSwatch`, `FileMeta` | Changes to data, labels and supporting media render immediately. Metric and MetricGroup use the standard Skeleton pulse for pending values and respect reduced motion. |
| `Sparkline`, `MetricCard` | Hover briefly strengthens the Sparkline's latest point and area. MetricCard leaves the value and surface static. Data changes render immediately. |
| `ImageComparison` | The divider follows pointer and keyboard input immediately. The frame and images stay in place. |
| `LineChart` | Crosshair, markers and local line emphasis track the pointer continuously. The readout shows the nearest recorded sample and lifts clear of the marker near the trailing edge. On exit the readout and marks fade in place from their last pointer position. |
| `BarList` | Uses Meter's value transition and the same fast highlight as chart inspection. Labels and values update immediately. |
| `BarChart` | Uses the fast motion role to emphasize the inspected group while its neighbors dim. The readout updates with the active category and column geometry stays fixed. |
| `DonutChart` | Uses the fast motion role for the inspected segment's outline. Category colors, fills and geometry stay fixed, and the center readout updates immediately. |
| `CompositionBar` | Segments and readouts update together. The category order and bar height stay stable as amounts change. |
| `NoResults` | The message follows the result set immediately. A reset restores results without animating the table or moving the persistent search controls. |
| `Heatmap` | Moves the value tooltip immediately to the inspected cell and keeps the matrix fixed. Visual gutters share the adjacent cells' hit areas. |
| `ScatterChart` | Highlights the inspected observation and presents its coordinates. Points keep their positions. |
| `RangeChart` | Highlights the inspected interval while its exact bounds update immediately. |
| `BulletChart`, `CapacityMeter` | Use the Meter transition for the fill. The target mark and exact readouts update immediately. A CapacityMeter fill stops at its limit. |
| `WaterfallChart` | Highlights the inspected step and shows the change and running balance. |
| `Histogram` | Shows exact bin bounds and count as inspection moves. Bin geometry stays fixed. |
| `BoxPlot` | Highlights the inspected distribution and anchors its summary to the median. The tooltip prefers the right side and flips when space runs out. |
| `DumbbellChart` | Highlights the inspected comparison without moving its marks. The readout updates immediately. |
| `Avatar`, `AvatarPicker` | Loaded image eases in within a fixed frame. Fallback text is immediately available. The picker inherits button feedback and the host owns its busy state. |
| `DataTable` | Selected row paint, chevron rotation and a short height transition for row details. Sorting, pagination and column resize update geometry immediately. |
| `Tooltip`, `Popover`, `HelpTip`, `Menu`, `ContextMenu`, `HoverCard`, `CommandPalette`, `Dialog`, `AlertDialog`, `Drawer`, `Sheet`, `ImagePreview`, `ImageGallery` | Anchored entrances follow placement. Modal and edge panels have their own timing. Sheet uses the bottom Drawer entrance. Gallery image changes replace the frame content immediately and keep navigation stable. |
| `Spinner`, `Skeleton`, `ListSkeleton`, `CardSkeleton`, `TableSkeleton`, `Progress`, `ProgressRing`, `Meter`, `ToastRegion`, `UploadItem`, `UploadList`, `UploadQueue` | Busy indicators and value fill. ProgressRing interpolates the arc for a known amount, rotates a short arc for an unknown amount, and keeps that arc still under reduced motion. List, card and table placeholders inherit Skeleton motion. A floating toast enters as a card from its placement edge; an inline toast fades in place. Upload compositions inherit the progress and action recipes. Announcements and final values are immediate. |
| `Alert`, `EmptyState`, `ErrorState`, `LoadingState`, `StatusIndicator`, `SaveStatus`, `ErrorSummary` | State and message changes are immediate. LoadingState and SaveStatus inherit Spinner motion. Embedded actions keep Button feedback. |
| `FieldChecklist`, `PasswordStrength` | Requirement marks and labels update immediately. A password assessment uses Meter's fill transition and motion preference. |

Menu, ContextMenu and title-only navigation flyouts fade in and out where
discrete top-layer transitions are supported. Dismissal releases focus and
pointer interaction immediately. When a sibling navigation flyout takes over
the same rail position, the outgoing panel yields immediately.
