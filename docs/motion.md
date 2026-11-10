# Motion

`PageHeader` stays static. Its actions keep their own Flood interaction feedback,
and container reflow does not animate the title or move focus.
`AppShell` and `AppTopBar` do not animate layout or scroll position. Sidebar
and Drawer own their own transitions.

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
| `Text`, `Heading`, `Kbd`, `VisuallyHidden`, `Blockquote`, `InlineCode`, `IconSlot`, `Label` | Static text and artwork. The containing control owns feedback. |
| `Stack`, `Inline`, `Surface`, `Divider`, `Container`, `Grid`, `AspectRatio`, `Section`, `Split`, `Center`, `Fieldset` | Stable layout. Children own any appearance or interaction feedback. |
| `ScrollArea`, `ResizablePanels`, `Slider` | Direct pointer tracking. Only scrollbar hover paint eases. Resize, scroll and slider positions stay under the pointer. |
| `Button`, `IconButton`, `Toggle`, `CopyButton` | Hover paint and short press compression. Toggle holds selected paint. Copy shows its result glyph without resizing the button. |
| `ButtonGroup`, `ToggleGroup`, `Toolbar`, `OverflowActions`, `BulkActionBar`, `Menubar` | Actions inherit Button and Menu feedback. Joined button surfaces keep their geometry. Bulk actions fade in when available. |
| `CommandList`, `ListBox`, `Tree`, `NavigationItem`, `NavigationList`, `NavigationTree`, `NavigationGroup`, `Sidebar` | Row paint, disclosure glyphs and optional flyouts. NavigationTree fades in branch content in place and removes it immediately on collapse. Sidebar eases between expanded and rail widths. Focus, route and tree reflow update immediately. |
| `Link`, `Breadcrumb`, `Pagination`, `SkipLink`, `Steps` | Navigation is immediate. Button-style actions and step rows can ease their paint. Skip links appear immediately on focus. |
| `Tabs`, `SegmentedControl` | Selected paint and, for line tabs, an arriving indicator. Tabs reveal the visible panel with a short fade while selection and focus update immediately. |
| `Field`, `Input`, `Textarea`, `InputGroup`, `SearchInput`, `PasswordInput`, `NumberInput`, `PinInput`, `DateField`, `TimeField`, `DateRangeField`, `Editable`, `CharacterCount` | Field hover paint and inherited action feedback. Typing, caret, counts, validation and edit-mode focus are immediate. |
| `Checkbox`, `Radio`, `Switch`, `CheckboxGroup`, `RadioGroup`, `CheckCard`, `RadioCard`, `Rating` | Check and rating marks change paint, the switch thumb travels, and selectable cards ease selected paint. Values update immediately. |
| `Select`, `Combobox`, `Autocomplete`, `MultiSelect`, `TreeSelect`, `DatePicker`, `DateRangePicker`, `TimePicker`, `DateTimePicker`, `DateTimeRangePicker`, `ColorPicker` | Inherit control, active option and layer motion. Typing, range editing, swatch changes and pointer tracking are immediate. |
| `Calendar`, `RangeCalendar` | Day selection paint. Month and year changes keep the grid stable and respond immediately. |
| `FileInput`, `Dropzone`, `TagInput`, `Tag`, `FilterCondition`, `FilterGroup`, `CollectionToolbar`, `CollectionViewSwitcher` | Inherit button, field and layer feedback. Drag targets, file changes, chip removal and applied filters update immediately. |
| `Collapsible`, `Accordion` | Keep the header flush on press, rotate the centered disclosure mark and reveal panel content. Closing immediately hides the panel and restores focus where needed. |
| `CodeSnippet`, `Card`, `DataList`, `DataListItem`, `FileItem`, `FileList`, `AvatarGroup` | Embedded actions and avatars own motion. Reading order and record layout remain stable. |
| `Badge`, `DescriptionList`, `Table`, `Image`, `List`, `Figure`, `Metric`, `Timeline`, `ColorSwatch`, `FileMeta` | Static content. Changes to data, labels and supporting media render immediately. |
| `Avatar` | Loaded image eases in within a fixed frame. Fallback text is immediately available. |
| `DataTable` | Selected row paint and sort chevron rotation. Sorting, pagination and table geometry update immediately. |
| `Tooltip`, `Popover`, `Menu`, `ContextMenu`, `HoverCard`, `CommandPalette`, `Dialog`, `AlertDialog`, `Drawer`, `ImagePreview` | Anchored entrances follow placement. Modal and edge panels have their own timing. Controls, focus, close and positioning retain their native behavior. |

Menu, ContextMenu and title-only navigation flyouts fade in and out where
discrete top-layer transitions are supported. Dismissal releases focus and
pointer interaction immediately. When a sibling navigation flyout takes over
the same rail position, the outgoing panel yields immediately.
| `Spinner`, `Skeleton`, `Progress`, `Meter`, `ToastRegion`, `UploadItem`, `UploadList` | Busy indicators, value fill and floating toast arrivals. Upload compositions inherit the progress and action recipes. Announcements and final values are immediate. |
| `Alert`, `EmptyState`, `StatusIndicator`, `ErrorSummary` | State and message changes are immediate. Embedded actions keep Button feedback. |
