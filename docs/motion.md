# Motion

Flood uses short motion to show where an interface changed. Motion follows the
component's own state and respects the operating system's reduced-motion preference.

[Try motion and reduced motion](/playground/motion).

| Event | Duration | What moves |
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
| `Text`, `HighlightText`, `Heading`, `Kbd`, `KeyboardShortcut`, `VisuallyHidden`, `Blockquote`, `InlineCode`, `Timestamp`, `IconSlot`, `Label` | Static text and artwork. The containing control owns feedback. |
| `Duration` | Measurements update in place. The host owns ongoing measurement and refresh. |
| `NumericValue` | Changes appear immediately. The width reservation can keep nearby content stable through a formatting change. |
| `IconSwap` | Overlapping glyphs crossfade and scale in one slot. The first frame and reduced-motion changes are static. |
| `Masonry` | Column count adapts to available width without animated reordering. Native list and focus order follow the source sequence. |
| `TruncatedText` | The visible line updates immediately and inherits Tooltip motion when the full value is revealed. |
| `Stack`, `Inline`, `Surface`, `Divider`, `Container`, `Grid`, `AspectRatio`, `Section`, `Split`, `Center`, `Fieldset`, `FormActions`, `SettingGroup` | Stable layout. Children own any appearance or interaction feedback. |
| `PageHeader`, `AppShell`, `AppTopBar` | Titles, layout and scroll position stay stable during reflow. Actions, Sidebar and Drawer own their interaction feedback. |
| `ScrollArea`, `ResizablePanels`, `Slider` | Direct pointer tracking. Only scrollbar hover paint eases. Resize, scroll and slider positions stay under the pointer. |
| `RolloutAllocation` | The shared Slider follows direct input. Both percentages update together from the accepted value. |
| `Button`, `IconButton`, `SearchTrigger`, `NotificationTrigger`, `Toggle`, `CopyButton`, `CopyableValue`, `RevealValue` | Hover paint and short press compression. Toggle holds selected paint. Copy shows its result glyph and NotificationTrigger clears its unread dot within the same bounds. RevealValue replaces the mask immediately. A Button with retain-focus loading swaps the content for a spinner. |
| `ButtonGroup`, `SplitButton`, `ToggleGroup`, `Toolbar`, `OverflowActions`, `BulkActionBar`, `Menubar` | Actions inherit Button and Menu feedback. Joined button surfaces keep their geometry. Bulk actions fade in when available. |
| `SwipeActions` | The in-row rail tracks a horizontal drag directly and settles open or closed on release. The disclosure stays anchored at the end of the row, and reduced motion updates its track immediately. |
| `HoldToConfirm` | The fill progresses inside the stationary button for the configured hold duration. The action fires on release inside after the threshold. Leaving the button or canceling clears the fill immediately. Reduced motion shows a static fill once the threshold is reached. |
| `CommandList`, `ListBox`, `Tree`, `NavigationItem`, `NavigationList`, `NavigationTree`, `NavigationGroup`, `Sidebar` | Row paint, disclosure glyphs and optional flyouts. NavigationTree fades in branch content in place and removes it immediately on collapse. Sidebar eases between expanded and rail widths and truncates its row text to keep it on one line. Its toggle shows a filled keyboard focus state, with the system outline in forced colors. Focus, route and tree reflow update immediately. |
| `NavigationMenu` | Disclosure panels open and close immediately. Escape returns focus to the trigger before the next input. |
| `Tree` row actions | IconButton and Toggle own their feedback. Keep actions in their row and preserve its geometry when visibility or lock changes. |
| `Link`, `IconLink`, `TimestampLink`, `Breadcrumb`, `Pagination`, `CursorPagination`, `SkipLink`, `Steps` | Navigation is immediate. Button-style links share control feedback. A pending cursor request uses the existing retain-focus loading button. Step rows can ease their paint. Skip links appear immediately on focus. |
| `EnvironmentSwitcher` | The trigger and Menu own press and layer feedback. The accepted environment name and scope update together as soon as the host accepts the switch. |
| `LinkPreview` | The surface inherits link and image feedback. The thumbnail frame stays in place while the image loads or falls back. |
| `ProfileLinks` | Direct links inherit button-style pointer feedback. Wrapping keeps source order and does not animate. |
| `CardDeck` | When the host accepts a card change, the content fades in at the existing anchor. Layer edges and navigation stay steady with equal-sized cards. Reduced motion changes content immediately. |
| `PublicationPreview` | The independent subscription action inherits FollowButton feedback and keeps its footprint when the host accepts a change. |
| `StarterPackPreview` | Recommendations reflow with the available width. The title link uses shared Link feedback. |
| `Citation` | The trigger keeps its place in running text. The anchored evidence panel inherits Popover motion and focus restoration. |
| `SourceList` | Evidence rows are static. Source links keep the standard link feedback. |
| `ResponseVariants` | The selected response changes immediately. Previous and next retain position within the control row and preserve focus at either endpoint. |
| `RecordNavigator` | Destination changes follow host navigation immediately. The previous and next controls inherit button or link interaction feedback. |
| `ContentAdvisory` | Reveal and conceal follow the accepted state immediately. With mediaRatio the warning and media share a frame. The button retains its location and shared action feedback. |
| `FilteredImage` | Classification preferences apply immediately. Blur keeps the image frame and Hide removes it from layout. |
| `MutedWordList` | Lists the accepted rules in place. Host actions own feedback and focus when a rule leaves the list. |
| `MutedWordForm` | Field and Select own control feedback. Pending keeps the submit action in place, with the submitted draft still visible. |
| `ContentLabelSettings` | Select owns its popup motion. Changing visibility updates the accepted value in place. |
| `ContentReportForm` | RadioCardGroup owns choice feedback. Pending retains the submit button and keeps the draft visible. |
| `LogExportForm` | Select owns choice feedback. Pending preserves the selected export settings and uses the submit button's focus-preserving loading state. |
| `EnvironmentCreationForm` | Source choices reveal inline. Pending keeps the draft readable and uses the submit button's focus-preserving loading state. |
| `DatabaseWebhookForm` | Choice and field feedback stays inline. Pending preserves the draft and keeps focus on the submit button when it initiated the request. |
| `RestartPolicyEditor` | Select and NumberInput own interaction feedback. The failure limit appears in field order when applicable and the mode control retains focus. |
| `ContentReportStatus` | Shows the reported phase and published outcome in place. The host owns announcements for live updates. |
| `ModerationNotice` | The restriction and appeal state update in place. Its action uses the host's navigation or overlay motion. |
| `AccountStanding` | The reported state and strike facts update in place. The history action inherits the host's navigation or overlay motion. |
| `ModerationAppealForm` | Pending keeps the draft and submit position stable. The host controls the transition to the accepted state. |
| `RecordRelations` | The visible record groups update immediately. Navigation and link focus use the shared Link feedback. |
| `RecordRelationForm` | Select and Combobox own popup motion. Host acceptance controls when the draft closes. |
| `RecordRelationSuggestion` | The active Button retains focus through its pending state. The host owns post-decision navigation or removal. |
| `RecordMergeReview` | The same source and destination stay visible during pending and retry. The merge button retains focus through its loading state. |
| `AdvisorFinding` | The diagnostic and severity are static. Evidence uses the shared Collapsible transition. |
| `EvidenceChecklist` | Requirement states follow host data in place. Links and permitted actions keep their shared interaction feedback. |
| `ScheduledTaskList` | The trigger remains readable as the scheduler state updates. Pause and resume inherit their host action feedback. |
| `ScheduledRunHistory` | Execution state and elapsed values update in place as the host refreshes the same run ID. |
| `ServiceAvailability` | The service strips use UptimeHistory inspection on a shared time window. Current state updates in place. |
| `AccessSummary` | Resource capabilities and scope update immediately with the latest host-supplied permissions. |
| `AccessInviteForm` | The role explanation updates with the chosen option. Select owns the popup transition, and the submit button retains focus while the host sends the invite. |
| `SharingPanel` | The scope description updates with the draft. Apply retains focus through saving and confirmation. Select and CopyButton own their interaction feedback. |
| `AccessRequestForm` | The draft stays in place while sending. When the host reports a submitted request, the form shows the outcome and moves focus there if the user was still working inside it. |
| `SpendLimitForm` | Threshold inputs retain their positions and values during saving. The primary action uses the shared focus-retaining loading state. |
| `PendingInvitationList` | Invitation state updates in place after the host accepts an action. Row controls and confirmation layers retain their own motion and focus behavior. |
| `SessionList` | Session facts update with host data. The host confirmation and its trigger inherit their existing motion. |
| `ConnectedAccountList` | Provider identities and reported states update in place. Host controls own authorization and pending feedback. |
| `ApiKeyList` | Copy feedback uses CopyButton motion. Credential state follows the host response and the host owns confirmation and focus recovery. |
| `PasskeyList` | Row actions inherit their control and dialog motion. Removal follows host confirmation and keeps focus on a stable control. |
| `KeyRotationSummary` | Key identity and retirement timing update in place. The host owns confirmation and progress feedback. |
| `EnvironmentVariableList` | Value and reference changes render immediately. Copy feedback uses CopyButton motion. The host owns management actions and their focus recovery. |
| `VariableReferencePicker` | Combobox owns popup and option motion. Only the committed reference changes the saved field value. |
| `PermissionEditor` | Draft edits use the standard Checkbox transition. Inherited and reviewed states are static. |
| `FollowButton` | The subscription action uses Button hover, press and retain-focus loading, with space reserved for all settled labels. |
| `SaveToCollection` | The accepted save label updates in place. Membership checkmarks update without closing the shared Menu. |
| `ProfileSummary` | Profile content is static. Links and independent actions keep their own interaction feedback. |
| `SaveBar` | The draft panel shows and hides with host state. The bar preserves form position in viewport placement. Saving keeps button focus and inherits the standard Spinner motion. |
| `StagedChanges` | Resource disclosures inherit Collapsible motion. A confirmed discard updates the draft through host state. |
| `EnvironmentSyncReview` | Resource groups inherit StagedChanges disclosure motion. Source and destination are steady context while the host refreshes the plan. |
| `StorageBucketPolicy` | Read access and effective limits update as the host switches buckets or refreshes policy. The scope and limit labels remain in place. |
| `TemporaryAccessLink` | Copy feedback inherits CopyButton motion; expiration changes the status and disables copying in place. |
| `ToolCall` | The status follows the host immediately. Details inherit interruptible Collapsible motion and stay open when an output arrives. |
| `ToolCallGroup` | The group and each call inherit independent disclosure motion. Stable call IDs preserve expanded details through status updates. |
| `BatchResult` | Outcome counts and affected rows reflect accepted results immediately. Retry uses Button's focus-retaining loading state. |
| `CollectionImportReview` | A new host assessment updates the counts and reasons in place. The host manages focus if confirmation becomes unavailable. |
| `AgentHandoff` | Participant names anchor the record. A new observed outcome updates in place without replaying the transfer. |
| `StepProgress` | The position track uses the shared Progress motion. The current step title and count update immediately. |
| `MilestoneProgress` | The ring uses shared determinate ProgressRing motion. Work counts and target dates update together immediately. |
| `CycleProgress` | Chart inspection uses LineChart motion. The latest totals and plotted history come from the same observations. |
| `CycleCapacity` | Meter inherits the shared fill transition. The estimate marker and exact difference update immediately when the plan changes. |
| `DomainVerification`, `ConnectionDetails` | Record, domain status and method changes render immediately. Copy controls, method selection and host actions retain their shared interaction feedback. |
| `ServiceEndpointList` | Addresses and provisioning states update with host data. Clipboard feedback uses the shared CopyButton. |
| `VolumeMountSummary` | Mount status and usage update in place. Exact path copying uses the shared clipboard feedback. |
| `ReplicationStatus` | Readouts and health labels update in place on each observed sample. Routine polling does not animate or announce each update. |
| `DeliveryAttempts` | Delivery results update in place. Response details use the shared disclosure and its reduced-motion behavior. |
| `RetrySchedule` | The retry decision updates in place when the service reports it. Timestamp owns the optional exact-time tooltip. |
| `SearchResultItem` | Matching text updates in place. The result title uses ordinary link feedback and navigation. |
| `VersionHistory` | Selection replaces the preview immediately and keeps focus in the history. A host confirmation inherits its dialog motion. |
| `Tabs`, `SegmentedControl` | Selected paint and, for line tabs, an arriving indicator. Tabs reveal the visible panel with a short fade while selection and focus update immediately. |
| `Field`, `Input`, `Textarea`, `InputGroup`, `SearchInput`, `PasswordInput`, `NumberInput`, `NumberRangeField`, `PinInput`, `DateField`, `TimeField`, `DateRangeField`, `Editable`, `CharacterCount` | Field hover paint and inherited action feedback. Typing, caret, counts, validation and edit-mode focus are immediate. |
| `MessageComposer` | The embedded editor stays transparent on hover. Its caret and the existing surface border indicate focus. Buttons inherit press feedback. Updates to the draft, attachments and the Send / Stop slot are immediate. |
| `Checkbox`, `Radio`, `Switch`, `SwitchGroup`, `CheckboxGroup`, `RadioGroup`, `CheckCard`, `RadioCard`, `CheckCardGroup`, `RadioCardGroup`, `Rating` | Check and rating marks change paint, the switch thumb travels, and selectable cards ease selected paint. Values update immediately. |
| `NotificationChannelSettings` | Switch owns thumb movement. Pausing a channel disables event rows in place and retains the supplied choices. |
| `QuietHoursEditor` | Switch, CheckboxGroup and TimePicker own their transitions. The time fields and weekday controls stay mounted when the schedule is off. |
| `RatingValue` | Fractional star paint and score update immediately as a single readout. |
| `RatingSummary`, `RatingBreakdown` | The aggregate score and counts update immediately. Bucket fills follow Meter motion. Selecting a filter changes the row fill without moving the labels or tracks. |
| `SettingRow` | The row geometry stays stable. Its trailing action owns interaction feedback. |
| `Select`, `Combobox`, `Autocomplete`, `MultiSelect`, `TreeSelect`, `DatePicker`, `DateRangePicker`, `TimePicker`, `DateTimePicker`, `DateTimeRangePicker`, `ColorPicker`, `ColorPalette` | Inherit control, active option and layer motion. Typing, range editing, swatch changes and pointer tracking are immediate. |
| `ColorFilter` | Popover owns entry and dismissal. The swatch updates in place when the host applies or clears the value. |
| `Calendar`, `RangeCalendar` | Day selection paint. Month and year changes keep the grid stable and respond immediately. |
| `FileInput`, `FileTrigger`, `Dropzone`, `FileDropTarget`, `TagInput`, `Tag`, `TagGroup`, `FilterCondition`, `FilterGroup`, `CollectionToolbar`, `CollectionViewSwitcher` | Inherit button, field and layer feedback. Drag targets, file changes, chip removal and applied filters update immediately. |
| `Collapsible`, `Accordion` | Keep the header fixed and rotate its centered mark. Panel height expands and collapses in place. Closing immediately removes the panel from keyboard and assistive navigation and restores focus where needed. Reduced motion settles immediately. |
| `AuditTimeline` | Recorded events render immediately. Each field-change panel uses the Collapsible transition and settles immediately with reduced motion. |
| `ProjectUpdate` | The published snapshot is static. Changes in the host's accepted content appear immediately. |
| `AmountBreakdown` | Accepted amounts update immediately on a shared end axis. |
| `CurrencyConversion` | Reported amounts, phase and rates update together in place without counting animation. |
| `ExpenseSettlement` | The amount and direction stay readable while payment status updates in place. |
| `BillPaymentSchedule` | Accepted payment dates, statuses and balances update in place. Links retain native focus feedback. |
| `TemporarySpendLimit` | The host's status, accepted amount and reset time update together without animated counting. |
| `RefundLinkSummary` | The accepted purchase and this refund update in place. The host owns focus when its link editor closes. |
| `ExpenseAllocationForm` | Totals and balance update in place. MoneyField owns editable draft feedback. |
| `ExpenseAllocationReview` | The total and the reconciliation message update together while recorded lines keep their order. |
| `ServiceIncident` | The current phase and dated updates are static. Host updates change the published record in place. |
| `MaintenanceWindow` | The published interval and phase update in place; elapsed time does not animate or advance the host-supplied phase. |
| `ProjectHealth` | Report status and date update together. The existing timestamp link supplies interaction feedback. |
| `PipelineRun` | Status and duration update in their existing rows as the host supplies results. Stage diagnostics use the shared Collapsible motion. |
| `CheckRunList` | The reported result and blocking label update in place. Evidence links use native navigation. |
| `EvaluationResult` | The verdict, output and supporting checks update together from the accepted result. No comparison animation changes their reading order. |
| `ColorContrast` | The specimen and measured ratio update together immediately, without blending intermediate colors. |
| `DeploymentHistory` | Status and revision update in place. Host actions inherit the motion of the control or overlay that owns them. |
| `ReleaseTargetMatrix` | Rollout and live version update independently in each target row. Keep the target order stable through status refreshes. |
| `DeploymentHandoff` | Both releases keep their order while status changes. An expected end is a timestamp supplied by the host. |
| `ReplicaAllocation` | NumberInput owns step feedback. Accepted draft counts and the total update in place. |
| `DatabaseSessionList` | Session statuses update in place. A blocker link moves directly to its authorized destination. |
| `IndexRecommendation` | CopyButton owns feedback without moving the SQL or cost estimates. |
| `DeploymentHealthCheck` | The latest probe updates in place. The progress bar shows elapsed time while checking and yields to the final result when the host decides it. |
| `ServiceRuntimeStatus` | The reported phase and startup timing update in place. Measurements remain readable without animated counting. |
| `DeploymentRollbackDialog` | Inherits the AlertDialog entrance and exit. Current and target deployment details stay in place during review. |
| `CodeSnippet`, `Card`, `DataList`, `DataListItem`, `FileItem`, `FileList`, `FileCard`, `FileCardGrid`, `FileThumbnail`, `AvatarGroup` | Embedded actions and avatars own motion. AvatarGroup inherits Popover motion in its interactive overflow mode. Selectable cards and list rows use Checkbox feedback and change their fill with stable geometry. FileThumbnail reserves the frame during loading and fallback. FileCardGrid adjusts its tracks immediately and inherits Skeleton motion in loading cards. |
| `CodeBlock` | Source stays in place during clipboard feedback. The copy action uses CopyButton timing. |
| `FileName` | A clipped name discloses the full value with Tooltip motion. The displayed prefix and extension follow the available width immediately. |
| `FilePath` | Directory and name clipping follow the available width immediately. The full path inherits Tooltip motion. |
| `ChangedFileList` | The active file and review state update in place. FilePath owns disclosure, and Checkbox owns review feedback. |
| `AuthorMeta`, `MetadataList`, `Comment`, `CommentThread`, `ExpandableText` | Attribution, supporting facts and message layout stay static. Comment actions may fade in on hover or keyboard focus. The action itself owns copy or other command feedback. ExpandableText reveals the passage immediately and keeps focus on the same toggle. |
| `ReviewThread` | The accepted state and optional resolution update in place. The resolve action keeps focus and its label space while pending. |
| `ReactionButton` | Inherits Toggle press and selected feedback. The host supplies the accepted count and pressed state together. |
| `ReactionPicker` | Uses Popover entry and exit with an anchored trigger. Selecting a reaction closes the chooser and restores focus. |
| `NotificationInbox`, `NotificationList`, `NotificationItem` | Keep the unread marker track fixed. Read commands use existing button feedback. Changes to the filtered list render immediately and recover focus when a focused row leaves. |
| `CommentComposer` | Inherits MessageComposer interaction feedback. Context and action tracks stay stable while editing. |
| `Badge`, `CountBadge`, `DescriptionList`, `ValueChange`, `ChangeList`, `Table`, `ComparisonTable`, `Image`, `List`, `Figure`, `Metric`, `MetricDelta`, `MetricGroup`, `Timeline`, `ActivityTimeline`, `ColorSwatch`, `FileMeta` | Changes to data, labels and supporting media render immediately. Metric and MetricGroup use the standard Skeleton pulse for pending values and respect reduced motion. |
| `MigrationHistory` | Recorded and unavailable history states update in place. ComparisonTable owns horizontal scrolling and the pinned migration column. |
| `TextRevision` | The document updates as soon as the host accepts or rejects the revision. Marking or jumping to a fragment does not animate neighboring words. |
| `ChangeRegion` | Marking a block or setting it active updates its leading marker immediately. Text position stays stable. |
| `TextAnnotation` | Inline marking and resolution update immediately without moving text. Links use native fragment navigation. |
| `ImageAnnotations` | Point centers follow the artwork geometry. A selection changes the pressed appearance without moving the target or delaying host feedback. |
| `ImageFocalPoint` | Update the point and cover previews immediately during editing. Keep the source image and controls in place. |
| `Mention` | Account references remain in the text flow. Links inherit the shared link focus and navigation behavior. |
| `ReplyReference` | Published reply context appears with its message. The source link uses native navigation and clipped excerpts inherit Tooltip motion. |
| `ThreadTrigger` | Reply metadata updates in place. The trigger uses Button feedback and the host panel owns opening and closing motion. |
| `QuotedPost` | The quoted content and its availability state render immediately. The original link and any media keep their own interaction behavior in both appearances. |
| `UnreadMarker` | The unread boundary follows the accepted read position without animated movement or a live announcement. |
| `FeedUpdate` | Enters above a stable viewport with a short fade and offset. Reduced motion skips the entrance. Pending retains button focus. The host owns content insertion, scrolling and focus after activation. |
| `FeedAttribution` | Context renders with the entry. The optional link uses native navigation with the shared focus treatment. |
| `MediaCredit` | Known attribution updates in place. Source links use the shared link focus and navigation behavior. |
| `GenerationPreview` | The media frame keeps its aspect ratio as the host supplies partial and final results. The generating placeholder uses Skeleton motion. Final and unsuccessful results render immediately. |
| `TypingIndicator` | Decorative dots pulse briefly and settle without changing the composer position. Reduced motion shows static dots. |
| `MessageReceipt` | The label and glyph change immediately when the host confirms a new state. |
| `ParticipantPopover`, `GroupReadReceipt` | The roster uses Popover opening and dismissal motion. Roster updates keep the existing opener and scroll owner while the opener is available. |
| `CollaboratorPresence` | The roster reuses Popover motion. Connection and activity changes update in place without reopening the roster. |
| `IdentityVerificationBadge` | Popover owns opening, dismissal, and focus return. Host evidence changes update the issuer list. |
| `NotificationSubscription` | Menu owns the open and close motion. The accepted mode changes in place with a stable opener width. |
| `SnoozeMenu` | Menu owns the open and close motion. The opener reserves its label track across accepted snooze states. |
| `EstimateMenu` | Menu owns the open and close motion and restores trigger focus. The accepted estimate updates when the host commits it. |
| `ReminderControl` | Menu owns disclosure motion. An accepted schedule updates the label and time in place, with the opener retained for focus restoration. |
| `ReplyAudience` | Menu owns the open and close motion. The accepted policy updates in place while the draft and submission track remain stable. |
| `HttpMethod`, `EndpointLabel`, `HttpStatus` | Request labels and numeric outcomes update immediately. Truncated paths inherit Tooltip motion when inspected. |
| `HttpRequestRow` | Outcome and elapsed time follow the latest host entry. Path disclosure and row actions keep their existing Tooltip and control motion. |
| `HttpExchangeDetails` | The endpoint stays in place while switching sides. Panels use shared Tabs focus and motion, and the host may retain the selected side across request updates. |
| `RowChangeDetails` | The event identity stays in place while shared Tabs switch snapshots. The snapshot tree uses JsonInspector feedback. |
| `GitRef` | Reference identifiers update immediately. Clipped values inherit Tooltip motion when inspected. |
| `ReviewRevision` | Review state and identifiers update when the host accepts a revision change. GitRef owns clipped values and the comparison link uses native navigation. |
| `DataFreshness` | Update state changes in place. The accepted timestamp stays visible during refresh and failure. Timestamp owns the optional exact-time tooltip. |
| `CommitList` | Commit history updates immediately. Clipboard feedback inherits CopyButton motion without changing the action's width. |
| `Sparkline`, `MetricCard` | Hover briefly strengthens the Sparkline's latest point and area. MetricCard leaves the value and surface static. Data changes render immediately. |
| `ImageComparison` | The divider follows mouse and keyboard input immediately. Touch waits for a tap or a horizontal gesture, so vertical scrolling preserves the split. The frame and images stay in place. |
| `LineChart` | Crosshair, markers and local line emphasis track the pointer continuously. The readout shows the nearest recorded sample and lifts clear of the marker near the trailing edge. On exit the readout and marks fade in place from their last pointer position. |
| `BarList` | Uses Meter's value transition and the same fast highlight as chart inspection. Labels and values update immediately. |
| `BarChart` | Uses the fast motion role to emphasize the inspected group while its neighbors dim. The readout updates with the active category and column geometry stays fixed. |
| `DonutChart` | Uses the fast motion role for the inspected segment's outline. Category colors, fills and geometry stay fixed, and the center readout updates immediately. |
| `CompositionBar` | Segments and readouts update together. The category order and bar height stay stable as amounts change. |
| `NoResults` | The message follows the result set immediately. A reset restores results without animating the table or moving the persistent search controls. |
| `Heatmap` | Moves the value tooltip immediately to the inspected cell and keeps the matrix fixed. Visual gutters share the adjacent cells' hit areas. |
| `UptimeHistory` | Inspection moves directly to the selected period, including across gaps. The tooltip overlays the strip without moving the plot or endpoint labels. |
| `ShortcutReference` | Search narrows results immediately while focus stays in the search input. Keycaps are static. |
| `ShortcutRecorder` | Uses Popover motion. The candidate updates immediately inside a reserved readout, and Escape discards it. |
| `TableOfContents` | The current marker follows the reading position without moving links. Fragment navigation follows the host's scroll behavior. |
| `DiffStat` | Update exact counts and their optional proportion together, immediately when the active patch changes. |
| `ScatterChart` | Highlights the inspected observation and presents its coordinates. Points keep their positions. |
| `RangeChart` | Highlights the inspected interval while its exact bounds update immediately. |
| `BulletChart`, `CapacityMeter` | Use the Meter transition for the fill. The target mark and exact readouts update immediately. A CapacityMeter fill stops at its limit. |
| `UsageLimit` | Inherits Meter fill motion and reduced-motion behavior. The actual amount and policy text update immediately, including usage beyond the displayed range. |
| `ContextWindowMeter` | Inherits Meter fill and Collapsible disclosure motion. Recorded usage and the compaction state update immediately. |
| `TokenUsageBreakdown` | Reported counts update in place with tabular figures. Unknown usage has its own text state. |
| `UsageForecast` | Recorded usage, the projected extension, the boundary and the exact labels update together so the segments stay joined. |
| `WaterfallChart` | Highlights the inspected step and shows the change and running balance. |
| `Histogram` | Shows exact bin bounds and count as inspection moves. Bin geometry stays fixed. |
| `BoxPlot` | Highlights the inspected distribution and anchors its summary to the median. The tooltip prefers the right side and flips when space runs out. |
| `DumbbellChart` | Highlights the inspected comparison without moving its marks. The readout updates immediately. |
| `Avatar`, `AvatarPicker` | Loaded image eases in within a fixed frame. Fallback text is immediately available. The picker inherits button feedback and the host owns its busy state. |
| `DataTable` | Selected row paint, chevron rotation and a short height transition for row details. Sorting, pagination and column resize update geometry immediately. |
| `EditableGrid` | Range selection transitions the cell background. Focus and entry into edit mode are immediate. The edit field takes the cell's existing space so neighboring cells hold still. |
| `ImportColumnMapping` | Source examples and rows stay in place as an assignment changes. The destination control inherits Select motion. |
| `ReorderList` | The candidate row tint follows the target. The insertion mark and focus update immediately. Rows change order only when the host accepts the move. |
| `KanbanBoard` | The in-column insertion mark follows the target. Keep the source slot and surrounding tracks stable while the card is picked up. Move the card after the host accepts the drop. |
| `TimeZoneSelect`, `RecurrenceEditor` | Inherit transitions from Combobox, Select and DatePicker. An offset update, active recurrence fields and the schedule summary render immediately. |
| `CronScheduleField` | The active validation and upcoming runs update in place. Input retains focus when results arrive. |
| `HandleField` | Availability feedback updates beside the field without moving input focus. |
| `ContentLanguagePicker` | MultiSelect owns the popup, keyboard focus and tag overflow. The accepted tag changes immediately without replacing the input. |
| `ModelPicker` | Combobox owns popup and search feedback. The accepted model label updates on selection and remains visible while results reload. |
| `TemplatePicker` | Combobox owns popup and search feedback. The preview changes with the proposed template. The apply action retains its place and focus while the host applies it. |
| `MeetingAvailability` | Local times and host-supplied availability update immediately. Participant rows stay keyed by attendee across slot changes. |
| `Tooltip`, `Popover`, `HelpTip`, `Menu`, `ContextMenu`, `HoverCard`, `CommandPalette`, `Dialog`, `AlertDialog`, `Drawer`, `Sheet`, `ImagePreview`, `ImageGallery` | Anchored entrances follow placement. Modal and edge panels have their own timing. Sheet uses the bottom Drawer entrance. Gallery image changes replace the frame content immediately and keep navigation stable. |
| `ImageMosaic` | Tile feedback uses Button timing. Frame geometry stays fixed during loading and uses ImageGallery for inspection and dismissal. |
| `AltTextDisclosure` | Opens and closes with Dialog behavior. Long descriptions scroll within the panel and dismissal returns focus to the ALT action. |
| `ImageAltTextEditor` | The bounded preview stays in place as the field edits or grows. Limit feedback updates in place. |
| `ThumbnailStrip` | Selection updates in place. The strip reveals the selected tile while keyboard focus stays where the user moved it. |
| `ZoomControl` | The percentage updates in a stable track. The host controls movement of the scaled content and its scroll anchor. |
| `ImageMeta` | Pixel dimensions, format and file size update in place with the selected asset. |
| `RecoveryWindow` | Bounds and the candidate marker update immediately. The marker is absent outside the interval, so no animated position implies a valid candidate. |
| `BackupPicker` | Choices use the radio card states. Choosing a backup changes the draft selection immediately while the host owns restoration. |
| `PaymentMethodPicker` | RadioCardGroup owns focus and selection transitions. Updated quotes and restrictions render immediately on the existing choices. |
| `BackupRestoreDialog` | Uses confirmation dialog motion. Cancellation restores trigger focus and the host reports restore progress or failure. |
| `DeploymentRegionPicker` | Draft selection uses the radio card feedback immediately. The current-region label follows the accepted deployment state supplied by the host. |
| `CollectionCover`, `CollectionCard` | Cover geometry stays fixed across artwork counts and failed loads. Native navigation is immediate and embedded actions use their own feedback. |
| `DocumentPreview` | Uses the Dialog entrance and reduced-motion behavior. Accepted page changes replace page content immediately and reset the inner scroll position while the navigation stays in place. |
| `MoneyField`, `UnitNumberField` | Editing and form state are immediate. The underlying text field and unit selector own focus and option feedback. |
| `KeyValueRow`, `KeyValueEditor` | Rows update immediately after the host accepts an edit. Adding or removing a row transfers focus to a useful field. Inputs, switch and actions own interaction feedback. |
| `DeadlineStatus` | The supplied clock determines the next state. Time and status update in place without a countdown animation. |
| `ServiceLevelTargets` | Active deadlines share the host clock. Accepted outcomes stay static until the host updates the record. |
| `DeprecationNotice` | The host's published retirement state and cutoff appear immediately. |
| `IncompleteResponseNotice` | The notice appears beside the existing response when the host accepts a terminal incomplete state. Recovery inherits the action’s own motion. |
| `RelativeTimeRangePicker` | The chosen panel and its accepted values update immediately. Toggle and picker feedback use their original motion. |
| `JsonInspector`, `CodeDiff` | Branch selection, paths, line layout and folded context update immediately. Embedded actions retain their own feedback and the focused context control stays reachable. |
| `LogRow`, `LogViewer` | Entries append immediately. Following keeps the latest entry in view. Paused inspection holds scroll position as more entries arrive. Find scrolls only the log viewport and keeps the query field focused. |
| `LiveFollowControl` | The action stays mounted as its label and status change. The host owns viewport movement on resume and preserves reading position while paused. |
| `LogContext` | The selected event opens in view. Prepending earlier entries compensates the inner scroll position immediately. Boundary actions retain focus when loading or reaching the end. |
| `SuggestionTextarea` | The suggestion panel tracks the caret and inherits layer and option paint. Selecting a suggestion replaces the active text range and restores the caret immediately. |
| `QueryInput` | Shares the caret layer with SuggestionTextarea. Completions and token removals keep the draft and focus in context. |
| `VisualSearchForm` | SearchInput and Button own control feedback. Removing a reference returns focus to the query text. |
| `MediaTranscript` | Playback cues change their active paint immediately. The bounded transcript viewport follows playback only while following is enabled. |
| `MediaSeekBar` | The playhead follows accepted time immediately. Download progress updates the rail segments in place, preserving the playhead and keyboard focus. |
| `MediaChapterList` | The active chapter follows the accepted playhead immediately. Rows and focus stay in place when playback crosses a chapter boundary. |
| `MediaTrimRange` | The handle and retained interval follow pointer and keyboard edits immediately. The source waveform and time axis stay fixed. |
| `StackFrame`, `StackTrace` | Source context disclosure changes in place. The chevron rotates using the fast role and settles immediately under reduced motion. |
| `DependencyGraph` | The graph and its list presentation update immediately and keep the active node. Connections follow settled node geometry without a layout transition. |
| `DependencySchedule` | The dates and conflict result update together in place when the host reschedules either project. |
| `FindBar` | Match position and validation update immediately while the query field keeps focus. Buttons and option toggles retain their shared feedback. |
| `SpanRow`, `TraceWaterfall` | Bounds, interval marks and branch visibility update immediately. All visible spans use the same domain, including when descendant branches are closed. Span zoom keeps the rows in place and resets to the base domain. |
| `QueryPlan` | Inspection changes immediately when an operation is selected. Tree owns disclosure and keyboard focus. |
| `GradientEditor` | Color and position update the sample immediately. Stop selection and opacity inherit the color, toggle and field interactions. |
| `Spinner`, `Skeleton`, `ListSkeleton`, `NotificationListSkeleton`, `CardSkeleton`, `FileCardSkeleton`, `FileListSkeleton`, `TableSkeleton`, `Progress`, `ProgressRing`, `Meter`, `ToastRegion`, `UploadItem`, `UploadList`, `UploadQueue` | Busy indicators and value fill. ProgressRing interpolates the arc for a known amount, rotates a short arc for an unknown amount, and keeps that arc still under reduced motion. List, card and table placeholders inherit Skeleton motion. A floating toast enters as a card from its placement edge; an inline toast fades in place. Upload compositions inherit the progress and action recipes. Announcements and final values are immediate. |
| `Alert`, `EmptyState`, `ErrorState`, `LoadingState`, `StatusIndicator`, `PriorityIndicator`, `SaveStatus`, `ErrorSummary` | State and message changes are immediate. LoadingState and SaveStatus inherit Spinner motion. Embedded actions keep Button feedback. |
| `ApprovalRequest` | Choice, validation and accepted outcome update immediately. The submit control inherits Button feedback and reserves its label area while pending. |
| `ApprovalChain` | Route statuses, approval counts and reviewer details update in place when the host accepts a decision. No staged entry animation. |
| `PolicyEvaluation` | The reported outcome and rule evidence update together. Check states render immediately. |
| `ReceiptMatchReview` | The reported outcome and evidence update together in place. |
| `RestrictionSummary` | Restrictions update as one read-only group. Tags wrap with labels and stay in document order. |
| `NetworkAllowlist` | The host's network mode and ranges render together. Copy feedback uses the existing CopyButton without moving the range. |
| `CidrField` | Uses Field and Input feedback. A format error appears after validation and clears when the draft is corrected. The text caret remains in the native input. |
| `FieldChecklist`, `PasswordStrength` | Requirement marks and labels update immediately. A password assessment uses Meter's fill transition and motion preference. |

Menu, ContextMenu and title-only navigation flyouts fade in and out where
discrete top-layer transitions are supported. Dismissal releases focus and
pointer interaction immediately. When a sibling navigation flyout takes over
the same rail position, the outgoing panel yields immediately.
