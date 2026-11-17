"use client";

import {
  forwardRef,
  createElement,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type FormHTMLAttributes,
  type TimeHTMLAttributes,
  type SelectHTMLAttributes,
  type AnchorHTMLAttributes,
  type ReactNode,
  type HTMLAttributes,
  type CSSProperties,
  type LabelHTMLAttributes,
  type FieldsetHTMLAttributes,
  type RefCallback,
  type RefObject,
  type Ref,
  type MouseEvent as ReactMouseEvent,
  type TableHTMLAttributes,
  type OlHTMLAttributes,
  type ImgHTMLAttributes,
  type BlockquoteHTMLAttributes,
} from "react";
import { useFocusableHidden } from "./focusable-hidden.js";
import { cidrPattern } from "./cidr-pattern.js";
import { EventTimestamp, parseInstant } from "./timestamp.js";
import { parseDate } from "./date-value.js";
import { DueStatus } from "./deadline-status.js";
import { MilestoneWorkSummary } from "./milestone-progress.js";
import { DomainVerificationPanel } from "./domain-verification.js";
import { ConnectionDetailsPanel } from "./connection-details.js";
import { TimeRangeEditor } from "./relative-time-range-picker.js";
import { ContextualLogWindow, StreamLogRow, StreamLogViewer } from "./log-viewer.js";
import { literalMatchPattern } from "./literal-match.js";
import { TimingSpanRow, TimingWaterfall } from "./trace-waterfall.js";
import { NamedTimeZoneSelect } from "./time-zone-select.js";
import { RepeatSchedule } from "./recurrence-editor.js";
import { parseTime } from "./time-value.js";
import { PredicateRow } from "./filter-condition.js";
import { PredicateGroup } from "./filter-group.js";
import { CollectionQueryBar } from "./collection-toolbar.js";
import { CollectionViewSelector } from "./collection-view-switcher.js";
import { EnvironmentSelector } from "./environment-switcher.js";
import { ResourceLinkPreview } from "./link-preview.js";
import { InlineCitation } from "./citation.js";
import { WarnedContent } from "./content-advisory.js";
import { ApprovalDecisionForm } from "./approval-request.js";
import { WorkspaceSidebar } from "./sidebar.js";
import { NavigationRow } from "./navigation-item.js";
import { NavigationSection } from "./navigation-group.js";
import { InboxContent } from "./notification-inbox.js";
import { UploadQueueContent } from "./upload-queue.js";
import { SearchGlyph } from "./search-glyph.js";
import { resolveFieldStatus, hasFieldContent, mergeDescriptions } from "./field-state.js";
import { SingleSelect } from "./select.js";
import { MixedCheckbox } from "./checkbox.js";
import { OverlayScrollArea } from "./scroll-area.js";
import { ChoiceGroup } from "./choice-group.js";
import { Disclosure } from "./disclosure.js";
import { AnchoredOverlay, ModalOverlay } from "./overlays.js";
import { TabNavigation, BreadcrumbNavigation, PageNavigation, CursorPageNavigation, PageArrow } from "./navigation.js";
import { AvatarArtwork } from "./avatar.js";
import { ValueIndicator, FeedbackMessage, StatusGlyph } from "./feedback.js";
import { DescribedData, TabularData } from "./data-display.js";
import { SheetGrid } from "./editable-grid.js";
import { CollectionReorderList } from "./reorder-list.js";
import { KanbanCollection } from "./kanban-board.js";
import { ActionMenu } from "./menu.js";
import { RovingToolbar } from "./toolbar.js";
import { ComposerForm } from "./message-composer.js";
import { NumericStepper } from "./numeric-input.js";
import { createMoneyFormat, MoneyEditor } from "./money-field.js";
import { PairEditor, PairRow } from "./key-value-editor.js";
import { StructuredJsonInspector } from "./json-inspector.js";
import { UnitNumberEditor } from "./unit-number-field.js";
import { SourceCodeDiff } from "./code-diff.js";
import { mediaTimeLabel, SynchronizedTranscript } from "./media-transcript.js";
import { GradientControl } from "./gradient-editor.js";
import { TraceFrame, TraceList } from "./stack-trace.js";
import { WorkflowDependencies } from "./dependency-graph.js";
import { RelatedRecords } from "./record-relations.js";
import { AccessSummaryPanel } from "./access-summary.js";
import { AccountSessionList } from "./session-list.js";
import { BatchResultPanel } from "./batch-result.js";
import { VersionHistoryPanel } from "./version-history.js";
import { ExecutionStages } from "./pipeline-run.js";
import { DeliveryAttemptList } from "./delivery-attempts.js";
import { SearchCommands } from "./find-bar.js";
import { CaretSuggestionEditor } from "./suggestion-textarea.js";
import { StructuredQueryInput } from "./query-input.js";
import { RangeControl } from "./slider.js";
import {GroupedAvatars, NamedStatus, CaptionedFigure, AttributedQuote, InlineCodeText, MeasuredValue, EventTimeline, ExpandableParagraph, OverflowingText} from "./content-elements.js";
import { NavigationMenu, StepSequence, ContentSection, PageHeading, SplitLayout, CenterLayout, SkipNavigation } from "./navigation-layout.js";
import { ApplicationShell, ApplicationTopBar } from "./app-shell.js";
import { CollectionListBox, SegmentedPinInput, RatingStar, StarRating, FileDropzone, OwnedFileDropTarget, SupportingCharacterCount } from "./form-controls.js";
import { ClipboardAction, NotificationRegion } from "./feedback-actions.js";
import { ConfirmationDialog } from "./alert-dialog.js";
import { HoldConfirmation } from "./hold-to-confirm.js";
import { FilePicker } from "./file-input.js";
import { SearchField, PasswordField, VisibilityGlyph } from "./text-inputs.js";
import { SearchSelection } from "./combobox.js";
import { FreeTagEntry } from "./tag-input.js";
import { TagList } from "./tag-group.js";
import { InlineEditable } from "./editable.js";
import { SearchCommandList } from "./command-list.js";
import { SegmentedDateField } from "./date-field.js";
import { SegmentedTimeField } from "./time-field.js";
import { DateCalendar } from "./calendar.js";
import { CalendarDatePicker } from "./date-picker.js";
import { ValidationErrorSummary } from "./error-summary.js";
import { ResizablePaneGroup } from "./resizable-panels.js";
import { DateRangeCalendar } from "./range-calendar.js";
import { PairedDateRangeField } from "./date-range-field.js";
import { CalendarDateRangePicker } from "./date-range-picker.js";
import { ContextActionMenu } from "./context-menu.js";
import { SelectionTree } from "./tree.js";
import { ClockTimePicker } from "./time-picker.js";
import { CivilDateTimeRangePicker } from "./date-time-range-picker.js";
import { FileRecord, FileGalleryCard, FileThumbnailSurface, FileNameText, FilePathText, UploadRecord, ModalImagePreview, ModalImageGallery, ImageThumbnailStrip, FileMetadata } from "./file-records.js";
import { ImageMosaicContent } from "./image-mosaic.js";
import { ModalDocumentPreview } from "./document-preview.js";
import { ManagedDataTable } from "./data-table.js";
import { SkeletonTable } from "./table-skeleton.js";
import { TrendPlot } from "./sparkline.js";
import { SeriesPlot, GroupedBars, RankedBars, ShareRing, ShareBar, HeatmapGrid } from "./charts.js";
import { UptimeHistoryStrip } from "./uptime-history.js";
import { ShortcutReferencePanel } from "./shortcut-reference.js";
import { ShortcutCapture } from "./shortcut-recorder.js";
import { PageOutline } from "./table-of-contents.js";
import { ScatterPlot } from "./scatter-chart.js";
import { RangePlot } from "./range-chart.js";
import { DumbbellPlot } from "./dumbbell-chart.js";
import { DistributionBoxes } from "./box-plot.js";
import { BulletPlot } from "./bullet-chart.js";
import { HistogramPlot } from "./histogram.js";
import { WaterfallPlot } from "./waterfall-chart.js";
import { CheckableCard, ExclusiveCard } from "./collection-cards.js";
import { ColorPreview, ColorEditor, PaletteChoices, normalizeHexColor } from "./color-controls.js";
import { HoverPreview } from "./hover-card.js";
import { HierarchicalSelect } from "./tree-select.js";
import { CivilDateTimePicker } from "./date-time-picker.js";
import { HierarchicalNavigation } from "./navigation-tree.js";
import { AdaptiveActions } from "./overflow-actions.js";
import { SwipeActionsRow } from "./swipe-actions.js";
import { SelectionActionBar } from "./bulk-action-bar.js";
import { ApplicationMenubar } from "./menubar.js";

export interface OverflowAction extends MenuActionItem {
  /** Higher priority actions remain visible longer; source order stays unchanged. */
  priority?: number;
}
export interface OverflowActionsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onAction"> {
  label: string;
  items: readonly OverflowAction[];
  onAction?: (id: string) => void;
  moreLabel?: string;
  /** Auto uses the icon when it preserves more visible commands. The trigger always retains moreLabel. */
  morePresentation?: "label" | "icon" | "auto";
  size?: "sm" | "md" | "lg" | "xl";
  variant?: ButtonProps["variant"];
  shape?: ToolbarProps["shape"];
  containerVariant?: ToolbarProps["variant"];
  disabled?: boolean;
  /** Optional fixed content measured before command space is allocated. */
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Upper bound for visible commands; additional commands remain in More. */
  maxVisibleActions?: number;
}
/** Priority-based overflow composed from Toolbar, Button and Menu. @since 0.2.11 */
export const OverflowActions = /* @__PURE__ */ forwardRef<HTMLDivElement, OverflowActionsProps>(function OverflowActions(props, ref) { return <AdaptiveActions {...props} ref={ref}/>; });
export interface FilterConditionValue {
  property: string;
  operator: "is" | "is-not";
  values: string[];
}
export interface FilterConditionProperty {
  id: string;
  label: string;
  options: readonly ComboboxOption[];
  disabled?: boolean;
}
export interface FilterConditionProps extends Omit<FieldsetProps, "children" | "legend" | "onChange"> {
  mode?: "choice";
  label: string;
  properties: readonly FilterConditionProperty[];
  value: FilterConditionValue;
  onValueChange: (value: FilterConditionValue) => void;
  onRemove?: () => void;
  controlSize?: "sm" | "md" | "lg" | "xl";
  labels?: Partial<Record<"property" | "operator" | "values" | "include" | "exclude" | "placeholder" | "remove", string>>;
}
/** One choice or typed filter predicate; the host owns query semantics. @since 0.2.11 */
export const FilterCondition = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, FilterConditionProps | TypedFilterConditionProps>(function FilterCondition(props, ref) { return <PredicateRow {...props} ref={ref}/>; });

export type TypedFilterOperand =
  | { kind: "choice"; operator: "is" | "is-not"; values: string[] }
  | { kind: "text"; operator: "contains" | "equals" | "starts-with"; text: string }
  | { kind: "number"; operator: "equals" | "at-least" | "at-most"; number: number | null }
  | { kind: "date"; operator: "equals" | "before" | "after"; date: string };
export type TypedFilterConditionValue = TypedFilterOperand & { property: string };
export type TypedFilterConditionProperty =
  | (FilterConditionProperty & { kind: "choice" })
  | { id: string; label: string; kind: "text" | "number" | "date"; disabled?: boolean };
export interface TypedFilterConditionProps extends Omit<FilterConditionProps, "mode" | "properties" | "value" | "onValueChange"> {
  mode: "typed";
  properties: readonly TypedFilterConditionProperty[];
  value: TypedFilterConditionValue;
  onValueChange: (value: TypedFilterConditionValue) => void;
  /** Localize operators that belong to scalar operands. */
  operatorLabels?: Partial<Record<Exclude<TypedFilterOperand["operator"], "is" | "is-not">, string>>;
  /** Locale used by the date operand's calendar. */
  locale?: string;
}

export interface FilterGroupCondition extends FilterConditionValue { id: string; }
export interface FilterGroupValue {
  match: "all" | "any";
  conditions: FilterGroupCondition[];
}
export interface FilterGroupProps extends Omit<FieldsetProps, "children" | "legend" | "onChange"> {
  mode?: "choice";
  label: string;
  properties: readonly FilterConditionProperty[];
  value: FilterGroupValue;
  onValueChange: (value: FilterGroupValue) => void;
  controlSize?: "sm" | "md" | "lg" | "xl";
  allowDuplicateProperties?: boolean;
  maxConditions?: number;
  labels?: Partial<Record<"match" | "all" | "any" | "add" | "condition", string>>;
  conditionLabels?: FilterConditionProps["labels"];
}
export type TypedFilterGroupCondition = TypedFilterConditionValue & { id: string };
export interface TypedFilterGroupValue {
  match: FilterGroupValue["match"];
  conditions: TypedFilterGroupCondition[];
}
export interface TypedFilterGroupProps extends Omit<FilterGroupProps, "mode" | "properties" | "value" | "onValueChange"> {
  mode: "typed";
  properties: TypedFilterConditionProps["properties"];
  value: TypedFilterGroupValue;
  onValueChange: (value: TypedFilterGroupValue) => void;
  operatorLabels?: TypedFilterConditionProps["operatorLabels"];
  locale?: TypedFilterConditionProps["locale"];
}
/** A flat controlled group of predicates; the host owns when to apply them. @since 0.2.11 */
export const FilterGroup = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, FilterGroupProps | TypedFilterGroupProps>(function FilterGroup(props, ref) { return <PredicateGroup {...props} ref={ref}/>; });

export interface CollectionFilterSummary {
  id: string;
  label: string;
  removeLabel?: string;
  disabled?: boolean;
}
export interface CollectionToolbarProps extends Omit<FieldsetProps, "children" | "legend" | "onChange"> {
  label: string;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  searchLabel?: string;
  searchPlaceholder?: string;
  clearSearchLabel?: string;
  appliedFilters?: readonly CollectionFilterSummary[];
  onRemoveFilter?: (id: string) => void;
  appliedFiltersLabel?: string;
  /** Controls how many accepted filters are displayed before the count disclosure. */
  appliedFilterDisplay?: Pick<TagGroupProps, "maxVisibleTags" | "moreTagsLabel" | "fewerTagsLabel">;
  summaryPrefix?: ReactNode;
  /** Keep query controls together, split search from trailing filters, or align the whole group to the end. */
  align?: "stretch" | "split" | "end";
  /** At most two task-important quick filters; move additional properties into filterContent. */
  quickFilters?: ReactNode;
  /** Additional commands beside Filters in the same tool row. */
  actions?: ReactNode;
  filterContent?: ReactNode;
  filtersLabel?: string;
  filterTitle?: string;
  filtersOpen?: boolean;
  onFiltersOpenChange?: (open: boolean) => void;
  filterPanelRef?: Ref<HTMLDivElement>;
  filterPanelClassName?: string;
  onClear?: () => void;
  canClear?: boolean;
  clearLabel?: string;
  controlSize?: "sm" | "md" | "lg" | "xl";
}
/** Search, accepted summaries and staged filter disclosure; saved views and query semantics stay host-owned. @since 0.2.11 */
export const CollectionToolbar = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, CollectionToolbarProps>(function CollectionToolbar(props, ref) { return <CollectionQueryBar {...props} ref={ref}/>; });

export interface CollectionViewOption {
  id:string;
  name:string;
  disabled?:boolean;
}
export interface CollectionViewSwitcherProps extends Omit<HTMLAttributes<HTMLDivElement>,"children"|"onChange"> {
  label:string;
  views:readonly CollectionViewOption[];
  value:string;
  onValueChange:(id:string)=>void;
  actions?:readonly OverflowAction[];
  onAction?:(id:string)=>void;
  actionsLabel?:string;
  moreLabel?:string;
  controlSize?:"sm"|"md"|"lg"|"xl";
  disabled?:boolean;
  /** Focus target for host-owned naming/deletion dialogs. */
  selectRef?:Ref<HTMLSelectElement>;
}
/** Controlled saved/preset view choice with optional adaptive commands. @since 0.2.11 */
export const CollectionViewSwitcher = /* @__PURE__ */ forwardRef<HTMLDivElement,CollectionViewSwitcherProps>(function CollectionViewSwitcher(props,ref){return <CollectionViewSelector {...props} ref={ref}/>;});

export interface EnvironmentOption {
  id: string;
  label: string;
  icon?: ReactNode;
  /** A named scope such as Production or Preview. Supply it when the name alone is ambiguous. */
  scope?: {label: string; tone?: BadgeTone};
  disabled?: boolean;
}

export interface EnvironmentSwitcherProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange" | "aria-label"> {
  label: string;
  environments: readonly EnvironmentOption[];
  /** The accepted environment ID. The host owns navigation and acceptance. */
  value?: string;
  onValueChange: (id: string) => void;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  variant?: "outline" | "ghost";
  disabled?: boolean;
}

/** @since 0.2.14 */
export const EnvironmentSwitcher = /* @__PURE__ */ forwardRef<HTMLDivElement, EnvironmentSwitcherProps>(
  function EnvironmentSwitcher({size = "sm", variant = "outline", placeholder = "Select environment", ...props}, ref) {
    return <EnvironmentSelector {...props} ref={ref} size={size} variant={variant} placeholder={placeholder} />;
  },
);

export interface BulkActionBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onAction"> {
  label: string;
  selectionCount: number;
  /** Keep the bar in flow or float it at the bottom center of the viewport. */
  placement?: "inline" | "viewport";
  /** Complete localized count, for example "2 selected". */
  selectionLabel?: string;
  /** Visible selection summary. Hidden counters do not reserve a slot. */
  counter?: "label" | "number" | "none";
  /** Reserved counter width; stable while selectionCount changes. */
  counterWidth?: CSSProperties["inlineSize"];
  items: readonly OverflowAction[];
  onAction?: (id: string) => void;
  onClear: () => void;
  clearLabel?: string;
  moreLabel?: string;
  morePresentation?: OverflowActionsProps["morePresentation"];
  size?: "sm" | "md" | "lg" | "xl";
  /** One to three visible commands; the default is two. */
  maxVisibleActions?: 1 | 2 | 3;
  disabled?: boolean;
  pending?: boolean;
}
/** A bounded single-row selection command capsule. The host owns positioning and updates. @since 0.2.11 */
export const BulkActionBar = /* @__PURE__ */ forwardRef<HTMLDivElement, BulkActionBarProps>(function BulkActionBar(props, ref) { return <SelectionActionBar {...props} ref={ref}/>; });
export interface MenubarMenu { id: string; label: string; disabled?: boolean; items: readonly MenuItem[]; }
export interface MenubarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onAction"> {
  label: string;
  menus: readonly MenubarMenu[];
  openValue?: string | null;
  defaultOpenValue?: string | null;
  onOpenValueChange?: (id: string | null) => void;
  onAction?: (menuId: string, actionId: string) => void;
  controlSize?: "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
}
/** Desktop application commands; destinations use native links instead. @since 0.2.11 */
export const Menubar = /* @__PURE__ */ forwardRef<HTMLDivElement, MenubarProps>(function Menubar(props, ref) { return <ApplicationMenubar {...props} ref={ref}/>; });

export interface TimePickerProps extends Omit<TimeFieldProps,"end"> {
  interval?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  panelLabel?: string;
  openTimeLabel?: string;
}
/** @since 0.2.8 */
export const TimePicker = /* @__PURE__ */ forwardRef<HTMLDivElement,TimePickerProps>(function TimePicker(props,ref){return <ClockTimePicker {...props} ref={ref}/>;});
export interface DateTimeRangeValue { start: DateTimeValue; end: DateTimeValue; }
export interface DateTimeRangePickerProps extends Omit<HTMLAttributes<HTMLDivElement>,"children"|"defaultValue"|"onChange"> {
  label: string;
  hideLabel?: boolean;
  value?: DateTimeRangeValue;
  defaultValue?: DateTimeRangeValue;
  onValueChange?: (range: DateTimeRangeValue) => void;
  startDateName?: string;
  startTimeName?: string;
  endDateName?: string;
  endTimeName?: string;
  startLabel?: string;
  endLabel?: string;
  startDateLabel?: string;
  startTimeLabel?: string;
  endDateLabel?: string;
  endTimeLabel?: string;
  startDatePickerLabels?: DateTimePickerProps["datePickerLabels"];
  endDatePickerLabels?: DateTimePickerProps["datePickerLabels"];
  startTimePickerLabels?: DateTimePickerProps["timePickerLabels"];
  endTimePickerLabels?: DateTimePickerProps["timePickerLabels"];
  form?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  controlSize?: "sm"|"md"|"lg"|"xl";
  precision?: "minute"|"second";
  order?: DateFieldProps["order"];
  locale?: string;
  minDate?: string;
  maxDate?: string;
  step?: number;
  interval?: number;
  status?: FieldStatus;
  description?: string;
  incompleteMessage?: string;
  reversedMessage?: string;
}
/** Four atomic civil date/time form values, without timezone conversion. @since 0.2.8 */
export const DateTimeRangePicker = /* @__PURE__ */ forwardRef<HTMLDivElement,DateTimeRangePickerProps>(function DateTimeRangePicker(props,ref){return <CivilDateTimeRangePicker {...props} ref={ref}/>;});

export type RelativeTimeUnit = "minute" | "hour" | "day" | "week";

export interface RelativeTimeRangeValue {
  mode: "relative" | "absolute";
  /** Empty amount is a draft that can be corrected before applying the filter. */
  relative: { amount: number | null; unit: RelativeTimeUnit };
  absolute: DateTimeRangeValue;
  /** The host interprets this identifier. Flood does not convert either range to instants. */
  timeZone: string;
}

export interface RelativeTimePreset {
  amount: number;
  unit: RelativeTimeUnit;
  label: string;
}

export interface RelativeTimeRangePickerProps extends Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>, "children" | "value" | "defaultValue" | "onChange"
> {
  label: string;
  hideLabel?: boolean;
  value: RelativeTimeRangeValue;
  onValueChange: (value: RelativeTimeRangeValue) => void;
  /** Omit to use the starting presets, or provide an empty list to hide shortcuts. */
  presets?: readonly RelativeTimePreset[];
  /** If omitted, the selected zone remains visible as context without a picker. */
  timeZones?: readonly { value: string; label: string }[];
  controlSize?: DateTimeRangePickerProps["controlSize"];
  /** Additional controls for the civil date and time fields. */
  absoluteOptions?: Pick<DateTimeRangePickerProps,
    "startLabel" | "endLabel" | "startDateLabel" | "startTimeLabel" | "endDateLabel" | "endTimeLabel"
    | "startDatePickerLabels" | "endDatePickerLabels" | "startTimePickerLabels" | "endTimePickerLabels"
    | "locale" | "order" | "precision" | "minDate" | "maxDate" | "step" | "interval"
    | "incompleteMessage" | "reversedMessage"
  >;
  labels?: {
    mode?: string;
    relative?: string;
    absolute?: string;
    presets?: string;
    amount?: string;
    unit?: string;
    timeZone?: string;
    units?: Partial<Record<RelativeTimeUnit, string>>;
  };
}

/** Edit a relative window or a civil date/time range while retaining both drafts. @since 0.2.14 */
export const RelativeTimeRangePicker = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, RelativeTimeRangePickerProps>(function RelativeTimeRangePicker(props, ref) {
  return <TimeRangeEditor {...props} ref={ref}/>;
});

export type CronScheduleResult = {expression: string; timeZone: string} & (
  | {state: "checking"}
  | {state: "invalid"; error: string}
  | {state: "ready"; summary: string; upcoming?: readonly string[]}
);

export interface CronScheduleFieldProps extends Omit<InputProps, "type" | "value" | "defaultValue" | "onChange" | "children"> {
  label?: string;
  value: string;
  onValueChange: (expression: string) => void;
  timeZone: string;
  result?: CronScheduleResult;
  hint?: ReactNode;
  labels?: {checking?: string; upcoming?: string; empty?: string};
}

/** Edit a cron expression and show the scheduler's matching preview. @since 0.2.14 */
export const CronScheduleField = /* @__PURE__ */ forwardRef<HTMLInputElement, CronScheduleFieldProps>(function CronScheduleField(
  {label = "Cron expression",value,onValueChange,timeZone,result,hint,labels,lang,disabled,readOnly,required,
    id,status,"aria-describedby":describedBy,"aria-invalid":ariaInvalid,...props}, ref,
) {
  const current = result?.expression === value && result?.timeZone === timeZone ? result : undefined;
  const ready = current?.state === "ready" ? current : undefined;
  return <Stack gap="3" lang={lang}>
    <Field id={id} label={label} required={required} hint={hint} describedBy={describedBy}
      status={status} error={current?.state === "invalid" ? current.error : undefined}>
      {field => <Input {...props} {...field} ref={ref} value={value} dir="ltr" autoComplete="off" spellCheck={false} autoCapitalize="none"
        aria-invalid={field["aria-invalid"] ?? ariaInvalid}
        style={{fontFamily:"var(--flood-sys-font-mono)",...props.style}}
        disabled={disabled} readOnly={readOnly} onChange={event=>onValueChange(event.currentTarget.value)} />}
    </Field>
    <Text as="div" size="compact" role="status" hidden={!current || current.state === "invalid"}>
      {current?.state === "checking" ? labels?.checking ?? "Checking schedule…" : ready?.summary}
    </Text>
    {ready?.upcoming && <Stack gap="1">
      <Inline gap="2"><Text size="helper" tone="subtle">{labels?.upcoming ?? "Upcoming runs"}</Text>
        <Text size="helper" tone="subtle" dir="auto">{timeZone}</Text></Inline>
      {ready.upcoming.length ? <List marker={false} gap="1" aria-label={labels?.upcoming ?? "Upcoming runs"}>
        {ready.upcoming.map(dateTime => <li key={dateTime}>
          <Timestamp dateTime={dateTime} timeZone={timeZone} format="date-time" lang={lang} size="compact" />
        </li>)}
      </List> : <Text as="p" size="compact" tone="subtle">{labels?.empty ?? "No runs in the preview window."}</Text>}
    </Stack>}
  </Stack>;
});

export interface FileMetaProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  format?: string;
  size?: number;
  variant?: "chip" | "plain";
  formatSize?: (bytes: number) => string;
}
/** A quiet combined format/size chip; display metadata only. @since 0.2.8 */
export const FileMeta = /* @__PURE__ */ forwardRef<HTMLSpanElement,FileMetaProps>(function FileMeta(props,ref){return <FileMetadata {...props} ref={ref}/>;});

export interface ImageMetaProps extends FileMetaProps {
  /** The original's width and height in pixels. */
  dimensions: { width: number; height: number };
  formatDimensions?: (dimensions: ImageMetaProps["dimensions"]) => string;
}

/** Dimensions and optional file facts for an image being inspected. @since 0.2.14 */
export const ImageMeta = /* @__PURE__ */ forwardRef<HTMLSpanElement, ImageMetaProps>(function ImageMeta(
  {dimensions, formatDimensions, lang, variant = "plain", ...props}, ref,
) {
  const {width,height} = dimensions;
  if (![width,height].every(value=>Number.isSafeInteger(value) && value>0)) {
    throw new RangeError("Flood ImageMeta requires positive whole pixel dimensions");
  }
  const number = new Intl.NumberFormat(lang || "en");
  const dimensionsLabel = formatDimensions?.(dimensions) ?? `${number.format(width)} × ${number.format(height)} px`;
  if (!dimensionsLabel.trim()) throw new Error("Flood ImageMeta requires a readable dimensions label");
  return <FileMetadata {...props} ref={ref} lang={lang} variant={variant} dimensionsLabel={dimensionsLabel} />;
});

export interface FileActionLabels {
  preview?: string; download?: string; remove?: string; cancel?: string; retry?: string;
  queued?: string; uploading?: string; success?: string; error?: string; cancelled?: string;
}
export interface FileNameProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  name: string;
  overflow?: "wrap" | "truncate";
  href?: string;
  download?: boolean;
}

/** An exact file name with optional extension-preserving truncation. */
export const FileName = /* @__PURE__ */ forwardRef<HTMLSpanElement, FileNameProps>(function FileName(
  {overflow = "wrap", ...props}, ref,
) { return <FileNameText {...props} overflow={overflow} ref={ref} />; });

export interface FilePathProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  path: string;
  /** Use a backslash for Windows paths. */
  separator?: "/" | "\\";
  href?: string;
}

/** A file path that shortens its directory before its file name. @since 0.2.14 */
export const FilePath = /* @__PURE__ */ forwardRef<HTMLSpanElement, FilePathProps>(function FilePath(props, ref) {
  return <FilePathText {...props} ref={ref} />;
});

export interface ChangedFile {
  id: string;
  path: string;
  href: string;
  separator?: FilePathProps["separator"];
  /** Omit when line counts do not apply, such as a binary file. */
  changes?: Pick<DiffStatProps, "additions" | "deletions">;
  /** Omit when this file has no review state. */
  reviewed?: boolean;
}

export interface ChangedFileListProps extends Omit<DataListProps, "children" | "aria-label"> {
  label: string;
  files: readonly ChangedFile[];
  currentId?: string;
  onReviewedChange?: (id: string, reviewed: boolean) => void;
  emptyLabel?: string;
  formatReviewLabel?: (file: ChangedFile) => string;
  formatReviewStatus?: (reviewed: boolean) => string;
  formatDiffLabel?: DiffStatProps["formatLabel"];
}

/** A review index with direct file links, diff counts, and independent review status. @since 0.2.14 */
export const ChangedFileList = /* @__PURE__ */ forwardRef<HTMLUListElement, ChangedFileListProps>(function ChangedFileList(
  {label, files, currentId, onReviewedChange, emptyLabel = "No changed files.",
    formatReviewLabel = file => `Reviewed: ${file.path}`, formatReviewStatus = reviewed => reviewed ? "Reviewed" : "Needs review",
    formatDiffLabel, density = "compact", dividers = false, className, ...props}, ref,
) {
  return <DataList {...props} ref={ref} aria-label={label} density={density} dividers={dividers}
    className={classes("flood-changed-file-list", className)}>
    {files.length ? files.map(file => (
      <DataListItem key={file.id} className="flood-changed-file-list__item" data-current={currentId === file.id || undefined}
        title={<FilePath path={file.path} href={file.href} separator={file.separator}
          aria-current={currentId === file.id ? "location" : undefined} />}
        metadata={file.changes && <DiffStat {...file.changes} formatLabel={formatDiffLabel} />}
        actions={file.reviewed !== undefined && (onReviewedChange
          ? <Checkbox checked={file.reviewed} label={formatReviewLabel(file)} hideLabel
              onChange={event => onReviewedChange(file.id,event.currentTarget.checked)} />
          : <Text size="helper" tone="subtle">{formatReviewStatus(file.reviewed)}</Text>)} />
    )) : <DataListItem title={<Text size="compact" tone="subtle">{emptyLabel}</Text>} />}
  </DataList>;
});

export interface FileThumbnailProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label" | "aria-hidden"> {
  src?: string;
  fit?: ImageProps["fit"];
  presentation?: "inline" | "tile";
  /** Width-to-height ratio for tile presentation. */
  ratio?: number;
}

/** Decorative file artwork with a fixed frame and a generic fallback. */
export const FileThumbnail = /* @__PURE__ */ forwardRef<HTMLDivElement,FileThumbnailProps>(function FileThumbnail(
  {presentation="inline",fit="cover",ratio=4/3,...props},ref,
){
  return <FileThumbnailSurface {...props} presentation={presentation} fit={fit} ratio={ratio} ref={ref}/>;
});

export interface FileItemProps extends Omit<HTMLAttributes<HTMLLIElement>, "children" | "title"> {
  name: string;
  nameOverflow?: FileNameProps["overflow"];
  size?: number;
  mimeType?: string;
  format?: string | null;
  metadataVariant?: FileMetaProps["variant"];
  thumbnail?: ReactNode;
  /** Decorative image URL used when thumbnail is omitted. */
  thumbnailSrc?: string;
  thumbnailFit?: ImageProps["fit"];
  description?: ReactNode;
  href?: string;
  download?: boolean;
  onPreview?: () => void;
  /** Compose an overlay with the file's named preview button. Takes precedence over onPreview. */
  renderPreview?: (trigger: (props: OverlayTriggerProps) => ReactNode) => ReactNode;
  /** Separate download destination, independent of the filename link. */
  downloadHref?: string;
  onRemove?: () => void;
  disabled?: boolean;
  labels?: FileActionLabels;
  formatSize?: (bytes: number) => string;
}
/** A display row; it neither reads files nor creates object URLs. @since 0.2.8 */
export const FileItem = /* @__PURE__ */ forwardRef<HTMLLIElement,FileItemProps>(function FileItem(props,ref){return <FileRecord {...props} ref={ref}/>;});

export interface FileCardProps extends Omit<CardProps, "title" | "actions" | "footer" | "children" | "description" | "media">,
  Pick<FileItemProps, "name" | "nameOverflow" | "size" | "mimeType" | "format" | "description" | "href" | "download" | "downloadHref" | "onPreview" | "renderPreview" | "onRemove" | "disabled" | "labels" | "formatSize"> {
  thumbnailSrc?: string;
  thumbnailFit?: ImageProps["fit"];
  thumbnailRatio?: number;
  thumbnailPlacement?: "top" | "body";
  /** Place the preview command on the artwork instead of in the footer. */
  previewPlacement?: "footer" | "thumbnail";
}

/** A file in a visual gallery, with an optional thumbnail and independent commands. */
export const FileCard = /* @__PURE__ */ forwardRef<HTMLDivElement,FileCardProps>(function FileCard(props,ref){
  return <FileGalleryCard {...props} ref={ref}/>;
});
export interface FileListProps extends DataListProps {
  label: string;
  appearance?: "panel" | "plain" | "embedded";
}
/** A named native list of FileItem rows. @since 0.2.8 */
export const FileList = /* @__PURE__ */ forwardRef<HTMLUListElement,FileListProps>(function FileList({label,appearance="panel",className,...props},ref){
  if(!label.trim())throw new Error("Flood FileList requires a nonempty label");
  return <DataList {...props} ref={ref} aria-label={label} className={classes("flood-file-list",className)} data-appearance={appearance}/>;
});

export interface FileListSkeletonRow {
  metadata?: FileItemProps["metadataVariant"];
  description?: boolean;
  actions?: 0 | 1 | 2 | 3;
}

export interface FileListSkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role">,
  Pick<FileListProps, "density" | "dividers"> {
  label: string;
  appearance?: "panel" | "plain";
  rows?: number | readonly FileListSkeletonRow[];
  /** Repeated shape when rows is a count. */
  row?: FileListSkeletonRow;
  animate?: boolean;
}

/** First-load placeholders with FileList's thumbnail, copy and action tracks. */
export const FileListSkeleton = /* @__PURE__ */ forwardRef<HTMLDivElement,FileListSkeletonProps>(function FileListSkeleton(
  {label,appearance,density,dividers,rows=3,row={},animate=true,className,...props},ref,
) {
  const count = typeof rows === "number" ? rows : rows.length;
  if (!label.trim() || !Number.isSafeInteger(count) || count < 1) {
    throw new Error("Flood FileListSkeleton requires a label and a positive row count");
  }
  const shapes = typeof rows === "number" ? Array.from({length:count}, () => row) : rows;
  return <div {...props} ref={ref} className={classes("flood-file-list-skeleton",className)}>
    <VisuallyHidden role="status">{label}</VisuallyHidden>
    <FileList label={label} aria-hidden="true" appearance={appearance} density={density} dividers={dividers}>
      {shapes.map(({metadata,description,actions=0},index) => {
        if (!Number.isInteger(actions) || actions < 0 || actions > 3) throw new RangeError("Flood FileListSkeleton expects zero to three actions per row");
        return <DataListItem key={index} className="flood-file-item"
          media={<span className="flood-file-item__thumbnail"><Skeleton shape="circle" width="100%" height="100%" animate={animate}/></span>}
          title={<span className="flood-file-item__heading" data-name-overflow="truncate">
            <span className="flood-file-item__name flood-file-list-skeleton__line" style={{inlineSize:index%2 ? "6rem" : "9rem"}}>
              <Skeleton height=".65em" animate={animate}/>
            </span>
            {metadata && <span className="flood-file-meta flood-file-list-skeleton__metadata" data-variant={metadata}>
              <Skeleton shape="text" animate={animate}/>
            </span>}
          </span>}
          description={description && <span className="flood-file-list-skeleton__line"><Skeleton width="7rem" height=".65em" animate={animate}/></span>}
          actions={actions > 0 && Array.from({length:actions}, (_, action) => <span key={action}
            className="flood-action-placeholder flood-action-placeholder--icon flood-control--sm">
            <Skeleton shape="circle" width="var(--flood-control-icon)" height="var(--flood-control-icon)" animate={animate}/>
          </span>)} />;
      })}
    </FileList>
  </div>;
});

export interface UploadItemProps extends Omit<FileItemProps,"description"> {
  state: "queued" | "uploading" | "paused" | "processing" | "success" | "error" | "cancelled";
  /** Transfer percentage. Processing has its own indeterminate feedback. */
  progress?: number;
  error?: string;
  labels?: FileActionLabels & { pause?: string; resume?: string; paused?: string; processing?: string };
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
}
/** Host-owned upload state with applicable actions only. @since 0.2.8 */
export const UploadItem = /* @__PURE__ */ forwardRef<HTMLLIElement,UploadItemProps>(function UploadItem(props,ref){return <UploadRecord {...props} ref={ref}/>;});
export interface UploadListProps extends FileListProps {}
/** A named native list of UploadItem rows. @since 0.2.8 */
export const UploadList = /* @__PURE__ */ forwardRef<HTMLUListElement,UploadListProps>(function UploadList(props,ref){return <FileList {...props} ref={ref}/>;});

export interface UploadQueueEntry extends Omit<UploadItemProps, "id" | "hidden"> {
  /** Stable host identity. File names need not be unique. */
  id: string;
}
export interface UploadQueueProps extends Omit<SectionProps, "children" | "description"> {
  entries: readonly UploadQueueEntry[];
  picker?: FileDropTargetProps;
  /** Accessible name of the file list. */
  listLabel?: string;
  maxListHeight?: CSSProperties["maxBlockSize"];
  density?: DataListProps["density"];
  emptyContent?: ReactNode;
}
/** File intake and transfer rows in one host-owned queue. */
export const UploadQueue = /* @__PURE__ */ forwardRef<HTMLElement,UploadQueueProps>(function UploadQueue(props,ref){
  return <UploadQueueContent {...props} ref={ref}/>;
});
export interface ImagePreviewProps extends Omit<DialogProps,"children" | "description"> {
  src: string;
  alt: string;
  caption?: ReactNode;
  downloadHref?: string;
  downloadLabel?: string;
  /** Offer a switch from the fitted image to its intrinsic size. */
  zoomable?: boolean;
  actualSizeLabel?: string;
  viewportLabel?: string;
  loadingLabel?: string;
  errorLabel?: string;
}
/** A single-image viewer using Flood Dialog focus and dismissal. @since 0.2.8 */
export const ImagePreview = /* @__PURE__ */ forwardRef<HTMLDialogElement,ImagePreviewProps>(function ImagePreview(props,ref){return <ModalImagePreview {...props} ref={ref}/>;});

export interface ImageGalleryItem extends Pick<ImagePreviewProps,"src"|"alt"|"caption"|"downloadHref"> {
  id: string;
  /** A small image for the thumbnail rail. Original images load separately. */
  thumbnailSrc?: string;
  thumbnailLabel?: string;
}

export interface ThumbnailStripItem {
  id: string;
  /** A short accessible label for the thumbnail. */
  label: string;
  /** Supply a small image. If missing or unavailable, the tile keeps its size. */
  src?: string;
}

export interface ThumbnailStripProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  label: string;
  items: readonly ThumbnailStripItem[];
  value?: string;
  onValueChange: (id: string) => void;
  align?: "start" | "center";
}

/** A controlled, horizontally scrolling strip of image choices. @since 0.2.14 */
export const ThumbnailStrip = /* @__PURE__ */ forwardRef<HTMLDivElement, ThumbnailStripProps>(function ThumbnailStrip(props, ref) {
  return <ImageThumbnailStrip {...props} ref={ref} />;
});

export interface ImageGalleryProps extends Omit<ImagePreviewProps, "src" | "alt" | "caption" | "downloadHref"> {
  items: readonly ImageGalleryItem[];
  currentId?: string;
  defaultCurrentId?: string;
  onCurrentIdChange?: (id: string) => void;
  navigation?: "arrows" | "thumbnails";
  navigationLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  getPositionLabel?: (position: number, total: number) => string;
}

/** Inspect a set of images within a single dialog. */
export const ImageGallery = /* @__PURE__ */ forwardRef<HTMLDialogElement, ImageGalleryProps>(function ImageGallery(props,ref) {
  return <ModalImageGallery {...props} ref={ref}/>;
});

export interface ImageMosaicItem extends ImageGalleryItem {
  /** Intrinsic width divided by height. Used to fit a single tile. */
  aspectRatio?: number;
}

export interface ImageMosaicProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
  /** Names both the attachment list and the viewer. */
  label: string;
  items: readonly ImageMosaicItem[];
  /** Receives the source item, one-based position and the count hidden behind this tile. */
  formatImageLabel?: (item: ImageMosaicItem, position: number, additional: number) => string;
  formatAdditionalCount?: (additional: number) => string;
  galleryProps?: Pick<ImageGalleryProps, "navigation" | "navigationLabel" | "previousLabel" | "nextLabel" |
    "getPositionLabel" | "closeLabel" | "zoomable" | "actualSizeLabel" | "viewportLabel" | "loadingLabel" | "errorLabel" | "downloadLabel">;
}

/** A gallery of related attachments compressed into up to four in-context tiles. */
export const ImageMosaic = /* @__PURE__ */ forwardRef<HTMLDivElement, ImageMosaicProps>(function ImageMosaic(props, ref) {
  return <ImageMosaicContent {...props} ref={ref} />;
});

export interface CollectionCoverImage {
  id: string;
  src: string;
  fit?: ImageProps["fit"];
}

export interface CollectionCoverProps extends Omit<AspectRatioProps, "children" | "role" | "aria-label" | "aria-hidden"> {
  /** Up to three decorative images in display order. The first leads the cover. */
  images?: readonly CollectionCoverImage[];
}

/** Passive artwork for a collection. Its frame stays stable as artwork changes. @since 0.2.14 */
export const CollectionCover = /* @__PURE__ */ forwardRef<HTMLDivElement, CollectionCoverProps>(function CollectionCover(
  {images = [], ratio = 8 / 5, className, ...props}, ref,
) {
  const visible = images.slice(0, 3);
  if (new Set(visible.map(image=>image.id)).size !== visible.length || visible.some(image=>!image.id.trim() || !image.src.trim())) {
    throw new Error("Flood CollectionCover requires uniquely identified artwork with nonempty sources");
  }
  return <AspectRatio {...props} ref={ref} ratio={ratio} className={classes("flood-collection-cover",className)} aria-hidden="true">
    {visible.length ? <div className="flood-collection-cover__tiles" data-count={visible.length}>
      {visible.map(({id,src,fit})=><FileThumbnail key={id} src={src} fit={fit} presentation="tile" style={{aspectRatio:"auto"}}/>)}
    </div> : <Center className="flood-collection-cover__empty">
      <IconSlot size="lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg></IconSlot>
    </Center>}
  </AspectRatio>;
});

export interface CollectionCardProps extends Pick<CardProps, "headingLevel" | "elevation" | "actions">,
  Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  title: string;
  href: string;
  artwork?: readonly CollectionCoverImage[];
  coverRatio?: number;
  /** Localized metadata such as "12 items". */
  countLabel?: string;
}

/** A single native destination with a passive cover and separate optional actions. @since 0.2.14 */
export const CollectionCard = /* @__PURE__ */ forwardRef<HTMLDivElement, CollectionCardProps>(function CollectionCard(
  {title, href, artwork, coverRatio, countLabel, className, ...props}, ref,
) {
  if (!title.trim() || !href.trim()) throw new Error("Flood CollectionCard requires a title and destination");
  return <Card {...props} ref={ref} density="compact" headingSize="group"
    className={classes("flood-collection-card",className)}
    media={<CollectionCover images={artwork} ratio={coverRatio}/>}
    title={<Link href={href} className="flood-collection-card__link">{title}</Link>}
    description={countLabel}/>;
});

export type DocumentPreviewPage =
  | { state: "ready"; content: ReactNode }
  | { state: "loading" }
  | { state: "error"; onRetry?: () => void };

export interface DocumentPreviewProps extends Omit<DialogProps, "children"> {
  /** The document's known page count. Zero displays an empty state. */
  pageCount: number;
  /** Render only the accepted one-based page while the preview is open. */
  renderPage: (page: number) => DocumentPreviewPage;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** Optional document-wide action, such as a download Link. */
  action?: ReactNode;
  labels?: {
    viewport?: string;
    navigation?: string;
    previousPage?: string;
    nextPage?: string;
    pageNumber?: string;
    goToPage?: string;
    invalidPage?: (pageCount: number) => string;
    position?: (page: number, pageCount: number) => string;
    loading?: string;
    error?: string;
    empty?: string;
    retry?: string;
  };
}

/** Inspect an ordered, host-rendered document in one dialog. */
export const DocumentPreview = /* @__PURE__ */ forwardRef<HTMLDialogElement, DocumentPreviewProps>(function DocumentPreview(props, ref) {
  return <ModalDocumentPreview {...props} ref={ref} />;
});

export interface DataTableColumn {
  id: string;
  label: string;
  /** Short unit shown alongside the label, such as USD or kg. */
  unit?: string;
  sortable?: boolean;
  numeric?: boolean;
  align?: "start" | "end";
  width?: CSSProperties["width"];
  /** Reserve a secondary line in this column when loading with skeleton rows. */
  placeholderLines?: 1 | 2;
  /** Keep plain text values on one line and reveal the full value on overflow. */
  cellOverflow?: "truncate";
  /** Keep this column visible when the host or Columns menu hides other columns. */
  hideable?: boolean;
  /** Opt into pointer and keyboard width adjustments for this column. */
  resizable?: boolean;
  /** Interactive width bounds in CSS pixels. */
  minWidth?: number;
  maxWidth?: number;
  /** Keep the column at a logical edge when the table scrolls horizontally. */
  pinned?: "start" | "end";
}
export interface DataTableRow {
  id: string;
  label?: string;
  cells: Readonly<Record<string, ReactNode>>;
  sortValues?: Readonly<Record<string, string | number | null>>;
  selectionDisabled?: boolean;
  /** Related detail rendered in a separate full-width row on disclosure. */
  expandedContent?: ReactNode;
  /** One named record-opening action. Other controls in the row remain independent. */
  primaryAction?: {
    column: string;
    title: string;
    description?: ReactNode;
    buttonProps: Omit<ButtonProps, "children" | "type" | "variant" | "size"> & {ref?: Ref<HTMLButtonElement>};
  };
}
export interface DataTableSort { column: string; direction: "ascending" | "descending"; }
export interface DataTableLabels {
  loading?: string;
  refreshing?: string;
  empty?: string;
  error?: string;
  retry?: string;
  selectPage?: string;
  selectRow?: (label: string) => string;
  results?: (from: number, to: number, total: number) => string;
  selection?: (selected: number, total: number) => string;
  cursorSelection?: (selected: number) => string;
  sort?: (label: string) => string;
  columns?: string;
  resetColumns?: string;
  sortedColumn?: (label: string) => string;
  resizeColumn?: (label: string) => string;
  expandRow?: (label: string) => string;
  collapseRow?: (label: string) => string;
  rowDetails?: string;
  pagination?: string;
  previousPage?: string;
  nextPage?: string;
  page?: (page: number) => string;
  pagePosition?: (page: number, pageCount: number) => string;
  pageNumber?: (page: number) => string;
}
export interface DataTableProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Host-owned heading, search and filters aligned with the outer table cells. */
  toolbar?: ReactNode | ((controls: { columns: ReactNode }) => ReactNode);
  inset?: "standard" | "roomy";
  /** Ready with no rows only. Compose EmptyState/actions here; loading and error keep their owners. */
  emptyContent?: ReactNode;
  /** Content for a failed read. Compose ErrorState and let the host own recovery. */
  errorContent?: ReactNode;
  caption: string;
  hideCaption?: boolean;
  columns: readonly DataTableColumn[];
  showColumnVisibility?: boolean;
  hiddenColumnIds?: readonly string[];
  /** Initial hidden columns and the layout restored by Reset columns. */
  defaultHiddenColumnIds?: readonly string[];
  onHiddenColumnIdsChange?: (ids: string[]) => void;
  columnWidths?: Readonly<Record<string, number>>;
  /** Size unresized tracks from the table and declared column widths, independently of the rows. */
  columnLayout?: "auto" | "fixed";
  defaultColumnWidths?: Readonly<Record<string, number>>;
  onColumnWidthsChange?: (widths: Record<string, number>) => void;
  rows: readonly DataTableRow[];
  expandedIds?: readonly string[];
  defaultExpandedIds?: readonly string[];
  onExpandedChange?: (ids: string[]) => void;
  density?: "compact" | "comfortable";
  striped?: boolean;
  minWidth?: CSSProperties["minWidth"];
  /** Maximum height of the scroll viewport, including the header. */
  maxViewportHeight?: CSSProperties["maxBlockSize"];
  stickyHeader?: boolean;
  sort?: DataTableSort | null;
  defaultSort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;
  locale?: string;
  selectable?: boolean;
  selectedIds?: readonly string[];
  defaultSelectedIds?: readonly string[];
  onSelectionChange?: (ids: string[]) => void;
  page?: number;
  defaultPage?: number;
  pageSize?: number;
  paginationPresentation?: PaginationProps["presentation"];
  onPageChange?: (page: number) => void;
  /** Hide the result range while preserving selection and pagination controls. */
  showResults?: boolean;
  /** Replace the visible result range during selection, or hide the footer count while keeping its accessible status. */
  showSelection?: boolean | "replace-results";
  /** Server and cursor modes render supplied rows without local sorting or slicing. */
  paginationMode?: "client" | "server" | "cursor";
  /** Cursor controls and an optional known range shown in the footer summary. */
  cursorPagination?: Pick<CursorPaginationProps, "previous" | "next" | "pending" | "position">;
  totalRows?: number;
  /** Remote dataset selection is controlled; the host validates IDs outside this page. */
  selectionScope?: "page" | "dataset";
  state?: "ready" | "loading" | "error";
  /** Use a spinner, a visible loading message, or placeholders on the existing column tracks. */
  loadingAppearance?: "spinner" | "message" | "skeleton";
  /** Placeholder count, up to pageSize. Defaults to the smaller of five and pageSize. */
  loadingRowCount?: number;
  /** Show background activity while ready rows and their controls are still usable. */
  refreshing?: boolean;
  onRetry?: () => void;
  labels?: DataTableLabels;
}
/** A native table with selectable rows and client or remote pagination. @since 0.2.8 */
export const DataTable = /* @__PURE__ */ forwardRef<HTMLDivElement,DataTableProps>(function DataTable(props,ref){return <ManagedDataTable {...props} ref={ref}/>;});

export interface SparklineProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label" | "aria-labelledby"> {
  /** Equally spaced observations in order. Missing or nonfinite values break the line. */
  values: readonly (number | null)[];
  /** Localized text conveying the trend or the absence of data. */
  label: string;
  showLabel?: boolean;
  /** Shared lower and upper bounds for comparisons. Values outside the bounds are clipped. */
  domain?: readonly [number, number];
  size?: "sm" | "md";
  tone?: "neutral" | "accent" | "success" | "warning" | "error";
  variant?: "line" | "area";
}

/** @since 0.2.11 */
export const Sparkline = /* @__PURE__ */ forwardRef<HTMLDivElement, SparklineProps>(function Sparkline(
  { showLabel = false, size = "md", tone = "accent", variant = "area", ...props }, ref,
) {
  return <TrendPlot {...props} showLabel={showLabel} size={size} tone={tone} variant={variant} ref={ref} />;
});

export interface LineChartSeries {
  id: string;
  label: string;
  /** One observation per category. Missing and nonfinite values break the line. */
  values: readonly (number | null)[];
}
export type ChartSeries = LineChartSeries;

export interface LineChartProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label"> {
  label: string;
  /** Equally spaced categories in the order supplied. */
  categories: readonly string[];
  /** One to four comparable series sharing a scale. An empty array is also supported. */
  series: readonly LineChartSeries[];
  /** Shared finite bounds containing every observation. */
  domain?: readonly [number, number];
  variant?: "line" | "area";
  /** Shape-preserving interpolation between observations. */
  curve?: "linear" | "smooth";
  /** Show the numeric scale and horizontal reference lines. */
  showYAxis?: boolean;
  /** Show the series key below the plot. Defaults to false. */
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  emptyLabel?: string;
  missingLabel?: string;
  navigationLabel?: string;
}

export const LineChart = /* @__PURE__ */ forwardRef<HTMLDivElement, LineChartProps>(function LineChart(
  { variant = "area", curve = "smooth", showYAxis = false, emptyLabel = "No data", missingLabel = "No value",
    navigationLabel = "Use the arrow keys to explore values, or Home and End to jump.", ...props }, ref,
) {
  return <SeriesPlot {...props} variant={variant} curve={curve} showYAxis={showYAxis} emptyLabel={emptyLabel} missingLabel={missingLabel} navigationLabel={navigationLabel} ref={ref} />;
});

export interface BarChartProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label"> {
  label: string;
  categories: readonly string[];
  /** Compare series side by side, by cumulative magnitude, or by share of each total. Defaults to grouped. */
  layout?: "grouped" | "stacked" | "percent";
  /** One to four grouped series. Use null for a missing value. */
  series: readonly ChartSeries[];
  /** Finite bounds containing zero and each observation or signed stack extent. Percent uses a fixed scale. */
  domain?: readonly [number, number];
  /** Show the series key below the plot. Defaults to false. */
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  /** Format a fraction from 0 to 1 in percent layout. */
  formatShare?: (share: number) => string;
  emptyLabel?: string;
  missingLabel?: string;
  navigationLabel?: string;
}

export const BarChart = /* @__PURE__ */ forwardRef<HTMLDivElement, BarChartProps>(function BarChart(
  { emptyLabel = "No data", missingLabel = "No value",
    navigationLabel = "Use the arrow keys to explore categories, or Home and End to jump.", ...props }, ref,
) {
  return <GroupedBars {...props} emptyLabel={emptyLabel} missingLabel={missingLabel} navigationLabel={navigationLabel} ref={ref} />;
});

export interface DonutChartItem {
  id: string;
  label: string;
  /** A finite nonnegative part of the whole. */
  value: number;
}

export interface DonutChartProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label"> {
  label: string;
  /** Up to six categories in display order. */
  items: readonly DonutChartItem[];
  totalLabel?: string;
  emptyLabel?: string;
  navigationLabel?: string;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  /** Receives the share as a fraction from 0 to 1. */
  formatShare?: (share: number) => string;
}

export const DonutChart = /* @__PURE__ */ forwardRef<HTMLDivElement, DonutChartProps>(function DonutChart(
  { totalLabel = "Total", emptyLabel = "No data",
    navigationLabel = "Use the arrow keys to explore segments, or Home and End to jump.", ...props }, ref,
) {
  return <ShareRing {...props} totalLabel={totalLabel} emptyLabel={emptyLabel} navigationLabel={navigationLabel} ref={ref} />;
});

export interface CompositionBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label"> {
  label: string;
  /** Up to six mutually exclusive parts in display order. */
  items: readonly DonutChartItem[];
  /** Use rows to align the readouts vertically. */
  layout?: "inline" | "rows";
  /** Readouts show amounts by default. Shares are available when the total is positive. */
  readout?: "value" | "share" | "both";
  emptyLabel?: string;
  formatValue?: (value: number) => string;
  /** Receives the share as a fraction from 0 to 1. */
  formatShare?: (share: number) => string;
}

/** A compact proportional bar with always-visible category readouts. */
export const CompositionBar = /* @__PURE__ */ forwardRef<HTMLDivElement, CompositionBarProps>(function CompositionBar(
  {layout = "inline", readout = "value", emptyLabel = "No data", ...props}, ref,
) {
  return <ShareBar {...props} ref={ref} layout={layout} readout={readout} emptyLabel={emptyLabel} />;
});

export interface HeatmapProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  columns: readonly string[];
  rows: readonly { id: string; label: string; values: readonly (number | null)[] }[];
  /** Shared zero-based scale. Defaults to the largest observed value. */
  max?: number;
  formatValue?: (value: number) => string;
  missingLabel?: string;
  emptyLabel?: string;
}

export const Heatmap = /* @__PURE__ */ forwardRef<HTMLDivElement, HeatmapProps>(function Heatmap(
  { missingLabel = "No data", emptyLabel = "No observations", ...props }, ref,
) {
  return <HeatmapGrid {...props} missingLabel={missingLabel} emptyLabel={emptyLabel} ref={ref} />;
});

export type UptimeStatus = "operational" | "degraded" | "outage" | "unknown";

export interface UptimePeriod {
  id: string;
  label: string;
  status: UptimeStatus;
  /** A shorter label for a period at the start or end of the display. */
  edgeLabel?: string;
  detail?: string;
}

export interface UptimeHistoryProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  /** Equal-duration periods in chronological order, including explicit unknowns. */
  periods: readonly UptimePeriod[];
  /** A host-calculated availability summary for this exact window. */
  summary?: string;
  statusLabels?: Partial<Record<UptimeStatus, string>>;
  emptyLabel?: string;
  /** Current service state, evaluated independently of this historical window. */
  currentStatus?: Pick<StatusIndicatorProps, "label" | "tone">;
  /** Hide edge labels when aligned strips already share a visible date range. */
  showRange?: boolean;
}

/** Inspect availability across equal-duration historical periods. @since 0.2.14 */
export const UptimeHistory = /* @__PURE__ */ forwardRef<HTMLDivElement, UptimeHistoryProps>(function UptimeHistory(
  {showRange = true, ...props}, ref,
) {
  return <UptimeHistoryStrip {...props} showRange={showRange} ref={ref} />;
});

export interface ServiceAvailabilityEntry {
  id: string;
  label: string;
  currentStatus: Pick<StatusIndicatorProps, "label" | "tone">;
  /** Host-calculated availability for the shared historical window. */
  summary?: string;
  /** Observations keyed by period ID. Missing observations render as unknown. */
  observations: Readonly<Partial<Record<string, Pick<UptimePeriod, "status" | "detail">>>>;
}

export interface ServiceAvailabilityProps extends Omit<SectionProps, "children"> {
  /** The shared, oldest-first periods of equal duration for every service. */
  periods: readonly Pick<UptimePeriod, "id" | "label" | "edgeLabel">[];
  services: readonly ServiceAvailabilityEntry[];
  statusLabels?: UptimeHistoryProps["statusLabels"];
  emptyLabel?: string;
  emptyHistoryLabel?: string;
}

/** Compare current service states and aligned historical availability. @since 0.2.14 */
export const ServiceAvailability = /* @__PURE__ */ forwardRef<HTMLElement, ServiceAvailabilityProps>(function ServiceAvailability(
  {periods, services, statusLabels, emptyLabel = "No services to display", emptyHistoryLabel, ...props}, ref,
) {
  if (services.some(service => !service.id.trim() || !service.label.trim() || !service.currentStatus.label.trim()) ||
      new Set(services.map(service => service.id)).size !== services.length) {
    throw new Error("Flood ServiceAvailability requires uniquely identified services with named current states");
  }
  const first = periods[0];
  const last = periods[periods.length - 1];
  return <Section {...props} ref={ref}>
    {services.length ? <Stack gap="4">
      {services.map(service => <UptimeHistory key={service.id} label={service.label} summary={service.summary}
        currentStatus={service.currentStatus} statusLabels={statusLabels} emptyLabel={emptyHistoryLabel} showRange={false}
        periods={periods.map(period => {
          const observation = Object.hasOwn(service.observations, period.id) ? service.observations[period.id] : undefined;
          return {...period, status:observation?.status ?? "unknown", detail:observation?.detail};
        })} />)}
      {first && last && <Inline gap="2" dir="ltr" style={{justifyContent:"space-between"}}>
        <Text size="helper" tone="subtle" dir="auto">{first.edgeLabel ?? first.label}</Text>
        {periods.length > 1 && <Text size="helper" tone="subtle" dir="auto">{last.edgeLabel ?? last.label}</Text>}
      </Inline>}
    </Stack> : <Text as="p" size="compact" tone="subtle">{emptyLabel}</Text>}
  </Section>;
});

export interface ScatterChartPoint {
  id: string;
  label?: string;
  x: number;
  y: number;
}

export interface ScatterChartProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label"> {
  label: string;
  xLabel: string;
  yLabel: string;
  /** Observations in keyboard navigation order, with stable, unique IDs. */
  points: readonly ScatterChartPoint[];
  /** Finite, increasing bounds that contain all x observations. */
  xDomain?: readonly [number, number];
  /** Finite, increasing bounds that contain all y observations. */
  yDomain?: readonly [number, number];
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  emptyLabel?: string;
  navigationLabel?: string;
}

export const ScatterChart = /* @__PURE__ */ forwardRef<HTMLDivElement, ScatterChartProps>(function ScatterChart(props, ref) {
  return <ScatterPlot {...props} ref={ref} />;
});

export interface RangeChartItem {
  id: string;
  label: string;
  /** A missing bound leaves an empty category. */
  low: number | null;
  high: number | null;
  /** Optional observed value within the interval, such as a median. */
  midpoint?: number;
}

export interface RangeChartProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label"> {
  label: string;
  items: readonly RangeChartItem[];
  /** Finite increasing bounds containing all complete intervals. */
  domain?: readonly [number, number];
  formatValue?: (value: number) => string;
  lowLabel?: string;
  highLabel?: string;
  midpointLabel?: string;
  emptyLabel?: string;
  missingLabel?: string;
  navigationLabel?: string;
}

export const RangeChart = /* @__PURE__ */ forwardRef<HTMLDivElement, RangeChartProps>(function RangeChart(props, ref) {
  return <RangePlot {...props} ref={ref} />;
});

export interface DumbbellChartItem {
  id: string;
  label: string;
  before: number | null;
  after: number | null;
}

export interface DumbbellChartProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label"> {
  label: string;
  items: readonly DumbbellChartItem[];
  /** Finite, increasing bounds containing all observed endpoints. */
  domain?: readonly [number, number];
  beforeLabel?: string;
  afterLabel?: string;
  missingLabel?: string;
  emptyLabel?: string;
  formatValue?: (value: number) => string;
  navigationLabel?: string;
}

export const DumbbellChart = /* @__PURE__ */ forwardRef<HTMLDivElement, DumbbellChartProps>(function DumbbellChart(props, ref) {
  return <DumbbellPlot {...props} ref={ref} />;
});

export interface BoxPlotSummary {
  low: number;
  q1: number;
  median: number;
  q3: number;
  high: number;
}

export interface BoxPlotItem {
  id: string;
  label: string;
  /** Ordered whiskers, quartiles and median. Null preserves an empty row. */
  summary: BoxPlotSummary | null;
  /** Optional observations beyond the supplied whiskers. */
  outliers?: readonly number[];
}

export interface BoxPlotProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label"> {
  label: string;
  items: readonly BoxPlotItem[];
  /** Finite increasing bounds containing every observation. */
  domain?: readonly [number, number];
  formatValue?: (value: number) => string;
  /** Format axis ticks independently of exact values. Defaults to formatValue. */
  formatAxisValue?: (value: number) => string;
  emptyLabel?: string;
  missingLabel?: string;
  navigationLabel?: string;
  statisticLabels?: Partial<Record<keyof BoxPlotSummary | "outliers" | "whiskers", string>>;
}

export const BoxPlot = /* @__PURE__ */ forwardRef<HTMLDivElement, BoxPlotProps>(function BoxPlot(props, ref) {
  return <DistributionBoxes {...props} ref={ref} />;
});

export interface BulletChartItem {
  id: string;
  label: string;
  value: number;
  target: number;
}

export interface BulletChartProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label"> {
  label: string;
  items: readonly BulletChartItem[];
  /** Shared scale maximum. Defaults to the largest actual or target. */
  max?: number;
  formatValue?: (value: number) => string;
  valueLabel?: string;
  targetLabel?: string;
  emptyLabel?: string;
}

export const BulletChart = /* @__PURE__ */ forwardRef<HTMLDivElement, BulletChartProps>(function BulletChart(props, ref) {
  return <BulletPlot {...props} ref={ref} />;
});

export interface WaterfallChartStep {
  id: string;
  label: string;
  value: number;
  /** A change adjusts the running total. A total is an absolute checkpoint. */
  kind?: "change" | "total";
}

export interface WaterfallChartProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label"> {
  label: string;
  steps: readonly WaterfallChartStep[];
  /** Finite increasing bounds containing zero and every running total. */
  domain?: readonly [number, number];
  formatValue?: (value: number) => string;
  changeLabel?: string;
  totalLabel?: string;
  emptyLabel?: string;
  navigationLabel?: string;
}

export const WaterfallChart = /* @__PURE__ */ forwardRef<HTMLDivElement, WaterfallChartProps>(function WaterfallChart(props, ref) {
  return <WaterfallPlot {...props} ref={ref} />;
});

export interface HistogramProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label"> {
  label: string;
  /** Name and unit for the numeric axis. */
  xLabel: string;
  /** Show the axis title below the numeric ticks. Defaults to true. */
  showXAxisLabel?: boolean;
  /** Inclusive lower boundary of the first bin. */
  start: number;
  /** Positive width shared by all bins. */
  binWidth: number;
  /** Counts in ascending bin order. Zero is a measured empty bin. */
  counts: readonly number[];
  /** Common count scale for comparing histograms. Defaults to the largest count or one. */
  maxCount?: number;
  countLabel?: string;
  formatBoundary?: (value: number) => string;
  formatCount?: (count: number) => string;
  emptyLabel?: string;
  navigationLabel?: string;
}

export const Histogram = /* @__PURE__ */ forwardRef<HTMLDivElement, HistogramProps>(function Histogram(props, ref) {
  return <HistogramPlot {...props} ref={ref} />;
});

export interface BarListItem {
  id: string;
  label: string;
  value: number;
  valueText?: string;
}

export interface BarListProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label"> {
  label: string;
  /** Nonnegative values in display order. */
  items: readonly BarListItem[];
  /** Shared positive upper bound. Defaults to the largest value, or 1 when all are zero. */
  max?: number;
  tone?: SemanticTone;
  emptyLabel?: string;
}

export const BarList = /* @__PURE__ */ forwardRef<HTMLDivElement, BarListProps>(function BarList(
  { tone = "accent", emptyLabel = "No data", ...props }, ref,
) {
  return <RankedBars {...props} tone={tone} emptyLabel={emptyLabel} ref={ref} />;
});

export interface DataListProps extends Omit<HTMLAttributes<HTMLUListElement>, "role"> {
  density?: "compact" | "comfortable";
  dividers?: boolean;
  /** Keep the selection column when no visible item currently offers selection. */
  reserveSelectionSpace?: boolean;
}
/** A native list; links and actions stay independent. @since 0.2.8 */
export const DataList = /* @__PURE__ */ forwardRef<HTMLUListElement,DataListProps>(function DataList({density="comfortable",dividers=true,reserveSelectionSpace,className,...props},ref){
  return <ul {...props} ref={ref} role="list" data-density={density} data-dividers={dividers} data-reserve-selection={reserveSelectionSpace || undefined} className={classes("flood-data-list",className)}/>;
});
export type ReorderPlacement = "before" | "inside" | "after";
export interface ReorderMove {
  sourceId: string;
  targetId: string;
  placement: ReorderPlacement;
}
export interface ReorderListItem {
  id: string;
  label: string;
  description?: string;
  media?: ReactNode;
  parentId?: string;
  canContain?: boolean;
  disabled?: boolean;
}
export interface ReorderListLabels {
  instructions?: string;
  handle?: (label: string) => string;
  picked?: (label: string) => string;
  position?: (source: string, target: string, placement: ReorderPlacement) => string;
  moved?: (source: string, target: string, placement: ReorderPlacement) => string;
  cancelled?: (source: string) => string;
  unavailable?: string;
  scroll?: string;
}
export interface ReorderListProps extends Omit<DataListProps, "children" | "onChange"> {
  label: string;
  items: readonly ReorderListItem[];
  onMove: (move: ReorderMove, input: "keyboard" | "pointer") => void | string;
  canMove?: (move: ReorderMove) => boolean;
  labels?: ReorderListLabels;
  maxViewportHeight?: CSSProperties["maxBlockSize"];
  disabled?: boolean;
}
/** A controlled collection with explicit pointer and keyboard move targets. @since 0.2.14 */
export const ReorderList = /* @__PURE__ */ forwardRef<HTMLUListElement,ReorderListProps>(function ReorderList(props,ref) {
  return <CollectionReorderList {...props} ref={ref} />;
});

export interface KanbanCardData {
  id: string;
  title: string;
  description?: string;
  metadata?: ReactNode;
  /** Decorative artwork identifying the project. */
  icon?: ReactNode;
  assignee?: Pick<AvatarProps, "name" | "src" | "fallback">;
  /** A localized display label and an optional machine-readable date. */
  dueDate?: {label: string; dateTime?: string};
  /** A signal independent of the column, such as project health. */
  status?: {label: string; tone?: BadgeTone};
  disabled?: boolean;
}
export interface KanbanColumn {
  id: string;
  label: string;
  cards: readonly KanbanCardData[];
  disabled?: boolean;
}
export interface KanbanMove {
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  /** Omit to append to the destination column. */
  beforeCardId?: string;
}
export interface KanbanBoardLabels {
  instructions?: string;
  handle?: (card: string) => string;
  moveTo?: (card: string) => string;
  moveEarlier?: string;
  moveLater?: string;
  picked?: (card: string) => string;
  position?: (card: string, column: string, before?: string) => string;
  moved?: (card: string, column: string, before?: string) => string;
  cancelled?: string;
  empty?: string;
  count?: (count: number) => string;
}
export interface KanbanBoardProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange" | "role" | "aria-label"> {
  label: string;
  columns: readonly KanbanColumn[];
  /** Open lanes share the parent surface; contained lanes add a quiet backing. */
  appearance?: "open" | "contained";
  /** Use wider lanes and more room between card details for a project portfolio. */
  cardLayout?: "compact" | "project";
  /** Card mode adds mouse and pen pickup from the noninteractive card surface. */
  dragActivation?: "handle" | "card";
  /** Makes enabled card titles open host-owned details. Moving a card is a separate action. */
  onCardOpen?: (card: KanbanCardData) => void;
  onMove: (move: KanbanMove, input: "keyboard" | "pointer" | "menu") => void | string;
  canMove?: (move: KanbanMove) => boolean;
  labels?: KanbanBoardLabels;
  showCounts?: boolean;
  disabled?: boolean;
}
/** A controlled board that proposes card placements within and across columns. @since 0.2.14 */
export const KanbanBoard = /* @__PURE__ */ forwardRef<HTMLDivElement,KanbanBoardProps>(function KanbanBoard(props,ref) {
  return <KanbanCollection {...props} ref={ref} />;
});

export interface NotificationListProps extends DataListProps {
  label: string;
  /** Preserve the media column when a filtered group has no visible artwork. */
  reserveMediaSpace?: boolean;
}

/** A named inbox list that keeps notification rows on shared tracks. */
export const NotificationList = /* @__PURE__ */ forwardRef<HTMLUListElement, NotificationListProps>(function NotificationList(
  {label, density = "compact", dividers = false, reserveMediaSpace = false, className, ...props}, ref,
) {
  return <DataList {...props} ref={ref} density={density} dividers={dividers} aria-label={label}
    data-reserve-media={reserveMediaSpace || undefined} className={classes("flood-notification-list", className)} />;
});

export interface NotificationItemProps extends Omit<DataListItemProps, "title" | "metadata" | "layout"> {
  title: string;
  href?: string;
  linkProps?: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children">;
  unread?: boolean;
  unreadLabel?: string;
  timeLabel?: string;
  dateTime?: string;
  onUnreadChange?: (unread: boolean) => void;
  markReadLabel?: string;
  markUnreadLabel?: string;
}

/** A persistent notification with a native destination and independent read control. */
export const NotificationItem = /* @__PURE__ */ forwardRef<HTMLLIElement, NotificationItemProps>(function NotificationItem(
  {title, href, linkProps, media, unread = false, unreadLabel = "Unread", timeLabel, dateTime, onUnreadChange,
    markReadLabel = "Mark as read", markUnreadLabel = "Mark as unread", actions, className, ...props}, ref,
) {
  const unreadId = useId();
  const timestamp = timeLabel && (dateTime ? <Timestamp dateTime={dateTime}>{timeLabel}</Timestamp> : <span>{timeLabel}</span>);
  const readLabel = unread ? markReadLabel : markUnreadLabel;
  return <DataListItem {...props} ref={ref} className={classes("flood-notification-item", className)} data-unread={unread}
    data-has-media={hasFieldContent(media) || undefined}
    media={<span className="flood-notification-item__leading">
      <CountBadge className="flood-notification-item__dot" count={unread ? 1 : 0} presentation="dot" aria-hidden="true" />
      <span className="flood-notification-item__media">{media}</span>
    </span>}
    title={<>
      {unread && <VisuallyHidden id={unreadId}>{unreadLabel}</VisuallyHidden>}
      {href ? <Link {...linkProps} href={href} aria-describedby={mergeDescriptions(linkProps?.["aria-describedby"], unread && unreadId)}>{title}</Link> : title}
    </>}
    metadata={timestamp}
    actions={onUnreadChange || hasFieldContent(actions) ? <>
      {onUnreadChange && <IconButton type="button" size="xs" variant="ghost" label={readLabel} title={readLabel}
        data-notification-read-action onClick={() => onUnreadChange(!unread)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          {unread ? <path d="m5 12 4 4L19 6" /> : <circle cx="12" cy="12" r="4" />}
        </svg>
      </IconButton>}
      {actions}
    </> : undefined} />;
});

export type NotificationInboxFilter = "all" | "unread";

export interface NotificationInboxItem extends Omit<NotificationItemProps, "id" | "onUnreadChange"> {
  id: string;
}

export interface NotificationInboxProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  items: readonly NotificationInboxItem[];
  filter?: NotificationInboxFilter;
  defaultFilter?: NotificationInboxFilter;
  onFilterChange?: (filter: NotificationInboxFilter) => void;
  onUnreadChange?: (id: string, unread: boolean) => void;
  onMarkAllRead?: () => void;
  markingAllRead?: boolean;
  state?: "ready" | "loading" | "error";
  loadingPlaceholder?: Pick<ListSkeletonProps, "media" | "description" | "metadata"> & Pick<NotificationListSkeletonProps, "rows">;
  onRetry?: () => void;
  retrying?: boolean;
  density?: NotificationListProps["density"];
  /** Condensed rows for an inbox inside a floating surface. */
  appearance?: "default" | "overlay";
  /** Limit the scrollable body while keeping the filter and actions visible. Overlay inboxes are bounded by default. */
  maxListHeight?: CSSProperties["maxBlockSize"];
  labels?: {
    filter?: string;
    all?: string;
    unread?: string;
    markAllRead?: string;
    empty?: string;
    caughtUp?: string;
    loading?: string;
    error?: string;
    retry?: string;
  };
}

/** A notification list with an unread filter and host-owned read actions. */
export const NotificationInbox = /* @__PURE__ */ forwardRef<HTMLDivElement, NotificationInboxProps>(function NotificationInbox(props, ref) {
  return <InboxContent {...props} ref={ref} />;
});

export interface RecordSelection {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}
export type DataListItemSelection = RecordSelection;

function RecordCheckbox({selection, className}: {selection: RecordSelection; className?: string}) {
  if (!selection.label.trim()) throw new Error("Flood record selection needs a label");
  return <Checkbox label={selection.label} hideLabel className={className}
    checked={selection.checked} disabled={selection.disabled}
    onChange={event => selection.onCheckedChange(event.currentTarget.checked)} />;
}

export interface DataListItemProps extends Omit<HTMLAttributes<HTMLLIElement>, "title" | "children"> {
  title: ReactNode;
  description?: ReactNode;
  /** Supporting facts grouped with the title and description on the leading edge. */
  details?: ReactNode;
  media?: ReactNode;
  metadata?: ReactNode;
  actions?: ReactNode;
  /** Independent checkbox for host-owned bulk selection. */
  selection?: DataListItemSelection;
  /** Anchor multiline content at the top and reflow trailing actions within a narrow DataList. */
  layout?: "row" | "content";
}
/** A structured list row, never an interactive wrapper. @since 0.2.8 */
export const DataListItem = /* @__PURE__ */ forwardRef<HTMLLIElement,DataListItemProps>(function DataListItem({title,description,details,media,metadata,actions,selection,layout,className,...props},ref){
  return <li {...props} ref={ref} data-layout={layout}
    {...(selection && {"data-selectable":true,"data-selected":selection.checked || undefined})}
    className={classes("flood-data-list-item",className)}>
    {selection && <RecordCheckbox selection={selection} className="flood-data-list-item__selection" />}
    {hasFieldContent(media)&&<div className="flood-data-list-item__media">{media}</div>}
    <div className="flood-data-list-item__copy"><div className="flood-data-list-item__title">{title}</div>
      {hasFieldContent(description)&&<div className="flood-data-list-item__description">{description}</div>}
      {hasFieldContent(details)&&<div className="flood-data-list-item__details">{details}</div>}
    </div>
    {(hasFieldContent(metadata)||hasFieldContent(actions))&&<div className="flood-data-list-item__trailing">
      {hasFieldContent(metadata)&&<div className="flood-data-list-item__metadata">{metadata}</div>}
      {hasFieldContent(actions)&&<div className="flood-data-list-item__actions">{actions}</div>}
    </div>}
  </li>;
});

export type RecordRelationSuggestionDecision = "accept" | "dismiss";

export interface RecordRelationSuggestionProps extends Omit<HTMLAttributes<HTMLLIElement>, "title" | "children"> {
  title: string;
  reference?: string;
  href?: string;
  relation: string;
  reason?: string;
  onDecision: (decision: RecordRelationSuggestionDecision) => void;
  pendingDecision?: RecordRelationSuggestionDecision;
  error?: string;
  labels?: {accept?: string; dismiss?: string};
}

/** Review a proposed record relationship alongside its source and rationale. @since 0.2.14 */
export const RecordRelationSuggestion = /* @__PURE__ */ forwardRef<HTMLLIElement, RecordRelationSuggestionProps>(function RecordRelationSuggestion(
  {title, reference, href, relation, reason, onDecision, pendingDecision, error, labels, ...props}, ref,
) {
  const recordId = useId();
  const identity = <Inline gap="2" align="baseline">
    {href ? <Link href={href} dir="auto">{title}</Link> : <bdi>{title}</bdi>}
    {reference && <Text as="span" size="helper" tone="subtle" dir="auto">{reference}</Text>}
  </Inline>;

  return <DataListItem {...props} ref={ref} layout="content"
    title={<Stack gap="1" id={recordId}>
      <Text as="span" size="helper" tone="subtle" dir="auto">{relation}</Text>
      {identity}
    </Stack>}
    description={reason && <Text as="span" size="compact" tone="subtle" dir="auto">{reason}</Text>}
    details={error && <Text as="span" size="compact" tone="error" role="alert" dir="auto">{error}</Text>}
    actions={<Inline gap="1" align="center">
      <Button size="sm" variant="subtle" aria-describedby={recordId}
        loading={pendingDecision === "accept" ? "retain-focus" : false}
        disabled={pendingDecision === "dismiss"} onClick={() => onDecision("accept")}>
        {labels?.accept ?? "Accept"}
      </Button>
      <Button size="sm" variant="ghost" aria-describedby={recordId}
        loading={pendingDecision === "dismiss" ? "retain-focus" : false}
        disabled={pendingDecision === "accept"} onClick={() => onDecision("dismiss")}>
        {labels?.dismiss ?? "Dismiss"}
      </Button>
    </Inline>}
  />;
});

export interface RecordMergeIdentity {
  id: string;
  title: string;
  /** A public-facing identifier, such as an issue number. */
  reference?: string;
  href?: string;
}

export interface RecordMergeReviewProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** The record that will be merged into the destination. */
  source: RecordMergeIdentity;
  /** The record that will remain canonical. */
  destination: RecordMergeIdentity;
  /** Describe what this particular merge does to related data. */
  consequence?: string;
  pending?: boolean;
  error?: string;
  onMerge: (sourceId: string, destinationId: string) => void;
  onCancel: () => void;
  labels?: {source?: string; destination?: string; merge?: string; cancel?: string};
}

/** Verify the direction and consequence of a record merge before committing. @since 0.2.14 */
export const RecordMergeReview = /* @__PURE__ */ forwardRef<HTMLDivElement, RecordMergeReviewProps>(function RecordMergeReview(
  {source, destination, consequence, pending = false, error, onMerge, onCancel, labels, ...props}, ref,
) {
  if ([source, destination].some(record => !record.id.trim() || !record.title.trim()) || source.id === destination.id) {
    throw new Error("Flood RecordMergeReview requires two distinct named records");
  }
  const consequenceId = useId();
  const identity = (record: RecordMergeIdentity) => <Stack gap="0">
    {record.href ? <Link href={record.href} dir="auto">{record.title}</Link> : <Text size="label" dir="auto">{record.title}</Text>}
    {record.reference && <Text size="helper" tone="subtle" dir="auto">{record.reference}</Text>}
  </Stack>;
  return <Stack {...props} ref={ref} gap="4">
    <DescriptionList layout="columns" items={[
      {id:"source", term:labels?.source ?? "Merge from", description:identity(source)},
      {id:"destination", term:labels?.destination ?? "Keep", description:identity(destination)},
    ]} />
    {consequence && <Text as="p" size="compact" tone="subtle" id={consequenceId}>{consequence}</Text>}
    {error && <Text as="p" size="compact" tone="error" role="alert">{error}</Text>}
    <FormActions
      secondary={<Button size="sm" type="button" variant="subtle" disabled={pending} onClick={onCancel}>{labels?.cancel ?? "Cancel"}</Button>}
      primary={<Button size="sm" type="button" loading={pending ? "retain-focus" : false}
        aria-describedby={consequence ? consequenceId : undefined}
        onClick={() => {if (!pending) onMerge(source.id, destination.id);}}>{labels?.merge ?? "Merge records"}</Button>}
    />
  </Stack>;
});

export interface SearchResultItemProps extends Omit<HTMLAttributes<HTMLLIElement>, "title" | "children"> {
  title: string;
  href: string;
  /** A short identifier or location that distinguishes this record. */
  context?: string;
  /** A literal match to highlight in the title and excerpt. */
  query?: string;
  excerpt?: {
    text: string;
    /** Name the matching field when it adds context, such as Comment. */
    source?: string;
    /** Override the title query when the service identifies a different literal match here. */
    query?: string;
  };
}

/** A result link with enough matching context to decide whether to open it. @since 0.2.14 */
export const SearchResultItem = /* @__PURE__ */ forwardRef<HTMLLIElement, SearchResultItemProps>(function SearchResultItem(
  { title, href, context, query = "", excerpt, className, ...props }, ref,
) {
  if (!title.trim() || !href.trim()) throw new Error("Flood SearchResultItem requires a title and destination");
  return <DataListItem {...props} ref={ref} layout="content" className={classes("flood-search-result-item", className)}
    title={<Inline gap="2" align="baseline">
      <Link href={href} dir="auto"><HighlightText query={query}>{title}</HighlightText></Link>
      {context && <Text as="span" size="helper" tone="subtle" dir="auto">{context}</Text>}
    </Inline>}
    description={excerpt?.text && <Text as="span" size="compact" tone="subtle" dir="auto">
      {excerpt.source && <><Text as="span" size="helper" tone="subtle" dir="auto">{excerpt.source}</Text>{" · "}</>}
      <HighlightText query={excerpt.query ?? query} dir="auto">{excerpt.text}</HighlightText>
    </Text>} />;
});

export interface StackSourceLine {
  line: number;
  text: string;
}
export interface StackFrameData {
  id: string;
  functionName?: string;
  path?: string;
  /** One-based location in the supplied source. */
  line?: number;
  column?: number;
  /** Optional display-ready surrounding lines, in original source order. */
  source?: readonly StackSourceLine[];
}
export interface StackFrameLabels {
  anonymous?: string;
  source?: string;
  showSource?: string;
  hideSource?: string;
  currentLine?: string;
}
export interface StackFrameProps extends Omit<HTMLAttributes<HTMLLIElement>, "children"> {
  frame: StackFrameData;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  labels?: StackFrameLabels;
}
/** The function and source location of a single call frame. */
export const StackFrame = /* @__PURE__ */ forwardRef<HTMLLIElement, StackFrameProps>(function StackFrame({
  defaultOpen = false, ...props
}, ref) {
  return <TraceFrame {...props} ref={ref} defaultOpen={defaultOpen} />;
});
export interface StackTraceProps extends Omit<DataListProps, "children"> {
  label: string;
  frames: readonly StackFrameData[];
  openIds?: readonly string[];
  defaultOpenIds?: readonly string[];
  onOpenIdsChange?: (ids: string[]) => void;
  labels?: StackFrameLabels;
  emptyLabel?: string;
}
/** A host-ordered list of call frames with independent source disclosure. */
export const StackTrace = /* @__PURE__ */ forwardRef<HTMLUListElement, StackTraceProps>(function StackTrace({
  defaultOpenIds = [], emptyLabel = "No stack frames.", density = "compact", dividers = false, ...props
}, ref) {
  return <TraceList {...props} ref={ref} defaultOpenIds={defaultOpenIds} emptyLabel={emptyLabel} density={density} dividers={dividers} />;
});

export interface DependencyGraphNode {
  id: string;
  label: string;
  description?: string;
  /** IDs of prerequisite nodes. */
  dependsOn?: readonly string[];
  status?: { label: string; tone?: SemanticTone };
  href?: string;
}
export interface DependencyGraphProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onSelect"> {
  label: string;
  nodes: readonly DependencyGraphNode[];
  presentation?: "graph" | "list";
  activeId?: string;
  onNodeActivate?: (id: string) => void;
  maxViewportHeight?: CSSProperties["maxBlockSize"];
  emptyLabel?: string;
  formatDependencies?: (labels: readonly string[]) => string;
}
/** A dependency map with an equivalent list of the same nodes and relationships. */
export const DependencyGraph = /* @__PURE__ */ forwardRef<HTMLDivElement, DependencyGraphProps>(function DependencyGraph({
  presentation = "graph", emptyLabel = "No dependencies to show.", ...props
}, ref) {
  return <WorkflowDependencies {...props} ref={ref} presentation={presentation} emptyLabel={emptyLabel} />;
});

export interface RecordRelationItem {
  id: string;
  title: string;
  /** Optional reference the reader can use to find the record, such as an issue ID. */
  reference?: string;
  href?: string;
  status?: Pick<StatusIndicatorProps, "label" | "tone">;
}

export interface RecordRelationGroup {
  id: string;
  /** The relationship to the record being viewed, such as "Blocked by" or "Blocking". */
  label: string;
  items: readonly RecordRelationItem[];
}

export interface RecordRelationsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  groups: readonly RecordRelationGroup[];
  groupHeadingLevel?: HeadingProps["level"];
  emptyContent?: ReactNode;
}

/** A record's direct relationships, grouped by their meaning to the reader. */
export const RecordRelations = /* @__PURE__ */ forwardRef<HTMLDivElement, RecordRelationsProps>(function RecordRelations(props, ref) {
  return <RelatedRecords {...props} ref={ref} />;
});

export interface RecordRelationKind {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RecordRelationTarget extends Pick<RecordRelationItem, "id" | "title" | "reference"> {
  /** Restrict this target to particular relation kinds. */
  kindIds?: readonly string[];
  disabled?: boolean;
}

export interface RecordRelationDraft {
  kindId: string;
  targetId: string;
}

export interface RecordRelationFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "children" | "onChange" | "onSubmit"> {
  source: Pick<RecordRelationItem, "id" | "title" | "reference">;
  kinds: readonly RecordRelationKind[];
  targets: readonly RecordRelationTarget[];
  value: RecordRelationDraft;
  onValueChange: (value: RecordRelationDraft) => void;
  onSubmit: (relation: RecordRelationDraft & {sourceId: string}) => void;
  onCancel?: () => void;
  pending?: boolean;
  error?: string;
  labels?: {kind?: string; target?: string; chooseKind?: string; search?: string; empty?: string; submit?: string; cancel?: string};
}

/** Choose a relation from one record to an eligible target. @since 0.2.14 */
export const RecordRelationForm = /* @__PURE__ */ forwardRef<HTMLFormElement, RecordRelationFormProps>(function RecordRelationForm(
  {source, kinds, targets, value, onValueChange, onSubmit, onCancel, pending = false, error, labels, ...props}, ref,
) {
  const eligibleTargets = (kindId: string) => targets.filter(target =>
    target.id !== source.id && (target.kindIds === undefined || target.kindIds.includes(kindId)));
  const kind = kinds.find(item => item.id === value.kindId && !item.disabled);
  const candidates = kind ? eligibleTargets(kind.id) : [];
  const selected = candidates.find(target => target.id === value.targetId && !target.disabled);
  return <form {...props} ref={ref} noValidate aria-busy={pending || undefined} onSubmit={event => {
    event.preventDefault();
    if (!pending && kind && selected) onSubmit({sourceId:source.id,kindId:kind.id,targetId:selected.id});
  }}>
    <Stack gap="4">
      <Inline gap="2" align="baseline">
        {source.reference && <Text size="helper" tone="subtle">{source.reference}</Text>}
        <Text size="compact" dir="auto">{source.title}</Text>
      </Inline>
      <Field label={labels?.kind ?? "Relationship"} required hint={kind?.description}>
        {field => <Select {...field} value={kind?.id ?? ""} disabled={pending} onChange={event => {
          const kindId = event.currentTarget.value;
          const targetId = eligibleTargets(kindId).some(target => !target.disabled && target.id === value.targetId) ? value.targetId : "";
          onValueChange({kindId,targetId});
        }}>
          <option value="" disabled>{labels?.chooseKind ?? "Choose a relationship"}</option>
          {kinds.map(item => <option value={item.id} key={item.id} disabled={item.disabled}>{item.label}</option>)}
        </Select>}
      </Field>
      <Field label={labels?.target ?? "Record"} required>
        {field => <Combobox {...field} value={selected?.id ?? ""} disabled={pending || !kind}
          placeholder={labels?.search ?? "Search by name or ID"} emptyMessage={labels?.empty ?? "No matching records"}
          options={candidates.map(({id,title,reference,disabled}) => ({
            value:id,label:title,description:reference,keywords:reference ? [reference] : undefined,disabled,
          }))} onValueChange={targetId => onValueChange({...value,targetId})} />}
      </Field>
      {error && <Text as="p" size="compact" tone="error" role="alert">{error}</Text>}
      <FormActions
        secondary={onCancel && <Button type="button" variant="ghost" disabled={pending} onClick={onCancel}>{labels?.cancel ?? "Cancel"}</Button>}
        primary={<Button type="submit" disabled={!kind || !selected}
          loading={pending ? "retain-focus" : false}>{labels?.submit ?? "Add relationship"}</Button>} />
    </Stack>
  </form>;
});

export type PipelineStageStatus = "queued" | "running" | "succeeded" | "warning" | "failed" | "skipped" | "canceled";

export interface PipelineStage {
  id: string;
  label: string;
  status: PipelineStageStatus;
  /** Localized elapsed or final duration supplied by the host. */
  duration?: string;
  /** Short, always-visible context for this outcome. */
  description?: string;
  /** Additional context disclosed on demand. Give the trigger a stage-specific name. */
  details?: { label: string; content: ReactNode };
}

export interface PipelineRunProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  stages: readonly PipelineStage[];
  statusLabels?: Partial<Record<PipelineStageStatus, string>>;
  emptyContent?: ReactNode;
}

/** Ordered stage results with visible execution status, duration and optional diagnostics. @since 0.2.14 */
export const PipelineRun = /* @__PURE__ */ forwardRef<HTMLDivElement, PipelineRunProps>(function PipelineRun(props, ref) {
  return <ExecutionStages {...props} ref={ref} />;
});

export type CheckRunStatus = "not-reported" | "queued" | "running" | "passed" | "failed" | "neutral" | "skipped" | "canceled";

export interface CheckRun {
  id: string;
  label: string;
  status: CheckRunStatus;
  /** Whether this specific result is currently blocking the host's operation. */
  blocking?: boolean;
  detail?: string;
  /** Route to the check result, log or other relevant evidence. */
  href?: string;
}

export interface CheckRunListProps extends Omit<DataListProps, "children" | "aria-label"> {
  label: string;
  checks: readonly CheckRun[];
  statusLabels?: Partial<Record<CheckRunStatus, string>>;
  blockingLabel?: string;
  emptyLabel?: string;
}

const checkRunStates = {
  "not-reported": {label:"Not reported",tone:"neutral"},
  queued: {label:"Queued",tone:"neutral"},
  running: {label:"Running",tone:"info"},
  passed: {label:"Passed",tone:"success"},
  failed: {label:"Failed",tone:"error"},
  neutral: {label:"Neutral",tone:"neutral"},
  skipped: {label:"Skipped",tone:"neutral"},
  canceled: {label:"Canceled",tone:"neutral"},
} as const;

/** Parallel verification results with host-reported blockers and links to evidence. @since 0.2.14 */
export const CheckRunList = /* @__PURE__ */ forwardRef<HTMLUListElement, CheckRunListProps>(function CheckRunList(
  {label, checks, statusLabels, blockingLabel = "Blocking", emptyLabel = "No checks reported.",
    density = "compact", dividers = false, className, ...props}, ref,
) {
  return <DataList {...props} ref={ref} aria-label={label} density={density} dividers={dividers}
    className={classes("flood-check-run-list", className)}>
    {checks.length ? checks.map(check => {
      const {label:fallback, tone} = checkRunStates[check.status];
      const name = check.href ? <Link href={check.href}>{check.label}</Link> : check.label;
      return <DataListItem key={check.id} className="flood-check-run-list__row"
        title={check.blocking ? <Inline gap="2">{name}<Badge size="sm" variant="outline">{blockingLabel}</Badge></Inline> : name}
        description={check.detail}
        metadata={<StatusIndicator size="sm" tone={tone} label={statusLabels?.[check.status] ?? fallback}/>} />;
    }) : <DataListItem title={<Text size="compact" tone="subtle">{emptyLabel}</Text>} />}
  </DataList>;
});

export type EvidenceRequirementState = "missing" | "requested" | "received" | "accepted" | "waived";

export interface EvidenceRequirement {
  id: string;
  label: string;
  state: EvidenceRequirementState;
  /** Explain what is needed, or what was received or waived. */
  detail?: string;
  /** Destination for the submitted evidence, when the viewer may open it. */
  href?: string;
}

export interface EvidenceChecklistProps extends Omit<DataListProps, "children" | "aria-label" | "reserveSelectionSpace"> {
  label: string;
  requirements: readonly EvidenceRequirement[];
  stateLabels?: Partial<Record<EvidenceRequirementState, string>>;
  renderAction?: (requirement: EvidenceRequirement) => ReactNode;
  emptyLabel?: string;
}

const evidenceRequirementStates = {
  missing: {label:"Missing",tone:"warning"},
  requested: {label:"Requested",tone:"info"},
  received: {label:"Received",tone:"neutral"},
  accepted: {label:"Accepted",tone:"success"},
  waived: {label:"Waived",tone:"neutral"},
} as const;

/** Track supporting material independently of a request's approval decision. @since 0.2.14 */
export const EvidenceChecklist = /* @__PURE__ */ forwardRef<HTMLUListElement,EvidenceChecklistProps>(function EvidenceChecklist(
  {label, requirements, stateLabels, renderAction, emptyLabel = "No evidence required",
    density = "compact", dividers = false, className, ...props}, ref,
) {
  if (!label.trim() || requirements.some(requirement => !requirement.id.trim() || !requirement.label.trim()) ||
      new Set(requirements.map(requirement => requirement.id)).size !== requirements.length) {
    throw new Error("Flood EvidenceChecklist requires a label and uniquely identified, named requirements");
  }
  return <DataList {...props} ref={ref} aria-label={label} density={density} dividers={dividers}
    className={classes("flood-evidence-checklist", className)}>
    {requirements.length ? requirements.map(requirement => {
      const {label:fallback, tone} = evidenceRequirementStates[requirement.state];
      return <DataListItem key={requirement.id} layout="content"
        title={requirement.href ? <Link href={requirement.href} dir="auto">{requirement.label}</Link> : <bdi>{requirement.label}</bdi>}
        description={requirement.detail}
        details={renderAction?.(requirement)}
        metadata={<StatusIndicator size="sm" tone={tone} label={stateLabels?.[requirement.state] ?? fallback} />}
      />;
    }) : <DataListItem title={<Text size="compact" tone="subtle">{emptyLabel}</Text>} />}
  </DataList>;
});

export type ScheduledTaskState = "active" | "paused" | "completed" | "unavailable";

export type ScheduledTaskTrigger =
  | {kind:"schedule"; label:string; nextRun?: Pick<TimestampProps,"dateTime" | "timeZone" | "children">}
  | {kind:"event"; label:string; nextRun?: never};

export interface ScheduledTaskRecord {
  id: string;
  label: string;
  href?: string;
  state: ScheduledTaskState;
  trigger: ScheduledTaskTrigger;
}

export interface ScheduledTaskListProps extends Omit<DataListProps,"children" | "aria-label" | "reserveSelectionSpace"> {
  label: string;
  tasks: readonly ScheduledTaskRecord[];
  renderAction?: (task:ScheduledTaskRecord) => ReactNode;
  labels?: {states?: Partial<Record<ScheduledTaskState,string>>; nextRun?: string; empty?: string};
}

const scheduledTaskStates = {
  active:{label:"Active",tone:"success"},
  paused:{label:"Paused",tone:"warning"},
  completed:{label:"Completed",tone:"neutral"},
  unavailable:{label:"Unavailable",tone:"neutral"},
} as const;

/** Review time- and event-triggered tasks and their current lifecycle state. @since 0.2.14 */
export const ScheduledTaskList = /* @__PURE__ */ forwardRef<HTMLUListElement,ScheduledTaskListProps>(function ScheduledTaskList(
  {label,tasks,renderAction,labels,density="compact",dividers=false,className,...props}, ref,
) {
  if (!label.trim() || tasks.some(task=>!task.id.trim() || !task.label.trim() || !task.trigger.label.trim()) ||
      new Set(tasks.map(task=>task.id)).size !== tasks.length) {
    throw new Error("Flood ScheduledTaskList requires a label and uniquely identified, named tasks with named triggers");
  }
  return <DataList {...props} ref={ref} aria-label={label} density={density} dividers={dividers}
    className={classes("flood-scheduled-task-list",className)}>
    {tasks.length ? tasks.map(task => {
      const status = scheduledTaskStates[task.state];
      const nextRun = task.state === "active" && task.trigger.kind === "schedule" ? task.trigger.nextRun : undefined;
      return <DataListItem key={task.id} layout="content"
        title={task.href ? <Link href={task.href} dir="auto">{task.label}</Link> : <bdi>{task.label}</bdi>}
        description={<Stack gap="1">
          <Text size="compact" tone="subtle" dir="auto">{task.trigger.label}</Text>
          {nextRun && <Inline gap="1" align="baseline">
            <Text size="helper" tone="subtle">{labels?.nextRun ?? "Next run"}</Text>
            <Timestamp format="date-time" {...nextRun} />
          </Inline>}
        </Stack>}
        details={renderAction?.(task)}
        metadata={<StatusIndicator size="sm" label={labels?.states?.[task.state] ?? status.label} tone={status.tone} />}
      />;
    }) : <DataListItem title={<Text size="compact" tone="subtle">{labels?.empty ?? "No scheduled tasks"}</Text>} />}
  </DataList>;
});

type StartedScheduleRunStatus = "running" | "succeeded" | "failed" | "canceled";
export type ScheduledRunStatus = StartedScheduleRunStatus | "skipped";

export type ScheduledRunRecord = {
  id: string;
  href?: string;
  /** A display-safe explanation, such as the cause of a failure or skip. */
  detail?: string;
} & (
  | {status: StartedScheduleRunStatus; trigger: "schedule" | "manual"; startedAt: string; durationMs?: number; scheduledFor?: never}
  | {status: "skipped"; scheduledFor: string; trigger?: never; startedAt?: never; durationMs?: never}
);

export interface ScheduledRunHistoryProps extends Omit<DataListProps, "children" | "aria-label" | "reserveSelectionSpace"> {
  label: string;
  runs: readonly ScheduledRunRecord[];
  timeZone?: string;
  labels?: {
    statuses?: Partial<Record<ScheduledRunStatus, string>>;
    scheduled?: string;
    manual?: string;
    scheduledFor?: string;
    elapsed?: string;
    empty?: string;
  };
}

const scheduledRunStatuses = {
  running: {label:"Running",tone:"info"},
  succeeded: {label:"Succeeded",tone:"success"},
  failed: {label:"Failed",tone:"error"},
  canceled: {label:"Canceled",tone:"neutral"},
  skipped: {label:"Skipped",tone:"warning"},
} as const;

/** Inspect actual and skipped executions of a scheduled job. @since 0.2.14 */
export const ScheduledRunHistory = /* @__PURE__ */ forwardRef<HTMLUListElement, ScheduledRunHistoryProps>(function ScheduledRunHistory(
  {label, runs, timeZone = "UTC", lang = "en", labels, density = "compact", dividers = false, className, ...props}, ref,
) {
  if (!label.trim() || runs.some(run => !run.id.trim()) || new Set(runs.map(run => run.id)).size !== runs.length) {
    throw new Error("Flood ScheduledRunHistory requires a name and unique run IDs");
  }
  const formatTime = new Intl.DateTimeFormat(lang, {
    timeZone, month:"short", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit", timeZoneName:"short",
  });

  return <DataList {...props} ref={ref} aria-label={label} lang={lang} density={density} dividers={dividers}
    className={classes("flood-scheduled-run-history", className)}>
    {runs.length ? runs.map(run => {
      const state = scheduledRunStatuses[run.status];
      const skipped = run.status === "skipped";
      const dateTime = skipped ? run.scheduledFor : run.startedAt;
      const formattedTime = formatTime.format(parseInstant(dateTime, "ScheduledRunHistory"));
      const context = skipped ? labels?.scheduledFor ?? "Scheduled for"
        : run.trigger === "manual" ? labels?.manual ?? "Manual" : labels?.scheduled ?? "Scheduled";
      return <DataListItem key={run.id} layout="content"
        title={<Inline gap="2" align="baseline">
          {run.href ? <TimestampLink href={run.href} dateTime={dateTime} size="compact">{formattedTime}</TimestampLink>
            : <Timestamp dateTime={dateTime} size="compact" className="flood-scheduled-run-history__time">{formattedTime}</Timestamp>}
          <Text size="helper" tone="subtle">{context}</Text>
        </Inline>}
        description={run.detail && <Text size="compact" tone="subtle" dir="auto" style={{overflowWrap:"anywhere"}}>{run.detail}</Text>}
        details={run.durationMs !== undefined && <Inline gap="1" align="baseline">
          {run.status === "running" && <Text size="helper" tone="subtle">{labels?.elapsed ?? "Elapsed"}</Text>}
          <Duration milliseconds={run.durationMs} unit={run.durationMs < 60_000 ? "second" : "minute"} maximumFractionDigits={1} lang={lang} />
        </Inline>}
        metadata={<StatusIndicator size="sm" presentation="wrap" label={labels?.statuses?.[run.status] ?? state.label} tone={state.tone} />}
      />;
    }) : <DataListItem title={<Text size="compact" tone="subtle">{labels?.empty ?? "No runs yet."}</Text>} />}
  </DataList>;
});

export type DeliveryAttemptStatus = "pending" | "delivered" | "failed";

export interface DeliveryAttempt {
  id: string;
  /** One-based attempt number from the delivery record. */
  number: number;
  /** An ISO timestamp with an explicit offset. */
  dateTime: string;
  /** Optional formatted time in the destination's support context. */
  timeLabel?: string;
  status: DeliveryAttemptStatus;
  /** The receiver response or delivery error in one short line. */
  response?: string;
  details?: { label: string; content: ReactNode };
}

export interface DeliveryAttemptsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  attempts: readonly DeliveryAttempt[];
  timeZone?: string;
  statusLabels?: Partial<Record<DeliveryAttemptStatus, string>>;
  formatAttemptLabel?: (number: number) => string;
  /** One host-owned redelivery action scoped to the event and destination. */
  retryAction?: ReactNode;
  emptyContent?: ReactNode;
}

/** Review repeated attempts to deliver one event to a destination. @since 0.2.14 */
export const DeliveryAttempts = /* @__PURE__ */ forwardRef<HTMLDivElement, DeliveryAttemptsProps>(function DeliveryAttempts(props, ref) {
  return <DeliveryAttemptList {...props} ref={ref} />;
});

export type RetryScheduleStatus =
  | {
      state: "scheduled";
      /** Explicitly zoned ISO instant, if the service exposes one. */
      nextAt?: string;
      /** Automatic attempts still available, including the scheduled one. */
      remaining?: number;
    }
  | { state: "exhausted"; nextAt?: never; remaining?: never };

export type RetryScheduleProps = Omit<InlineProps, "children" | "gap" | "align"> & RetryScheduleStatus & {
  timeZone?: string;
  /** Explicitly zoned reference instant for relative time. */
  relativeTo?: string;
  labels?: {
    scheduled?: string;
    exhausted?: string;
    formatRemaining?: (remaining: number) => string;
  };
};

/** Present the service's automatic retry decision for a failed operation. @since 0.2.14 */
export const RetrySchedule = /* @__PURE__ */ forwardRef<HTMLDivElement, RetryScheduleProps>(function RetrySchedule(
  { state, nextAt, remaining, relativeTo, timeZone, labels, lang, dir, ...props }, ref,
) {
  if (remaining !== undefined && (!Number.isSafeInteger(remaining) || remaining < 1)) {
    throw new Error("Flood RetrySchedule requires a positive whole number of remaining attempts");
  }
  const scheduled = state === "scheduled";
  const label = scheduled ? labels?.scheduled ?? "Automatic retry scheduled" : labels?.exhausted ?? "Automatic retries exhausted";
  return <Inline {...props} ref={ref} lang={lang} dir={dir} gap="2" align="center">
    <StatusIndicator size="sm" label={label} tone={scheduled ? "info" : "warning"} presentation="wrap" />
    {scheduled && nextAt && <Timestamp dateTime={nextAt} format="date-time" relativeTo={relativeTo}
      showExactTime timeZone={timeZone} lang={lang} dir={dir} />}
    {scheduled && remaining !== undefined && <Text as="span" size="helper" tone="subtle">
      {labels?.formatRemaining?.(remaining) ??
        `${new Intl.NumberFormat(lang || "en").format(remaining)} ${remaining === 1 ? "attempt" : "attempts"} left`}
    </Text>}
  </Inline>;
});

export type LogSeverity = "debug" | "info" | "warning" | "error";

export interface LogEntry {
  id: string;
  /** ISO timestamp with an explicit offset. */
  dateTime: string;
  severity: LogSeverity;
  message: string;
  source?: string;
  /** Display text approved for viewers. Any redaction is owned by the host. */
  payload?: string;
}
export interface MediaTranscriptCue {
  id: string;
  text: string;
  /** Start time in seconds. Supply cues in chronological order. */
  start: number;
  end?: number;
}
export interface MediaTranscriptProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  cues: readonly MediaTranscriptCue[];
  /** Playback time in seconds, supplied by the host player. */
  currentTime: number;
  onSeek: (time: number, cue: MediaTranscriptCue) => void;
  maxViewportHeight?: CSSProperties["maxBlockSize"];
  defaultFollowing?: boolean;
  /** Highlight a literal search query while keeping surrounding cues visible. */
  query?: string;
  labels?: { pause?: string; follow?: string; empty?: string };
}
/** Timeline-synced transcript with playback navigation. @since 0.2.14 */
export const MediaTranscript = /* @__PURE__ */ forwardRef<HTMLDivElement, MediaTranscriptProps>(function MediaTranscript(props,ref) {
  return <SynchronizedTranscript {...props} ref={ref} />;
});

export interface MediaChapter {
  id: string;
  label: string;
  /** Start time in seconds. Supply nonnegative starts in strictly increasing order. */
  start: number;
  /** Decorative preview of the chapter. The label identifies the destination. */
  thumbnail?: Pick<ImageProps, "srcSet" | "sizes"> & { src: string };
}

export interface MediaChapterListProps extends Omit<DataListProps, "children" | "density" | "dividers" | "reserveSelectionSpace"> {
  label: string;
  chapters: readonly MediaChapter[];
  /** The accepted player position. Omit to render the list without an active chapter. */
  currentTime?: number;
  onSeek: (time: number) => void;
  disabled?: boolean;
  formatTime?: (time: number) => string;
}

/** Navigate the named sections of an audio or video recording. */
export const MediaChapterList = /* @__PURE__ */ forwardRef<HTMLUListElement, MediaChapterListProps>(function MediaChapterList(
  { label, chapters, currentTime, onSeek, disabled, formatTime = mediaTimeLabel, className, ...props }, ref,
) {
  if (!label.trim() || new Set(chapters.map(chapter => chapter.id)).size !== chapters.length ||
      chapters.some((chapter, index) => !chapter.id.trim() || !chapter.label.trim() ||
        !Number.isFinite(chapter.start) || chapter.start < 0 || (index > 0 && chapter.start <= chapters[index - 1].start))) {
    throw new Error("Flood MediaChapterList requires a label, unique chapter IDs and increasing nonnegative starts");
  }
  if (!chapters.length) return null;
  const showsThumbnails = chapters.some(chapter => chapter.thumbnail);
  return <DataList {...props} ref={ref} aria-label={label} density="compact" dividers={false}
    className={classes("flood-media-chapters", className)} data-thumbnails={showsThumbnails || undefined}>
    {chapters.map(({id, label: title, start, thumbnail}, index) => {
      const current = currentTime !== undefined && Number.isFinite(currentTime) &&
        currentTime >= start && currentTime < (chapters[index + 1]?.start ?? Infinity);
      return <li key={id}>
        <Button type="button" size="sm" variant={current ? "subtle" : "ghost"} aria-current={current ? "time" : undefined}
          className="flood-media-chapters__chapter" disabled={disabled} onClick={() => onSeek(start)}>
          {showsThumbnails && (thumbnail
            ? <Image {...thumbnail} className="flood-media-chapters__thumbnail" alt="" loading="lazy" />
            : <span className="flood-media-chapters__thumbnail" aria-hidden="true" />)}
          <span className="flood-media-chapters__title">{title}</span>
          <time dateTime={`PT${start}S`} dir="ltr">{formatTime(start)}</time>
        </Button>
      </li>;
    })}
  </DataList>;
});

export interface LogRowProps extends Omit<HTMLAttributes<HTMLLIElement>, "children"> {
  entry: LogEntry;
  timeZone?: string;
  severityLabel?: string;
  showPayloadLabel?: string;
  hidePayloadLabel?: string;
  copyLabel?: string;
  onPayloadOpenChange?: (open: boolean) => void;
}

/** Renders an event and an independent disclosure for its optional payload. @since 0.2.14 */
export const LogRow = /* @__PURE__ */ forwardRef<HTMLLIElement, LogRowProps>(function LogRow(props, ref) {
  return <StreamLogRow {...props} ref={ref}/>;
});

export interface LogContextBoundary {
  onLoad: () => void;
  pending?: boolean;
  exhausted?: boolean;
  error?: string;
}

export interface LogContextProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  anchor: LogEntry;
  before: readonly LogEntry[];
  after: readonly LogEntry[];
  earlier?: LogContextBoundary;
  later?: LogContextBoundary;
  labels?: {earlier?: string; later?: string; earliest?: string; latest?: string};
  timeZone?: string;
  maxViewportHeight?: CSSProperties["maxBlockSize"];
}

/** Read surrounding log entries while keeping the selected event anchored. @since 0.2.14 */
export const LogContext = /* @__PURE__ */ forwardRef<HTMLDivElement, LogContextProps>(function LogContext(
  {maxViewportHeight = "18rem", ...props}, ref,
) {
  return <ContextualLogWindow {...props} maxViewportHeight={maxViewportHeight} ref={ref} />;
});

export interface LiveFollowLabels {
  following?: string;
  paused?: string;
  pause?: string;
  resume?: string;
  formatQueued?: (count: number) => string;
}

export interface LiveFollowControlProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Whether the reader is following the newest entries. */
  following: boolean;
  /** Entries that arrived while paused, if the host can count them. */
  queued?: number;
  onFollowingChange: (following: boolean) => void;
  disabled?: boolean;
  labels?: LiveFollowLabels;
}

/** Pause or resume following new entries without moving keyboard focus. @since 0.2.14 */
export const LiveFollowControl = /* @__PURE__ */ forwardRef<HTMLDivElement, LiveFollowControlProps>(function LiveFollowControl(
  {following, queued = 0, onFollowingChange, disabled = false, labels, ...props}, ref,
) {
  const label = following ? labels?.pause ?? "Pause"
    : queued > 0 ? labels?.formatQueued?.(queued) ?? `Show ${queued} new`
    : labels?.resume ?? "Follow latest";

  return <Inline gap="3" align="center" {...props} ref={ref}>
    <StatusIndicator size="sm" label={following ? labels?.following ?? "Following" : labels?.paused ?? "Paused"}
      tone={following ? "success" : "neutral"} />
    <Button type="button" size="sm" variant="ghost" disabled={disabled}
      onClick={() => onFollowingChange(!following)}>{label}</Button>
  </Inline>;
});

export interface LogViewerProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onScroll"> {
  label: string;
  /** Append entries in reading order using stable IDs. The host owns transport and retention. */
  entries: readonly LogEntry[];
  maxViewportHeight?: CSSProperties["maxBlockSize"];
  defaultFollowing?: boolean;
  onFollowingChange?: (following: boolean) => void;
  /** Show literal search over the messages in the supplied window of entries. */
  searchable?: boolean;
  findLabels?: FindBarLabels & { group?: string };
  timeZone?: string;
  labels?: LiveFollowLabels & {
    empty?: string;
    showPayload?: string;
    hidePayload?: string;
    copyPayload?: string;
    severity?: Partial<Record<LogSeverity, string>>;
  };
}

/** Follows an append-only view of host entries until the reader scrolls back or pauses. @since 0.2.14 */
export const LogViewer = /* @__PURE__ */ forwardRef<HTMLDivElement, LogViewerProps>(function LogViewer(props, ref) {
  return <StreamLogViewer {...props} ref={ref}/>;
});

export interface TraceSpan {
  id: string;
  label: string;
  /** Milliseconds relative to the host's trace origin. */
  start: number;
  duration: number;
  status?: { label: string; tone?: StatusIndicatorProps["tone"] };
  children?: readonly TraceSpan[];
}

export interface SpanRowProps extends Omit<HTMLAttributes<HTMLLIElement>, "children"> {
  span: Omit<TraceSpan, "children">;
  /** Visible time bounds in milliseconds. The mark is clipped to this window. */
  domain: readonly [number, number];
  formatTime?: (milliseconds: number) => string;
  startLabel?: string;
}

/** A labeled interval on a shared time axis. Render it in DataList. @since 0.2.14 */
export const SpanRow = /* @__PURE__ */ forwardRef<HTMLLIElement, SpanRowProps>(function SpanRow(props, ref) {
  return <TimingSpanRow {...props} ref={ref}/>;
});

export interface TraceWaterfallProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  spans: readonly TraceSpan[];
  /** Omit to fit the whole trace, including collapsed descendants. */
  domain?: readonly [number, number];
  /** Enable span zoom. The host accepts a span ID or null to restore the base domain. */
  zoom?: { spanId: string | null; onChange: (spanId: string | null) => void };
  formatTime?: (milliseconds: number) => string;
  collapsedIds?: readonly string[];
  defaultCollapsedIds?: readonly string[];
  onCollapsedIdsChange?: (ids: string[]) => void;
  maxViewportHeight?: CSSProperties["maxBlockSize"];
  labels?: {
    span?: string;
    duration?: string;
    start?: string;
    empty?: string;
    resetZoom?: string;
    formatDisclosure?: (label: string, expanded: boolean) => string;
    formatZoom?: (label: string) => string;
  };
}

/** Nested operation timings with a shared scale and independent disclosure. @since 0.2.14 */
export const TraceWaterfall = /* @__PURE__ */ forwardRef<HTMLDivElement, TraceWaterfallProps>(function TraceWaterfall(props, ref) {
  return <TimingWaterfall {...props} ref={ref}/>;
});

export interface MetadataItem {
  id: string;
  value: ReactNode;
  icon?: ReactNode;
}

export interface MetadataListProps extends Omit<HTMLAttributes<HTMLUListElement>, "children" | "role" | "aria-label"> {
  label: string;
  items: readonly MetadataItem[];
  size?: "sm" | "md";
}

/** Short supporting facts that wrap together within the content they describe. */
export const MetadataList = /* @__PURE__ */ forwardRef<HTMLUListElement, MetadataListProps>(function MetadataList(
  {label, items, size = "sm", className, ...props}, ref,
) {
  if (!label.trim() || new Set(items.map(item => item.id)).size !== items.length || items.some(item => !item.id.trim())) {
    throw new Error("Flood MetadataList requires a name and unique nonempty item IDs");
  }
  const facts = items.filter(item => hasFieldContent(item.value) && (typeof item.value !== "string" || item.value.trim()));
  if (!facts.length) return null;
  return <ul {...props} ref={ref} role="list" aria-label={label} className={classes("flood-metadata-list", className)} data-size={size}>
    {facts.map(({id, value, icon}) => <li key={id}>
      {hasFieldContent(icon) && <IconSlot size={size === "sm" ? "2xs" : "xs"}>{icon}</IconSlot>}
      <Text size={size === "sm" ? "helper" : "compact"} tone="subtle" className="flood-metadata-list__value">{value}</Text>
    </li>)}
  </ul>;
});

export interface CheckCardProps extends Omit<CheckboxProps,"label" | "children" | "hideLabel"> {
  label: string;
  description?: ReactNode;
  icon?: ReactNode;
  metadata?: ReactNode;
  density?: "compact" | "comfortable";
  indicatorPlacement?: "start" | "end";
}
/** A native checkbox inside a clickable noninteractive content card. @since 0.2.8 */
export const CheckCard = /* @__PURE__ */ forwardRef<HTMLInputElement,CheckCardProps>(function CheckCard(props,ref){return <CheckableCard {...props} ref={ref}/>;});
export interface RadioCardProps extends Omit<ChoiceProps,"label" | "children"> {
  label: string;
  description?: ReactNode;
  icon?: ReactNode;
  metadata?: ReactNode;
  density?: "compact" | "comfortable";
  indicatorPlacement?: CheckCardProps["indicatorPlacement"];
}
/** Give exclusive choices the same native name and an enclosing Fieldset. @since 0.2.8 */
export const RadioCard = /* @__PURE__ */ forwardRef<HTMLInputElement,RadioCardProps>(function RadioCard(props,ref){return <ExclusiveCard {...props} ref={ref}/>;});

export interface ColorSwatchProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "color"> {
  value: string; label: string; size?: "sm" | "md" | "lg";
}
/** @since 0.2.8 */
export const ColorSwatch = /* @__PURE__ */ forwardRef<HTMLSpanElement, ColorSwatchProps>(function ColorSwatch(props, ref) { return <ColorPreview {...props} ref={ref} />; });

export interface ColorContrastProps extends Omit<LayoutProps, "children" | "gap"> {
  /** Opaque sRGB hex values, after compositing against the intended backdrop if needed. */
  foreground: string;
  background: string;
  sample?: string;
  textSize?: "normal" | "large";
  labels?: {ratio?: string; passes?: string; fails?: string};
}

function hexLuminance(hex: string) {
  const linearChannel = (offset: number) => {
    const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linearChannel(1) + 0.7152 * linearChannel(3) + 0.0722 * linearChannel(5);
}

/** Compare two opaque colors against the WCAG AA text contrast threshold. @since 0.2.14 */
export const ColorContrast = /* @__PURE__ */ forwardRef<HTMLDivElement, ColorContrastProps>(function ColorContrast(
  {foreground, background, sample = "Example text", textSize = "normal", labels, lang, className, ...props}, ref,
) {
  const ink = normalizeHexColor(foreground);
  const fill = normalizeHexColor(background);
  if (!ink || !fill) throw new Error("Flood ColorContrast requires two opaque sRGB hex colors");
  const inkLuminance = hexLuminance(ink);
  const fillLuminance = hexLuminance(fill);
  const ratio = (Math.max(inkLuminance, fillLuminance) + 0.05) / (Math.min(inkLuminance, fillLuminance) + 0.05);
  const large = textSize === "large";
  const passes = ratio >= (large ? 3 : 4.5);
  const ratioText = new Intl.NumberFormat(lang || "en", {maximumFractionDigits:2}).format(Math.floor(ratio * 100) / 100);
  return <Stack {...props} ref={ref} lang={lang} gap="2" className={classes("flood-color-contrast", className)}>
    <Text as="p" className="flood-color-contrast__sample" dir="auto" data-text-size={textSize}
      style={{color:ink,backgroundColor:fill}}>{sample}</Text>
    <Inline gap="3" align="baseline">
      <Text size="label"><VisuallyHidden>{labels?.ratio ?? "Contrast ratio"}{" "}</VisuallyHidden><bdi>{ratioText}:1</bdi></Text>
      <StatusIndicator size="sm" presentation="wrap" tone={passes ? "success" : "warning"}
        label={passes ? labels?.passes ?? (large ? "Meets AA for large text" : "Meets AA for normal text")
          : labels?.fails ?? (large ? "Below AA for large text" : "Below AA for normal text")} />
    </Inline>
  </Stack>;
});

export interface ColorPaletteOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export interface ColorPaletteProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "onChange"> {
  label: string;
  options: readonly ColorPaletteOption[];
  value?: string;
  onValueChange: (value: string) => void;
  appearance?: "swatches" | "labeled";
  disabled?: boolean;
  readOnly?: boolean;
}
/** An application-owned choice from a named palette. */
export const ColorPalette = /* @__PURE__ */ forwardRef<HTMLDivElement, ColorPaletteProps>(function ColorPalette(
  {appearance = "swatches", disabled = false, readOnly = false, ...props}, ref,
) { return <PaletteChoices {...props} ref={ref} appearance={appearance} disabled={disabled} readOnly={readOnly} />; });
export interface ColorPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  label: string; hideLabel?: boolean; value?: string; defaultValue?: string;
  onValueChange?: (value: string) => void; name?: string; form?: string;
  required?: boolean; disabled?: boolean; readOnly?: boolean;
  controlSize?: "sm" | "md" | "lg"; presets?: readonly string[]; invalidMessage?: string;
  /** Use embedded when a containing panel already supplies the surface and inset. */
  appearance?: "contained" | "embedded";
  hexLabel?: string; channelLabels?: readonly [string, string, string]; presetsLabel?: string;
  /** Enable an opacity control and emit canonical #rrggbbaa. */
  allowAlpha?: boolean;
  alphaLabel?: string;
  /** Put exact channel sliders under a named disclosure in compact compositions. */
  channelDisclosureLabel?: string;
}
/** @since 0.2.8 */
export const ColorPicker = /* @__PURE__ */ forwardRef<HTMLInputElement, ColorPickerProps>(function ColorPicker(props, ref) { return <ColorEditor {...props} ref={ref} />; });

export interface ColorFilterProps extends Omit<PopoverProps,
  "title" | "trigger" | "children" | "chrome" | "open" | "defaultOpen" | "onOpenChange" | "initialFocusRef" | "focusOnOpen"> {
  label?: string;
  /** The applied opaque sRGB color, or null when the filter is off. */
  value: string | null;
  onValueChange: (value: string | null) => void;
  presets?: readonly string[];
  size?: "sm" | "md" | "lg";
  labels?: {apply?: string; clear?: string; hex?: string; presets?: string; channels?: string;
    channelNames?: readonly [string, string, string]; invalid?: string};
}

/** A color filter with a private draft and an explicit apply action. @since 0.2.14 */
export const ColorFilter = /* @__PURE__ */ forwardRef<HTMLDivElement, ColorFilterProps>(function ColorFilter(
  {label = "Color", value, onValueChange, presets, size = "sm", labels, disabled, className, ...props}, ref,
) {
  const color = value === null ? null : normalizeHexColor(value);
  if (value !== null && !color) throw new Error("Flood ColorFilter requires an opaque RGB hex color or null");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [editorVersion, setEditorVersion] = useState(0);
  const editor = useRef<HTMLInputElement>(null);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  const changeOpen = (next: boolean) => {
    if (next) {
      setDraft(color ?? "");
      setEditorVersion(version => version + 1);
    }
    setOpen(next);
  };
  const apply = () => {
    if (!editor.current?.checkValidity()) {
      editor.current?.focus();
      return;
    }
    setOpen(false);
    if (draft !== color) onValueChange(draft);
  };
  return <Popover {...props} ref={ref} title={label} chrome="title-only" disabled={disabled}
    className={classes("flood-color-filter", className)} open={open && !disabled} onOpenChange={changeOpen}
    initialFocusRef={editor}
    trigger={trigger => <Button {...trigger} size={size} variant="outline" disabled={disabled} className="flood-color-filter__trigger">
      {color && <ColorSwatch value={color} label={color} size="sm" aria-hidden="true" />}
      {label}{color && <> <bdi>{color}</bdi></>}
    </Button>}>
    <Stack gap="3" onKeyDown={event => {
      if (event.target === editor.current && event.key === "Enter" && !event.nativeEvent.isComposing) {
        event.preventDefault();
        apply();
      }
    }}>
      <ColorPicker key={editorVersion} ref={editor} label={label} hideLabel required appearance="embedded" value={draft} onValueChange={setDraft} presets={presets}
        controlSize="sm" hexLabel={labels?.hex} presetsLabel={labels?.presets}
        channelDisclosureLabel={labels?.channels ?? "RGB channels"} channelLabels={labels?.channelNames} invalidMessage={labels?.invalid} />
      <Inline gap="2" style={{justifyContent:"end"}}>
        {color && <Button size="sm" variant="ghost" onClick={() => {
          setOpen(false);
          onValueChange(null);
        }}>{labels?.clear ?? "Clear color"}</Button>}
        <Button size="sm" onClick={apply}>{labels?.apply ?? "Apply"}</Button>
      </Inline>
    </Stack>
  </Popover>;
});

export interface GradientStop {
  id: string;
  position: number;
  color: string;
}
export interface GradientValue {
  kind: "linear" | "radial";
  angle: number;
  stops: readonly GradientStop[];
}
export interface GradientEditorProps extends Omit<FieldsetProps,"children"|"legend"|"onChange"> {
  label: string;
  value: GradientValue;
  onValueChange: (value: GradientValue) => void;
  /** Upper bound on creating new stops. */
  maxStops?: number;
  labels?: Partial<Record<"mode"|"linear"|"radial"|"angle"|"stops"|"position"|"color"|"colorChannels"|"add"|"remove",string>>
    & { stop?: (index: number, position: number) => string };
  controlSize?: "sm" | "md" | "lg";
  readOnly?: boolean;
}
/** Edit stable, individually selectable stops in linear or radial fills. @since 0.2.14 */
export const GradientEditor = /* @__PURE__ */ forwardRef<HTMLFieldSetElement,GradientEditorProps>(function GradientEditor(props,ref) {
  return <GradientControl {...props} ref={ref} />;
});
export interface HoverCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title" | "role"> {
  title: ReactNode; trigger: (props: OverlayTriggerProps) => ReactNode; children: ReactNode;
  side?: "top" | "bottom" | "left" | "right"; align?: "start" | "center" | "end";
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  openDelay?: number; closeDelay?: number; disabled?: boolean; closeLabel?: string;
}
/** @since 0.2.8 */
export const HoverCard = /* @__PURE__ */ forwardRef<HTMLDivElement, HoverCardProps>(function HoverCard(props, ref) { return <HoverPreview {...props} ref={ref} />; });
export interface TreeSelectProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange" | "defaultValue"> {
  label: string; hideLabel?: boolean; items: readonly TreeItem[];
  value?: string; defaultValue?: string; onValueChange?: (value: string) => void;
  placeholder?: string; name?: string; form?: string; required?: boolean;
  disabled?: boolean; readOnly?: boolean; invalid?: boolean; status?: FieldStatus;
  controlSize?: "sm" | "md" | "lg" | "xl";
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  expandedValues?: readonly string[]; defaultExpandedValues?: readonly string[];
  onExpandedValuesChange?: (values: string[]) => void; emptyMessage?: string; invalidSelectionMessage?: string;
}
/** @since 0.2.8 */
export const TreeSelect = /* @__PURE__ */ forwardRef<HTMLDivElement, TreeSelectProps>(function TreeSelect(props, ref) { return <HierarchicalSelect {...props} ref={ref} />; });

export interface DateTimeValue { date: string; time: string; }
export interface DateTimePickerProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "defaultValue" | "onChange"> {
  label: string;
  validationMessage?: string;
  timeInterval?: number;
  hideLabel?: boolean;
  hideFieldLabels?: boolean;
  value?: DateTimeValue;
  defaultValue?: DateTimeValue;
  onValueChange?: (value: DateTimeValue) => void;
  dateLabel?: string;
  timeLabel?: string;
  datePickerLabels?: Pick<DatePickerProps, "calendarLabel" | "openCalendarLabel" | "previousMonthLabel" | "nextMonthLabel" | "viewLabels" | "segmentLabels" | "messages">;
  timePickerLabels?: Pick<TimePickerProps, "panelLabel" | "openTimeLabel" | "segmentLabels" | "messages">;
  dateName?: string;
  timeName?: string;
  form?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
  precision?: "minute" | "second";
  order?: DateFieldProps["order"];
  locale?: string;
  minDate?: string;
  maxDate?: string;
  minTime?: string;
  maxTime?: string;
  step?: number;
  status?: FieldStatus;
  description?: string;
}
/** @since 0.2.8 */
export const DateTimePicker = /* @__PURE__ */ forwardRef<HTMLDivElement, DateTimePickerProps>(function DateTimePicker(props, ref) {
  return <CivilDateTimePicker {...props} ref={ref} />;
});

export type TreeItemAction = {
  id: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
} & (
  { kind?: "button"; onAction: () => void }
  | { kind: "toggle"; pressed: boolean; onPressedChange: (value: boolean) => void }
);

export interface TreeItem {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  children?: readonly TreeItem[];
  hasChildren?: boolean;
  loading?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  selectable?: boolean;
  /** Independent trailing controls. A focused item contributes its actions to the Tab order. */
  actions?: readonly TreeItemAction[];
}
export interface TreeProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onSelect" | "defaultValue" | "onChange"> {
  label: string;
  hideLabel?: boolean;
  items: readonly TreeItem[];
  value?: string | readonly string[];
  defaultValue?: string | readonly string[];
  onValueChange?: (value: string | string[]) => void;
  multiple?: boolean;
  expandedValues?: readonly string[];
  defaultExpandedValues?: readonly string[];
  onExpandedValuesChange?: (values: string[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
  emptyMessage?: string;
  loadingMessage?: string;
  unloadedMessage?: string;
  readOnlyMessage?: string;
}
/** @since 0.2.7 */
export const Tree = /* @__PURE__ */ forwardRef<HTMLDivElement, TreeProps>(function Tree(props, ref) {
  return <SelectionTree {...props} ref={ref} />;
});

export interface QueryPlanOperation {
  id: string;
  label: string;
  /** Relation, index, or another short source identifier. */
  source?: string;
  estimatedRows?: number;
  estimatedCost?: number;
  /** In PostgreSQL, these measurements are averages per execution of the node. */
  actual?: { rows: number; durationMs: number; loops: number };
  children?: readonly QueryPlanOperation[];
}

export interface QueryPlanProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "defaultValue"> {
  label: string;
  root: QueryPlanOperation | null;
  headingLevel?: HeadingProps["level"];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  labels?: Partial<{
    operations: string;
    empty: string;
    source: string;
    estimatedRows: string;
    estimatedCost: string;
    actualRows: string;
    actualDuration: string;
    loops: string;
  }>;
}

/** Inspect nested query operations, estimates and optional execution measurements. @since 0.2.14 */
export const QueryPlan = /* @__PURE__ */ forwardRef<HTMLDivElement, QueryPlanProps>(function QueryPlan(
  {label, root, headingLevel = 3, value, defaultValue, onValueChange, labels, lang, className, ...props}, ref,
) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const operations = new Map<string, QueryPlanOperation>();
  const toTreeItem = (operation: QueryPlanOperation, depth = 1): TreeItem => {
    if (depth > 256 || operations.has(operation.id)) {
      throw new Error("Flood QueryPlan requires unique IDs and at most 256 levels");
    }
    operations.set(operation.id, operation);
    return {value:operation.id, label:operation.label, description:operation.source,
      children:operation.children?.map(child => toTreeItem(child, depth + 1))};
  };
  const items = root ? [toTreeItem(root)] : [];
  const activeId = value ?? localValue;
  const active = (activeId === undefined ? undefined : operations.get(activeId)) ?? root;
  const number = new Intl.NumberFormat(lang || "en", {maximumFractionDigits:3});
  const facts: DescriptionItem[] = [];
  if (active?.source) facts.push({id:"source", term:labels?.source ?? "Source", description:active.source});
  if (active?.estimatedRows !== undefined) facts.push({id:"estimated-rows", term:labels?.estimatedRows ?? "Estimated rows", description:number.format(active.estimatedRows)});
  if (active?.estimatedCost !== undefined) facts.push({id:"estimated-cost", term:labels?.estimatedCost ?? "Estimated cost", description:number.format(active.estimatedCost)});
  if (active?.actual) facts.push(
    {id:"actual-rows", term:labels?.actualRows ?? "Actual rows per loop", description:number.format(active.actual.rows)},
    {id:"actual-duration", term:labels?.actualDuration ?? "Time per loop",
      description:<Duration milliseconds={active.actual.durationMs} lang={lang} />},
    {id:"loops", term:labels?.loops ?? "Loops", description:number.format(active.actual.loops)},
  );

  return <div {...props} ref={ref} lang={lang} role="group" aria-label={label} className={classes("flood-query-plan", className)}>
    {root && active ? <Split ratio="balanced" gap="4" collapseAt="sm" main={
      <Tree key={root.id} label={labels?.operations ?? "Operations"} items={items} value={active.id} defaultExpandedValues={[root.id]}
        controlSize="sm" onValueChange={next => {
          if (typeof next !== "string") return;
          if (value === undefined) setLocalValue(next);
          onValueChange?.(next);
        }} />
    } aside={
      <Surface padding="4" className="flood-query-plan__details">
        <Stack gap="2">
          <Heading level={headingLevel} size="group">{active.label}</Heading>
          {facts.length > 0 && <DescriptionList items={facts} layout="columns" density="compact" dividers={false} />}
        </Stack>
      </Surface>
    } /> : <Text as="p" size="compact" tone="subtle">{labels?.empty ?? "No query plan."}</Text>}
  </div>;
});

export interface NavigationItemDisclosure {
  expanded:boolean;
  onExpandedChange:(expanded:boolean)=>void;
  label:string;
  controls?:string;
  disabled?:boolean;
}
export interface NavigationItemProps extends Omit<HTMLAttributes<HTMLDivElement>,'children'|'onChange'> {
  label:string;
  /** Reveal a clipped single-line label on the existing navigation target. */
  labelOverflow?:"wrap"|"truncate";
  description?:string;
  icon?:ReactNode;
  reserveIcon?:boolean;
  trailing?:ReactNode;
  /** A named unread count shown as a dot in compact navigation. */
  compactBadge?: {count:number; label:string};
  /** Independent action rendered beside the primary control in expanded rows. */
  trailingAction?:ReactNode;
  href?:string;
  linkProps?:Omit<AnchorHTMLAttributes<HTMLAnchorElement>,'href'|'children'|'aria-current'>;
  onAction?:()=>void;
  actionProps?:Omit<ButtonHTMLAttributes<HTMLButtonElement>,'children'>;
  disclosure?:NavigationItemDisclosure;
  current?:boolean;
  currentKind?:'page'|'location';
  ancestorCurrent?:boolean;
  disabled?:boolean;
  size?:'sm'|'md'|'lg';
  compact?:boolean;
  variant?:'quiet'|'standard';
  tooltip?:boolean;
  tooltipSide?:'left'|'right';
  controlRef?:Ref<HTMLElement>;
  disclosureRef?:Ref<HTMLButtonElement>;
}

/** Shared navigation row geometry and native destination/action behavior. @since 0.2.11 */
export const NavigationItem = /* @__PURE__ */ forwardRef<HTMLDivElement,NavigationItemProps>(function NavigationItem(props,ref){return <NavigationRow {...props} ref={ref}/>;});

export interface NavigationGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title" | "onChange"> {
  label?: string;
  hideLabel?: boolean;
  headingAction?: ReactNode;
  separator?: boolean;
  collapsible?: boolean;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  compact?: boolean;
  size?: "sm" | "md" | "lg";
  collapseDisabled?: boolean;
  children?: ReactNode;
}

/** Related navigation with independently configurable presentation. @since 0.2.11 */
export const NavigationGroup = /* @__PURE__ */ forwardRef<HTMLDivElement,NavigationGroupProps>(function NavigationGroup(props,ref){return <NavigationSection {...props} ref={ref}/>;});

export interface NavigationTreeItem {
  value: string;
  label: string;
  href?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  compactBadge?: NavigationItemProps["compactBadge"];
  trailingAction?: ReactNode;
  disabled?: boolean;
  children?: readonly NavigationTreeItem[];
  content?: ReactNode;
  flyout?: { openOnHover?: boolean; positionReference?: RefObject<HTMLElement | null> };
  linkProps?: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children" | "aria-current">;
}
export interface NavigationTreeProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "onChange"> {
  label: string;
  labelOverflow?: NavigationItemProps["labelOverflow"];
  items: readonly NavigationTreeItem[];
  currentValue?: string;
  /** Page destination versus the current global module/location. */
  currentKind?: "page" | "location";
  expandedValues?: readonly string[];
  defaultExpandedValues?: readonly string[];
  onExpandedValuesChange?: (values: string[]) => void;
  expandLabel?: (item: NavigationTreeItem, expanded: boolean) => string;
  size?: ContentSize;
  variant?: "quiet" | "standard";
  /** Icon rail; branches open a Popover without changing the accepted expansion set. */
  compact?: boolean;
  flyoutSide?: "left" | "right";
  branchGuides?: boolean;
}
/** @since 0.2.7 */
export const NavigationTree = /* @__PURE__ */ forwardRef<HTMLElement, NavigationTreeProps>(function NavigationTree(props, ref) {
  return <HierarchicalNavigation {...props} ref={ref} />;
});

export interface SidebarGroup {
  id:string;
  label:string;
  /** Keep the navigation name while omitting a redundant visible section title. */
  hideLabel?:boolean;
  separator?:boolean;
  branchGuides?:boolean;
  headingAction?:ReactNode;
  collapsible?:boolean;
  expanded?:boolean;
  defaultExpanded?:boolean;
  onExpandedChange?:(expanded:boolean)=>void;
  items:readonly NavigationTreeItem[];
}
export interface SidebarSlotState { collapsed:boolean; }
export interface SidebarProps extends Omit<HTMLAttributes<HTMLElement>,"children"|"onChange"> {
  label:string;
  labelOverflow?:NavigationItemProps["labelOverflow"];
  groups:readonly SidebarGroup[];
  currentValue?:string;
  currentKind?:NavigationTreeProps["currentKind"];
  collapsed?:boolean;
  defaultCollapsed?:boolean;
  onCollapsedChange?:(collapsed:boolean)=>void;
  collapsible?:boolean;
  collapseLabel?:string;
  expandLabel?:string;
  expandedValues?:readonly string[];
  defaultExpandedValues?:readonly string[];
  onExpandedValuesChange?:(values:string[])=>void;
  expandItemLabel?:NavigationTreeProps["expandLabel"];
  size?:ContentSize;
  /** Quiet recedes behind work content; standard preserves the stronger pill recipe. */
  variant?:"quiet"|"standard";
  side?:"start"|"end";
  width?:CSSProperties["width"];
  header?:ReactNode|((state:SidebarSlotState)=>ReactNode);
  headerLayout?:"stacked"|"inline";
  footer?:ReactNode|((state:SidebarSlotState)=>ReactNode);
  footerSeparator?:boolean;
  headerSeparator?:boolean;
}
/** Bounded desktop navigation composed from NavigationTree and ScrollArea. @since 0.2.11 */
export const Sidebar = /* @__PURE__ */ forwardRef<HTMLElement,SidebarProps>(function Sidebar(props,ref){return <WorkspaceSidebar {...props} ref={ref}/>;});

export interface ErrorSummaryItem { id: string; fieldId: string; message: string; }
export interface ErrorSummaryProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title" | "onSelect" | "role" | "aria-live"> {
  title: string;
  errors: readonly ErrorSummaryItem[];
  /** Form-wide validation messages with no individual focus target. */
  formErrors?: readonly { id: string; message: string }[];
  appearance?: AlertProps["appearance"];
  description?: ReactNode;
  announcement?: "off" | "polite" | "assertive";
  autoFocus?: boolean;
  onSelect?: (error: ErrorSummaryItem, event: ReactMouseEvent<HTMLAnchorElement>) => void;
}
/** @since 0.2.7 */
export const ErrorSummary = /* @__PURE__ */ forwardRef<HTMLDivElement, ErrorSummaryProps>(function ErrorSummary(
  { announcement = "off", autoFocus = false, ...props }, ref,
) { return <ValidationErrorSummary {...props} ref={ref} announcement={announcement} autoFocus={autoFocus} />; });
export interface ResizablePanelsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "defaultValue" | "onChange"> {
  label: string;
  main: ReactNode;
  secondary: ReactNode;
  orientation?: "horizontal" | "vertical";
  value?: number;
  defaultValue?: number;
  onValueChange?: (percent: number) => void;
  onValueCommit?: (percent: number) => void;
  min?: number;
  max?: number;
  step?: number;
  largeStep?: number;
  disabled?: boolean;
}
/** @since 0.2.7 */
export const ResizablePanels = /* @__PURE__ */ forwardRef<HTMLDivElement, ResizablePanelsProps>(function ResizablePanels(
  { orientation = "horizontal", defaultValue = 50, min = 10, max = 90, step = 1, largeStep = 10, ...props }, ref,
) { return <ResizablePaneGroup {...props} ref={ref} orientation={orientation} defaultValue={defaultValue} min={min} max={max} step={step} largeStep={largeStep} />; });
export interface DateRangeValue { start: string; end: string; }
export interface RangeCalendarProps extends Omit<CalendarProps, "value" | "defaultValue" | "onValueChange" | "onDateSelect" | "granularity"> {
  value?: DateRangeValue;
  defaultValue?: DateRangeValue;
  onValueChange?: (range: DateRangeValue) => void;
  onRangeSelect?: (range: DateRangeValue) => void;
  isRangeDisabled?: (range: DateRangeValue) => boolean;
  rangeLabels?: { chooseStart?: string; chooseEnd?: string; unavailable?: string };
}
/** @since 0.2.7 */
export const RangeCalendar = /* @__PURE__ */ forwardRef<HTMLDivElement, RangeCalendarProps>(function RangeCalendar(
  { weekStartsOn = 0, locale = "en-US", autoFocus = false, ...props }, ref,
) { return <DateRangeCalendar {...props} ref={ref} weekStartsOn={weekStartsOn} locale={locale} autoFocus={autoFocus} />; });
export interface DateRangeFieldProps extends Omit<DateFieldProps, "value" | "defaultValue" | "onValueChange" | "name" | "label" | "end"> {
  label: string;
  value?: DateRangeValue;
  defaultValue?: DateRangeValue;
  onValueChange?: (range: DateRangeValue) => void;
  startName?: string;
  endName?: string;
  startLabel?: string;
  endLabel?: string;
  end?: ReactNode;
  isDateDisabled?: (date: string) => boolean;
  isRangeDisabled?: (range: DateRangeValue) => boolean;
  rangeMessages?: { incomplete?: string; reversed?: string; unavailable?: string };
}
/** @since 0.2.7 */
export const DateRangeField = /* @__PURE__ */ forwardRef<HTMLDivElement, DateRangeFieldProps>(function DateRangeField(
  { controlSize = "md", order = "month-day-year", startLabel = "Start date", endLabel = "End date", ...props }, ref,
) { return <PairedDateRangeField {...props} ref={ref} controlSize={controlSize} order={order} startLabel={startLabel} endLabel={endLabel} />; });
export interface DateRangePickerProps extends Omit<DateRangeFieldProps, "end"> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  calendarLabel?: string;
  openCalendarLabel?: string;
  viewLabels?: CalendarProps["viewLabels"];
  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  today?: string;
  previousMonthLabel?: string;
  nextMonthLabel?: string;
  rangeLabels?: RangeCalendarProps["rangeLabels"];
}
/** @since 0.2.7 */
export const DateRangePicker = /* @__PURE__ */ forwardRef<HTMLDivElement, DateRangePickerProps>(function DateRangePicker(
  { controlSize = "md", defaultOpen = false, ...props }, ref,
) { return <CalendarDateRangePicker {...props} ref={ref} controlSize={controlSize} defaultOpen={defaultOpen} />; });

export interface DatePickerProps extends Omit<DateFieldProps, "end"> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  calendarLabel?: string;
  openCalendarLabel?: string;
  viewLabels?: CalendarProps["viewLabels"];
  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  today?: string;
  previousMonthLabel?: string;
  nextMonthLabel?: string;
}
/** @since 0.2.7 */
export const DatePicker = /* @__PURE__ */ forwardRef<HTMLDivElement, DatePickerProps>(function DatePicker(
  { controlSize = "md", defaultOpen = false, ...props }, ref,
) { return <CalendarDatePicker {...props} ref={ref} controlSize={controlSize} defaultOpen={defaultOpen} />; });

export interface CalendarProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  label: string;
  /** Multiple selection is available with day granularity. */
  selectionMode?: "single" | "multiple";
  /** Accepted independent ISO dates in multiple mode. */
  selectedDates?: readonly string[];
  defaultSelectedDates?: readonly string[];
  onSelectedDatesChange?: (dates: string[]) => void;
  /** Show an explicit clear action in multiple mode when a label is supplied. */
  clearSelectionLabel?: string;
  /** Values and bounds use YYYY-MM-DD, YYYY-MM or YYYY respectively. */
  granularity?: "day" | "month" | "year";
  showViewControls?: boolean;
  viewLabels?: {month?:string;year?:string;previous?:string;next?:string};
  value?: string;
  defaultValue?: string;
  onValueChange?: (date: string) => void;
  onDateSelect?: (date: string) => void;
  visibleMonth?: string;
  defaultVisibleMonth?: string;
  onVisibleMonthChange?: (month: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  readOnly?: boolean;
  isDateDisabled?: (date: string) => boolean;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  locale?: string;
  autoFocus?: boolean;
  today?: string;
  previousMonthLabel?: string;
  nextMonthLabel?: string;
}
/** @since 0.2.7 */
export const Calendar = /* @__PURE__ */ forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
  { weekStartsOn = 0, locale = "en-US", autoFocus = false, selectionMode = "single", ...props }, ref,
) { return <DateCalendar {...props} ref={ref} weekStartsOn={weekStartsOn} locale={locale} autoFocus={autoFocus} selectionMode={selectionMode} />; });
export interface TimeFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  label: string;
  end?: ReactNode;
  hideLabel?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  precision?: "minute" | "second";
  min?: string;
  max?: string;
  step?: number;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  name?: string;
  form?: string;
  controlSize?: "sm" | "md" | "lg" | "xl";
  invalid?: boolean;
  status?: FieldStatus;
  description?: string;
  segmentLabels?: Partial<Record<"hour" | "minute" | "second", string>>;
  messages?: { required?: string; invalid?: string; outOfRange?: string; stepMismatch?: string };
}
/** @since 0.2.7 */
export const TimeField = /* @__PURE__ */ forwardRef<HTMLDivElement, TimeFieldProps>(function TimeField(
  { controlSize = "md", precision = "minute", ...props }, ref,
) { return <SegmentedTimeField {...props} ref={ref} controlSize={controlSize} precision={precision} />; });

export interface DateFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  label: string;
  hideLabel?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  name?: string;
  form?: string;
  controlSize?: "sm" | "md" | "lg" | "xl";
  invalid?: boolean;
  status?: FieldStatus;
  description?: string;
  order?: "month-day-year" | "day-month-year" | "year-month-day";
  segmentLabels?: Partial<Record<"day" | "month" | "year", string>>;
  messages?: { required?: string; invalid?: string; outOfRange?: string };
  validationMessage?: string;
  end?: ReactNode;
}
/** @since 0.2.7 */
export const DateField = /* @__PURE__ */ forwardRef<HTMLDivElement, DateFieldProps>(function DateField(
  { controlSize = "md", order = "month-day-year", ...props }, ref,
) { return <SegmentedDateField {...props} ref={ref} controlSize={controlSize} order={order} />; });

export interface CommandListItem {
  id: string;
  label: string;
  description?: string;
  keywords?: readonly string[];
  disabled?: boolean;
  group?: string;
  /** Decorative glyph. The label supplies the complete command name. */
  icon?: ReactNode;
  /** Display hint for a shortcut registered by the host. */
  shortcut?: KeyboardShortcutKeys;
}
export interface CommandListProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "defaultValue" | "onChange"> {
  label: string;
  hideLabel?: boolean;
  items: readonly CommandListItem[];
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  onAction?: (id: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  controlSize?: "sm" | "md" | "lg" | "xl";
}
/** @since 0.2.7 */
export const CommandList = /* @__PURE__ */ forwardRef<HTMLInputElement, CommandListProps>(function CommandList(
  { controlSize = "md", hideLabel = false, disabled = false, loading = false, ...props }, ref,
) { return <SearchCommandList {...props} ref={ref} controlSize={controlSize} hideLabel={hideLabel} disabled={disabled} loading={loading} />; });

export interface TagInputProps extends Omit<InputProps, "type" | "value" | "defaultValue" | "onChange" | "children" | "size"> {
  label: string;
  hideLabel?: boolean;
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  delimiters?: readonly string[];
  removeLabel?: string;
  requiredMessage?: string;
  /** Show at most this many tags before the user expands the selection. */
  maxVisibleTags?: number;
  moreTagsLabel?: (hiddenCount: number) => string;
  fewerTagsLabel?: string;
}
/** @since 0.2.7 */
export const TagInput = /* @__PURE__ */ forwardRef<HTMLInputElement, TagInputProps>(function TagInput(
  { controlSize = "md", hideLabel = false, removeLabel = "Remove", requiredMessage = "Add at least one tag.", ...props }, ref,
) { return <FreeTagEntry {...props} ref={ref} controlSize={controlSize} hideLabel={hideLabel} removeLabel={removeLabel} requiredMessage={requiredMessage} />; });

export interface EditableProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  label: string;
  hideLabel?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  editing?: boolean;
  defaultEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  onCommit?: (value: string) => void;
  onCancel?: () => void;
  /** Return a message to keep the draft open and prevent a commit. */
  validate?: (value: string) => string | undefined;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  previewVariant?: "subtle" | "ghost";
  /** Render the editor over its trigger at this preferred width. */
  editorOverlayWidth?: CSSProperties["inlineSize"];
  blurAction?: "commit" | "cancel" | "none";
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  controlSize?: "sm" | "md" | "lg" | "xl";
  showActions?: boolean;
  editLabel?: string;
  saveLabel?: string;
  cancelLabel?: string;
  inputRef?: Ref<HTMLInputElement>;
  name?: string;
  form?: string;
}
/** @since 0.2.7 */
export const Editable = /* @__PURE__ */ forwardRef<HTMLDivElement, EditableProps>(function Editable(
  { controlSize = "md", blurAction = "commit", showActions = true, ...props }, ref,
) { return <InlineEditable {...props} ref={ref} controlSize={controlSize} blurAction={blurAction} showActions={showActions} />; });

const classes = (...values: (string | undefined | false)[]) =>
  values.filter(Boolean).join(" ");

export type ControlSize = "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "subtle" | "outline" | "ghost";
  tone?: "default" | "danger";
  size?: ControlSize;
  /** Keep focus and replace visible content with a spinner using retain-focus. */
  loading?: boolean | "retain-focus";
}
export const Button = /* @__PURE__ */ forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "solid",
      tone = "default",
      size = "md",
      loading = false,
      disabled,
      type = "button",
      className,
      children,
      onClick,
      ...props
    },
    ref,
  ) {
    const retainsFocus = loading === "retain-focus";
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        data-tone={tone === "danger" ? tone : undefined}
        disabled={disabled || (loading === true)}
        aria-busy={Boolean(loading) || props["aria-busy"]}
        aria-disabled={retainsFocus || props["aria-disabled"]}
        onClick={retainsFocus ? event => {
          event.preventDefault();
          event.stopPropagation();
        } : onClick}
        className={classes(
          "flood-button",
          `flood-button--${variant}`,
          `flood-button--${size}`,
          className,
        )}
      >
        {retainsFocus ? <>
          <span className="flood-button__busy-spinner" aria-hidden="true"><Spinner decorative /></span>
          <span className="flood-button__busy-label">{children}</span>
        </> : <>{loading && <Spinner decorative />}{children}</>}
      </button>
    );
  },
);

export type FieldStatus = "error" | "warning" | "success" | "info";

export interface MessageAttachment {
  id: string;
  label: string;
  removeLabel?: string;
}

export interface MessageComposerProps extends Omit<HTMLAttributes<HTMLFormElement>, "children" | "onChange" | "onSubmit"> {
  layout?: "stacked" | "compact";
  sendPresentation?: "icon" | "label";
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  suggestions?: readonly TextSuggestionGroup[];
  onSuggestionSelect?: (selection: TextSuggestionSelection) => void;
  disabled?: boolean;
  streaming?: boolean;
  onStop?: () => void;
  attachments?: readonly MessageAttachment[];
  /** Accessible name of the attachment list. */
  attachmentsLabel?: string;
  /** Number shown before the count disclosure. Omit to show all attachments. */
  maxVisibleAttachments?: number;
  moreAttachmentsLabel?: (hiddenCount: number) => string;
  fewerAttachmentsLabel?: string;
  onRemoveAttachment?: (id: string) => void;
  onFilesSelect?: (files: File[]) => void;
  accept?: string;
  sendLabel?: string;
  stopLabel?: string;
  attachLabel?: string;
  /** Host-owned controls such as reply audience, rendered before Send. */
  leadingActions?: ReactNode;
  /** Localized context displayed above the draft, for example "Replying to Maya Chen". */
  replyContext?: string;
  onCancel?: () => void;
  cancelLabel?: string;
}

/** A controlled draft for messages and replies with optional attachments. */
export const MessageComposer = /* @__PURE__ */ forwardRef<HTMLFormElement, MessageComposerProps>(function MessageComposer(
  {replyContext, onCancel, cancelLabel = "Cancel reply", sendLabel, ...props}, ref,
) {
  const contextId = useId();
  const header = (replyContext || onCancel) && <div className="flood-message-composer__context">
      {replyContext && <>
        <IconSlot size="2xs" className="flood-message-composer__reply-icon"><ReplyIcon /></IconSlot>
        <Text id={contextId} tone="subtle" size="helper" className="flood-message-composer__context-label">{replyContext}</Text>
      </>}
      {onCancel && <IconButton type="button" size="2xs" variant="ghost" label={cancelLabel} title={cancelLabel} onClick={onCancel} disabled={props.disabled}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </IconButton>}
    </div>;
  return <ComposerForm {...props} sendLabel={sendLabel ?? (replyContext ? "Reply" : undefined)}
    header={header} editorDescriptionId={replyContext ? contextId : undefined} ref={ref} />;
});

function ReplyIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 6-5 5 5 5M4 11h9a6 6 0 0 1 6 6v2" />
  </svg>;
}

export interface CommentComposerProps extends MessageComposerProps {}

/** MessageComposer with compact comment defaults. */
export const CommentComposer = /* @__PURE__ */ forwardRef<HTMLFormElement, CommentComposerProps>(function CommentComposer(
  {replyContext, layout = "compact", sendPresentation = "label", sendLabel, className, ...props}, ref,
) {
  return <MessageComposer {...props} layout={layout} sendPresentation={sendPresentation} replyContext={replyContext}
    sendLabel={sendLabel ?? (replyContext ? "Reply" : "Post")} placeholder={props.placeholder ?? props.label}
    className={classes("flood-comment-composer", className)} ref={ref} />;
});

export type ContentSize = "sm" | "md" | "lg";
export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  size?: ContentSize;
  icon?: ReactNode;
  /** Leading identity artwork. Takes the place of icon when both are supplied. */
  avatar?: Pick<AvatarProps, "name" | "src" | "fallback" | "shape">;
  disabled?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
  removeButtonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type" | "disabled" | "onClick" | "aria-label">;
}
/** @since 0.2.5 */
export const Tag = /* @__PURE__ */ forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { size = "md", icon, avatar, disabled = false, onRemove, removeLabel, removeButtonProps, className, children, ...props }, ref,
) {
  const label = removeLabel ?? (typeof children === "string" || typeof children === "number" ? `Remove ${children}` : "");
  if (onRemove && !label.trim()) throw new Error("Flood Tag removal needs an accessible removeLabel for rich content");
  const iconSize = size === "sm" ? "2xs" : size === "md" ? "xs" : "sm";
  return <span {...props} ref={ref} className={classes("flood-tag", className)} data-size={size} data-disabled={disabled || undefined}>
    {avatar ? <Avatar {...avatar} size="2xs" decorative /> : hasFieldContent(icon) && <IconSlot size={iconSize}>{icon}</IconSlot>}
    <span className="flood-tag__label">{children}</span>
    {onRemove && <IconButton {...removeButtonProps} type="button" className={classes("flood-tag__remove", removeButtonProps?.className)} label={label} variant="ghost" size={iconSize} disabled={disabled} onClick={() => { if (!disabled) onRemove(); }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
    </IconButton>}
  </span>;
});
export interface TagGroupItem {
  id: string;
  label: string;
  icon?: ReactNode;
  avatar?: TagProps["avatar"];
  disabled?: boolean;
  removeLabel?: string;
}

export interface TagGroupProps extends Omit<HTMLAttributes<HTMLUListElement>, "children"> {
  label: string;
  items: readonly TagGroupItem[];
  size?: ContentSize;
  disabled?: boolean;
  onRemove?: (id: string) => void;
  maxVisibleTags?: number;
  moreTagsLabel?: (hiddenCount: number) => string;
  fewerTagsLabel?: string;
}

/** A controlled list of labels or removable tags with optional count disclosure. */
export const TagGroup = /* @__PURE__ */ forwardRef<HTMLUListElement, TagGroupProps>(function TagGroup(props, ref) {
  return <TagList {...props} ref={ref} />;
});

export interface KbdProps extends HTMLAttributes<HTMLElement> { size?: ContentSize; }
/** @since 0.2.4 */
export const Kbd = /* @__PURE__ */ forwardRef<HTMLElement, KbdProps>(function Kbd(
  { size = "sm", className, ...props }, ref,
) {
  return <kbd {...props} ref={ref} className={classes("flood-kbd", className)} data-size={size} />;
});

export type KeyboardShortcutKeys = string | readonly string[];
export type KeyboardShortcutSequence = readonly (readonly string[])[];

export interface KeyboardShortcutProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** A flat list is one chord. Nested lists are chords pressed in order. */
  keys: KeyboardShortcutKeys | KeyboardShortcutSequence;
  /** Localized spoken form, useful when keycaps contain platform glyphs. */
  label?: string;
  size?: ContentSize;
  presentation?: "keys" | "compact";
  sequenceSeparator?: string;
}

/** A display-only shortcut with a consistent visual and spoken key order. */
export const KeyboardShortcut = /* @__PURE__ */ forwardRef<HTMLSpanElement, KeyboardShortcutProps>(function KeyboardShortcut(
  {keys, label, size = "sm", presentation = "keys", sequenceSeparator = "then", className, ...props}, ref,
) {
  const steps = typeof keys === "string" ? [[keys]]
    : keys.every((key): key is string => typeof key === "string") ? [keys]
    : keys.map(key => typeof key === "string" ? [key] : key).filter(step => step.length > 0);
  if (!steps[0]?.length) return null;
  const sequence = steps.length > 1;
  return <span {...props} ref={ref} dir="ltr" className={classes("flood-keyboard-shortcut", className)}>
    <VisuallyHidden>{label ?? steps.map(step => step.join(" + ")).join(` ${sequenceSeparator} `)}</VisuallyHidden>
    {sequence ? steps.map((step, index) => <span key={index} aria-hidden="true" className="flood-keyboard-shortcut__step">
      {index > 0 && <Text size="helper" tone="subtle">{sequenceSeparator}</Text>}
      {presentation === "compact" ? <Kbd size={size}>{step.join(" ")}</Kbd>
        : step.map((key, keyIndex) => <Kbd key={keyIndex} size={size}>{key}</Kbd>)}
    </span>) : presentation === "compact"
      ? <Kbd size={size} aria-hidden="true">{steps[0].join(" ")}</Kbd>
      : steps[0].map((key, index) => <Kbd key={index} size={size} aria-hidden="true">{key}</Kbd>)}
  </span>;
});

export type ShortcutModifier = "Control" | "Alt" | "Shift" | "Meta";

export interface RecordedShortcut {
  /** Logical key as reported by KeyboardEvent.key. */
  key: string;
  /** Physical key as reported by KeyboardEvent.code. */
  code: string;
  modifiers: readonly ShortcutModifier[];
}

export interface ShortcutRecorderProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange" | "defaultValue"> {
  label: string;
  value?: RecordedShortcut | null;
  defaultValue?: RecordedShortcut | null;
  onValueChange?: (value: RecordedShortcut | null) => void;
  /** Return an explanation if the host cannot accept the proposed binding. */
  validate?: (value: RecordedShortcut) => string | undefined;
  formatKeys?: (value: RecordedShortcut) => readonly string[];
  requireModifier?: boolean;
  disabled?: boolean;
  labels?: Partial<{
    unassigned: string;
    capture: string;
    empty: string;
    clear: string;
    save: string;
    cancel: string;
    modifierRequired: string;
  }>;
}

/** Record and explicitly confirm a single keyboard chord. The host owns shortcut dispatch. */
export const ShortcutRecorder = /* @__PURE__ */ forwardRef<HTMLDivElement, ShortcutRecorderProps>(function ShortcutRecorder(props, ref) {
  return <ShortcutCapture {...props} ref={ref} />;
});

export interface ShortcutReferenceItem {
  id: string;
  label: string;
  keys: KeyboardShortcutProps["keys"];
  spokenKeys?: string;
  keywords?: readonly string[];
}

export interface ShortcutReferenceGroup {
  id: string;
  label: string;
  items: readonly ShortcutReferenceItem[];
}

export interface ShortcutReferenceProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  groups: readonly ShortcutReferenceGroup[];
  searchLabel?: string;
  clearLabel?: string;
  sequenceSeparator?: string;
  headingLevel?: HeadingProps["level"];
  emptyLabel?: string;
  noMatchesLabel?: string;
}

/** Search the available shortcuts without executing them. @since 0.2.14 */
export const ShortcutReference = /* @__PURE__ */ forwardRef<HTMLDivElement, ShortcutReferenceProps>(function ShortcutReference(props, ref) {
  return <ShortcutReferencePanel {...props} ref={ref} />;
});

export interface ToolbarProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  label: string;
  orientation?: "horizontal" | "vertical";
  loop?: boolean;
  /** Pill keeps a single horizontal rail; rounded permits wrapped tool groups. */
  shape?: "rounded" | "pill";
  /** Plain groups keep control height without another surface or outer inset. */
  variant?: "contained" | "plain";
}
/** @since 0.2.4 */
export const Toolbar = /* @__PURE__ */ forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  { label, orientation = "horizontal", loop = true, ...props }, ref,
) {
  return <RovingToolbar {...props} ref={ref} label={label} orientation={orientation} loop={loop} />;
});
export type DataDensity = "compact" | "comfortable";
export interface DescriptionItem {
  id: string;
  term: string;
  description: ReactNode;
  /** Give this value a full-width line beneath its term, including in a grid. */
  layout?: "stacked";
  /** Keep a recognizable plain-text value on one line with full text on focus. */
  valueOverflow?: "wrap" | "truncate";
  /** A compact utility action for this value, such as copying an identifier. */
  action?: ReactNode;
}
export interface DescriptionListProps extends Omit<HTMLAttributes<HTMLDListElement>, "children"> {
  items: readonly DescriptionItem[];
  /** Inline adapts sooner, columns retain shared tracks in narrow panels, and grid tiles short facts. */
  layout?: "inline" | "columns" | "stacked" | "grid";
  density?: DataDensity;
  dividers?: boolean;
}

export interface DnsVerificationRecord {
  id: string;
  type: string;
  name: string;
  value: string;
  status?: Pick<StatusIndicatorProps, "label" | "tone">;
}

export interface DomainVerificationProps extends Omit<SectionProps, "title" | "actions" | "children"> {
  domain: string;
  records: readonly DnsVerificationRecord[];
  status?: Pick<StatusIndicatorProps, "label" | "tone" | "announce">;
  action?: ReactNode;
  labels?: {
    records?: string;
    name?: string;
    value?: string;
    empty?: string;
    copyName?: (record: DnsVerificationRecord) => string;
    copyValue?: (record: DnsVerificationRecord) => string;
  };
}

/** @since 0.2.14 */
export const DomainVerification = /* @__PURE__ */ forwardRef<HTMLElement, DomainVerificationProps>(function DomainVerification(props, ref) {
  return <DomainVerificationPanel {...props} ref={ref} />;
});

export interface ConnectionProfile {
  id: string;
  label: string;
  description?: string;
  /** Display-safe exact string, with placeholders for credentials. */
  connection: string;
  parameters?: readonly {id: string; label: string; value: string}[];
}

export interface UnavailableConnectionProfile extends Pick<ConnectionProfile, "id" | "label" | "description"> {
  /** Explain the blocking constraint. This profile has no copyable endpoint. */
  unavailableReason: string;
}

export interface ConnectionDetailsProps extends Omit<SectionProps, "children"> {
  profiles: readonly (ConnectionProfile | UnavailableConnectionProfile)[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  labels?: {method?: string; connection?: string; copy?: string; copied?: string; copyError?: string; empty?: string; choose?: string; selectionUnavailable?: string};
}

/** Show the exact connection string and parameters for the selected method. @since 0.2.14 */
export const ConnectionDetails = /* @__PURE__ */ forwardRef<HTMLElement, ConnectionDetailsProps>(
  function ConnectionDetails(props, ref) { return <ConnectionDetailsPanel {...props} ref={ref}/>; },
);
export type ServiceEndpoint = {
  id: string;
  label: string;
  scope: "public" | "private";
  /** Short transport or address type, for example HTTPS, TCP or DNS. */
  protocol: string;
} & (
  /** Exact display-safe address, including the public proxy port if applicable. */
  | {address: string; status?: Pick<StatusIndicatorProps, "label" | "tone">}
  | {address?: never; status: Pick<StatusIndicatorProps, "label" | "tone">}
);

export interface ServiceEndpointListProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  endpoints: readonly ServiceEndpoint[];
  labels?: {
    scope?: Partial<Record<ServiceEndpoint["scope"], string>>;
    empty?: string;
    copy?: (endpoint: ServiceEndpoint) => string;
    copied?: string;
    copyError?: string;
  };
}

/** Scan and copy a service's display-safe network addresses. @since 0.2.14 */
export const ServiceEndpointList = /* @__PURE__ */ forwardRef<HTMLDivElement, ServiceEndpointListProps>(function ServiceEndpointList(
  {label, endpoints, labels, ...props}, ref,
) {
  if (!label.trim() || new Set(endpoints.map(endpoint => endpoint.id)).size !== endpoints.length ||
      endpoints.some(endpoint => !endpoint.id.trim() || !endpoint.label.trim() ||
        (endpoint.scope !== "public" && endpoint.scope !== "private") || !endpoint.protocol.trim() ||
        (endpoint.address !== undefined ? !endpoint.address.trim() : !endpoint.status) ||
        (endpoint.status && !endpoint.status.label.trim()))) {
    throw new Error("Flood ServiceEndpointList requires uniquely identified endpoints with a scope, protocol and address or status");
  }
  return <Stack {...props} ref={ref}>
    {endpoints.length ? <DataList aria-label={label} className="flood-service-endpoint-list" density="compact" dividers={false}>
      {endpoints.map(endpoint => {
        const {id, label: name, protocol, scope, address, status} = endpoint;
        const scopeLabel = labels?.scope?.[scope] ?? (scope === "public" ? "Public" : "Private");
        return <DataListItem key={id} layout="content"
          title={<Inline align="baseline" gap="2">
            <Text size="label">{name}</Text><Badge size="sm">{protocol}</Badge>
            <Text size="helper" tone="subtle">{scopeLabel}</Text>
          </Inline>}
          description={status && <StatusIndicator {...status} size="sm" presentation="wrap" />}
          details={address && <CopyableValue appearance="code" value={address}
            copyLabel={labels?.copy?.(endpoint) ?? `Copy ${name} (${scopeLabel})`}
            copiedLabel={labels?.copied} errorLabel={labels?.copyError} />} />;
      })}
    </DataList> : <Text size="compact" tone="subtle">{labels?.empty ?? "No addresses configured."}</Text>}
  </Stack>;
});

export type ReplicationNode = {
  id: string;
  label: string;
  href?: string;
  status: Pick<StatusIndicatorProps, "label" | "tone">;
} & ({role: "primary"; lagMilliseconds?: never} | {
  role: "replica";
  /** Latest observed lag. Omit it when the source has no usable measurement. */
  lagMilliseconds?: number;
});

export interface ReplicationStatusProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  nodes: readonly ReplicationNode[];
  lagUnit?: "millisecond" | "second";
  labels?: Partial<Record<"primary" | "replica" | "lag" | "unavailable" | "empty", string>>;
}

/** Compare the reported health and replication lag of database nodes. @since 0.2.14 */
export const ReplicationStatus = /* @__PURE__ */ forwardRef<HTMLDivElement, ReplicationStatusProps>(function ReplicationStatus(
  {label, nodes, lagUnit = "second", labels, lang, ...props}, ref,
) {
  if (!label.trim() || new Set(nodes.map(node => node.id)).size !== nodes.length ||
      nodes.filter(node => node.role === "primary").length > 1 ||
      nodes.some(node => !node.id.trim() || !node.label.trim() || !node.status.label.trim())) {
    throw new Error("Flood ReplicationStatus requires a named list with unique, named nodes and at most one primary");
  }
  return <Stack {...props} ref={ref} lang={lang}>
    {nodes.length > 0 ? <DataList aria-label={label} className="flood-replication-status" density="compact" dividers={false}>
      {nodes.map(node => <DataListItem key={node.id} layout="content"
        title={<Inline gap="2" align="center">
          <Text size="label" dir="auto" style={{overflowWrap:"anywhere"}}>
            {node.href ? <Link href={node.href}>{node.label}</Link> : node.label}
          </Text>
          <Badge size="sm">{node.role === "primary" ? labels?.primary ?? "Primary" : labels?.replica ?? "Read replica"}</Badge>
        </Inline>}
        description={node.role === "replica" && <Inline gap="2" align="baseline">
          <Text size="helper" tone="subtle">{labels?.lag ?? "Replication lag"}</Text>
          {node.lagMilliseconds === undefined
            ? <Text size="helper" tone="subtle">{labels?.unavailable ?? "Unavailable"}</Text>
            : <Text size="helper"><Duration milliseconds={node.lagMilliseconds} unit={lagUnit} lang={lang} /></Text>}
        </Inline>}
        metadata={<StatusIndicator {...node.status} size="sm" presentation="wrap" />} />)}
    </DataList> : <Text size="compact" tone="subtle">{labels?.empty ?? "No database nodes to display."}</Text>}
  </Stack>;
});

/** @since 0.2.4 */
export const DescriptionList = /* @__PURE__ */ forwardRef<HTMLDListElement, DescriptionListProps>(function DescriptionList(
  { items, layout = "inline", density = "compact", dividers = false, ...props }, ref,
) {
  return <DescribedData {...props} ref={ref} items={items} layout={layout} density={density} dividers={dividers} />;
});

interface DependencyScheduleRecord {
  label: string;
  href?: string;
}

export interface DependencyScheduleProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  predecessor: DependencyScheduleRecord & {finish?: {date: string; kind: "planned" | "forecast"}};
  successor: DependencyScheduleRecord & {start?: string};
  labels?: {
    summary?: string;
    finish?: string;
    forecastFinish?: string;
    start?: string;
    unavailable?: string;
    incomplete?: string;
    aligned?: string;
    conflict?: (days: number) => string;
  };
}

/** Compare the civil dates for a finish-to-start dependency. @since 0.2.14 */
export const DependencySchedule = /* @__PURE__ */ forwardRef<HTMLDivElement, DependencyScheduleProps>(function DependencySchedule(
  {predecessor, successor, labels, lang = "en", ...props}, ref,
) {
  const finish = predecessor.finish?.date;
  const start = successor.start;
  if (!predecessor.label.trim() || !successor.label.trim()) {
    throw new Error("Flood DependencySchedule requires named records");
  }
  if ([finish, start].some(date => date !== undefined && !parseDate(date))) {
    throw new Error("Flood DependencySchedule requires civil dates in YYYY-MM-DD format");
  }
  const overlap = finish && start ? (Date.parse(finish) - Date.parse(start)) / 86_400_000 : undefined;
  const dayCount = overlap !== undefined && overlap > 0
    ? new Intl.NumberFormat(lang, {style:"unit",unit:"day",unitDisplay:"long"}).format(overlap) : undefined;
  const message = overlap === undefined ? labels?.incomplete ?? "Dates needed to check the dependency"
    : overlap <= 0 ? labels?.aligned ?? "Dates align"
    : labels?.conflict?.(overlap) ?? `Starts ${dayCount} before the prerequisite finishes`;
  const record = ({label, href}: DependencyScheduleRecord, date: string | undefined) =>
    <Stack gap="1">
      {href ? <Link href={href} dir="auto">{label}</Link> : <Text size="label" dir="auto">{label}</Text>}
      {date ? <Timestamp dateTime={date} lang={lang} />
        : <Text size="helper" tone="subtle">{labels?.unavailable ?? "Date unavailable"}</Text>}
    </Stack>;

  return <Stack {...props} ref={ref} lang={lang} gap="3" role="group"
    aria-label={props["aria-labelledby"] ? props["aria-label"] : props["aria-label"] ?? labels?.summary ?? "Dependency schedule"}>
    <DescriptionList layout="grid" density="compact" items={[
      {id:"finish", term:predecessor.finish?.kind === "forecast" ? labels?.forecastFinish ?? "Forecast finish"
        : labels?.finish ?? "Prerequisite finish", description:record(predecessor, finish)},
      {id:"start", term:labels?.start ?? "Dependent start", description:record(successor, start)},
    ]} />
    <StatusIndicator size="sm" presentation="wrap" label={message} tone={dayCount !== undefined ? "warning" : "neutral"} />
  </Stack>;
});

export type StorageBucketUploadLimit =
  | {source: "bucket" | "project"; bytes: number}
  | {source: "unknown"; bytes?: never};

export interface StorageBucketPolicyProps extends Omit<DescriptionListProps, "items"> {
  /** Effective read access to objects. Write permissions are configured separately. */
  readAccess: "private" | "public" | "unknown";
  uploadLimit: StorageBucketUploadLimit;
  /** Effective MIME patterns. Empty means all types; null means the policy is unknown. */
  contentTypes: readonly string[] | null;
  formatSize?: FileMetaProps["formatSize"];
  labels?: {
    access?: string;
    maxFileSize?: string;
    contentTypes?: string;
    public?: string;
    private?: string;
    publicDetail?: string;
    privateDetail?: string;
    projectLimit?: string;
    anyType?: string;
    unknown?: string;
  };
}

/** Inspect effective read access and upload restrictions for a storage bucket. @since 0.2.14 */
export const StorageBucketPolicy = /* @__PURE__ */ forwardRef<HTMLDListElement, StorageBucketPolicyProps>(function StorageBucketPolicy(
  {readAccess, uploadLimit, contentTypes, formatSize, labels, layout = "columns", lang, ...props}, ref,
) {
  const unknown = labels?.unknown ?? "Unknown";
  const isPublic = readAccess === "public";
  const access = readAccess === "unknown" ? unknown : isPublic ? labels?.public ?? "Public" : labels?.private ?? "Private";
  const accessDetail = isPublic ? labels?.publicDetail ?? "Anyone with a file link can read it."
    : labels?.privateDetail ?? "Read access is restricted.";
  const types = contentTypes && [...new Set(contentTypes.map(type => type.trim()))];
  if (types?.includes("")) throw new Error("Flood StorageBucketPolicy requires nonempty content types");
  return <DescriptionList {...props} ref={ref} layout={layout} lang={lang} items={[
    {id:"read-access", term:labels?.access ?? "Read access", description:<Stack gap="1">
      <StatusIndicator size="sm" label={access} tone={isPublic ? "warning" : "neutral"} presentation="wrap" />
      {readAccess !== "unknown" && <Text size="helper" tone="subtle">{accessDetail}</Text>}
    </Stack>},
    {id:"max-file-size", term:labels?.maxFileSize ?? "Max file size", description:uploadLimit.source === "unknown" ? unknown
      : <Inline gap="2" align="baseline">
        <FileMeta size={uploadLimit.bytes} variant="plain" formatSize={formatSize} lang={lang} />
        {uploadLimit.source === "project" && <Text size="helper" tone="subtle">{labels?.projectLimit ?? "Project limit"}</Text>}
      </Inline>},
    {id:"content-types", term:labels?.contentTypes ?? "Allowed types", description:types === null ? unknown : types.length
      ? <Inline gap="1">{types.map(type => <InlineCode key={type} size="sm" wrap dir="ltr">{type}</InlineCode>)}</Inline>
      : labels?.anyType ?? "Any file type"},
  ]} />;
});

export type VolumeAttachment =
  | {state: "mounted" | "pending"; service: string; path: string; serviceHref?: string}
  | {state: "detached" | "unknown"};

export interface VolumeMountSummaryProps extends Omit<SectionProps, "children" | "title" | "actions" | "headingSize"> {
  title: string;
  attachment: VolumeAttachment;
  /** Supply a complete observation in a shared unit, or omit when usage is unavailable. */
  usage?: Pick<CapacityMeterProps, "used" | "capacity" | "unit" | "warningAt">;
  labels?: Partial<Record<VolumeAttachment["state"] | "service" | "path" | "copyPath" | "copied" | "copyError" |
    "usage" | "usageUnavailable", string>>;
}

const volumeAttachmentStatus = {
  mounted:{label:"Mounted", tone:"success"},
  pending:{label:"Waiting to mount", tone:"info"},
  detached:{label:"Detached", tone:"neutral"},
  unknown:{label:"Mount status unavailable", tone:"neutral"},
} as const;

/** Runtime attachment and recorded usage for a persistent volume. @since 0.2.14 */
export const VolumeMountSummary = /* @__PURE__ */ forwardRef<HTMLElement, VolumeMountSummaryProps>(function VolumeMountSummary(
  {title, attachment, usage, labels, lang, ...props}, ref,
) {
  const status = volumeAttachmentStatus[attachment.state];
  const usageLabel = labels?.usage ?? "Storage used";
  const mount = "path" in attachment ? attachment : undefined;
  if (!title.trim() || (mount && (!mount.service.trim() || !mount.path.trim()))) {
    throw new Error("Flood VolumeMountSummary requires a named volume and a service and path for a known mount");
  }
  return <Section {...props} ref={ref} lang={lang} title={title} headingSize="group"
    actions={<StatusIndicator size="sm" tone={status.tone} label={labels?.[attachment.state] ?? status.label} presentation="wrap"/>}>
    <Stack gap="4">
      {mount && <DescriptionList layout="inline" items={[
        {id:"service", term:labels?.service ?? "Service",
          description:mount.serviceHref ? <Link href={mount.serviceHref} dir="auto">{mount.service}</Link> : <bdi>{mount.service}</bdi>},
        {id:"path", term:labels?.path ?? "Mount path",
          description:<CopyableValue appearance="code" value={mount.path} copyLabel={labels?.copyPath ?? "Copy mount path"}
            copiedLabel={labels?.copied} errorLabel={labels?.copyError}/>},
      ]}/>}
      {usage
        ? <CapacityMeter {...usage} label={usageLabel} size="sm" locale={lang}/>
        : <DescriptionList layout="inline" items={[{id:"usage", term:usageLabel, description:labels?.usageUnavailable ?? "Unavailable"}]}/>}
    </Stack>
  </Section>;
});

export interface AmountBreakdownEntry {
  label: string;
  /** A display-ready amount from the host, including its currency or unit when needed. */
  amount: string;
}

export interface AmountBreakdownProps extends Omit<HTMLAttributes<HTMLDListElement>, "children"> {
  rows?: readonly (AmountBreakdownEntry & {id: string})[];
  total: AmountBreakdownEntry;
}

/** Read-only monetary detail with aligned values and one emphasized total. */
export const AmountBreakdown = /* @__PURE__ */ forwardRef<HTMLDListElement, AmountBreakdownProps>(function AmountBreakdown(
  {rows = [], total, className, ...props}, ref,
) {
  if (rows.some(row => !row.id.trim() || !row.label.trim() || !row.amount.trim()) || !total.label.trim() || !total.amount.trim()) {
    throw new Error("Flood AmountBreakdown requires nonempty row IDs, labels and amounts");
  }
  const items: DescriptionItem[] = [
    ...rows.map(row => ({id: `row-${row.id}`, term: row.label, description: <bdi>{row.amount}</bdi>})),
    {id: "total", term: total.label, description: <bdi>{total.amount}</bdi>},
  ];
  return <DescriptionList {...props} ref={ref} items={items} layout="columns"
    className={classes("flood-amount-breakdown", className)} />;
});

export interface ConversionAmount {
  /** Localized number, including the sign, without a currency symbol or code. */
  amount: string;
  /** Three-letter uppercase currency code. */
  currency: string;
}

export type ConversionTarget =
  | {state: "pending"; currency: string}
  | ({state: "estimated" | "settled"; rate?: string} & ConversionAmount);

export interface CurrencyConversionProps extends Omit<DescriptionListProps, "items" | "layout" | "density" | "dividers"> {
  original: ConversionAmount;
  /** The rate, when supplied, is target currency per unit of original currency. */
  target: ConversionTarget;
  labels?: Partial<Record<"original" | "statement" | "estimated" | "pending" | "rate", string>>;
}

/** Original and statement amounts for one cross-currency transaction. */
export const CurrencyConversion = /* @__PURE__ */ forwardRef<HTMLDListElement, CurrencyConversionProps>(function CurrencyConversion(
  {original, target, labels, className, ...props}, ref,
) {
  const currency = /^[A-Z]{3}$/;
  if (!currency.test(original.currency) || !currency.test(target.currency) || original.currency === target.currency) {
    throw new Error("Flood CurrencyConversion requires distinct uppercase three-letter currency codes");
  }
  if (!original.amount.trim() || (target.state !== "pending" && (!target.amount.trim() || (target.rate !== undefined && !target.rate.trim())))) {
    throw new Error("Flood CurrencyConversion requires nonempty amounts and any supplied rate");
  }

  const renderAmount = ({amount, currency: code}: ConversionAmount) => (
    <bdi className="flood-currency-conversion__amount">
      <Text size="label">{amount}</Text>{" "}<Text size="helper" tone="subtle">{code}</Text>
    </bdi>
  );
  const items: DescriptionItem[] = [
    {id:"original", term:labels?.original ?? "Original amount", description:renderAmount(original)},
    {
      id:"target",
      term:target.state === "estimated" ? labels?.estimated ?? "Estimated amount" : labels?.statement ?? "Statement amount",
      description:target.state === "pending"
        ? <Inline gap="2"><StatusIndicator label={labels?.pending ?? "Pending"} size="sm" presentation="wrap" />
            <Text size="helper" tone="subtle">{target.currency}</Text></Inline>
        : renderAmount(target),
    },
  ];
  if (target.state !== "pending" && target.rate !== undefined) {
    items.push({
      id:"rate", term:labels?.rate ?? "Exchange rate", layout:"stacked",
      description:<Text size="compact" className="flood-currency-conversion__amount">
        <bdi dir="ltr">{`1 ${original.currency} = ${target.rate} ${target.currency}`}</bdi>
      </Text>,
    });
  }
  return <DescriptionList {...props} ref={ref} items={items} layout="grid" className={classes("flood-currency-conversion", className)} />;
});

export type ExpenseSettlementState =
  | {status: "awaiting-payment" | "processing" | "failed"}
  | {status: "settled"; channel: "in-app" | "external"; dateTime?: string};

export interface ExpenseSettlementProps extends Omit<SectionProps, "children" | "title" | "actions" | "description" | "headingSize"> {
  kind: "reimbursement" | "repayment";
  employee: string;
  company: string;
  /** Amount for this transfer in display form, with an independent ISO currency code. */
  amount: ConversionAmount;
  state: ExpenseSettlementState;
  detail?: string;
  timeZone?: string;
  labels?: Partial<Record<"reimbursement" | "repayment" | "amount" | "from" | "to" | "settledAt" |
    ExpenseSettlementState["status"] | "external", string>>;
}

const expenseSettlementStates = {
  "awaiting-payment": {label:"Awaiting payment", tone:"neutral"},
  processing: {label:"Processing", tone:"info"},
  failed: {label:"Payment failed", tone:"error"},
  settled: {label:"Paid", tone:"success"},
} as const;

/** The direction and recorded status of one expense reimbursement or repayment. @since 0.2.14 */
export const ExpenseSettlement = /* @__PURE__ */ forwardRef<HTMLElement, ExpenseSettlementProps>(function ExpenseSettlement(
  {kind, employee, company, amount, state, detail, timeZone = "UTC", labels, lang, ...props}, ref,
) {
  if (!employee.trim() || !company.trim() || !amount.amount.trim() || !/^[A-Z]{3}$/.test(amount.currency)) {
    throw new Error("Flood ExpenseSettlement requires named parties, an amount and a three-letter currency code");
  }
  const reimbursement = kind === "reimbursement";
  const external = state.status === "settled" && state.channel === "external";
  const status = expenseSettlementStates[state.status];
  const text = (value: string) => <Text size="label" dir="auto">{value}</Text>;
  const items: DescriptionItem[] = [
    {id:"amount", term:labels?.amount ?? "Amount", description:
      <bdi className="flood-expense-settlement__amount">
        <Text size="label">{amount.amount}</Text>{" "}<Text size="helper" tone="subtle">{amount.currency}</Text>
      </bdi>},
    {id:"from", term:labels?.from ?? "From", description:text(reimbursement ? company : employee)},
    {id:"to", term:labels?.to ?? "To", description:text(reimbursement ? employee : company)},
  ];
  if (state.status === "settled" && state.dateTime) {
    items.push({id:"settled-at", term:labels?.settledAt ?? "Paid on",
      description:<Timestamp dateTime={state.dateTime} lang={lang} timeZone={timeZone} size="compact" />});
  }
  return <Section {...props} ref={ref} lang={lang} headingSize="group"
    title={reimbursement ? labels?.reimbursement ?? "Reimbursement" : labels?.repayment ?? "Repayment"}
    actions={<StatusIndicator label={external ? labels?.external ?? "Paid externally" : labels?.[state.status] ?? status.label}
      size="sm" tone={status.tone} presentation="wrap" />}>
    <Stack gap="2">
      <DescriptionList layout="columns" items={items}/>
      {detail && <Text size="compact" tone="subtle" dir="auto">{detail}</Text>}
    </Stack>
  </Section>;
});

const billPaymentStates = {
  unscheduled: {label:"Unscheduled",tone:"neutral"},
  scheduled: {label:"Scheduled",tone:"info"},
  "awaiting-release": {label:"Awaiting release",tone:"warning"},
  processing: {label:"Processing",tone:"info"},
  paid: {label:"Paid",tone:"success"},
  failed: {label:"Failed",tone:"error"},
  canceled: {label:"Canceled",tone:"neutral"},
} as const;

export interface BillPaymentScheduleEntry {
  id: string;
  label: string;
  /** Display-ready amount in the bill currency. */
  amount: string;
  status: keyof typeof billPaymentStates;
  /** Use observed dates for completed payments and planned dates for future ones. */
  date?: Pick<TimestampProps, "dateTime" | "children" | "timeZone">;
  href?: string;
}

export interface BillPaymentScheduleProps extends Omit<SectionProps, "children"> {
  /** Display-ready amounts supplied by the host. */
  total: string;
  remaining?: string;
  /** The host-reported part of the remaining balance with no scheduled payment. */
  unscheduled?: string;
  /** An empty list indicates no recorded payments. Omit when records are unavailable. */
  payments?: readonly BillPaymentScheduleEntry[];
  labels?: {
    summary?: string;
    total?: string;
    remaining?: string;
    unscheduled?: (amount: string) => string;
    payments?: string;
    empty?: string;
    unavailable?: string;
    statuses?: Partial<Record<BillPaymentScheduleEntry["status"], string>>;
  };
}

/** Review partial payments and the outstanding balance of one bill. @since 0.2.14 */
export const BillPaymentSchedule = /* @__PURE__ */ forwardRef<HTMLElement, BillPaymentScheduleProps>(function BillPaymentSchedule(
  {title = "Payment schedule", total, remaining, unscheduled, payments, labels, lang, headingSize = "group", ...props}, ref,
) {
  if (!total.trim() || remaining?.trim() === "" || unscheduled?.trim() === "" ||
      payments?.some(({id,label,amount}) => !id.trim() || !label.trim() || !amount.trim()) ||
      (payments && new Set(payments.map(payment => payment.id)).size !== payments.length)) {
    throw new Error("Flood BillPaymentSchedule requires display amounts and unique named payments");
  }
  return <Section {...props} ref={ref} lang={lang} title={title} headingSize={headingSize}>
    <Stack gap="2">
      <MetricGroup label={labels?.summary ?? "Bill amounts"} layout="rows" items={[
        {id:"remaining", label:labels?.remaining ?? "Remaining balance",
          value:remaining === undefined ? undefined : <bdi>{remaining}</bdi>,
          state:remaining === undefined ? "unavailable" : "ready",
          hint:unscheduled === undefined ? undefined : labels?.unscheduled?.(unscheduled) ?? <><bdi>{unscheduled}</bdi> unscheduled</>},
        {id:"total", label:labels?.total ?? "Bill total", value:<bdi>{total}</bdi>},
      ]}/>
      {payments?.length ? <DataList aria-label={labels?.payments ?? "Payments"} density="compact" dividers={false}>
        {payments.map(({id,label,amount,status,date,href}) =>
          <DataListItem key={id}
            title={href ? <Link href={href} dir="auto">{label}</Link> : <bdi>{label}</bdi>}
            description={<Inline gap="2">
              <StatusIndicator size="sm" tone={billPaymentStates[status].tone}
                label={labels?.statuses?.[status] ?? billPaymentStates[status].label}/>
              {date && <Timestamp {...date} format="date" lang={lang} size="helper"/>}
            </Inline>}
            metadata={<Text size="label" style={{fontVariantNumeric:"tabular-nums"}}><bdi>{amount}</bdi></Text>} />)}
      </DataList> : <Text as="p" size="compact" tone="subtle">
        {payments ? labels?.empty ?? "No payments recorded." : labels?.unavailable ?? "Payment details unavailable."}
      </Text>}
    </Stack>
  </Section>;
});

export type TemporarySpendLimitState =
  | {status: "requested"; expectedResetAt?: string}
  | {status: "active"; effectiveLimit: string; resetsAt: string}
  | {status: "declined"; decisionNote?: string}
  | {status: "expired"; endedAt: string};

export interface TemporarySpendLimitProps extends Omit<SectionProps, "title" | "children" | "description" | "actions"> {
  /** Name the affected card or fund. */
  title: string;
  /** Localized monetary strings, including a shared currency. */
  baseLimit: string;
  requestedIncrease: string;
  state: TemporarySpendLimitState;
  reason?: string;
  timeZone?: string;
  labels?: Partial<Record<"baseLimit" | "requestedIncrease" | "effectiveLimit" | "resetAt" | "expectedResetAt" | "endedAt" |
    TemporarySpendLimitState["status"], string>>;
}

const temporarySpendLimitStatuses = {
  requested:{label:"Awaiting approval",tone:"info"},
  active:{label:"Active",tone:"success"},
  declined:{label:"Declined",tone:"error"},
  expired:{label:"Expired",tone:"neutral"},
} as const;

/** Inspect the requested and effective limits for a temporary spending increase. @since 0.2.14 */
export const TemporarySpendLimit = /* @__PURE__ */ forwardRef<HTMLElement, TemporarySpendLimitProps>(function TemporarySpendLimit(
  {title, baseLimit, requestedIncrease, state, reason, timeZone = "UTC", labels, lang, headingSize = "group", ...props}, ref,
) {
  const status = temporarySpendLimitStatuses[state.status];
  const displayAmount = (amount: string) => <Text size="label" style={{fontVariantNumeric:"tabular-nums"}}><bdi>{amount}</bdi></Text>;
  const displayTime = (dateTime: string) => <Timestamp dateTime={dateTime} format="date-time" size="compact"
    timeZone={timeZone} lang={lang} />;
  const items: DescriptionItem[] = [
    {id:"base",term:labels?.baseLimit ?? "Base limit",description:displayAmount(baseLimit)},
    {id:"increase",term:labels?.requestedIncrease ?? "Requested increase",description:displayAmount(requestedIncrease)},
  ];
  if (state.status === "active") {
    items.push({id:"effective",term:labels?.effectiveLimit ?? "Effective limit",description:displayAmount(state.effectiveLimit)},
      {id:"reset",term:labels?.resetAt ?? "Resets on",description:displayTime(state.resetsAt)});
  } else if (state.status === "requested" && state.expectedResetAt) {
    items.push({id:"expected",term:labels?.expectedResetAt ?? "Expected reset",description:displayTime(state.expectedResetAt)});
  } else if (state.status === "expired") {
    items.push({id:"ended",term:labels?.endedAt ?? "Ended on",description:displayTime(state.endedAt)});
  }

  return <Section {...props} ref={ref} lang={lang} title={title} headingSize={headingSize}
    actions={<StatusIndicator label={labels?.[state.status] ?? status.label} tone={status.tone} size="sm" presentation="wrap" />}
    description={reason}>
    <Stack gap="3">
      <DescriptionList items={items} layout="columns" />
      {state.status === "declined" && state.decisionNote &&
        <Text as="p" size="compact" tone="subtle" dir="auto">{state.decisionNote}</Text>}
    </Stack>
  </Section>;
});

export interface RefundOriginalCharge {
  merchant: string;
  amount: ConversionAmount;
  dateTime?: string;
  href?: string;
}

export interface RefundLinkSummaryProps extends Omit<SectionProps, "children" | "title" | "actions" | "description" | "headingSize"> {
  /** The amount of this individual refund. */
  refund: ConversionAmount;
  /** null means confirmed unlinked. Omit when the source could not be inspected. */
  original?: RefundOriginalCharge | null;
  /** Host-owned action to find or change the linked purchase. */
  action?: ReactNode;
  /** Why the link cannot be changed; replaces the editing action. */
  lockedReason?: string;
  timeZone?: string;
  labels?: Partial<Record<"title" | "refund" | "charged" | "purchase" | "unlinked" | "unavailable", string>>;
}

/** Inspect an individual refund and its accepted link to the original purchase. @since 0.2.14 */
export const RefundLinkSummary = /* @__PURE__ */ forwardRef<HTMLElement, RefundLinkSummaryProps>(function RefundLinkSummary(
  {refund, original, action, lockedReason, timeZone = "UTC", labels, lang, ...props}, ref,
) {
  const amounts = original ? [refund, original.amount] : [refund];
  if (amounts.some(({amount,currency}) => !amount.trim() || !/^[A-Z]{3}$/.test(currency)) ||
      (original && !original.merchant.trim())) {
    throw new Error("Flood RefundLinkSummary requires display amounts, three-letter currency codes and a named linked purchase");
  }
  const money = ({amount,currency}: ConversionAmount) => <bdi className="flood-expense-settlement__amount">
    <Text size="label">{amount}</Text>{" "}<Text size="helper" tone="subtle">{currency}</Text>
  </bdi>;
  const items: DescriptionItem[] = [];
  if (original) {
    items.push({id:"purchase", term:labels?.purchase ?? "Purchase",
      description:<Stack gap="0">
        <Text size="label" dir="auto" style={{overflowWrap:"anywhere"}}>
          {original.href ? <Link href={original.href}>{original.merchant}</Link> : original.merchant}
        </Text>
        {original.dateTime && <Timestamp dateTime={original.dateTime} lang={lang} timeZone={timeZone} />}
      </Stack>});
    items.push({id:"charge", term:labels?.charged ?? "Charge", description:money(original.amount)});
  }
  items.push({id:"refund", term:labels?.refund ?? "This refund", description:money(refund)});
  return <Section {...props} ref={ref} lang={lang} title={labels?.title ?? "Refund link"} headingSize="group"
    actions={lockedReason ? undefined : action}>
    <Stack gap="3">
      {!original && <Text as="p" size="compact" tone="subtle">
        {original === null ? labels?.unlinked ?? "No purchase linked." : labels?.unavailable ?? "Link details unavailable."}
      </Text>}
      <DescriptionList layout="columns" items={items} />
      {lockedReason && <Text as="p" size="helper" tone="subtle" dir="auto">{lockedReason}</Text>}
    </Stack>
  </Section>;
});

export interface CollectionImportExclusion {
  id: string;
  reason: string;
  count: number;
}

export type CollectionImportAssessment =
  | {state: "checked"; eligible: number; exclusions?: readonly CollectionImportExclusion[]}
  | {state: "unavailable"; reason?: string};

export interface CollectionImportReviewProps extends Omit<SectionProps, "children" | "title" | "actions" | "headingSize"> {
  source: string;
  destination: string;
  assessment: CollectionImportAssessment;
  /** Host-owned confirmation; available once some items are eligible. */
  action?: ReactNode;
  labels?: {
    title?: string;
    source?: string;
    destination?: string;
    eligible?: (formattedCount: string) => string;
    skipped?: (formattedCount: string) => string;
    exclusions?: string;
    unavailable?: string;
  };
}

/** Review the assessed scope of an import before confirming it. @since 0.2.14 */
export const CollectionImportReview = /* @__PURE__ */ forwardRef<HTMLElement, CollectionImportReviewProps>(function CollectionImportReview(
  {source, destination, assessment, action, labels, lang, ...props}, ref,
) {
  const checked = assessment.state === "checked";
  const exclusions = checked ? assessment.exclusions ?? [] : [];
  const skipped = exclusions.reduce((total, entry) => total + entry.count, 0);
  if (!source.trim() || !destination.trim() || !Number.isSafeInteger(skipped) ||
      new Set(exclusions.map(entry => entry.id)).size !== exclusions.length ||
      exclusions.some(entry => !entry.id.trim() || !entry.reason.trim() || !Number.isSafeInteger(entry.count) || entry.count <= 0) ||
      (checked && (!Number.isSafeInteger(assessment.eligible) || assessment.eligible < 0))) {
    throw new Error("Flood CollectionImportReview requires named collections and valid counts in uniquely identified exclusion groups");
  }
  const numbers = new Intl.NumberFormat(lang ?? "en");
  return <Section {...props} ref={ref} lang={lang} title={labels?.title ?? "Review import"} headingSize="group"
    actions={checked && assessment.eligible > 0 ? action : undefined}>
    <Stack gap="3">
      <DescriptionList layout="columns" items={[
        {id:"source", term:labels?.source ?? "From", description:<bdi>{source}</bdi>},
        {id:"destination", term:labels?.destination ?? "To", description:<bdi>{destination}</bdi>},
      ]}/>
      {checked ? <>
        <Inline gap="3">
          <StatusIndicator size="sm" tone="neutral" presentation="wrap"
            label={labels?.eligible?.(numbers.format(assessment.eligible)) ?? `${numbers.format(assessment.eligible)} to import`} />
          {skipped > 0 && <StatusIndicator size="sm" tone="warning" presentation="wrap"
            label={labels?.skipped?.(numbers.format(skipped)) ?? `${numbers.format(skipped)} will be skipped`} />}
        </Inline>
        {exclusions.length > 0 && <DataList aria-label={labels?.exclusions ?? "Skip reasons"}
          className="flood-collection-import-review__exclusions" density="compact" dividers={false}>
          {exclusions.map(entry => <DataListItem key={entry.id}
            title={<Text size="compact" dir="auto">{entry.reason}</Text>}
            metadata={<NumericValue value={entry.count} lang={lang} />} />)}
        </DataList>}
      </> : <Text as="p" size="compact" tone="subtle" dir="auto">
        {assessment.reason ?? labels?.unavailable ?? "Import assessment unavailable."}
      </Text>}
    </Stack>
  </Section>;
});

export interface ImportSourceColumn {
  id: string;
  label: string;
  example?: string;
  /** Set this to link a host validation summary to the mapping control. */
  fieldId?: string;
  invalid?: boolean;
}

export interface ImportTargetField {
  id: string;
  label: string;
}

export interface ImportColumnMappingProps extends Omit<TableProps, "children" | "density"> {
  columns: readonly ImportSourceColumn[];
  targets: readonly ImportTargetField[];
  /** Omitted source IDs are unassigned. Null means explicitly skipped. */
  value: Readonly<Partial<Record<string, string | null>>>;
  onMappingChange: (sourceId: string, targetId: string | null) => void;
  disabled?: boolean;
  labels?: Partial<Record<"source" | "target" | "choose" | "skip" | "unavailable" | "empty", string>> & {
    field?: (source: ImportSourceColumn) => string;
  };
}

/** Edit one explicit assignment per source column while retaining the parsed examples. */
export const ImportColumnMapping = /* @__PURE__ */ forwardRef<HTMLTableElement, ImportColumnMappingProps>(function ImportColumnMapping(
  {columns, targets, value, onMappingChange, disabled, labels, className, ...props}, ref,
) {
  const id = useId();
  const targetIds = new Set(targets.map(target => target.id));
  if (targetIds.size !== targets.length || new Set(columns.map(column => column.id)).size !== columns.length ||
      [...columns, ...targets].some(item => !item.id.trim() || !item.label.trim())) {
    throw new Error("Flood ImportColumnMapping requires unique nonempty source and target identifiers and labels");
  }
  const targetOptions = targets.map(target => (
    <option key={target.id} value={`target:${target.id}`}>{target.label}</option>
  ));
  return <Table {...props} ref={ref} density="compact" className={classes("flood-import-column-mapping", className)}>
    <thead><tr><th scope="col">{labels?.source ?? "Source column"}</th><th scope="col">{labels?.target ?? "Import into"}</th></tr></thead>
    <tbody>
      {columns.length ? columns.map((column, index) => {
        const draft = Object.prototype.hasOwnProperty.call(value, column.id) ? value[column.id] : undefined;
        const missingTarget = typeof draft === "string" && !targetIds.has(draft);
        const selected = draft === undefined ? "" : draft === null ? "skip" : missingTarget ? "unavailable" : `target:${draft}`;
        return <tr key={column.id}>
          <th scope="row"><Stack gap="1" className="flood-import-column-mapping__source">
            <Text size="label" dir="auto">{column.label}</Text>
            {column.example !== undefined && <Text size="helper" tone="subtle" dir="auto">{column.example}</Text>}
          </Stack></th>
          <td><Field id={column.fieldId ?? `${id}-column-${index}`}
            label={labels?.field?.(column) ?? `Import ${column.label} into`} hideLabel>
            {field => <Select {...field} controlSize="sm" value={selected} disabled={disabled}
              invalid={column.invalid || missingTarget} onChange={event => {
                const next = event.currentTarget.value;
                if (next === "skip") onMappingChange(column.id, null);
                else if (next.startsWith("target:")) onMappingChange(column.id, next.slice(7));
              }}>
              <option value="" disabled>{labels?.choose ?? "Choose a field"}</option>
              {missingTarget && <option value="unavailable" disabled>{labels?.unavailable ?? "Unavailable"}</option>}
              <option value="skip">{labels?.skip ?? "Skip"}</option>
              {targetOptions}
            </Select>}
          </Field></td>
        </tr>;
      }) : <tr><td colSpan={2}><Text size="compact" tone="subtle">{labels?.empty ?? "No source columns."}</Text></td></tr>}
    </tbody>
  </Table>;
});

export interface ExpenseAllocationLine {
  id: string;
  label: string;
  amount: string | null;
}

export interface ExpenseAllocationFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "children" | "onChange" | "onSubmit"> {
  currency: string;
  /** Nonnegative expense total as a canonical decimal string. */
  total: string;
  lines: readonly ExpenseAllocationLine[];
  onAmountChange: (id: string, amount: string | null) => void;
  onSubmit: (lines: readonly ExpenseAllocationLine[]) => void;
  locale?: string;
  pending?: boolean;
  error?: string;
  labels?: {allocation?: string; total?: string; remaining?: string; excess?: string; submit?: string; empty?: string};
}

function reconcileExpenseAllocation(
  money: ReturnType<typeof createMoneyFormat>, total: string, lines: readonly ExpenseAllocationLine[], owner: string,
) {
  const totalAmount = money.readValue(total)?.amount;
  const amounts = lines.map(line => money.readValue(line.amount)?.amount ?? 0n);
  if (totalAmount === undefined || totalAmount < 0n || amounts.some(amount => amount < 0n) ||
      lines.some(line => !line.id.trim() || !line.label.trim()) || new Set(lines.map(line => line.id)).size !== lines.length) {
    throw new Error(`Flood ${owner} requires nonnegative amounts and uniquely named allocation lines`);
  }
  return {totalAmount, amounts, remaining:totalAmount - amounts.reduce((sum, amount) => sum + amount, 0n)};
}

/** Allocate one expense across named destinations and reconcile the split exactly. @since 0.2.14 */
export const ExpenseAllocationForm = /* @__PURE__ */ forwardRef<HTMLFormElement, ExpenseAllocationFormProps>(function ExpenseAllocationForm(
  {currency, total, lines, onAmountChange, onSubmit, locale, pending = false, error, labels, lang, ...props}, ref,
) {
  const moneyLocale = locale ?? lang ?? "en-US";
  const money = useMemo(() => createMoneyFormat(currency,moneyLocale), [currency,moneyLocale]);
  const {totalAmount, remaining} = reconcileExpenseAllocation(money, total, lines, "ExpenseAllocationForm");
  const summary = [{
    id:"balance",
    label:remaining < 0n ? labels?.excess ?? "Over by" : labels?.remaining ?? "Unallocated",
    amount:money.formatUnsignedAmount(remaining < 0n ? -remaining : remaining),
  }];
  const canSubmit = lines.length > 0 && remaining === 0n;
  return <form {...props} ref={ref} lang={lang} aria-busy={pending || undefined} onSubmit={event => {
    event.preventDefault();
    if (!pending && canSubmit && event.currentTarget.checkValidity()) onSubmit(lines);
  }}>
    <Stack gap="4">
      <Fieldset legend={labels?.allocation ?? "Allocation"} layout="aligned">
        {lines.length ? lines.map(({id,label,amount}) => <Field label={label} key={id}>
          {field => <MoneyField {...field} currency={currency} locale={moneyLocale} value={amount} min="0"
            readOnly={pending} onValueChange={next => onAmountChange(id,next)} />}
        </Field>) : <Text as="p" size="compact" tone="subtle">{labels?.empty ?? "No allocation destinations."}</Text>}
      </Fieldset>
      <AmountBreakdown rows={summary} total={{label:labels?.total ?? "Expense total",amount:money.formatUnsignedAmount(totalAmount)}} />
      {error && <Text as="p" size="compact" tone="error" role="alert">{error}</Text>}
      <FormActions primary={<Button type="submit" disabled={!canSubmit}
        loading={pending ? "retain-focus" : false}>{labels?.submit ?? "Save split"}</Button>} />
    </Stack>
  </form>;
});

export interface ExpenseAllocationReviewProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  currency: string;
  /** Current expense total as a canonical nonnegative decimal string. */
  total: string;
  /** Recorded destination amounts as canonical nonnegative decimal strings. */
  lines: readonly (ExpenseAllocationLine & {amount: string})[];
  locale?: string;
  labels?: {
    review?: string;
    total?: string;
    empty?: string;
    remaining?: (amount: string) => string;
    excess?: (amount: string) => string;
  };
}

/** Review recorded allocations against the current expense total. @since 0.2.14 */
export const ExpenseAllocationReview = /* @__PURE__ */ forwardRef<HTMLDivElement, ExpenseAllocationReviewProps>(function ExpenseAllocationReview(
  {currency, total, lines, locale, labels, lang, ...props}, ref,
) {
  const moneyLocale = locale ?? lang ?? "en-US";
  const money = useMemo(() => createMoneyFormat(currency, moneyLocale), [currency, moneyLocale]);
  if (lines.some(line => !line.amount?.trim())) {
    throw new Error("Flood ExpenseAllocationReview requires a recorded amount on each line");
  }
  const {totalAmount, amounts, remaining} = reconcileExpenseAllocation(money, total, lines, "ExpenseAllocationReview");
  let warning: string | undefined;
  if (lines.length && remaining !== 0n) {
    const difference = money.formatUnsignedAmount(remaining < 0n ? -remaining : remaining);
    warning = remaining < 0n ? labels?.excess?.(difference) ?? `${difference} over the expense total`
      : labels?.remaining?.(difference) ?? `${difference} unallocated`;
  }

  return <Stack {...props} ref={ref} lang={lang} gap="3" role="group"
    aria-label={props["aria-label"] ?? labels?.review ?? "Expense allocation"}>
    {!lines.length && <Text size="compact" tone="subtle">{labels?.empty ?? "No allocation recorded."}</Text>}
    <AmountBreakdown rows={lines.map((line, index) =>
      ({id:line.id, label:line.label, amount:money.formatUnsignedAmount(amounts[index])}))}
      total={{label:labels?.total ?? "Expense total", amount:money.formatUnsignedAmount(totalAmount)}} />
    {warning && <StatusIndicator size="sm" tone="warning" presentation="wrap" label={warning} />}
  </Stack>;
});

export type TextRevisionState = "pending" | "accepted" | "rejected";

export interface TextRevisionProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  before?: string;
  after?: string;
  state?: TextRevisionState;
  active?: boolean;
  labels?: { removed: string; added: string };
}

/** One prepared text suggestion in the flow of a document. */
export const TextRevision = /* @__PURE__ */ forwardRef<HTMLSpanElement, TextRevisionProps>(function TextRevision(
  {before, after, state = "pending", active, labels, className, ...props}, ref,
) {
  return <span {...props} ref={ref} className={classes("flood-text-revision", className)} data-state={state} data-active={active || undefined}>
    {state === "accepted" ? after : state === "rejected" ? before : <>
      {before && <del><VisuallyHidden>{labels?.removed ?? "Removed"}: </VisuallyHidden>{before}</del>}
      {before && after && " "}
      {after && <ins><VisuallyHidden>{labels?.added ?? "Added"}: </VisuallyHidden>{after}</ins>}
    </>}
  </span>;
});

export interface ValueChangeProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  before?: ReactNode;
  after?: ReactNode;
  layout?: "inline" | "stacked" | "adaptive";
  labels?: {before?: string; after?: string; added?: string; removed?: string};
}

/** Previous and current values, with an explicit label for additions and removals. */
export const ValueChange = /* @__PURE__ */ forwardRef<HTMLDivElement, ValueChangeProps>(function ValueChange(
  {before, after, layout = "inline", labels, className, ...props}, ref,
) {
  const hasBefore = hasFieldContent(before);
  const hasAfter = hasFieldContent(after);
  const pair = hasBefore && hasAfter;
  const labeled = layout === "stacked" || !pair;
  const adaptive = layout === "adaptive" && pair;
  if (!hasBefore && !hasAfter) return null;
  const label = (text: string) => labeled
    ? <Text size="helper" tone="subtle" className="flood-value-change__label">{text}</Text>
    : <>
      <VisuallyHidden>{text}{" "}</VisuallyHidden>
      {adaptive && <Text size="helper" tone="subtle" aria-hidden="true" className="flood-value-change__label flood-value-change__label--adaptive">{text}</Text>}
    </>;
  return <div {...props} ref={ref} className={classes("flood-value-change", className)} data-layout={layout} data-adaptive-pair={adaptive || undefined}>
    {hasBefore && <div className="flood-value-change__value" data-side="before">
      {label(pair ? labels?.before ?? "Before" : labels?.removed ?? "Removed")}
      <div className="flood-value-change__content">{before}</div>
    </div>}
    {hasAfter && <div className="flood-value-change__value" data-side="after">
      {pair && layout !== "stacked" && <IconSlot size="2xs" className="flood-value-change__arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      </IconSlot>}
      {label(pair ? labels?.after ?? "After" : labels?.added ?? "Added")}
      <div className="flood-value-change__content">{after}</div>
    </div>}
  </div>;
});

export interface ChangeRegionProps extends HTMLAttributes<HTMLDivElement> {
  /** Keep the same wrapper when removing the marker so the text stays aligned. */
  state?: "changed" | "active" | "unmarked";
  /** Describe the change for assistive technology. */
  label?: string;
}

/** A quiet leading-edge mark for an edited document block. @since 0.2.14 */
export const ChangeRegion = /* @__PURE__ */ forwardRef<HTMLDivElement, ChangeRegionProps>(function ChangeRegion(
  {state = "changed", label = "Edited section", role, className, ...props}, ref,
) {
  const marked = state !== "unmarked";
  return <div {...props} ref={ref} data-state={state} className={classes("flood-change-region", className)}
    role={role ?? (marked ? "group" : undefined)}
    aria-label={props["aria-label"] ?? (marked ? label : undefined)}
    aria-current={props["aria-current"] ?? (state === "active" || undefined)}/>;
});

export interface ChangeListItem extends Pick<ValueChangeProps, "before" | "after"> {
  id: string;
  label: string;
}

export interface ChangeListProps extends Omit<DescriptionListProps, "items"> {
  items: readonly ChangeListItem[];
  valueLayout?: ValueChangeProps["layout"];
  labels?: ValueChangeProps["labels"];
}

function hasRecordedChange({before, after}: ChangeListItem) {
  return hasFieldContent(before) || hasFieldContent(after);
}

/** Named changes presented on shared definition-list tracks. */
export const ChangeList = /* @__PURE__ */ forwardRef<HTMLDListElement, ChangeListProps>(function ChangeList(
  {items, valueLayout, labels, ...props}, ref,
) {
  return <DescriptionList {...props} ref={ref} items={items.filter(hasRecordedChange).map(item => ({
    id: item.id, term: item.label,
    description: <ValueChange before={item.before} after={item.after} layout={valueLayout} labels={labels} />,
  }))} />;
});

export interface StagedChangeGroup {
  id: string;
  label: string;
  changes: readonly ChangeListItem[];
}

export interface StagedChangesProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  label: string;
  groups: readonly StagedChangeGroup[];
  defaultOpen?: boolean;
  emptyLabel?: string;
  valueLabels?: ValueChangeProps["labels"];
  /** The host owns confirmation, discarding the draft and focus recovery. */
  renderDiscard?: (change: ChangeListItem, group: StagedChangeGroup) => ReactNode;
}

/** Review grouped proposed changes before a host-owned apply action. @since 0.2.14 */
export const StagedChanges = /* @__PURE__ */ forwardRef<HTMLDivElement, StagedChangesProps>(function StagedChanges(
  {label, groups, defaultOpen = true, emptyLabel = "No staged changes.", valueLabels, renderDiscard, className, ...props}, ref,
) {
  const identifiesItems = (items: readonly {id: string; label: string}[]) =>
    items.every(item => item.id.trim() && item.label.trim()) && new Set(items.map(item => item.id)).size === items.length;
  if (!label.trim() || !identifiesItems(groups) || groups.some(group => !identifiesItems(group.changes))) {
    throw new Error("Flood StagedChanges requires a name, unique group IDs and unique change IDs within each group");
  }

  const changesByGroup = groups.map(group => ({group, changes: group.changes.filter(hasRecordedChange)}))
    .filter(({changes}) => changes.length);
  return <Stack {...props} ref={ref} gap="3" className={classes("flood-staged-changes", className)}
    role="group" aria-label={label}>
    {changesByGroup.length ? changesByGroup.map(({group, changes}) =>
      <Collapsible key={group.id} title={group.label} variant="flush" controlSize="sm" defaultOpen={defaultOpen}>
        <DataList aria-label={group.label} density="compact" dividers={false}>
          {changes.map(change => <DataListItem key={change.id} title={change.label}
            details={<ValueChange before={change.before} after={change.after} layout="adaptive" labels={valueLabels} />}
            actions={renderDiscard?.(change, group)} />)}
        </DataList>
      </Collapsible>) : <Text size="compact" tone="subtle">{emptyLabel}</Text>}
  </Stack>;
});

export interface AgentHandoffParticipant {
  label: string;
  href?: string;
}

export type AgentHandoffState = "requested" | "transferred" | "failed" | "unknown";

export interface AgentHandoffProps extends Omit<SectionProps, "children" | "title" | "actions" | "headingSize"> {
  from: AgentHandoffParticipant;
  to: AgentHandoffParticipant;
  /** Recorded outcome of the transfer itself. */
  state: AgentHandoffState;
  /** Safe display text from the recorded event. */
  detail?: string;
  labels?: Partial<Record<"title" | "from" | "to" | AgentHandoffState, string>>;
}

const agentHandoffStates = {
  requested:{label:"Requested",tone:"info"},
  transferred:{label:"Transferred",tone:"success"},
  failed:{label:"Transfer failed",tone:"error"},
  unknown:{label:"Outcome unavailable",tone:"neutral"},
} as const;

/** Inspect an observed transfer between agents. @since 0.2.14 */
export const AgentHandoff = /* @__PURE__ */ forwardRef<HTMLElement, AgentHandoffProps>(function AgentHandoff(
  {from, to, state, detail, labels, ...props}, ref,
) {
  if (!from.label.trim() || !to.label.trim()) {
    throw new Error("Flood AgentHandoff requires names for both participants");
  }
  const status = agentHandoffStates[state];
  const participant = ({label, href}: AgentHandoffParticipant) =>
    <Text size="label" dir="auto" style={{overflowWrap:"anywhere"}}>
      {href ? <Link href={href}>{label}</Link> : label}
    </Text>;
  return <Section {...props} ref={ref} title={labels?.title ?? "Agent handoff"} headingSize="group"
    actions={<StatusIndicator size="sm" presentation="wrap" tone={status.tone} label={labels?.[state] ?? status.label} />}>
    <Stack gap="3">
      <DescriptionList layout="grid" density="compact" items={[
        {id:"from",term:labels?.from ?? "From",description:participant(from)},
        {id:"to",term:labels?.to ?? "To",description:participant(to)},
      ]}/>
      {detail && <Text as="p" size="compact" tone="subtle" dir="auto" style={{overflowWrap:"anywhere"}}>{detail}</Text>}
    </Stack>
  </Section>;
});

export interface EnvironmentSyncEndpoint {
  id: string;
  label: string;
}

export interface EnvironmentSyncReviewProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  source: EnvironmentSyncEndpoint;
  destination: EnvironmentSyncEndpoint;
  /** A null plan is unavailable. An empty plan confirms there are no changes. */
  groups: readonly StagedChangeGroup[] | null;
  labels?: {
    review?: string;
    source?: string;
    destination?: string;
    changes?: string;
    unavailable?: string;
    empty?: string;
    removals?: (count: number) => string;
    values?: ValueChangeProps["labels"];
  };
}

/** Review the effect of syncing one environment into another. @since 0.2.14 */
export const EnvironmentSyncReview = /* @__PURE__ */ forwardRef<HTMLDivElement, EnvironmentSyncReviewProps>(function EnvironmentSyncReview(
  {source, destination, groups, labels, className, ...props}, ref,
) {
  if (!source.id.trim() || !destination.id.trim() || source.id === destination.id ||
    !source.label.trim() || !destination.label.trim()) {
    throw new Error("Flood EnvironmentSyncReview requires distinct source and destination environments with names");
  }
  const removals = groups?.reduce((total, group) =>
    total + group.changes.filter(change => hasFieldContent(change.before) && !hasFieldContent(change.after)).length, 0) ?? 0;

  return <Stack {...props} ref={ref} gap="4" role="group" aria-label={props["aria-label"] ?? labels?.review ?? "Environment sync review"}
    className={classes("flood-environment-sync-review", className)}>
    <DescriptionList layout="grid" density="compact" dividers={false} items={[
      {id:"source", term:labels?.source ?? "Source", description:source.label},
      {id:"destination", term:labels?.destination ?? "Destination", description:destination.label},
    ]} />
    {removals > 0 && <StatusIndicator tone="warning" presentation="wrap"
      label={labels?.removals?.(removals) ?? `${removals} ${removals === 1 ? "removal" : "removals"} in the destination`} />}
    {groups === null
      ? <Text size="compact" tone="subtle">{labels?.unavailable ?? "Sync plan unavailable."}</Text>
      : <StagedChanges key={JSON.stringify([source.id, destination.id])} label={labels?.changes ?? "Planned changes"}
        groups={groups} emptyLabel={labels?.empty ?? "No changes to sync."}
        valueLabels={{before:"Current", after:"Planned", added:"Will add", removed:"Will remove", ...labels?.values}} />}
  </Stack>;
});

export interface TableProps extends Omit<TableHTMLAttributes<HTMLTableElement>, "children"> {
  caption: string;
  children: ReactNode;
  hideCaption?: boolean;
  density?: DataDensity;
  striped?: boolean;
  scrollLabel?: string;
  /** Maximum height of the scroll viewport, including the header and caption. */
  maxViewportHeight?: CSSProperties["maxBlockSize"];
  stickyHeader?: boolean;
  /** Shared cell alignment. Middle keeps mixed record/action rows coherent; top is an explicit prose-table choice. */
  cellVerticalAlign?: "top" | "middle" | "bottom";
}
/** @since 0.2.4 */
export const Table = /* @__PURE__ */ forwardRef<HTMLTableElement, TableProps>(function Table(
  { caption, children, hideCaption = false, density = "comfortable", striped = false, scrollLabel, cellVerticalAlign = "middle", stickyHeader = false, ...props }, ref,
) {
  return <TabularData {...props} ref={ref} caption={caption} hideCaption={hideCaption} density={density} striped={striped} scrollLabel={scrollLabel} cellVerticalAlign={cellVerticalAlign} stickyHeader={stickyHeader}>{children}</TabularData>;
});

export interface EditableGridColumn {
  id: string;
  label: string;
  inputMode?: InputProps["inputMode"];
  align?: "start" | "end";
  readOnly?: boolean;
  validate?: (value: string, row: EditableGridRow) => string | undefined;
  format?: (value: string, row: EditableGridRow) => string;
}
export interface EditableGridRow {
  id: string;
  label?: string;
  values: Readonly<Record<string, string>>;
  readOnlyColumns?: readonly string[];
}
export interface EditableGridChange {
  rowId: string;
  columnId: string;
  value: string;
  previousValue: string;
}
export interface EditableGridLabels {
  edit?: (column: string, row: string) => string;
  invalidPaste?: string;
  pasteOutsideGrid?: string;
  readOnlyCell?: string;
  conflict?: string;
  empty?: string;
}
export interface EditableGridProps extends Omit<TableProps, "children" | "role" | "onCopy" | "onPaste" | "onKeyDown"> {
  columns: readonly EditableGridColumn[];
  rows: readonly EditableGridRow[];
  /** Receive a validated batch. Return a message to reject it while keeping values unchanged. */
  onChanges?: (changes: readonly EditableGridChange[], source: "edit" | "paste") => string | void;
  readOnly?: boolean;
  labels?: EditableGridLabels;
}
/** Controlled cell editing and rectangular clipboard selection. @since 0.2.14 */
export const EditableGrid = /* @__PURE__ */ forwardRef<HTMLTableElement, EditableGridProps>(function EditableGrid(props, ref) {
  return <SheetGrid {...props} ref={ref} />;
});

export interface ComparisonTableColumn {
  id: string;
  label: string;
}

export interface ComparisonTableRow {
  id: string;
  label: string;
  detail?: ReactNode;
  cells: Readonly<Record<string, ReactNode>>;
  /** End-align values with tabular figures. Use a shared unit in the criterion label. */
  numeric?: boolean;
}

export interface ComparisonTableProps extends Omit<TableProps, "children" | "striped" | "cellVerticalAlign"> {
  criterionLabel: string;
  columns: readonly ComparisonTableColumn[];
  rows: readonly ComparisonTableRow[];
  /** Quietly emphasize a named option, such as the current plan. */
  featuredColumnId?: string;
  unavailableLabel?: string;
  emptyLabel?: string;
  /** Fit short values side by side, keeping the criterion pinned when more columns overflow. */
  layout?: "options" | "compact";
}

/** A table of shared criteria with a pinned criterion column. */
export const ComparisonTable = /* @__PURE__ */ forwardRef<HTMLTableElement, ComparisonTableProps>(function ComparisonTable(
  {criterionLabel, columns, rows, featuredColumnId, unavailableLabel = "Unavailable", emptyLabel, layout = "options", className, ...props}, ref,
) {
  if ([columns, rows].some(items => items.some(({id}) => !id.trim()) || new Set(items.map(({id}) => id)).size !== items.length)) {
    throw new Error("Flood ComparisonTable requires unique nonempty option and criterion IDs");
  }
  return <Table {...props} ref={ref} className={classes("flood-comparison-table", className)} data-layout={layout}>
    <thead>
      <tr>
        <th scope="col">{criterionLabel}</th>
        {columns.map(column => <th scope="col" key={column.id}
          data-featured={column.id === featuredColumnId || undefined}>{column.label}</th>)}
      </tr>
    </thead>
    <tbody>
      {!rows.length && emptyLabel && <tr><td colSpan={columns.length + 1}>
        <Text size="compact" tone="subtle">{emptyLabel}</Text>
      </td></tr>}
      {rows.map(row => <tr key={row.id}>
          <th scope="row">
            {row.label}
            {hasFieldContent(row.detail) && <Text as="div" size="helper" tone="subtle">{row.detail}</Text>}
          </th>
        {columns.map(column => {
          const value = Object.hasOwn(row.cells, column.id) ? row.cells[column.id] : undefined;
          return <td key={column.id} data-featured={column.id === featuredColumnId || undefined} data-numeric={row.numeric || undefined}>
            {hasFieldContent(value) ? value : <Text size="compact" tone="subtle">{unavailableLabel}</Text>}
          </td>;
        })}
      </tr>)}
    </tbody>
  </Table>;
});

export type MigrationHistoryState = "recorded" | "missing" | "unknown";

export interface MigrationHistoryEntry {
  version: string;
  name?: string;
  /** Known history membership keyed by source ID. Unreported entries are unknown. */
  history: Readonly<Partial<Record<string, MigrationHistoryState>>>;
}

export interface MigrationHistoryProps extends Omit<ComparisonTableProps,
  "criterionLabel" | "columns" | "rows" | "featuredColumnId" | "unavailableLabel" | "emptyLabel" | "layout"> {
  sources: readonly ComparisonTableColumn[];
  migrations: readonly MigrationHistoryEntry[];
  labels?: {migration?: string; empty?: string; states?: Partial<Record<MigrationHistoryState, string>>};
}

const migrationHistoryStates = {
  recorded: "Recorded",
  missing: "Missing",
  unknown: "Unknown",
} as const;

/** Compare migration history across independently observed sources. @since 0.2.14 */
export const MigrationHistory = /* @__PURE__ */ forwardRef<HTMLTableElement, MigrationHistoryProps>(function MigrationHistory(
  {sources, migrations, labels, density = "compact", ...props}, ref,
) {
  if (!sources.length) throw new Error("Flood MigrationHistory requires at least one source");
  const rows = migrations.map(({version, name, history}) => ({
    id: version,
    label: name?.trim() ? name : version,
    detail: name?.trim() ? <bdi>{version}</bdi> : undefined,
    cells: Object.fromEntries(sources.map(({id}) => {
      const state = (Object.hasOwn(history, id) ? history[id] : undefined) ?? "unknown";
      const text = labels?.states?.[state] ?? migrationHistoryStates[state];
      return [id, state === "missing" ? <StatusIndicator label={text} size="sm" tone="warning" presentation="wrap" />
        : <Text size="compact" tone={state === "unknown" ? "subtle" : "default"}>{text}</Text>];
    })),
  }));
  return <ComparisonTable {...props} ref={ref} columns={sources} rows={rows} layout="compact" density={density}
    criterionLabel={labels?.migration ?? "Migration"} emptyLabel={labels?.empty ?? "No migrations recorded."} />;
});

export type ReceiptMatchOutcome = "verified" | "needs-review" | "unverified";

export interface ReceiptMatchField {
  id: string;
  label: string;
  receipt?: string;
  transaction?: string;
  /** Mark a discrepancy reported by the host, even if the formatted values look alike. */
  differs?: boolean;
}

export interface ReceiptMatchReviewProps extends Omit<SectionProps, "children" | "description" | "actions" | "headingSize"> {
  outcome: ReceiptMatchOutcome;
  fields: readonly ReceiptMatchField[];
  labels?: {
    field?: string;
    receipt?: string;
    transaction?: string;
    missing?: string;
    different?: string;
    empty?: string;
    outcomes?: Partial<Record<ReceiptMatchOutcome, string>>;
  };
}

const receiptMatchOutcomes = {
  verified: {label:"Verified", tone:"success"},
  "needs-review": {label:"Needs review", tone:"warning"},
  unverified: {label:"Unverified", tone:"neutral"},
} as const;

/** Review recorded evidence for a receipt and a transaction side by side. @since 0.2.14 */
export const ReceiptMatchReview = /* @__PURE__ */ forwardRef<HTMLElement, ReceiptMatchReviewProps>(function ReceiptMatchReview(
  {title, outcome, fields, labels, className, ...props}, ref,
) {
  if (fields.some(({id}) => !id.trim()) || new Set(fields.map(({id}) => id)).size !== fields.length) {
    throw new Error("Flood ReceiptMatchReview requires unique nonempty field IDs");
  }
  const state = receiptMatchOutcomes[outcome];
  const missing = <Text as="span" size="compact" tone="subtle">{labels?.missing ?? "Unavailable"}</Text>;
  return <Section {...props} ref={ref} title={title} headingSize="group"
    className={classes("flood-receipt-match-review", className)}
    actions={<StatusIndicator label={labels?.outcomes?.[outcome] ?? state.label} tone={state.tone} presentation="wrap" size="sm" />}>
    {fields.length > 0 ? <Table caption={title} hideCaption density="compact" className="flood-receipt-match-review__table">
      <thead>
        <tr><th scope="col">{labels?.field ?? "Field"}</th><th scope="col">{labels?.receipt ?? "Receipt"}</th>
          <th scope="col">{labels?.transaction ?? "Transaction"}</th></tr>
      </thead>
      <tbody>
        {fields.map(field => <tr key={field.id}>
          <th scope="row">
            {field.label}
            {field.differs && <StatusIndicator className="flood-receipt-match-review__difference" size="sm"
              label={labels?.different ?? "Differs"} tone="warning" presentation="wrap" />}
          </th>
          <td>{field.receipt?.trim() ? <bdi>{field.receipt}</bdi> : missing}</td>
          <td>{field.transaction?.trim() ? <bdi>{field.transaction}</bdi> : missing}</td>
        </tr>)}
      </tbody>
    </Table> : <Text size="compact" tone="subtle">{labels?.empty ?? "No comparison available."}</Text>}
  </Section>;
});

export interface TableSkeletonColumn extends Pick<DataTableColumn, "id" | "label" | "width" | "placeholderLines"> {
  align?: "start" | "center" | "end";
}

export interface TableSkeletonProps extends Omit<TableProps, "children" | "aria-busy"> {
  columns: readonly TableSkeletonColumn[];
  rows?: number;
  animate?: boolean;
  announce?: boolean;
  loadingLabel?: string;
}

/** A loading table with real column labels and decorative body rows. */
export const TableSkeleton = /* @__PURE__ */ forwardRef<HTMLTableElement, TableSkeletonProps>(function TableSkeleton(
  {rows = 4, announce = true, loadingLabel = "Loading rows…", animate = true, ...props}, ref,
) {
  return <SkeletonTable {...props} ref={ref} rows={rows} announce={announce} loadingLabel={loadingLabel} animate={animate} />;
});

export type SemanticTone = "neutral" | "accent" | "error" | "warning" | "success" | "info";
export type BadgeTone = SemanticTone;
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  size?: ContentSize;
  tone?: BadgeTone;
  variant?: "subtle" | "outline";
}
/** @since 0.2.4 */
export const Badge = /* @__PURE__ */ forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { size = "md", tone = "neutral", variant = "subtle", className, ...props }, ref,
) {
  return <span {...props} ref={ref} className={classes("flood-badge", className)} data-size={size} data-tone={tone} data-variant={variant} />;
});

export interface CountBadgeProps extends Omit<BadgeProps, "children"> {
  count: number;
  max?: number;
  showZero?: boolean;
  presentation?: "count" | "dot";
  locale?: string;
  /** Localized label for the exact count, including when the visual number is capped. */
  formatLabel?: (count: number) => string;
}

/** A passive count, optionally capped or represented by a dot. */
export const CountBadge = /* @__PURE__ */ forwardRef<HTMLSpanElement, CountBadgeProps>(function CountBadge(
  {count, max = 99, showZero = false, presentation = "count", size = "sm", tone, locale, lang, formatLabel, className, ...props}, ref,
) {
  if (!Number.isSafeInteger(count) || count < 0 || !Number.isSafeInteger(max) || max < 1) {
    throw new RangeError("Flood CountBadge requires a nonnegative count and a positive maximum");
  }
  if (count === 0 && (!showZero || presentation === "dot")) return null;
  const format = new Intl.NumberFormat(locale ?? lang ?? "en");
  const dot = presentation === "dot";
  const visible = dot ? "" : count > max ? `${format.format(max)}+` : format.format(count);
  const label = formatLabel?.(count) ?? format.format(count);
  if (!label.trim()) throw new Error("Flood CountBadge requires a nonempty formatted label");
  return <Badge {...props} ref={ref} lang={lang ?? locale} size={size} tone={tone ?? (dot ? "accent" : "neutral")}
    className={classes("flood-count-badge",className)} data-presentation={presentation}>
    {visible === label ? <bdi>{visible}</bdi> : <>
      {visible && <bdi aria-hidden="true">{visible}</bdi>}
      <VisuallyHidden>{label}</VisuallyHidden>
    </>}
  </Badge>;
});

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "role" | "aria-label" | "aria-hidden"> {
  size?: ContentSize;
  label?: string;
  decorative?: boolean;
}
/** @since 0.2.4 */
export const Spinner = /* @__PURE__ */ forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = "md", label = "Loading", decorative = false, className, ...props }, ref,
) {
  return <span {...props} ref={ref} className={classes("flood-loading", className)} data-size={size}
    role={decorative ? undefined : "status"} aria-hidden={decorative || undefined}>
    <span className="flood-spinner" aria-hidden="true" />
    {!decorative && <VisuallyHidden>{label}</VisuallyHidden>}
  </span>;
});

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "role" | "tabIndex" | "aria-label" | "aria-hidden"> {
  shape?: "text" | "rounded" | "circle";
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  animate?: boolean;
}
/** @since 0.2.4 */
export const Skeleton = /* @__PURE__ */ forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(
  { shape = "text", width, height, animate = true, className, style, ...props }, ref,
) {
  return <span {...props} ref={ref} className={classes("flood-skeleton", className)} data-shape={shape} data-animate={animate}
    aria-hidden="true" style={{ width, height, ...style }} />;
});

export interface ListSkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  label: string;
  rows?: number;
  density?: DataListProps["density"];
  media?: boolean;
  description?: boolean;
  metadata?: boolean;
  reserveSelectionSpace?: boolean;
  dividers?: boolean;
  animate?: boolean;
}

/** A decorative list placeholder with one localized loading message. */
export const ListSkeleton = /* @__PURE__ */ forwardRef<HTMLDivElement, ListSkeletonProps>(function ListSkeleton(
  {label, rows = 3, density = "comfortable", media = false, description = false,
    metadata = false, reserveSelectionSpace, dividers, animate = true, className, ...props}, ref,
) {
  if (!label.trim() || !Number.isSafeInteger(rows) || rows < 1) throw new Error("Flood ListSkeleton requires a label and a positive row count");
  return <div {...props} ref={ref} className={classes("flood-list-skeleton", className)}>
    <VisuallyHidden role="status">{label}</VisuallyHidden>
    <DataList density={density} dividers={dividers} reserveSelectionSpace={reserveSelectionSpace} aria-hidden="true">
      {Array.from({length: rows}, (_, index) => <DataListItem key={index}
        media={media ? <Skeleton shape="circle" className="flood-list-skeleton__media" animate={animate} /> : undefined}
        title={<Skeleton width={index % 2 ? "55%" : "70%"} className="flood-list-skeleton__line" animate={animate} />}
        description={description ? <Skeleton width={index % 2 ? "72%" : "88%"} className="flood-list-skeleton__line" animate={animate} /> : undefined}
        metadata={metadata ? <Skeleton className="flood-list-skeleton__metadata" animate={animate} /> : undefined}
      />)}
    </DataList>
  </div>;
});

export interface NotificationSkeletonRow {
  media?: boolean;
  titleLines?: 1 | 2;
  descriptionLines?: 1 | 2;
  metadata?: boolean;
  action?: boolean;
}

export interface NotificationListSkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  label: string;
  /** A row count or shapes matching the expected first page. */
  rows?: number | readonly NotificationSkeletonRow[];
  /** Repeated shape when rows is a count. */
  row?: NotificationSkeletonRow;
  density?: NotificationListProps["density"];
  dividers?: boolean;
  reserveMediaSpace?: boolean;
  animate?: boolean;
}

/** Loading rows with the same alignment and responsive tracks as NotificationList. */
export const NotificationListSkeleton = /* @__PURE__ */ forwardRef<HTMLDivElement, NotificationListSkeletonProps>(function NotificationListSkeleton(
  {label, rows = 3, row = {}, density, dividers, reserveMediaSpace, animate = true, className, ...props}, ref,
) {
  const count = typeof rows === "number" ? rows : rows.length;
  if (!label.trim() || !Number.isSafeInteger(count) || count < 1) {
    throw new Error("Flood NotificationListSkeleton requires a label and a positive row count");
  }
  const shapes = typeof rows === "number" ? Array.from({length: count}, () => row) : rows;
  const lines = (count: number, width: string) => <span className="flood-notification-skeleton__lines">
    {Array.from({length: count}, (_, index) => <Skeleton key={index} width={index === 0 ? width : "45%"}
      className="flood-list-skeleton__line" animate={animate} />)}
  </span>;
  return <div {...props} ref={ref} className={classes("flood-notification-skeleton", className)}>
    <VisuallyHidden role="status">{label}</VisuallyHidden>
    <NotificationList label={label} aria-hidden="true" density={density} dividers={dividers} reserveMediaSpace={reserveMediaSpace}>
      {shapes.map(({media, titleLines = 1, descriptionLines, metadata, action}, index) => <DataListItem key={index}
        className="flood-notification-item" data-has-media={media || undefined}
        media={<span className="flood-notification-item__leading">
          {media && <Skeleton shape="circle" className="flood-list-skeleton__media" animate={animate} />}
        </span>}
        title={lines(titleLines, index % 2 ? "55%" : "70%")}
        description={descriptionLines ? lines(descriptionLines, "88%") : undefined}
        metadata={metadata ? <Skeleton className="flood-list-skeleton__metadata" animate={animate} /> : undefined}
        actions={action ? <span className="flood-notification-skeleton__action flood-action-placeholder flood-action-placeholder--icon flood-control--xs">
          <Skeleton shape="circle" width=".75rem" height=".75rem" animate={animate} />
        </span> : undefined}
      />)}
    </NotificationList>
  </div>;
});

export interface AvatarPresence {
  state: "online" | "away" | "busy" | "offline";
  /** Localized name of the current availability state. */
  label: string;
}

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "role" | "aria-label" | "aria-hidden"> {
  name: string;
  src?: string;
  fallback?: string;
  size?: "2xs" | "xs" | ContentSize;
  shape?: "circle" | "rounded";
  decorative?: boolean;
  /** Host-supplied availability. Omit when presence is unknown or irrelevant. */
  presence?: AvatarPresence;
}
/** @since 0.2.4 */
export const Avatar = /* @__PURE__ */ forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { name, src, fallback, size = "md", shape = "circle", decorative = false, presence, className, ...props }, ref,
) {
  if (presence && !presence.label.trim()) throw new Error("Flood Avatar presence requires a label");
  const initials = name.trim().split(/\s+/u).filter(Boolean).slice(0, 2).map(word => Array.from(word)[0]).join("").toUpperCase();
  const label = presence ? `${name}, ${presence.label}` : name;
  return <span {...props} ref={ref} className={classes("flood-avatar", className)} data-size={size} data-shape={shape}
    data-presence={presence?.state} role={decorative ? undefined : "img"} aria-label={decorative ? undefined : label} aria-hidden={decorative || undefined}>
    <AvatarArtwork key={src ?? ""} src={src} fallback={fallback ?? (initials || "?")} />
    {presence && <span className="flood-avatar__presence" aria-hidden="true" />}
  </span>;
});

export interface AuthorMetaProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  name: string;
  src?: string;
  fallback?: string;
  size?: "sm" | "md";
  presence?: AvatarPresence;
  /** Secondary identity or date, such as a Timestamp. */
  metadata?: ReactNode;
  metadataPlacement?: "below" | "inline";
  nameOverflow?: "wrap" | "truncate";
}

/** A named person with an avatar and optional secondary metadata. */
export const AuthorMeta = /* @__PURE__ */ forwardRef<HTMLSpanElement, AuthorMetaProps>(function AuthorMeta(
  {name, src, fallback, size = "md", presence, metadata, metadataPlacement = "below", nameOverflow = "wrap", className, ...props}, ref,
) {
  if (!name.trim()) throw new Error("Flood AuthorMeta requires a name");
  return <span {...props} ref={ref} className={classes("flood-author-meta", className)} data-size={size} data-metadata-placement={metadataPlacement}>
    <Avatar name={name} src={src} fallback={fallback} size={size} presence={presence} decorative />
    <span className="flood-author-meta__copy">
      <Text size={size === "sm" ? "helper" : "label"} className="flood-author-meta__name" dir="auto">
        {nameOverflow === "truncate" ? <TruncatedText dir="auto" hidden={props.hidden} tooltipSide="top">{name}</TruncatedText> : name}
      </Text>
      {presence && <VisuallyHidden>{presence.label}</VisuallyHidden>}
      {hasFieldContent(metadata) && <Text size="helper" tone="subtle" className="flood-author-meta__metadata">{metadata}</Text>}
    </span>
  </span>;
});

export interface ProfileFact {
  id: string;
  label: string;
  /** A display-ready value. The host owns localization and compact formatting. */
  value: string | number;
  href?: string;
}

export interface ProfileSummaryProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  name: string;
  handle?: string;
  src?: string;
  fallback?: string;
  href?: string;
  description?: ReactNode;
  facts?: readonly ProfileFact[];
  factsLabel?: string;
  actions?: ReactNode;
}

/** Read a profile and act on it within the surrounding list, panel or overlay. @since 0.2.14 */
export const ProfileSummary = /* @__PURE__ */ forwardRef<HTMLDivElement, ProfileSummaryProps>(function ProfileSummary(
  {name, handle, src, fallback, href, description, facts, factsLabel = "Profile facts", actions, className, ...props}, ref,
) {
  const identity = <AuthorMeta name={name} src={src} fallback={fallback}
    metadata={handle && <bdi>{handle}</bdi>} />;
  return <Stack {...props} ref={ref} gap="3" className={classes("flood-profile-summary", className)}>
    <Inline gap="3">
      <div className="flood-profile-summary__identity">
        {href ? <Link href={href} className="flood-profile-summary__link">{identity}</Link> : identity}
      </div>
      {hasFieldContent(actions) && <Inline gap="2" className="flood-profile-summary__actions">{actions}</Inline>}
    </Inline>
    {hasFieldContent(description) && <Text as="div" size="compact" className="flood-profile-summary__description">{description}</Text>}
    {facts?.length ? <MetadataList label={factsLabel} items={facts.map(({id, label, value, href: factHref}) => {
      const content = <><Text size="helper" tone="default" className="flood-profile-summary__number">{value}</Text>{" "}{label}</>;
      return {id, value:factHref ? <Link href={factHref}>{content}</Link> : content};
    })} /> : null}
  </Stack>;
});

export interface CommentProps extends HTMLAttributes<HTMLElement> {
  author: Pick<AuthorMetaProps, "name" | "src" | "fallback" | "metadata" | "presence">;
  size?: AuthorMetaProps["size"];
  /** Host-owned commands such as Reply or Copy link. */
  actions?: ReactNode;
  /** Opens the reply editor for this comment. The host owns its placement and focus. */
  onReply?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  replyLabel?: string;
  /** Context for an already posted reply, rendered before the message. */
  replyReference?: ReactNode;
  attachments?: ReactNode;
  reactions?: ReactNode;
  /** A persistent add-reaction affordance when this message already has reactions. */
  reactionPicker?: ReactNode;
  /** Reveal secondary actions on pointer hover or keyboard focus, while keeping their layout space. */
  actionVisibility?: "on-interaction" | "always";
}

/** An attributed message with its own optional actions. */
export const Comment = /* @__PURE__ */ forwardRef<HTMLElement, CommentProps>(function Comment(
  {author, size = "md", actions, onReply, replyLabel = "Reply", replyReference, attachments, reactions, reactionPicker, actionVisibility = "on-interaction", children, className, ...props}, ref,
) {
  const hasReactions = Array.isArray(reactions) ? reactions.some(hasFieldContent) : hasFieldContent(reactions);
  const hasActions = Boolean(onReply) || hasFieldContent(actions);
  return <article {...props} ref={ref} className={classes("flood-comment", className)} data-action-visibility={actionVisibility}>
    <AuthorMeta {...author} size={size} metadataPlacement="inline" />
    <div className="flood-comment__body">
      {hasFieldContent(replyReference) && replyReference}
      <Text as="div" size={size === "sm" ? "compact" : "body"} className="flood-comment__message">{children}</Text>
      {hasFieldContent(attachments) && <div className="flood-comment__attachments">{attachments}</div>}
    </div>
    {(hasReactions || hasFieldContent(reactionPicker) || hasActions) && <footer className="flood-comment__footer" data-has-reactions={hasReactions}>
      <Inline gap="1" align="center">
        {hasReactions && <Inline key="reactions" gap="1" align="center" className="flood-comment__reactions">{reactions}</Inline>}
        {hasFieldContent(reactionPicker) && <div key="picker" className="flood-comment__picker">{reactionPicker}</div>}
        {hasActions && <Inline gap="1" align="center" className="flood-comment__actions">
          {onReply && <IconButton type="button" size="xs" variant="ghost" label={replyLabel} title={replyLabel} onClick={onReply}><ReplyIcon /></IconButton>}
          {actions}
        </Inline>}
      </Inline>
    </footer>}
  </article>;
});

export interface CommentThreadItem extends Pick<CommentProps, "author" | "actions" | "onReply" | "replyLabel" | "replyReference" | "attachments" | "reactions" | "reactionPicker"> {
  id: string;
  /** Document-unique fragment target, independent of the sibling record ID. */
  anchorId?: string;
  body: ReactNode;
  replies?: readonly CommentThreadItem[];
  /** A localized disclosure title. Omit to show replies directly. */
  repliesDisclosure?: { label: string; defaultOpen?: boolean };
}

export interface CommentThreadProps extends Omit<OlHTMLAttributes<HTMLOListElement>, "children"> {
  items: readonly CommentThreadItem[];
  size?: CommentProps["size"];
  actionVisibility?: CommentProps["actionVisibility"];
  dividers?: boolean;
  /** Marks the start of unread messages before a visible top-level item. */
  unreadBoundary?: { beforeId: string; label?: string };
}

/** Related authored messages in the order supplied by the host. */
export const CommentThread = /* @__PURE__ */ forwardRef<HTMLOListElement, CommentThreadProps>(function CommentThread(
  {items, size = "sm", actionVisibility, dividers = false, unreadBoundary, className, ...props}, ref,
) {
  return <ol {...props} ref={ref} className={classes("flood-comment-thread", className)} data-dividers={dividers} data-size={size} role="list">
    {renderCommentThreadItems(items, size, actionVisibility, 0, unreadBoundary)}
  </ol>;
});

function renderCommentThreadItems(
  items: readonly CommentThreadItem[],
  size: NonNullable<CommentThreadProps["size"]>,
  actionVisibility: CommentThreadProps["actionVisibility"],
  depth: number,
  unreadBoundary?: CommentThreadProps["unreadBoundary"],
): ReactNode {
  if (items.some(item => !item.id.trim()) || new Set(items.map(item => item.id)).size !== items.length) {
    throw new Error("Flood CommentThread requires unique nonempty IDs within each sibling list");
  }
  return items.map(item => {
    const replies = item.replies?.length ? <ol className="flood-comment-thread__replies" role="list" data-indent={depth < 2}>
      {renderCommentThreadItems(item.replies, size, actionVisibility, depth + 1)}
    </ol> : null;
    return <li key={item.id}>
      {unreadBoundary?.beforeId === item.id && <UnreadMarker label={unreadBoundary.label} />}
      <Comment id={item.anchorId} tabIndex={item.anchorId ? -1 : undefined}
        author={item.author} size={size} actions={item.actions} onReply={item.onReply} replyLabel={item.replyLabel}
        replyReference={item.replyReference} attachments={item.attachments} reactions={item.reactions}
        reactionPicker={item.reactionPicker} actionVisibility={actionVisibility}>{item.body}</Comment>
      {replies && (item.repliesDisclosure ? <Collapsible title={item.repliesDisclosure.label}
        defaultOpen={item.repliesDisclosure.defaultOpen} controlSize="sm" variant="flush" className="flood-comment-thread__disclosure" data-indent={depth < 2}>
        {replies}
      </Collapsible> : replies)}
    </li>;
  });
}

export interface ReviewThreadProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  title: string;
  items: CommentThreadProps["items"];
  resolved: boolean;
  /** Request a change. The accepted value comes from resolved. */
  onResolvedChange?: (resolved: boolean) => void;
  pending?: boolean;
  error?: string;
  /** The accepted decision or a link to its source, shown after resolution. */
  resolution?: ReactNode;
  headingLevel?: HeadingProps["level"];
  labels?: {open?: string; resolved?: string; resolve?: string; reopen?: string};
}

/** A review discussion with a reversible, host-controlled resolution. */
export const ReviewThread = /* @__PURE__ */ forwardRef<HTMLDivElement, ReviewThreadProps>(function ReviewThread({
  title, items, resolved, onResolvedChange, pending, error, resolution, headingLevel = 2, labels, ...props
}, ref) {
  const titleId = useId();
  if (!title.trim()) throw new Error("Flood ReviewThread requires a title");
  const stateLabel = resolved ? labels?.resolved ?? "Resolved" : labels?.open ?? "Open";
  const actionLabel = resolved ? labels?.reopen ?? "Reopen thread" : labels?.resolve ?? "Resolve thread";
  return <Stack {...props} ref={ref} role="article" aria-labelledby={titleId} gap="4">
    <Stack gap="2">
      <Inline gap="2" align="center" style={{justifyContent:"space-between"}}>
        <Heading id={titleId} level={headingLevel} size="group" dir="auto">{title}</Heading>
        {onResolvedChange && <Button size="sm" variant="ghost" loading={pending ? "retain-focus" : false}
          aria-label={actionLabel} onClick={() => onResolvedChange(!resolved)}>{actionLabel}</Button>}
      </Inline>
      <StatusIndicator label={stateLabel} tone={resolved ? "success" : "neutral"} size="sm" announce presentation="wrap" />
      {error && <Text as="p" size="compact" tone="error" role="alert">{error}</Text>}
      {resolved && hasFieldContent(resolution) && <Text as="div" size="compact" tone="subtle">{resolution}</Text>}
    </Stack>
    {items.length > 0 && <CommentThread aria-labelledby={titleId} items={items} />}
  </Stack>;
});

export interface UnreadMarkerProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  label?: string;
}

/** A noninteractive label at the start of the unread portion of a sequence. */
export const UnreadMarker = /* @__PURE__ */ forwardRef<HTMLSpanElement, UnreadMarkerProps>(function UnreadMarker({
  label = "New messages", className, ...props
}, ref) {
  if (!label.trim()) throw new Error("Flood UnreadMarker requires a nonempty label");
  return <Badge {...props} ref={ref} size="sm" tone="accent" className={classes("flood-unread-marker", className)}>
    {label}
  </Badge>;
});

export interface FeedAttributionProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** A localized reason the entry appears, such as "Reposted by Maya Chen". */
  label: string;
  /** The person, collection or source named by the label. */
  href?: string;
  /** Decorative cue accompanying the reason. */
  icon?: ReactNode;
  /** Align the reason and icon with the entry's author text and avatar. */
  avatarSize?: "sm" | "md";
}

/** A quiet context line above an entry, distinct from its original author. @since 0.2.14 */
export const FeedAttribution = /* @__PURE__ */ forwardRef<HTMLSpanElement, FeedAttributionProps>(function FeedAttribution(
  {label, href, icon, avatarSize, className, ...props}, ref,
) {
  if (!label.trim()) throw new Error("Flood FeedAttribution requires a nonempty label");
  return <Text {...props} ref={ref} size="helper" tone="subtle" data-avatar-size={avatarSize} className={classes("flood-feed-attribution", className)}>
    {hasFieldContent(icon) && <IconSlot size="2xs">{icon}</IconSlot>}
    {href ? <Link href={href}>{label}</Link> : <span>{label}</span>}
  </Text>;
});

export interface FeedUpdateProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onLoad"> {
  /** Use zero when caught up, or "unknown" when only availability is known. */
  count: number | "unknown";
  /** Mount in a positioned feed header or over a positioned feed viewport. */
  placement?: "header" | "overlay";
  pending?: boolean;
  onLoad: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  formatLabel?: (count: number | "unknown") => string;
  /** Optional localized announcement. Keep it stable while the queue grows. */
  announcement?: string;
}

const feedUpdateLabel = (count: number | "unknown") =>
  count === "unknown" ? "Load new items" : `Load ${count} new ${count === 1 ? "item" : "items"}`;

/** A floating action for buffered items inside a positioned feed frame. @since 0.2.14 */
export const FeedUpdate = /* @__PURE__ */ forwardRef<HTMLDivElement, FeedUpdateProps>(function FeedUpdate(
  {count, placement = "header", pending = false, onLoad, formatLabel = feedUpdateLabel, announcement, className, ...props}, ref,
) {
  if (count !== "unknown" && (!Number.isSafeInteger(count) || count < 0)) {
    throw new RangeError("Flood FeedUpdate requires a nonnegative integer count or unknown");
  }
  const label = count === 0 ? undefined : formatLabel(count);
  return <div {...props} ref={ref} className={classes("flood-feed-update",className)} data-placement={placement}>
    {announcement && <VisuallyHidden role="status">{label ? announcement : undefined}</VisuallyHidden>}
    {label !== undefined && <Button variant="outline" size="sm" aria-label={label}
      loading={pending ? "retain-focus" : false} onClick={onLoad}>
      <IconSlot size="sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></IconSlot>
      {label}
    </Button>}
  </div>;
});

export interface TypingIndicatorProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** A localized label for the people typing. Omit when nobody is typing. */
  label?: string;
  /** Preserve one line of space while the conversation is idle. */
  reserveSpace?: boolean;
}

/** Passive typing presence for a conversation with a stable composer position. */
export const TypingIndicator = /* @__PURE__ */ forwardRef<HTMLDivElement, TypingIndicatorProps>(function TypingIndicator({
  label, reserveSpace = true, className, ...props
}, ref) {
  const text = label?.trim();
  if (!text && !reserveSpace) return null;
  return <Inline {...props} ref={ref} gap="2" className={classes("flood-typing-indicator", className)}>
    {text && <>
      <span className="flood-typing-indicator__dots" aria-hidden="true"><span/><span/><span/></span>
      <Text size="helper" tone="subtle" className="flood-typing-indicator__label">
        <TruncatedText dir="auto" hidden={props.hidden}>{text}</TruncatedText>
      </Text>
    </>}
  </Inline>;
});

export type MessageReceiptState = "sending" | "sent" | "delivered" | "read" | "failed";

export interface MessageReceiptProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "role"> {
  state: MessageReceiptState;
  /** Localized label for the current state. */
  label?: string;
  /** Announce changes politely for a specific message when the host needs it. */
  announce?: boolean;
}

const messageReceiptLabels = {
  sending: "Sending", sent: "Sent", delivered: "Delivered", read: "Read", failed: "Not sent",
} as const;

/** Delivery and read state for one outgoing message. */
export const MessageReceipt = /* @__PURE__ */ forwardRef<HTMLSpanElement, MessageReceiptProps>(function MessageReceipt({
  state, label = messageReceiptLabels[state], announce = false, className, ...props
}, ref) {
  if (!label.trim()) throw new Error("Flood MessageReceipt requires a nonempty label");
  return <Text {...props} ref={ref} size="helper" tone={state === "failed" ? "error" : "subtle"}
    role={announce ? "status" : undefined} className={classes("flood-message-receipt", className)}>
    <IconSlot size="2xs">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {state === "sending" && <><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></>}
        {state === "sent" && <path d="m5 12 4 4L19 6"/>}
        {state === "delivered" && <path d="m3 12 4 4 9-9m-4 8 1 1 9-9"/>}
        {state === "read" && <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>}
        {state === "failed" && <><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5M12 16h.01"/></>}
      </svg>
    </IconSlot>
    <span dir="auto">{label}</span>
  </Text>;
});

export interface ThreadTriggerProps extends Omit<ButtonProps, "children" | "size" | "variant" | "tone" | "loading"> {
  replyCount: number;
  /** Up to two participant previews, in the host's preferred order. */
  participants?: readonly AvatarGroupItem[];
  /** Time of the most recent reply, with an explicitly zoned ISO instant. */
  latestReply?: { dateTime: string; timeZone?: string; relativeTo?: string };
  unread?: boolean;
  labels?: {
    reply?: string;
    formatReplyCount?: (count: number) => string;
    lastReply?: string;
    unread?: string;
  };
}

/** A compact entry point to the replies attached to one message. @since 0.2.14 */
export const ThreadTrigger = /* @__PURE__ */ forwardRef<HTMLButtonElement, ThreadTriggerProps>(function ThreadTrigger(
  { replyCount, participants, latestReply, unread, labels, className, lang, dir, ...props }, ref,
) {
  if (!Number.isSafeInteger(replyCount) || replyCount < 0) {
    throw new RangeError("Flood ThreadTrigger requires a nonnegative whole reply count");
  }
  const hasReplies = replyCount > 0;
  const people = hasReplies ? participants?.slice(0, 2) : undefined;
  const countLabel = hasReplies ? labels?.formatReplyCount?.(replyCount) ??
    `${new Intl.NumberFormat(lang || "en").format(replyCount)} ${replyCount === 1 ? "reply" : "replies"}` : labels?.reply ?? "Reply";
  return <Button {...props} ref={ref} size="xs" variant="ghost" className={classes("flood-thread-trigger", className)} lang={lang} dir={dir}>
    {Boolean(people?.length) && <span className="flood-thread-trigger__people" aria-hidden="true">
      {people?.map(({ id, name, src, fallback }) => <Avatar key={id} name={name} src={src} fallback={fallback} size="2xs" decorative />)}
    </span>}
    <span dir="auto">{countLabel}</span>
    {hasReplies && latestReply && <>
      <VisuallyHidden>{labels?.lastReply ?? "Last reply"}</VisuallyHidden>
      <Timestamp {...latestReply} format="time" lang={lang} dir={dir} />
    </>}
    {hasReplies && unread && <Text as="span" size="helper" tone="subtle" dir="auto">{labels?.unread ?? "Unread"}</Text>}
  </Button>;
});

export interface ReplyReferenceProps extends Omit<LayoutProps, "children" | "gap"> {
  /** Localized context such as “In reply to Maya Chen” or “Original message unavailable”. */
  label: string;
  /** Short original excerpt, supplied only while the viewer can read it. */
  excerpt?: string;
  /** Destination that opens or jumps to the original message. */
  href?: string;
}

/** Compact context for a published reply whose source may be elsewhere. */
export const ReplyReference = /* @__PURE__ */ forwardRef<HTMLDivElement, ReplyReferenceProps>(function ReplyReference({
  label, excerpt, href, className, ...props
}, ref) {
  if (!label.trim()) throw new Error("Flood ReplyReference requires a nonempty label");
  const title = <Text size="helper" tone={href ? "default" : "subtle"} dir="auto">{label}</Text>;
  return <Inline {...props} ref={ref} gap="1" align="start" className={classes("flood-reply-reference", className)}>
    <IconSlot size="xs" className="flood-reply-reference__icon"><ReplyIcon /></IconSlot>
    <Stack gap="0" className="flood-reply-reference__copy">
      {href ? <Link href={href}>{title}</Link> : title}
      {excerpt?.trim() && <Text size="helper" tone="subtle">
        <TruncatedText dir="auto" hidden={props.hidden}>{excerpt}</TruncatedText>
      </Text>}
    </Stack>
  </Inline>;
});

export interface QuotedPostContent {
  author: CommentProps["author"];
  content: ReactNode;
  href?: string;
  /** Already authorized media or attachments belonging to the quoted post. */
  media?: ReactNode;
}

export interface QuotedPostProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Supply only when the quoted post is available to the viewer. */
  post?: QuotedPostContent;
  /** Embedded excerpts share their surrounding surface and show the source in the author row. */
  appearance?: "outlined" | "embedded";
  unavailableLabel?: string;
  openLabel?: string;
}

/** An attributed excerpt from another post embedded in the current message. */
export const QuotedPost = /* @__PURE__ */ forwardRef<HTMLDivElement, QuotedPostProps>(function QuotedPost({
  post, appearance = "outlined", unavailableLabel = "Quoted post unavailable", openLabel = "View original", className, ...props
}, ref) {
  const embedded = appearance === "embedded";
  const original = post?.href && <Link href={post.href}>{openLabel}</Link>;
  return <Stack {...props} ref={ref} gap="2" data-appearance={appearance} className={classes("flood-quoted-post", className)}>
    {post ? <>
      <AuthorMeta {...post.author} size="sm" metadataPlacement="inline"
        metadata={embedded && original ? <Text size="helper" className="flood-quoted-post__provenance">
          {post.author.metadata}
          {original}
        </Text> : post.author.metadata} />
      <Blockquote cite={post.href} className="flood-quoted-post__body">{post.content}</Blockquote>
      {embedded && hasFieldContent(post.media) ? <Stack gap="2">{post.media}</Stack> : post.media}
      {!embedded && original && <Text size="helper">{original}</Text>}
    </> : <Text size="helper" tone="subtle" dir="auto">{unavailableLabel}</Text>}
  </Stack>;
});

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  label: string;
  value?: number;
  max?: number;
  valueText?: string;
  size?: ContentSize;
  tone?: SemanticTone;
  hideLabel?: boolean;
  /** Inline keeps the caption beside the track when there is room for both. */
  layout?: "stacked" | "inline";
}
/** @since 0.2.4 */
export const Progress = /* @__PURE__ */ forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { label, value, max = 100, valueText, size = "md", tone = "accent", hideLabel = false, ...props }, ref,
) {
  return <ValueIndicator {...props} ref={ref} kind="progress" label={label} value={value} min={0} max={max} valueText={valueText} size={size} tone={tone} hideLabel={hideLabel} />;
});

export type ProgressRingProps = Omit<ProgressProps, "layout">;
/** Circular task progress for a compact status row or panel. */
export const ProgressRing = /* @__PURE__ */ forwardRef<HTMLDivElement, ProgressRingProps>(function ProgressRing(
  { label, value, max = 100, valueText, size = "md", tone = "accent", hideLabel = false, ...props }, ref,
) {
  return <ValueIndicator {...props} ref={ref} kind="progress" shape="ring" label={label} value={value} min={0} max={max}
    valueText={valueText} size={size} tone={tone} hideLabel={hideLabel} />;
});

export interface MilestoneProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  name: string;
  completed: number;
  total: number;
  href?: string;
  /** Supply a localized date label and an optional machine-readable date. */
  dueDate?: {label: string; dateTime?: string};
  formatProgress?: (completed: number, total: number) => string;
  emptyLabel?: string;
}

/** @since 0.2.14 */
export const MilestoneProgress = /* @__PURE__ */ forwardRef<HTMLDivElement, MilestoneProgressProps>(function MilestoneProgress(
  {emptyLabel = "No linked work", ...props}, ref,
) {
  return <MilestoneWorkSummary {...props} ref={ref} emptyLabel={emptyLabel} />;
});

export interface CycleObservation {
  /** Display label for an observed, equally spaced interval. */
  label: string;
  completed: number;
  scope: number;
}

export interface CycleProgressProps extends Omit<SectionProps, "children" | "title" | "description" | "actions" | "headingSize"> {
  name: string;
  /** Work in scope at the start of the cycle, in the same unit as the observations. */
  initialScope: number;
  /** Oldest to newest. The last observation supplies the current summary. */
  observations: readonly CycleObservation[];
  formatWork?: (value: number) => string;
  labels?: Partial<Record<"summary" | "chart" | "completed" | "scope" | "initial" | "empty" | "navigation", string>>;
}

/** Compare completed work with the changing scope of a time-boxed cycle. @since 0.2.14 */
export const CycleProgress = /* @__PURE__ */ forwardRef<HTMLElement, CycleProgressProps>(function CycleProgress(
  {name, initialScope, observations, formatWork, labels, lang, ...props}, ref,
) {
  if (!name.trim() || !Number.isFinite(initialScope) || initialScope < 0 || observations.some(({label, completed, scope}) =>
    !label.trim() || !Number.isFinite(completed) || !Number.isFinite(scope) || completed < 0 || completed > scope,
  )) {
    throw new Error("Flood CycleProgress requires a named cycle and finite work totals with completed work within scope");
  }
  const latest = observations.at(-1);
  const number = new Intl.NumberFormat(lang || "en", {maximumFractionDigits: 6});
  const format = formatWork ?? (value => number.format(value));
  const completed = labels?.completed ?? "Done";
  const scope = labels?.scope ?? "Scope";
  return <Section {...props} ref={ref} lang={lang} title={name} headingSize="group">
    {latest ? <Stack gap="4">
      <MetricGroup label={labels?.summary ?? "Cycle work"} minItemWidth="3.5rem" items={[
        {id:"completed", label:completed, value:format(latest.completed)},
        {id:"scope", label:scope, value:format(latest.scope)},
        {id:"initial", label:labels?.initial ?? "At start", value:format(initialScope)},
      ]} />
      <LineChart label={labels?.chart ?? "Cycle work over time"} categories={observations.map(point => point.label)}
        series={[
          {id:"completed", label:completed, values:observations.map(point => point.completed)},
          {id:"scope", label:scope, values:observations.map(point => point.scope)},
        ]}
        domain={[0, observations.reduce((max, point) => Math.max(max, point.scope), 1)]}
        curve="linear" formatValue={format} navigationLabel={labels?.navigation} />
    </Stack> : <Text size="compact" tone="subtle">{labels?.empty ?? "No cycle observations yet."}</Text>}
  </Section>;
});

export interface MeterProps extends Omit<ProgressProps, "value"> {
  value: number;
  min?: number;
  /** A named reference in the same units as value, such as a target or warning threshold. */
  reference?: MeterReference;
}

export interface MeterReference {
  value: number;
  label: string;
}
/** @since 0.2.4 */
export const Meter = /* @__PURE__ */ forwardRef<HTMLDivElement, MeterProps>(function Meter(
  { label, value, min = 0, max = 100, valueText, size = "md", tone = "neutral", hideLabel = false, ...props }, ref,
) {
  return <ValueIndicator {...props} ref={ref} kind="meter" label={label} value={value} min={min} max={max} valueText={valueText} size={size} tone={tone} hideLabel={hideLabel} />;
});

export interface CapacityMeterProps extends Omit<MeterProps, "value" | "min" | "max" | "tone" | "reference"> {
  used: number;
  capacity: number;
  /** Usage at which a warning begins, in the same units as used and capacity. */
  warningAt?: number;
  unit?: string;
  locale?: string;
}

/** Usage against a fixed capacity, including usage beyond the limit. */
export const CapacityMeter = /* @__PURE__ */ forwardRef<HTMLDivElement, CapacityMeterProps>(function CapacityMeter(
  {used, capacity, warningAt, unit, locale = "en", valueText, ...props}, ref,
) {
  if (!Number.isFinite(used) || used < 0 || !Number.isFinite(capacity) || capacity <= 0) {
    throw new RangeError("Flood CapacityMeter requires nonnegative finite usage and positive finite capacity");
  }
  if (warningAt !== undefined && (!Number.isFinite(warningAt) || warningAt < 0 || warningAt > capacity)) {
    throw new RangeError("Flood CapacityMeter warningAt must be within its capacity");
  }
  const usageState = used > capacity ? "over" : warningAt !== undefined && used >= warningAt ? "warning" : "normal";
  const tone = usageState === "over" ? "error" : usageState === "warning" ? "warning" : "neutral";
  const amount = new Intl.NumberFormat(locale, {maximumSignificantDigits: 21});
  const readout = valueText ?? `${amount.format(used)} / ${amount.format(capacity)}${unit ? ` ${unit}` : ""}`;
  return <Meter {...props} ref={ref} value={Math.min(used, capacity)} max={capacity} tone={tone} valueText={readout}
    data-capacity-state={usageState} />;
});

export interface CycleCapacityProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label?: string;
  /** Planned work in the same unit as the forecast. */
  planned: number;
  forecast?: {capacity: number; basis?: string};
  formatAmount?: (value: number) => string;
  labels?: {
    estimate?: (amount: string) => string;
    over?: (amount: string) => string;
    under?: (amount: string) => string;
    matches?: string;
    unavailable?: string;
  };
}

/** Compare planned work with an estimated cycle capacity. @since 0.2.14 */
export const CycleCapacity = /* @__PURE__ */ forwardRef<HTMLDivElement, CycleCapacityProps>(function CycleCapacity(
  {label = "Planned work", planned, forecast, formatAmount, labels, lang, ...props}, ref,
) {
  const capacity = forecast?.capacity;
  if (!label.trim() || !Number.isFinite(planned) || planned < 0 ||
      (capacity !== undefined && (!Number.isFinite(capacity) || capacity < 0))) {
    throw new RangeError("Flood CycleCapacity requires a label and finite nonnegative amounts");
  }
  const format = formatAmount ?? new Intl.NumberFormat(lang ?? "en").format;
  const plannedText = format(planned);
  if (capacity === undefined) return <Stack {...props} ref={ref} lang={lang} gap="2">
    <DescriptionList layout="inline" density="compact" items={[{id:"planned",term:label,description:plannedText}]}/>
    <Text as="p" size="helper" tone="subtle">{labels?.unavailable ?? "Capacity estimate unavailable."}</Text>
  </Stack>;

  const difference = planned - capacity;
  const delta = format(Math.abs(difference));
  const summary = difference > 0 ? labels?.over?.(delta) ?? `${delta} above estimate`
    : difference < 0 ? labels?.under?.(delta) ?? `${delta} below estimate`
    : labels?.matches ?? "Matches estimate";
  const estimate = format(capacity);
  return <Stack {...props} ref={ref} lang={lang} gap="3">
    <Meter label={label} value={planned} max={Math.max(1, planned, capacity)} valueText={plannedText}
      tone={difference > 0 ? "warning" : "neutral"} size="sm"
      reference={{value:capacity,label:labels?.estimate?.(estimate) ?? `Estimated capacity · ${estimate}`}} />
    <Stack gap="1">
      <Text size="compact">{summary}</Text>
      {forecast?.basis && <Text as="p" size="helper" tone="subtle" dir="auto">{forecast.basis}</Text>}
    </Stack>
  </Stack>;
});

export interface UsageLimitProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  used: number;
  /** All amounts, including an optional notification threshold, share one unit. */
  limit: number;
  policy: "allowance" | "soft-budget" | "hard-limit";
  /** Localized boundary name, such as "included" or "hard limit". */
  limitLabel: string;
  /** A separately configured notification below the boundary. */
  notification?: {at: number; label: string};
  /** Explain what the host does when usage reaches or exceeds the boundary. */
  consequence: string;
  formatAmount?: (value: number) => string;
}

/** Usage against a policy boundary with an optional earlier notification. @since 0.2.14 */
export const UsageLimit = /* @__PURE__ */ forwardRef<HTMLDivElement, UsageLimitProps>(function UsageLimit(
  { label, used, limit, policy, limitLabel, notification, consequence, formatAmount = String, ...props }, ref,
) {
  if (!label.trim() || !limitLabel.trim() || !consequence.trim()) {
    throw new Error("Flood UsageLimit requires a measure, boundary and policy consequence");
  }
  if (!Number.isFinite(used) || used < 0 || !Number.isFinite(limit) || limit <= 0) {
    throw new RangeError("Flood UsageLimit requires nonnegative finite usage and a positive finite limit");
  }
  if (notification && (!Number.isFinite(notification.at) || notification.at <= 0 ||
      notification.at >= limit || !notification.label.trim())) {
    throw new RangeError("Flood UsageLimit requires a named notification strictly within the range");
  }
  const reached = used >= limit;
  const tone = policy === "hard-limit" && reached ? "error"
    : used > limit || (policy === "soft-budget" && reached) || (notification && used >= notification.at) ? "warning"
    : "neutral";
  return <Stack {...props} ref={ref} gap="2">
    <Meter className="flood-usage-limit__meter" label={label} size="sm" value={Math.min(used, limit)} max={limit}
      valueText={`${formatAmount(used)} / ${formatAmount(limit)} ${limitLabel}`} tone={tone}
      reference={notification && { value: notification.at, label: `${notification.label} · ${formatAmount(notification.at)}` }} />
    <Text as="p" size="compact" tone="subtle">{consequence}</Text>
  </Stack>;
});

export interface ContextWindowPart {
  id: string;
  label: string;
  tokens: number;
}

export interface ContextWindowMeterProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label?: string;
  used: number;
  limit: number;
  /** Same token basis as used and limit. Omit when a threshold is not known. */
  compactionAt?: number;
  /** Set only when the host reports an active compaction. */
  compacting?: boolean;
  /** Optional known components of the total. May be a partial breakdown. */
  parts?: readonly ContextWindowPart[];
  labels?: {threshold?: string; compacting?: string; breakdown?: string;
    usage?: (used: string, limit: string) => string; remaining?: (tokens: string) => string; over?: (tokens: string) => string};
}

/** Inspect recorded token usage, the effective window limit and optional composition. @since 0.2.14 */
export const ContextWindowMeter = /* @__PURE__ */ forwardRef<HTMLDivElement, ContextWindowMeterProps>(function ContextWindowMeter(
  {label = "Context window", used, limit, compactionAt, compacting, parts = [], labels, lang, className, ...props}, ref,
) {
  if (![used, limit].every(Number.isSafeInteger) || used < 0 || limit <= 0 ||
      (compactionAt !== undefined && (!Number.isSafeInteger(compactionAt) || compactionAt <= 0 || compactionAt >= limit))) {
    throw new RangeError("Flood ContextWindowMeter requires integer token counts and a compaction threshold within the window");
  }
  if (parts.some(({tokens}) => !Number.isSafeInteger(tokens) || tokens < 0) ||
      parts.reduce((sum, part) => sum + part.tokens, 0) > used) {
    throw new RangeError("Flood ContextWindowMeter parts must account for at most the recorded token count");
  }
  const formatter = new Intl.NumberFormat(lang || "en");
  const count = (tokens: number) => formatter.format(tokens);
  const remaining = limit - used;
  const tone = remaining <= 0 ? "error" : compactionAt !== undefined && used >= compactionAt ? "warning" : "neutral";
  const breakdownLabel = labels?.breakdown ?? "Token breakdown";
  const threshold = compactionAt === undefined ? undefined : {
    value: compactionAt,
    label: `${labels?.threshold ?? "Compaction threshold"} · ${count(compactionAt)}`,
  };
  return <Stack {...props} lang={lang} ref={ref} gap="2" className={classes("flood-context-window-meter", className)}>
    <Meter label={label} size="sm" value={Math.min(used, limit)} max={limit} tone={tone} reference={threshold}
      valueText={labels?.usage?.(count(used), count(limit)) ?? `${count(used)} / ${count(limit)} tokens`} />
    <Inline gap="2">
      <Text size="helper" tone={remaining < 0 ? "error" : "subtle"}>
        {remaining < 0 ? labels?.over?.(count(-remaining)) ?? `${count(-remaining)} tokens over limit`
          : labels?.remaining?.(count(remaining)) ?? `${count(remaining)} tokens remaining`}
      </Text>
      {compacting && <StatusIndicator size="sm" tone="info" label={labels?.compacting ?? "Compacting"} presentation="wrap" />}
    </Inline>
    {parts.length > 0 && <Collapsible title={breakdownLabel} variant="flush" controlSize="sm">
      <DescriptionList aria-label={breakdownLabel} className="flood-context-window-meter__breakdown" layout="columns" density="compact" dividers={false}
        items={parts.map(({id, label: term, tokens}) => ({id, term, description:count(tokens)}))} />
    </Collapsible>}
  </Stack>;
});

export interface TokenUsage {
  input: number;
  output: number;
  /** Included in input. Omit when the source does not report this count. */
  cachedInput?: number;
  /** Included in output. Omit when the source does not report this count. */
  reasoningOutput?: number;
}

export interface TokenUsageBreakdownProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Null is unreported usage. A recorded zero is a number. */
  usage: TokenUsage | null;
  labels?: Partial<Record<"total" | "input" | "output" | "cached" | "reasoning" | "unavailable", string>>;
}

/** Read recorded input and output usage and their reported subsets. @since 0.2.14 */
export const TokenUsageBreakdown = /* @__PURE__ */ forwardRef<HTMLDivElement, TokenUsageBreakdownProps>(function TokenUsageBreakdown(
  {usage, labels, lang, ...props}, ref,
) {
  if (!usage) {
    return <Stack {...props} ref={ref} lang={lang}>
      <Text size="compact" tone="subtle">{labels?.unavailable ?? "Token usage unavailable."}</Text>
    </Stack>;
  }
  const {input, output, cachedInput, reasoningOutput} = usage;
  const total = input + output;
  if (![input, output, total, cachedInput ?? 0, reasoningOutput ?? 0].every(value => Number.isSafeInteger(value) && value >= 0)
      || (cachedInput ?? 0) > input || (reasoningOutput ?? 0) > output) {
    throw new RangeError("Flood TokenUsageBreakdown requires nonnegative integer counts with subsets within their totals");
  }
  const renderCategory = (count: number, subset: number | undefined, subsetLabel: string) => <Stack gap="1">
    <Text size="label"><NumericValue value={count} lang={lang} /></Text>
    {subset !== undefined && <Inline gap="1" align="baseline">
      <Text size="helper" tone="subtle">{subsetLabel}</Text>
      <Text size="helper" tone="subtle"><NumericValue value={subset} lang={lang} /></Text>
    </Inline>}
  </Stack>;
  return <Stack {...props} ref={ref} lang={lang} gap="3">
    <Metric size="sm" label={labels?.total ?? "Total tokens"} value={<NumericValue value={total} lang={lang} />} />
    <DescriptionList layout="columns" density="compact" dividers={false} items={[
      {id:"input",term:labels?.input ?? "Input",description:renderCategory(input,cachedInput,labels?.cached ?? "Cached")},
      {id:"output",term:labels?.output ?? "Output",description:renderCategory(output,reasoningOutput,labels?.reasoning ?? "Reasoning")},
    ]} />
  </Stack>;
});

export interface UsageForecastProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  used: number;
  limit: number;
  limitLabel: string;
  /** Host estimate of cumulative usage at the end of the same period. */
  projection?: {amount: number; label: string};
  /** Fixed upper bound for comparable scales. Must include all displayed amounts. */
  scaleMax?: number;
  formatAmount?: (value: number) => string;
}

/** Compare recorded usage, an optional estimate and a limit on one scale. @since 0.2.14 */
export const UsageForecast = /* @__PURE__ */ forwardRef<HTMLDivElement, UsageForecastProps>(function UsageForecast(
  {label, used, limit, limitLabel, projection, scaleMax, formatAmount = String, className, ...props}, ref,
) {
  if (!label.trim() || !limitLabel.trim() || (projection && !projection.label.trim())) {
    throw new Error("Flood UsageForecast requires a label for every displayed amount");
  }
  if (!Number.isFinite(used) || used < 0 || !Number.isFinite(limit) || limit <= 0 ||
      (projection && (!Number.isFinite(projection.amount) || projection.amount < used))) {
    throw new RangeError("Flood UsageForecast requires nonnegative cumulative usage, a positive limit and a projection at or above recorded usage");
  }
  const requiredMax = Math.max(used, limit, projection?.amount ?? 0);
  const max = scaleMax ?? requiredMax;
  if (!Number.isFinite(max) || max < requiredMax) {
    throw new RangeError("Flood UsageForecast scaleMax must include every displayed amount");
  }
  return <ValueIndicator {...props} ref={ref} className={classes("flood-usage-forecast", className)} kind="meter" min={0} max={max} value={used}
    size="md" tone="neutral" label={label} valueText={formatAmount(used)}
    reference={{value:limit,label:`${limitLabel} · ${formatAmount(limit)}`}}
    projection={projection && {value:projection.amount,label:`${projection.label} · ${formatAmount(projection.amount)}`}} />;
});

export type FieldRequirementStatus = "pending" | "met" | "unmet";
export interface FieldRequirement {
  id: string;
  label: string;
  status?: FieldRequirementStatus;
}
export interface FieldChecklistProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  items: readonly FieldRequirement[];
  statusLabels?: Partial<Record<FieldRequirementStatus, string>>;
}
/** A readable list of host-evaluated form requirements. */
export const FieldChecklist = /* @__PURE__ */ forwardRef<HTMLDivElement, FieldChecklistProps>(function FieldChecklist(
  {label, items, statusLabels, className, ...props}, ref,
) {
  if (!label.trim() || items.some(item => !item.id.trim() || !item.label.trim()) || new Set(items.map(item => item.id)).size !== items.length) {
    throw new Error("Flood FieldChecklist requires a label and unique nonempty item IDs and labels");
  }
  const defaults = {pending:"Not checked", met:"Met", unmet:"Not met"};
  return <div {...props} ref={ref} className={classes("flood-field-checklist", className)}>
    <List aria-label={label} marker={false} gap="1">
      {items.map(({id, label: requirement, status = "pending"}) => <li key={id} data-status={status}>
        <IconSlot size="2xs" className="flood-field-checklist__mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            {status === "met" ? <path d="m5 12 4 4L19 6" /> : status === "unmet" ? <path d="m7 7 10 10M17 7 7 17" /> : <circle cx="12" cy="12" r="6" />}
          </svg>
        </IconSlot>
        <Text size="helper">{requirement}<VisuallyHidden>{`, ${statusLabels?.[status] ?? defaults[status]}`}</VisuallyHidden></Text>
      </li>)}
    </List>
  </div>;
});

export interface PasswordStrengthProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label?: string;
  assessment?: Pick<MeterProps, "value" | "max" | "tone"> & {valueText: string};
  requirements?: readonly FieldRequirement[];
  requirementsLabel?: string;
  statusLabels?: FieldChecklistProps["statusLabels"];
}
/** Displays a host's password assessment and optional requirements. */
export const PasswordStrength = /* @__PURE__ */ forwardRef<HTMLDivElement, PasswordStrengthProps>(function PasswordStrength(
  {label = "Password strength", assessment, requirements, requirementsLabel = "Password requirements", statusLabels, className, ...props}, ref,
) {
  return <Stack {...props} ref={ref} gap="2" className={classes("flood-password-strength", className)}>
    {assessment && <Meter {...assessment} label={label} size="sm" />}
    {requirements?.length ? <FieldChecklist items={requirements} label={requirementsLabel} statusLabels={statusLabels} /> : null}
  </Stack>;
});

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "role" | "aria-live"> {
  title?: string;
  appearance?: "banner" | "inline";
  tone?: "neutral" | FieldStatus;
  icon?: ReactNode;
  /** A host-owned command displayed separately from the announced message. */
  action?: ReactNode;
  announcement?: "off" | "polite" | "assertive";
}
/** @since 0.2.4 */
export const Alert = /* @__PURE__ */ forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { title, tone = "info", icon, announcement = "off", ...props }, ref,
) {
  return <FeedbackMessage {...props} ref={ref} title={title} tone={tone} icon={icon} announcement={announcement} />;
});

export type IncompleteResponseReason = "output-limit" | "message-limit" | "filtered" | "unknown";

export interface IncompleteResponseNoticeProps extends Omit<AlertProps, "children" | "title" | "appearance" | "tone" | "icon" | "action"> {
  /** Whether this response produced usable, visible output before stopping. */
  output: "partial" | "none";
  reason: IncompleteResponseReason;
  /** A permitted recovery action whose execution and pending state belong to the host. */
  action?: AlertProps["action"];
  labels?: {
    partial?: string;
    none?: string;
    reasons?: Partial<Record<IncompleteResponseReason, string>>;
  };
}

const incompleteResponseReasons = {
  "output-limit":"Output limit reached.",
  "message-limit":"Message limit reached.",
  filtered:"Stopped by a content filter.",
  unknown:undefined,
} satisfies Record<IncompleteResponseReason, string | undefined>;

/** Explain a terminal, incomplete model response where its result would appear. @since 0.2.14 */
export const IncompleteResponseNotice = /* @__PURE__ */ forwardRef<HTMLDivElement, IncompleteResponseNoticeProps>(function IncompleteResponseNotice(
  {output, reason, action, labels, ...props}, ref,
) {
  const title = output === "partial" ? labels?.partial ?? "Response incomplete" : labels?.none ?? "No response text";
  return <Alert {...props} ref={ref} appearance="inline" tone={reason === "unknown" ? "neutral" : "warning"}
    title={title} action={action}>
    {labels?.reasons?.[reason] ?? incompleteResponseReasons[reason]}
  </Alert>;
});

export interface DeprecationNoticeProps extends Pick<AlertProps, "title" | "appearance" | "announcement">,
  Omit<HTMLAttributes<HTMLDivElement>, "title" | "role" | "aria-live"> {
  state: "deprecated" | "retired";
  /** The announced cutoff for deprecated features, or the actual cutoff for retired features. */
  cutoff?: {dateTime: string; label: string};
  replacement?: {label: string; href?: string};
  labels?: {status?: string; cutoff?: string; replacement?: string};
}

/** A persistent notice for an affected feature and its published migration path. */
export const DeprecationNotice = /* @__PURE__ */ forwardRef<HTMLDivElement, DeprecationNoticeProps>(function DeprecationNotice({
  state, cutoff, replacement, labels, title, children, ...props
}, ref) {
  const retired = state === "retired";
  const stateLabel = labels?.status ?? (retired ? "Retired" : "Deprecated");
  const facts: DescriptionItem[] = [];
  if (cutoff) facts.push({
    id: "cutoff",
    term: labels?.cutoff ?? (retired ? "Retired on" : "Retires on"),
    description: <Timestamp dateTime={cutoff.dateTime} size="compact">{cutoff.label}</Timestamp>,
  });
  if (replacement) facts.push({
    id: "replacement",
    term: labels?.replacement ?? "Replacement",
    description: replacement.href
      ? <Link href={replacement.href}><InlineCode>{replacement.label}</InlineCode></Link>
      : <InlineCode>{replacement.label}</InlineCode>,
  });
  return <Alert {...props} ref={ref} tone={retired ? "error" : "warning"} title={title ?? stateLabel}>
    {(children != null || facts.length > 0 || title != null) && <Stack gap="2">
      {title != null && <Text as="p" size="label">{stateLabel}</Text>}
      {children}
      {facts.length > 0 && <DescriptionList density="compact" layout="inline" items={facts} />}
    </Stack>}
  </Alert>;
});

export interface ContentAdvisoryProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** A specific warning about the enclosed content. */
  title: string;
  description?: string;
  children: ReactNode;
  showLabel?: string;
  hideLabel?: string;
  /** Reserve the width-to-height ratio of an inline image or video. */
  mediaRatio?: number;
  revealed?: boolean;
  defaultRevealed?: boolean;
  onRevealedChange?: (revealed: boolean) => void;
}

/** A warning and deliberate reveal for optional sensitive content. @since 0.2.14 */
export const ContentAdvisory = /* @__PURE__ */ forwardRef<HTMLDivElement, ContentAdvisoryProps>(function ContentAdvisory(props, ref) {
  return <WarnedContent {...props} ref={ref} />;
});

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
  icon?: ReactNode;
  /** Passive count associated with this tab's panel. */
  count?: number;
  disabled?: boolean;
}
export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "defaultValue" | "onChange"> {
  /** Show separate scroll controls when horizontal tabs overflow. Supply labels to localize them. */
  overflowControls?: boolean | { previousLabel?: string; nextLabel?: string };
  label: string;
  items: readonly TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  activationMode?: "automatic" | "manual";
  orientation?: "horizontal" | "vertical";
  variant?: "contained" | "line";
  controlSize?: "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  iconOnly?: boolean;
  /** Visual maximum for a tab count, with a plus sign above the maximum. */
  maxCount?: number;
  formatCountLabel?: (count: number, item: TabItem) => string;
}
export const Tabs = /* @__PURE__ */ forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {activationMode="automatic",orientation="horizontal",controlSize="md",disabled=false,iconOnly=false,...props},ref,
){return <TabNavigation {...props} ref={ref} activationMode={activationMode} orientation={orientation} controlSize={controlSize} disabled={disabled} iconOnly={iconOnly} />;});
export interface TableOfContentsItem {
  id: string;
  label: string;
  children?: readonly TableOfContentsItem[];
}

export interface TableOfContentsProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  items: readonly TableOfContentsItem[];
  label?: string;
  /** Pass an ID to control the current location, or null to suppress it. */
  activeId?: string | null;
  /** Omit for document scrolling. Flood ScrollArea forwards its viewport ref. */
  scrollRootRef?: import("react").RefObject<HTMLElement | null>;
  /** Minimum top reading line in CSS pixels. Native scroll padding and margin are respected. */
  activationOffset?: number;
}

/** Native in-page navigation with current section tracking. @since 0.2.14 */
export const TableOfContents = /* @__PURE__ */ forwardRef<HTMLElement, TableOfContentsProps>(function TableOfContents(props, ref) {
  return <PageOutline {...props} ref={ref} />;
});

export interface BreadcrumbItem {label:string;href?:string;}
export interface BreadcrumbProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  items: readonly BreadcrumbItem[];
  label?: string;
  separator?: string;
  layout?: "wrap" | "compact";
  /** Number of visible path labels in compact layout, including the root and current page. */
  maxVisibleItems?: number;
  overflowLabel?: string;
}
export const Breadcrumb = /* @__PURE__ */ forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
  {label="Breadcrumb",separator="/",layout="wrap",maxVisibleItems=2,overflowLabel="Earlier pages",...props},ref,
){return <BreadcrumbNavigation {...props} ref={ref} label={label} separator={separator}
  layout={layout} maxVisibleItems={maxVisibleItems} overflowLabel={overflowLabel} />;});
export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "onChange"> {
  page: number;
  pageCount: number;
  onPageChange?: (page: number) => void;
  getHref?: (page: number) => string;
  siblingCount?: 0 | 1 | 2;
  /** Compact shows position between the arrows. Arrows keeps position available to assistive technology. */
  presentation?: "numbered" | "compact" | "arrows";
  positionLabel?: (page: number, pageCount: number) => string;
  /** Formats page numbers. Default page and position labels use the same formatter. */
  formatPage?: (page: number) => string;
  controlSize?: "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  label?: string;
  previousLabel?: string;
  nextLabel?: string;
  pageLabel?: (page: number) => string;
}
export const Pagination = /* @__PURE__ */ forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {siblingCount=1,controlSize="sm",disabled=false,label="Pagination",previousLabel="Previous page",nextLabel="Next page",...props},ref,
){return <PageNavigation {...props} ref={ref} siblingCount={siblingCount} controlSize={controlSize} disabled={disabled} label={label} previousLabel={previousLabel} nextLabel={nextLabel} />;});

export type CursorPageTarget = { href: string; onSelect?: never } | { href?: never; onSelect: () => void };

export interface CursorPaginationProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  previous?: CursorPageTarget;
  next?: CursorPageTarget;
  /** Show a known range or cursor position when it helps the reader. */
  position?: string;
  controlSize?: PaginationProps["controlSize"];
  variant?: "ghost" | "subtle";
  label?: string;
  previousLabel?: string;
  nextLabel?: string;
  /** A host-owned request started by a callback. Keeps the active control focused. */
  pending?: "previous" | "next";
}

/** Sequential navigation for collections with opaque cursors or unknown totals. */
export const CursorPagination = /* @__PURE__ */ forwardRef<HTMLElement, CursorPaginationProps>(function CursorPagination(
  {controlSize = "sm", variant = "subtle", label = "Pagination", previousLabel = "Previous page", nextLabel = "Next page", ...props}, ref,
) {
  return <CursorPageNavigation {...props} ref={ref} controlSize={controlSize} variant={variant}
    label={label} previousLabel={previousLabel} nextLabel={nextLabel} />;
});

export type RecordNavigationTarget = CursorPageTarget & { title: string };

export interface RecordNavigatorProps extends Omit<CursorPaginationProps, "previous" | "next" | "position" | "pending"> {
  previous?: RecordNavigationTarget;
  next?: RecordNavigationTarget;
  presentation?: "compact" | "labeled";
}

/** Adjacent records from the host's current ordered view. */
export const RecordNavigator = /* @__PURE__ */ forwardRef<HTMLElement, RecordNavigatorProps>(function RecordNavigator({
  previous, next, presentation = "compact", label = "Adjacent records", previousLabel = "Previous record",
  nextLabel = "Next record", controlSize = "sm", variant = "ghost", className, ...props
}, ref) {
  if (!previous && !next) return null;
  if (!label.trim() || [previous,next].some(target => target && !target.title.trim())) {
    throw new Error("Flood RecordNavigator requires a name and nonempty destination titles");
  }
  const previousName = previous ? `${previousLabel}: ${previous.title}` : previousLabel;
  const nextName = next ? `${nextLabel}: ${next.title}` : nextLabel;
  if (presentation === "compact") return <CursorPagination {...props} ref={ref} label={label} previous={previous} next={next}
    previousLabel={previousName} nextLabel={nextName} controlSize={controlSize} variant={variant} className={className} />;
  const control = (target: RecordNavigationTarget, direction: "previous" | "next", name: string) => {
    const shared = {variant, size:controlSize, "aria-label":name, title:name, "data-direction":direction, className:"flood-record-navigator__control"};
    const arrow = <IconSlot size="xs"><PageArrow previous={direction === "previous"} /></IconSlot>;
    const content = <>{direction === "previous" && arrow}<span dir="auto">{target.title}</span>{direction === "next" && arrow}</>;
    return target.href !== undefined ? <Link {...shared} href={target.href}>{content}</Link>
      : <Button {...shared} onClick={target.onSelect}>{content}</Button>;
  };
  return <nav {...props} ref={ref} aria-label={label} className={classes("flood-record-navigator", className)}>
    {previous && control(previous,"previous",previousName)}
    {next && control(next,"next",nextName)}
  </nav>;
});

export interface CardDeckItem {
  id: string;
  label: string;
  content: ReactNode;
}

export interface CardDeckProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label"> {
  label: string;
  items: readonly CardDeckItem[];
  selectedId: string;
  onSelectedChange: (id: string) => void;
  loop?: boolean;
  labels?: {
    previous?: string;
    next?: string;
    deck?: string;
    card?: string;
    position?: (current: number, total: number) => string;
  };
}

/** Step through a small deck of related content at the user's pace. @since 0.2.14 */
export const CardDeck = /* @__PURE__ */ forwardRef<HTMLDivElement, CardDeckProps>(function CardDeck(
  {label, items, selectedId, onSelectedChange, loop = false, labels, className, lang, ...props}, ref,
) {
  const panelId = useId();
  const index = items.findIndex(item => item.id === selectedId);
  if (!items.length) return null;
  if (!label.trim() || index < 0 || new Set(items.map(item => item.id)).size !== items.length ||
      items.some(item => !item.id.trim() || !item.label.trim())) {
    throw new Error("Flood CardDeck requires a named deck, unique named cards and a valid selected ID");
  }
  const active = items[index]!;
  const numbers = new Intl.NumberFormat(lang ?? "en");
  const position = labels?.position?.(index + 1, items.length) ?? `${numbers.format(index + 1)} / ${numbers.format(items.length)}`;
  const neighbor = (offset: number) => items[loop ? (index + offset + items.length) % items.length : index + offset];
  const previous = neighbor(-1);
  const next = neighbor(1);
  return <Stack {...props} ref={ref} lang={lang} className={classes("flood-card-deck", className)} gap="4"
    role="group" aria-roledescription={labels?.deck ?? "carousel"} aria-label={props["aria-labelledby"] ? undefined : label}>
    <div className="flood-card-deck__frame" data-stacked={items.length > 1 || undefined}>
      <Surface id={panelId} elevation="raised" padding="4" role="group"
        aria-roledescription={labels?.card ?? "slide"} aria-label={active.label} className="flood-card-deck__card">
        <div key={active.id} className="flood-card-deck__content">{active.content}</div>
      </Surface>
    </div>
    {items.length > 1 && <Inline gap="2" align="center" className="flood-card-deck__controls">
      <IconButton label={labels?.previous ?? "Previous card"} aria-controls={panelId} size="sm" variant="ghost"
        aria-disabled={!previous || undefined} onClick={previous ? () => onSelectedChange(previous.id) : undefined}>
        <PageArrow previous />
      </IconButton>
      <Text size="helper" tone="subtle" className="flood-card-deck__position" aria-hidden="true">{position}</Text>
      <IconButton label={labels?.next ?? "Next card"} aria-controls={panelId} size="sm" variant="ghost"
        aria-disabled={!next || undefined} onClick={next ? () => onSelectedChange(next.id) : undefined}>
        <PageArrow previous={false} />
      </IconButton>
      <VisuallyHidden role="status">{active.label}, {position}</VisuallyHidden>
    </Inline>}
  </Stack>;
});

export interface ZoomControlProps extends Omit<InlineProps, "children" | "gap" | "role"> {
  /** Current scale factor, where 1 is 100%. */
  value: number;
  /** Positive scale factors in increasing order. */
  levels?: readonly number[];
  onValueChange: (value: number) => void;
  /** The viewport computes its own fitting scale. */
  onFit?: () => void;
  label?: string;
  labels?: { zoomOut?: string; zoomIn?: string; fit?: string };
  formatValue?: (value: number) => string;
}

const defaultZoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4] as const;

/** Step between scales for an existing viewport. @since 0.2.14 */
export const ZoomControl = /* @__PURE__ */ forwardRef<HTMLDivElement, ZoomControlProps>(function ZoomControl(
  { value, levels = defaultZoomLevels, onValueChange, onFit, label = "Zoom", labels, formatValue,
    lang, className, "aria-controls": controls, ...props }, ref,
) {
  if (!Number.isFinite(value) || value <= 0 || !levels.length ||
      levels.some((level, index) => !Number.isFinite(level) || level <= (levels[index - 1] ?? 0))) {
    throw new RangeError("Flood ZoomControl requires a positive scale and strictly increasing positive levels");
  }
  const largerIndex = levels.findIndex(level => level > value);
  const next = levels[largerIndex];
  const lowerIndex = levels.findIndex(level => level >= value);
  const previous = levels[lowerIndex === -1 ? levels.length - 1 : lowerIndex - 1];
  const format = formatValue ?? new Intl.NumberFormat(lang || "en", { style: "percent", maximumFractionDigits: 1 }).format;
  const step = (name: string, target: number | undefined, increase?: boolean) =>
    <IconButton variant="ghost" size="sm" label={name} title={name} aria-controls={controls} aria-disabled={target === undefined || undefined}
      className="flood-zoom-control__step" onClick={() => { if (target !== undefined) onValueChange(target); }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
        <path d={increase ? "M5 12h14M12 5v14" : "M5 12h14"} />
      </svg>
    </IconButton>;
  return <Inline {...props} role="group" aria-label={props["aria-label"] ?? label} ref={ref} lang={lang}
    gap="1" className={classes("flood-zoom-control", className)}>
    {step(labels?.zoomOut ?? "Zoom out", previous)}
    <span className="flood-zoom-control__scale">
      <Text as="span" size="helper" role="status" aria-atomic="true">{format(value)}</Text>
      {levels.map(level => <Text key={level} as="span" size="helper" aria-hidden="true">{format(level)}</Text>)}
    </span>
    {step(labels?.zoomIn ?? "Zoom in", next, true)}
    {onFit && <Button variant="ghost" size="sm" aria-controls={controls} onClick={onFit}>{labels?.fit ?? "Fit"}</Button>}
  </Inline>;
});

export interface ResponseVariant {
  id: string;
  content: ReactNode;
}

export interface ResponseVariantsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  variants: readonly ResponseVariant[];
  value: string;
  onValueChange: (id: string) => void;
  formatPosition?: (position: number, total: number) => string;
  previousLabel?: string;
  nextLabel?: string;
}

/** Switch between existing versions of one reply without changing the conversation. @since 0.2.14 */
export const ResponseVariants = /* @__PURE__ */ forwardRef<HTMLDivElement, ResponseVariantsProps>(function ResponseVariants(
  {label, variants, value, onValueChange, formatPosition = (position, total) => `${position} / ${total}`,
    previousLabel = "Previous response", nextLabel = "Next response", className, ...props}, ref,
) {
  const contentId = useId();
  const current = variants.findIndex(variant => variant.id === value);
  if (!label.trim() || variants.some(variant => !variant.id.trim()) ||
      new Set(variants.map(variant => variant.id)).size !== variants.length || (variants.length && current === -1)) {
    throw new Error("Flood ResponseVariants requires a name, uniquely identified versions and a selected ID");
  }
  if (!variants.length) return null;
  const active = variants[current];
  const position = formatPosition(current + 1, variants.length);
  const control = (target: ResponseVariant | undefined, previous: boolean, name: string) =>
    <IconButton label={name} title={name} size="xs" variant="ghost" aria-controls={contentId} aria-disabled={!target || undefined}
      className="flood-response-variants__arrow" onClick={() => { if (target) onValueChange(target.id); }}>
      <PageArrow previous={previous} />
    </IconButton>;
  return <Stack {...props} ref={ref} gap="2" className={classes("flood-response-variants", className)}>
    <div key={active.id} id={contentId}>{active.content}</div>
    {variants.length > 1 && <Inline gap="1" role="group" aria-label={label}>
      {control(variants[current - 1], true, previousLabel)}
      <span className="flood-response-variants__position">
        <Text size="helper" tone="subtle" role="status" aria-atomic="true" dir="auto">{position}</Text>
        <Text size="helper" aria-hidden="true" className="flood-response-variants__measure">
          {formatPosition(variants.length, variants.length)}
        </Text>
      </span>
      {control(variants[current + 1], false, nextLabel)}
    </Inline>}
  </Stack>;
});

export interface OverlayTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref: RefCallback<HTMLButtonElement>;
}
export interface MenuActionItem {
  id: string;
  type?: "item";
  label: string;
  icon?: ReactNode;
  shortcut?: KeyboardShortcutKeys;
  disabled?: boolean;
  tone?: "default" | "danger";
}
export interface MenuSeparator { id: string; type: "separator"; }
export interface MenuSubmenuItem extends Omit<MenuActionItem, "type" | "tone" | "shortcut"> {
  type: "submenu";
  items: readonly MenuItem[];
}
export interface ContextMenuProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  label: string;
  items: readonly MenuItem[];
  onAction?: (id: string) => void;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
}
/** @since 0.2.7 */
export const ContextMenu = /* @__PURE__ */ forwardRef<HTMLDivElement, ContextMenuProps>(function ContextMenu(
  { defaultOpen = false, disabled = false, controlSize = "sm", ...props }, ref,
) { return <ContextActionMenu {...props} ref={ref} defaultOpen={defaultOpen} disabled={disabled} controlSize={controlSize} />; });
export interface MenuCheckboxItem extends Omit<MenuActionItem, "type" | "tone"> {
  type: "checkbox";
  checked: boolean | "mixed";
  onCheckedChange: (checked: boolean) => void;
  closeOnSelect?: boolean;
}
export interface MenuRadioItem extends Omit<MenuActionItem, "type" | "tone"> {
  type: "radio";
  group: string;
  checked: boolean;
  onCheckedChange: (checked: true) => void;
  closeOnSelect?: boolean;
}
export type MenuItem = MenuActionItem | MenuSeparator | MenuCheckboxItem | MenuRadioItem | MenuSubmenuItem;
export interface MenuProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  label: string;
  trigger: (props: OverlayTriggerProps) => ReactNode;
  items: readonly MenuItem[];
  onAction?: (id: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Resolve a fallback after close if the opener can no longer receive focus. */
  getFallbackFocus?: () => HTMLElement | null;
  disabled?: boolean;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  controlSize?: "sm" | "md" | "lg" | "xl";
}
/** @since 0.2.4 */
export const Menu = /* @__PURE__ */ forwardRef<HTMLDivElement, MenuProps>(function Menu(
  { defaultOpen = false, disabled = false, side = "bottom", align = "start", controlSize = "sm", ...props }, ref,
) {
  return <ActionMenu {...props} ref={ref} defaultOpen={defaultOpen} disabled={disabled} side={side} align={align} controlSize={controlSize} />;
});
export interface TooltipTriggerProps extends HTMLAttributes<HTMLElement> {
  ref: RefCallback<HTMLElement>;
}
export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "content" | "title" | "role"> {
  content: string;
  /** Native link/button-safe hover/focus props; the trigger keeps its own semantics. */
  trigger: (props: TooltipTriggerProps) => ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  delay?: number;
  disabled?: boolean;
  /** Position beside a containing region while the original trigger owns interaction. */
  positionReference?: RefObject<HTMLElement | null>;
}
export const Tooltip = /* @__PURE__ */ forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  {side = "top", align = "center", delay = 300, disabled = false, ...props}, ref,
) { return <AnchoredOverlay {...props} ref={ref} kind="tooltip" side={side} align={align} delay={delay} disabled={disabled} />; });
export interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title" | "role"> {
  title: string;
  chrome?: "default" | "minimal" | "title-only";
  trigger: (props: OverlayTriggerProps) => ReactNode;
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  closeLabel?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  positionReference?: RefObject<HTMLElement | null>;
  focusOnOpen?: boolean;
}
export const Popover = /* @__PURE__ */ forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  {side = "bottom", align = "start", defaultOpen = false, disabled = false, closeLabel = "Close", ...props}, ref,
) { return <AnchoredOverlay {...props} ref={ref} kind="popover" side={side} align={align} defaultOpen={defaultOpen} disabled={disabled} closeLabel={closeLabel} />; });

export interface HelpTipProps extends Omit<PopoverProps, "title" | "trigger" | "children" | "chrome" | "initialFocusRef" | "focusOnOpen" | "closeLabel"> {
  /** Name the subject of the help, for example "About invoice dates". */
  label: string;
  content: string;
}

/** Optional help opened with the same action on pointer, touch and keyboard. */
export const HelpTip = /* @__PURE__ */ forwardRef<HTMLDivElement, HelpTipProps>(function HelpTip(
  {label, content, className, side = "top", align = "center", "aria-describedby": describedBy, ...props}, ref,
) {
  const contentId = useId();
  return <Popover {...props} ref={ref} title={label} chrome="minimal" side={side} align={align}
    aria-describedby={mergeDescriptions(describedBy, contentId)} className={classes("flood-help-tip", className)}
    trigger={trigger => <IconButton {...trigger} label={label} size="2xs" variant="ghost" className="flood-help-tip__trigger">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11.5v4m0-7h.01" />
      </svg>
    </IconButton>}>
    <Text id={contentId} as="p" size="compact">{content}</Text>
  </Popover>;
});
export interface DialogProps extends Omit<HTMLAttributes<HTMLDialogElement>, "children" | "title" | "role"> {
  title: string;
  description?: string;
  trigger: (props: OverlayTriggerProps) => ReactNode;
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  closeLabel?: string;
  closeOnOutsideClick?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Resolve a fallback after close if the opener can no longer receive focus. */
  getFallbackFocus?: () => HTMLElement | null;
}
export const Dialog = /* @__PURE__ */ forwardRef<HTMLDialogElement, DialogProps>(function Dialog(
  {defaultOpen = false, disabled = false, closeLabel = "Close", closeOnOutsideClick = true, ...props}, ref,
) { return <ModalOverlay {...props} ref={ref} defaultOpen={defaultOpen} disabled={disabled} closeLabel={closeLabel} closeOnOutsideClick={closeOnOutsideClick} />; });

export interface AltTextDisclosureProps extends Pick<DialogProps, "open" | "defaultOpen" | "onOpenChange" | "closeLabel"> {
  /** Pass the same authored description used for the image's native alt. */
  alt: string;
  title?: string;
  triggerText?: string;
  triggerLabel?: string;
}

/** A visible way to read the alternative text of an image. */
export const AltTextDisclosure = /* @__PURE__ */ forwardRef<HTMLDialogElement, AltTextDisclosureProps>(function AltTextDisclosure(
  {alt, title = "Image description", triggerText = "ALT", triggerLabel = "Show alt text", ...props}, ref,
) {
  const readingStart = useRef<HTMLElement>(null);
  if (!alt.trim()) return null;
  return <Dialog {...props} ref={ref} title={title} initialFocusRef={readingStart}
    trigger={trigger => <Button {...trigger} size="sm" variant="outline" aria-label={triggerLabel}>{triggerText}</Button>}>
    <ScrollArea style={{maxBlockSize:"min(18rem, 50dvh)"}}>
      <Text ref={readingStart} as="p" size="compact" dir="auto" tabIndex={-1}
        style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",outline:"none"}}>{alt}</Text>
    </ScrollArea>
  </Dialog>;
});

export interface CommandPaletteProps extends Omit<DialogProps, "children" | "description" | "initialFocusRef"> {
  searchLabel: string;
  items: readonly CommandListItem[];
  density?: "comfortable" | "compact";
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  onAction: (id: string) => void;
  loading?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  loadingMessage?: string;
}
/** @since 0.2.11 */
export const CommandPalette = /* @__PURE__ */ forwardRef<HTMLDialogElement, CommandPaletteProps>(function CommandPalette(
  { searchLabel, items, density = "comfortable", query, defaultQuery, onQueryChange, onAction,
    loading, placeholder, emptyMessage, loadingMessage, open, defaultOpen = false, onOpenChange, className, ...props }, ref,
) {
  const input = useRef<HTMLInputElement>(null);
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const requestOpen = (next: boolean) => {
    if (open === undefined) setLocalOpen(next);
    onOpenChange?.(next);
  };
  return <Dialog {...props} ref={ref} open={open ?? localOpen} onOpenChange={requestOpen}
    initialFocusRef={input} className={classes("flood-command-palette", className)}>
    <div className="flood-command-palette__search-icon">
      <IconSlot size="sm"><SearchGlyph /></IconSlot>
    </div>
    <SearchCommandList ref={input} label={searchLabel} hideLabel integrated items={items} controlSize={density === "compact" ? "sm" : "md"}
      query={query} defaultQuery={defaultQuery} onQueryChange={onQueryChange} loading={loading}
      placeholder={placeholder} emptyMessage={emptyMessage} loadingMessage={loadingMessage}
      onAction={id => { requestOpen(false); onAction(id); }} />
  </Dialog>;
});

export interface DrawerProps extends DialogProps {
  side?: "start" | "end" | "top" | "bottom";
  size?: "sm" | "md" | "lg";
  footer?: ReactNode;
}
export const Drawer = /* @__PURE__ */ forwardRef<HTMLDialogElement, DrawerProps>(function Drawer(
  {side = "end", size = "md", defaultOpen = false, closeLabel = "Close", closeOnOutsideClick = true, className, footer, ...props}, ref,
) {
  return <ModalOverlay {...props} ref={ref} defaultOpen={defaultOpen} closeLabel={closeLabel} closeOnOutsideClick={closeOnOutsideClick} className={classes("flood-drawer", className)} data-side={side} data-size={size} scrollBody footer={footer} />;
});

export type SheetProps = Omit<DrawerProps, "side">;

/** A modal bottom sheet for a short task or a list of choices. @since 0.2.12 */
export const Sheet = /* @__PURE__ */ forwardRef<HTMLDialogElement, SheetProps>(function Sheet(
  { className, size = "md", ...props }, ref,
) {
  return <ModalOverlay {...props} ref={ref} data-side="bottom" data-size={size}
    className={classes("flood-drawer", "flood-sheet", className)} scrollBody bodyContentInset="none" />;
});

export interface AlertDialogProps extends Omit<DialogProps, "children" | "role" | "description" | "closeLabel" | "closeOnOutsideClick" | "initialFocusRef"> {
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}
export const AlertDialog = /* @__PURE__ */ forwardRef<HTMLDialogElement, AlertDialogProps>(function AlertDialog(
  {defaultOpen = false, confirmLabel = "Continue", cancelLabel = "Cancel", confirmDisabled = false, ...props}, ref,
) {
  return <ConfirmationDialog {...props} ref={ref} defaultOpen={defaultOpen} confirmLabel={confirmLabel} cancelLabel={cancelLabel} confirmDisabled={confirmDisabled} />;
});

export interface HoldToConfirmProps extends Pick<AlertDialogProps,
  "title" | "description" | "confirmLabel" | "cancelLabel" | "disabled" | "onConfirm" | "getFallbackFocus"> {
  label: string;
  /** Visible guidance for the hold shortcut. Localize alongside the action labels. */
  hint?: string;
  /** Minimum pointer press duration in milliseconds, clamped to 500–10000. */
  holdMs?: number;
  size?: ControlSize;
  tone?: ButtonProps["tone"];
}

/** Offer hold-and-release as a shortcut to a regular confirmation dialog. @since 0.2.14 */
export const HoldToConfirm = /* @__PURE__ */ forwardRef<HTMLDialogElement, HoldToConfirmProps>(function HoldToConfirm(
  {holdMs = 900, size = "md", tone = "default", hint = "Hold to confirm or click to review.", ...props}, ref,
) {
  return <HoldConfirmation {...props} holdMs={holdMs} size={size} tone={tone} hint={hint} dialogRef={ref} />;
});

export interface DeploymentRollbackReference {
  /** The stable deployment identifier, also displayed to distinguish repeated builds. */
  id: string;
  label: string;
}

export interface DeploymentRollbackDialogProps extends Omit<AlertDialogProps, "title" | "onConfirm"> {
  title?: string;
  current: DeploymentRollbackReference;
  target: DeploymentRollbackReference;
  /** Explain why the selected deployment cannot be restored. */
  unavailableReason?: string;
  labels?: {current?: string; target?: string; alreadyLive?: string};
  onConfirm: (targetId: string, currentId: string) => void;
}

/** Review the deployment replacing the live version before requesting a rollback. @since 0.2.14 */
export const DeploymentRollbackDialog = /* @__PURE__ */ forwardRef<HTMLDialogElement, DeploymentRollbackDialogProps>(function DeploymentRollbackDialog(
  {title = "Roll back deployment?", description, current, target, unavailableReason, labels,
    confirmLabel = "Roll back", confirmDisabled, onConfirm, ...props}, ref,
) {
  const reason = unavailableReason?.trim() || (current.id === target.id
    ? labels?.alreadyLive ?? "This deployment is already live."
    : undefined);
  const deployment = ({id, label}: DeploymentRollbackReference) => <Stack gap="1">
    <Text size="label" style={{overflowWrap:"anywhere"}} dir="auto">{label}</Text>
    <Text size="helper"><InlineCode size="sm" wrap dir="ltr">{id}</InlineCode></Text>
  </Stack>;

  return <ConfirmationDialog {...props} ref={ref} title={title}
    description={reason ? `${description}\n${reason}` : description}
    confirmLabel={confirmLabel} confirmDisabled={confirmDisabled || Boolean(reason)}
    onConfirm={() => onConfirm(target.id, current.id)}>
    <ValueChange layout="stacked" before={deployment(current)} after={deployment(target)}
      labels={{before:labels?.current ?? "Currently live",after:labels?.target ?? "Restore"}} />
  </ConfirmationDialog>;
});

export type BackupRestoreSource = {
  project: string;
  /** Snapshot capture time or recovery point, expressed as an explicitly zoned instant. */
  dateTime: string;
} & ({kind: "snapshot"; label?: string} | {kind: "point-in-time"});

export interface BackupRestoreDialogProps extends Omit<AlertDialogProps, "title" | "description"> {
  title?: string;
  source: BackupRestoreSource;
  destination: {kind: "replace" | "new"; project: string};
  timeZone?: string;
  /** Host-reported detail such as a known outage or an excluded resource. */
  impact?: string;
  /** Explain why confirmation is unavailable, for example after the recovery point expires. */
  unavailableReason?: string;
  labels?: Partial<Record<"source" | "destination" | "snapshot" | "pointInTime" | "replaceImpact" | "newImpact", string>>;
}

/** Review the source, exact point and destination before requesting a database restore. @since 0.2.14 */
export const BackupRestoreDialog = /* @__PURE__ */ forwardRef<HTMLDialogElement, BackupRestoreDialogProps>(function BackupRestoreDialog(
  {source, destination, title = "Restore database?", timeZone = "UTC", impact, unavailableReason,
    labels, confirmLabel, confirmDisabled, lang, ...props}, ref,
) {
  if (!source.project.trim() || !destination.project.trim()) {
    throw new Error("Flood BackupRestoreDialog requires named source and destination projects");
  }
  const replacing = destination.kind === "replace";
  const consequence = replacing
    ? labels?.replaceImpact ?? "Changes in the destination after this point will be lost."
    : labels?.newImpact ?? "This creates a separate database from the selected point.";
  const reason = unavailableReason?.trim();
  const point = parseInstant(source.dateTime, "BackupRestoreDialog");
  const date = new Intl.DateTimeFormat(lang || "en", {timeZone, dateStyle:"medium"}).format(point);
  const time = new Intl.DateTimeFormat(lang || "en", {timeZone, hour:"numeric", minute:"2-digit", second:"2-digit",
    timeZoneName:"short"}).format(point).replace(/\s/gu, "\u00a0");
  const pointLabel = source.kind === "snapshot" ? source.label ?? labels?.snapshot ?? "Snapshot"
    : labels?.pointInTime ?? "Point in time";

  return <ConfirmationDialog {...props} ref={ref} title={title} lang={lang}
    description={[consequence, impact, reason].filter(Boolean).join("\n")}
    confirmLabel={confirmLabel ?? (replacing ? "Restore database" : "Create restored copy")}
    confirmDisabled={confirmDisabled || Boolean(reason)}>
    <DescriptionList layout="columns" items={[
      {id:"source",term:labels?.source ?? "Source",description:<Text size="label" dir="auto">{source.project}</Text>},
      {id:"point",term:pointLabel,description:<Timestamp dateTime={source.dateTime} size="compact">{`${date}, ${time}`}</Timestamp>},
      {id:"destination",term:labels?.destination ?? "Destination",description:<Text size="label" dir="auto">{destination.project}</Text>},
    ]} />
  </ConfirmationDialog>;
});

export interface CollapsibleProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "onChange"> {
  title: string;
  /** Noninteractive metadata inside the disclosure button. */
  headerMeta?: ReactNode;
  /** Independent action beside the disclosure trigger, never nested inside it. */
  headerAction?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Flush groups share their parent surface and content edge. */
  variant?: "framed" | "flush";
  /** Fit a short disclosure label and its chevron without narrowing the panel. */
  triggerWidth?: "full" | "fit";
}
export const Collapsible = /* @__PURE__ */ forwardRef<HTMLDivElement, CollapsibleProps>(function Collapsible(
  {open, defaultOpen = false, onOpenChange, disabled = false, controlSize = "md", ...props}, ref,
) {
  const [local, setLocal] = useState(defaultOpen);
  return <Disclosure {...props} ref={ref} expanded={open ?? local} disabled={disabled} controlSize={controlSize} onExpandedChange={next => {
    if (open === undefined) setLocal(next);
    onOpenChange?.(next);
  }} />;
});

export type ToolCallState = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export interface ToolCallProps extends Omit<CollapsibleProps, "headerMeta" | "children" | "triggerWidth"> {
  state: ToolCallState;
  /** Display-safe request details supplied by the application. */
  input?: ReactNode;
  /** Display-safe output or actionable error details supplied by the application. */
  output?: ReactNode;
  summary?: ReactNode;
  announce?: boolean;
  labels?: {
    input?: string;
    output?: string;
    error?: string;
    state?: Partial<Record<ToolCallState, string>>;
  };
}

const toolCallAppearance = {
  queued: {label: "Queued", tone: "neutral"},
  running: {label: "Running", tone: "info"},
  succeeded: {label: "Completed", tone: "success"},
  failed: {label: "Failed", tone: "error"},
  cancelled: {label: "Cancelled", tone: "neutral"},
} as const;

/** A tool invocation with its current state and optional inspection details. @since 0.2.14 */
export const ToolCall = /* @__PURE__ */ forwardRef<HTMLDivElement, ToolCallProps>(function ToolCall(
  {title, state, input, output, summary, labels, announce = false, className,
    controlSize = "sm", headingLevel, headerAction, open, defaultOpen, onOpenChange, disabled, variant = "flush", ...props}, ref,
) {
  const {tone, label: defaultLabel} = toolCallAppearance[state];
  const label = labels?.state?.[state] ?? defaultLabel;
  const status = <StatusIndicator size="sm" presentation="wrap" label={label} tone={tone} />;
  const hasDetails = hasFieldContent(summary) || hasFieldContent(input) || hasFieldContent(output);
  const detailHeadingLevel = Math.min(6, (headingLevel ?? 2) + 1) as 3 | 4 | 5 | 6;
  return <Stack {...props} ref={ref} gap="0" className={classes("flood-tool-call", className)}>
    {hasDetails ? <Collapsible title={title} controlSize={controlSize} open={open} defaultOpen={defaultOpen}
      onOpenChange={onOpenChange} disabled={disabled} variant={variant}
      headingLevel={headingLevel} headerAction={headerAction} headerMeta={status}>
      <Stack gap="3">
        {hasFieldContent(summary) && <Text as="div" size="compact" tone="subtle">{summary}</Text>}
        {hasFieldContent(input) && <SettingGroup headingLevel={detailHeadingLevel}
          title={labels?.input ?? "Input"} density="compact">{input}</SettingGroup>}
        {hasFieldContent(output) && <SettingGroup headingLevel={detailHeadingLevel}
          title={state === "failed" ? labels?.error ?? "Error" : labels?.output ?? "Output"} density="compact">{output}</SettingGroup>}
      </Stack>
    </Collapsible> : <Inline gap="3" className="flood-tool-call__summary">
      <Text size="label" className="flood-tool-call__title">{title}</Text>{status}{headerAction}
    </Inline>}
    {announce && <VisuallyHidden role="status">{title}: {label}</VisuallyHidden>}
  </Stack>;
});

export interface GroupedToolCall extends Pick<ToolCallProps, "title" | "state" | "input" | "output" | "summary" | "labels"> {
  id: string;
}

export type ToolCallCounts = Readonly<Record<ToolCallState, number>>;

export interface ToolCallGroupProps extends Omit<CollapsibleProps, "headerMeta" | "children"> {
  calls: readonly GroupedToolCall[];
  /** Localize the collapsed summary or surface different counts for the workflow. */
  formatSummary?: (counts: ToolCallCounts) => string;
  /** Enable when this group is the announcement owner for the calls it contains. */
  announce?: boolean;
}

function formatToolCallGroupSummary(counts: ToolCallCounts) {
  const active = counts.running + counts.queued;
  const total = active + counts.failed + counts.succeeded + counts.cancelled;
  const activity = active ? `${active} active` : "";
  const failures = counts.failed ? `${counts.failed} failed` : "";
  return [activity, failures].filter(Boolean).join(" · ") || `${total} ${total === 1 ? "call" : "calls"}`;
}

/** Review a batch of tool invocations without expanding every call in a conversation. @since 0.2.14 */
export const ToolCallGroup = /* @__PURE__ */ forwardRef<HTMLDivElement, ToolCallGroupProps>(function ToolCallGroup(
  {calls, title, formatSummary = formatToolCallGroupSummary, announce = false, headingLevel,
    controlSize = "sm", variant = "flush", className, ...props}, ref,
) {
  if (!title.trim() || calls.some(call => !call.id.trim() || !call.title.trim()) ||
      new Set(calls.map(call => call.id)).size !== calls.length) {
    throw new Error("Flood ToolCallGroup requires a name and uniquely identified calls");
  }
  if (!calls.length) return null;
  const counts = {queued: 0, running: 0, succeeded: 0, failed: 0, cancelled: 0};
  for (const call of calls) counts[call.state] += 1;
  const summary = formatSummary(counts);
  const tone = counts.failed ? "error" : counts.running + counts.queued ? "info" : "neutral";
  const callHeadingLevel = headingLevel ? Math.min(6, headingLevel + 1) as 3 | 4 | 5 | 6 : undefined;
  return <Stack className={classes("flood-tool-call-group", className)} gap="0" ref={ref}>
    <Collapsible {...props} title={title} variant={variant} controlSize={controlSize} headingLevel={headingLevel}
      headerMeta={<StatusIndicator size="sm" presentation="wrap" label={summary} tone={tone} />}>
      <List aria-label={title} ordered marker={false} gap="1" className="flood-tool-call-group__calls">
        {calls.map(({id, ...call}) => <li key={id}><ToolCall {...call} headingLevel={callHeadingLevel} /></li>)}
      </List>
    </Collapsible>
    {announce && <VisuallyHidden role="status" aria-atomic="true">{title}: {summary}</VisuallyHidden>}
  </Stack>;
});

export interface AccordionItem {
  value: string;
  title: string;
  content: ReactNode;
  disabled?: boolean;
}
export interface AccordionProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "defaultValue" | "onChange"> {
  label: string;
  items: readonly AccordionItem[];
  expansionMode?: "single" | "multiple";
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  disabled?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Flush groups share their parent surface and content edge. */
  variant?: "framed" | "flush";
}
export const Accordion = /* @__PURE__ */ forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  {label, items, variant = "framed", expansionMode = "single", value, defaultValue = [], onValueChange, disabled = false, controlSize = "md", headingLevel = 3, className, onKeyDown, ...props}, ref,
) {
  const [local, setLocal] = useState(() => [...new Set(defaultValue)]);
  const expanded = value ?? local;
  if (new Set(items.map(item => item.value)).size !== items.length) throw new Error("Flood accordion item values must be unique");
  if (expansionMode === "single" && new Set(expanded).size > 1) throw new Error("Flood single Accordion accepts at most one value");
  return <div {...props} ref={ref} role="group" aria-label={label} data-variant={variant} className={classes("flood-accordion", className)} onKeyDown={event => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(":scope > .flood-disclosure > .flood-disclosure__heading > .flood-disclosure__trigger:not(:disabled)"));
    const index = buttons.indexOf(event.target as HTMLButtonElement);
    if (index < 0) return;
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : event.key === "ArrowDown" ? (index + 1) % buttons.length : event.key === "ArrowUp" ? (index - 1 + buttons.length) % buttons.length : -1;
    if (next >= 0) {event.preventDefault(); buttons[next].focus();}
  }}>
    {items.map(item => <Collapsible key={item.value} title={item.title} open={expanded.includes(item.value)} disabled={disabled || item.disabled} controlSize={controlSize} headingLevel={headingLevel} onOpenChange={active => {
      const next = active ? expansionMode === "single" ? [item.value] : [...new Set([...expanded, item.value])] : expanded.filter(value => value !== item.value);
      if (value === undefined) setLocal(next);
      onValueChange?.([...next]);
    }}>{item.content}</Collapsible>)}
  </div>;
});

export interface ToggleProps extends Omit<ButtonProps, "aria-pressed" | "type" | "role" | "defaultValue"> {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  iconOnly?: boolean;
}
/** A native toggle button; its accessible name stays stable when pressed. */
export const Toggle = /* @__PURE__ */ forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { pressed, defaultPressed = false, onPressedChange, iconOnly = false, size = "md", variant = "subtle", onClick, className, children, disabled, loading, ...props }, ref,
) {
  const [local, setLocal] = useState(defaultPressed);
  const selected = pressed ?? local;
  return <Button {...props} ref={ref} type="button" aria-pressed={selected} size={size} variant={variant} disabled={disabled} loading={loading}
    className={classes("flood-toggle", iconOnly && "flood-icon-button", className)} onClick={event => {
      onClick?.(event);
      if (event.defaultPrevented || disabled || loading) return;
      if (pressed === undefined) setLocal(!selected);
      onPressedChange?.(!selected);
    }}>{iconOnly ? <IconSlot size={size}>{children}</IconSlot> : children}</Button>;
});

export interface ReactionButtonProps extends Omit<ToggleProps, "children" | "iconOnly" | "pressed" | "defaultPressed" | "size" | "variant"> {
  label: string;
  icon: ReactNode;
  count: number;
  pressed: boolean;
  variant?: "subtle" | "outline" | "ghost";
}

/** A reaction with a host-owned count and pressed state. */
export const ReactionButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, ReactionButtonProps>(function ReactionButton(
  {label, icon, count, pressed, variant = "subtle", className, ...props}, ref,
) {
  if (!label.trim() || !Number.isSafeInteger(count) || count < 0) throw new Error("Flood ReactionButton requires a label and a nonnegative count");
  return <Toggle {...props} ref={ref} size="xs" variant={variant} pressed={pressed}
    className={classes("flood-reaction-button", className)} aria-label={`${label}, ${count}`}>
    <IconSlot size="2xs">{icon}</IconSlot>
    <span className="flood-reaction-button__count">{count}</span>
  </Toggle>;
});

export interface ReactionOption {
  id: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  selected?: boolean;
}

export interface ReactionPickerProps extends Omit<PopoverProps, "children" | "trigger" | "title" | "chrome" | "initialFocusRef" | "onSelect"> {
  label?: string;
  options: readonly ReactionOption[];
  /** Requests the next selection state, without changing the host's data. */
  onSelect: (id: string, selected: boolean) => void;
}

/** A named reaction chooser with keyboard navigation and focus return. */
export const ReactionPicker = /* @__PURE__ */ forwardRef<HTMLDivElement, ReactionPickerProps>(function ReactionPicker(
  {label = "Add reaction", options, onSelect, disabled = false, side = "top", open:controlled, defaultOpen = false,
    onOpenChange, className, ...props}, ref,
) {
  const [local, setLocal] = useState(defaultOpen);
  const unavailable = disabled || options.length === 0;
  const open = (controlled ?? local) && !unavailable;
  function request(next: boolean) {
    if (controlled === undefined) setLocal(next);
    onOpenChange?.(next);
  }
  return <Popover {...props} ref={ref} title={label} chrome="minimal" side={side} open={open} onOpenChange={request}
    disabled={unavailable} className={classes("flood-reaction-picker", className)}
    trigger={trigger => <IconButton {...trigger} size="xs" iconSize="2xs" variant="ghost" label={label} title={label}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 14a8 8 0 1 1-9-10m-2 9a3.5 3.5 0 0 0 6 0M8 9h.01M14 9h.01M18 3v6m-3-3h6" />
      </svg>
    </IconButton>}>
    <Toolbar label={label} variant="plain">
      {options.map(option => <Toggle key={option.id} aria-label={option.label} title={option.label}
        iconOnly size="sm" variant="ghost" className="flood-reaction-picker__option" pressed={option.selected ?? false}
        disabled={option.disabled} onPressedChange={selected => { request(false); onSelect(option.id, selected); }}>
        {option.icon}
      </Toggle>)}
    </Toolbar>
  </Popover>;
});

export interface ToggleOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}
export interface ToggleGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "role" | "children" | "defaultValue" | "onChange"> {
  label: string;
  options: readonly ToggleOption[];
  selectionMode?: "single" | "multiple";
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  orientation?: "horizontal" | "vertical";
  size?: ControlSize;
  variant?: "solid" | "subtle" | "outline" | "ghost";
  disabled?: boolean;
  iconOnly?: boolean;
}
/** Optional selections exposed as pressed buttons, not radios, tabs or a toolbar. */
export const ToggleGroup = /* @__PURE__ */ forwardRef<HTMLDivElement, ToggleGroupProps>(function ToggleGroup(
  { label, options, selectionMode = "multiple", value, defaultValue = [], onValueChange, orientation = "horizontal", size = "md", variant = "subtle", disabled = false, iconOnly = false, className, onKeyDown, ...props }, ref,
) {
  const [local, setLocal] = useState(() => [...new Set(defaultValue)]);
  const selected = value ?? local;
  if (new Set(options.map(option => option.value)).size !== options.length) throw new Error("Flood toggle option values must be unique");
  if (selectionMode === "single" && new Set(selected).size > 1) throw new Error("Flood single ToggleGroup accepts at most one value");
  if (iconOnly && options.some(option => !option.icon)) throw new Error("Flood icon-only toggle options require icons");
  return <ScrollArea orientation="horizontal" tabIndex={-1} role="group" aria-label={`${label} scrolling`} className="flood-connected-scroll" hidden={props.hidden} dir={props.dir} lang={props.lang} style={{maxInlineSize:"100%"}}><div {...props} ref={ref} role="group" aria-label={label} data-orientation={orientation} data-selection-mode={selectionMode}
    className={classes("flood-button-group", "flood-toggle-group", className)} onKeyDown={event => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
      const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(":scope > .flood-toggle:not(:disabled)"));
      const index = buttons.indexOf(event.target as HTMLButtonElement);
      if (index < 0) return;
      const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
      const nextKey = orientation === "vertical" ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
      const previousKey = orientation === "vertical" ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : event.key === nextKey ? (index + 1) % buttons.length : event.key === previousKey ? (index - 1 + buttons.length) % buttons.length : -1;
      if (next >= 0) { event.preventDefault(); buttons[next].focus(); }
    }}>
    {options.map(option => <Toggle key={option.value} size={size} variant={variant} disabled={disabled || option.disabled} pressed={selected.includes(option.value)} iconOnly={iconOnly}
      aria-label={iconOnly ? option.label : undefined} onPressedChange={active => {
        const next = active ? selectionMode === "single" ? [option.value] : [...new Set([...selected, option.value])] : selected.filter(item => item !== option.value);
        if (value === undefined) setLocal(next);
        onValueChange?.([...next]);
      }}>{iconOnly ? option.icon : <>{option.icon && <IconSlot size={size}>{option.icon}</IconSlot>}{option.label}</>}</Toggle>)}
  </div></ScrollArea>;
});

export interface ButtonGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  label: string;
  orientation?: "horizontal" | "vertical";
}
/** Connected actions keep their ordinary Tab order; this is not a toolbar. */
export const ButtonGroup = /* @__PURE__ */ forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { label, orientation = "horizontal", className, ...props }, ref,
) {
  return <ScrollArea orientation="horizontal" tabIndex={-1} role="group" aria-label={`${label} scrolling`} className="flood-connected-scroll" hidden={props.hidden} dir={props.dir} lang={props.lang} style={{maxInlineSize:"100%"}}><div {...props} ref={ref} role="group" aria-label={label} data-orientation={orientation} className={classes("flood-button-group", className)} /></ScrollArea>;
});

export interface SplitButtonProps extends Omit<ButtonGroupProps, "orientation"> {
  /** Accessible name for the button that opens the alternatives. */
  menuLabel: string;
  items: MenuProps["items"];
  onAction?: MenuProps["onAction"];
  /** Native button props for the primary action only. */
  primaryButtonProps?: Omit<ButtonProps, "children" | "size" | "variant" | "tone">;
  size?: ControlSize;
  variant?: "solid" | "subtle" | "outline";
  /** Disables both actions. Use primaryButtonProps.disabled or loading for the primary action alone. */
  disabled?: boolean;
}

/** A default action and a connected menu of alternatives. */
export const SplitButton = /* @__PURE__ */ forwardRef<HTMLDivElement, SplitButtonProps>(function SplitButton(
  { menuLabel, items, onAction, primaryButtonProps, size = "md", variant = "solid", disabled = false, children, ...props }, ref,
) {
  const chevron = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>;
  return <ButtonGroup {...props} ref={ref}>
    <Button {...primaryButtonProps} size={size} variant={variant} disabled={disabled || primaryButtonProps?.disabled}>
      {children}
    </Button>
    {items.length === 0 ? <IconButton label={menuLabel} size={size} variant={variant} disabled>{chevron}</IconButton>
      : <Menu label={menuLabel} items={items} onAction={onAction} disabled={disabled} align="end"
      trigger={triggerProps => <IconButton {...triggerProps} label={menuLabel} size={size} variant={variant}>
        {chevron}
      </IconButton>} />}
  </ButtonGroup>;
});

export interface SaveCollectionOption {
  id: string;
  label: string;
  selected: boolean;
  /** The host can disable membership changes for individual collections. */
  disabled?: boolean;
}

export interface SaveToCollectionProps extends Omit<ButtonGroupProps, "children" | "orientation" | "onChange"> {
  saved: boolean;
  collections: readonly SaveCollectionOption[];
  onSavedChange: (saved: boolean) => void;
  onCollectionChange: (collectionId: string, selected: boolean) => void;
  /** A request to change the personal save is in flight. */
  pending?: boolean;
  disabled?: boolean;
  size?: ControlSize;
  variant?: SplitButtonProps["variant"];
  labels?: {save?: string; saved?: string; collections?: string};
}

/** Save a record to a personal library and manage its independent collection membership. @since 0.2.14 */
export const SaveToCollection = /* @__PURE__ */ forwardRef<HTMLDivElement, SaveToCollectionProps>(function SaveToCollection(
  {label, saved, collections, onSavedChange, onCollectionChange, pending = false, disabled = false,
    size = "sm", variant = "subtle", labels, ...props}, ref,
) {
  if (!label.trim() || collections.some(option => !option.id.trim() || !option.label.trim()) ||
      new Set(collections.map(option => option.id)).size !== collections.length) {
    throw new Error("Flood SaveToCollection requires a label and uniquely identified, named collections");
  }
  const saveLabel = labels?.save ?? "Save";
  const items: MenuCheckboxItem[] = collections.map(option => ({
    id:option.id,
    label:option.label,
    type:"checkbox",
    checked:option.selected,
    disabled:option.disabled,
    closeOnSelect:false,
    onCheckedChange:selected => onCollectionChange(option.id, selected),
  }));
  return <SplitButton {...props} ref={ref} label={label} menuLabel={labels?.collections ?? "Collections"}
    items={items} size={size} variant={variant} disabled={disabled}
    primaryButtonProps={{
      type:"button", "aria-label":saveLabel, "aria-pressed":saved,
      loading:pending ? "retain-focus" : false,
      onClick:() => {if (!pending) onSavedChange(!saved);},
    }}>
    <span className="flood-action-labels" aria-hidden="true">
      <span data-visible={!saved || undefined}>{saveLabel}</span>
      <span data-visible={saved || undefined}>{labels?.saved ?? "Saved"}</span>
    </span>
  </SplitButton>;
});

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  status?: FieldStatus;
  invalid?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
}
export const Input = /* @__PURE__ */ forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, status, controlSize = "md", className, ...props },
  ref,
) {
  return (
    <input
      {...props}
      ref={ref}
      data-status={resolveFieldStatus(status, invalid, props["aria-invalid"])}
      aria-invalid={invalid || status === "error" || props["aria-invalid"]}
      className={classes("flood-input", `flood-control--${controlSize}`, className)}
    />
  );
});
export interface InputGroupProps extends Omit<InputProps, "children" | "type"> {
  type?: "text" | "email" | "password" | "search" | "tel" | "url" | "number";
  start?: ReactNode;
  end?: ReactNode;
}
/** One real Input with host-owned logical start/end adornments. Ref and native attributes target the input. */
export const InputGroup = /* @__PURE__ */ forwardRef<HTMLInputElement, InputGroupProps>(function InputGroup(
  { start, end, controlSize = "md", className, style, invalid, status, disabled, readOnly, ...props }, ref,
) {
  return <div hidden={props.hidden} dir={props.dir} lang={props.lang} className={classes("flood-input-group", `flood-control--${controlSize}`, className)} style={style}
    data-status={resolveFieldStatus(status, invalid, props["aria-invalid"])} data-disabled={disabled || undefined} data-readonly={readOnly || undefined}>
    {hasFieldContent(start) && <div className="flood-input-group__addon flood-input-group__addon--start">{typeof start === "string" ? <bdi dir="auto">{start}</bdi> : start}</div>}
    <Input {...props} ref={ref} controlSize={controlSize} invalid={invalid} status={status} disabled={disabled} readOnly={readOnly} />
    {hasFieldContent(end) && <div className="flood-input-group__addon flood-input-group__addon--end">{typeof end === "string" ? <bdi dir="auto">{end}</bdi> : end}</div>}
  </div>;
});
export type HandleAvailability = {handle: string} & (
  | {state:"checking" | "available"}
  | {state:"unavailable"; reason: string}
);

export interface HandleFieldProps extends Omit<InputProps, "type" | "value" | "defaultValue" | "onChange" | "children"> {
  label?: string;
  /** The editable name, or the full address when domain is omitted. */
  value: string;
  onValueChange: (value: string) => void;
  /** The fixed hosted domain, without a leading dot. */
  domain?: string;
  availability?: HandleAvailability;
  hint?: ReactNode;
  labels?: {checking?: string; available?: string};
}

/** Edit a hosted or custom-domain handle without conflating it with ownership verification. @since 0.2.14 */
export const HandleField = /* @__PURE__ */ forwardRef<HTMLInputElement, HandleFieldProps>(function HandleField(
  {label = "Handle",value,onValueChange,domain,availability,hint,labels,name,form,disabled,required,hidden,
    id,status,"aria-describedby":describedBy,"aria-invalid":ariaInvalid,className,...props}, ref,
) {
  const suffixId = useId();
  const suffix = domain ? `.${domain}` : "";
  const handle = value ? `${value}${suffix}` : "";
  const result = handle && availability?.handle === handle ? availability : undefined;
  const message = result?.state === "checking" ? labels?.checking ?? "Checking availability…"
    : result?.state === "available" ? labels?.available ?? "Available" : undefined;
  return <Stack gap="1" hidden={hidden}>
    <Field id={id} label={label} required={required} hint={hint} status={status}
      describedBy={mergeDescriptions(describedBy,suffix && suffixId)}
      message={message && <span role="status">{message}</span>}
      error={result?.state === "unavailable" ? result.reason : undefined}>
      {field => <InputGroup {...props} {...field} ref={ref} type="text" dir="ltr" form={form} value={value} disabled={disabled}
        className={classes("flood-handle-field__input",className)}
        aria-invalid={field["aria-invalid"] ?? ariaInvalid}
        autoComplete="off" autoCapitalize="none" spellCheck={false}
        end={suffix ? <TruncatedText id={suffixId}>{suffix}</TruncatedText> : undefined}
        onChange={event => onValueChange(event.currentTarget.value)} />}
    </Field>
    {name && <input type="hidden" name={name} form={form} disabled={disabled} value={handle}/>}
  </Stack>;
});

export interface FileInputProps extends Omit<InputProps, "type" | "value" | "defaultValue" | "children" | "readOnly"> {
  clearable?: boolean;
  clearLabel?: string;
  selectionLabel?: string;
  removeFileLabel?: string;
  onFilesChange?: (files: readonly File[]) => void;
}
export const FileInput = /* @__PURE__ */ forwardRef<HTMLInputElement, FileInputProps>(function FileInput(
  { clearable = true, clearLabel = "Clear files", controlSize = "md", ...props }, ref,
) {
  return <FilePicker {...props} ref={ref} clearable={clearable} clearLabel={clearLabel} controlSize={controlSize} actionComponent={IconButton} iconComponent={IconSlot} />;
});

export type FileTriggerControlProps = Pick<ButtonProps, "type" | "disabled" | "onClick" | "aria-label">;

export interface FileTriggerProps extends Pick<InputHTMLAttributes<HTMLInputElement>, "accept" | "capture" | "multiple" | "disabled"> {
  label: string;
  onFilesSelect: (files: File[]) => void;
  trigger?: (props: FileTriggerControlProps) => ReactNode;
}

/** Opens the native file chooser for an application-owned action. */
export const FileTrigger = /* @__PURE__ */ forwardRef<HTMLInputElement, FileTriggerProps>(function FileTrigger(
  {label, onFilesSelect, trigger, ...inputProps}, ref,
) {
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current!, []);
  const triggerProps: FileTriggerControlProps = {
    type: "button",
    disabled: inputProps.disabled,
    "aria-label": label,
    onClick: () => {
      const node = input.current;
      if (node && !node.matches(":disabled")) node.click();
    },
  };
  return <>
    <input {...inputProps} ref={input} type="file" hidden onChange={event => {
      const node = event.currentTarget;
      const files = Array.from(node.files ?? []);
      node.value = "";
      if (!node.matches(":disabled") && files.length) onFilesSelect(files);
    }} />
    {trigger ? trigger(triggerProps) : <Button {...triggerProps} variant="subtle">{label}</Button>}
  </>;
});

export interface AvatarPickerProps extends Omit<FieldsetProps, "children" | "legend" | "layout"> {
  label?: string;
  name: string;
  src?: string;
  /** A host-accepted local image, shown ahead of the stored source. */
  file?: File | null;
  fallback?: AvatarProps["fallback"];
  size?: ContentSize;
  shape?: AvatarProps["shape"];
  accept?: string;
  busy?: boolean;
  chooseLabel?: string;
  replaceLabel?: string;
  removeLabel?: string;
  onFileSelect: (file: File) => void;
  onRemove?: () => void;
}

/** A profile image preview with compact choose, replace and remove actions. */
export const AvatarPicker = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, AvatarPickerProps>(function AvatarPicker(
  {label = "Profile photo", name, src, file, fallback, size = "lg", shape,
    accept = "image/*", busy = false, disabled, chooseLabel = "Choose photo", replaceLabel = "Change photo",
    removeLabel = "Remove photo", onFileSelect, onRemove, ...props}, ref,
) {
  const button = useRef<HTMLButtonElement>(null);
  const [preview, setPreview] = useState<{file: File; url: string}>();
  useEffect(() => {
    if (!file) { setPreview(undefined); return; }
    const url = URL.createObjectURL(file);
    setPreview({file, url});
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const hasPhoto = Boolean(src || file);
  return <Fieldset {...props} ref={ref} legend={label} disabled={disabled} aria-busy={busy || undefined}>
    <Inline gap="3">
      <Avatar name={name} src={preview && preview.file === file ? preview.url : src} fallback={fallback} size={size} shape={shape} />
      <Inline gap="2">
        <FileTrigger accept={accept} label={hasPhoto ? replaceLabel : chooseLabel} disabled={disabled || busy}
          onFilesSelect={files => onFileSelect(files[0])}
          trigger={trigger => <Button {...trigger} ref={button} size="sm" variant="subtle" loading={busy}>
            {hasPhoto ? replaceLabel : chooseLabel}
          </Button>} />
        {hasPhoto && onRemove && <Button size="sm" variant="ghost" disabled={busy} onClick={event => {
          if (event.currentTarget === event.currentTarget.ownerDocument.activeElement) button.current?.focus({preventScroll: true});
          onRemove();
        }}>{removeLabel}</Button>}
      </Inline>
    </Inline>
  </Fieldset>;
});

export interface FindBarLabels {
  find?: string;
  clear?: string;
  next?: string;
  previous?: string;
  caseSensitive?: string;
  regularExpression?: string;
  replace?: string;
  replaceValue?: string;
  replaceAll?: string;
  dismiss?: string;
  noMatches?: string;
  formatCount?: (active: number | null, count: number) => string;
}
export interface FindBarReplace {
  value: string;
  onValueChange: (value: string) => void;
  onReplace: () => void;
  onReplaceAll?: () => void;
}
export interface FindBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  label?: string;
  query: string;
  onQueryChange: (query: string) => void;
  matchCount: number;
  /** One-based position of the current match, when the host has selected one. */
  activeMatch?: number | null;
  onPreviousMatch: () => void;
  onNextMatch: () => void;
  queryError?: string;
  caseSensitive?: boolean;
  onCaseSensitiveChange?: (value: boolean) => void;
  regularExpression?: boolean;
  onRegularExpressionChange?: (value: boolean) => void;
  replace?: FindBarReplace;
  onDismiss?: () => void;
  controlSize?: "sm" | "md" | "lg" | "xl";
  labels?: FindBarLabels;
}
/** Search and replacement commands over host-owned matches. */
export const FindBar = /* @__PURE__ */ forwardRef<HTMLDivElement, FindBarProps>(function FindBar({
  label = "Find in document", controlSize = "sm", ...props
}, ref) {
  return <SearchCommands {...props} ref={ref} label={label} controlSize={controlSize} />;
});

export interface SearchInputProps extends Omit<InputProps, "type" | "children"> {
  clearable?: boolean;
  clearLabel?: string;
}
export const SearchInput = /* @__PURE__ */ forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { clearable = true, clearLabel = "Clear search", controlSize = "md", ...props }, ref,
) {
  return <SearchField {...props} ref={ref} clearable={clearable} clearLabel={clearLabel} controlSize={controlSize} group={InputGroup} action={IconButton} icon={IconSlot} />;
});
export interface VisualSearchImage {
  id: string;
  label: string;
  thumbnailSrc?: string;
}

export interface VisualSearchQuery {
  text: string;
  image: VisualSearchImage | null;
}

export interface VisualSearchFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "children" | "onSubmit" | "onChange"> {
  label: string;
  value: VisualSearchQuery;
  onTextChange: (text: string) => void;
  onChooseImage: () => void;
  onRemoveImage: () => void;
  onSearch: (query: VisualSearchQuery) => void;
  pending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  labels?: Partial<Record<"text" | "choose" | "replace" | "remove" | "clear" | "search", string>>;
}

/** Combine a chosen reference image and search text in one controlled query. @since 0.2.14 */
export const VisualSearchForm = /* @__PURE__ */ forwardRef<HTMLFormElement, VisualSearchFormProps>(function VisualSearchForm(
  {label, value, onTextChange, onChooseImage, onRemoveImage, onSearch, pending = false, disabled = false,
    placeholder, labels, className, ...props}, ref,
) {
  const input = useRef<HTMLInputElement>(null);
  const image = value.image;
  if (!label.trim() || (image && (!image.id.trim() || !image.label.trim()))) {
    throw new Error("Flood VisualSearchForm requires a name and an identified reference image");
  }
  const text = value.text.trim();
  const hasQuery = Boolean(text || image);
  return <form {...props} ref={ref} aria-label={label} className={classes("flood-visual-search-form", className)}
    onSubmit={event => {
      event.preventDefault();
      if (!disabled && !pending && hasQuery) onSearch({text, image});
    }}>
    <Stack gap="3">
      <Inline gap="2" className="flood-visual-search-form__controls">
        <SearchInput ref={input} controlSize="sm" aria-label={labels?.text ?? "Search text"} placeholder={placeholder ?? "Search by description…"}
          clearLabel={labels?.clear} value={value.text} disabled={disabled} onChange={event => onTextChange(event.currentTarget.value)} />
        <Button type="submit" size="sm" disabled={disabled || !hasQuery} loading={pending ? "retain-focus" : false}>
          {labels?.search ?? "Search"}
        </Button>
      </Inline>
      <Inline gap="2" className="flood-visual-search-form__reference">
        {image && <Tag className="flood-visual-search-form__image" disabled={disabled} removeLabel={labels?.remove ?? "Remove image"}
          icon={image.thumbnailSrc && <Image className="flood-visual-search-form__thumbnail"
            src={image.thumbnailSrc} alt="" onError={event => { event.currentTarget.style.visibility = "hidden"; }} key={image.thumbnailSrc} />}
          onRemove={() => { input.current?.focus(); onRemoveImage(); }}>
          <bdi>{image.label}</bdi>
        </Tag>}
        <Button size={image ? "xs" : "sm"} type="button" variant={image ? "ghost" : "outline"} disabled={disabled} onClick={onChooseImage}
          aria-label={image ? labels?.replace ?? "Replace image" : undefined}>
          {image ? labels?.replace ?? "Replace" : labels?.choose ?? "Add image"}
        </Button>
      </Inline>
    </Stack>
  </form>;
});

export interface PasswordInputProps extends Omit<InputProps, "type" | "children"> {
  visible?: boolean;
  defaultVisible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}
export const PasswordInput = /* @__PURE__ */ forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { defaultVisible = false, showPasswordLabel = "Show password", hidePasswordLabel = "Hide password", controlSize = "md", ...props }, ref,
) {
  return <PasswordField {...props} ref={ref} defaultVisible={defaultVisible} showPasswordLabel={showPasswordLabel} hidePasswordLabel={hidePasswordLabel} controlSize={controlSize} group={InputGroup} action={IconButton} icon={IconSlot} />;
});

export interface ComboboxOption {
  value: string;
  label: string;
  /** Override the committed label in a single-selection Combobox, for example to restore group context. */
  selectedLabel?: string;
  description?: string;
  /** Optional visual identity, named by the existing option label. */
  avatar?: Pick<AvatarProps, "src" | "fallback" | "shape">;
  keywords?: readonly string[];
  disabled?: boolean;
  group?: string;
}
export interface ComboboxProps extends Omit<InputProps, "type" | "value" | "defaultValue" | "onChange" | "children"> {
  options: readonly ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  clearable?: boolean;
  emptyMessage?: string;
  listLabel?: string;
  toggleLabel?: string;
  clearLabel?: string;
  invalidSelectionMessage?: string;
  query?: string;
  onQueryChange?: (query: string) => void;
  /** Manual results require a controlled query and a matching optionsQuery. */
  filtering?: "local" | "manual";
  optionsQuery?: string;
  /** Retain the selected record's presentation while remote results change. */
  selectedOptions?: readonly ComboboxOption[];
  loadState?: "ready" | "loading" | "error";
  loadingMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
}
export interface AutocompleteProps extends Omit<ComboboxProps, "query" | "onQueryChange" | "selectedOptions" | "value" | "defaultValue" | "onValueChange"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onOptionSelect?: (option: ComboboxOption) => void;
}
/** A free text field with suggestions; FormData contains text rather than an option ID. @since 0.2.11 */
export const Autocomplete = /* @__PURE__ */ forwardRef<HTMLInputElement, AutocompleteProps>(function Autocomplete(
  {value, defaultValue = "", onValueChange, onOptionSelect, ...props}, ref,
) {
  return <SearchSelection {...props} ref={ref} freeText textValue={value} initialText={defaultValue} onTextChange={onValueChange} onOptionSelect={onOptionSelect} initialValues={[]} />;
});
/** @since 0.2.5 */
export const Combobox = /* @__PURE__ */ forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  { value, defaultValue = "", onValueChange, clearable = false, emptyMessage = "No results found.", listLabel = "Options", toggleLabel = "Show options", clearLabel = "Clear selection", invalidSelectionMessage = "Select an option.", controlSize = "md", ...props }, ref,
) {
  return <SearchSelection {...props} ref={ref} multiple={false} selectedValues={value === undefined ? undefined : value ? [value] : []} initialValues={defaultValue ? [defaultValue] : []} onSelectionChange={next => onValueChange?.(next[0] ?? "")} clearable={clearable} emptyMessage={emptyMessage} listLabel={listLabel} toggleLabel={toggleLabel} clearLabel={clearLabel} invalidSelectionMessage={invalidSelectionMessage} controlSize={controlSize} />;
});

export interface ModelPickerOption {
  /** The stable host identifier submitted by the field. */
  id: string;
  label: string;
  provider: string;
  /** The identifier used by the inference provider, when different from id. */
  modelId?: string;
  description?: string;
  keywords?: readonly string[];
  /** The model remains visible and cannot be newly selected. */
  unavailableReason?: string;
}

export interface ModelPickerProps extends Omit<ComboboxProps, "options" | "selectedOptions"> {
  models: readonly ModelPickerOption[];
  /** Descriptors of selected models that may be absent from remote results. */
  selectedModels?: readonly ModelPickerOption[];
}

/** Search and choose an inference model from the host's available providers. @since 0.2.14 */
export const ModelPicker = /* @__PURE__ */ forwardRef<HTMLInputElement, ModelPickerProps>(function ModelPicker(
  {models, selectedModels, listLabel = "Models", toggleLabel = "Show models", emptyMessage = "No models found.", ...props}, ref,
) {
  const [options, selectedOptions] = useMemo(() => {
    const toOption = (model: ModelPickerOption): ComboboxOption => {
      const {id,label,provider,modelId,description,keywords,unavailableReason} = model;
      if (!id.trim() || !provider.trim()) throw new Error("Flood ModelPicker requires named providers and model IDs");
      return {
        value:id,
        label,
        group:provider,
        selectedLabel:`${label} · ${provider}`,
        description:unavailableReason || description || (modelId === label ? undefined : modelId),
        disabled:Boolean(unavailableReason),
        keywords:[id,provider,...(modelId ? [modelId] : []),...(keywords ?? [])],
      };
    };
    const byProvider = new Map<string, ComboboxOption[]>();
    for (const model of models) {
      const group = byProvider.get(model.provider) ?? [];
      group.push(toOption(model));
      byProvider.set(model.provider,group);
    }
    return [[...byProvider.values()].flat(), selectedModels?.map(toOption)] as const;
  }, [models,selectedModels]);
  return <Combobox {...props} ref={ref} options={options} selectedOptions={selectedOptions}
    listLabel={listLabel} toggleLabel={toggleLabel} emptyMessage={emptyMessage}/>;
});

export interface TemplatePickerField {
  id: string;
  label: string;
  value: ReactNode;
  /** The host detected that this field already contains a value that would be replaced. */
  replaces?: boolean;
}

export interface TemplatePickerOption {
  id: string;
  label: string;
  scope?: string;
  description?: string;
  fields?: readonly TemplatePickerField[];
  unavailableReason?: string;
}

export interface TemplatePickerProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  templates: readonly TemplatePickerOption[];
  value: string;
  onValueChange: (id: string) => void;
  onApply: (id: string) => void;
  pending?: boolean;
  error?: string;
  labels?: {
    template?: string;
    placeholder?: string;
    options?: string;
    openOptions?: string;
    empty?: string;
    apply?: string;
    replace?: string;
    replacement?: (fields: readonly string[]) => string;
  };
}

/** Preview a template's field values before applying it to the host draft. @since 0.2.14 */
export const TemplatePicker = /* @__PURE__ */ forwardRef<HTMLDivElement, TemplatePickerProps>(function TemplatePicker(
  {templates,value,onValueChange,onApply,pending = false,error,labels,lang,...props}, ref,
) {
  const selected = templates.find(template => template.id === value);
  const fieldChanges = selected?.fields ?? [];
  const overwritten = fieldChanges.filter(field => field.replaces).map(field => field.label);
  const canApply = Boolean(selected && !selected.unavailableReason && !pending);
  return <Stack {...props} ref={ref} lang={lang} gap="4" aria-busy={pending || undefined}>
    <Field label={labels?.template ?? "Template"} hint={selected?.unavailableReason ?? selected?.description}>
      {field => <Combobox {...field} value={value} onValueChange={onValueChange} disabled={pending}
        placeholder={labels?.placeholder ?? "Find a template"}
        listLabel={labels?.options ?? "Templates"} toggleLabel={labels?.openOptions ?? "Show templates"}
        emptyMessage={labels?.empty ?? "No templates found."}
        options={templates.map(({id,label,scope,description,unavailableReason}) => ({
          value:id,label,group:scope,keywords:scope ? [scope] : undefined,
          selectedLabel:scope ? `${label} · ${scope}` : undefined,
          description:unavailableReason ?? description,disabled:Boolean(unavailableReason),
        }))} />}
    </Field>
    {fieldChanges.length > 0 && <DescriptionList layout="columns" density="compact"
      items={fieldChanges.map(({id,label,value}) => ({id,term:label,description:value}))} />}
    {overwritten.length > 0 && <Alert appearance="inline" tone="warning">
      {labels?.replacement?.(overwritten) ??
        `Replaces existing values in ${new Intl.ListFormat(lang ?? "en").format(overwritten)}.`}
    </Alert>}
    {error && <Text as="p" size="compact" tone="error" role="alert">{error}</Text>}
    <FormActions primary={<Button size="sm" type="button" disabled={!selected || Boolean(selected.unavailableReason)}
      loading={pending ? "retain-focus" : false} onClick={() => { if (canApply && selected) onApply(selected.id); }}>
      {overwritten.length ? labels?.replace ?? "Replace fields" : labels?.apply ?? "Apply template"}
    </Button>} />
  </Stack>;
});

export interface VariableReferenceOption {
  /** Stable ID submitted by the control. It must not contain a resolved value. */
  id: string;
  source: string;
  key: string;
  description?: string;
  disabled?: boolean;
}

export interface VariableReferencePickerProps extends Omit<ComboboxProps, "options" | "selectedOptions"> {
  references: readonly VariableReferenceOption[];
  selectedReferences?: readonly VariableReferenceOption[];
  formatSelectedLabel?: (reference: VariableReferenceOption) => string;
}

/** Choose one named reference without requesting or exposing its resolved value. @since 0.2.14 */
export const VariableReferencePicker = /* @__PURE__ */ forwardRef<HTMLInputElement, VariableReferencePickerProps>(function VariableReferencePicker(
  {references, selectedReferences, formatSelectedLabel, listLabel = "Variable references", toggleLabel = "Show references",
    emptyMessage = "No matching references.", invalidSelectionMessage = "Choose a reference.", ...props}, ref,
) {
  function optionsFor(items: readonly VariableReferenceOption[]): ComboboxOption[] {
    const groups = new Map<string, ComboboxOption[]>();
    for (const reference of items) {
      const {id, source, key, description, disabled} = reference;
      if (!id.trim() || !source.trim() || !key.trim()) {
        throw new Error("Flood VariableReferencePicker requires a nonempty ID, source and key");
      }
      if (!groups.has(source)) groups.set(source, []);
      groups.get(source)!.push({value:id, label:key, group:source, description, disabled,
        selectedLabel:formatSelectedLabel?.(reference) ?? `${source} / ${key}`,
        keywords:[source, `${source}.${key}`, `${source} ${key}`]});
    }
    return [...groups.values()].flat();
  }
  return <Combobox {...props} ref={ref} options={optionsFor(references)}
    selectedOptions={selectedReferences && optionsFor(selectedReferences)} listLabel={listLabel}
    toggleLabel={toggleLabel} emptyMessage={emptyMessage} invalidSelectionMessage={invalidSelectionMessage} />;
});

export interface MultiSelectProps extends Omit<ComboboxProps, "value" | "defaultValue" | "onValueChange"> {
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  removeItemLabel?: string;
  /** Show at most this many tags before the user expands the selection. */
  maxVisibleTags?: number;
  moreTagsLabel?: (hiddenCount: number) => string;
  fewerTagsLabel?: string;
}
/** @since 0.2.5 */
export const MultiSelect = /* @__PURE__ */ forwardRef<HTMLInputElement, MultiSelectProps>(function MultiSelect(
  { value, defaultValue = [], onValueChange, removeItemLabel = "Remove", clearable = false, emptyMessage = "No results found.", listLabel = "Options", toggleLabel = "Show options", clearLabel = "Clear selection", invalidSelectionMessage = "Select at least one option.", controlSize = "md", ...props }, ref,
) {
  return <SearchSelection {...props} ref={ref} multiple selectedValues={value} initialValues={defaultValue} onSelectionChange={onValueChange} removeItemLabel={removeItemLabel} clearable={clearable} emptyMessage={emptyMessage} listLabel={listLabel} toggleLabel={toggleLabel} clearLabel={clearLabel} invalidSelectionMessage={invalidSelectionMessage} controlSize={controlSize} />;
});

export interface ContentLanguageOption {
  /** Locale tag used as the field value. The supplied spelling is preserved. */
  code: string;
  disabled?: boolean;
}

export interface ContentLanguagePickerProps extends Omit<MultiSelectProps,
  "options" | "selectedOptions" | "filtering" | "optionsQuery" | "loadState" |
  "loadingMessage" | "errorMessage" | "onRetry" | "retryLabel"
> {
  languages: readonly ContentLanguageOption[];
  /** Language used to display option names. */
  locale?: string;
}

/** Choose one or more declared languages for a piece of content. @since 0.2.14 */
export const ContentLanguagePicker = /* @__PURE__ */ forwardRef<HTMLInputElement, ContentLanguagePickerProps>(function ContentLanguagePicker(
  {languages, locale, lang, listLabel = "Languages", toggleLabel = "Show languages", emptyMessage = "No languages found.", ...props}, ref,
) {
  const displayLocale = locale ?? lang ?? "en";
  const options = useMemo(() => {
    const displayNames = new Intl.DisplayNames(displayLocale, {type:"language", languageDisplay:"standard"});
    const seen = new Set<string>();
    return languages.map(({code,disabled}) => {
      const [canonical] = Intl.getCanonicalLocales(code);
      if (!canonical || seen.has(canonical)) throw new RangeError("Flood ContentLanguagePicker requires unique language tags");
      seen.add(canonical);
      const label = displayNames.of(canonical) ?? code;
      const ownName = new Intl.DisplayNames(canonical, {type:"language",languageDisplay:"standard",fallback:"none"}).of(canonical);
      return {
        value:code,
        label,
        description:ownName && ownName !== label ? ownName : undefined,
        keywords:ownName ? [code, canonical, ownName] : [code, canonical],
        disabled,
      };
    });
  }, [languages, displayLocale]);
  return <MultiSelect {...props} ref={ref} lang={lang} options={options}
    listLabel={listLabel} toggleLabel={toggleLabel} emptyMessage={emptyMessage} />;
});

export interface TimeZoneOption {
  /** Named IANA time zone. Its supplied identifier is preserved when selected. */
  value: string;
  label?: string;
  aliases?: readonly string[];
  group?: string;
  disabled?: boolean;
}

export interface TimeZoneSelectProps extends Omit<ComboboxProps, "options" | "selectedOptions"> {
  options: readonly TimeZoneOption[];
  selectedOptions?: readonly TimeZoneOption[];
  /** An explicit ISO instant to use when displaying each zone's offset. */
  referenceTime: string;
  locale?: string;
}

/** Search named zones and show their offset at an explicit instant. @since 0.2.14 */
export const TimeZoneSelect = /* @__PURE__ */ forwardRef<HTMLInputElement, TimeZoneSelectProps>(function TimeZoneSelect(props, ref) {
  return <NamedTimeZoneSelect {...props} ref={ref}/>;
});

export type MeetingAvailabilityState = "available" | "busy" | "outside-hours" | "unknown";

export interface MeetingAttendeeAvailability {
  id: string;
  name: string;
  /** IANA zone name resolved by the host. Omit when it is unknown. */
  timeZone?: string;
  availability: MeetingAvailabilityState;
  /** A visible qualification, such as the attendee being optional. */
  detail?: string;
}

export interface MeetingAvailabilityProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "slot"> {
  label: string;
  slot: {start: string; end: string};
  attendees: readonly MeetingAttendeeAvailability[];
  locale?: string;
  labels?: Partial<Record<MeetingAvailabilityState | "empty", string>>;
}

const meetingAvailabilityStates = {
  available: {label:"Available",tone:"success"},
  busy: {label:"Busy",tone:"error"},
  "outside-hours": {label:"Outside work hours",tone:"warning"},
  unknown: {label:"Not shared",tone:"neutral"},
} as const;

/** Review a proposed slot in each attendee's local time. @since 0.2.14 */
export const MeetingAvailability = /* @__PURE__ */ forwardRef<HTMLDivElement, MeetingAvailabilityProps>(function MeetingAvailability(
  {label, slot, attendees, locale, labels, ...props}, ref,
) {
  const start = parseInstant(slot.start,"MeetingAvailability");
  const end = parseInstant(slot.end,"MeetingAvailability");
  if (start >= end) throw new RangeError("Flood MeetingAvailability requires an end after the start");
  const formattedByZone = new Map<string,string>();
  const localTime = (timeZone: string) => {
    const cached = formattedByZone.get(timeZone);
    if (cached !== undefined) return cached;
    const formatted = new Intl.DateTimeFormat(locale ?? props.lang ?? "en-US", {
      timeZone, month:"short", day:"numeric", hour:"numeric", minute:"2-digit", timeZoneName:"short",
    }).formatRange(start,end);
    formattedByZone.set(timeZone,formatted);
    return formatted;
  };

  return <Stack {...props} ref={ref}>
    {attendees.length ? <DataList aria-label={label} density="compact" dividers={false}>
      {attendees.map(attendee => {
        const state = meetingAvailabilityStates[attendee.availability];
        return <DataListItem key={attendee.id} layout="content" className="flood-meeting-availability__row"
          title={<Inline gap="2" align="baseline"><Text size="label" dir="auto">{attendee.name}</Text>
            {attendee.detail && <Text size="helper" tone="subtle">{attendee.detail}</Text>}</Inline>}
          description={attendee.timeZone && <Text size="helper" tone="subtle">{localTime(attendee.timeZone)}</Text>}
          metadata={<StatusIndicator label={labels?.[attendee.availability] ?? state.label} size="sm" tone={state.tone} />} />;
      })}
    </DataList> : <Text size="compact" tone="subtle">{labels?.empty ?? "No attendees."}</Text>}
  </Stack>;
});

export type RecurrenceWeekday = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export interface RecurrenceValue {
  frequency: "day" | "week";
  interval: number | null;
  weekdays: readonly RecurrenceWeekday[];
  ending: "never" | "date" | "count";
  untilDate: string;
  occurrences: number | null;
}

export interface RecurrenceEditorProps extends Omit<FieldsetProps, "children" | "legend" | "onChange" | "name" | "layout"> {
  label: string;
  value: RecurrenceValue;
  onValueChange: (value: RecurrenceValue) => void;
  names?: Partial<Record<keyof RecurrenceValue, string>>;
  controlSize?: NumberInputProps["controlSize"];
  weekStartsOn?: CalendarProps["weekStartsOn"];
  minUntilDate?: string;
  datePickerOptions?: Pick<DatePickerProps, "order" | "previousMonthLabel" | "nextMonthLabel" | "viewLabels" | "openCalendarLabel" | "calendarLabel">;
  /** Receives a complete valid rule. Return empty text to omit the summary. */
  formatSummary?: (value: RecurrenceValue) => string;
  labels?: {
    interval?: string;
    frequency?: string;
    day?: string;
    week?: string;
    weekdays?: string;
    emptyWeekdays?: string;
    ending?: string;
    never?: string;
    onDate?: string;
    afterCount?: string;
    untilDate?: string;
    occurrences?: string;
  };
}

/** Edit a daily or weekly recurrence with an optional end date or count. @since 0.2.14 */
export const RecurrenceEditor = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, RecurrenceEditorProps>(function RecurrenceEditor(props, ref) {
  return <RepeatSchedule {...props} ref={ref}/>;
});

export interface QuietHoursValue {
  enabled: boolean;
  /** Days on which the quiet window begins. */
  weekdays: readonly RecurrenceWeekday[];
  /** Local clock values in HH:mm form, or an empty draft. */
  start: string;
  end: string;
}

export interface QuietHoursEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  label?: string;
  /** The visible name of the host's scheduling time zone. */
  timeZoneLabel: string;
  value: QuietHoursValue;
  onValueChange: (value: QuietHoursValue) => void;
  disabled?: boolean;
  weekStartsOn?: CalendarProps["weekStartsOn"];
  labels?: {
    days?: string;
    start?: string;
    end?: string;
    overnight?: string;
    emptyDays?: string;
    equalTimes?: string;
  };
}

const quietHoursDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** Edit a weekly notification pause in the host's time zone. @since 0.2.14 */
export const QuietHoursEditor = /* @__PURE__ */ forwardRef<HTMLDivElement, QuietHoursEditorProps>(function QuietHoursEditor(
  {label = "Quiet hours", timeZoneLabel, value, onValueChange, disabled = false, weekStartsOn = 1,
    lang = "en", labels, className, ...props}, ref,
) {
  const dayFormat = new Intl.DateTimeFormat(lang, { weekday:"short", timeZone:"UTC" });
  const choices = quietHoursDays.map((_, index) => {
    const day = (weekStartsOn + index) % quietHoursDays.length;
    return {value:quietHoursDays[day], label:dayFormat.format(new Date(Date.UTC(2024, 0, 7 + day)))};
  });
  const inactive = disabled || !value.enabled;
  const validTimes = parseTime(value.start,"minute") && parseTime(value.end,"minute");
  const equals = Boolean(validTimes && value.start === value.end);
  const overnight = Boolean(validTimes && value.end < value.start);
  const update = (patch: Partial<QuietHoursValue>) => onValueChange({...value,...patch});

  return <Stack {...props} ref={ref} lang={lang} gap="4" className={classes("flood-quiet-hours-editor", className)}>
    <Switch layout="row" label={label} description={timeZoneLabel} checked={value.enabled} disabled={disabled}
      onChange={event => update({enabled:event.currentTarget.checked})} />
    <CheckboxGroup legend={labels?.days ?? "Starts on"} name="" orientation="horizontal" className="flood-quiet-hours-editor__weekdays"
      options={choices} value={value.weekdays} disabled={inactive}
      error={!inactive && !value.weekdays.length ? labels?.emptyDays ?? "Choose at least one day." : undefined}
      onValueChange={weekdays => update({weekdays:weekdays as RecurrenceWeekday[]})} />
    <Stack gap="1">
      <Grid gap="3" minItemWidth="8rem" maxColumns={2}>
        <TimePicker label={labels?.start ?? "From"} value={value.start} disabled={inactive} controlSize="sm"
          onValueChange={start => update({start})} />
        <TimePicker label={labels?.end ?? "Until"} value={value.end} disabled={inactive} controlSize="sm"
          onValueChange={end => update({end})} />
      </Grid>
      {!inactive && equals && <Text as="p" size="helper" tone="error" role="alert">
        {labels?.equalTimes ?? "Choose a different end time."}
      </Text>}
      {!inactive && overnight && <Text as="p" size="helper" tone="subtle">
        {labels?.overnight ?? "Ends the following day."}
      </Text>}
    </Stack>
  </Stack>;
});

export interface NumberInputProps extends Omit<InputProps, "type" | "value" | "defaultValue" | "onChange" | "min" | "max" | "step" | "children"> {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  decreaseLabel?: string;
  increaseLabel?: string;
  /** Hide the step buttons while keeping native numeric editing and arrow-key stepping. */
  appearance?: "stepper" | "plain";
}
/** @since 0.2.5 */
export const NumberInput = /* @__PURE__ */ forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { defaultValue = 0, step = 1, controlSize = "md", decreaseLabel = "Decrease value", increaseLabel = "Increase value", ...props }, ref,
) {
  return <NumericStepper {...props} ref={ref} defaultValue={defaultValue} step={step} controlSize={controlSize} decreaseLabel={decreaseLabel} increaseLabel={increaseLabel} inputComponent={InputGroup} buttonComponent={IconButton} />;
});

export interface MoneyFieldProps extends Omit<InputProps, "type" | "value" | "defaultValue" | "onChange" | "children" | "pattern" | "min" | "max" | "step"> {
  currency: string;
  locale?: string;
  /** Canonical decimal amount without a currency symbol or grouping separators. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  min?: string;
  max?: string;
  invalidMessage?: string;
}
export interface UnitNumberValue {
  amount: number | null;
  unit: string;
}
export interface UnitNumberOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export interface UnitNumberFieldProps extends Omit<FieldsetProps, "children" | "legend" | "onChange" | "name" | "layout"> {
  label: string;
  units: readonly UnitNumberOption[];
  value: UnitNumberValue;
  onValueChange?: (value: UnitNumberValue) => void;
  amountLabel?: string;
  unitLabel?: string;
  amountName?: string;
  unitName?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  readOnly?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
}
/** Keep a numerical quantity and its measurement unit together. @since 0.2.14 */
export const UnitNumberField = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, UnitNumberFieldProps>(function UnitNumberField(props, ref) {
  return <UnitNumberEditor {...props} ref={ref} />;
});
/** Locale-aware amounts with exact decimal submission. @since 0.2.14 */
export const MoneyField = /* @__PURE__ */ forwardRef<HTMLInputElement, MoneyFieldProps>(function MoneyField(props, ref) {
  return <MoneyEditor {...props} ref={ref} />;
});

export interface SpendLimitDraft {
  /** Exact decimal amount, or null to turn the alert off. */
  alert: string | null;
  /** Exact decimal amount, or null when no hard limit is set. */
  cap: string | null;
}

export interface SpendLimitFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "children" | "onSubmit" | "noValidate"> {
  currency: string;
  locale?: string;
  value: SpendLimitDraft;
  onValueChange: (value: SpendLimitDraft) => void;
  onSubmit: (value: SpendLimitDraft) => void;
  /** State which resources are affected and what the product does at the hard limit. */
  capEffect: string;
  /** The effect of crossing the notification threshold, including who is notified when relevant. */
  alertEffect?: string;
  pending?: boolean;
  disabled?: boolean;
  error?: string;
  labels?: {alert?: string; cap?: string; submit?: string; unset?: string; orderError?: string};
}

/** Edit separate notification and enforcement thresholds for a known scope. @since 0.2.14 */
export const SpendLimitForm = /* @__PURE__ */ forwardRef<HTMLFormElement, SpendLimitFormProps>(function SpendLimitForm(
  {currency, locale, value, onValueChange, onSubmit, capEffect, alertEffect, pending = false, disabled = false, error, labels, ...props}, ref,
) {
  const [showOrderError, setShowOrderError] = useState(false);
  const alertInput = useRef<HTMLInputElement>(null);
  const inputLocale = locale ?? props.lang ?? "en-US";
  const money = useMemo(() => createMoneyFormat(currency, inputLocale), [currency, inputLocale]);
  const alert = money.readValue(value.alert);
  const cap = money.readValue(value.cap);
  const invalidOrder = alert !== null && cap !== null && alert.amount >= cap.amount;
  const submitLabel = labels?.submit ?? "Save limits";
  const unset = labels?.unset ?? "Not set";

  return <form {...props} ref={ref} aria-label={props["aria-label"] ?? submitLabel} aria-busy={pending || undefined}
    onSubmit={event => {
      event.preventDefault();
      if (disabled || pending) return;
      if (invalidOrder) {
        setShowOrderError(true);
        alertInput.current?.focus();
        return;
      }
      setShowOrderError(false);
      onSubmit({alert:alert?.value ?? null, cap:cap?.value ?? null});
    }}>
    <Stack gap="4">
      <Field label={labels?.alert ?? "Spending alert"}
        hint={alertEffect ?? "Sends a notification at this amount."}
        error={showOrderError && invalidOrder ? labels?.orderError ?? "Set the spending alert below the hard limit." : undefined}>
        {field => <MoneyField {...field} ref={alertInput} currency={currency} locale={inputLocale} min="0"
          placeholder={unset} value={value.alert} disabled={disabled} readOnly={pending}
          onValueChange={next => onValueChange({...value,alert:next})} />}
      </Field>
      <Field label={labels?.cap ?? "Hard limit"} hint={capEffect}>
        {field => <MoneyField {...field} currency={currency} locale={inputLocale} min="0"
          placeholder={unset} value={value.cap} disabled={disabled} readOnly={pending}
          onValueChange={next => onValueChange({...value,cap:next})} />}
      </Field>
      {error && <Text as="p" size="compact" tone="error" role="alert">{error}</Text>}
      <FormActions primary={<Button type="submit" disabled={disabled} loading={pending ? "retain-focus" : false}>{submitLabel}</Button>} />
    </Stack>
  </form>;
});

export interface KeyValueEntry {
  id: string;
  key: string;
  value: string;
  enabled?: boolean;
}
export type JsonValue = string | number | boolean | null | readonly JsonValue[] | { readonly [key: string]: JsonValue };
export interface JsonInspectorLabels {
  search?: string;
  clearSearch?: string;
  noResults?: string;
  copy?: string;
  copied?: string;
  copyError?: string;
  path?: string;
  showValue?: string;
}
export interface JsonInspectorProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  label: string;
  value: JsonValue;
  rootLabel?: string;
  searchable?: boolean;
  defaultExpandedDepth?: number;
  labels?: JsonInspectorLabels;
  onSelectionChange?: (pointer: string, value: JsonValue) => void;
}
/** Inspect structured JSON by path and copy individual values. @since 0.2.14 */
export const JsonInspector = /* @__PURE__ */ forwardRef<HTMLDivElement, JsonInspectorProps>(function JsonInspector({
  rootLabel = "Root", searchable = true, defaultExpandedDepth = 1, ...props
}, ref) {
  return <StructuredJsonInspector {...props} ref={ref} rootLabel={rootLabel} searchable={searchable} defaultExpandedDepth={defaultExpandedDepth} />;
});
export type CodeDiffLine = { id: string; text: string } & (
  | { kind: "context"; oldLine: number; newLine: number }
  | { kind: "added"; oldLine?: never; newLine: number }
  | { kind: "removed"; oldLine: number; newLine?: never }
);
export interface CodeDiffHunk {
  id: string;
  label?: string;
  lines: readonly CodeDiffLine[];
}
export interface CodeDiffLabels {
  before?: string;
  after?: string;
  code?: string;
  added?: string;
  removed?: string;
  context?: string;
  empty?: string;
  expand?: (count: number) => string;
  collapse?: (count: number) => string;
}
export interface CodeDiffProps extends Omit<TableProps, "children" | "caption" | "striped" | "cellVerticalAlign"> {
  label: string;
  hunks: readonly CodeDiffHunk[];
  layout?: "unified" | "split";
  contextLines?: number;
  wrap?: boolean;
  labels?: CodeDiffLabels;
  renderLineAction?: (line: CodeDiffLine, side: "before" | "after") => ReactNode;
}
/** A prepared source diff with shared line numbering and context folding. @since 0.2.14 */
export const CodeDiff = /* @__PURE__ */ forwardRef<HTMLTableElement, CodeDiffProps>(function CodeDiff({
  layout = "unified", contextLines = 3, wrap = false, hideCaption = true, density = "compact", ...props
}, ref) {
  return <SourceCodeDiff {...props} ref={ref} layout={layout} contextLines={contextLines} wrap={wrap} hideCaption={hideCaption} density={density} />;
});

export interface DiffStatProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Number of added source lines. */
  additions: number;
  /** Number of removed source lines. */
  deletions: number;
  /** Show the relative share of additions and deletions. */
  showDistribution?: boolean;
  formatValue?: (count: number) => string;
  formatLabel?: (additions: number, deletions: number) => string;
}

/** A compact source-change summary for a file or a patch. */
export const DiffStat = /* @__PURE__ */ forwardRef<HTMLSpanElement, DiffStatProps>(function DiffStat({
  additions, deletions, showDistribution = false, formatValue = String,
  formatLabel = (added, removed) =>
    `${added} ${added === 1 ? "line" : "lines"} added, ${removed} ${removed === 1 ? "line" : "lines"} removed`,
  className, ...props
}, ref) {
  const changed = additions > 0 || deletions > 0;
  return <span {...props} ref={ref} className={classes("flood-diff-stat", className)}>
    <VisuallyHidden>{formatLabel(additions, deletions)}</VisuallyHidden>
    <Text size="helper" tone={additions ? "success" : "subtle"} aria-hidden="true">+{formatValue(additions)}</Text>
    <Text size="helper" tone={deletions ? "error" : "subtle"} aria-hidden="true">−{formatValue(deletions)}</Text>
    {showDistribution && <span aria-hidden="true" className="flood-diff-stat__distribution">
      {changed && <>
        {additions > 0 && <span data-kind="added" style={{ flexGrow: additions }} />}
        {deletions > 0 && <span data-kind="removed" style={{ flexGrow: deletions }} />}
      </>}
    </span>}
  </span>;
});

export interface TextSuggestionItem {
  id: string;
  label: string;
  insertText: string;
  description?: string;
  disabled?: boolean;
}
export interface TextSuggestionGroup {
  trigger: "@" | "/";
  label: string;
  items: readonly TextSuggestionItem[];
}
export interface TextSuggestionSelection {
  trigger: "@" | "/";
  item: TextSuggestionItem;
  start: number;
  end: number;
}
export interface SuggestionTextareaProps extends Omit<TextareaProps, "value" | "defaultValue" | "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  suggestions: readonly TextSuggestionGroup[];
  onSuggestionSelect?: (selection: TextSuggestionSelection) => void;
}
/** Offers mention and command suggestions at the text caret. @since 0.2.14 */
export const SuggestionTextarea = /* @__PURE__ */ forwardRef<HTMLTextAreaElement, SuggestionTextareaProps>(function SuggestionTextarea(props, ref) {
  return <CaretSuggestionEditor {...props} ref={ref} />;
});

export interface QueryToken {
  id: string;
  label: string;
  error?: string;
}
export interface QuerySuggestionRange {
  label: string;
  start: number;
  end: number;
  items: readonly TextSuggestionItem[];
}
export interface QueryInputProps extends Omit<TextareaProps,
  "value" | "defaultValue" | "onChange" | "rows" | "cols" | "wrap" | "autoGrow" | "maxRows"> {
  label: string;
  hideLabel?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  tokens?: readonly QueryToken[];
  onTokenRemove?: (id: string) => void;
  formatRemoveLabel?: (token: QueryToken) => string;
  /** Host grammar supplies candidates and the affected UTF-16 range of the draft. */
  resolveSuggestions?: (context: { value: string; caret: number }) => QuerySuggestionRange | undefined;
  error?: string;
  onSubmitQuery?: () => void;
}
/** An inline query editor with controlled tokens and host-resolved completions. @since 0.2.14 */
export const QueryInput = /* @__PURE__ */ forwardRef<HTMLTextAreaElement, QueryInputProps>(function QueryInput(props, ref) {
  return <StructuredQueryInput {...props} ref={ref} />;
});
export interface KeyValueErrors {
  key?: ReactNode;
  value?: ReactNode;
}
export interface KeyValueRowLabels {
  key?: string;
  value?: string;
  enabled?: string;
  remove?: string;
}
export interface KeyValueRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  value: KeyValueEntry;
  onValueChange: (value: KeyValueEntry) => void;
  onRemove?: () => void;
  errors?: KeyValueErrors;
  labels?: KeyValueRowLabels;
  keyOptions?: readonly ComboboxOption[];
  controlSize?: "sm" | "md" | "lg" | "xl";
  valueMode?: "single-line" | "multiline";
  showEnabled?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
  form?: string;
}
export interface KeyValueEditorLabels extends Omit<KeyValueRowLabels, "remove"> {
  add?: string;
  row?: (entry: KeyValueEntry, index: number) => string;
  remove?: (entry: KeyValueEntry, index: number) => string;
}
export interface KeyValueEditorProps extends Omit<FieldsetProps, "children" | "legend" | "onChange" | "value"> {
  label: string;
  value: readonly KeyValueEntry[];
  onValueChange: (value: KeyValueEntry[]) => void;
  errorsById?: Readonly<Partial<Record<string, KeyValueErrors>>>;
  labels?: KeyValueEditorLabels;
  keyOptions?: readonly ComboboxOption[];
  controlSize?: "sm" | "md" | "lg" | "xl";
  valueMode?: "single-line" | "multiline";
  showEnabled?: boolean;
  readOnly?: boolean;
  maxRows?: number;
}
/** A compact, independently editable pair. @since 0.2.14 */
export const KeyValueRow = /* @__PURE__ */ forwardRef<HTMLDivElement, KeyValueRowProps>(function KeyValueRow({
  controlSize = "sm", valueMode = "single-line", showEnabled = false, disabled = false, readOnly = false, ...props
}, ref) {
  return <PairRow {...props} ref={ref} controlSize={controlSize} valueMode={valueMode} showEnabled={showEnabled} disabled={disabled} readOnly={readOnly} />;
});
/** A collection of editable pairs with stable row identity and focus. @since 0.2.14 */
export const KeyValueEditor = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, KeyValueEditorProps>(function KeyValueEditor({
  controlSize = "sm", valueMode = "single-line", showEnabled = false, disabled = false, readOnly = false, ...props
}, ref) {
  return <PairEditor {...props} ref={ref} controlSize={controlSize} valueMode={valueMode} showEnabled={showEnabled} disabled={disabled} readOnly={readOnly} />;
});

export interface NumberRangeEndpoint extends Pick<NumberInputProps, "name" | "value" | "defaultValue" | "onValueChange"> {
  label: string;
}

export interface NumberRangeFieldProps extends Omit<FieldsetProps, "legend" | "children" | "layout" | "name"> {
  label: string;
  start: NumberRangeEndpoint;
  end: NumberRangeEndpoint;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  readOnly?: boolean;
  controlSize?: NumberInputProps["controlSize"];
}

/** Two numeric inputs with a shared legend and independent native form values. */
export const NumberRangeField = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, NumberRangeFieldProps>(function NumberRangeField(
  { label, start, end, min, max, step, required, readOnly, controlSize, id: explicitId,
    form, error, hint, message, status, "aria-describedby": describedBy, "aria-invalid": ariaInvalid, ...props }, ref,
) {
  const generatedId = useId();
  const id = explicitId ?? `flood-${generatedId}`;
  const hasError = hasFieldContent(error);
  const resolvedStatus = resolveFieldStatus(status, hasError, ariaInvalid);
  const description = mergeDescriptions(describedBy, hasFieldContent(hint) && `${id}-hint`,
    hasError ? `${id}-error` : hasFieldContent(message) && `${id}-message`);
  return <Fieldset {...props} ref={ref} id={id} form={form} legend={label} hint={hint} error={error} message={message}
    status={resolvedStatus} aria-describedby={describedBy} aria-invalid={ariaInvalid}>
    <Grid minItemWidth="8rem" gap="3">
      {[start, end].map(({ label: endpointLabel, defaultValue = null, ...endpoint }, index) =>
        <Field key={index} label={endpointLabel} required={required} describedBy={description} status={resolvedStatus}>
          {field => <NumberInput {...field} {...endpoint} defaultValue={defaultValue} min={min} max={max}
            step={step} form={form} readOnly={readOnly} controlSize={controlSize} appearance="plain" />}
        </Field>)}
    </Grid>
  </Fieldset>;
});

export interface SliderProps extends Omit<FieldsetProps, "legend" | "children" | "defaultValue" | "onChange"> {
  label: string;
  value?: readonly number[];
  defaultValue?: readonly number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  thumbLabels?: readonly string[];
  showValue?: boolean;
  /** Format each thumb's readout and accessible value, including any unit. */
  formatValue?: (value: number) => string;
  /** Place the readout beside a visible label. With hideLabel it stays above the rail. */
  valuePlacement?: "below-label" | "inline";
  readOnly?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
}
/** @since 0.2.5 */
export const Slider = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, SliderProps>(function Slider(
  { defaultValue = [50], min = 0, max = 100, step = 1, showValue = true, readOnly = false, controlSize = "md", ...props }, ref,
) {
  return <RangeControl {...props} ref={ref} defaultValue={defaultValue} min={min} max={max} step={step} showValue={showValue} readOnly={readOnly} controlSize={controlSize} fieldsetComponent={Fieldset} />;
});

export interface MediaSeekBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  /** Current playhead position in seconds. */
  currentTime: number;
  /** Media duration in seconds. Missing or non-finite durations disable seeking. */
  duration?: number;
  /** Downloaded intervals in seconds from the start of the recording. */
  buffered?: readonly (readonly [start: number, end: number])[];
  /** Chapter starts in seconds, shown as marks on the rail. */
  chapterStarts?: readonly number[];
  onSeek: (time: number) => void;
  disabled?: boolean;
  formatTime?: (seconds: number) => string;
  /** Localize the accessible announcement of the position and duration. */
  formatValueText?: (time: number, duration: number) => string;
}

/** Seek within a recording using the playback position accepted by the host. */
export const MediaSeekBar = /* @__PURE__ */ forwardRef<HTMLDivElement, MediaSeekBarProps>(function MediaSeekBar(
  { label, currentTime, duration, buffered, chapterStarts, onSeek, disabled, formatTime = mediaTimeLabel,
    formatValueText, className, ...props }, ref,
) {
  const length = duration && Number.isFinite(duration) && duration > 0 ? duration : 0;
  const position = Number.isFinite(currentTime) ? Math.min(Math.max(0, currentTime), length) : 0;
  const ticks = Math.ceil(length * 100);
  const step = ticks && Number.isFinite(ticks) ? length / ticks : 1;
  const markers = chapterStarts && [...new Set(chapterStarts.filter(start => start > 0 && start < length))];
  const segments = buffered?.flatMap(([start, end]) => {
    if (!Number.isFinite(start) || !Number.isFinite(end)) return [];
    const first = Math.max(0, start);
    const last = Math.min(length, end);
    return last > first ? [{start:first, end:last}] : [];
  });
  return <Stack {...props} ref={ref} gap="0" className={classes("flood-media-seek-bar", className)}>
    <RangeControl fieldsetComponent={Fieldset} label={label} hideLabel showValue={false} controlSize="sm" dir="ltr"
      max={length || 1} step={step} value={[position]} disabled={!length || disabled}
      trackSegments={segments} trackMarkers={markers}
      formatValue={time => length ? formatValueText?.(time, length) ?? `${formatTime(time)} / ${formatTime(length)}` : formatTime(0)}
      onKeyDown={event => {
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing ||
            event.currentTarget.matches(":disabled")) return;
        const direction = ["ArrowRight", "ArrowUp"].includes(event.key) ? 1 : ["ArrowLeft", "ArrowDown"].includes(event.key) ? -1 : 0;
        if (!direction) return;
        event.preventDefault();
        const next = Math.max(0, Math.min(length, position + direction));
        if (next !== position) onSeek(next);
      }}
      onValueChange={([time]) => onSeek(time >= length - step / 2 ? length : time)}/>
    <Inline gap="2" dir="ltr" className="flood-media-seek-bar__times" aria-hidden="true">
      <Text as="span" size="compact">{formatTime(position)}</Text>
      <Text as="span" size="compact" tone="subtle">{length ? formatTime(length) : "—"}</Text>
    </Inline>
  </Stack>;
});

export interface MediaTrimRangeProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  labels: { start: string; end: string; length: string };
  /** Source duration in seconds. */
  duration: number;
  /** The start and end of the retained clip, in seconds. */
  value: readonly [start: number, end: number];
  onValueChange: (value: [start: number, end: number]) => void;
  /** The shortest retained clip in seconds. Defaults to 0.1 seconds or the source duration, if shorter. */
  minimumLength?: number;
  /** Evenly spaced peak amplitudes, between 0 and 1, across the complete recording. */
  waveform?: readonly number[];
  disabled?: boolean;
  formatTime?: (seconds: number) => string;
}

function trimTimeLabel(seconds: number) {
  const milliseconds = String(Math.round(seconds * 1000) % 1000).padStart(3, "0");
  return `${mediaTimeLabel(seconds)}.${milliseconds}`;
}

/** Select the contiguous portion of a recording to retain. */
export const MediaTrimRange = /* @__PURE__ */ forwardRef<HTMLDivElement, MediaTrimRangeProps>(function MediaTrimRange(
  { label, labels, duration, value, onValueChange, minimumLength, waveform, disabled, formatTime = trimTimeLabel,
    className, ...props }, ref,
) {
  const maximum = Math.round(duration * 1000);
  const [start, end] = value.map(time => Math.round(time * 1000));
  const gap = minimumLength === undefined ? Math.min(100, maximum) : Math.ceil(minimumLength * 1000);
  if (![maximum, start, end, gap].every(Number.isSafeInteger) ||
      maximum < 1 || gap < 1 || start < 0 || end > maximum || end - start < gap) {
    throw new RangeError("Flood MediaTrimRange requires a valid, bounded clip with at least its minimum length");
  }
  const peaks = waveform?.length ? <span className="flood-media-trim__waveform"
    style={{"--flood-waveform-count":waveform.length} as CSSProperties}>
    {waveform.map((amplitude, index) => <span key={index}
      style={{blockSize:`${Number.isFinite(amplitude) ? Math.max(0, Math.min(1, amplitude)) * 100 : 0}%`}}/>)}
  </span> : undefined;
  const readouts = [[labels.start, start], [labels.end, end], [labels.length, end - start]] as const;
  return <Stack {...props} ref={ref} gap="2" className={classes("flood-media-trim", className)}>
    <RangeControl fieldsetComponent={Fieldset} label={label} hideLabel showValue={false} dir="ltr"
      max={maximum} step={1} minimumGap={gap} keyboardStep={1000} value={[start, end]}
      disabled={disabled} thumbLabels={[labels.start, labels.end]} trackDecoration={peaks}
      formatValue={time => formatTime(time / 1000)} onValueChange={([from, to]) => onValueChange([from / 1000, to / 1000])}/>
    <Grid columns={3} gap="2" className="flood-media-trim__readouts">
      {readouts.map(([name, time], index) =>
        <Stack gap="1" key={index}>
          <Text size="helper" tone="subtle">{name}</Text>
          <Text size="compact"><bdi dir="ltr">{formatTime(time / 1000)}</bdi></Text>
        </Stack>)}
    </Grid>
  </Stack>;
});

export interface RolloutAllocationProps extends Omit<LayoutProps, "children" | "gap"> {
  label: string;
  candidateLabel: string;
  baselineLabel: string;
  /** Percentage of eligible traffic assigned to the candidate, from 0 to 100. */
  value: number;
  onValueChange?: (value: number) => void;
  precision?: 0 | 1 | 2 | 3;
  name?: string;
  form?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

/** Edit a two-variant traffic split while keeping the total at 100 percent. @since 0.2.14 */
export const RolloutAllocation = /* @__PURE__ */ forwardRef<HTMLDivElement, RolloutAllocationProps>(function RolloutAllocation(
  {label, candidateLabel, baselineLabel, value, onValueChange, precision = 0, name, form, disabled,
    readOnly, className, lang, ...props}, ref,
) {
  if (!Number.isInteger(precision) || precision < 0 || precision > 3 ||
      !Number.isFinite(value) || value < 0 || value > 100 || Number(value.toFixed(precision)) !== value) {
    throw new RangeError("Flood RolloutAllocation requires a percentage from 0 to 100 matching its precision");
  }
  if (!candidateLabel.trim() || !baselineLabel.trim()) throw new Error("Flood RolloutAllocation requires labels for both variants");
  const formatter = new Intl.NumberFormat(lang || "en", {style:"percent", maximumFractionDigits:precision});
  const formatPercentage = (amount: number) => formatter.format(amount / 100);
  return <Stack {...props} ref={ref} lang={lang} gap="2" className={classes("flood-rollout-allocation", className)}>
    <Slider label={label} thumbLabels={[candidateLabel]} value={[value]} min={0} max={100} step={10 ** -precision}
      showValue={false} formatValue={formatPercentage} name={name} form={form} disabled={disabled}
      readOnly={readOnly || !onValueChange} onValueChange={([next]) => onValueChange?.(Number(next.toFixed(precision)))} />
    <Grid columns={2} gap="3" className="flood-rollout-allocation__shares">
      <Stack gap="1">
        <Text size="helper" tone="subtle" dir="auto">{candidateLabel}</Text>
        <Text size="label">{formatPercentage(value)}</Text>
      </Stack>
      <Stack gap="1">
        <Text size="helper" tone="subtle" dir="auto">{baselineLabel}</Text>
        <Text size="label">{formatPercentage(100 - value)}</Text>
      </Stack>
    </Grid>
  </Stack>;
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  status?: FieldStatus;
  invalid?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
  /** Grow with the text, using rows as the minimum in supporting browsers. */
  autoGrow?: boolean;
  /** Maximum visible rows while autoGrow is enabled. Defaults to six. */
  maxRows?: number;
}
export const Textarea = /* @__PURE__ */ forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid, status, controlSize = "md", className, autoGrow = false, rows, maxRows = 6, style, ...props }, ref) {
    const minimumRows = rows ?? 2;
    if (autoGrow && (!Number.isSafeInteger(minimumRows) || minimumRows < 1 || !Number.isSafeInteger(maxRows) || maxRows < 1)) {
      throw new RangeError("Flood Textarea autoGrow requires positive integer row bounds");
    }
    return (
      <textarea
        {...props}
        ref={ref}
        rows={autoGrow ? minimumRows : rows}
        data-auto-grow={autoGrow || undefined}
        style={autoGrow ? {
          "--flood-textarea-min-rows": minimumRows,
          "--flood-textarea-max-rows": Math.max(minimumRows, maxRows),
          ...style,
        } as CSSProperties : style}
        data-status={resolveFieldStatus(status, invalid, props["aria-invalid"])}
        aria-invalid={invalid || status === "error" || props["aria-invalid"]}
        className={classes("flood-input", "flood-textarea", `flood-control--${controlSize}`, className)}
      />
    );
  },
);

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  status?: FieldStatus;
  invalid?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
}

export type AccessRequestState =
  | {status:"ready" | "sending"}
  | {status:"requested"; detail?: string}
  | {status:"failed" | "unavailable"; detail: string};

export interface AccessRequestFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "children" | "onSubmit" | "resource"> {
  /** Supply only the target metadata the requester is authorized to see. */
  resource: {id: string; label: string};
  /** Display name or address of the account that will receive access. */
  account: string;
  state?: AccessRequestState;
  message?: {value: string; onChange: (value: string) => void; required?: boolean; maxLength?: number};
  onSubmit: (request: {resourceId: string; message?: string}) => void;
  /** A quiet route away, such as switching to an account that already has access. */
  secondaryAction?: ReactNode;
  labels?: {
    resource?: string;
    account?: string;
    message?: string;
    submit?: string;
    requested?: string;
  };
}

/** Request access to a known resource from the currently signed-in account. @since 0.2.14 */
export const AccessRequestForm = /* @__PURE__ */ forwardRef<HTMLFormElement, AccessRequestFormProps>(function AccessRequestForm(
  {resource, account, state = {status:"ready"}, message, onSubmit, secondaryAction, labels, onBlurCapture, ...props}, ref,
) {
  const focusOutcome = useRef(false);
  const outcome = useRef<HTMLElement>(null);
  const sending = state.status === "sending";
  const canRequest = state.status === "ready" || state.status === "failed";
  const showForm = sending || canRequest;
  const submitLabel = labels?.submit ?? "Request access";

  useEffect(() => {
    if (!showForm && focusOutcome.current) {
      focusOutcome.current = false;
      const target = outcome.current;
      if (target?.ownerDocument.activeElement === target?.ownerDocument.body) target?.focus({preventScroll:true});
    }
  }, [showForm]);

  return <form {...props} ref={ref} aria-label={props["aria-label"] ?? submitLabel} aria-busy={sending || undefined}
    onBlurCapture={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) focusOutcome.current = false;
      onBlurCapture?.(event);
    }}
    onSubmit={event => {
      event.preventDefault();
      const text = message?.value.trim();
      if (!canRequest || (message?.required && !text)) return;
      focusOutcome.current = event.currentTarget.contains(event.currentTarget.ownerDocument.activeElement);
      onSubmit({resourceId:resource.id, ...(text ? {message:text} : {})});
    }}>
    <Stack gap="4">
      <DescriptionList layout="columns" density="compact" items={[
        {id:"resource",term:labels?.resource ?? "Resource",description:resource.label},
        {id:"account",term:labels?.account ?? "Requesting as",description:account},
      ]} />
      {showForm && message && <Field label={labels?.message ?? "Message"} required={message.required}>
        {field => <Textarea {...field} rows={2} autoGrow maxRows={4} readOnly={sending} maxLength={message.maxLength}
          value={message.value} onChange={event => message.onChange(event.currentTarget.value)} />}
      </Field>}
      {state.status === "failed" && <Text as="p" size="compact" tone="error" role="alert">{state.detail}</Text>}
      {!showForm && <Text ref={outcome} as="p" size="compact" role="status" tabIndex={-1}>
        {state.status === "requested" ? state.detail ?? labels?.requested ?? "Request sent. Waiting for approval."
          : state.status === "unavailable" ? state.detail : undefined}
      </Text>}
      {(showForm || secondaryAction) && <FormActions secondary={secondaryAction}
        primary={showForm ? <Button type="submit" disabled={!sending && message?.required && !message.value.trim()}
          loading={sending ? "retain-focus" : false}>{submitLabel}</Button> : undefined} />}
    </Stack>
  </form>;
});

export interface AccessInviteDraft {
  email: string;
  roleId: string;
}

export interface AccessInviteRole {
  id: string;
  label: string;
  description: string;
}

export interface AccessInviteFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "children" | "onSubmit" | "onChange" | "noValidate"> {
  scope: {id: string; label: string};
  roles: readonly AccessInviteRole[];
  value: AccessInviteDraft;
  onValueChange: (value: AccessInviteDraft) => void;
  onSubmit: (invite: AccessInviteDraft & {scopeId: string}) => void;
  disabled?: boolean;
  pending?: boolean;
  emailError?: string;
  error?: string;
  labels?: {
    scope?: string;
    email?: string;
    role?: string;
    chooseRole?: string;
    noRoles?: string;
    submit?: string;
  };
}

/** Invite one person to a known resource with an explicitly selected role. @since 0.2.14 */
export const AccessInviteForm = /* @__PURE__ */ forwardRef<HTMLFormElement, AccessInviteFormProps>(function AccessInviteForm(
  {scope, roles, value, onValueChange, onSubmit, disabled = false, pending = false, emailError, error, labels, ...props}, ref,
) {
  const email = value.email.trim();
  const availableRoles = roles.filter(role => role.id !== "");
  const role = availableRoles.find(option => option.id === value.roleId);
  const canSubmit = !disabled && Boolean(role && email);
  const blocked = disabled || pending;
  return <form {...props} ref={ref} aria-busy={pending || undefined} onSubmit={event => {
    event.preventDefault();
    if (blocked || !role || !email) return;
    onSubmit({email, roleId:role.id, scopeId:scope.id});
  }}>
    <Stack gap="4">
      <DescriptionList density="compact" layout="columns" items={[{id:scope.id,term:labels?.scope ?? "Access to",description:scope.label}]} />
      <Field label={labels?.email ?? "Email address"} required error={emailError}>
        {field => <Input {...field} type="email" autoComplete="email" spellCheck={false}
          value={value.email} disabled={disabled} readOnly={pending}
          onChange={event => onValueChange({...value, email:event.currentTarget.value})} />}
      </Field>
      <Field label={labels?.role ?? "Role"} required
        hint={role?.description ?? (!availableRoles.length ? labels?.noRoles ?? "No roles can be assigned here." : undefined)}>
        {field => <Select {...field} value={role?.id ?? ""} disabled={blocked || !availableRoles.length}
          onChange={event => onValueChange({...value, roleId:event.currentTarget.value})}>
          <option value="" disabled>{labels?.chooseRole ?? "Choose a role"}</option>
          {availableRoles.map(option => <option value={option.id} key={option.id}>{option.label}</option>)}
        </Select>}
      </Field>
      {error && <Text as="p" size="compact" tone="error" role="alert">{error}</Text>}
      <FormActions primary={<Button type="submit" disabled={!canSubmit} loading={pending ? "retain-focus" : false}>
        {labels?.submit ?? "Send invitation"}
      </Button>} />
    </Stack>
  </form>;
});

/** Native select and option semantics with an independent visual control size. */
export const Select = /* @__PURE__ */ forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, status, controlSize = "md", className, multiple, size, ...props },
  ref,
) {
  const listbox = multiple || (size !== undefined && size > 1);
  if (!listbox) return <SingleSelect {...props} status={status} invalid={invalid} controlSize={controlSize} className={className} size={size} ref={ref} />;
  return (
    <span hidden={props.hidden} dir={props.dir} lang={props.lang} className={classes("flood-select", `flood-control--${controlSize}`, listbox && "flood-select--listbox")}>
      <select
        {...props}
        ref={ref}
        multiple={multiple}
        size={size}
        data-status={resolveFieldStatus(status, invalid, props["aria-invalid"])}
        aria-invalid={invalid || status === "error" || props["aria-invalid"]}
        className={classes("flood-input", "flood-select__control", `flood-control--${controlSize}`, className)}
      />
    </span>
  );
});

export interface ChoiceProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  label: ReactNode;
}
export interface CheckboxProps extends ChoiceProps {
  indeterminate?: boolean;
  hideLabel?: boolean;
}
export const Checkbox = /* @__PURE__ */ forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, indeterminate = false, hideLabel = false, className, ...props }, ref) {
    return (
      <label hidden={props.hidden} dir={props.dir} lang={props.lang} className={classes("flood-choice", hideLabel && "flood-choice--icon", className)}>
        <MixedCheckbox {...props} ref={ref} indeterminate={indeterminate} />
        {hideLabel ? <VisuallyHidden>{label}</VisuallyHidden> : <span>{label}</span>}
      </label>
    );
  },
);
export const Radio = /* @__PURE__ */ forwardRef<HTMLInputElement, ChoiceProps>(function Radio(
  { label, className, ...props },
  ref,
) {
  return (
    <label hidden={props.hidden} dir={props.dir} lang={props.lang} className={classes("flood-choice", className)}>
      <input {...props} ref={ref} type="radio" className="flood-check" />
      <span>{label}</span>
    </label>
  );
});
export interface SwitchProps extends ChoiceProps {
  layout?: "inline" | "row";
  description?: ReactNode;
}

export const Switch = /* @__PURE__ */ forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, layout = "inline", description, className, readOnly, onClick, onChange, "aria-labelledby": labelledBy, "aria-describedby": describedBy, ...props },
  ref,
) {
  const id = useId();
  const hasDescription = hasFieldContent(description);
  return (
    <label hidden={props.hidden} dir={props.dir} lang={props.lang} className={classes("flood-choice", "flood-switch", layout === "row" && "flood-setting-row", className)}>
      {layout === "row" || hasDescription
        ? <SettingDetails label={label} description={description} labelId={`${id}-label`} descriptionId={`${id}-description`} />
        : <span>{label}</span>}
      <input
        {...props}
        aria-labelledby={labelledBy ?? (hasDescription && !props["aria-label"] ? `${id}-label` : undefined)}
        aria-describedby={mergeDescriptions(describedBy, hasDescription && `${id}-description`)}
        aria-readonly={readOnly || props["aria-readonly"] || undefined}
        ref={ref}
        type="checkbox"
        role="switch"
        readOnly={readOnly}
        required={props.required && !readOnly}
        onClick={event => {
          onClick?.(event);
          if (readOnly) event.preventDefault();
        }}
        onChange={event => { if (!readOnly) onChange?.(event); }}
        className="flood-switch-input"
      />
    </label>
  );
});

function SettingDetails({label, description, labelId, descriptionId}: {
  label: ReactNode;
  description?: ReactNode;
  labelId?: string;
  descriptionId?: string;
}) {
  return <span className="flood-setting-row__details">
    <Text id={labelId} size="compact" className="flood-setting-row__label">{label}</Text>
    {hasFieldContent(description) && <Text id={descriptionId} size="helper" tone="subtle">{description}</Text>}
  </span>;
}

export interface SettingRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: ReactNode;
  description?: ReactNode;
  value?: ReactNode;
  /** Shorten a plain text value to one line when it does not fit. */
  valueOverflow?: "wrap" | "truncate";
  action?: ReactNode;
  layout?: "adaptive" | "inline" | "stacked";
}

/** A settings label and optional explanation with an independently named action. */
export const SettingRow = /* @__PURE__ */ forwardRef<HTMLDivElement, SettingRowProps>(function SettingRow(
  {label, description, value, valueOverflow = "wrap", action, layout = "adaptive", className, ...props}, ref,
) {
  const hasValue = hasFieldContent(value);
  const hasAction = hasFieldContent(action);
  return <div {...props} ref={ref} className={classes("flood-setting-row", className)} data-layout={layout} data-has-description={hasFieldContent(description) || undefined}>
    <SettingDetails label={label} description={description} />
    {(hasValue || hasAction) && <div className="flood-setting-row__trailing">
      {hasValue && <Text as="div" size="compact" tone="subtle" className="flood-setting-row__value">
        {valueOverflow === "truncate" && typeof value === "string" ? <TruncatedText>{value}</TruncatedText> : value}
      </Text>}
      {hasAction && <div className="flood-setting-row__action">{action}</div>}
    </div>}
  </div>;
});

export interface SettingGroupProps extends SectionProps {
  density?: DataDensity;
  dividers?: boolean;
  /** Reflow direct adaptive fields and setting rows on shared tracks. */
  layout?: "adaptive" | "aligned";
}

/** A named group of independently actionable or switchable settings. */
export const SettingGroup = /* @__PURE__ */ forwardRef<HTMLElement, SettingGroupProps>(function SettingGroup(
  {density = "comfortable", dividers = false, layout = "adaptive", headingSize = "group", className, ...props}, ref,
) {
  return <Section {...props} ref={ref} headingSize={headingSize} className={classes("flood-setting-group", className)}
    data-density={density} data-dividers={dividers} data-layout={layout} />;
});

export interface ReplicaAllocationRegion {
  id: string;
  label: string;
  replicas: number;
  /** Explain a region count fixed by external policy. */
  lockedReason?: string;
}

export interface ReplicaAllocationProps extends Omit<SettingGroupProps, "children" | "actions" | "onChange"> {
  regions: readonly ReplicaAllocationRegion[];
  onReplicaChange: (regionId: string, replicas: number) => void;
  minimum?: number;
  maximum?: number;
  disabled?: boolean;
  labels?: {
    total?: (total: number, maximum?: number) => string;
    replicas?: (region: string) => string;
    decrease?: (region: string) => string;
    increase?: (region: string) => string;
    empty?: string;
  };
}

const isReplicaCount = (value: number) => Number.isSafeInteger(value) && value >= 0;

/** Edit planned replica counts by region under a shared service limit. @since 0.2.14 */
export const ReplicaAllocation = /* @__PURE__ */ forwardRef<HTMLElement, ReplicaAllocationProps>(function ReplicaAllocation(
  {regions, onReplicaChange, minimum = 0, maximum, disabled = false, labels, density = "compact", ...props}, ref,
) {
  const total = regions.reduce((sum, region) => sum + region.replicas, 0);
  if (!isReplicaCount(minimum) || (maximum !== undefined && (!isReplicaCount(maximum) || maximum < minimum)) ||
      !isReplicaCount(total) || regions.some(region => !region.id.trim() || !region.label.trim() || !isReplicaCount(region.replicas)) ||
      new Set(regions.map(region => region.id)).size !== regions.length) {
    throw new Error("Flood ReplicaAllocation requires unique named regions and valid whole replica counts and bounds");
  }
  const totalLabel = labels?.total?.(total,maximum)
    ?? (maximum === undefined ? `${total} ${total === 1 ? "replica" : "replicas"}` : `${total} / ${maximum} replicas`);
  return <SettingGroup {...props} ref={ref} density={density}
    actions={<Text size="helper" tone="subtle" aria-live="polite">{totalLabel}</Text>}>
    {regions.length === 0 && <Text as="p" size="compact" tone="subtle">{labels?.empty ?? "No regions available."}</Text>}
    {regions.map(({id,label,replicas,lockedReason}) => {
      const others = total - replicas;
      const min = Math.min(replicas, Math.max(0, minimum - others));
      const max = Math.max(replicas,(maximum ?? Number.MAX_SAFE_INTEGER) - others);
      const locked = Boolean(lockedReason?.trim());
      return <SettingRow key={id} label={label} description={locked ? lockedReason : undefined}
        action={<NumberInput controlSize="sm" value={replicas} min={min} max={max} disabled={disabled || locked}
          aria-label={labels?.replicas?.(label) ?? `${label} replicas`}
          decreaseLabel={labels?.decrease?.(label) ?? `Remove a replica in ${label}`}
          increaseLabel={labels?.increase?.(label) ?? `Add a replica in ${label}`}
          style={{inlineSize:"8rem",maxInlineSize:"100%"}}
          onValueChange={next => {
            if (!disabled && !locked && next !== null && isReplicaCount(next) && next >= min &&
                next <= max && next !== replicas) onReplicaChange(id,next);
          }} />} />;
    })}
  </SettingGroup>;
});

const contentLabelVisibility = ["show", "warn", "hide"] as const;
export type ContentLabelVisibility = typeof contentLabelVisibility[number];

export interface ContentLabelPreference {
  id: string;
  label: string;
  description?: string;
  visibility: ContentLabelVisibility;
  /** Explain which policy fixes this label's visibility. */
  lockedReason?: string;
}

export interface ContentLabelSettingsProps extends Omit<SettingGroupProps, "children" | "layout"> {
  preferences: readonly ContentLabelPreference[];
  onVisibilityChange: (id: string, next: ContentLabelVisibility) => void;
  disabled?: boolean;
  labels?: Partial<Record<ContentLabelVisibility | "empty", string>>;
}

/** Configure which content labels to show, warn about or hide for one provider. @since 0.2.14 */
export const ContentLabelSettings = /* @__PURE__ */ forwardRef<HTMLElement, ContentLabelSettingsProps>(function ContentLabelSettings(
  {preferences, onVisibilityChange, labels, disabled = false, className, ...props}, ref,
) {
  const visibilityLabels = {show:labels?.show ?? "Show",warn:labels?.warn ?? "Warn",hide:labels?.hide ?? "Hide"};
  return <SettingGroup {...props} ref={ref} className={classes("flood-content-label-settings",className)} layout="aligned">
    {preferences.length ? preferences.map(({id,label,description,visibility,lockedReason}) =>
      lockedReason ? <SettingRow key={id} label={label}
          description={description ? <>{description}{" "}{lockedReason}</> : lockedReason}
          value={visibilityLabels[visibility]} />
        : <Field key={id} label={label} hint={description} layout="adaptive">
          {field => <Select {...field} value={visibility} disabled={disabled} controlSize="sm"
            onChange={event => onVisibilityChange(id,event.currentTarget.value as ContentLabelVisibility)}>
            {contentLabelVisibility.map(mode => <option key={mode} value={mode}>{visibilityLabels[mode]}</option>)}
          </Select>}
        </Field>,
    ) : <Text as="p" size="compact" tone="subtle">{labels?.empty ?? "No content labels."}</Text>}
  </SettingGroup>;
});

export interface NotificationChannelEvent {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
  /** Supply a visible explanation in description when the policy fixes this choice. */
  readOnly?: boolean;
}

export interface NotificationChannelSettingsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  description?: string;
  enabled: boolean;
  events: readonly NotificationChannelEvent[];
  eventsLabel?: string;
  disabled?: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onEventChange: (id: string, enabled: boolean) => void;
}

/** Edit one notification delivery channel while retaining paused event preferences. @since 0.2.14 */
export const NotificationChannelSettings = /* @__PURE__ */ forwardRef<HTMLDivElement, NotificationChannelSettingsProps>(function NotificationChannelSettings(
  {label, description, enabled, events, eventsLabel = "Notification types", disabled = false, onEnabledChange, onEventChange, ...props}, ref,
) {
  return <Stack {...props} ref={ref} gap="4">
    <Switch layout="row" label={label} description={description} checked={enabled} disabled={disabled}
      onChange={event => onEnabledChange(event.currentTarget.checked)} />
    {events.length > 0 && <SwitchGroup legend={eventsLabel} density="compact" disabled={disabled || !enabled}>
      {events.map(event => <Switch key={event.id} layout="row" label={event.label} description={event.description}
        checked={event.enabled} readOnly={event.readOnly}
        onChange={change => onEventChange(event.id, change.currentTarget.checked)} />)}
    </SwitchGroup>}
  </Stack>;
});

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}
/** A native label; the required marker never substitutes for the control's required prop. */
export const Label = /* @__PURE__ */ forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { required, children, className, ...props }, ref,
) {
  return <label {...props} ref={ref} className={classes("flood-label", className)}>{children}{required && <span aria-hidden="true"> *</span>}</label>;
});

export interface FieldsetProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  legend: ReactNode;
  /** Visual role only; compact choice captions remain the default. @since 0.2.10 */
  legendSize?: "label" | "section";
  /** Align direct Field labels beside their controls when the group has room. */
  layout?: "stacked" | "aligned";
  /** @since 0.2.3 */
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  message?: ReactNode;
  status?: FieldStatus;
}
/** A native group: disabled, form ownership and nested fieldsets retain browser behavior. */
export const Fieldset = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, FieldsetProps>(function Fieldset(
  { legend, legendSize = "label", layout = "stacked", hideLabel = false, hint, error, message, status, children, className, id: explicitId, "aria-describedby": describedBy, "aria-invalid": ariaInvalid, ...props }, ref,
) {
  const generatedId = useId();
  const id = explicitId ?? `flood-${generatedId}`;
  const legendRef = useFocusableHidden<HTMLLegendElement>(hideLabel);
  const hasHint = hasFieldContent(hint), hasError = hasFieldContent(error), hasMessage = hasFieldContent(message) && !hasError;
  const resolvedStatus = resolveFieldStatus(status, hasError, ariaInvalid);
  const description = mergeDescriptions(describedBy, hasHint && `${id}-hint`, hasError && `${id}-error`, hasMessage && `${id}-message`);
  return <fieldset {...props} ref={ref} id={id} className={classes("flood-fieldset", className)} data-legend-size={legendSize} data-layout={layout} data-hide-label={hideLabel || undefined} data-status={resolvedStatus}
    aria-describedby={description} aria-invalid={resolvedStatus === "error" || ariaInvalid || undefined}>
    <legend ref={legendRef} className={classes("flood-legend", hideLabel && "flood-visually-hidden--focusable")}>{legend}</legend>
    <div className="flood-fieldset__body">
      {hasHint && <div id={`${id}-hint`} className="flood-hint">{hint}</div>}
      {children}
      {hasMessage && <div id={`${id}-message`} className="flood-message" role={resolvedStatus === "error" ? "alert" : undefined}>{message}</div>}
      {hasError && <div id={`${id}-error`} className="flood-error" role="alert">{error}</div>}
    </div>
  </fieldset>;
});

export interface SwitchGroupProps extends Omit<FieldsetProps, "layout"> {
  density?: DataDensity;
  dividers?: boolean;
}

/** Related on/off preferences with a shared legend and native disabled state. */
export const SwitchGroup = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, SwitchGroupProps>(function SwitchGroup(
  {density = "comfortable", dividers = false, className, ...props}, ref,
) {
  return <Fieldset {...props} ref={ref} className={classes("flood-switch-group", className)} data-density={density} data-dividers={dividers} />;
});

export interface ChoiceOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}
export interface RadioGroupProps extends Omit<FieldsetProps, "children" | "defaultValue" | "role"> {
  name: string;
  options: readonly ChoiceOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: "vertical" | "horizontal";
  required?: boolean;
}
export const RadioGroup = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, RadioGroupProps>(function RadioGroup(
  { value, defaultValue, onValueChange, orientation = "vertical", ...props }, ref,
) {
  return <ChoiceGroup {...props} ref={ref} kind="radio" orientation={orientation}
    selected={value === undefined ? undefined : [value]} initial={defaultValue === undefined ? [] : [defaultValue]}
    onSelectionChange={next => onValueChange?.(next[0] ?? "")} fieldsetComponent={Fieldset} choiceComponent={Radio} />;
});

export interface SegmentedControlOption extends ToggleOption {
  /** Optional visible count read with the label. Format localized counts before passing them. @since 0.2.11 */
  count?: number | string;
}

export interface SegmentedControlProps extends Omit<RadioGroupProps, "legend" | "options"> {
  label: string;
  options: readonly SegmentedControlOption[];
  controlSize?: "sm" | "md" | "lg" | "xl";
  iconOnly?: boolean;
  fullWidth?: boolean;
}
/** A segmented presentation of native single-choice inputs, retaining forms and reset. */
export const SegmentedControl = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, SegmentedControlProps>(function SegmentedControl(
  { label, options, controlSize = "md", iconOnly = false, fullWidth = false, orientation = "horizontal", className, onKeyDown, ...props }, ref,
) {
  if (iconOnly && options.some(option => !option.icon)) throw new Error("Flood icon-only segments require icons");
  return <RadioGroup {...props} ref={ref} legend={label} orientation={orientation}
    className={classes("flood-segmented", `flood-control--${controlSize}`, iconOnly && "flood-segmented--icons", fullWidth && "flood-segmented--full", className)}
    options={options.map(option => ({ ...option, label: <>
      {option.icon && <IconSlot size={controlSize}>{option.icon}</IconSlot>}
      {iconOnly ? <span className="flood-segmented__name">{option.label}</span>
        : option.count == null || option.count === "" ? option.label
        : <span className="flood-segmented__counted-label">{option.label}{" "}<span className="flood-segmented__count">{option.count}</span></span>}
    </> }))} onKeyDown={event => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
      const inputs = Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>(":scope > .flood-fieldset__body > .flood-choice-group > .flood-choice > input[type=radio]:not(:disabled)"));
      const index = inputs.indexOf(event.target as HTMLInputElement);
      if (index < 0) return;
      const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
      const next = event.key === "Home" ? 0 : event.key === "End" ? inputs.length - 1
        : event.key === "ArrowDown" || event.key === (rtl ? "ArrowLeft" : "ArrowRight") ? (index + 1) % inputs.length
        : event.key === "ArrowUp" || event.key === (rtl ? "ArrowRight" : "ArrowLeft") ? (index - 1 + inputs.length) % inputs.length : -1;
      if (next >= 0) { event.preventDefault(); inputs[next].focus(); inputs[next].click(); }
    }} />;
});
export interface CheckboxGroupProps extends Omit<FieldsetProps, "children" | "defaultValue" | "role"> {
  name: string;
  options: readonly ChoiceOption[];
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  orientation?: "vertical" | "horizontal";
}
export const CheckboxGroup = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, CheckboxGroupProps>(function CheckboxGroup(
  { value, defaultValue = [], onValueChange, orientation = "vertical", ...props }, ref,
) {
  return <ChoiceGroup {...props} ref={ref} kind="checkbox" orientation={orientation}
    selected={value} initial={defaultValue} onSelectionChange={onValueChange} fieldsetComponent={Fieldset} choiceComponent={Checkbox} />;
});

export interface ChoiceCardOption extends ChoiceOption, Pick<CheckCardProps, "description" | "metadata" | "icon"> {
  label: string;
}

interface ChoiceCardGroupAppearance {
  options: readonly ChoiceCardOption[];
  density?: CheckCardProps["density"];
  minItemWidth?: GridProps["minItemWidth"];
  indicatorPlacement?: CheckCardProps["indicatorPlacement"];
}

export interface RadioCardGroupProps extends Omit<RadioGroupProps, "options" | "orientation" | "layout">, ChoiceCardGroupAppearance {}
export const RadioCardGroup = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, RadioCardGroupProps>(function RadioCardGroup(
  {value, defaultValue, onValueChange, options, density = "comfortable", minItemWidth = "12rem", indicatorPlacement, ...props}, ref,
) {
  return <ChoiceGroup {...props} ref={ref} options={options} kind="radio" orientation="vertical"
    selected={value === undefined ? undefined : [value]} initial={defaultValue === undefined ? [] : [defaultValue]}
    onSelectionChange={next => onValueChange?.(next[0] ?? "")} fieldsetComponent={Fieldset} choiceComponent={Radio}
    cards={{minItemWidth, render:(index, input) => <RadioCard {...options[index]} {...input} density={density} indicatorPlacement={indicatorPlacement} />}} />;
});

export interface BackupPoint {
  id: string;
  label: string;
  capturedAt: {dateTime: string; label: string};
  description?: string;
  /** A visible reason the point cannot be restored. */
  unavailableReason?: string;
}

export interface BackupPickerProps extends Pick<RadioCardGroupProps,
  "name" | "form" | "disabled" | "required" | "hint" | "error" | "hideLabel" |
  "id" | "className" | "style" | "lang" | "dir" | "aria-describedby"> {
  label: string;
  backups: readonly BackupPoint[];
  /** The accepted backup ID, or an empty string before selection. */
  value: string;
  onValueChange: (backupId: string) => void;
  emptyLabel?: string;
}

/** Select an existing backup before reviewing a restore. */
export const BackupPicker = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, BackupPickerProps>(function BackupPicker(
  {label, backups, value, onValueChange, required, emptyLabel = "No backups available.", ...props}, ref,
) {
  if (!label.trim() || backups.some(backup => !backup.id.trim() || !backup.capturedAt.dateTime.trim() || !backup.capturedAt.label.trim())) {
    throw new Error("Flood BackupPicker requires a label and backup IDs with visible capture times");
  }
  if (!backups.length) {
    return <Fieldset {...props} ref={ref} legend={label}>
      <Text as="p" size="compact" tone="subtle">{emptyLabel}</Text>
    </Fieldset>;
  }
  const options = backups.map(({id, label: backupLabel, capturedAt, description, unavailableReason}) => {
    const reason = unavailableReason?.trim();
    return {
      value: id,
      label: backupLabel,
      description: reason ? <Text tone="subtle" size="compact">{reason}</Text> : description,
      disabled: Boolean(reason),
      metadata: <Timestamp dateTime={capturedAt.dateTime}>{capturedAt.label}</Timestamp>,
    };
  });
  const availableValue = options.some(option => option.value === value && !option.disabled) ? value : "";
  return <RadioCardGroup {...props} ref={ref} legend={label} options={options}
    value={availableValue} onValueChange={onValueChange} required={required}
    density="compact" minItemWidth="100%" />;
});

export interface PaymentMethodOption {
  id: string;
  label: string;
  /** Host-formatted arrival estimate, including any qualification needed for the quote. */
  arrival?: string;
  /** Display-ready fee, including currency. Omit when the fee is unknown. */
  fee?: string;
  unavailableReason?: string;
}

export interface PaymentMethodPickerProps extends Omit<RadioCardGroupProps,
  "options" | "legend" | "value" | "defaultValue" | "onValueChange" | "minItemWidth"
> {
  label: string;
  methods: readonly PaymentMethodOption[];
  value: string;
  onValueChange: (id: string) => void;
  labels?: {
    fee?: (amount: string) => string;
    feeUnknown?: string;
    arrivalUnknown?: string;
    empty?: string;
  };
}

/** Choose a payment method with delivery and fee estimates. @since 0.2.14 */
export const PaymentMethodPicker = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, PaymentMethodPickerProps>(function PaymentMethodPicker(
  {label,methods,value,onValueChange,labels,density = "compact",...props}, ref,
) {
  if (!methods.length) return <Fieldset {...props} ref={ref} legend={label}>
    <Text as="p" size="compact" tone="subtle">{labels?.empty ?? "No payment methods available."}</Text>
  </Fieldset>;
  const options = methods.map(({id,label:methodLabel,arrival,fee,unavailableReason}) => {
    const reason = unavailableReason?.trim();
    return {
      value:id,
      label:methodLabel,
      disabled:Boolean(reason),
      description:reason ? <Text tone="subtle" size="compact">{reason}</Text>
        : arrival ?? labels?.arrivalUnknown ?? "Arrival not available",
      metadata:reason ? undefined : fee === undefined ? labels?.feeUnknown ?? "Fee unavailable"
        : <bdi>{labels?.fee?.(fee) ?? `${fee} fee`}</bdi>,
    };
  });
  const availableValue = options.some(option => option.value === value && !option.disabled) ? value : "";
  return <RadioCardGroup {...props} ref={ref} legend={label} options={options} value={availableValue}
    onValueChange={onValueChange} density={density} minItemWidth="100%" />;
});

interface DeploymentRegionDetails {
  id: string;
  label: string;
  /** Geographic scope or location detail shown below the label. */
  location: string;
  unavailableReason?: string;
}

export type DeploymentRegion = DeploymentRegionDetails & (
  | { scope: "automatic"; code?: never }
  | { scope: "specific"; code: string }
);

export interface DeploymentRegionPickerProps extends Pick<RadioCardGroupProps,
  "name" | "form" | "disabled" | "required" | "hint" | "error" | "hideLabel" |
  "id" | "className" | "style" | "lang" | "dir" | "aria-describedby"> {
  label: string;
  regions: readonly DeploymentRegion[];
  /** Draft selection. Use an empty string before a choice has been made. */
  value: string;
  onValueChange: (regionId: string) => void;
  currentRegionId?: string;
  recommendedRegionId?: string;
  labels?: { current?: string; recommended?: string; empty?: string };
}

/** Choose a deployment target before the host applies a region change. */
export const DeploymentRegionPicker = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, DeploymentRegionPickerProps>(function DeploymentRegionPicker(
  { label, regions, value, onValueChange, currentRegionId, recommendedRegionId, labels, required, ...props }, ref,
) {
  if (!label.trim() || new Set(regions.map(region => region.id)).size !== regions.length ||
      regions.some(region => !region.id.trim() || !region.label.trim() || !region.location.trim() ||
        (region.scope === "specific" && !region.code.trim()))) {
    throw new Error("Flood DeploymentRegionPicker requires a label, unique region IDs, locations and codes for specific regions");
  }
  if (!regions.length) return <Fieldset {...props} ref={ref} legend={label}>
    <Text size="compact" tone="subtle">{labels?.empty ?? "No deployment regions available."}</Text>
  </Fieldset>;
  const options = regions.map(region => {
    const reason = region.unavailableReason?.trim();
    const current = region.id === currentRegionId;
    const recommended = !current && !reason && region.id === recommendedRegionId;
    const details = [region.location, region.code].filter(Boolean).join(" · ");
    return {
      value: region.id,
      label: region.label,
      description: reason ? <>{details} · <Text size="compact" tone="subtle">{reason}</Text></> : details,
      disabled: Boolean(reason),
      metadata: current || recommended
        ? <Badge size="sm" variant="outline">{current ? labels?.current ?? "Current" : labels?.recommended ?? "Recommended"}</Badge>
        : undefined,
    };
  });
  const availableValue = options.some(option => option.value === value && !option.disabled) ? value : "";
  return <RadioCardGroup {...props} ref={ref} legend={label} density="compact" minItemWidth="100%"
    options={options} value={availableValue} onValueChange={onValueChange} required={required} />;
});

export interface CheckCardGroupProps extends Omit<CheckboxGroupProps, "options" | "orientation" | "layout">, ChoiceCardGroupAppearance {}
export const CheckCardGroup = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, CheckCardGroupProps>(function CheckCardGroup(
  {value, defaultValue = [], onValueChange, options, density = "comfortable", minItemWidth = "12rem", indicatorPlacement, ...props}, ref,
) {
  return <ChoiceGroup {...props} ref={ref} options={options} kind="checkbox" orientation="vertical"
    selected={value} initial={defaultValue} onSelectionChange={onValueChange} fieldsetComponent={Fieldset} choiceComponent={Checkbox}
    cards={{minItemWidth, render:(index, input) => <CheckCard {...options[index]} {...input} density={density} indicatorPlacement={indicatorPlacement} />}} />;
});

export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  status?: FieldStatus;
  required?: boolean;
}
export interface FieldProps {
  status?: FieldStatus;
  message?: ReactNode;
  id?: string;
  label: ReactNode;
  /** Optional action beside the label. It stays outside the native label element. */
  labelAside?: ReactNode;
  /** Place the label and hint beside the control when the field has room. */
  layout?: "stacked" | "adaptive";
  /** @since 0.2.3 */
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  describedBy?: string;
  children: (props: FieldControlProps) => ReactNode;
}
export function Field({
  status,
  message,
  id: explicitId,
  label,
  labelAside,
  layout = "stacked",
  hideLabel = false,
  hint,
  error,
  required,
  describedBy,
  children,
}: FieldProps) {
  const generatedId = useId();
  const id = explicitId ?? `flood-${generatedId}`;
  const labelRef = useFocusableHidden<HTMLLabelElement>(hideLabel);
  const hasMessage = hasFieldContent(message);
  const hasHint = hasFieldContent(hint);
  const hasError = hasFieldContent(error);
  const resolvedStatus = hasError ? "error" : status;
  const description =
    mergeDescriptions(describedBy, hasHint && `${id}-hint`, hasError && `${id}-error`, hasMessage && !hasError && `${id}-message`);
  const fieldLabel = <Label ref={labelRef} htmlFor={id} required={required} className={hideLabel ? "flood-visually-hidden--focusable" : undefined}>{label}</Label>;
  const labelLine = hasFieldContent(labelAside)
    ? <Inline gap="1" className="flood-field__label-line">{fieldLabel}{labelAside}</Inline> : fieldLabel;
  const control = children({
    id,
    "aria-describedby": description,
    "aria-invalid": hasError || resolvedStatus === "error" ? true : undefined,
    status: resolvedStatus,
    required,
  });
  const guidance = hasHint && <div id={`${id}-hint`} className="flood-hint">{hint}</div>;
  const feedback = hasError
    ? <div id={`${id}-error`} className="flood-error" role="alert">{error}</div>
    : hasMessage && <div id={`${id}-message`} className="flood-message" role={resolvedStatus === "error" ? "alert" : undefined}>{message}</div>;
  const adaptive = layout === "adaptive";
  return <div className="flood-field" data-layout={adaptive ? "adaptive" : undefined}
    data-hide-label={hideLabel || undefined} data-status={resolvedStatus}>
    {adaptive ? <div className="flood-field__adaptive-row">
      <div className="flood-field__identity">{labelLine}{guidance}</div>
      <div className="flood-field__editor">{control}{feedback}</div>
    </div> : <>{labelLine}{control}{guidance}{feedback}</>}
  </div>;
}

export interface CidrFieldProps extends Pick<FieldProps, "id" | "label" | "hint" | "error" | "hideLabel" | "required" | "describedBy">,
  Pick<InputProps, "name" | "form" | "disabled" | "readOnly" | "placeholder" | "controlSize" | "className"> {
  value: string;
  onValueChange: (value: string) => void;
  /** Omit to accept both address families. */
  family?: "IPv4" | "IPv6";
  labels?: { formatError?: string; requiredError?: string };
}

/** Enter an IPv4 or IPv6 address with a network prefix length. */
export const CidrField = /* @__PURE__ */ forwardRef<HTMLInputElement, CidrFieldProps>(function CidrField(
  { id, label, hint, error, hideLabel, required, describedBy, value, onValueChange, family, labels, ...props }, ref,
) {
  const [validation, setValidation] = useState<"pristine" | "format" | "missing">("pristine");
  const pattern = cidrPattern(family);
  let feedback: ReactNode;
  if (!props.disabled && !props.readOnly && validation !== "pristine") {
    if (value && !new RegExp(`^(?:${pattern})(?![\\s\\S])`).test(value)) {
      feedback = labels?.formatError ?? `Enter an ${family ?? "IPv4 or IPv6"} address with a prefix length.`;
    } else if (validation === "missing" && required && !value) {
      feedback = labels?.requiredError ?? "Enter an IP range.";
    }
  }
  const message = hasFieldContent(error) ? error : feedback;
  return <Field id={id} label={label} hint={hint} error={typeof message === "string" ? <bdi>{message}</bdi> : message}
    hideLabel={hideLabel} required={required} describedBy={describedBy}>
    {field => <Input {...props} {...field} ref={ref} type="text" dir="ltr" value={value} pattern={pattern}
      autoComplete="off" autoCapitalize="none" spellCheck={false}
      onBlur={() => setValidation(previous => previous === "missing" ? previous : "format")}
      onInvalid={event => setValidation(event.currentTarget.validity.valueMissing ? "missing" : "format")}
      onChange={event => {
        if (validation === "missing") setValidation("format");
        onValueChange(event.currentTarget.value);
      }}/>}
  </Field>;
});

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "text" | "solid" | "subtle" | "outline" | "ghost";
  size?: ControlSize;
}
export const Link = /* @__PURE__ */ forwardRef<HTMLAnchorElement, LinkProps>(function Link({ variant = "text", size = "md", className, ...props }, ref) {
  return (
    <a {...props} ref={ref} className={classes("flood-link", variant !== "text" && "flood-link--button", variant !== "text" && "flood-button", variant !== "text" && `flood-button--${variant}`, variant !== "text" && `flood-button--${size}`, className)} />
  );
});

export interface ProfileLinkItem {
  id: string;
  label: string;
  /** A destination validated by the host before rendering user-submitted links. */
  href: string;
  /** Decorative artwork; the visible label names the destination. */
  icon?: ReactNode;
}

export interface ProfileLinksProps extends Omit<ListProps, "children" | "ordered" | "reversed" | "start" | "marker" | "gap"> {
  items: readonly ProfileLinkItem[];
  /** Apply primary emphasis to this link while keeping the supplied order. */
  featuredId?: string;
  size?: "sm" | "md";
}

/** Direct destinations associated with a profile. @since 0.2.14 */
export const ProfileLinks = /* @__PURE__ */ forwardRef<HTMLUListElement, ProfileLinksProps>(function ProfileLinks(
  {items, featuredId, size = "sm", className, "aria-label": label = "Profile links", ...props}, ref,
) {
  if (new Set(items.map(item => item.id)).size !== items.length ||
      items.some(item => !item.id.trim() || !item.label.trim() || !item.href.trim())) {
    throw new Error("Flood ProfileLinks requires unique IDs, labels and destinations");
  }
  if (!items.length) return null;
  return <List {...props} ref={ref} aria-label={props["aria-labelledby"] ? undefined : label}
    className={classes("flood-profile-links", className)} marker={false}>
    {items.map(item => <li key={item.id}>
      <Link href={item.href} size={size} variant={item.id === featuredId ? "solid" : "subtle"}>
        {item.icon && <IconSlot size="xs">{item.icon}</IconSlot>}
        <bdi>{item.label}</bdi>
      </Link>
    </li>)}
  </List>;
});

export interface MentionProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** The account handle, with or without its leading @. */
  handle: string;
  /** Display name when the full handle would interrupt the sentence. */
  label?: string;
  /** A profile or record destination resolved by the host. */
  href?: string;
}

/** An account reference in running text. */
export const Mention = /* @__PURE__ */ forwardRef<HTMLSpanElement, MentionProps>(function Mention({
  handle, label, href, dir = "auto", className, ...props
}, ref) {
  const identifier = handle.trim().replace(/^@/u, "");
  if (!identifier || /[\s@]/u.test(identifier)) throw new Error("Flood Mention requires a nonempty account handle");
  const name = label?.trim().replace(/^@/u, "") || identifier;
  const text = <bdi dir={dir}>@{name}</bdi>;
  return <span {...props} ref={ref} className={classes("flood-mention", className)}>
    {href ? <Link href={href} className="flood-mention__link" aria-label={name !== identifier ? `@${name} (@${identifier})` : undefined}>
      {text}
    </Link> : text}
  </span>;
});

export interface TextAnnotationProps extends Omit<LinkProps, "href" | "variant" | "size" | "target" | "download" | "children" | "dangerouslySetInnerHTML"> {
  children: string;
  /** ID of the same-document discussion, without a leading hash. */
  discussionId: string;
  resolved?: boolean;
  active?: boolean;
  /** Localized description announced after the linked text. */
  description?: string;
}

/** A wrap-safe text anchor for a same-document discussion. */
export const TextAnnotation = /* @__PURE__ */ forwardRef<HTMLAnchorElement, TextAnnotationProps>(function TextAnnotation({
  children, discussionId, resolved = false, active = false, description, className, "aria-describedby": describedBy, ...props
}, ref) {
  const descriptionId = useId();
  return <>
    <Link {...props} ref={ref} href={`#${encodeURIComponent(discussionId)}`}
      className={classes("flood-text-annotation", className)}
      aria-describedby={mergeDescriptions(describedBy, descriptionId)}
      data-resolved={resolved || undefined} data-active={active || undefined}>{children}</Link>
    <span id={descriptionId} hidden>{description ?? (resolved ? "Resolved discussion" : "Open discussion")}</span>
  </>;
});

export interface LinkPreviewProps extends Omit<LinkProps, "children" | "title" | "variant" | "size" | "dangerouslySetInnerHTML"> {
  href: string;
  title: string;
  /** Visible publisher or destination domain. */
  source: string;
  description?: string;
  /** Optional decorative artwork that supports the resource title. */
  thumbnailSrc?: string;
}

/** A named destination with a source, optional excerpt and thumbnail. @since 0.2.14 */
export const LinkPreview = /* @__PURE__ */ forwardRef<HTMLAnchorElement, LinkPreviewProps>(function LinkPreview(props, ref) {
  return <ResourceLinkPreview {...props} ref={ref} />;
});

export interface PublicationPreviewProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
  publication: string;
  title: string;
  href: string;
  excerpt?: string;
  /** Omit when readers can visit the article but cannot change their subscription here. */
  subscription?: {
    subscribed: boolean;
    onSubscribedChange: (subscribed: boolean) => void;
    pending?: boolean;
    labels?: {subscribe?: string; subscribed?: string};
    formatActionLabel?: FollowButtonProps["formatActionLabel"];
  };
}

/** A publication's article with an independent, host-controlled subscription action. @since 0.2.14 */
export const PublicationPreview = /* @__PURE__ */ forwardRef<HTMLDivElement, PublicationPreviewProps>(function PublicationPreview(
  {publication, title, href, excerpt, subscription, className, ...props}, ref,
) {
  if (!publication.trim() || !title.trim() || !href.trim()) {
    throw new Error("Flood PublicationPreview requires a publication, article title and destination");
  }
  const publicationId = useId();
  return <Stack {...props} ref={ref} gap="2" className={classes("flood-publication-preview", className)}>
    <Inline gap="2" className="flood-publication-preview__header">
      <Text id={publicationId} size="helper" tone="subtle" dir="auto">{publication}</Text>
      {subscription && <FollowButton subject={publication} state={subscription.subscribed ? "following" : "not-following"}
        pending={subscription.pending}
        formatActionLabel={subscription.formatActionLabel ?? ((label, subject, intent) =>
          intent === "unfollow" ? `Unsubscribe from ${subject}` : `${label} to ${subject}`)}
        labels={{"not-following": subscription.labels?.subscribe ?? "Subscribe", following: subscription.labels?.subscribed ?? "Subscribed"}}
        onAction={intent => subscription.onSubscribedChange(intent === "follow")} />}
    </Inline>
    <Stack gap="1">
      <Text size="label"><Link href={href} dir="auto" aria-describedby={publicationId}>{title}</Link></Text>
      {excerpt && <Text size="compact" tone="subtle" dir="auto">{excerpt}</Text>}
    </Stack>
  </Stack>;
});

export interface CitationProps {
  /** Short reference marker in the surrounding sentence, such as "1" or "§ 4". */
  label: string;
  /** Title of the linked evidence. */
  title: string;
  /** Publisher, document location, or other source identifier. */
  source: string;
  href: string;
  /** Short passage relevant to the adjacent claim. */
  excerpt?: string;
  className?: string;
}

/** An inline reference that reveals evidence and its source link. @since 0.2.14 */
export const Citation = /* @__PURE__ */ forwardRef<HTMLButtonElement, CitationProps>(function Citation(props, ref) {
  return <InlineCitation {...props} ref={ref} />;
});

export interface SourceReference extends Pick<CitationProps, "title" | "source" | "excerpt"> {
  id: string;
  href?: string;
  /** A display marker shared with an inline citation, when one exists. */
  marker?: string;
}

export interface SourceListProps extends Omit<DataListProps, "children" | "aria-label"> {
  label: string;
  sources: readonly SourceReference[];
}

/** Group the display-safe evidence for a response or document. @since 0.2.14 */
export const SourceList = /* @__PURE__ */ forwardRef<HTMLUListElement, SourceListProps>(function SourceList(
  {label, sources, density = "compact", dividers = false, className, ...props}, ref,
) {
  if (!label.trim() || sources.some(source => !source.id.trim() || !source.title.trim() || !source.source.trim()) ||
      new Set(sources.map(source => source.id)).size !== sources.length) {
    throw new Error("Flood SourceList requires a name and uniquely identified source titles and publishers");
  }
  if (!sources.length) return null;
  const hasMarkers = sources.some(source => Boolean(source.marker));
  return <DataList {...props} ref={ref} aria-label={label} density={density} dividers={dividers}
    className={classes("flood-source-list", className)} data-markers={hasMarkers || undefined}>
    {sources.map(({id, title, source, href, excerpt, marker}) =>
      <DataListItem key={id} layout="content"
        media={hasMarkers ? <Text size="helper" tone="subtle" className="flood-source-list__marker" dir="auto"
          aria-hidden={!marker || undefined}>{marker}</Text> : undefined}
        title={href ? <Link href={href} dir="auto">{title}</Link> : <Text size="label" dir="auto">{title}</Text>}
        description={<Text size="helper" tone="subtle" dir="auto">{source}</Text>}
        details={excerpt ? <Text size="compact" dir="auto">{excerpt}</Text> : undefined} />)}
  </DataList>;
});

/** Explicit opt-in to the dark foundations profile; no global theme mutation. */
export const FloodRoot = /* @__PURE__ */ forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function FloodRoot({ className, ...props }, ref) {
    return <div {...props} ref={ref} data-flood-foundations="neutral" data-flood-theme="dark" className={classes("flood-root", className)} />;
  },
);

export interface TimestampProps extends Omit<TimeHTMLAttributes<HTMLTimeElement>, "dateTime" | "children"> {
  dateTime: string;
  /** Use provided text while keeping the machine-readable dateTime. */
  children?: string;
  format?: "date" | "time" | "date-time";
  /** Format elapsed time against this explicitly zoned ISO instant. */
  relativeTo?: string;
  /** Show the localized exact date and time on hover or focus when relativeTo is supplied. */
  showExactTime?: boolean;
  /** Display time zone for absolute instants. Civil dates are never shifted. */
  timeZone?: string;
  size?: "helper" | "compact";
}

/** A semantic timestamp with localized formatting for civil dates or zoned instants. */
export const Timestamp = /* @__PURE__ */ forwardRef<HTMLTimeElement, TimestampProps>(function Timestamp(props, ref) {
  return <EventTimestamp {...props} ref={ref} />;
});

export interface NumericValueProps extends Omit<HTMLAttributes<HTMLDataElement>, "children"> {
  value: number | bigint;
  formatOptions?: Intl.NumberFormatOptions;
  /** A representative value formatted in the same font to reserve its visual width. */
  reserveFor?: number | bigint;
  align?: "start" | "end";
}

/** Locale-aware tabular numbers with optional width reservation. @since 0.2.14 */
export const NumericValue = /* @__PURE__ */ forwardRef<HTMLDataElement, NumericValueProps>(function NumericValue(
  {value, formatOptions, reserveFor, align = "end", lang, className, ...props}, ref,
) {
  if ((typeof value === "number" && !Number.isFinite(value)) ||
      (typeof reserveFor === "number" && !Number.isFinite(reserveFor))) {
    throw new RangeError("Flood NumericValue requires finite numbers");
  }
  const locale = lang || "en";
  const formatter = new Intl.NumberFormat(locale, formatOptions);
  return <data {...props} ref={ref} lang={locale} value={String(value)}
    className={classes("flood-numeric-value", className)} data-reserve={reserveFor !== undefined || undefined} data-align={align}>
    <bdi>{formatter.format(value)}</bdi>
    {reserveFor !== undefined && <bdi aria-hidden="true">{formatter.format(reserveFor)}</bdi>}
  </data>;
});

const durationUnitMilliseconds = {millisecond:1, second:1000, minute:60000, hour:3600000} as const;

export interface DurationProps extends Omit<HTMLAttributes<HTMLDataElement>, "children"> {
  /** A finite, nonnegative elapsed measurement in milliseconds. */
  milliseconds: number;
  /** Keep a shared display unit when readers compare values. */
  unit?: keyof typeof durationUnitMilliseconds;
  /** Maximum decimal places to display (0–9). Defaults to 3. */
  maximumFractionDigits?: number;
}

/** A localized elapsed measurement with the original numeric value on the data element. */
export const Duration = /* @__PURE__ */ forwardRef<HTMLDataElement, DurationProps>(function Duration(
  {milliseconds, unit = "millisecond", maximumFractionDigits = 3, lang = "en", className, ...props}, ref,
) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    throw new RangeError("Flood Duration requires finite nonnegative milliseconds");
  }
  if (!Number.isInteger(maximumFractionDigits) || maximumFractionDigits < 0 || maximumFractionDigits > 9) {
    throw new RangeError("Flood Duration requires maximumFractionDigits from 0 through 9");
  }
  const duration = Math.abs(milliseconds) / durationUnitMilliseconds[unit];
  const step = 10 ** -maximumFractionDigits;
  const belowPrecision = milliseconds > 0 && duration < step / 2;
  const display = new Intl.NumberFormat(lang, {style:"unit", unit, maximumFractionDigits})
    .format(belowPrecision ? step : duration);
  return <data {...props} ref={ref} lang={lang} className={classes("flood-duration", className)} value={milliseconds}>
    {belowPrecision ? `< ${display}` : display}
  </data>;
});

export interface RecoveryWindowProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Inclusive recovery bounds as ISO timestamps with explicit offsets. */
  earliest: string;
  latest: string;
  /** Candidate instant supplied by the host's restore form. */
  selected?: string;
  timeZone?: string;
  timeZoneLabel?: string;
  labels?: Partial<Record<"earliest" | "latest" | "selected" | "outside", string>>;
}

/** Inspect an inclusive recovery interval and an optional selected instant. @since 0.2.14 */
export const RecoveryWindow = /* @__PURE__ */ forwardRef<HTMLDivElement, RecoveryWindowProps>(function RecoveryWindow(
  {earliest, latest, selected, timeZone = "UTC", timeZoneLabel = timeZone, labels, className, lang, ...props}, ref,
) {
  const start = parseInstant(earliest, "RecoveryWindow").getTime();
  const end = parseInstant(latest, "RecoveryWindow").getTime();
  if (start > end) throw new RangeError("Flood RecoveryWindow requires ordered bounds");
  const point = selected === undefined ? undefined : parseInstant(selected, "RecoveryWindow").getTime();
  const outside = point !== undefined && (point < start || point > end);
  const marker = point === undefined || outside ? undefined : start === end ? 50 : (point - start) / (end - start) * 100;
  const formatTime = new Intl.DateTimeFormat(lang || "en", {timeZone, dateStyle:"medium", timeStyle:"medium"});
  return <Stack {...props} ref={ref} lang={lang} gap="3" className={classes("flood-recovery-window", className)}>
    <div className="flood-recovery-window__rail" aria-hidden="true"
      style={marker === undefined ? undefined : {"--flood-recovery-point": `${marker}%`} as CSSProperties}>
      {marker !== undefined && <span className="flood-recovery-window__point" />}
    </div>
    <Grid columns={2} gap="3" className="flood-recovery-window__bounds">
      <Stack gap="1">
        <Text size="helper" tone="subtle">{labels?.earliest ?? "Earliest"}</Text>
        <Timestamp dateTime={earliest} lang={lang} size="compact">{formatTime.format(start)}</Timestamp>
      </Stack>
      <Stack gap="1">
        <Text size="helper" tone="subtle">{labels?.latest ?? "Latest"}</Text>
        <Timestamp dateTime={latest} lang={lang} size="compact">{formatTime.format(end)}</Timestamp>
      </Stack>
    </Grid>
    <Inline gap="2" align="baseline">
      {selected !== undefined && point !== undefined && <>
        <Text size="helper" tone="subtle">{labels?.selected ?? "Selected"}</Text>
        <Timestamp dateTime={selected} lang={lang} size="compact">{formatTime.format(point)}</Timestamp>
      </>}
      <Text size="helper" tone="subtle">{timeZoneLabel}</Text>
      {outside && <Badge tone="warning">{labels?.outside ?? "Outside recovery window"}</Badge>}
    </Inline>
  </Stack>;
});

const dataFreshnessAppearance = {
  current: { label: "Up to date", tone: "neutral" },
  delayed: { label: "Update delayed", tone: "warning" },
  refreshing: { label: "Updating", tone: "neutral" },
  failed: { label: "Update failed", tone: "error" },
  pending: { label: "Awaiting first update", tone: "neutral" },
} as const;

export type DataFreshnessState = keyof typeof dataFreshnessAppearance;

export interface DataFreshnessProps extends Omit<InlineProps, "children" | "gap" | "align"> {
  state: DataFreshnessState;
  /** Explicitly zoned ISO instant when the data now on screen was last accepted. */
  updatedAt?: string;
  /** Explicitly zoned reference instant for relative time. */
  relativeTo?: string;
  timeZone?: string;
  labels?: {
    state?: string;
    lastUpdated?: string;
  };
}

/** The host's update status alongside the time of the available data. @since 0.2.14 */
export const DataFreshness = /* @__PURE__ */ forwardRef<HTMLDivElement, DataFreshnessProps>(function DataFreshness(
  { state, updatedAt, relativeTo, timeZone, labels, lang, dir, ...props }, ref,
) {
  const appearance = dataFreshnessAppearance[state];
  return <Inline {...props} ref={ref} lang={lang} dir={dir} gap="2" align="center">
    <StatusIndicator size="sm" tone={appearance.tone} label={labels?.state ?? appearance.label} presentation="wrap" />
    {updatedAt && <Text as="span" size="helper" tone="subtle">
      {labels?.lastUpdated ?? "Last updated"}{" "}
      <Timestamp dateTime={updatedAt} relativeTo={relativeTo} showExactTime timeZone={timeZone}
        format="date-time" lang={lang} dir={dir} />
    </Text>}
  </Inline>;
});

export interface TimestampLinkProps extends Omit<LinkProps, "children" | "href" | "size" | "variant">,
  Pick<TimestampProps, "dateTime" | "children" | "format" | "relativeTo" | "timeZone" | "size"> {
  /** A stable record route or document fragment supplied by the host. */
  href: string;
}

/** Date or time metadata that opens a specific record. @since 0.2.14 */
export const TimestampLink = /* @__PURE__ */ forwardRef<HTMLAnchorElement, TimestampLinkProps>(function TimestampLink(
  {dateTime, children, format, relativeTo, timeZone, size, lang, className, ...props}, ref,
) {
  return <Link {...props} ref={ref} lang={lang} className={classes("flood-timestamp-link", className)}>
    <Timestamp dateTime={dateTime} format={format} relativeTo={relativeTo} timeZone={timeZone} size={size} lang={lang}>
      {children}
    </Timestamp>
  </Link>;
});

export type DeadlineStatusState = "remaining" | "due-soon" | "due-now" | "overdue" | "paused";

export interface DeadlineStatusProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** ISO date and time with an explicit UTC offset. */
  deadline: string;
  /** ISO instant supplied by the host for consistent server rendering and updates. */
  now: string;
  paused?: boolean;
  /** Optional product threshold. Remaining time at or below this threshold is due soon. */
  warningWithinMinutes?: number;
  /** Zone used to show the exact deadline. The timestamp's original offset determines its instant. */
  timeZone?: string;
  size?: ContentSize;
  presentation?: "label" | "chip";
  /** Visually hide the exact time in a cell where it is already visible nearby. */
  showDeadline?: boolean;
  /** Localize or override the visible state. Duration is empty for paused and due-now. */
  formatStatus?: (state: DeadlineStatusState, duration: string) => string;
  deadlineLabel?: string;
}

/** A deadline's remaining, overdue, or paused state beside its exact time. @since 0.2.14 */
export const DeadlineStatus = /* @__PURE__ */ forwardRef<HTMLSpanElement, DeadlineStatusProps>(function DeadlineStatus(props, ref) {
  return <DueStatus {...props} ref={ref}/>;
});

export type TemporaryAccessLinkState =
  | {status: "issued"; url: string; expiresAt: string}
  | {status: "unavailable"; reason?: string};

export interface TemporaryAccessLinkProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  /** A display name for the file or destination. */
  resource: string;
  access: "download" | "upload";
  state: TemporaryAccessLinkState;
  /** The host supplies and updates the reference instant used for expiration. */
  now: string;
  timeZone?: string;
  labels?: {
    download?: string;
    upload?: string;
    unavailable?: string;
    expired?: string;
    expiry?: string;
    expiresIn?: (duration: string) => string;
    copy?: string;
    copied?: string;
    copyError?: string;
  };
}

/** Copy one issued temporary access link and inspect its scope and expiration. @since 0.2.14 */
export const TemporaryAccessLink = /* @__PURE__ */ forwardRef<HTMLDivElement, TemporaryAccessLinkProps>(function TemporaryAccessLink(
  {resource, access, state, now, timeZone, labels, lang, ...props}, ref,
) {
  if (!resource.trim()) throw new Error("Flood TemporaryAccessLink requires a resource name");
  const issued = state.status === "issued";
  if (issued) {
    const protocol = URL.canParse(state.url) && new URL(state.url).protocol;
    if (protocol !== "http:" && protocol !== "https:") {
      throw new Error("Flood TemporaryAccessLink requires an HTTP(S) address");
    }
  }
  const active = issued && parseInstant(state.expiresAt, "TemporaryAccessLink") > parseInstant(now, "TemporaryAccessLink");
  const resourceId = useId();
  return <Inline {...props} ref={ref} lang={lang} gap="3" align="center" role="group"
    aria-labelledby={props["aria-label"] ? undefined : props["aria-labelledby"] ?? resourceId}>
    <Stack gap="2" style={{flex:"1 1 14rem", minInlineSize:0}}>
      <Stack gap="1">
        <Text size="label" id={resourceId} style={{overflowWrap:"anywhere"}} dir="auto">{resource}</Text>
        <Text size="helper" tone="subtle">
          {access === "download" ? labels?.download ?? "Anyone with the link can download this file."
            : labels?.upload ?? "Anyone with the link can upload to this destination."}
        </Text>
      </Stack>
      {issued ? <DeadlineStatus deadline={state.expiresAt} now={now} lang={lang} timeZone={timeZone}
        size="sm" warningWithinMinutes={5} deadlineLabel={labels?.expiry ?? "Expiration"}
        formatStatus={(_, duration) => active ? labels?.expiresIn?.(duration) ?? `Expires in ${duration}` : labels?.expired ?? "Expired"} />
        : <Text size="compact" tone="subtle">{state.reason ?? labels?.unavailable ?? "Link unavailable."}</Text>}
    </Stack>
    <CopyButton size="sm" value={active ? state.url : ""} aria-disabled={!active || undefined}
      tabIndex={active ? undefined : -1} copyLabel={labels?.copy ?? "Copy link"}
      copiedLabel={labels?.copied} errorLabel={labels?.copyError} />
  </Inline>;
});

export type ServiceLevelTargetState =
  | {phase: "running"; deadline: string; warningWithinMinutes?: number}
  | {phase: "paused"; reason?: string}
  | {phase: "met" | "missed"; completedAt?: string};

export interface ServiceLevelTarget {
  id: string;
  label: string;
  state: ServiceLevelTargetState;
}

export interface ServiceLevelTargetsProps extends Omit<DataListProps, "children" | "aria-label" | "reserveSelectionSpace"> {
  label: string;
  targets: readonly ServiceLevelTarget[];
  /** The shared clock instant, with an explicit UTC offset. */
  now: string;
  timeZone?: string;
  labels?: {
    paused?: string;
    met?: string;
    missed?: string;
    completedAt?: string;
    deadline?: string;
    formatDeadline?: DeadlineStatusProps["formatStatus"];
  };
  emptyContent?: ReactNode;
}

const serviceLevelOutcomes = {
  paused:{label:"Paused",tone:"neutral"},
  met:{label:"Met",tone:"success"},
  missed:{label:"Missed",tone:"error"},
} as const;

/** Inspect the timing and outcomes of a record's service-level targets. @since 0.2.14 */
export const ServiceLevelTargets = /* @__PURE__ */ forwardRef<HTMLUListElement, ServiceLevelTargetsProps>(function ServiceLevelTargets(
  {label, targets, now, timeZone = "UTC", labels, emptyContent, density = "compact", dividers = false, lang, ...props}, ref,
) {
  if (!label.trim() || targets.some(target => !target.id.trim() || !target.label.trim()) ||
      new Set(targets.map(target => target.id)).size !== targets.length) {
    throw new Error("Flood ServiceLevelTargets requires a name and uniquely identified targets");
  }
  return <DataList {...props} ref={ref} aria-label={label} density={density} dividers={dividers} lang={lang}>
    {targets.length ? targets.map(({id,label,state}) => {
      const completedAt = (state.phase === "met" || state.phase === "missed") ? state.completedAt : undefined;
      const running = state.phase === "running";
      const detailTime = running ? state.deadline : completedAt;
      return <DataListItem key={id} layout="content"
        title={<Text size="compact" dir="auto">{label}</Text>}
        description={state.phase === "paused" && state.reason
          ? <Text size="compact" tone="subtle" dir="auto">{state.reason}</Text> : undefined}
        details={detailTime && <Inline gap="1" aria-hidden={running || undefined}>
          <Text size="helper" tone="subtle">{running ? labels?.deadline ?? "Deadline" : labels?.completedAt ?? "Completed"}</Text>
          <Timestamp dateTime={detailTime} format="date-time" timeZone={timeZone} lang={lang} />
        </Inline>}
        metadata={running
          ? <DeadlineStatus deadline={state.deadline} now={now} warningWithinMinutes={state.warningWithinMinutes}
              size="sm" lang={lang} timeZone={timeZone} deadlineLabel={labels?.deadline} formatStatus={labels?.formatDeadline}
              showDeadline={false} />
          : <StatusIndicator size="sm" presentation="wrap" label={labels?.[state.phase] ?? serviceLevelOutcomes[state.phase].label}
              tone={serviceLevelOutcomes[state.phase].tone} />}
      />;
    }) : hasFieldContent(emptyContent) ? <li>{emptyContent}</li> : null}
  </DataList>;
});

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: "span" | "p" | "div";
  size?: "lead" | "body" | "compact" | "label" | "helper";
  tone?: "default" | "subtle" | "error" | "success" | "warning" | "info";
  /** Prefer more even paragraph endings where the browser supports pretty wrapping. */
  wrap?: "pretty";
}
export const Text = /* @__PURE__ */ forwardRef<HTMLElement, TextProps>(function Text(
  { as = "span", size = "body", tone = "default", wrap, className, ...props }, ref,
) {
  return createElement(as, { ...props, ref, "data-wrap":wrap, className: classes("flood-text", `flood-type--${size}`, `flood-tone--${tone}`, className) });
});

export interface ExpandableTextProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: string;
  lines?: number;
  size?: TextProps["size"];
  tone?: TextProps["tone"];
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  moreLabel?: string;
  lessLabel?: string;
}

export interface HighlightTextProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  children: string;
  query: string;
  caseSensitive?: boolean;
}

/** Marks literal search matches while preserving the original plain text. */
export const HighlightText = /* @__PURE__ */ forwardRef<HTMLSpanElement, HighlightTextProps>(function HighlightText(
  {children, query, caseSensitive = false, className, ...props}, ref,
) {
  const literal = query.trim();
  const pieces: ReactNode[] = [];
  if (literal) {
    const pattern = literalMatchPattern(literal, caseSensitive ? "gu" : "giu");
    let start = 0;
    for (const match of children.matchAll(pattern)) {
      const index = match.index!;
      pieces.push(children.slice(start, index), <mark key={index}>{match[0]}</mark>);
      start = index + match[0].length;
    }
    pieces.push(children.slice(start));
  }
  return <span {...props} ref={ref} className={classes("flood-highlight-text", className)}>{literal ? pieces : children}</span>;
});
/** A plain-text excerpt that can reveal its full passage in place. */
export const ExpandableText = /* @__PURE__ */ forwardRef<HTMLDivElement, ExpandableTextProps>(function ExpandableText(props, ref) {
  return <ExpandableParagraph {...props} ref={ref} />;
});

export interface TruncatedTextProps extends Pick<HTMLAttributes<HTMLSpanElement>, "id" | "className" | "style" | "dir" | "lang" | "hidden"> {
  children: string;
  /** Keep this many trailing characters when the value needs truncation. */
  preserveEnd?: number;
  /** Preferred tooltip side. The overlay can flip at the viewport edge. */
  tooltipSide?: TooltipProps["side"];
}

/** One line of plain text with full-value disclosure when the line is clipped. */
export const TruncatedText = /* @__PURE__ */ forwardRef<HTMLSpanElement, TruncatedTextProps>(function TruncatedText(props, ref) {
  return <OverflowingText {...props} ref={ref} />;
});

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: "display" | "large" | "page" | "section" | "group";
  /** Balance line lengths in a short, multiline title. */
  wrap?: "balance";
}
export const Heading = /* @__PURE__ */ forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level = 2, size = "page", wrap, className, ...props }, ref,
) {
  return createElement(`h${level}`, { ...props, ref, "data-wrap":wrap, className: classes("flood-heading", `flood-type--${size}`, className) });
});

export type Space = "0" | "1" | "2" | "3" | "4" | "6" | "8" | "12";
export interface LayoutProps extends HTMLAttributes<HTMLDivElement> {
  gap?: Space;
}
export const Stack = /* @__PURE__ */ forwardRef<HTMLDivElement, LayoutProps>(function Stack(
  { gap = "4", style, className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={classes("flood-stack", className)} style={{ "--flood-layout-gap": `var(--flood-sys-space-${gap})`, ...style } as CSSProperties} />;
});
export interface InlineProps extends LayoutProps {
  align?: "start" | "center" | "end" | "baseline";
}
export const Inline = /* @__PURE__ */ forwardRef<HTMLDivElement, InlineProps>(function Inline(
  { gap = "2", align = "center", style, className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={classes("flood-inline", className)} style={{ "--flood-layout-gap": `var(--flood-sys-space-${gap})`, alignItems: align === "start" ? "flex-start" : align === "end" ? "flex-end" : align, ...style } as CSSProperties} />;
});
export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: "default" | "raised" | "overlay";
  padding?: Space;
}
export const Surface = /* @__PURE__ */ forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { elevation = "default", padding = "6", style, className, ...props }, ref,
) {
  return <div {...props} ref={ref} data-flood-elevation={elevation} className={classes("flood-surface", className)} style={{ background: `var(--flood-sys-color-surface-${elevation})`, padding: `var(--flood-sys-space-${padding})`, ...style }} />;
});

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "full";
  gutter?: Space;
}
/** Centered content with logical gutters; max width includes padding. @since 0.2.4 */
export const Container = /* @__PURE__ */ forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { size = "lg", gutter = "6", className, style, ...props }, ref,
) {
  return <div {...props} ref={ref} className={classes("flood-container", className)} style={{
    "--flood-container-max": size === "full" ? "none" : `var(--flood-sys-size-container-${size})`,
    "--flood-container-gutter": `var(--flood-sys-space-${gutter})`, ...style,
  } as CSSProperties} />;
});
export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  /** Maximum number of responsive columns. Explicit columns takes precedence. */
  maxColumns?: number;
  minItemWidth?: string;
  gap?: Space;
}
/** Auto-fit by default; explicit columns retain their count at every width. @since 0.2.4 */
export const Grid = /* @__PURE__ */ forwardRef<HTMLDivElement, GridProps>(function Grid(
  { columns, maxColumns, minItemWidth, gap = "4", className, style, ...props }, ref,
) {
  const limit = columns === undefined ? maxColumns : undefined;
  if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1)) {
    throw new RangeError("Flood Grid maxColumns must be a positive integer");
  }
  return <div {...props} ref={ref} data-column-limit={limit} className={classes("flood-grid", className)} style={{
    gridTemplateColumns: columns ? `repeat(${columns}, minmax(0, 1fr))` : undefined,
    "--flood-grid-min": minItemWidth, "--flood-layout-gap": `var(--flood-sys-space-${gap})`,
    "--flood-grid-limit": limit, ...style,
  } as CSSProperties} />;
});
export interface VisuallyHiddenProps extends HTMLAttributes<HTMLElement> {
  as?: "span" | "div";
  focusable?: boolean;
}
/** Nonvisual content, with optional reveal when a descendant receives focus. @since 0.2.4 */
export const VisuallyHidden = /* @__PURE__ */ forwardRef<HTMLElement, VisuallyHiddenProps>(function VisuallyHidden(
  { as = "span", focusable = false, className, ...props }, ref,
) {
  const hiddenRef = useFocusableHidden<HTMLElement>(focusable, ref);
  return createElement(as, { ...props, ref: hiddenRef, className: classes(focusable ? "flood-visually-hidden--focusable" : "flood-visually-hidden", className) });
});
export interface AspectRatioProps extends HTMLAttributes<HTMLDivElement> {
  ratio?: number;
}
/** Reserve media geometry. Child content may overflow rather than being clipped. @since 0.2.4 */
export const AspectRatio = /* @__PURE__ */ forwardRef<HTMLDivElement, AspectRatioProps>(function AspectRatio(
  { ratio = 16 / 9, className, style, children, ...props }, ref,
) {
  if (!Number.isFinite(ratio) || ratio <= 0) throw new RangeError("Flood AspectRatio requires a finite positive ratio");
  return <div {...props} ref={ref} className={classes("flood-aspect-ratio", className)} style={{ aspectRatio: String(ratio), ...style }}>
    <div className="flood-aspect-ratio__content">{children}</div>
  </div>;
});

export type GenerationPreviewResult =
  | {state: "queued" | "cancelled"; media?: never; message?: string}
  | {state: "generating"; media?: ReactNode; message?: string}
  | {state: "ready"; media: ReactNode; message?: string}
  | {state: "failed"; media?: never; message?: string};

export interface GenerationPreviewProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  title: string;
  result: GenerationPreviewResult;
  ratio?: number;
  actions?: ReactNode;
  announce?: boolean;
  headingLevel?: CardProps["headingLevel"];
  elevation?: CardProps["elevation"];
}

const generationLabels = {
  queued:"Queued", generating:"Generating…", ready:"Ready",
  failed:"Generation failed", cancelled:"Generation cancelled",
} as const;

/** A reserved frame for a partial or final result from an asynchronous generator. @since 0.2.14 */
export const GenerationPreview = /* @__PURE__ */ forwardRef<HTMLDivElement, GenerationPreviewProps>(function GenerationPreview(
  {title, result, ratio, actions, announce = false, headingLevel, elevation, className, ...props}, ref,
) {
  const {state, media, message = generationLabels[result.state]} = result;
  const pending = state === "queued" || state === "generating";
  const preview = hasFieldContent(media) ? media : pending
    ? <Skeleton shape="rounded" height="100%" animate={state === "generating"}/>
    : state === "ready" ? null : <Center className="flood-generation-preview__empty">
        <IconSlot size="lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {state === "failed" ? <path d="m7 7 10 10M17 7 7 17"/> : <rect x="7" y="7" width="10" height="10" rx="2"/>}
        </svg></IconSlot>
      </Center>;
  return <Card {...props} ref={ref} className={classes("flood-generation-preview",className)}
    data-state={state} title={title} headingLevel={headingLevel} headingSize="group" density="compact" elevation={elevation}
    actions={actions}
    description={<Text size="compact" tone={state === "failed" ? "error" : "subtle"}
      role={announce ? "status" : undefined}>{message}</Text>}
    media={<AspectRatio ratio={ratio} className="flood-generation-preview__frame" aria-busy={pending || undefined}>
      {preview}
    </AspectRatio>}/>;
});

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "alt"> {
  alt: string;
  fit?: "cover" | "contain";
}
/** Native image semantics, explicit alternative text and bounded media fitting. @since 0.2.4 */
export const Image = /* @__PURE__ */ forwardRef<HTMLImageElement, ImageProps>(function Image(
  { alt, fit = "cover", className, ...props }, ref,
) {
  if (typeof alt !== "string") throw new TypeError("Flood Image requires explicit alt text (empty for decorative images)");
  return <img {...props} ref={ref} alt={alt} data-fit={fit} className={classes("flood-image", className)} />;
});
export interface FilteredImageProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  image: Pick<ImageProps, "alt" | "srcSet" | "sizes" | "fit" | "loading"> & {src: string};
  /** Width-to-height ratio of the tile in both visible modes. */
  ratio?: number;
  visibility: "show" | "blur" | "hide";
  /** A display-safe replacement for the real image description while blurred. */
  blurredLabel?: string;
}

/** Apply a viewer's preferred presentation to a classified image. @since 0.2.14 */
export const FilteredImage = /* @__PURE__ */ forwardRef<HTMLDivElement, FilteredImageProps>(function FilteredImage(
  {image, ratio = 1, visibility, blurredLabel = "Image blurred", className, ...props}, ref,
) {
  if (visibility === "hide") return null;
  const blurred = visibility === "blur";
  if (blurred && !blurredLabel.trim()) throw new Error("Flood FilteredImage requires a name for the blurred image");
  return <AspectRatio {...props} ratio={ratio} ref={ref}
    className={classes("flood-filtered-image", className)} data-visibility={visibility}
    role={blurred ? "img" : undefined} aria-label={blurred ? blurredLabel : props["aria-label"]}
    aria-labelledby={blurred ? undefined : props["aria-labelledby"]}>
    <Image {...image} alt={blurred ? "" : image.alt} aria-hidden={blurred || undefined} />
    {blurred && <Badge size="sm" className="flood-filtered-image__label" aria-hidden="true">
      {blurredLabel}
    </Badge>}
  </AspectRatio>;
});

export interface ImageAltTextEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Preview image with accessible text independent of the draft. */
  image: Pick<ImageProps, "alt" | "srcSet" | "sizes"> & {src: string; width: number; height: number};
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Optional Unicode code-point limit from the host's publishing contract. */
  maxCharacters?: number;
  hint?: string;
  error?: string;
  labels?: {characters?: string; overLimit?: string};
}

/** Edit an image's alternative text alongside a contained preview. */
export const ImageAltTextEditor = /* @__PURE__ */ forwardRef<HTMLDivElement, ImageAltTextEditorProps>(function ImageAltTextEditor(
  {image, value, onValueChange, label = "Alt text", name, required, disabled, readOnly,
    maxCharacters, hint, error, labels, className, lang, ...props}, ref,
) {
  const fieldId = useId();
  const count = maxCharacters === undefined ? 0 : [...value].length;
  const overLimit = maxCharacters !== undefined && count > maxCharacters;
  return <Grid {...props} ref={ref} lang={lang} maxColumns={2} minItemWidth="14rem" gap="4"
    className={classes("flood-image-alt-text-editor", className)}>
    <Image {...image} fit="contain" className="flood-image-alt-text-editor__preview" />
    <Field id={fieldId} label={label} required={required} error={error} status={overLimit ? "error" : undefined}
      hint={(hint || maxCharacters !== undefined) && <Stack gap="1">
        {hint && <Text size="helper" tone="subtle">{hint}</Text>}
        {maxCharacters !== undefined && <CharacterCount count={count} max={maxCharacters} htmlFor={fieldId} lang={lang}
          label={labels?.characters} overLimitLabel={labels?.overLimit} />}
      </Stack>}>
      {field => <Textarea {...field} name={name} value={value} disabled={disabled} readOnly={readOnly}
        rows={4} autoGrow dir="auto" onChange={event => onValueChange(event.currentTarget.value)} />}
    </Field>
  </Grid>;
});

export interface ImageAnnotationPoint {
  id: string;
  label: string;
  /** Fraction of the image width measured from its physical left edge. */
  x: number;
  /** Fraction of the image height measured from its top edge. */
  y: number;
}

export interface ImageAnnotationsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  label: string;
  image: Pick<ImageProps, "alt" | "srcSet" | "sizes"> & {src: string; width: number; height: number};
  annotations: readonly ImageAnnotationPoint[];
  activeId?: string;
  onAnnotationSelect: (id: string) => void;
}

/** Select a review point on an image at its original aspect ratio. */
export const ImageAnnotations = /* @__PURE__ */ forwardRef<HTMLDivElement, ImageAnnotationsProps>(function ImageAnnotations(
  {label, image, annotations, activeId, onAnnotationSelect, className, ...props}, ref,
) {
  const coordinate = (value: number) => Number.isFinite(value) && value >= 0 && value <= 1;
  if (!label.trim() || !image.src.trim() || ![image.width, image.height].every(value => Number.isFinite(value) && value > 0)) {
    throw new Error("Flood ImageAnnotations requires a label and positive image dimensions");
  }
  if (new Set(annotations.map(point => point.id)).size !== annotations.length ||
      annotations.some(point => !point.id.trim() || !point.label.trim() || !coordinate(point.x) || !coordinate(point.y))) {
    throw new Error("Flood ImageAnnotations requires unique point IDs, labels and normalized coordinates");
  }
  return <div {...props} ref={ref} role="group" aria-label={label} className={classes("flood-image-annotations", className)}>
    <AspectRatio ratio={image.width / image.height} className="flood-image-annotations__frame">
      <Image {...image} fit="contain" />
      {annotations.map(({id, label: name, x, y}, index) =>
        <span key={id} className="flood-image-annotations__point" style={{left:`${x * 100}%`, top:`${y * 100}%`}}>
          <IconButton size="xs" variant="solid" label={`${index + 1}. ${name}`} title={name}
            aria-pressed={activeId === id} onClick={() => onAnnotationSelect(id)}>{index + 1}</IconButton>
        </span>)}
    </AspectRatio>
  </div>;
});

export interface ImageFocalPointValue {
  /** Fraction of the image width measured from its physical left edge. */
  x: number;
  /** Fraction of the image height measured from its top edge. */
  y: number;
}

export interface ImageFocalPointProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  label: string;
  horizontalLabel: string;
  verticalLabel: string;
  image: ImageAnnotationsProps["image"];
  value: ImageFocalPointValue;
  onValueChange: (value: ImageFocalPointValue) => void;
  disabled?: boolean;
}

/** Choose the region of an image to prioritize in responsive crops. */
export const ImageFocalPoint = /* @__PURE__ */ forwardRef<HTMLDivElement, ImageFocalPointProps>(function ImageFocalPoint(
  { label, horizontalLabel, verticalLabel, image, value, onValueChange, disabled, className, ...props }, ref,
) {
  if (![image.width, image.height].every(dimension => Number.isFinite(dimension) && dimension > 0) ||
      ![value.x, value.y].every(coordinate => Number.isFinite(coordinate) && coordinate >= 0 && coordinate <= 1)) {
    throw new RangeError("Flood ImageFocalPoint requires positive image dimensions and normalized coordinates");
  }
  const placePoint = ({currentTarget, clientX, clientY}: ReactMouseEvent<HTMLDivElement>) => {
    const bounds = currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const fraction = (offset: number, extent: number) => Math.min(100, Math.max(0, Math.round(offset / extent * 100))) / 100;
    onValueChange({x: fraction(clientX - bounds.left, bounds.width), y: fraction(clientY - bounds.top, bounds.height)});
  };
  return <Stack {...props} ref={ref} gap="3" role="group" aria-label={label} className={classes("flood-image-focal-point", className)}>
    <AspectRatio ratio={image.width / image.height} className="flood-image-focal-point__frame">
      <div className="flood-image-focal-point__target" data-editable={!disabled || undefined} onClick={disabled ? undefined : placePoint}>
        <Image {...image} fit="contain" draggable={false}/>
        <span aria-hidden="true" className="flood-image-focal-point__mark" style={{left:`${value.x * 100}%`, top:`${value.y * 100}%`}}/>
      </div>
    </AspectRatio>
    <Grid maxColumns={2} minItemWidth="9rem" gap="3">
      <Slider label={horizontalLabel} controlSize="sm" value={[Math.round(value.x * 100)]} disabled={disabled}
        valuePlacement="inline" formatValue={number => `${number}%`} onValueChange={([x]) => onValueChange({...value, x:x / 100})}/>
      <Slider label={verticalLabel} controlSize="sm" value={[Math.round(value.y * 100)]} disabled={disabled}
        valuePlacement="inline" formatValue={number => `${number}%`} onValueChange={([y]) => onValueChange({...value, y:y / 100})}/>
    </Grid>
  </Stack>;
});

export interface ImageComparisonSource extends Pick<ImageProps, "src" | "alt" | "srcSet" | "sizes"> {
  src: string;
  /** Visible label for this version, such as Original or Revised. */
  label: string;
}
export interface ImageComparisonProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "defaultValue"> {
  before: ImageComparisonSource;
  after: ImageComparisonSource;
  /** Accessible slider label. The value controls the before image's visible width or opacity. */
  label: string;
  mode?: "swipe" | "overlay";
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  ratio?: number;
  fit?: ImageProps["fit"];
  disabled?: boolean;
}
/** Compare two aligned images in a fixed frame with a split or a blend. */
export const ImageComparison = /* @__PURE__ */ forwardRef<HTMLDivElement, ImageComparisonProps>(function ImageComparison(
  {before, after, label, mode = "swipe", value, defaultValue = 50, onValueChange, ratio, fit = "contain", disabled, className, ...props}, ref,
) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const position = value ?? localValue;
  if (!Number.isFinite(position)) throw new RangeError("Flood ImageComparison requires a finite value");
  if (![before, after].every(image => image.src.trim() && image.alt.trim() && image.label.trim())) {
    throw new Error("Flood ImageComparison requires two image sources with alt text and visible labels");
  }
  const percent = Math.min(100, Math.max(0, Math.round(position)));
  const {label:beforeLabel, ...beforeImage} = before;
  const {label:afterLabel, ...afterImage} = after;
  const swipe = mode === "swipe";
  const slider = <Slider label={label} hideLabel showValue={false} disabled={disabled} value={[percent]}
    className={swipe ? "flood-image-comparison__control" : "flood-image-comparison__blend"}
    onValueChange={([next]) => {
      if (value === undefined) setLocalValue(next);
      onValueChange?.(next);
    }}/>;
  return <div {...props} ref={ref} data-comparison-mode={mode} className={classes("flood-image-comparison", className)}>
    <AspectRatio ratio={ratio} className="flood-image-comparison__frame"
      style={{"--flood-comparison-position":`${percent}%`, "--flood-comparison-after-opacity": (100 - percent) / 100} as CSSProperties}>
      <Image {...beforeImage} fit={fit} draggable={false}/>
      <Image {...afterImage} fit={fit} draggable={false} className="flood-image-comparison__after"/>
      {swipe && <>
        <span className="flood-image-comparison__divider" aria-hidden="true"/>
        <span className="flood-image-comparison__grip" aria-hidden="true">
          <IconSlot><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m9 7-5 5 5 5m6-10 5 5-5 5"/></svg></IconSlot>
        </span>
        {slider}
      </>}
    </AspectRatio>
    {!swipe && slider}
    <Inline align="baseline" gap="3" className="flood-image-comparison__labels">
      <Text size="helper" tone="subtle">{swipe ? beforeLabel : afterLabel}</Text>
      <Text size="helper" tone="subtle">{swipe ? afterLabel : beforeLabel}</Text>
    </Inline>
  </div>;
});
export interface ListProps extends Omit<HTMLAttributes<HTMLUListElement | HTMLOListElement>, "role"> {
  ordered?: boolean;
  start?: number;
  reversed?: boolean;
  marker?: boolean;
  gap?: Space;
}
/** Native list items supplied by the host; hidden markers retain list semantics. @since 0.2.4 */
export const List = /* @__PURE__ */ forwardRef<HTMLUListElement | HTMLOListElement, ListProps>(function List(
  { ordered = false, start, reversed, marker = true, gap = "2", className, style, ...props }, ref,
) {
  if (start !== undefined && !Number.isSafeInteger(start)) throw new RangeError("Flood List start requires a safe integer");
  return createElement(ordered ? "ol" : "ul", { ...props, ref, start: ordered ? start : undefined,
    reversed: ordered ? reversed : undefined, role: marker ? undefined : "list", "data-marker": marker,
    className: classes("flood-list", className), style: { "--flood-layout-gap": `var(--flood-sys-space-${gap})`, ...style } as CSSProperties });
});
export interface MasonryProps extends Omit<ListProps, "ordered" | "start" | "reversed" | "marker"> {
  /** Minimum preferred width per column. The layout may use one narrower column. */
  minColumnWidth?: string;
  maxColumns?: number;
}

/** A responsive column-first layout for lists of items with unequal heights. */
export const Masonry = /* @__PURE__ */ forwardRef<HTMLUListElement | HTMLOListElement, MasonryProps>(function Masonry(
  {minColumnWidth = "14rem", maxColumns = 4, gap = "3", className, style, ...props}, ref,
) {
  if (!Number.isSafeInteger(maxColumns) || maxColumns < 1) {
    throw new RangeError("Flood Masonry maxColumns must be a positive integer");
  }
  return <List {...props} ref={ref} marker={false} gap={gap}
    className={classes("flood-masonry", className)}
    style={{columnWidth:minColumnWidth, columnCount:maxColumns, ...style}} />;
});

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  density?: "compact" | "comfortable";
  layout?: "centered" | "inline" | "row";
}

function ContentStateFrame({
  layout, density, marker, title, description, actions, announce, rootRef, className, ...props
}: Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> &
    Pick<EmptyStateProps, "layout" | "density" | "description" | "actions"> & {
      marker?: ReactNode; title: ReactNode; announce?: boolean; rootRef: Ref<HTMLDivElement>;
    }) {
  const intro = <Stack gap="1" className="flood-empty-state__intro" role={announce ? "status" : undefined}>
    {title}
    {hasFieldContent(description) && <Text as="div" size="compact" tone="subtle">{description}</Text>}
  </Stack>;
  const commands = hasFieldContent(actions) && <Inline gap="2" className="flood-empty-state__actions">{actions}</Inline>;
  return <Stack {...props} ref={rootRef} gap="4" data-density={density} data-layout={layout} className={classes("flood-content-state", className)}>
    {marker && <div className="flood-empty-state__icon">{marker}</div>}
    {layout === "row" ? <Inline align="center" gap="3" className="flood-empty-state__row">{intro}{commands}</Inline> : <>{intro}{commands}</>}
  </Stack>;
}

/** Static empty content, not loading, an error boundary or a live announcement. @since 0.2.4 */
export const EmptyState = /* @__PURE__ */ forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { title, icon, headingLevel = 2, density = "comfortable", layout = "centered", className, ...props }, ref,
) {
  if (typeof title !== "string" || !title.trim()) throw new Error("Flood EmptyState requires a nonempty title");
  const compactLayout = layout !== "centered";
  return <ContentStateFrame {...props} rootRef={ref} layout={layout} density={density} className={classes("flood-empty-state", className)}
    title={<Heading level={headingLevel} size={compactLayout ? "group" : "section"}>{title}</Heading>}
    marker={hasFieldContent(icon) && <IconSlot size={compactLayout ? "sm" : density === "compact" ? "lg" : "2xl"}>{icon}</IconSlot>} />;
});

export interface NoResultsProps extends Omit<EmptyStateProps, "title" | "actions"> {
  title?: string;
  onReset?: () => void;
  resetLabel?: string;
  /** A persistent input or filter control that receives focus before results change. */
  resetFocusRef?: RefObject<HTMLElement | null>;
}

/** An empty result set after narrowing an existing collection. */
export const NoResults = /* @__PURE__ */ forwardRef<HTMLDivElement, NoResultsProps>(function NoResults(
  {title = "No results", onReset, resetLabel = "Clear filters", resetFocusRef, layout = "row", density = "compact", className, ...props}, ref,
) {
  return <EmptyState {...props} ref={ref} title={title} layout={layout} density={density} className={classes("flood-no-results", className)}
    actions={onReset && <Button variant="subtle" size="sm" onClick={() => {
      resetFocusRef?.current?.focus({preventScroll:true});
      onReset();
    }}>{resetLabel}</Button>} />;
});

export interface ErrorStateProps extends EmptyStateProps {
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
}

/** A failed content region with an optional host-owned retry. */
export const ErrorState = /* @__PURE__ */ forwardRef<HTMLDivElement, ErrorStateProps>(function ErrorState(
  {onRetry, retryLabel = "Try again", retrying = false, icon, actions, className, ...props}, ref,
) {
  return <EmptyState {...props} ref={ref} className={classes("flood-error-state", className)}
    icon={icon === undefined ? <StatusGlyph tone="error" /> : icon}
    actions={onRetry ? <>
      <Button type="button" size="sm" variant="subtle" loading={retrying && "retain-focus"} onClick={onRetry}>{retryLabel}</Button>
      {actions}
    </> : actions} />;
});

export interface LoadingStateProps extends Omit<EmptyStateProps, "title" | "headingLevel" | "icon"> {
  label: string;
  /** Use the visible message as the status region when the host has no announcement owner. */
  announce?: boolean;
}

/** A visible loading message for a content region with no accepted data to show. */
export const LoadingState = /* @__PURE__ */ forwardRef<HTMLDivElement, LoadingStateProps>(function LoadingState(
  {label, announce = false, density = "comfortable", layout = "centered", className, ...props}, ref,
) {
  if (typeof label !== "string" || !label.trim()) throw new Error("Flood LoadingState requires a nonempty label");
  const centered = layout === "centered";
  const spinnerSize = centered ? density === "compact" ? "md" : "lg" : "sm";
  return <ContentStateFrame {...props} rootRef={ref} layout={layout} density={density} announce={announce}
    className={classes("flood-loading-state", className)}
    title={<Text as="p" size={centered ? "body" : "label"}>{label}</Text>}
    marker={<Spinner size={spinnerSize} decorative />} />;
});

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Artwork at the top of the card, aligned with peers independently of their titles. */
  media?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  footerDivider?: boolean;
  /** Independent checkbox for host-owned bulk selection. */
  selection?: RecordSelection;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  headingSize?: HeadingProps["size"];
  density?: "compact" | "comfortable";
  elevation?: "default" | "raised";
}
const CardFrame = /* @__PURE__ */ forwardRef<HTMLDivElement, CardProps & { selectionPlaceholder?: ReactNode }>(function CardFrame(
  { media, title, description, actions, footer, footerDivider = true, selection, headingLevel = 2, headingSize = "section", density = "comfortable",
    elevation = "default", children, className, style, selectionPlaceholder, ...props }, ref,
) {
  const present = hasFieldContent;
  const heading = present(title), hint = present(description), action = present(actions);
  const selectionSlot = selection ? <RecordCheckbox className="flood-card__selection" selection={selection} /> : selectionPlaceholder;
  return <Surface {...props} ref={ref} elevation={elevation} padding={density === "compact" ? "4" : "6"}
    style={selection?.checked ? {
      background: `linear-gradient(var(--flood-sys-color-selection-background), var(--flood-sys-color-selection-background)), var(--flood-sys-color-surface-${elevation})`,
      ...style,
    } : style}
    {...(selectionSlot && {"data-selectable":true,"data-selected":selection?.checked || undefined})}
    data-density={density} className={classes("flood-card", className)}>
    {present(media) && <div className="flood-card__media">{media}</div>}
    {(heading || hint || action || selectionSlot) && <div className="flood-card__header">
      {(heading || hint || action) && <div className="flood-card__header-main">
        {(heading || hint) && <div className="flood-card__intro">
          {heading && <Heading level={headingLevel} size={headingSize}>{title}</Heading>}
          {hint && <Text as="div" size="compact" tone="subtle">{description}</Text>}
        </div>}
        {action && <div className="flood-card__actions">{actions}</div>}
      </div>}
      {selectionSlot}
    </div>}
    {present(children) && <div className="flood-card__body">{children}</div>}
    {present(footer) && <div className="flood-card__footer" data-divider={footerDivider || undefined}>{footer}</div>}
  </Surface>;
});

/** A structured content surface, not an interactive wrapper. @since 0.2.4 */
export const Card = /* @__PURE__ */ forwardRef<HTMLDivElement, CardProps>(function Card(props, ref) {
  return <CardFrame {...props} ref={ref} />;
});

interface CardSkeletonDescriptionProps {
  description?: boolean;
  /** Expected description line count. Overrides the single-line description flag. */
  descriptionLines?: 0 | 1 | 2 | 3;
}

export interface CardSkeletonProps extends Omit<CardProps, "title" | "description" | "actions" | "footer" | "selection" | "children" | "aria-hidden" | "media">, CardSkeletonDescriptionProps {
  /** Match the width-to-height ratio used by the loaded media slot. */
  mediaRatio?: number;
  headerAction?: boolean;
  /** Match the selection track of a loaded Card with selection. */
  reserveSelectionSpace?: boolean;
  bodyLines?: number;
  footerAction?: boolean;
  animate?: boolean;
}

function CardSelectionPlaceholder({animate}: {animate: boolean}) {
  return <span className="flood-choice flood-choice--icon flood-card__selection">
    <Skeleton width="var(--flood-sys-size-choice)" height="var(--flood-sys-size-choice)" animate={animate} />
  </span>;
}

function CardSkeletonLine({width, animate}: {width: string; animate: boolean}) {
  return <span className="flood-card-skeleton__line"><Skeleton width={width} height=".65em" animate={animate} /></span>;
}

function cardSkeletonDescription(lines: number, animate: boolean) {
  if (lines === 0) return undefined;
  if (lines === 1) return <CardSkeletonLine width="12em" animate={animate} />;
  return Array.from({length: lines}, (_, index) =>
    <CardSkeletonLine key={index} width={index === lines - 1 ? "68%" : "94%"} animate={animate} />);
}

/** Decorative loading geometry for a Card. The surrounding region owns announcements. */
export const CardSkeleton = /* @__PURE__ */ forwardRef<HTMLDivElement, CardSkeletonProps>(function CardSkeleton(
  {mediaRatio, description = false, descriptionLines = description ? 1 : 0, headerAction = false, reserveSelectionSpace, bodyLines = 2, footerAction = false, animate = true, ...props}, ref,
) {
  if (!Number.isSafeInteger(bodyLines) || bodyLines < 0) throw new Error("Flood CardSkeleton requires a nonnegative bodyLines count");
  return <CardFrame {...props} ref={ref} aria-hidden="true"
    media={mediaRatio === undefined ? undefined : <AspectRatio ratio={mediaRatio}><Skeleton shape="rounded" height="100%" animate={animate}/></AspectRatio>}
    selectionPlaceholder={reserveSelectionSpace ? <CardSelectionPlaceholder animate={animate} /> : undefined}
    title={<CardSkeletonLine width="9em" animate={animate} />}
    description={cardSkeletonDescription(descriptionLines, animate)}
    actions={headerAction ? <Skeleton width="3.25rem" className="flood-card-skeleton__header-action" animate={animate} /> : undefined}
    footer={footerAction ? <Skeleton width="7rem" className="flood-card-skeleton__footer-action flood-action-placeholder flood-control--sm" animate={animate} /> : undefined}>
    {bodyLines > 0 && <Text as="div" size="compact">{Array.from({length: bodyLines}, (_, index) =>
      <CardSkeletonLine key={index} width={index === bodyLines - 1 ? "66%" : "94%"} animate={animate} />)}</Text>}
  </CardFrame>;
});

export interface FileCardSkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "aria-hidden" | "title">,
  Pick<FileCardProps, "thumbnailRatio" | "thumbnailPlacement" | "density" | "elevation" | "headingSize" | "footerDivider">,
  CardSkeletonDescriptionProps {
  metadata?: boolean;
  reserveSelectionSpace?: boolean;
  previewOnThumbnail?: boolean;
  footerActions?: 0 | 1 | 2 | 3;
  animate?: boolean;
}

/** A decorative first-load placeholder with FileCard geometry. */
export const FileCardSkeleton = /* @__PURE__ */ forwardRef<HTMLDivElement, FileCardSkeletonProps>(function FileCardSkeleton(
  {thumbnailRatio = 4/3, thumbnailPlacement = "top", density = "compact", headingSize = "group", footerDivider = false,
    description, descriptionLines = description ? 1 : 0, metadata = true, reserveSelectionSpace, previewOnThumbnail, footerActions = 0, animate = true, className, ...props}, ref,
) {
  if (!Number.isInteger(footerActions) || footerActions < 0 || footerActions > 3) {
    throw new RangeError("Flood FileCardSkeleton expects between zero and three footer actions");
  }
  const action = (key?: number) => <Skeleton key={key}
    className="flood-file-card-skeleton__action flood-action-placeholder flood-action-placeholder--icon flood-control--sm" animate={animate} />;
  const artwork = <AspectRatio className="flood-file-card__preview flood-file-thumbnail" data-presentation="tile" ratio={thumbnailRatio}>
    <Skeleton height="100%" animate={animate} />
  </AspectRatio>;
  const thumbnail = previewOnThumbnail ? <div className="flood-file-card__media">
    {artwork}
    <span className="flood-file-card__preview-action">{action()}</span>
  </div> : artwork;
  return <CardFrame {...props} ref={ref} aria-hidden="true" className={classes("flood-file-card", "flood-file-card-skeleton", className)}
    density={density} headingSize={headingSize} footerDivider={footerDivider}
    media={thumbnailPlacement === "top" ? thumbnail : undefined}
    title={<CardSkeletonLine width="9em" animate={animate} />}
    description={cardSkeletonDescription(descriptionLines, animate)}
    selectionPlaceholder={reserveSelectionSpace ? <CardSelectionPlaceholder animate={animate} /> : undefined}
    footer={(metadata || footerActions > 0) ? <Inline gap="2" className="flood-file-card__footer">
      {metadata && <div className="flood-file-card__metadata">
        <Skeleton className="flood-file-card-skeleton__metadata" width="5em" animate={animate} />
      </div>}
      {footerActions > 0 && <Inline gap="1" className="flood-file-card__commands">
        {Array.from({length:footerActions}, (_, index) => action(index))}
      </Inline>}
    </Inline> : undefined}>
    {thumbnailPlacement === "body" ? thumbnail : undefined}
  </CardFrame>;
});

export interface FileCardGridProps extends GridProps {
  /** Keep empty responsive column tracks when only a few cards remain. */
  preserveColumns?: boolean;
}

/** Aligns the header, artwork and footer tracks of file cards in each row. */
export const FileCardGrid = /* @__PURE__ */ forwardRef<HTMLDivElement, FileCardGridProps>(function FileCardGrid(
  {columns, minItemWidth = "14rem", preserveColumns, className, ...props}, ref,
) {
  return <Grid {...props} ref={ref} columns={columns} minItemWidth={minItemWidth}
    data-preserve-columns={preserveColumns && columns === undefined || undefined} className={classes("flood-file-card-grid", className)} />;
});

export interface IconSlotProps extends HTMLAttributes<HTMLSpanElement> {
  size?: ControlSize;
  label?: string;
}
/** Adapter for the host's SVG icon package; glyphs are not bundled. */
export const IconSlot = /* @__PURE__ */ forwardRef<HTMLSpanElement, IconSlotProps>(function IconSlot(
  { size = "md", label, className, children, ...props }, ref,
) {
  return <span {...props} ref={ref} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={classes("flood-icon", `flood-icon--${size}`, className)}>{children}</span>;
});
export interface IconSwapProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "role" | "aria-label" | "aria-hidden"> {
  state: string;
  /** Decorative artwork for each state, with stable keys throughout the interaction. */
  icons: Readonly<Record<string, ReactNode>>;
}

/** Swaps decorative glyphs inside the containing IconSlot without moving the control. */
export const IconSwap = /* @__PURE__ */ forwardRef<HTMLSpanElement, IconSwapProps>(function IconSwap(
  {state, icons, className, ...props}, ref,
) {
  if (!Object.hasOwn(icons, state)) throw new Error("Flood IconSwap requires artwork for the current state");
  return <span {...props} ref={ref} aria-hidden="true" className={classes("flood-icon-swap", className)}>
    {Object.entries(icons).map(([key, icon]) => <span key={key}
      className="flood-icon-swap__glyph" data-active={key === state || undefined}>{icon}</span>)}
  </span>;
});

export interface IconButtonProps extends Omit<ButtonProps, "aria-label"> {
  label: string;
  /** Glyph size only; size continues to own the interactive target and insets. */
  iconSize?: ControlSize;
}

export interface SwipeActionsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  children: ReactNode;
  actions: ReactNode;
  /** Accessible name for the action disclosure, including its record when needed. */
  label: string;
  size?: ControlSize;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Turn off the gesture where the host already owns horizontal dragging. */
  swipe?: boolean;
}

/** Compact actions revealed from a record row by gesture or disclosure. @since 0.2.14 */
export const SwipeActions = /* @__PURE__ */ forwardRef<HTMLDivElement, SwipeActionsProps>(function SwipeActions(
  {label, size = "sm", defaultOpen = false, swipe = true, ...props}, ref,
) {
  if (!label.trim()) throw new Error("Flood SwipeActions requires a disclosure label");
  return <SwipeActionsRow {...props} label={label} size={size} defaultOpen={defaultOpen} swipe={swipe} forwardedRef={ref} />;
});
export const IconButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", iconSize = size, variant = "subtle", className, children, ...props }, ref,
) {
  return <Button {...props} ref={ref} size={size} variant={variant} aria-label={label} className={classes("flood-icon-button", className)}><IconSlot size={iconSize}>{children}</IconSlot></Button>;
});

export interface NotificationTriggerProps extends Omit<IconButtonProps, "children" | "type" | "tone" | "loading"> {
  unreadCount?: number;
  /** Localized description of the exact unread count. */
  formatUnread?: (count: number) => string;
}

/** An icon button for opening an inbox, with an optional unread indicator. */
export const NotificationTrigger = /* @__PURE__ */ forwardRef<HTMLButtonElement, NotificationTriggerProps>(function NotificationTrigger(
  {label, unreadCount = 0, formatUnread, size = "sm", variant = "ghost", title = label, className, ...props}, ref,
) {
  if (!label.trim()) throw new Error("Flood NotificationTrigger requires an accessible label");
  if (!Number.isSafeInteger(unreadCount) || unreadCount < 0) {
    throw new RangeError("Flood NotificationTrigger requires a nonnegative unread count");
  }
  const unread = unreadCount ? formatUnread?.(unreadCount) ?? `${unreadCount} unread` : "";
  return <IconButton {...props} ref={ref} type="button" label={unread ? `${label}, ${unread}` : label}
    title={title} size={size} variant={variant} className={classes("flood-notification-trigger", className)}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0" />
    </svg>
    <CountBadge count={unreadCount} presentation="dot" className="flood-notification-trigger__unread" aria-hidden="true" />
  </IconButton>;
});

export interface SearchTriggerProps extends Omit<ButtonProps, "children" | "aria-label" | "type"> {
  label: string;
  iconOnly?: boolean;
  fullWidth?: boolean;
  /** Display hint for a shortcut already implemented by the host. */
  shortcut?: KeyboardShortcutKeys;
}

/** A button that opens search, with an optional host-provided keyboard hint. */
export const SearchTrigger = /* @__PURE__ */ forwardRef<HTMLButtonElement, SearchTriggerProps>(function SearchTrigger(
  {label, shortcut, iconOnly = false, fullWidth = false, size = "sm", variant = "subtle", title = label, className, ...props}, ref,
) {
  if (!label.trim()) throw new Error("Flood SearchTrigger requires an accessible label");
  const triggerClass = classes("flood-search-trigger", className);
  if (iconOnly) {
    return <IconButton {...props} ref={ref} label={label} title={title} size={size} variant={variant} className={triggerClass}>
      <SearchGlyph />
    </IconButton>;
  }
  return <Button {...props} ref={ref} title={title} size={size} variant={variant}
    className={triggerClass} data-full-width={fullWidth || undefined}>
    <IconSlot size={size}><SearchGlyph /></IconSlot>
    <span className="flood-search-trigger__label">{label}</span>
    {shortcut && <KeyboardShortcut keys={shortcut} aria-hidden="true" className="flood-search-trigger__shortcut" />}
  </Button>;
});

export interface IconLinkProps extends Omit<LinkProps, "href" | "variant" | "aria-label"> {
  href: string;
  label: string;
  variant?: Exclude<LinkProps["variant"], "text">;
  iconSize?: ControlSize;
}

/** An icon-only native anchor with the same geometry as IconButton. */
export const IconLink = /* @__PURE__ */ forwardRef<HTMLAnchorElement, IconLinkProps>(function IconLink(
  {label, size = "md", iconSize = size, variant = "subtle", className, children, ...props}, ref,
) {
  if (!label.trim()) throw new Error("Flood IconLink requires an accessible label");
  return <Link {...props} ref={ref} size={size} variant={variant} aria-label={label} className={classes("flood-icon-link", className)}>
    <IconSlot size={iconSize}>{children}</IconSlot>
  </Link>;
});

export const Divider = /* @__PURE__ */ forwardRef<HTMLHRElement, HTMLAttributes<HTMLHRElement>>(
  function Divider({ className, ...props }, ref) {
    return <hr {...props} ref={ref} className={classes("flood-divider", className)} />;
  },
);

export interface CodeSnippetProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  code: string;
  codeDirection?: "ltr" | "rtl" | "auto";
  /** A decorative prompt placed beside the code, outside the selectable text. @since 0.2.13 */
  prompt?: string;
  action?: ReactNode;
}
/** Selectable code with an optional host-owned action; no clipboard side effects. */
export const CodeSnippet = /* @__PURE__ */ forwardRef<HTMLDivElement, CodeSnippetProps>(function CodeSnippet(
  { code, codeDirection = "ltr", prompt, action, className, ...props }, ref,
) {
  return (
    <div {...props} ref={ref} className={classes("flood-code-snippet", className)}>
      <div dir={codeDirection === "rtl" ? "rtl" : "ltr"} className="flood-code-snippet__line">
        {prompt && <span aria-hidden="true" className="flood-code-snippet__prompt">{prompt}</span>}
        <code dir={codeDirection} className="flood-code-snippet__code">{code}</code>
      </div>
      {action != null && <div className="flood-code-snippet__action">{action}</div>}
    </div>
  );
});

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal" | "both";
  contentInset?: "none" | "scrollbar";
}
/** Native scrolling with inset overlay tracks; the ref targets the scrollable viewport. */
export const ScrollArea = /* @__PURE__ */ forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { orientation = "vertical", contentInset = "scrollbar", ...props }, ref,
) {
  return <OverlayScrollArea {...props} orientation={orientation} contentInset={contentInset} ref={ref} />;
});


export interface CopyButtonProps extends Omit<ButtonProps, "children" | "value" | "type" | "onClick" | "loading"> {
  value: string;
  /** Use a named square icon action with the same clipboard feedback. @since 0.2.13 */
  iconOnly?: boolean;
  copyLabel?: string;
  copiedLabel?: string;
  errorLabel?: string;
  resetDelay?: number;
  onCopied?: () => void;
  onCopyError?: (error: unknown) => void;
}
export const CopyButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, CopyButtonProps>(function CopyButton(
  {copyLabel = "Copy", copiedLabel = "Copied", errorLabel = "Failed", resetDelay = 2000, size = "md", variant = "subtle", ...props}, ref,
) {
  return <ClipboardAction {...props} ref={ref} copyLabel={copyLabel} copiedLabel={copiedLabel} errorLabel={errorLabel} resetDelay={resetDelay} size={size} variant={variant} />;
});

export type FollowState = "not-following" | "following" | "requested";
export type FollowIntent = "follow" | "unfollow" | "cancel-request";

export interface FollowButtonProps extends Omit<ButtonProps, "children" | "onClick" | "loading" | "type" | "variant" | "tone"> {
  subject: string;
  state: FollowState;
  pending?: boolean;
  onAction: (intent: FollowIntent) => void;
  labels?: Partial<Record<FollowState, string>>;
  formatActionLabel?: (label: string, subject: string, intent: FollowIntent) => string;
}

const followIntents: Record<FollowState, FollowIntent> = {
  "not-following": "follow", following: "unfollow", requested: "cancel-request",
};
const followLabels = {"not-following": "Follow", following: "Following", requested: "Requested"} as const;
const followStates = ["not-following", "following", "requested"] as const;

/** A controlled subscription action with stable label geometry through requests. @since 0.2.14 */
export const FollowButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, FollowButtonProps>(function FollowButton(
  {subject, state, pending = false, onAction, labels, formatActionLabel, size = "sm",
    className, "aria-label": accessibleLabel, ...props}, ref,
) {
  const intent = followIntents[state];
  const label = labels?.[state] ?? followLabels[state];
  const actionSuffix = intent === "unfollow" ? ", unfollow" : intent === "cancel-request" ? ", cancel request" : "";
  const name = accessibleLabel ?? (formatActionLabel?.(label, subject, intent) ?? `${label} ${subject}${actionSuffix}`);
  return <Button {...props} ref={ref} size={size} variant={state === "not-following" ? "solid" : "subtle"}
    className={classes("flood-follow-button", className)} loading={pending ? "retain-focus" : false}
    aria-label={name} onClick={() => { if (!props["aria-disabled"]) onAction(intent); }}>
    <span className="flood-action-labels" aria-hidden="true">
      {followStates.map(item => <span key={item} data-visible={item === state || undefined}>{labels?.[item] ?? followLabels[item]}</span>)}
    </span>
  </Button>;
});

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  status?: FieldStatus | "neutral";
  duration?: number;
  action?: {label: string; onClick: () => void};
}
export interface ToastRegionProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  items: readonly ToastItem[];
  onDismiss: (id: string) => void;
  label?: string;
  closeLabel?: string;
  placement?: "top-start" | "top-end" | "bottom-start" | "bottom-end";
  limit?: number;
  inline?: boolean;
  hotkey?: boolean;
}
export const ToastRegion = /* @__PURE__ */ forwardRef<HTMLDivElement, ToastRegionProps>(function ToastRegion(
  {label = "Notifications", closeLabel = "Dismiss notification", placement = "bottom-end", limit = 3, inline = false, hotkey = true, ...props}, ref,
) {
  return <NotificationRegion {...props} ref={ref} label={label} closeLabel={closeLabel} placement={placement} limit={limit} inline={inline} hotkey={hotkey} />;
});


export interface AvatarGroupItem {
  id: string;
  name: string;
  src?: string;
  fallback?: string;
  presence?: AvatarPresence;
}
export interface AvatarGroupProps extends Omit<HTMLAttributes<HTMLUListElement>, "children"> {
  items: readonly AvatarGroupItem[];
  label: string;
  max?: number;
  size?: ContentSize;
  overflowLabel?: string;
  overflowPresentation?: "count" | "popover";
  /** Fit the available inline width before showing the overflow count. */
  layout?: "wrap" | "fit";
  /** Keep avatars separate even when no visible person has a presence indicator. */
  spacing?: "auto" | "separated";
  /** Title of the overflow popover. */
  overflowTitle?: string;
}
export const AvatarGroup = /* @__PURE__ */ forwardRef<HTMLUListElement, AvatarGroupProps>(function AvatarGroup(
  {max = 4, size = "md", ...props}, ref,
) { return <GroupedAvatars {...props} ref={ref} max={max} size={size}/>; });

export interface StarterPackPreviewProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title" | "role"> {
  title: string;
  /** A destination where the complete pack can be inspected. */
  href?: string;
  curator?: string;
  description?: string;
  people: readonly Pick<AvatarGroupItem, "id" | "name" | "src" | "fallback">[];
  feeds: readonly {id: string; label: string}[];
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  labels?: {
    curator?: (name: string) => string;
    people?: (count: number) => string;
    feeds?: (count: number) => string;
    moreFeeds?: (count: number) => string;
    empty?: string;
  };
}

/** Preview a curated pack of recommended people and feeds. @since 0.2.14 */
export const StarterPackPreview = /* @__PURE__ */ forwardRef<HTMLDivElement, StarterPackPreviewProps>(function StarterPackPreview(
  {title, href, curator, description, people, feeds, headingLevel = 2, labels, lang = "en", ...props}, ref,
) {
  const titleId = useId();
  const uniqueIds = (items: readonly {id: string}[]) =>
    items.every(item => item.id.trim()) && new Set(items.map(item => item.id)).size === items.length;
  if (!title.trim() || !uniqueIds(people) || !uniqueIds(feeds) ||
      people.some(person => !person.name.trim()) || feeds.some(feed => !feed.label.trim())) {
    throw new Error("Flood StarterPackPreview requires a title and uniquely identified, named recommendations");
  }
  const number = new Intl.NumberFormat(lang);
  const peopleLabel = labels?.people?.(people.length) ?? `${number.format(people.length)} ${people.length === 1 ? "person" : "people"}`;
  const feedsLabel = labels?.feeds?.(feeds.length) ?? `${number.format(feeds.length)} ${feeds.length === 1 ? "feed" : "feeds"}`;
  const feedSample = feeds.slice(0, 2);
  const remainingFeeds = feeds.length - feedSample.length;

  return <Stack {...props} ref={ref} lang={lang} gap="3" role="group"
    aria-labelledby={props["aria-label"] ? undefined : props["aria-labelledby"] ?? titleId}>
    <Stack gap="1">
      <Heading level={headingLevel} size="group" wrap="balance" id={titleId} style={{overflowWrap:"anywhere"}}>
        {href ? <Link href={href} dir="auto">{title}</Link> : <bdi>{title}</bdi>}
      </Heading>
      {curator && <Text size="helper" tone="subtle" dir="auto">{labels?.curator?.(curator) ?? `Curated by ${curator}`}</Text>}
    </Stack>
    {description && <Text as="p" size="compact" tone="subtle" wrap="pretty" dir="auto" style={{overflowWrap:"anywhere"}}>{description}</Text>}
    {people.length || feeds.length ? <Grid gap="3" maxColumns={2} minItemWidth="10rem">
      {people.length > 0 && <Stack gap="2">
        <Text size="helper" tone="subtle">{peopleLabel}</Text>
        <AvatarGroup items={people} label={peopleLabel} size="sm" max={4} layout="fit" />
      </Stack>}
      {feeds.length > 0 && <Stack gap="2">
        <Text size="helper" tone="subtle">{feedsLabel}</Text>
        <List marker={false} gap="1" aria-label={feedsLabel}>
          {feedSample.map(feed => <li key={feed.id}>
            <Text size="compact" dir="auto" style={{overflowWrap:"anywhere"}}>{feed.label}</Text>
          </li>)}
          {remainingFeeds > 0 && <li><Text size="helper" tone="subtle">
            {labels?.moreFeeds?.(remainingFeeds) ?? `+${number.format(remainingFeeds)} more`}
          </Text></li>}
        </List>
      </Stack>}
    </Grid> : <Text size="compact" tone="subtle">{labels?.empty ?? "No recommendations yet."}</Text>}
  </Stack>;
});

export interface ParticipantRecord extends AvatarGroupItem {
  /** Short context such as a role in the current discussion. */
  detail?: string;
}

export interface ParticipantPopoverProps extends Omit<PopoverProps, "title" | "trigger" | "children" | "chrome"> {
  label: string;
  participants: readonly ParticipantRecord[];
  /** Short context for the entire roster, such as when the data was last confirmed. */
  description?: string;
  /** Override the opener with one accessible control using the supplied trigger props. */
  trigger?: PopoverProps["trigger"];
  emptyLabel?: string;
  actions?: ReactNode;
  /** Use a quiet, compact trigger beside metadata such as a timestamp. */
  triggerAppearance?: "button" | "inline";
  /** Localized override for the inline trigger, including the visible count. */
  formatTriggerLabel?: (count: number) => string;
}

/** A compact opener for a complete, scoped roster. */
export const ParticipantPopover = /* @__PURE__ */ forwardRef<HTMLDivElement, ParticipantPopoverProps>(function ParticipantPopover({
  label, participants, description, trigger: renderTrigger, emptyLabel = "No participants", actions, triggerAppearance = "button", formatTriggerLabel,
  disabled, className, lang, focusOnOpen, ...props
}, ref) {
  if (!label.trim() || participants.some(person => !person.id.trim() || !person.name.trim()) ||
      new Set(participants.map(person => person.id)).size !== participants.length) {
    throw new Error("Flood ParticipantPopover requires a label and unique nonempty participant IDs and names");
  }
  const inline = triggerAppearance === "inline";
  const opener = inline ? formatTriggerLabel?.(participants.length) ??
    `${label} ${new Intl.NumberFormat(lang || "en").format(participants.length)}` : label;
  if (!renderTrigger && !opener.trim()) throw new Error("Flood ParticipantPopover requires a nonempty trigger label");
  return <Popover {...props} ref={ref} title={label} chrome="title-only" disabled={disabled} lang={lang}
    focusOnOpen={focusOnOpen ?? !inline}
    className={classes("flood-participant-popover", className)}
    trigger={renderTrigger ?? (trigger => <Button {...trigger} size={inline ? "xs" : "sm"} variant={inline ? "ghost" : "subtle"} disabled={disabled} lang={lang}>
      {opener}{!inline && <CountBadge count={participants.length} showZero lang={lang} />}
    </Button>)}>
    {description && <Text as="p" size="compact" tone="subtle" className="flood-participant-popover__description">{description}</Text>}
    {participants.length ? <ScrollArea className="flood-participant-popover__viewport" aria-label={label}>
      <List marker={false} gap="2" aria-label={label}>
        {participants.map(({id, name, src, fallback, presence, detail}) => <li key={id}>
          <AuthorMeta name={name} src={src} fallback={fallback} presence={presence} metadata={detail} size="sm" />
        </li>)}
      </List>
    </ScrollArea> : <Text as="p" size="compact" tone="subtle">{emptyLabel}</Text>}
    {hasFieldContent(actions) && <Inline gap="2" className="flood-participant-popover__actions">{actions}</Inline>}
  </Popover>;
});

export interface CollaboratorRecord extends Omit<AvatarGroupItem, "presence"> {
  activity: "viewing" | "editing";
}

export type CollaborationPresence =
  | {status:"live" | "reconnecting"; people: readonly CollaboratorRecord[]}
  | {status:"unavailable"};

export interface CollaboratorPresenceProps extends Omit<ParticipantPopoverProps,
  "participants" | "description" | "trigger" | "triggerAppearance" | "formatTriggerLabel" | "emptyLabel" | "actions" | "label"> {
  label?: string;
  /** Other collaborators visible to this viewer, in the host's preferred order. */
  presence: CollaborationPresence;
  labels?: Partial<Record<"viewing" | "editing" | "empty" | "reconnecting" | "lastKnown" | "unavailable", string>> & {
    liveCount?: (count: number) => string;
  };
}

/** A current-document roster with explicit empty and disconnected states. */
export const CollaboratorPresence = /* @__PURE__ */ forwardRef<HTMLDivElement, CollaboratorPresenceProps>(function CollaboratorPresence(
  {presence, label = "In this document", labels, lang = "en", disabled, align = "end", focusOnOpen = false, ...props}, ref,
) {
  const people = presence.status === "unavailable" ? [] : presence.people;
  const empty = labels?.empty ?? "Nobody else here";
  const reconnecting = labels?.reconnecting ?? "Reconnecting";
  const unavailable = labels?.unavailable ?? "Presence unavailable";
  const triggerText = presence.status === "unavailable" ? unavailable
    : presence.status === "reconnecting" ? reconnecting : people.length ? undefined : empty;
  const count = labels?.liveCount?.(people.length) ?? new Intl.NumberFormat(lang).format(people.length);
  const lastKnown = labels?.lastKnown ?? "Last confirmed activity before the connection was lost.";
  const participants = people.map(({activity, ...person}) => ({
    ...person, detail:labels?.[activity] ?? (activity === "editing" ? "Editing" : "Viewing"),
  }));

  return <ParticipantPopover {...props} ref={ref} label={label} participants={participants} lang={lang}
    disabled={disabled} align={align} focusOnOpen={focusOnOpen}
    description={presence.status === "reconnecting" && people.length ? lastKnown : undefined}
    emptyLabel={triggerText ?? empty} trigger={trigger => (
      <Button {...trigger} size="sm" variant="ghost" disabled={disabled}
        className="flood-collaborator-presence__trigger" aria-label={`${label}: ${triggerText ?? count}`}>
        {people.length > 0 && <span className="flood-collaborator-presence__faces" aria-hidden="true">
          {people.slice(0,3).map(({id,name,src,fallback}) => <Avatar key={id} name={name} src={src} fallback={fallback} decorative size="2xs" />)}
        </span>}
        {triggerText ?? <CountBadge count={people.length} lang={lang} />}
      </Button>
    )} />;
});

export interface IdentityVerificationIssuer {
  id: string;
  name: string;
  /** An authorized destination for the issuer or its verification record. */
  href?: string;
  detail?: string;
}

export interface IdentityVerificationBadgeProps extends Omit<PopoverProps, "title" | "trigger" | "children" | "chrome"> {
  /** Give the trigger a subject-specific name when several badges are visible. */
  label?: string;
  title?: string;
  /** Active confirmations visible to this viewer. An empty list omits the badge. */
  issuers: readonly IdentityVerificationIssuer[];
}

/** A quiet identity mark with an inspectable list of verifiers. @since 0.2.14 */
export const IdentityVerificationBadge = /* @__PURE__ */ forwardRef<HTMLDivElement, IdentityVerificationBadgeProps>(function IdentityVerificationBadge(
  {issuers, label = "Verified identity", title = "Verified by", side = "top", align = "center",
    className, disabled, initialFocusRef, focusOnOpen, ...props}, ref,
) {
  const issuerLink = useRef<HTMLAnchorElement>(null);
  if (!issuers.length) return null;
  if (issuers.some(({id, name}) => !id.trim() || !name.trim()) || new Set(issuers.map(({id}) => id)).size !== issuers.length) {
    throw new Error("Flood IdentityVerificationBadge requires unique nonempty issuer IDs and names");
  }
  const firstLink = issuers.find(issuer => issuer.href);
  return <Popover {...props} ref={ref} title={title} chrome="title-only" disabled={disabled} side={side} align={align}
    initialFocusRef={initialFocusRef ?? issuerLink} focusOnOpen={focusOnOpen ?? Boolean(initialFocusRef || firstLink)}
    className={classes("flood-identity-verification", className)}
    trigger={trigger => <IconButton {...trigger} label={label} size="2xs" variant="ghost"
      title={label} disabled={disabled} className="flood-identity-verification__trigger">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3 5 6v5c0 4.5 2.6 7.9 7 10 4.4-2.1 7-5.5 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    </IconButton>}>
    <ScrollArea className="flood-identity-verification__issuers" aria-label={title}>
      <List marker={false} gap="2" aria-label={title}>
        {issuers.map(({id, name, href, detail}) => <li key={id}>
          <Stack gap="1">
            {href ? <Link ref={id === firstLink?.id ? issuerLink : undefined} href={href} dir="auto">{name}</Link>
              : <Text size="compact" dir="auto">{name}</Text>}
            {detail && <Text size="helper" tone="subtle" dir="auto">{detail}</Text>}
          </Stack>
        </li>)}
      </List>
    </ScrollArea>
  </Popover>;
});

export interface GroupReadReceiptProps extends Omit<ParticipantPopoverProps, "participants" | "triggerAppearance" | "emptyLabel" | "actions" | "label"> {
  /** The confirmed readers whose identities the viewer is allowed to see. */
  readers: readonly ParticipantRecord[];
  /** Localized name for the roster. */
  label?: string;
}

/** Disclose the confirmed readers of one outgoing group message. @since 0.2.14 */
export const GroupReadReceipt = /* @__PURE__ */ forwardRef<HTMLDivElement, GroupReadReceiptProps>(function GroupReadReceipt(
  { readers, label = "Read by", ...props }, ref,
) {
  return readers.length ? <ParticipantPopover {...props} ref={ref} label={label} participants={readers}
    triggerAppearance="inline" /> : null;
});

export type NotificationSubscriptionMode = "all" | "participating" | "muted";

export interface NotificationSubscriptionProps extends Omit<MenuProps, "items" | "trigger" | "onAction" | "controlSize"> {
  /** Accessible scope, for example “Notifications for Export permissions”. */
  label: string;
  value: NotificationSubscriptionMode;
  onValueChange: (value: NotificationSubscriptionMode) => void;
  labels?: Partial<Record<NotificationSubscriptionMode, string>>;
}

const notificationModes = ["all", "participating", "muted"] as const;
const notificationModeLabels = {all: "All updates", participating: "Mentions & replies", muted: "Muted"} as const;

/** Sets the notification scope for one record, discussion, or channel. */
export const NotificationSubscription = /* @__PURE__ */ forwardRef<HTMLDivElement, NotificationSubscriptionProps>(function NotificationSubscription({
  label, value, onValueChange, labels, className, ...props
}, ref) {
  const options = notificationModes.map(mode => ({mode, label:labels?.[mode] ?? notificationModeLabels[mode]}));
  const active = options.find(option => option.mode === value);
  if (!active || !label.trim() || options.some(option => !option.label.trim())) {
    throw new Error("Flood NotificationSubscription requires a scope, a valid mode, and nonempty mode labels");
  }
  return <Menu {...props} ref={ref} label={label} className={classes("flood-notification-subscription",className)}
    items={options.map(option => ({
    id:option.mode, type:"radio", group:label, label:option.label,
    checked:option.mode === value, closeOnSelect:true, onCheckedChange:() => onValueChange(option.mode),
  }))} trigger={trigger => <Button {...trigger} size="sm" variant="subtle"
    aria-label={`${label}: ${active.label}`}>
    <span className="flood-action-labels" aria-hidden="true">
      {options.map(option => <span key={option.mode} data-visible={option.mode === value || undefined}>{option.label}</span>)}
    </span>
    <IconSlot size="2xs">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </IconSlot>
  </Button>} />;
});

export interface EstimateChoice {
  id: string;
  /** Complete label, such as "3 points" or "Medium". */
  label: string;
  /** Compact visible value for the closed trigger, such as "3" or "M". */
  shortLabel?: string;
}

export interface EstimateMenuProps extends Omit<MenuProps, "items" | "trigger" | "onAction"> {
  options: readonly (EstimateChoice & {disabled?: boolean})[];
  /** The accepted estimate, including values outside the current scale. Null means unestimated. */
  value: EstimateChoice | null;
  onValueChange: (id: string | null) => void;
  unestimatedLabel?: string;
  /** Localize the trigger name while retaining the field and accepted value. */
  formatTriggerLabel?: (label: string, valueLabel: string) => string;
}

/** Set or clear a work estimate from the host's discrete scale. @since 0.2.14 */
export const EstimateMenu = /* @__PURE__ */ forwardRef<HTMLDivElement, EstimateMenuProps>(function EstimateMenu(
  {options, value, onValueChange, unestimatedLabel = "No estimate",
    formatTriggerLabel = (label, valueLabel) => `${label}: ${valueLabel}`,
    label, disabled, controlSize = "sm", ...props}, ref,
) {
  const accepted = options.find(option => option.id === value?.id) ?? value;
  const selectedLabel = accepted?.label ?? unestimatedLabel;
  const unavailable = disabled || (!value && options.every(option => option.disabled));
  const items: MenuRadioItem[] = [{
    id:"unestimated", type:"radio", group:label, label:unestimatedLabel, checked:!value,
    onCheckedChange:() => onValueChange(null), closeOnSelect:true,
  }, ...options.map((option): MenuRadioItem => ({
    id:`estimate:${option.id}`, type:"radio", group:label, label:option.label,
    checked:option.id === value?.id, disabled:option.disabled,
    onCheckedChange:() => onValueChange(option.id), closeOnSelect:true,
  }))];
  return <Menu {...props} ref={ref} label={label} items={items} disabled={unavailable} controlSize={controlSize}
    trigger={trigger => <Button {...trigger} variant="ghost" size={controlSize} disabled={unavailable}
      aria-label={formatTriggerLabel(label, selectedLabel)}>
      {accepted?.shortLabel ?? selectedLabel}
      <IconSlot>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </IconSlot>
    </Button>} />;
});

export interface SnoozePreset {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface SnoozeMenuProps extends Omit<MenuProps, "label" | "items" | "trigger" | "onAction"> {
  /** Accessible name including the item affected, such as “Snooze export notification”. */
  label: string;
  presets: readonly SnoozePreset[];
  /** Formatted return time, supplied only after the host accepts a schedule. */
  snoozedUntil?: string;
  labels?: {
    snooze?: string;
    snoozed?: string;
    custom?: string;
    clear?: string;
    activeLabel?: (label: string, until: string) => string;
  };
  onSnooze: (presetId: string) => void;
  onCustom?: () => void;
  onClear?: () => void;
}

/** Choose when to bring an item back to an inbox or queue. @since 0.2.14 */
export const SnoozeMenu = /* @__PURE__ */ forwardRef<HTMLDivElement, SnoozeMenuProps>(function SnoozeMenu(
  {label, presets, snoozedUntil, labels, onSnooze, onCustom, onClear, disabled, controlSize = "sm", ...props}, ref,
) {
  const snooze = labels?.snooze ?? "Snooze";
  const snoozed = labels?.snoozed ?? "Snoozed";
  const scheduled = Boolean(snoozedUntil);
  const accessibleLabel = snoozedUntil
    ? (labels?.activeLabel ?? ((name, until) => `${name}: snoozed until ${until}`))(label, snoozedUntil)
    : label;
  const items: MenuItem[] = presets.map(preset => ({
    id: `preset:${preset.id}`, label: preset.label, disabled: preset.disabled,
  }));
  if (onCustom) items.push({id:"custom", label:labels?.custom ?? "Choose date and time…"});
  if (scheduled && onClear) {
    if (items.length > 0) items.push({id:"snooze-divider", type:"separator"});
    items.push({id:"clear", label:labels?.clear ?? "End snooze"});
  }
  const unavailable = disabled || items.every(item => item.type === "separator" || item.disabled);
  return <Menu {...props} ref={ref} label={label} items={items} controlSize={controlSize} disabled={unavailable}
    onAction={id => {
      if (id === "custom") onCustom?.();
      else if (id === "clear") onClear?.();
      else onSnooze(id.slice("preset:".length));
    }}
    trigger={trigger => <Button {...trigger} aria-label={accessibleLabel} disabled={unavailable}
      variant="subtle" size={controlSize}>
      <span className="flood-action-labels" aria-hidden="true">
        <span data-visible={!scheduled || undefined}>{snooze}</span>
        <span data-visible={scheduled || undefined}>{snoozed}</span>
      </span>
    </Button>} />;
});

export interface ReminderControlProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Accessible name that identifies the record. */
  label: string;
  presets: readonly SnoozePreset[];
  /** Accepted reminder time as an ISO timestamp with an explicit offset. */
  remindAt?: string;
  timeZone?: string;
  disabled?: boolean;
  labels?: {
    add?: string;
    edit?: string;
    custom?: string;
    clear?: string;
    scheduled?: (label: string, formattedTime: string) => string;
  };
  onSchedule: (presetId: string) => void;
  onCustom?: () => void;
  onClear?: () => void;
}

/** Schedule a personal reminder alongside a record. @since 0.2.14 */
export const ReminderControl = /* @__PURE__ */ forwardRef<HTMLDivElement, ReminderControlProps>(function ReminderControl(
  {label, presets, remindAt, timeZone = "UTC", lang = "en", disabled, labels, onSchedule, onCustom, onClear, ...props}, ref,
) {
  const add = labels?.add ?? "Remind me";
  const edit = labels?.edit ?? "Edit reminder";
  const time = remindAt === undefined ? undefined : new Intl.DateTimeFormat(lang, {
    timeZone, dateStyle:"medium", timeStyle:"short",
  }).format(parseInstant(remindAt, "ReminderControl"));
  return <Inline gap="2" align="center" {...props} lang={lang} ref={ref}>
    <SnoozeMenu label={`${time ? edit : add}: ${label}`} presets={presets} snoozedUntil={time} disabled={disabled} onSnooze={onSchedule}
      onCustom={onCustom} onClear={onClear} labels={{
        snooze:add,
        snoozed:edit,
        custom:labels?.custom,
        clear:labels?.clear ?? "Cancel reminder",
        activeLabel:labels?.scheduled ?? ((name, scheduledTime) => `${name}: ${scheduledTime}`),
      }} />
    {remindAt !== undefined && <Timestamp dateTime={remindAt} style={{minInlineSize:0,overflowWrap:"anywhere"}}>{time}</Timestamp>}
  </Inline>;
});

export interface ReplyAudienceOption {
  id: string;
  /** A short statement of who can reply, used in both the trigger and the menu. */
  label: string;
  disabled?: boolean;
}

export interface ReplyAudienceProps extends Omit<MenuProps, "items" | "trigger" | "onAction" | "label"> {
  label?: string;
  options: readonly ReplyAudienceOption[];
  value: string;
  onValueChange: (value: string) => void;
}

/** Choose the applicable reply policy while composing or editing a post. @since 0.2.14 */
export const ReplyAudience = /* @__PURE__ */ forwardRef<HTMLDivElement, ReplyAudienceProps>(function ReplyAudience(
  { label = "Who can reply", options, value, onValueChange, disabled, className, ...props }, ref,
) {
  const active = options.find(option => option.id === value);
  if (!active || !label.trim() || options.some(option => !option.id.trim() || !option.label.trim()) ||
      new Set(options.map(option => option.id)).size !== options.length) {
    throw new Error("Flood ReplyAudience requires a selected policy and unique nonempty option IDs and labels");
  }
  return <Menu {...props} ref={ref} label={label} disabled={disabled}
    className={classes("flood-reply-audience", className)}
    items={options.map(option => ({
      id: option.id, type: "radio", group: label, label: option.label, disabled: option.disabled,
      checked: option.id === value, closeOnSelect: true,
      onCheckedChange: () => { if (option.id !== value) onValueChange(option.id); },
    }))}
    trigger={trigger => <Button {...trigger} variant="ghost" size="sm" disabled={disabled}
      aria-label={`${label}: ${active.label}`} className="flood-reply-audience__trigger">
      <span className="flood-action-labels" aria-hidden="true">
        {options.map(option => <span key={option.id} data-visible={option.id === value || undefined} dir="auto">{option.label}</span>)}
      </span>
      <IconSlot size="2xs">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </IconSlot>
    </Button>} />;
});

export interface StatusIndicatorProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  label: string;
  tone?: SemanticTone;
  size?: ContentSize;
  announce?: boolean;
  /** A single line by default. Use chip for a tinted surface, wrap for prose, or icon in compact regions. */
  presentation?: "label" | "chip" | "wrap" | "icon";
  /** Decorative artwork for icon presentation. The label still names the state. */
  icon?: ReactNode;
}
export const StatusIndicator = /* @__PURE__ */ forwardRef<HTMLSpanElement, StatusIndicatorProps>(function StatusIndicator(
  {tone = "neutral", size = "md", announce = false, ...props}, ref,
) { return <NamedStatus {...props} ref={ref} tone={tone} size={size} announce={announce}/>; });

const priorityLabels = {none:"No priority", low:"Low", medium:"Medium", high:"High", urgent:"Urgent"};
type PriorityLevel = keyof typeof priorityLabels;
const priorityBars = ["M5 19v-4", "M12 19v-9", "M19 19V5"];
const priorityBarCount = {low:1, medium:2, high:3};

export interface PriorityIndicatorProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  level: PriorityLevel;
  /** Replaces the built-in label, including in the compact tooltip. */
  label?: string;
  size?: ContentSize;
  presentation?: "label" | "chip" | "icon";
}

export const PriorityIndicator = /* @__PURE__ */ forwardRef<HTMLSpanElement, PriorityIndicatorProps>(function PriorityIndicator(
  {level, label = priorityLabels[level], presentation = "label", className, ...props}, ref,
) {
  const icon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    {level === "none" ? <path d="M7 12h10"/> : level === "urgent" ? <path d="M12 5v9m0 4v1"/> :
      priorityBars.map((path, index) => <path key={path} d={path}
        className={index >= priorityBarCount[level] ? "flood-priority-indicator__inactive-bar" : undefined}/>)}
  </svg>;
  return <NamedStatus {...props} ref={ref} label={label} presentation={presentation} icon={icon} showLabelIcon
    tone={level === "urgent" ? "error" : "neutral"} className={classes("flood-priority-indicator", className)}
    data-level={level}/>;
});

const saveStatusAppearance = {
  idle: {label:"",tone:"neutral"},
  dirty: {label:"Unsaved changes",tone:"neutral"},
  saving: {label:"Saving changes…",tone:"neutral"},
  saved: {label:"Changes saved",tone:"success"},
  error: {label:"Changes could not be saved",tone:"error"},
} as const;

export interface SaveStatusProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "role"> {
  state: keyof typeof saveStatusAppearance;
  label?: string;
  /** Announces state text changes. Use false when the host already announces them. */
  announce?: boolean;
}

/** Quiet feedback for a host-owned save operation. */
export const SaveStatus = /* @__PURE__ */ forwardRef<HTMLSpanElement, SaveStatusProps>(function SaveStatus(
  {state, label, announce = true, className, ...props}, ref,
) {
  const appearance = saveStatusAppearance[state];
  const message = label ?? appearance.label;
  return <span {...props} ref={ref} className={classes("flood-save-status",className)}
    role={announce ? "status" : undefined} aria-atomic={announce || undefined}>
    {message && (state === "saving"
      ? <><Spinner size="sm" decorative /><Text as="span" size="helper" tone="subtle">{message}</Text></>
      : <StatusIndicator size="sm" presentation="wrap" label={message} tone={appearance.tone} />)}
  </span>;
});

export interface FormActionsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  primary: ReactNode;
  secondary?: ReactNode;
  status?: ReactNode;
  align?: "start" | "end";
  /** Reserve a feedback line below the row, or stack full-width actions above it. */
  layout?: "auto" | "status-below" | "stacked";
}

/** A responsive action row for a native form. The host supplies its buttons and feedback. */
export const FormActions = /* @__PURE__ */ forwardRef<HTMLDivElement, FormActionsProps>(function FormActions(
  {primary, secondary, status, align = "end", layout = "auto", className, ...props}, ref,
) {
  return <div {...props} ref={ref} className={classes("flood-form-actions",className)} data-align={align} data-layout={layout}>
    <Inline gap="2" className="flood-form-actions__buttons">{secondary}{primary}</Inline>
    {hasFieldContent(status) && <div className="flood-form-actions__status">{status}</div>}
  </div>;
});

export type SaveBarState = "clean" | "dirty" | "saving" | "error";

export interface SaveBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  state: SaveBarState;
  /** ID of the native form, when the bar is rendered outside it. */
  form?: string;
  placement?: "viewport" | "inline";
  saveDisabled?: boolean;
  announce?: boolean;
  labels?: {
    group?: string;
    save?: string;
    discard?: string;
    state?: Partial<Record<Exclude<SaveBarState, "clean">, string>>;
  };
}

/** Keeps save and discard within reach while a form has a pending draft. @since 0.2.14 */
export const SaveBar = /* @__PURE__ */ forwardRef<HTMLDivElement, SaveBarProps>(function SaveBar(
  {state, form, placement = "viewport", saveDisabled = false, announce, labels, className, hidden, ...props}, ref,
) {
  const saving = state === "saving";
  return <Surface {...props} ref={ref} role="group" aria-label={props["aria-label"] ?? labels?.group ?? "Save changes"}
    hidden={hidden || state === "clean"} padding="2" elevation="overlay" data-placement={placement}
    className={classes("flood-save-bar", className)}>
    <FormActions status={<SaveStatus state={state === "clean" ? "idle" : state}
      label={state === "clean" ? undefined : labels?.state?.[state]} announce={announce} />}
      secondary={<Button variant="ghost" size="sm" type="reset" form={form} disabled={saving}>
        {labels?.discard ?? "Discard"}
      </Button>}
      primary={<Button size="sm" type="submit" form={form} disabled={saveDisabled && !saving}
        loading={saving ? "retain-focus" : false}>{labels?.save ?? "Save"}</Button>} />
  </Surface>;
});

export interface FigureProps extends HTMLAttributes<HTMLElement> {
  caption?: ReactNode;
  captionPosition?: "before" | "after";
}
export const Figure = /* @__PURE__ */ forwardRef<HTMLElement, FigureProps>(function Figure(
  {captionPosition = "after", ...props}, ref,
) { return <CaptionedFigure {...props} ref={ref} captionPosition={captionPosition}/>; });

export interface MediaCreditReference {
  label: string;
  href?: string;
}

export interface MediaCreditProps extends Omit<InlineProps, "children" | "gap" | "align"> {
  creator?: MediaCreditReference;
  source?: MediaCreditReference & {unverified?: boolean};
  published?: {dateTime: string; label?: string};
  unverifiedLabel?: string;
}

/** Attribute a saved image or other media to its creator and publication. @since 0.2.14 */
export const MediaCredit = /* @__PURE__ */ forwardRef<HTMLDivElement, MediaCreditProps>(function MediaCredit(
  {creator, source, published, unverifiedLabel = "Unverified source", lang, className, ...props}, ref,
) {
  if (!creator && !source && !published) return null;
  if ((creator && !creator.label.trim()) || (source && !source.label.trim())) {
    throw new Error("Flood MediaCredit requires a visible label for each supplied reference");
  }
  const renderReference = ({label, href}: MediaCreditReference, tone: "default" | "subtle") => <Text size="helper" tone={tone} dir="auto">
    {href ? <Link href={href}>{label}</Link> : label}
  </Text>;
  return <Inline {...props} ref={ref} lang={lang} gap="2" align="baseline" className={classes("flood-media-credit", className)}>
    {creator && renderReference(creator, "default")}
    {source && <Inline gap="2" align="baseline">
      {renderReference(source, "subtle")}
      {source.unverified && <Text size="helper" tone="subtle">{unverifiedLabel}</Text>}
    </Inline>}
    {published && <Timestamp dateTime={published.dateTime} lang={lang}>{published.label}</Timestamp>}
  </Inline>;
});

export interface BlockquoteProps extends BlockquoteHTMLAttributes<HTMLQuoteElement> {
  attribution?: ReactNode;
}
export const Blockquote = /* @__PURE__ */ forwardRef<HTMLQuoteElement, BlockquoteProps>(function Blockquote(props, ref) {
  return <AttributedQuote {...props} ref={ref}/>;
});

export interface InlineCodeProps extends HTMLAttributes<HTMLElement> {
  size?: ContentSize;
  wrap?: boolean;
}
export const InlineCode = /* @__PURE__ */ forwardRef<HTMLElement, InlineCodeProps>(function InlineCode(
  {size = "md", wrap = true, ...props}, ref,
) { return <InlineCodeText {...props} ref={ref} size={size} wrap={wrap}/>; });

export interface HttpMethodProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** The case-sensitive method token as reported by the application. */
  method: string;
  variant?: "text" | "outline";
  /** Use truncation when the host constrains this label to a single line. */
  overflow?: "wrap" | "truncate";
}

/** A neutral, fixed-direction label for an HTTP request method. */
export const HttpMethod = /* @__PURE__ */ forwardRef<HTMLSpanElement, HttpMethodProps>(function HttpMethod(
  {method, variant = "text", overflow = "wrap", className, ...props}, ref,
) {
  const styleClass = classes("flood-http-method", className);
  const content = overflow === "truncate" ? <TruncatedText dir="ltr">{method}</TruncatedText> : method;
  return variant === "outline"
    ? <Badge {...props} dir="ltr" ref={ref} size="sm" variant="outline" className={styleClass}>{content}</Badge>
    : <span {...props} dir="ltr" ref={ref} className={styleClass}>{content}</span>;
});

export interface EndpointLabelProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Case-sensitive method token as reported by the application. */
  method: string;
  /** Display-safe request path or route template. */
  path: string;
  overflow?: "truncate" | "wrap";
  /** Number of trailing characters to keep visible when truncating. */
  preserveEnd?: number;
}

/** A method and path readable together in request rows or endpoint headings. */
export const EndpointLabel = /* @__PURE__ */ forwardRef<HTMLSpanElement, EndpointLabelProps>(function EndpointLabel({
  method, path, overflow = "truncate", preserveEnd, dir = "ltr", className, ...props
}, ref) {
  return <span {...props} ref={ref} dir={dir} className={classes("flood-endpoint-label", className)}>
    <HttpMethod method={method} variant="outline" overflow="truncate" className="flood-endpoint-label__method" />
    <code className="flood-endpoint-label__path" dir="ltr">
      {overflow === "truncate" ? <TruncatedText dir="ltr" preserveEnd={preserveEnd}>{path}</TruncatedText> : path}
    </code>
  </span>;
});

export interface GitRefProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  kind: "branch" | "tag" | "commit";
  value: string;
  /** Localized name for the reference kind. */
  kindLabel?: string;
  /** Number of trailing characters to keep visible when clipped. */
  preserveEnd?: number;
}

const gitRefLabels = {branch: "Branch", tag: "Tag", commit: "Commit"} as const;

/** A Git identifier for deployment, change, and release records. */
export const GitRef = /* @__PURE__ */ forwardRef<HTMLSpanElement, GitRefProps>(function GitRef({
  kind, value, kindLabel = gitRefLabels[kind], preserveEnd, className, ...props
}, ref) {
  return <span {...props} ref={ref} className={classes("flood-git-ref", className)}>
    <IconSlot size="sm" className="flood-git-ref__icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {kind === "branch" && <><path d="M6 9v6m12-6a9 9 0 0 1-9 9"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/></>}
        {kind === "tag" && <><path d="M3 4h8l10 10a2 2 0 0 1 0 2.8l-4.2 4.2a2 2 0 0 1-2.8 0L3 10Z"/><path d="M7.5 8h.01"/></>}
        {kind === "commit" && <><path d="M3 12h5m8 0h5"/><circle cx="12" cy="12" r="4"/></>}
      </svg>
    </IconSlot>
    <VisuallyHidden>{kindLabel} </VisuallyHidden>
    <code className="flood-git-ref__value" dir="ltr">
      <TruncatedText dir="ltr" preserveEnd={preserveEnd}>{value}</TruncatedText>
    </code>
  </span>;
});

export type ReviewRevisionState = "unreviewed" | "current" | "stale";

export interface ReviewRevisionProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Current commit identifier. */
  revision: string;
  /** Previously reviewed identifier when the host can show it. */
  reviewedRevision?: string;
  /** The host's assessment of the review for the current revision. */
  state: ReviewRevisionState;
  compareHref?: string;
  labels?: {
    group?: string;
    reviewed?: string;
    current?: string;
    compare?: string;
    states?: Partial<Record<ReviewRevisionState, string>>;
  };
}

const reviewRevisionStates = {
  unreviewed: { label: "Review pending", tone: "neutral" },
  current: { label: "Review up to date", tone: "success" },
  stale: { label: "Review out of date", tone: "warning" },
} as const;

/** Shows the revision a review covered beside the one now being considered. @since 0.2.14 */
export const ReviewRevision = /* @__PURE__ */ forwardRef<HTMLDivElement, ReviewRevisionProps>(function ReviewRevision(
  {revision, reviewedRevision, state, compareHref, labels, className, ...props}, ref,
) {
  if (!revision.trim() || (reviewedRevision !== undefined && !reviewedRevision.trim())) {
    throw new Error("Flood ReviewRevision requires nonempty revision identifiers");
  }
  const {label, tone} = reviewRevisionStates[state];
  const showPrevious = state === "stale" && reviewedRevision && reviewedRevision !== revision;
  return <Stack {...props} ref={ref} gap="2" role="group" aria-label={labels?.group ?? "Review revision"}
    className={classes("flood-review-revision", className)}>
    <Inline gap="2" className="flood-review-revision__header">
      <StatusIndicator size="sm" tone={tone} label={labels?.states?.[state] ?? label} />
      {state === "stale" && compareHref && <Text size="helper"><Link href={compareHref}>{labels?.compare ?? "Compare revisions"}</Link></Text>}
    </Inline>
    <ValueChange layout="stacked" before={showPrevious ? <GitRef kind="commit" value={reviewedRevision} /> : undefined}
      after={<GitRef kind="commit" value={revision} />}
      labels={{before:labels?.reviewed ?? "Reviewed",after:labels?.current ?? "Current",added:labels?.current ?? "Current"}} />
  </Stack>;
});

export interface CommitRecord {
  sha: string;
  shortSha?: string;
  message: string;
  href?: string;
  author?: string;
  dateTime?: string;
}

export interface CommitListProps extends Omit<DataListProps, "children" | "aria-label"> {
  label: string;
  commits: readonly CommitRecord[];
  empty?: ReactNode;
  copy?: boolean;
  copyLabels?: Pick<CopyButtonProps, "copyLabel" | "copiedLabel" | "errorLabel">;
  commitKindLabel?: string;
}

/** Read-only commit history with optional destinations and exact-hash copying. */
export const CommitList = /* @__PURE__ */ forwardRef<HTMLUListElement, CommitListProps>(function CommitList({
  label, commits, empty, copy = false, copyLabels, commitKindLabel, className, density = "compact", dividers = false, lang, ...props
}, ref) {
  if (!label.trim() || commits.some(commit => !commit.sha.trim() || !commit.message.trim()) ||
      new Set(commits.map(commit => commit.sha)).size !== commits.length) {
    throw new Error("Flood CommitList requires a name, unique nonempty hashes, and commit messages");
  }
  return <DataList {...props} ref={ref} aria-label={label} lang={lang} density={density} dividers={dividers}
    className={classes("flood-commit-list", className)}>
    {commits.length ? commits.map(({sha, shortSha, message, href, author, dateTime}) => <DataListItem
      key={sha} className="flood-commit-list__item"
      title={href ? <Link href={href} dir="auto">{message}</Link> : <Text size="compact" dir="auto">{message}</Text>}
      description={author || dateTime ? <Inline align="baseline" gap="2">
        {author && <Text tone="subtle" size="helper" dir="auto">{author}</Text>}
        {dateTime && <Timestamp dateTime={dateTime} lang={lang} />}
      </Inline> : undefined}
      actions={<Inline align="center" gap="1" className="flood-commit-list__ref">
        <GitRef kind="commit" value={shortSha || sha} kindLabel={commitKindLabel} />
        {copy && <CopyButton {...copyLabels} value={sha} iconOnly size="sm" variant="ghost"
          aria-label={`${copyLabels?.copyLabel ?? "Copy commit hash"} ${shortSha || sha}`} />}
      </Inline>}
    />) : hasFieldContent(empty) ? <li>{empty}</li> : null}
  </DataList>;
});

export type DeploymentStatus = "queued" | "building" | "deploying" | "active" | "failed" | "superseded" | "canceled";

export interface DeploymentRecord {
  id: string;
  label: string;
  status: DeploymentStatus;
  href?: string;
  revision?: Pick<GitRefProps, "kind" | "value" | "kindLabel" | "preserveEnd">;
  dateTime?: string;
  description?: string;
}

export interface DeploymentHistoryProps extends Omit<DataListProps, "children" | "aria-label" | "reserveSelectionSpace"> {
  label: string;
  deployments: readonly DeploymentRecord[];
  statusLabels?: Partial<Record<DeploymentStatus, string>>;
  renderActions?: (deployment: DeploymentRecord) => ReactNode;
  emptyContent?: ReactNode;
}

const deploymentStates = {
  queued: {label: "Queued", tone: "neutral"},
  building: {label: "Building", tone: "info"},
  deploying: {label: "Deploying", tone: "info"},
  active: {label: "Active", tone: "success"},
  failed: {label: "Failed", tone: "error"},
  superseded: {label: "Superseded", tone: "neutral"},
  canceled: {label: "Canceled", tone: "neutral"},
} as const;

/** Deployment outcomes for a service or environment, in host-supplied order. */
export const DeploymentHistory = /* @__PURE__ */ forwardRef<HTMLUListElement, DeploymentHistoryProps>(function DeploymentHistory({
  label, deployments, statusLabels, renderActions, emptyContent, density = "compact", dividers = false, lang, ...props
}, ref) {
  if (!label.trim() || deployments.some(deployment => !deployment.id.trim() || !deployment.label.trim()) ||
      new Set(deployments.map(deployment => deployment.id)).size !== deployments.length) {
    throw new Error("Flood DeploymentHistory requires a name and uniquely identified, named deployments");
  }
  return <DataList {...props} ref={ref} aria-label={label} lang={lang} density={density} dividers={dividers}>
    {deployments.length ? deployments.map(deployment => {
      const {id, label: title, status, href, revision, dateTime, description} = deployment;
      const state = deploymentStates[status];
      return <DataListItem key={id} layout="content"
        title={href ? <Link href={href} dir="auto">{title}</Link> : <Text size="compact" dir="auto">{title}</Text>}
        description={description && <Text size="compact" tone="subtle" dir="auto">{description}</Text>}
        details={(revision || dateTime) && <Inline align="center" gap="2">
          {revision && <GitRef {...revision} />}
          {dateTime && <Timestamp dateTime={dateTime} lang={lang} />}
        </Inline>}
        metadata={<StatusIndicator size="sm" label={statusLabels?.[status] ?? state.label} tone={state.tone} presentation="chip" />}
        actions={renderActions?.(deployment)}
      />;
    }) : hasFieldContent(emptyContent) ? <li>{emptyContent}</li> : null}
  </DataList>;
});

export type ReleaseTargetStatus = "not-started" | "deploying" | "released" | "failed" | "unknown";

export interface ReleaseTarget {
  id: string;
  label: string;
  /** State of the release named in the caption, as reported by the host. */
  status: ReleaseTargetStatus;
  /** The release serving this target. Null means none. Omit when unknown. */
  live?: {label: string; href?: string} | null;
  /** Optional detail about this rollout, such as the reason it failed. */
  detail?: string;
}

export interface ReleaseTargetMatrixProps extends Omit<TableProps, "children"> {
  targets: readonly ReleaseTarget[];
  labels?: Partial<Record<"target" | "live" | "rollout" | "noLive" | "unknownLive" | "empty", string>>;
  statusLabels?: Partial<Record<ReleaseTargetStatus, string>>;
}

const releaseTargetStates = {
  "not-started": {label: "Not started", tone: "neutral"},
  deploying: {label: "Deploying", tone: "info"},
  released: {label: "Released", tone: "success"},
  failed: {label: "Failed", tone: "error"},
  unknown: {label: "Unknown", tone: "neutral"},
} as const;

/** The rollout and currently serving release across deployment targets. @since 0.2.14 */
export const ReleaseTargetMatrix = /* @__PURE__ */ forwardRef<HTMLTableElement, ReleaseTargetMatrixProps>(function ReleaseTargetMatrix(
  {targets, caption, labels, statusLabels, density = "compact", className, ...props}, ref,
) {
  const ids = new Set(targets.map(target => target.id));
  if (!caption.trim() || ids.size !== targets.length || targets.some(target =>
    !target.id.trim() || !target.label.trim() || (target.live && !target.live.label.trim()),
  )) {
    throw new Error("Flood ReleaseTargetMatrix requires a caption and uniquely identified, named targets and live releases");
  }

  return <Table {...props} ref={ref} caption={caption} density={density} className={classes("flood-release-target-matrix", className)}>
    <thead><tr>
      <th scope="col" data-wrap="anywhere">{labels?.target ?? "Target"}</th>
      <th scope="col" data-wrap="anywhere">{labels?.live ?? "Live"}</th>
      <th scope="col" data-wrap="anywhere">{labels?.rollout ?? "Rollout"}</th>
    </tr></thead>
    <tbody>
      {targets.length ? targets.map(({id, label, live, status, detail}) => {
        const state = releaseTargetStates[status];
        return <tr key={id}>
          <th scope="row" data-wrap="anywhere"><bdi>{label}</bdi></th>
          <td data-wrap="anywhere">{live?.href ? <Link href={live.href} dir="auto">{live.label}</Link>
            : live ? <bdi>{live.label}</bdi>
            : <Text as="span" size="compact" tone="subtle">
              {live === null ? labels?.noLive ?? "None" : labels?.unknownLive ?? "Unknown"}
            </Text>}</td>
          <td data-wrap="anywhere"><Stack gap="1">
            <StatusIndicator size="sm" tone={state.tone} presentation="wrap" label={statusLabels?.[status] ?? state.label} />
            {detail && <Text size="helper" tone="subtle" dir="auto">{detail}</Text>}
          </Stack></td>
        </tr>;
      }) : <tr><td colSpan={3}><Text size="compact" tone="subtle">{labels?.empty ?? "No deployment targets."}</Text></td></tr>}
    </tbody>
  </Table>;
});

export type DeploymentHandoffRelease = Pick<DeploymentRecord, "id" | "label" | "href" | "revision">;

export type DeploymentHandoffState =
  | {phase: "preparing" | "completed"}
  | {phase: "overlapping" | "draining"; expectedEnd?: Pick<TimestampProps, "dateTime" | "children" | "timeZone">}
  | {phase: "failed"; reason?: string};

const deploymentHandoffStates = {
  preparing: {label:"Preparing",tone:"info"},
  serving: {label:"Serving",tone:"success"},
  overlapping: {label:"Overlapping",tone:"info"},
  draining: {label:"Draining",tone:"warning"},
  stopped: {label:"Stopped",tone:"neutral"},
  failed: {label:"Failed",tone:"error"},
} as const;

const deploymentHandoffStatuses = {
  preparing: ["serving","preparing"],
  overlapping: ["overlapping","serving"],
  draining: ["draining","serving"],
  completed: ["stopped","serving"],
  failed: ["serving","failed"],
} as const;

export interface DeploymentHandoffProps extends Omit<DataListProps, "children" | "aria-label" | "reserveSelectionSpace"> {
  label: string;
  previous: DeploymentHandoffRelease;
  replacement: DeploymentHandoffRelease;
  state: DeploymentHandoffState;
  labels?: {
    previous?: string;
    replacement?: string;
    expectedEnd?: string;
    statuses?: Partial<Record<keyof typeof deploymentHandoffStates, string>>;
  };
}

/** Inspect two releases during a deployment handoff. The host supplies their effective phase. @since 0.2.14 */
export const DeploymentHandoff = /* @__PURE__ */ forwardRef<HTMLUListElement, DeploymentHandoffProps>(function DeploymentHandoff(
  {label, previous, replacement, state, labels, density = "compact", dividers = false, lang, ...props}, ref,
) {
  if (!label.trim() || !previous.id.trim() || !replacement.id.trim() || previous.id === replacement.id ||
      !previous.label.trim() || !replacement.label.trim()) {
    throw new Error("Flood DeploymentHandoff requires a name and two distinct named releases");
  }
  const [previousStatus, replacementStatus] = deploymentHandoffStatuses[state.phase];
  const expectedEnd = state.phase === "overlapping" || state.phase === "draining" ? state.expectedEnd : undefined;
  const rows = [
    {release:previous,role:labels?.previous ?? "Previous",status:previousStatus,expectedEnd},
    {release:replacement,role:labels?.replacement ?? "Replacement",status:replacementStatus},
  ];
  return <DataList {...props} ref={ref} aria-label={label} lang={lang} density={density} dividers={dividers}>
    {rows.map(({release,status,role,expectedEnd}) => {
      const phase = deploymentHandoffStates[status];
      return <DataListItem key={release.id} layout="content"
        title={<Stack gap="1">
          <Text size="helper" tone="subtle">{role}</Text>
          {release.href ? <Link href={release.href} dir="auto">{release.label}</Link> : <Text size="compact" dir="auto">{release.label}</Text>}
        </Stack>}
        description={status === "failed" && state.phase === "failed" && state.reason
          ? <Text size="compact" tone="subtle" dir="auto">{state.reason}</Text> : undefined}
        details={(release.revision || expectedEnd) && <Inline gap="2">
          {release.revision && <GitRef {...release.revision} />}
          {expectedEnd && <Inline gap="1">
            <Text size="helper" tone="subtle">{labels?.expectedEnd ?? "Expected end"}</Text>
            <Timestamp format="date-time" lang={lang} {...expectedEnd} />
          </Inline>}
        </Inline>}
        metadata={<StatusIndicator size="sm" presentation="wrap" label={labels?.statuses?.[status] ?? phase.label} tone={phase.tone} />}
      />;
    })}
  </DataList>;
});

export type DatabaseSessionState = "active" | "idle" | "idle-in-transaction" | "aborted" | "unknown";

export interface DatabaseSessionReference {
  id: string;
  label: string;
  href?: string;
}

export interface DatabaseSessionRecord extends DatabaseSessionReference {
  state: DatabaseSessionState;
  pid?: number;
  duration?: string;
  /** A display-safe operation label. */
  operation?: string;
  /** A confirmed lock wait. Omit blockers when their identity is unknown or restricted. */
  lockWait?: {blockers?: readonly DatabaseSessionReference[]};
}

const databaseSessionStates = {
  active:{label:"Active",tone:"success"},
  idle:{label:"Idle",tone:"neutral"},
  "idle-in-transaction":{label:"Idle in transaction",tone:"warning"},
  aborted:{label:"Aborted transaction",tone:"error"},
  unknown:{label:"Unknown",tone:"neutral"},
  blocked:{label:"Waiting for lock",tone:"warning"},
} as const;

export interface DatabaseSessionListProps extends Omit<DataListProps, "children" | "aria-label" | "reserveSelectionSpace"> {
  label: string;
  sessions: readonly DatabaseSessionRecord[];
  renderActions?: (session: DatabaseSessionRecord) => ReactNode;
  emptyContent?: ReactNode;
  labels?: {
    pid?: string;
    blockedBy?: string;
    states?: Partial<Record<keyof typeof databaseSessionStates, string>>;
  };
}

/** A database session list with observed lock waits and linked blockers. @since 0.2.14 */
export const DatabaseSessionList = /* @__PURE__ */ forwardRef<HTMLUListElement, DatabaseSessionListProps>(function DatabaseSessionList(
  {label, sessions, renderActions, emptyContent, labels, density = "compact", dividers = false, ...props}, ref,
) {
  const scope = useId();
  const anchors = new Map(sessions.map((session,index) => [session.id,`${scope}-session-${index}`]));
  if (!label.trim() || sessions.some(session => !session.id.trim() || !session.label.trim()) ||
      anchors.size !== sessions.length) {
    throw new Error("Flood DatabaseSessionList requires a name and uniquely identified, named sessions");
  }
  return <DataList {...props} ref={ref} aria-label={label} density={density} dividers={dividers}>
    {sessions.length ? sessions.map(session => {
      const {id, label:title, href, state, pid, duration, operation, lockWait} = session;
      const visibleState = lockWait ? "blocked" : state;
      const status = databaseSessionStates[visibleState];
      const blockers = lockWait?.blockers ?? [];
      return <DataListItem key={id} id={anchors.get(id)} tabIndex={-1} layout="content"
        title={href ? <Link href={href} dir="auto">{title}</Link> : <Text size="compact" dir="auto">{title}</Text>}
        description={operation && <Text size="compact" tone="subtle" dir="auto">{operation}</Text>}
        details={(pid !== undefined || duration || blockers.length > 0) && <Stack gap="1">
          {(pid !== undefined || duration) && <Inline gap="2">
            {pid !== undefined && <Text size="helper" tone="subtle">{labels?.pid ?? "PID"} <InlineCode size="sm">{pid}</InlineCode></Text>}
            {duration && <Text size="helper" tone="subtle">{duration}</Text>}
          </Inline>}
          {blockers.length > 0 && <Inline gap="1">
            <Text size="helper" tone="subtle">{labels?.blockedBy ?? "Blocked by"}</Text>
            {blockers.map(blocker => {
              const target = blocker.id !== id ? anchors.get(blocker.id) : undefined;
              const href = blocker.href ?? (target ? `#${target}` : undefined);
              return <Text key={blocker.id} size="helper" dir="auto">
                {href ? <Link href={href}>{blocker.label}</Link> : blocker.label}
              </Text>;
            })}
          </Inline>}
        </Stack>}
        metadata={<StatusIndicator size="sm" presentation="wrap" label={labels?.states?.[visibleState] ?? status.label} tone={status.tone} />}
        actions={renderActions?.(session)}
      />;
    }) : hasFieldContent(emptyContent) ? <li>{emptyContent}</li> : null}
  </DataList>;
});

export interface IndexCostEstimate {
  before: number;
  after: number;
}

export interface IndexRecommendationProps extends Omit<SectionProps, "children"> {
  estimate: {total: IndexCostEstimate; startup?: IndexCostEstimate};
  /** Exact, display-safe statements supplied by the advisor. */
  sql: string;
  labels?: {
    estimate?: string;
    total?: string;
    startup?: string;
    copy?: string;
    copied?: string;
    copyError?: string;
  };
}

/** Review estimated query cost and copy one proposed index script. @since 0.2.14 */
export const IndexRecommendation = /* @__PURE__ */ forwardRef<HTMLElement, IndexRecommendationProps>(function IndexRecommendation(
  {estimate, sql, labels, headingSize = "group", lang, ...props}, ref,
) {
  const costs = [estimate.total, ...(estimate.startup ? [estimate.startup] : [])];
  if (!sql.trim() || costs.some(({before,after}) =>
    !Number.isFinite(before) || before < 0 || !Number.isFinite(after) || after < 0)) {
    throw new Error("Flood IndexRecommendation requires SQL and nonnegative, finite cost estimates");
  }
  const format = new Intl.NumberFormat(lang,{maximumSignificantDigits:8});
  const change = (id: string, label: string, cost: IndexCostEstimate): ChangeListItem => ({
    id, label, before:format.format(cost.before), after:format.format(cost.after),
  });
  const items = [change("total",labels?.total ?? "Total cost",estimate.total)];
  if (estimate.startup) items.push(change("startup",labels?.startup ?? "Startup cost",estimate.startup));
  const estimateId = useId();
  return <Section {...props} ref={ref} headingSize={headingSize} lang={lang}>
    <Stack gap="4">
      <Stack gap="2">
        <Text as="p" id={estimateId} size="label">{labels?.estimate ?? "Estimated planner cost"}</Text>
        <ChangeList items={items} aria-labelledby={estimateId} density="compact" layout="columns" />
      </Stack>
      <CodeSnippet code={sql} action={<CopyButton value={sql} iconOnly size="sm" variant="ghost"
        copyLabel={labels?.copy ?? "Copy SQL"} copiedLabel={labels?.copied} errorLabel={labels?.copyError} />} />
    </Stack>
  </Section>;
});

export interface HttpStatusProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** An HTTP response code from 100 through 599. */
  code: number;
  /** Optional human-readable status supplied by the host. */
  reason?: string;
}

const httpStatusTones = ["info", "success", "neutral", "warning", "error"] as const;

/** Numeric HTTP outcome with an optional reason in running text. */
export const HttpStatus = /* @__PURE__ */ forwardRef<HTMLSpanElement, HttpStatusProps>(function HttpStatus({
  code, reason, className, ...props
}, ref) {
  if (!Number.isInteger(code) || code < 100 || code > 599) throw new RangeError("Flood HttpStatus requires an HTTP response code from 100 to 599");
  return <span {...props} ref={ref} className={classes("flood-http-status", className)}>
    <Badge size="sm" tone={httpStatusTones[Math.floor(code / 100) - 1]} dir="ltr">
      <VisuallyHidden>HTTP{" "}</VisuallyHidden>{code}
    </Badge>
    {reason && <Text size="helper" tone="subtle" dir="auto">{reason}</Text>}
  </span>;
});

export type HttpRequestOutcome =
  | {kind:"response"; code: number}
  | {kind:"pending" | "no-response"; label?: string};

function HttpOutcomeMark({outcome}: {outcome: HttpRequestOutcome}) {
  return outcome.kind === "response" ? <HttpStatus code={outcome.code} />
    : <StatusIndicator size="sm" tone={outcome.kind === "pending" ? "neutral" : "error"}
      label={outcome.label ?? (outcome.kind === "pending" ? "In progress" : "No response")} />;
}

export interface HttpRequestRowProps extends Omit<DataListItemProps, "title" | "description" | "metadata" | "layout"> {
  method: string;
  /** Display-safe path or route template. Strip credentials and sensitive query data upstream. */
  path: string;
  outcome: HttpRequestOutcome;
  /** A localized duration with its unit. Omit when the duration is unknown. */
  duration?: string;
  timestamp?: {dateTime: string; label: string};
  source?: string;
  preservePathEnd?: number;
}

/** Show the route and outcome of one HTTP request inside a DataList. @since 0.2.14 */
export const HttpRequestRow = /* @__PURE__ */ forwardRef<HTMLLIElement, HttpRequestRowProps>(function HttpRequestRow(
  {method, path, outcome, duration, timestamp, source, preservePathEnd, className, ...props}, ref,
) {
  return <DataListItem {...props} ref={ref} layout="content" className={classes("flood-http-request-row", className)}
    title={<EndpointLabel method={method} path={path} preserveEnd={preservePathEnd} />}
    description={(timestamp || source) && <Inline gap="2" align="baseline">
      {timestamp && <Timestamp dateTime={timestamp.dateTime} size="helper">{timestamp.label}</Timestamp>}
      {source && <Text size="helper" tone="subtle" dir="auto">{source}</Text>}
    </Inline>}
    metadata={<Inline gap="2" align="center" className="flood-http-request-row__outcome">
      <HttpOutcomeMark outcome={outcome} />
      {duration && <Text size="helper" tone="subtle" className="flood-http-request-row__duration">{duration}</Text>}
    </Inline>} />;
});

export interface HttpMessageCapture {
  /** Display-safe fields in received order, with a unique ID per occurrence. */
  headers?: readonly {id: string; name: string; value: string}[];
  /** An authorized, redacted display string. Omit if unavailable. */
  body?: string;
  /** Explain why a capture is unavailable when the host knows the reason. */
  unavailableMessage?: string;
}

export interface HttpExchangeDetailsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  method: string;
  path: string;
  outcome: HttpRequestOutcome;
  duration?: string;
  request?: HttpMessageCapture;
  response?: HttpMessageCapture;
  /** The host can retain the active panel when changing the inspected record. */
  value?: "request" | "response";
  onValueChange?: (value: "request" | "response") => void;
  labels?: {tabs?: string; request?: string; response?: string; headers?: string; body?: string; emptyBody?: string; unavailable?: string; pending?: string; noResponse?: string};
}

/** Inspect the captured sides of one HTTP exchange. @since 0.2.14 */
export const HttpExchangeDetails = /* @__PURE__ */ forwardRef<HTMLDivElement, HttpExchangeDetailsProps>(function HttpExchangeDetails(
  {method, path, outcome, duration, request, response, value, onValueChange, labels, ...props}, ref,
) {
  const renderCapture = (capture?: HttpMessageCapture, unavailable?: string) => {
    const headers = capture?.headers ?? [];
    const body = capture?.body;
    return <Stack gap="4" className="flood-http-exchange__panel">
      {headers.length > 0 && <Section title={labels?.headers ?? "Headers"} headingLevel={3} headingSize="group">
        <DescriptionList layout="columns" density="compact" items={headers.map(header => ({
          id:header.id, term:header.name, description:<Text size="compact" dir="auto">{header.value}</Text>,
        }))} />
      </Section>}
      {body !== undefined && <Section title={labels?.body ?? "Body"} headingLevel={3} headingSize="group">
        {body.length > 0 ? <CodeSnippet code={body} /> : <Text size="compact" tone="subtle">{labels?.emptyBody ?? "Empty body."}</Text>}
      </Section>}
      {!headers.length && body === undefined && <Text size="compact" tone="subtle">
        {capture?.unavailableMessage ?? unavailable ?? labels?.unavailable ?? "No capture available."}
      </Text>}
    </Stack>;
  };
  const responseUnavailable = outcome.kind === "pending" ? labels?.pending ?? "Waiting for a response."
    : outcome.kind === "no-response" ? labels?.noResponse ?? "The request ended without a response." : undefined;

  return <Stack gap="4" {...props} ref={ref}>
    <Inline gap="3" align="center" className="flood-http-exchange__summary">
      <EndpointLabel method={method} path={path} />
      <Inline gap="2" align="center" className="flood-http-exchange__result">
        <HttpOutcomeMark outcome={outcome} />
        {duration && <Text size="helper" tone="subtle">{duration}</Text>}
      </Inline>
    </Inline>
    <Tabs label={labels?.tabs ?? "HTTP exchange"} variant="line" controlSize="sm" defaultValue="request"
      value={value} onValueChange={next => {
        if (next === "request" || next === "response") onValueChange?.(next);
      }} items={[
        {value:"request",label:labels?.request ?? "Request",content:renderCapture(request)},
        {value:"response",label:labels?.response ?? "Response",
          content:renderCapture(outcome.kind === "response" ? response : undefined,responseUnavailable)},
      ]} />
  </Stack>;
});

export interface RowChangeCapture {
  /** Use partial when only some columns were captured, for example the row key. */
  coverage: "complete" | "partial";
  /** Visible, authorized fields from the event. JSON null remains an observed value. */
  row: Readonly<Record<string, JsonValue>>;
}

export type RowChangeEvent =
  | {operation: "insert"; after?: RowChangeCapture; before?: never}
  | {operation: "update"; after?: RowChangeCapture; before?: RowChangeCapture}
  | {operation: "delete"; before?: RowChangeCapture; after?: never};

export interface RowChangeDetailsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  table: string;
  event: RowChangeEvent;
  timestamp?: {dateTime: string; label: string};
  searchable?: boolean;
  labels?: Partial<Record<RowChangeEvent["operation"] | "tabs" | "before" | "after" | "row" | "partial" | "unavailable", string>>;
  inspectorLabels?: JsonInspectorLabels;
}

const rowChangeLabels = {
  insert: {label:"Inserted", tone:"success"},
  update: {label:"Updated", tone:"info"},
  delete: {label:"Deleted", tone:"error"},
} as const;

/** Inspect an authorized capture from one database row event. @since 0.2.14 */
export const RowChangeDetails = /* @__PURE__ */ forwardRef<HTMLDivElement, RowChangeDetailsProps>(function RowChangeDetails(
  {table, event, timestamp, searchable = false, labels, inspectorLabels, ...props}, ref,
) {
  if (!table.trim()) throw new Error("Flood RowChangeDetails requires a named table");
  const {operation, before, after} = event;
  const state = rowChangeLabels[operation];
  const beforeLabel = labels?.before ?? "Before";
  const afterLabel = labels?.after ?? "After";
  const snapshot = (capture: RowChangeCapture | undefined, label: string) => <Stack gap="2">
    {capture ? <>
      {capture.coverage === "partial" && <StatusIndicator tone="warning" size="sm" presentation="wrap"
        label={labels?.partial ?? "Partial capture"} />}
      <JsonInspector label={label} rootLabel={labels?.row ?? "Row"} value={capture.row} searchable={searchable} labels={inspectorLabels} />
    </> : <Text size="compact" tone="subtle">{labels?.unavailable ?? "Snapshot unavailable."}</Text>}
  </Stack>;

  return <Stack {...props} ref={ref} gap="3">
    <Inline gap="2">
      <InlineCode size="sm" wrap dir="auto">{table}</InlineCode>
      <StatusIndicator size="sm" tone={state.tone} presentation="wrap" label={labels?.[operation] ?? state.label} />
      {timestamp && <Timestamp dateTime={timestamp.dateTime}>{timestamp.label}</Timestamp>}
    </Inline>
    {operation === "update" ? <Tabs key={operation} label={labels?.tabs ?? "Row snapshots"} variant="line" controlSize="sm"
      defaultValue={after || !before ? "after" : "before"} items={[
        {value:"before",label:beforeLabel,content:snapshot(before,beforeLabel)},
        {value:"after",label:afterLabel,content:snapshot(after,afterLabel)},
      ]} />
      : <Section title={operation === "insert" ? afterLabel : beforeLabel} headingSize="group">
        {operation === "insert" ? snapshot(after,afterLabel) : snapshot(before,beforeLabel)}
      </Section>}
  </Stack>;
});

const restartPolicyModes = ["on-failure", "always", "never"] as const;
export type RestartPolicyMode = typeof restartPolicyModes[number];

export interface RestartPolicyDraft {
  mode: RestartPolicyMode;
  /** Retained while the limit is inactive so switching modes does not erase it. */
  maxRestarts: number | null;
}

export interface RestartPolicyEditorProps extends Omit<FieldsetProps, "children" | "legend" | "name" | "onChange"> {
  label?: string;
  value: RestartPolicyDraft;
  onValueChange: (value: RestartPolicyDraft) => void;
  modeName?: string;
  limitName?: string;
  /** A service-specific upper bound for the on-failure policy. */
  maxAllowedRestarts?: number;
  unavailableModes?: Partial<Record<RestartPolicyMode, string>>;
  controlSize?: NumberInputProps["controlSize"];
  labels?: {
    mode?: string;
    limit?: string;
    modes?: Partial<Record<RestartPolicyMode, string>>;
    consequences?: Partial<Record<RestartPolicyMode, string>>;
    limitHint?: (max: number) => string;
  };
}

/** Edit the automatic restart policy of one service. @since 0.2.14 */
export const RestartPolicyEditor = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, RestartPolicyEditorProps>(function RestartPolicyEditor(
  {label = "Automatic restarts", value, onValueChange, modeName, limitName, maxAllowedRestarts, unavailableModes,
    controlSize = "md", disabled = false, labels, form, ...props}, ref,
) {
  if (maxAllowedRestarts !== undefined && (!Number.isSafeInteger(maxAllowedRestarts) || maxAllowedRestarts < 1)) {
    throw new RangeError("Flood RestartPolicyEditor requires a positive whole maximum");
  }
  const modes = {"on-failure":"On failure", always:"Always", never:"Never"};
  const consequences = {
    "on-failure":"Restart after an unsuccessful exit.",
    always:"Restart whenever the service stops.",
    never:"Leave the service stopped.",
  };
  const unavailableReason = unavailableModes?.[value.mode];
  return <Fieldset {...props} legend={label} ref={ref} form={form} disabled={disabled}>
    <Field label={labels?.mode ?? "Policy"} error={unavailableReason}
      hint={unavailableReason ? undefined : labels?.consequences?.[value.mode] ?? consequences[value.mode]}>
      {field => <Select {...field} form={form} name={modeName} required value={unavailableReason ? "" : value.mode}
        disabled={disabled} controlSize={controlSize}
        onInvalid={unavailableReason ? event => {
          event.preventDefault();
          event.currentTarget.ownerDocument.getElementById(field.id)?.focus();
        } : undefined}
        onChange={event => {
          const mode = restartPolicyModes.find(option => option === event.currentTarget.value && !unavailableModes?.[option]);
          if (mode) onValueChange({...value,mode});
        }}>
        {unavailableReason && <option value="" disabled hidden>{labels?.modes?.[value.mode] ?? modes[value.mode]}</option>}
        {restartPolicyModes.map(mode =>
          <option value={mode} key={mode} disabled={Boolean(unavailableModes?.[mode])}>{labels?.modes?.[mode] ?? modes[mode]}</option>)}
      </Select>}
    </Field>
    {value.mode === "on-failure" && <Field label={labels?.limit ?? "Maximum restarts"} required
      hint={maxAllowedRestarts === undefined ? undefined :
        labels?.limitHint?.(maxAllowedRestarts) ?? `Up to ${maxAllowedRestarts} ${maxAllowedRestarts === 1 ? "restart" : "restarts"}.`}>
      {field => <NumberInput {...field} form={form} name={limitName} appearance="plain" controlSize={controlSize}
        value={value.maxRestarts} min={1} max={maxAllowedRestarts} step={1} disabled={disabled || Boolean(unavailableReason)}
        onValueChange={maxRestarts => onValueChange({...value,maxRestarts})} />}
    </Field>}
  </Fieldset>;
});

export type DeploymentHealthProbe =
  | { kind: "http"; code: number; reason?: string }
  | { kind: "no-response"; reason?: string };

export type DeploymentHealthCheckState =
  | { phase: "not-configured" }
  | {
    phase: "checking" | "passed" | "failed";
    path: string;
    timeoutSeconds: number;
    elapsedSeconds?: number;
    lastProbe?: DeploymentHealthProbe;
  };

export interface DeploymentHealthCheckProps extends Omit<SectionProps, "children" | "title" | "actions"> {
  title?: string;
  state: DeploymentHealthCheckState;
  /** An optional action for the enclosing deployment, such as a link to its logs. */
  action?: ReactNode;
  formatDuration?: (seconds: number) => string;
  labels?: {
    phases?: Partial<Record<DeploymentHealthCheckState["phase"], string>>;
    path?: string;
    timeout?: string;
    elapsed?: string;
    response?: string;
    noResponse?: string;
  };
}

/** Show the readiness decision and last probe for one deployment. */
export const DeploymentHealthCheck = /* @__PURE__ */ forwardRef<HTMLElement, DeploymentHealthCheckProps>(function DeploymentHealthCheck(
  { title = "Deployment health check", state, action, formatDuration = seconds => `${seconds} s`,
    labels, headingSize = "group", ...props }, ref,
) {
  const {phase} = state;
  const phases = {
    "not-configured": {label:"Not configured", tone:"neutral"},
    checking: {label:"Checking", tone:"info"},
    passed: {label:"Passed", tone:"success"},
    failed: {label:"Failed", tone:"error"},
  } as const;
  const details: DescriptionItem[] = [];
  let progress: ReactNode;
  if (phase !== "not-configured") {
    const {path, timeoutSeconds, elapsedSeconds, lastProbe} = state;
    if (!path.trim() || !Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0 ||
        (elapsedSeconds !== undefined && (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0))) {
      throw new RangeError("Flood DeploymentHealthCheck needs a path, positive timeout and nonnegative elapsed seconds");
    }
    details.push({id:"path",term:labels?.path ?? "Path",description:<InlineCode dir="ltr" size="sm">{path}</InlineCode>});
    if (elapsedSeconds === undefined) {
      details.push({id:"timeout",term:labels?.timeout ?? "Timeout",description:formatDuration(timeoutSeconds)});
    }
    if (lastProbe) details.push({id:"response",term:labels?.response ?? "Last probe",
      description:lastProbe.kind === "http"
        ? <HttpStatus code={lastProbe.code} reason={lastProbe.reason}/>
        : lastProbe.reason ?? labels?.noResponse ?? "No response"});
    if (elapsedSeconds !== undefined) {
      const elapsedLabel = labels?.elapsed ?? "Elapsed time";
      const elapsed = `${formatDuration(elapsedSeconds)} / ${formatDuration(timeoutSeconds)}`;
      if (phase === "checking") {
        progress = <Progress size="sm" tone="info" label={elapsedLabel} value={Math.min(elapsedSeconds, timeoutSeconds)}
          max={timeoutSeconds} valueText={elapsed}/>;
      } else {
        details.push({id:"elapsed",term:elapsedLabel,description:elapsed});
      }
    }
  }
  const hasAction = hasFieldContent(action);
  return <Section {...props} ref={ref} title={title} headingSize={headingSize}
    actions={<StatusIndicator size="sm" label={labels?.phases?.[phase] ?? phases[phase].label} tone={phases[phase].tone}/>}>
    {details.length > 0 || hasAction ? <Stack gap="3">
      {details.length > 0 && <DescriptionList items={details} layout="columns" density="compact"/>}
      {progress}
      {hasAction && <Inline gap="2">{action}</Inline>}
    </Stack> : null}
  </Section>;
});

export type ServiceRuntimeState =
  | {phase: "sleeping"; since?: string}
  | {phase: "waking"; since?: string; elapsedMilliseconds?: number}
  | {phase: "running"; since?: string; startupMilliseconds?: number}
  | {phase: "wake-failed"; since?: string; reason?: string}
  | {phase: "unknown"};

export interface ServiceRuntimeStatusProps extends Omit<SectionProps, "children" | "title" | "actions"> {
  title: string;
  state: ServiceRuntimeState;
  timeZone?: string;
  /** Announce host-reported phase changes when this view is actively monitored. */
  announce?: boolean;
  labels?: Partial<Record<"since" | "elapsed" | "startup" | ServiceRuntimeState["phase"], string>>;
}

const runtimePhases = {
  sleeping: {label:"Sleeping",tone:"neutral"},
  waking: {label:"Waking",tone:"info"},
  running: {label:"Running",tone:"success"},
  "wake-failed": {label:"Wake failed",tone:"error"},
  unknown: {label:"Runtime unavailable",tone:"neutral"},
} as const;

/** Present a service's reported scale-to-zero lifecycle and observed startup data. @since 0.2.14 */
export const ServiceRuntimeStatus = /* @__PURE__ */ forwardRef<HTMLElement, ServiceRuntimeStatusProps>(function ServiceRuntimeStatus(
  {title,state,timeZone = "UTC",announce,labels,lang,headingSize = "group",...props}, ref,
) {
  const {phase} = state;
  const {label,tone} = runtimePhases[phase];
  const items: DescriptionItem[] = [];
  if (phase !== "unknown" && state.since) {
    items.push({id:"since",term:labels?.since ?? "Since",
      description:<Timestamp dateTime={state.since} format="date-time" timeZone={timeZone} lang={lang} size="compact" />});
  }
  const elapsed = phase === "waking" ? state.elapsedMilliseconds
    : phase === "running" ? state.startupMilliseconds : undefined;
  if (elapsed !== undefined) {
    const term = phase === "waking" ? labels?.elapsed ?? "Elapsed" : labels?.startup ?? "Last startup";
    items.push({id:"elapsed",term,description:<Duration milliseconds={elapsed} unit="second" lang={lang} />});
  }

  const failureReason = phase === "wake-failed" ? state.reason : undefined;
  return <Section {...props} ref={ref} lang={lang} title={title} headingSize={headingSize}
    actions={<StatusIndicator label={labels?.[phase] ?? label} tone={tone} size="sm" presentation="wrap" announce={announce} />}>
    {(items.length > 0 || failureReason) && <Stack gap="3">
      {items.length > 0 && <DescriptionList items={items} layout="inline" />}
      {failureReason && <Text as="p" size="compact" tone="subtle" dir="auto">{failureReason}</Text>}
    </Stack>}
  </Section>;
});

export interface CopyableValueProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  value: string;
  appearance?: "text" | "code";
  /** Wrap when the entire value must stay visible. Truncate in a dense row with room for a recognizable prefix. */
  overflow?: "wrap" | "truncate";
  /** Preserve trailing characters in truncate mode, for identifiers that differ at the end. */
  preserveEnd?: number;
  copyLabel?: string;
  copiedLabel?: string;
  errorLabel?: string;
}

function PresentedValue({value, appearance, overflow, preserveEnd}: Pick<CopyableValueProps, "value"|"appearance"|"overflow"|"preserveEnd">) {
  if (overflow === "truncate") {
    return <OverflowingText appearance={appearance} dir="auto" preserveEnd={preserveEnd} className="flood-copyable-value__text">{value}</OverflowingText>;
  }
  return appearance === "code"
    ? <InlineCode size="sm" className="flood-copyable-value__text"><bdi>{value}</bdi></InlineCode>
    : <Text size="compact" className="flood-copyable-value__text"><bdi>{value}</bdi></Text>;
}

/** A readable value with a named, compact clipboard action. */
export const CopyableValue = /* @__PURE__ */ forwardRef<HTMLSpanElement, CopyableValueProps>(function CopyableValue(
  {value, appearance = "text", overflow = "wrap", preserveEnd, copyLabel = "Copy value", copiedLabel, errorLabel, className, ...props}, ref,
) {
  return <span {...props} ref={ref} className={classes("flood-copyable-value", className)}>
    <PresentedValue value={value} appearance={appearance} overflow={overflow} preserveEnd={preserveEnd}/>
    <CopyButton iconOnly size="xs" variant="ghost" value={value}
      copyLabel={copyLabel} copiedLabel={copiedLabel} errorLabel={errorLabel} />
  </span>;
});

export interface RevealValueProps extends CopyableValueProps {
  visible?: boolean;
  defaultVisible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  copyable?: boolean;
  showLabel?: string;
  hideLabel?: string;
  hiddenValueLabel?: string;
}

/** A visually masked read-only value with an explicit reveal action. */
export const RevealValue = /* @__PURE__ */ forwardRef<HTMLSpanElement, RevealValueProps>(function RevealValue(
  {value, appearance="code", overflow="truncate", preserveEnd, visible, defaultVisible=false, onVisibleChange,
    copyable=false, showLabel="Show value", hideLabel="Hide value", hiddenValueLabel="Value hidden",
    copyLabel="Copy value", copiedLabel, errorLabel, className, ...props}, ref,
){
  const valueId = useId();
  const [localVisible,setLocalVisible] = useState(defaultVisible);
  const shown = visible ?? localVisible;
  const actionLabel = shown ? hideLabel : showLabel;
  return <span {...props} ref={ref} className={classes("flood-copyable-value","flood-reveal-value",className)}>
    <span id={valueId} className="flood-reveal-value__display">
      {shown ? <PresentedValue value={value} appearance={appearance} overflow={overflow} preserveEnd={preserveEnd}/> : <>
        <span className="flood-reveal-value__mask" aria-hidden="true"><PresentedValue value="••••••••" appearance={appearance}/></span>
        <VisuallyHidden>{hiddenValueLabel}</VisuallyHidden>
      </>}
    </span>
    <span className="flood-reveal-value__actions">
      <IconButton size="xs" variant="ghost" label={actionLabel} title={actionLabel}
        aria-expanded={shown} aria-controls={valueId} onClick={()=>{
          if (visible === undefined) setLocalVisible(!shown);
          onVisibleChange?.(!shown);
        }}><VisibilityGlyph visible={shown}/></IconButton>
      {copyable && <CopyButton key={String(shown)} iconOnly size="xs" variant="ghost" value={shown ? value : ""} disabled={!shown}
        copyLabel={copyLabel} copiedLabel={copiedLabel} errorLabel={errorLabel}/>}
    </span>
  </span>;
});

export interface MetricTrend {
  label: string;
  direction: "up" | "down" | "flat";
  tone?: SemanticTone;
  /** A comparison period or baseline such as “vs last month”. */
  context?: string;
  /** Use a tint when the change needs a distinct marker among neighboring values. */
  variant?: "plain" | "chip";
}

export interface MetricDeltaProps extends MetricTrend, Omit<HTMLAttributes<HTMLSpanElement>, "children"> {}

/** A directional comparison whose visual tone is chosen independently. */
export const MetricDelta = /* @__PURE__ */ forwardRef<HTMLSpanElement, MetricDeltaProps>(function MetricDelta(
  {label, direction, tone = "neutral", context, variant = "plain", className, ...props}, ref,
) {
  if (!label.trim()) throw new Error("Flood MetricDelta requires meaningful comparison text");
  const change = <>
    <span aria-hidden="true">{direction === "up" ? "↑" : direction === "down" ? "↓" : "→"}</span>
    <bdi>{label}</bdi>
  </>;
  return <span {...props} ref={ref} className={classes("flood-metric-delta", className)} data-tone={tone} data-variant={variant}>
    {variant === "chip" ? <Badge size="sm" tone={tone}>{change}</Badge> : <span className="flood-metric-delta__change">{change}</span>}
    {context?.trim() && <>{" "}<bdi className="flood-metric-delta__context">{context}</bdi></>}
  </span>;
});
export interface MetricProps extends Omit<HTMLAttributes<HTMLDListElement>, "children"> {
  label: string;
  value: ReactNode;
  state?: "ready" | "loading" | "unavailable";
  loadingLabel?: string;
  unavailableLabel?: string;
  /** A trailing unit such as ms or GB. */
  unit?: string;
  hint?: ReactNode;
  trend?: MetricTrend;
  size?: ContentSize;
}
export const Metric = /* @__PURE__ */ forwardRef<HTMLDListElement, MetricProps>(function Metric(
  {size = "md", ...props}, ref,
) { return <MeasuredValue {...props} ref={ref} size={size}/>; });

type MetricContent = Pick<MetricProps, "label" | "value" | "unit" | "hint" | "trend" | "state" | "loadingLabel" | "unavailableLabel">;

export interface MetricCardProps extends Omit<SurfaceProps, "children"> {
  metric: MetricContent & Pick<MetricProps, "size">;
  /** Optional compact chart for the same measure, reading after the value. */
  chart?: ReactNode;
  /** Override chart loading when its data arrives independently of the value. */
  chartLoading?: boolean;
  /** Expected block size of the chart, including any visible caption. */
  chartMinHeight?: CSSProperties["minBlockSize"];
  layout?: "inline" | "stacked";
}

/** A metric and its optional history on one shared surface. */
export const MetricCard = /* @__PURE__ */ forwardRef<HTMLDivElement, MetricCardProps>(function MetricCard(
  {metric, chart, chartLoading, chartMinHeight, layout = "inline", padding = "4", className, ...props}, ref,
) {
  const value = <Metric {...metric} />;
  const loadingPlot = chartLoading ?? metric.state === "loading";
  const plot = (hasFieldContent(chart) || chartLoading === true) && (
    <div className="flood-metric-card__chart" aria-busy={loadingPlot || undefined} style={{minBlockSize: chartMinHeight}}>
      {loadingPlot ? <Skeleton shape="rounded" className="flood-metric-card__chart-placeholder" style={{blockSize: chartMinHeight}}/> : chart}
    </div>
  );
  return <Surface {...props} ref={ref} padding={padding} data-layout={layout} className={classes("flood-metric-card", className)}>
    {layout === "inline"
      ? <Inline gap="3" align="center" className="flood-metric-card__body">{value}{plot}</Inline>
      : <Stack gap="3" className="flood-metric-card__body">{value}{plot}</Stack>}
  </Surface>;
});

export interface MetricGroupItem extends MetricContent {
  id: string;
}

export interface MetricGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label"> {
  label: string;
  items: readonly MetricGroupItem[];
  appearance?: "plain" | "panel";
  /** Use rows for a vertical summary with end-aligned values. */
  layout?: "grid" | "rows";
  size?: ContentSize;
  /** Minimum item width in the grid layout. */
  minItemWidth?: GridProps["minItemWidth"];
}

/** Related metrics that share value alignment and one optional surface. */
export const MetricGroup = /* @__PURE__ */ forwardRef<HTMLDivElement, MetricGroupProps>(function MetricGroup(
  {label, items, size = "sm", appearance = "plain", layout = "grid", minItemWidth = "10rem", className, ...props}, ref,
) {
  if (!label.trim() || items.some(item => !item.id.trim()) || new Set(items.map(item => item.id)).size !== items.length) {
    throw new Error("Flood MetricGroup requires a label and unique nonempty item IDs");
  }
  const metrics = items.map(({id, ...metric}) => <Metric key={id} {...metric} size={size} />);
  const groupProps = { ...props, role:"group", "aria-label":label };
  const layoutProps = {
    columns: layout === "rows" ? 1 as const : undefined,
    gap: layout === "rows" ? "4" as const : "6" as const,
    minItemWidth,
    "data-layout": layout,
  };
  if (appearance === "panel") {
    return <Surface {...groupProps} ref={ref} padding="4" className={classes("flood-metric-group__panel",className)}>
      <Grid {...layoutProps} className="flood-metric-group">{metrics}</Grid>
    </Surface>;
  }
  return <Grid {...groupProps} {...layoutProps} ref={ref} className={classes("flood-metric-group",className)}>{metrics}</Grid>;
});

export interface TimelineItem {
  id: string;
  title: string;
  description?: ReactNode;
  state?: "complete" | "current" | "upcoming";
  dateTime?: string;
  timeLabel?: string;
  icon?: ReactNode;
  /** Optional formatted heading for activity layouts. title supplies the text fallback. */
  summary?: ReactNode;
  /** Rich event details such as a file row or a thread. */
  content?: ReactNode;
  /** Track segment from this event to the next in feed and schedule layouts. */
  connector?: "solid" | "dashed" | "none";
}
export interface TimelineProps extends Omit<HTMLAttributes<HTMLOListElement>, "children"> {
  label: string;
  items: readonly TimelineItem[];
  /** Use activity for recorded events and progress for steps (default). */
  mode?: "progress" | "activity";
  /** Inline metadata in a feed or a shared leading time track in a schedule. */
  layout?: "stacked" | "feed" | "schedule";
  density?: "compact" | "comfortable";
  stateLabels?: {complete?: string; current?: string; upcoming?: string};
}
export const Timeline = /* @__PURE__ */ forwardRef<HTMLOListElement, TimelineProps>(function Timeline(props, ref) {
  return <EventTimeline {...props} ref={ref}/>;
});

export interface ActivityTimelineGroup {
  id: string;
  label: string;
  dateTime?: string;
  items: readonly Omit<TimelineItem, "state">[];
}

export interface ActivityTimelineProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  groups: readonly ActivityTimelineGroup[];
  density?: TimelineProps["density"];
  headingLevel?: HeadingProps["level"];
  emptyContent?: ReactNode;
}

/** A feed of chronological events grouped into named periods by the host. */
export const ActivityTimeline = /* @__PURE__ */ forwardRef<HTMLDivElement, ActivityTimelineProps>(function ActivityTimeline(
  {label, groups, density = "comfortable", headingLevel = 3, emptyContent, className, ...props}, ref,
) {
  if (!label.trim() || new Set(groups.map(group => group.id)).size !== groups.length ||
      groups.some(group => !group.id.trim() || !group.label.trim())) {
    throw new Error("Flood ActivityTimeline needs a label and unique nonempty group IDs and labels");
  }
  const populated = groups.filter(group => group.items.length > 0);
  return <Stack {...props} ref={ref} role="region" aria-label={label} gap={density === "compact" ? "6" : "8"}
    className={classes("flood-activity-timeline", className)}>
    {populated.length ? populated.map((group, index) =>
      <Stack key={group.id} className="flood-activity-timeline__group" gap={density === "compact" ? "2" : "3"}
        data-incoming-connector={index === 0 ? undefined : populated[index - 1].items.at(-1)?.connector ?? "solid"}>
        <Heading level={headingLevel} size="group" className="flood-activity-timeline__heading">
          {group.dateTime ? <Timestamp dateTime={group.dateTime}>{group.label}</Timestamp> : group.label}
        </Heading>
        <Timeline label={group.label} items={group.items} mode="activity" layout="feed" density={density} />
      </Stack>,
    ) : emptyContent}
  </Stack>;
});

export interface AuditTimelineItem extends Omit<TimelineItem, "state" | "content"> {
  changes?: readonly ChangeListItem[];
  defaultChangesOpen?: boolean;
}

export interface AuditTimelineGroup extends Omit<ActivityTimelineGroup, "items"> {
  items: readonly AuditTimelineItem[];
}

export interface AuditTimelineProps extends Omit<ActivityTimelineProps, "groups"> {
  groups: readonly AuditTimelineGroup[];
  formatChangesLabel?: (count: number, item: AuditTimelineItem) => string;
  changeLabels?: ChangeListProps["labels"];
}

/** Recorded events with independently disclosed field changes. */
export const AuditTimeline = /* @__PURE__ */ forwardRef<HTMLDivElement, AuditTimelineProps>(function AuditTimeline(
  {groups, formatChangesLabel = count => count === 1 ? "1 change" : `${count} changes`, changeLabels, ...props}, ref,
) {
  return <ActivityTimeline {...props} ref={ref} groups={groups.map(group => ({...group,
    items:group.items.map(item => {
      const {changes, defaultChangesOpen, ...event} = item;
      const recorded = changes?.filter(hasRecordedChange) ?? [];
      return {...event, content:recorded.length > 0 ? <Collapsible variant="flush" controlSize="sm" triggerWidth="fit"
        title={formatChangesLabel(recorded.length, item)} defaultOpen={defaultChangesOpen}>
        <ChangeList aria-label={item.title} items={recorded} valueLayout="adaptive" labels={changeLabels} />
      </Collapsible> : undefined};
    }),
  }))} />;
});

export type ProjectHealthRating = "on-track" | "at-risk" | "off-track";

export type ProjectHealthReport =
  | {state: "current" | "overdue"; health: ProjectHealthRating; dateTime: string; dateLabel: string; href?: string}
  | {state: "missing" | "not-expected"; health?: never; dateTime?: never; dateLabel?: never; href?: never};

export interface ProjectHealthProps extends Omit<InlineProps, "children" | "gap" | "align"> {
  report: ProjectHealthReport;
  labels?: Partial<Record<ProjectHealthRating | "overdue" | "missing" | "not-expected" | "lastReported" | "openUpdate", string>>;
}

const projectHealthStates = {
  "on-track": {label:"On track",tone:"success"},
  "at-risk": {label:"At risk",tone:"warning"},
  "off-track": {label:"Off track",tone:"error"},
} as const;

/** Read the health from a project's latest report and whether an update is due. @since 0.2.14 */
export const ProjectHealth = /* @__PURE__ */ forwardRef<HTMLDivElement, ProjectHealthProps>(function ProjectHealth(
  {report, labels, lang, className, ...props}, ref,
) {
  let status: Pick<StatusIndicatorProps, "label" | "tone">;
  let metadata: ReactNode;
  if (report.state === "current" || report.state === "overdue") {
    if (!report.dateTime.trim() || !report.dateLabel.trim()) {
      throw new Error("Flood ProjectHealth requires a date and visible date label for a reported rating");
    }
    const rating = projectHealthStates[report.health];
    const healthLabel = labels?.[report.health] ?? rating.label;
    status = report.state === "current" ? {label:healthLabel,tone:rating.tone}
      : {label:labels?.overdue ?? "Update overdue",tone:"warning"};
    const date = report.href
      ? <TimestampLink href={report.href} dateTime={report.dateTime} lang={lang} size="helper"
          aria-label={`${labels?.openUpdate ?? "Read update"} · ${report.dateLabel}`}>{report.dateLabel}</TimestampLink>
      : <Timestamp dateTime={report.dateTime} lang={lang} size="helper">{report.dateLabel}</Timestamp>;
    metadata = report.state === "overdue" ? <Inline gap="2" align="baseline">
      <Text size="helper" tone="subtle">{labels?.lastReported ?? "Last reported"}: {healthLabel}</Text>
      {date}
    </Inline> : date;
  } else {
    status = {label:labels?.[report.state] ?? (report.state === "missing" ? "No update yet" : "No update expected"),tone:"neutral"};
  }
  return <Inline {...props} ref={ref} align="baseline" gap="2" lang={lang} className={classes("flood-project-health",className)}>
    <StatusIndicator {...status} presentation="wrap" size="sm" />
    {metadata}
  </Inline>;
});

export interface ProjectUpdateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  title: string;
  /** Use in a cross-project feed when the enclosing region does not name the project. */
  project?: string;
  status: Pick<StatusIndicatorProps, "label" | "tone">;
  author: Pick<AuthorMetaProps, "name" | "src" | "fallback">;
  postedAt: {dateTime: string; label: string};
  headingLevel?: HeadingProps["level"];
  /** The progress narrative, including any host-authored next steps or links. */
  children: ReactNode;
  changes?: {label: string; items: readonly ChangeListItem[]; labels?: ChangeListProps["labels"]};
}

/** An attributed project-health snapshot with optional recorded field changes. */
export const ProjectUpdate = /* @__PURE__ */ forwardRef<HTMLDivElement, ProjectUpdateProps>(function ProjectUpdate(
  {title, project, status, author, postedAt, headingLevel = 2, children, changes, className, ...props}, ref,
) {
  const titleId = useId();
  const changesId = useId();
  if (!title.trim() || !postedAt.label.trim()) throw new Error("Flood ProjectUpdate requires a title and a visible date label");
  const showChanges = changes?.items.some(hasRecordedChange);
  if (showChanges && !changes?.label.trim()) throw new Error("Flood ProjectUpdate requires a label for recorded changes");
  return <Surface {...props} ref={ref} role="article" aria-labelledby={titleId} className={classes("flood-project-update", className)}>
    <Stack gap="6">
      <Stack gap="3">
        <Inline gap="3">
          <Stack gap="1" className="flood-project-update__identity">
            {project?.trim() && <Text size="helper" tone="subtle" dir="auto">{project}</Text>}
            <Heading id={titleId} level={headingLevel} size="section" dir="auto">{title}</Heading>
          </Stack>
          <StatusIndicator {...status} presentation="wrap" />
        </Inline>
        <AuthorMeta {...author} size="sm" metadataPlacement="inline"
          metadata={<Timestamp dateTime={postedAt.dateTime}>{postedAt.label}</Timestamp>} />
      </Stack>
      <Text as="div" className="flood-project-update__body">{children}</Text>
      {changes && showChanges && <Stack gap="2">
        <Text as="p" size="label" id={changesId}>{changes.label}</Text>
        <ChangeList aria-labelledby={changesId} items={changes.items} labels={changes.labels} valueLayout="adaptive" />
      </Stack>}
    </Stack>
  </Surface>;
});


export interface ServiceIncidentUpdate extends Pick<TimelineItem, "id" | "title" | "description"> {
  dateTime: string;
  timeLabel: string;
}

export interface ServiceIncidentProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  title: string;
  status: Pick<StatusIndicatorProps, "label" | "tone">;
  /** Current user-facing impact or recovery summary. */
  children?: ReactNode;
  /** Published updates in newest-first order. */
  updates?: readonly ServiceIncidentUpdate[];
  updatesLabel?: string;
  headingLevel?: HeadingProps["level"];
}

/** The current phase and published updates for one service incident. */
export const ServiceIncident = /* @__PURE__ */ forwardRef<HTMLDivElement, ServiceIncidentProps>(function ServiceIncident(
  {title, status, children, updates = [], updatesLabel = "Updates", headingLevel = 2, ...props}, ref,
) {
  const titleId = useId();
  const updatesId = useId();
  if (!title.trim() || !status.label.trim()) throw new Error("Flood ServiceIncident requires a title and status label");
  if (updates.some(update => !update.dateTime.trim() || !update.timeLabel.trim())) {
    throw new Error("Flood ServiceIncident updates require a dateTime and visible time label");
  }
  return <Stack {...props} ref={ref} role="article" aria-labelledby={titleId} gap="6">
    <Stack gap="2">
      <Heading id={titleId} level={headingLevel} size="section" dir="auto">{title}</Heading>
      <StatusIndicator label={status.label} tone={status.tone} size="sm" presentation="wrap" />
      {children != null && <Text as="div" size="compact" tone="subtle" dir="auto">{children}</Text>}
    </Stack>
    {updates.length > 0 && <Stack gap="3">
      <Heading id={updatesId} level={headingLevel === 6 ? 6 : (headingLevel + 1) as HeadingProps["level"]} size="group">{updatesLabel}</Heading>
      <Timeline label={updatesLabel} aria-labelledby={updatesId} items={updates} mode="activity" layout="feed" density="compact" />
    </Stack>}
  </Stack>;
});

export type MaintenanceWindowPhase = "scheduled" | "in-progress" | "completed" | "canceled";

export interface MaintenanceWindowProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  /** The affected service, project or region. */
  scope: string;
  /** ISO instants with explicit offsets. */
  start: string;
  end: string;
  /** The published phase supplied by the host. */
  phase: MaintenanceWindowPhase;
  timeZone?: string;
  phaseLabel?: string;
  headingLevel?: HeadingProps["level"];
  /** The expected or observed user-facing impact. */
  children?: ReactNode;
}

const maintenanceWindowPhases = {
  scheduled: {label:"Scheduled", tone:"info"},
  "in-progress": {label:"In progress", tone:"warning"},
  completed: {label:"Completed", tone:"success"},
  canceled: {label:"Canceled", tone:"neutral"},
} as const;

/** A published maintenance window with explicit bounds, scope and impact. */
export const MaintenanceWindow = /* @__PURE__ */ forwardRef<HTMLDivElement, MaintenanceWindowProps>(function MaintenanceWindow(
  {title, scope, start, end, phase, phaseLabel, timeZone = "UTC", lang = "en", headingLevel = 2, children, ...props}, ref,
) {
  const titleId = useId();
  const startDate = parseInstant(start, "MaintenanceWindow");
  const endDate = parseInstant(end, "MaintenanceWindow");
  if (startDate >= endDate) throw new RangeError("Flood MaintenanceWindow requires an end after the start");
  if (!title.trim() || !scope.trim() || (phaseLabel !== undefined && !phaseLabel.trim())) {
    throw new Error("Flood MaintenanceWindow requires a visible title, scope and phase label");
  }

  const dateOptions = {year:"numeric", month:"short", day:"numeric"} as const;
  const timeOptions = {hour:"numeric", minute:"2-digit", timeZone} as const;
  const zoneStyle = timeZone === "UTC" ? "short" : "shortOffset";
  const dateFormat = new Intl.DateTimeFormat(lang, {...dateOptions, timeZone});
  const offsetFormat = new Intl.DateTimeFormat(lang, {...timeOptions, timeZoneName:zoneStyle});
  const zoneAt = (date: Date) => offsetFormat.formatToParts(date).find(part => part.type === "timeZoneName")?.value;
  const sameDay = dateFormat.format(startDate) === dateFormat.format(endDate);
  const startFormat = new Intl.DateTimeFormat(lang, {
    ...dateOptions, ...timeOptions,
    timeZoneName:zoneAt(startDate) === zoneAt(endDate) ? undefined : zoneStyle,
  });
  const endFormat = sameDay ? offsetFormat : new Intl.DateTimeFormat(lang, {
    ...dateOptions, ...timeOptions, timeZoneName:zoneStyle,
  });
  const status = maintenanceWindowPhases[phase];

  return <Stack {...props} ref={ref} role="article" aria-labelledby={titleId} lang={lang} gap="3">
    <Stack gap="1">
      <Inline gap="2" align="baseline">
        <Heading id={titleId} level={headingLevel} size="group" dir="auto">{title}</Heading>
        <StatusIndicator size="sm" label={phaseLabel ?? status.label} tone={status.tone} presentation="wrap" />
      </Inline>
      <Text as="div" size="compact" tone="subtle" dir="auto">{scope}</Text>
    </Stack>
    <Stack gap="2">
      <Text as="div" size="compact" className="flood-maintenance-window__timing">
        <Timestamp dateTime={start} lang={lang} size="compact">{startFormat.format(startDate)}</Timestamp>
        {" – "}
        <Timestamp dateTime={end} lang={lang} size="compact">{endFormat.format(endDate)}</Timestamp>
      </Text>
      {children != null && <Text as="div" size="compact" tone="subtle" dir="auto">{children}</Text>}
    </Stack>
  </Stack>;
});

export interface NavigationListItem {
  value: string;
  label: string;
  href: string;
  description?: string;
  icon?: ReactNode;
  group?: string;
  linkProps?: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children" | "aria-current">;
}
export interface NavigationListProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "role" | "aria-label"> {
  label: string;
  items: readonly NavigationListItem[];
  currentValue?: string;
  size?: ContentSize;
}
export const NavigationList = /* @__PURE__ */ forwardRef<HTMLElement, NavigationListProps>(function NavigationList(
  {size = "md", ...props}, ref,
) { return <NavigationMenu {...props} ref={ref} size={size} />; });

export interface StepItem {
  value: string;
  title: string;
  description?: string;
  status?: "complete" | "upcoming" | "error";
  disabled?: boolean;
}
export interface StepsProps extends Omit<HTMLAttributes<HTMLOListElement>, "children" | "role" | "aria-label"> {
  label: string;
  items: readonly StepItem[];
  currentValue?: string;
  orientation?: "horizontal" | "vertical";
  onStepChange?: (value: string) => void;
  statusLabels?: {complete: string; current: string; upcoming: string; error: string};
}
export const Steps = /* @__PURE__ */ forwardRef<HTMLOListElement, StepsProps>(function Steps(
  {orientation = "horizontal", ...props}, ref,
) { return <StepSequence {...props} ref={ref} orientation={orientation} />; });

export interface StepProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  title: string;
  step: number;
  totalSteps: number;
  formatPosition?: (step: number, totalSteps: number) => string;
}
export const StepProgress = /* @__PURE__ */ forwardRef<HTMLDivElement, StepProgressProps>(function StepProgress(
  {title, step, totalSteps, formatPosition = (current, total) => `Step ${current} of ${total}`, className, ...props}, ref,
) {
  if (!Number.isSafeInteger(step) || !Number.isSafeInteger(totalSteps) || step < 1 || step > totalSteps) {
    throw new Error("Flood StepProgress requires a step from 1 to totalSteps");
  }
  const position = formatPosition(step, totalSteps);
  if (!title.trim() || !position.trim()) throw new Error("Flood StepProgress requires a title and position label");
  return <div {...props} ref={ref} className={classes("flood-step-progress", className)}>
    <div className="flood-step-progress__header">
      <Text size="label">{title}</Text>
      <Text size="helper" tone="subtle">{position}</Text>
    </div>
    <Progress label={position} value={step} max={totalSteps} size="sm" hideLabel aria-hidden="true" />
  </div>;
});

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  headingSize?: HeadingProps["size"];
}
export const Section = /* @__PURE__ */ forwardRef<HTMLElement, SectionProps>(function Section(
  {headingLevel = 2, headingSize = "section", ...props}, ref,
) { return <ContentSection {...props} ref={ref} headingLevel={headingLevel} headingSize={headingSize} />; });

export interface AccountSession {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Display-ready location, including qualification when approximate. */
  location?: string;
  lastActive?: { dateTime: string; label: string };
  status?: "active" | "unavailable";
}

export interface SessionListProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  sessions: readonly AccountSession[];
  /** Omit until the current session is known. Use null when none belongs to this device. */
  currentId?: string | null;
  /** Only called for known sessions other than the current one. */
  renderEndAction?: (session: AccountSession) => ReactNode;
  labels?: { current?: string; unavailable?: string; empty?: string };
}

/** Review account sessions and offer an action for a known remote session. @since 0.2.14 */
export const SessionList = /* @__PURE__ */ forwardRef<HTMLDivElement, SessionListProps>(function SessionList(props, ref) {
  return <AccountSessionList {...props} ref={ref} />;
});

export type ConnectedAccountState = "connected" | "reconnect" | "disconnected" | "unavailable";

export interface ConnectedAccount {
  id: string;
  provider: string;
  /** The provider identity that the current viewer is allowed to see. */
  account?: string;
  /** A short reason or scope that affects the next action. */
  detail?: string;
  icon?: ReactNode;
  state: ConnectedAccountState;
}

export interface ConnectedAccountListProps extends Omit<HTMLAttributes<HTMLUListElement>, "children"> {
  label: string;
  accounts: readonly ConnectedAccount[];
  /** Render the action allowed for this account; use an account-specific accessible name. */
  renderAction?: (account: ConnectedAccount) => ReactNode;
  labels?: Partial<Record<ConnectedAccountState | "empty", string>>;
}

const connectedAccountStates = {
  connected:{label:"Connected",tone:"success"},
  reconnect:{label:"Reconnect needed",tone:"warning"},
  disconnected:{label:"Not connected",tone:"neutral"},
  unavailable:{label:"Unavailable",tone:"neutral"},
} as const;

/** The current state and available action for each linked provider account. */
export const ConnectedAccountList = /* @__PURE__ */ forwardRef<HTMLUListElement, ConnectedAccountListProps>(function ConnectedAccountList(
  {label, accounts, labels, renderAction, className, ...props}, ref,
) {
  if (!label.trim() || accounts.some(account => !account.id.trim() || !account.provider.trim()) ||
      new Set(accounts.map(account => account.id)).size !== accounts.length) {
    throw new Error("Flood ConnectedAccountList requires a name and uniquely identified providers or accounts");
  }
  return <DataList {...props} ref={ref} aria-label={label} density="compact" dividers={false}
    className={classes("flood-connected-account-list", className)}>
    {accounts.length ? accounts.map(account => {
      const state = connectedAccountStates[account.state];
      return <DataListItem key={account.id} layout="content"
        media={account.icon != null ? <IconSlot size="sm">{account.icon}</IconSlot> : undefined}
        title={<Text size="label" dir="auto">{account.provider}</Text>}
        description={account.account ? <Text size="helper" tone="subtle" dir="auto">{account.account}</Text> : undefined}
        details={account.detail ? <Text size="helper" tone="subtle" dir="auto">{account.detail}</Text> : undefined}
        metadata={<StatusIndicator label={labels?.[account.state] ?? state.label} tone={state.tone} size="sm" presentation="wrap" />}
        actions={renderAction?.(account)} />;
    }) : <li><Text size="compact" tone="subtle">{labels?.empty ?? "No connected accounts to show."}</Text></li>}
  </DataList>;
});

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  /** Include the resource only when invitations span more than one scope. */
  scope?: string;
  sentAt?: {dateTime: string; label: string};
  state: "awaiting-acceptance" | "expired" | "delivery-failed";
}

export interface PendingInvitationListProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  invitations: readonly PendingInvitation[];
  /** Render only the actions allowed for this invitation by the host. */
  renderActions?: (invitation: PendingInvitation) => ReactNode;
  labels?: Partial<Record<PendingInvitation["state"] | "empty", string>>;
}

const invitationStatuses = {
  "awaiting-acceptance": {label:"Awaiting acceptance", tone:"neutral"},
  "expired": {label:"Expired", tone:"warning"},
  "delivery-failed": {label:"Delivery failed", tone:"error"},
} as const;

/** Review outstanding invitations, with a slot for host-owned actions. @since 0.2.14 */
export const PendingInvitationList = /* @__PURE__ */ forwardRef<HTMLDivElement, PendingInvitationListProps>(function PendingInvitationList(
  {label, invitations, renderActions, labels, ...props}, ref,
) {
  return <Stack {...props} ref={ref}>
    {invitations.length === 0
      ? <Text size="compact" tone="subtle">{labels?.empty ?? "No outstanding invitations."}</Text>
      : <DataList aria-label={label} density="compact" dividers={false}>
        {invitations.map(invitation => {
          const status = invitationStatuses[invitation.state];
          return <DataListItem key={invitation.id} layout="content"
            title={<TruncatedText dir="ltr">{invitation.email}</TruncatedText>}
            description={<Inline gap="2" align="baseline">
              <StatusIndicator label={labels?.[invitation.state] ?? status.label} tone={status.tone} size="sm" />
              <Text size="helper" tone="subtle" dir="auto">{invitation.role}</Text>
              {invitation.scope && <Text size="helper" tone="subtle" dir="auto">{invitation.scope}</Text>}
              {invitation.sentAt && <Timestamp dateTime={invitation.sentAt.dateTime} size="helper">{invitation.sentAt.label}</Timestamp>}
            </Inline>}
            actions={renderActions?.(invitation)} />;
        })}
      </DataList>}
  </Stack>;
});

export interface ApiKeyRecord {
  id: string;
  label: string;
  kind: "publishable" | "secret";
  status: "active" | "expired" | "revoked";
  /** A display-safe identifier supplied by the API, such as an abbreviated fingerprint. */
  fingerprint?: string;
  scope?: string;
  lastUsed?: {dateTime: string; label: string};
}

export interface ApiKeyListProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  keys: readonly ApiKeyRecord[];
  /** Called for active publishable records only. Return the public value when it may be copied. */
  getPublishableValue?: (key: ApiKeyRecord) => string | undefined;
  /** Host-owned actions for active keys, for example opening a scoped rotation or revocation flow. */
  renderActions?: (key: ApiKeyRecord) => ReactNode;
  labels?: {
    kind?: Partial<Record<ApiKeyRecord["kind"], string>>;
    status?: Partial<Record<ApiKeyRecord["status"], string>>;
    empty?: string;
    copy?: (key: ApiKeyRecord) => string;
  };
}

const apiKeyStatus = {
  active: {label: "Active", tone: "success"},
  expired: {label: "Expired", tone: "warning"},
  revoked: {label: "Revoked", tone: "neutral"},
} as const;

/** Inventory of API credentials using safe identifiers and host-owned lifecycle actions. @since 0.2.14 */
export const ApiKeyList = /* @__PURE__ */ forwardRef<HTMLDivElement, ApiKeyListProps>(function ApiKeyList(
  {label, keys, getPublishableValue, renderActions, labels, ...props}, ref,
) {
  const ids = new Set(keys.map(key => key.id));
  if (!label.trim() || ids.size !== keys.length || keys.some(key => !key.id.trim() || !key.label.trim())) {
    throw new Error("Flood ApiKeyList requires a name and uniquely identified keys");
  }

  return <Stack {...props} ref={ref}>
    {keys.length ? <DataList aria-label={label} density="compact" dividers={false}>
      {keys.map(key => {
        const {status, kind, scope, lastUsed, fingerprint} = key;
        const value = status === "active" && kind === "publishable" ? getPublishableValue?.(key) : undefined;
        return <DataListItem key={key.id} layout="content"
          title={<Inline gap="2" align="center">
            <Text size="label">{key.label}</Text>
            <Badge size="sm">{labels?.kind?.[kind] ?? (kind === "secret" ? "Secret" : "Publishable")}</Badge>
          </Inline>}
          description={<Inline gap="2" align="center">
            <StatusIndicator size="sm" tone={apiKeyStatus[status].tone}
              label={labels?.status?.[status] ?? apiKeyStatus[status].label} />
            {scope && <Text size="helper" tone="subtle">{scope}</Text>}
            {lastUsed && <Timestamp dateTime={lastUsed.dateTime} size="helper">{lastUsed.label}</Timestamp>}
          </Inline>}
          details={value ? <CopyableValue value={value} appearance="code" overflow="truncate" preserveEnd={4}
            copyLabel={labels?.copy?.(key) ?? `Copy ${key.label}`} />
            : fingerprint ? <OverflowingText appearance="code" dir="auto" preserveEnd={4}
              style={{inlineSize: "fit-content", maxInlineSize: "100%"}}>{fingerprint}</OverflowingText> : undefined}
          actions={status === "active" ? renderActions?.(key) : undefined} />;
      })}
    </DataList> : <Text size="compact" tone="subtle">{labels?.empty ?? "No API keys."}</Text>}
  </Stack>;
});

type PasskeyDate = {dateTime: string; label: string};

export interface PasskeyRecord {
  id: string;
  label: string;
  /** Display name of the provider, when known by the host. */
  provider?: string;
  added?: PasskeyDate;
  /** Null means the host knows this key has never been used. Omit when usage is unknown. */
  lastUsed?: PasskeyDate | null;
}

export interface PasskeyListProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  passkeys: readonly PasskeyRecord[];
  /** Host-owned actions such as rename or open a named removal confirmation. */
  renderActions?: (passkey: PasskeyRecord) => ReactNode;
  labels?: {
    empty?: string;
    added?: string;
    lastUsed?: string;
    neverUsed?: string;
  };
}

/** Recognize registered sign-in keys by name, provider and usage history. @since 0.2.14 */
export const PasskeyList = /* @__PURE__ */ forwardRef<HTMLDivElement, PasskeyListProps>(function PasskeyList(
  {label, passkeys, renderActions, labels, ...props}, ref,
) {
  const ids = new Set(passkeys.map(passkey => passkey.id));
  if (!label.trim() || ids.size !== passkeys.length || passkeys.some(passkey => !passkey.id.trim() || !passkey.label.trim())) {
    throw new Error("Flood PasskeyList requires a name and uniquely identified passkeys");
  }

  return <Stack {...props} ref={ref}>
    {passkeys.length ? <DataList aria-label={label} density="compact" dividers={false}>
      {passkeys.map(passkey => {
        const {added, lastUsed, provider} = passkey;
        const hasDetails = Boolean(added || provider) || lastUsed !== undefined;
        return <DataListItem key={passkey.id} layout="content" className="flood-passkey-list__row"
          title={<Text size="label"><bdi>{passkey.label}</bdi></Text>}
          details={hasDetails && <Inline gap="2" align="baseline">
            {provider && <Text size="helper" tone="subtle"><bdi>{provider}</bdi></Text>}
            {added && <Text size="helper" tone="subtle">{labels?.added ?? "Added"}{" "}
              <Timestamp size="helper" dateTime={added.dateTime}>{added.label}</Timestamp>
            </Text>}
            {lastUsed === null ? <Text size="helper" tone="subtle">{labels?.neverUsed ?? "Never used"}</Text>
              : lastUsed && <Text size="helper" tone="subtle">{labels?.lastUsed ?? "Last used"}{" "}
                <Timestamp size="helper" dateTime={lastUsed.dateTime}>{lastUsed.label}</Timestamp>
              </Text>}
          </Inline>}
          actions={renderActions?.(passkey)} />;
      })}
    </DataList> : <Text size="compact" tone="subtle">{labels?.empty ?? "No passkeys added."}</Text>}
  </Stack>;
});

export interface RotationKey {
  label: string;
  /** Display-safe fingerprint, never the credential itself. */
  fingerprint?: string;
}

export type KeyRetirement =
  | {mode: "immediate" | "manual"}
  | {mode: "scheduled"; dateTime: string};

export interface KeyRotationSummaryProps extends Omit<HTMLAttributes<HTMLDListElement>, "children"> {
  current: RotationKey;
  replacement: RotationKey;
  retirement: KeyRetirement;
  timeZone?: string;
  labels?: Partial<Record<"current" | "replacement" | "retirement" | "immediate" | "manual", string>>;
}

/** Review a key replacement and when the previous key stops working. @since 0.2.14 */
export const KeyRotationSummary = /* @__PURE__ */ forwardRef<HTMLDListElement, KeyRotationSummaryProps>(function KeyRotationSummary(
  {current, replacement, retirement, timeZone = "UTC", labels, lang, ...props}, ref,
) {
  if (!current.label.trim() || !replacement.label.trim()) {
    throw new Error("Flood KeyRotationSummary requires the names of both keys");
  }
  const keyDetails = ({label, fingerprint}: RotationKey) => <Inline align="baseline" gap="2">
    <Text size="compact">{label}</Text>
    {fingerprint && <InlineCode size="sm">{fingerprint}</InlineCode>}
  </Inline>;
  let cutoff: ReactNode = labels?.manual ?? "When manually revoked";
  if (retirement.mode === "immediate") {
    cutoff = <StatusIndicator tone="warning" size="sm" presentation="wrap" label={labels?.immediate ?? "On rotation"} />;
  }
  if (retirement.mode === "scheduled") {
    const date = parseInstant(retirement.dateTime, "KeyRotationSummary");
    const display = new Intl.DateTimeFormat(lang || "en", {
      timeZone, year:"numeric", month:"short", day:"numeric", hour:"numeric", minute:"2-digit",
      second:"2-digit", timeZoneName:"shortOffset",
    }).format(date);
    cutoff = <Timestamp dateTime={retirement.dateTime} lang={lang} size="compact">{display}</Timestamp>;
  }
  return <DescriptionList {...props} ref={ref} lang={lang} layout="inline" items={[
    {id:"current", term:labels?.current ?? "Current key", description:keyDetails(current)},
    {id:"replacement", term:labels?.replacement ?? "Replacement key", description:keyDetails(replacement)},
    {id:"retirement", term:labels?.retirement ?? "Old key cutoff", description:cutoff},
  ]} />;
});

export type EnvironmentVariable = {id: string; name: string} & (
  | {kind: "plain"; value: string}
  | {kind: "reference"; source: string; href?: string; value?: never}
  | {kind: "sealed"; value?: never}
);

export interface EnvironmentVariableListProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  variables: readonly EnvironmentVariable[];
  renderActions?: (variable: EnvironmentVariable) => ReactNode;
  labels?: {
    empty?: string;
    emptyValue?: string;
    sealed?: string;
    copy?: (name: string) => string;
    copied?: string;
    copyError?: string;
  };
}

/** Read-only inventory of values, references and write-only secrets. @since 0.2.14 */
export const EnvironmentVariableList = /* @__PURE__ */ forwardRef<HTMLDivElement, EnvironmentVariableListProps>(
  function EnvironmentVariableList({label, variables, renderActions, labels, ...props}, ref) {
    if (!label.trim() || new Set(variables.map(variable=>variable.id)).size !== variables.length ||
        variables.some(variable=>!variable.id.trim() || !variable.name.trim() ||
          (variable.kind === "reference" && !variable.source.trim()))) {
      throw new Error("Flood EnvironmentVariableList requires a name, unique variable IDs and named references");
    }

    return <Stack {...props} ref={ref}>
      {variables.length ? <DataList aria-label={label} density="compact" dividers={false} className="flood-environment-variable-list">
        {variables.map(variable => {
          const {id, name, kind} = variable;
          let details: ReactNode;
          if (kind === "sealed") {
            details = <Text size="compact" tone="subtle">{labels?.sealed ?? "Sealed"}</Text>;
          } else if (kind === "reference") {
            details = <Text as="div" size="compact" dir="auto" style={{overflowWrap:"anywhere"}}>
              {variable.href ? <Link href={variable.href}>{variable.source}</Link> : variable.source}
            </Text>;
          } else {
            details = variable.value === ""
              ? <Text size="compact" tone="subtle">{labels?.emptyValue ?? "Empty value"}</Text>
              : <CopyableValue appearance="code" overflow="truncate" value={variable.value}
                  copyLabel={labels?.copy?.(name) ?? `Copy ${name} value`}
                  copiedLabel={labels?.copied} errorLabel={labels?.copyError}/>;
          }
          return <DataListItem key={id} layout="content" title={<TruncatedText dir="ltr">{name}</TruncatedText>}
            details={details} actions={renderActions?.(variable)}/>;
        })}
      </DataList> : <Text size="compact" tone="subtle">{labels?.empty ?? "No environment variables."}</Text>}
    </Stack>;
  },
);

export type PermissionAccess = "read" | "write" | "read-write" | "none";

export interface AccessPermission {
  id: string;
  resource: string;
  access: PermissionAccess;
  /** Plain-language action or a meaningful restriction for this resource. */
  description?: string;
}

export interface AccessSummaryProps extends Omit<SectionProps, "title" | "children" | "description"> {
  actor: string;
  scope: string;
  actingFor?: string;
  /** Effective or proposed permissions computed by the host. */
  permissions: readonly AccessPermission[];
  labels?: {
    scope?: string;
    actingFor?: string;
    permissions?: string;
    empty?: string;
    access?: Partial<Record<PermissionAccess, string>>;
  };
}

/** Explain the actor, scope and resource-level permissions of a connection. @since 0.2.14 */
export const AccessSummary = /* @__PURE__ */ forwardRef<HTMLElement, AccessSummaryProps>(function AccessSummary(props, ref) {
  return <AccessSummaryPanel {...props} ref={ref} />;
});

export interface RolePermission {
  id: string;
  label: string;
  description?: string;
  granted: boolean;
  /** The display name of the role or policy that fixes this permission. */
  inheritedFrom?: string;
}

export interface RolePermissionGroup {
  id: string;
  label: string;
  permissions: readonly RolePermission[];
}

export interface SharingScope {
  id: string;
  label: string;
  /** Explain who can access or discover the resource in this mode. */
  description: string;
  disabled?: boolean;
}

export interface SharingMember {
  id: string;
  name: string;
  role: string;
  avatar?: Pick<AuthorMetaProps, "src" | "fallback">;
}

export interface SharingPanelProps extends SectionProps {
  scopes: readonly SharingScope[];
  /** The scope currently enforced by the host. */
  effectiveScope: string;
  /** The proposed next scope. Keep it on failure. */
  draftScope: string;
  onDraftScopeChange: (scope: string) => void;
  onApply: (scope: string) => void;
  members?: readonly SharingMember[];
  /** The authorized link for the effective scope. */
  shareUrl?: string;
  pending?: boolean;
  error?: string;
  labels?: {
    people?: string;
    empty?: string;
    scope?: string;
    effective?: (scope: string) => string;
    apply?: string;
    copy?: string;
    copied?: string;
    copyError?: string;
  };
}

/** Review individually shared access and stage a resource-wide scope change. @since 0.2.14 */
export const SharingPanel = /* @__PURE__ */ forwardRef<HTMLElement, SharingPanelProps>(function SharingPanel(
  {scopes, effectiveScope, draftScope, onDraftScopeChange, onApply, members, shareUrl, pending = false,
    error, labels, headingLevel = 2, headingSize = "group", ...props}, ref,
) {
  const effective = scopes.find(scope => scope.id === effectiveScope);
  const draft = scopes.find(scope => scope.id === draftScope);
  if (!effective || !draft || scopes.some(scope => !scope.id.trim() || !scope.label.trim() || !scope.description.trim()) ||
      new Set(scopes.map(scope => scope.id)).size !== scopes.length ||
      (members && (new Set(members.map(member => member.id)).size !== members.length ||
        members.some(member => !member.id.trim() || !member.name.trim() || !member.role.trim())))) {
    throw new Error("Flood SharingPanel requires defined scopes and uniquely identified members");
  }
  const dirty = draft.id !== effective.id;
  const canApply = dirty && !draft.disabled && !pending;
  const people = labels?.people ?? "People with access";
  return <Section {...props} ref={ref} headingSize={headingSize} headingLevel={headingLevel} aria-busy={pending || undefined}>
    <Stack gap="4">
      {members && <Stack gap="1">
        <Text as="p" size="label">{people}</Text>
        {members.length > 0 ? <DataList aria-label={people} density="compact" dividers={false} className="flood-sharing-panel__people">
          {members.map(({id,name,role,avatar}) => <DataListItem key={id}
            title={<AuthorMeta {...avatar} name={name} size="sm"/>}
            metadata={<Text size="helper" tone="subtle" dir="auto">{role}</Text>} />)}
        </DataList> : <Text as="p" size="compact" tone="subtle">{labels?.empty ?? "No one has been added."}</Text>}
      </Stack>}
      <Field label={labels?.scope ?? "General access"}
        hint={dirty ? <Stack gap="1">
          <span>{draft.description}</span>
          <Text size="helper" tone="subtle">{labels?.effective?.(effective.label) ?? `Current access: ${effective.label}`}</Text>
        </Stack> : draft.description}>
        {field => <Select {...field} value={draft.id} controlSize="sm" disabled={pending}
          onChange={event => onDraftScopeChange(event.currentTarget.value)}>
          {scopes.map(scope => <option key={scope.id} value={scope.id} disabled={scope.disabled}>{scope.label}</option>)}
        </Select>}
      </Field>
      {error && <Text as="p" size="helper" tone="error" role="alert">{error}</Text>}
      <FormActions secondary={shareUrl ? <CopyButton size="sm" value={shareUrl} disabled={dirty || pending}
        copyLabel={labels?.copy ?? "Copy link"} copiedLabel={labels?.copied} errorLabel={labels?.copyError} /> : undefined}
        primary={<Button size="sm" type="button" aria-disabled={!canApply || undefined} loading={pending ? "retain-focus" : false}
          onClick={() => { if (canApply) onApply(draft.id); }}>{labels?.apply ?? "Apply access"}</Button>} />
    </Stack>
  </Section>;
});

export interface PermissionEditorProps extends Omit<FieldsetProps, "children" | "legend" | "onChange"> {
  label: string;
  groups: readonly RolePermissionGroup[];
  /** Receives a proposed edit. Omit to review the permission set without controls. */
  onGrantChange?: (id: string, granted: boolean) => void;
  labels?: {
    granted?: string;
    notGranted?: string;
    empty?: string;
    inheritedFrom?: (source: string) => string;
  };
}

/** Edit a role's grouped draft permissions and explain their inherited baseline. @since 0.2.14 */
export const PermissionEditor = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, PermissionEditorProps>(function PermissionEditor(
  {label, groups, onGrantChange, labels, ...props}, ref,
) {
  const descriptionPrefix = useId();
  const permissions = groups.flatMap(group => group.permissions);
  const hasDistinctIds = (items: readonly {id: string; label: string}[]) =>
    items.every(item => item.id.trim() && item.label.trim()) && new Set(items.map(item => item.id)).size === items.length;
  if (!label.trim() || !hasDistinctIds(groups) || !hasDistinctIds(permissions)) {
    throw new Error("Flood PermissionEditor requires a name and uniquely identified groups and permissions");
  }

  return <Fieldset {...props} ref={ref} legend={label} legendSize="section">
    {permissions.length ? <Stack gap="4">
      {groups.filter(group => group.permissions.length > 0).map((group, groupIndex) =>
        <SettingGroup key={group.id} title={group.label} density="compact">
          {group.permissions.map((permission, permissionIndex) => {
            const {id, label: permissionLabel, description, granted, inheritedFrom} = permission;
            const descriptionId = description ? `${descriptionPrefix}-${groupIndex}-${permissionIndex}` : undefined;
            const inherited = inheritedFrom
              ? labels?.inheritedFrom?.(inheritedFrom) ?? `Inherited from ${inheritedFrom}`
              : undefined;
            const editable = onGrantChange && !inheritedFrom;
            return <SettingRow key={id} label={permissionLabel} layout="inline"
              description={description || inherited
                ? <span id={descriptionId}>{[description, inherited].filter(Boolean).join(" · ")}</span>
                : undefined}
              value={editable ? undefined : <Badge size="sm">
                {granted ? labels?.granted ?? "Granted" : labels?.notGranted ?? "Not granted"}
              </Badge>}
              action={editable ? <Checkbox label={permissionLabel} hideLabel checked={granted}
                aria-describedby={descriptionId} onChange={event => onGrantChange(id, event.currentTarget.checked)} />
                : undefined} />;
          })}
        </SettingGroup>)}
    </Stack> : <Text size="compact" tone="subtle">{labels?.empty ?? "No permissions."}</Text>}
  </Fieldset>;
});

export type BatchResultStatus = "succeeded" | "failed" | "skipped";

export type BatchResultItem = {
  id: string;
  label: string;
  reason?: string;
  /** Link to inspect or fix this specific record. */
  href?: string;
} & (
  { status: "failed"; retryable?: boolean } |
  { status: "succeeded" | "skipped"; retryable?: never }
);

export interface BatchResultProps extends Omit<SectionProps, "actions" | "children"> {
  /** Complete terminal outcomes for the attempted batch. */
  items: readonly BatchResultItem[];
  showSucceeded?: boolean;
  retryPending?: boolean;
  /** Receives only failed item IDs explicitly marked retryable by the host. */
  onRetry?: (ids: readonly string[]) => void;
  labels?: {
    details?: string;
    empty?: string;
    status?: Partial<Record<BatchResultStatus, string>>;
    retryable?: string;
    count?: (status: BatchResultStatus, count: number) => string;
    retry?: (count: number) => string;
  };
}

/** Show completed batch outcomes and scoped retry. @since 0.2.14 */
export const BatchResult = /* @__PURE__ */ forwardRef<HTMLElement, BatchResultProps>(function BatchResult(props, ref) {
  return <BatchResultPanel {...props} ref={ref} />;
});

export interface ApprovalRequestOption {
  id: string;
  label: string;
  consequence?: string;
  disabled?: boolean;
  note?: {
    label: string;
    /** Supply the localized validation message when the decision requires a note. */
    requiredMessage?: string;
  };
}

export interface ApprovalRequestDraft {
  decisionId: string | null;
  note: string;
}

export interface ApprovalRequestDecision {
  decisionId: string;
  note?: string;
}

export type ApprovalRequestStatus =
  | { type: "submitting" }
  | { type: "error"; message: string }
  | { type: "resolved"; message: string; tone?: "neutral" | "success" | "warning" };

export type EvaluationOutcome = "pending" | "passed" | "failed" | "error" | "skipped";

export interface EvaluationResultProps extends Omit<SectionProps, "children" | "description"> {
  outcome: EvaluationOutcome;
  reason?: string;
  expected?: ReactNode;
  output?: ReactNode;
  checks?: readonly CheckRun[];
  labels?: {
    expected?: string;
    output?: string;
    noOutput?: string;
    checks?: string;
    outcomes?: Partial<Record<EvaluationOutcome, string>>;
    checkStates?: CheckRunListProps["statusLabels"];
    blocking?: string;
  };
}

const evaluationOutcomes = {
  pending: {label:"Pending",tone:"neutral"},
  passed: {label:"Passed",tone:"success"},
  failed: {label:"Failed",tone:"error"},
  error: {label:"Execution error",tone:"error"},
  skipped: {label:"Skipped",tone:"neutral"},
} as const;

/** Review a host-reported test verdict beside its output and supporting checks. @since 0.2.14 */
export const EvaluationResult = /* @__PURE__ */ forwardRef<HTMLElement, EvaluationResultProps>(function EvaluationResult(
  {outcome, reason, expected, output, checks, labels, headingSize = "group", ...props}, ref,
) {
  const appearance = evaluationOutcomes[outcome];
  const fields: DescriptionItem[] = [
    {id:"output",term:labels?.output ?? "Actual output",
      description:hasFieldContent(output) ? output : <Text size="compact" tone="subtle">{labels?.noOutput ?? "No output"}</Text>},
  ];
  if (hasFieldContent(expected)) fields.unshift({id:"expected",term:labels?.expected ?? "Expected output",description:expected});
  return <Section {...props} ref={ref} headingSize={headingSize} description={
    <Inline align="baseline" gap="2">
      <StatusIndicator size="sm" presentation="wrap" tone={appearance.tone} label={labels?.outcomes?.[outcome] ?? appearance.label} />
      {reason && <Text size="compact" tone="subtle">{reason}</Text>}
    </Inline>
  }>
    <Stack gap="4">
      <DescriptionList layout="grid" items={fields} />
      {!!checks?.length && <CheckRunList label={labels?.checks ?? "Assertion checks"} checks={checks}
        statusLabels={labels?.checkStates} blockingLabel={labels?.blocking} />}
    </Stack>
  </Section>;
});

export type PolicyCheckStatus = "matched" | "unmatched" | "skipped" | "unavailable";

export interface PolicyCheck {
  id: string;
  label: string;
  status: PolicyCheckStatus;
  /** The observed value or a concise reason this check could not run. */
  evidence?: string;
}

export interface PolicyEvaluationProps extends Omit<SectionProps, "children"> {
  checks: readonly PolicyCheck[];
  checkListLabel?: string;
  emptyLabel?: string;
  statusLabels?: Partial<Record<PolicyCheckStatus, string>>;
}

const policyCheckStates = {
  matched: {label:"Matched",tone:"info"},
  unmatched: {label:"No match",tone:"neutral"},
  skipped: {label:"Skipped",tone:"neutral"},
  unavailable: {label:"Unavailable",tone:"warning"},
} as const;

/** Explain a host-evaluated decision with its ordered checks and evidence. @since 0.2.14 */
export const PolicyEvaluation = /* @__PURE__ */ forwardRef<HTMLElement, PolicyEvaluationProps>(function PolicyEvaluation(
  {checks, checkListLabel = "Rule checks", emptyLabel = "No checks were evaluated.", statusLabels,
    headingSize = "group", className, ...props}, ref,
) {
  if (new Set(checks.map(check=>check.id)).size !== checks.length || checks.some(check=>!check.id.trim() || !check.label.trim())) {
    throw new Error("Flood PolicyEvaluation requires unique, named checks");
  }
  return <Section {...props} ref={ref} headingSize={headingSize} className={classes("flood-policy-evaluation",className)}>
    {checks.length ? <DataList aria-label={checkListLabel} density="compact" dividers={false}>
      {checks.map(check => {
        const {label,tone} = policyCheckStates[check.status];
        return <DataListItem key={check.id} layout="row" title={check.label} description={check.evidence}
          metadata={<Badge size="sm" variant="outline" tone={tone}>{statusLabels?.[check.status] ?? label}</Badge>}/>;
      })}
    </DataList> : <Text as="p" size="compact" tone="subtle">{emptyLabel}</Text>}
  </Section>;
});

export type AdvisorFindingSeverity = "info" | "warning" | "error";

export interface AdvisorFindingProps extends Omit<SectionProps, "children" | "description" | "actions"> {
  severity: AdvisorFindingSeverity;
  /** Display-safe name of the affected resource, such as a table or deployment. */
  resource: string;
  /** The practical effect of the observation on the affected resource. */
  impact: string;
  /** Details that let a person verify the finding. */
  evidence?: ReactNode;
  /** A stable identifier for the diagnostic rule, when available. */
  rule?: string;
  /** Host-provided documentation link or remediation control. */
  remediation?: ReactNode;
  defaultEvidenceOpen?: boolean;
  labels?: {severity?: string; evidence?: string; rule?: string};
}

const advisorSeverityLabels: Record<AdvisorFindingSeverity, string> = {
  info: "Info",
  warning: "Warning",
  error: "Error",
};

/** Inspect a diagnosed problem, its affected resource and its evidence. @since 0.2.14 */
export const AdvisorFinding = /* @__PURE__ */ forwardRef<HTMLElement, AdvisorFindingProps>(function AdvisorFinding(
  {severity, resource, impact, evidence, rule, remediation, defaultEvidenceOpen = false,
    headingSize = "group", labels, ...props}, ref,
) {
  if (![props.title, resource, impact].every(value => value.trim())) {
    throw new Error("Flood AdvisorFinding requires a title, resource and impact");
  }
  return <Section {...props} ref={ref} headingSize={headingSize}
    description={<InlineCode size="sm" dir="auto">{resource}</InlineCode>}
    actions={<Badge size="sm" variant="outline" tone={severity}>{labels?.severity ?? advisorSeverityLabels[severity]}</Badge>}>
    <Stack gap="3">
      <Text as="p" size="compact">{impact}</Text>
      {(hasFieldContent(evidence) || rule?.trim()) &&
        <Collapsible title={labels?.evidence ?? "Evidence"} variant="flush" triggerWidth="fit" controlSize="sm"
          defaultOpen={defaultEvidenceOpen}>
          <Stack gap="2">
            {typeof evidence === "string" ? <Text as="p" size="compact">{evidence}</Text> : evidence}
            {rule?.trim() && <DescriptionList items={[
              {id:"rule", term:labels?.rule ?? "Rule", description:<InlineCode size="sm" dir="auto">{rule}</InlineCode>},
            ]} />}
          </Stack>
        </Collapsible>}
      {hasFieldContent(remediation) && <Inline gap="2">{remediation}</Inline>}
    </Stack>
  </Section>;
});

export interface NetworkAllowlistEntry {
  id: string;
  /** Display-ready CIDR supplied by the host. */
  cidr: string;
  family: "IPv4" | "IPv6";
  label?: string;
}

export type NetworkAccess =
  | { mode: "unrestricted" | "blocked"; entries?: never }
  | { mode: "allowlist"; entries: readonly NetworkAllowlistEntry[] };

export interface NetworkAllowlistProps extends Omit<SectionProps, "children" | "actions"> {
  access: NetworkAccess;
  /** Optional trailing action for a row, such as a host-owned edit or removal dialog. */
  renderRuleAction?: (entry: NetworkAllowlistEntry) => ReactNode;
  labels?: {
    unrestricted?: string;
    blocked?: string;
    allowlist?: string;
    empty?: string;
    ranges?: string;
    copy?: (entry: NetworkAllowlistEntry) => string;
    copied?: string;
    copyError?: string;
  };
}

/** Inspect the host's network policy for one specific connection scope. */
export const NetworkAllowlist = /* @__PURE__ */ forwardRef<HTMLElement, NetworkAllowlistProps>(function NetworkAllowlist(
  { access, labels, renderRuleAction, headingSize = "group", ...props }, ref,
) {
  const entries = access.mode === "allowlist" ? access.entries : [];
  if (new Set(entries.map(entry => entry.id)).size !== entries.length ||
      entries.some(entry => !entry.id.trim() || !entry.cidr.trim())) {
    throw new Error("Flood NetworkAllowlist requires unique entry IDs and displayable network ranges");
  }
  const states = {
    unrestricted: labels?.unrestricted ?? "All networks",
    allowlist: labels?.allowlist ?? "Allowlist only",
    blocked: labels?.blocked ?? "No networks",
  };
  return <Section {...props} ref={ref} headingSize={headingSize}
    actions={<StatusIndicator size="sm" tone={access.mode === "unrestricted" ? "warning" : "neutral"} label={states[access.mode]}/>}>
    {entries.length > 0 && <DataList aria-label={labels?.ranges ?? "Allowed network ranges"} dividers={false} density="compact">
      {entries.map(entry => <DataListItem key={entry.id}
        title={entry.label ? <Inline gap="2">
          <span>{entry.label}</span><Badge size="sm" variant="outline">{entry.family}</Badge>
        </Inline> : entry.family}
        description={<InlineCode dir="ltr" size="sm" wrap className="flood-network-allowlist__cidr">{entry.cidr}</InlineCode>}
        actions={<>
          <CopyButton iconOnly size="xs" variant="ghost" value={entry.cidr}
            copyLabel={labels?.copy?.(entry) ?? `Copy ${entry.cidr}`} copiedLabel={labels?.copied} errorLabel={labels?.copyError}/>
          {renderRuleAction?.(entry)}
        </>}/>)}
    </DataList>}
    {access.mode === "allowlist" && !entries.length &&
      <Text as="p" size="compact" tone="subtle">{labels?.empty ?? "No ranges in the allowlist."}</Text>}
  </Section>;
});

export interface MutedWordRule {
  id: string;
  term: string;
  scope: "text-and-tags" | "tags-only";
  excludeFollowing?: boolean;
  expiration?: {dateTime: string; label?: string};
}

export interface ContentReportReason {
  id: string;
  label: string;
  description?: string;
  requiresDetails?: boolean;
  disabled?: boolean;
}

export interface ContentReportDraft {
  reasonId: string;
  details: string;
}

export interface ContentReportFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "children" | "onChange" | "onSubmit"> {
  reasons: readonly ContentReportReason[];
  draft: ContentReportDraft;
  onDraftChange: (draft: ContentReportDraft) => void;
  onSubmit: (draft: ContentReportDraft) => void;
  /** Display only enough information to identify the subject. */
  subject?: ReactNode;
  maxDetails?: number;
  pending?: boolean;
  error?: string;
  labels?: {
    reason?: string;
    details?: string;
    detailsRequired?: string;
    characters?: string;
    submit?: string;
  };
}

/** Draft a report for an identified post, comment or other record. @since 0.2.14 */
export const ContentReportForm = /* @__PURE__ */ forwardRef<HTMLFormElement, ContentReportFormProps>(function ContentReportForm(
  {reasons, draft, onDraftChange, onSubmit, subject, maxDetails = 300, pending = false, error, labels, ...props}, ref,
) {
  const name = useId();
  const detailsRef = useRef<HTMLTextAreaElement>(null);
  const [attemptedReason, setAttemptedReason] = useState<string>();
  const selected = reasons.find(reason => reason.id === draft.reasonId && !reason.disabled);
  const details = draft.details.trim();
  const detailsError = selected?.requiresDetails && attemptedReason === selected.id && !details
    ? labels?.detailsRequired ?? "Add details for this reason."
    : undefined;
  return <form {...props} ref={ref} noValidate aria-busy={pending || undefined} onSubmit={event => {
    event.preventDefault();
    if (pending || !selected || draft.details.length > maxDetails) return;
    if (selected.requiresDetails && !details) {
      setAttemptedReason(selected.id);
      detailsRef.current?.focus();
      return;
    }
    onSubmit({reasonId:selected.id,details});
  }}>
    <Stack gap="4">
      {subject}
      <RadioCardGroup name={name} legend={labels?.reason ?? "Reason"} density="compact" minItemWidth="100%"
        required disabled={pending} options={reasons.map(({id,label,description,disabled}) => ({value:id,label,description,disabled}))}
        value={draft.reasonId} onValueChange={reasonId => {
          setAttemptedReason(undefined);
          onDraftChange({...draft,reasonId});
        }} />
      <Field label={labels?.details ?? "Details"} required={selected?.requiresDetails} error={detailsError}
        hint={<CharacterCount value={draft.details} max={maxDetails} label={labels?.characters} />}>
        {field => <Textarea {...field} ref={detailsRef} rows={2} autoGrow maxLength={maxDetails}
          value={draft.details} disabled={pending} onChange={event => {
            setAttemptedReason(undefined);
            onDraftChange({...draft,details:event.currentTarget.value});
          }} />}
      </Field>
      {error && <Text as="p" size="compact" tone="error" role="alert">{error}</Text>}
      <FormActions primary={<Button type="submit" disabled={!selected || draft.details.length > maxDetails}
        loading={pending ? "retain-focus" : false}>{labels?.submit ?? "Submit report"}</Button>} />
    </Stack>
  </form>;
});

const databaseWebhookEvents = ["insert", "update", "delete"] as const;
export type DatabaseWebhookEvent = typeof databaseWebhookEvents[number];

export interface DatabaseWebhookDraft {
  name: string;
  tableId: string;
  events: readonly DatabaseWebhookEvent[];
  endpoint: string;
}

export interface DatabaseWebhookFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "children" | "onChange" | "onSubmit" | "noValidate"> {
  /** Supply stable IDs and schema-qualified labels where table names may repeat. */
  tables: readonly {id: string; label: string; disabled?: boolean}[];
  draft: DatabaseWebhookDraft;
  onDraftChange: (draft: DatabaseWebhookDraft) => void;
  onSubmit: (draft: DatabaseWebhookDraft) => void;
  pending?: boolean;
  error?: string;
  labels?: {name?: string; table?: string; chooseTable?: string; noTables?: string; events?: string; chooseEvents?: string; endpoint?: string; invalidEndpoint?: string; submit?: string} &
    Partial<Record<DatabaseWebhookEvent, string>>;
}

/** Subscribe one database table to row events delivered to an HTTP destination. @since 0.2.14 */
export const DatabaseWebhookForm = /* @__PURE__ */ forwardRef<HTMLFormElement, DatabaseWebhookFormProps>(function DatabaseWebhookForm(
  {tables, draft, onDraftChange, onSubmit, pending = false, error, labels, ...props}, ref,
) {
  const notEmpty = Boolean(draft.name.trim() && draft.endpoint.trim());
  const table = tables.find(candidate => candidate.id && candidate.id === draft.tableId);
  const hasTables = tables.some(candidate => candidate.id && !candidate.disabled);
  const events = databaseWebhookEvents.filter(event => draft.events.includes(event));
  const [endpointChecked, setEndpointChecked] = useState(false);
  const endpointRef = useRef<HTMLInputElement>(null);
  const endpoint = draft.endpoint.trim();
  let validEndpoint = false;
  if (/^https?:\/\//i.test(endpoint) && !/[\s\\]/.test(endpoint)) {
    try {
      const url = new URL(endpoint);
      validEndpoint = Boolean(url.hostname && !url.username && !url.password);
    } catch { /* Keep invalid endpoints in the draft for correction. */ }
  }
  const endpointError = endpointChecked && endpoint && !validEndpoint
    ? labels?.invalidEndpoint ?? "Enter an HTTP or HTTPS URL without credentials." : undefined;
  const canSubmit = notEmpty && Boolean(table && !table.disabled && events.length);
  return <form {...props} ref={ref} noValidate aria-busy={pending || undefined} onSubmit={event => {
    event.preventDefault();
    if (pending || !canSubmit) return;
    setEndpointChecked(true);
    if (validEndpoint) onSubmit({name:draft.name.trim(),tableId:draft.tableId,events,endpoint});
    else endpointRef.current?.focus();
  }}>
    <Stack gap="4">
      <Field label={labels?.name ?? "Webhook name"} required>
        {field => <Input {...field} value={draft.name} controlSize="sm" readOnly={pending}
          onChange={event => onDraftChange({...draft,name:event.currentTarget.value})} />}
      </Field>
      <Field label={labels?.table ?? "Table"} required
        hint={!hasTables ? labels?.noTables ?? "No tables are available for webhooks." : undefined}>
        {field => <Select {...field} value={table?.id ?? ""} controlSize="sm" disabled={pending || !hasTables}
          onChange={event => onDraftChange({...draft,tableId:event.currentTarget.value})}>
          <option value="" disabled>{labels?.chooseTable ?? "Choose a table"}</option>
          {tables.filter(candidate => candidate.id).map(candidate =>
            <option key={candidate.id} value={candidate.id} disabled={candidate.disabled}>{candidate.label}</option>)}
        </Select>}
      </Field>
      <CheckboxGroup name="events" legend={labels?.events ?? "Row events"} orientation="horizontal" disabled={pending}
        hint={!events.length ? labels?.chooseEvents ?? "Choose at least one event." : undefined}
        options={databaseWebhookEvents.map(event => ({value:event,label:labels?.[event] ?? event.toUpperCase()}))}
        value={events} onValueChange={selected => onDraftChange({...draft,events:databaseWebhookEvents.filter(event => selected.includes(event))})} />
      <Field label={labels?.endpoint ?? "Destination URL"} required error={endpointError}>
        {field => <Input {...field} ref={endpointRef} type="url" dir="ltr" value={draft.endpoint} controlSize="sm" readOnly={pending}
          onChange={event => onDraftChange({...draft,endpoint:event.currentTarget.value})} />}
      </Field>
      {error && <Text as="p" size="compact" tone="error" role="alert">{error}</Text>}
      <FormActions primary={<Button type="submit" disabled={!canSubmit} loading={pending ? "retain-focus" : false}>
        {labels?.submit ?? "Create webhook"}
      </Button>} />
    </Stack>
  </form>;
});

export interface EnvironmentCreationDraft {
  name: string;
  mode: "empty" | "duplicate";
  /** Keep the selection when switching modes. Empty requests omit it. */
  sourceId?: string;
}

export type EnvironmentCreationRequest = {name: string} & (
  | {mode: "empty"}
  | {mode: "duplicate"; sourceId: string}
);

export interface EnvironmentCreationFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "children" | "onChange" | "onSubmit"> {
  sources: readonly {id: string; label: string; copyDescription?: string; unavailableReason?: string}[];
  draft: EnvironmentCreationDraft;
  onDraftChange: (draft: EnvironmentCreationDraft) => void;
  onSubmit: (request: EnvironmentCreationRequest) => void;
  pending?: boolean;
  error?: string;
  labels?: {name?: string; setup?: string; empty?: string; duplicate?: string; source?: string; choose?: string; noSources?: string; submit?: string};
}

/** Configure a new environment and disclose what its starting point copies. @since 0.2.14 */
export const EnvironmentCreationForm = /* @__PURE__ */ forwardRef<HTMLFormElement, EnvironmentCreationFormProps>(function EnvironmentCreationForm(
  {sources, draft, onDraftChange, onSubmit, pending = false, error, labels, ...props}, ref,
) {
  const duplicating = draft.mode === "duplicate";
  const available = sources.some(source => source.id && !source.unavailableReason);
  const source = sources.find(source => source.id && source.id === draft.sourceId);
  const canSubmit = Boolean(draft.name.trim() && (!duplicating || (source && !source.unavailableReason)));

  return <form {...props} ref={ref} aria-busy={pending || undefined} onSubmit={event => {
    event.preventDefault();
    if (pending || !canSubmit) return;
    const name = draft.name.trim();
    onSubmit(duplicating && source ? {name, mode:"duplicate", sourceId:source.id} : {name, mode:"empty"});
  }}>
    <Stack gap="4">
      <Field label={labels?.name ?? "Environment name"} required>
        {field => <Input {...field} value={draft.name} controlSize="sm" readOnly={pending}
          onChange={event => onDraftChange({...draft,name:event.currentTarget.value})} />}
      </Field>
      <Field label={labels?.setup ?? "Starting point"}>
        {field => <Select {...field} value={draft.mode} controlSize="sm" disabled={pending}
          onChange={event => onDraftChange({...draft,mode:event.currentTarget.value === "duplicate" ? "duplicate" : "empty"})}>
          <option value="empty">{labels?.empty ?? "Start empty"}</option>
          <option value="duplicate">{labels?.duplicate ?? "Duplicate an environment"}</option>
        </Select>}
      </Field>
      {duplicating && <Field label={labels?.source ?? "Source environment"} required
        hint={source?.unavailableReason ?? (!available ? labels?.noSources ?? "No environments are available to duplicate." : source?.copyDescription)}>
        {field => <Select {...field} value={source?.id ?? ""} controlSize="sm" disabled={pending || !available}
          onChange={event => onDraftChange({...draft,sourceId:event.currentTarget.value})}>
          <option value="" disabled>{labels?.choose ?? "Choose an environment"}</option>
          {sources.filter(source => source.id).map(source => <option key={source.id} value={source.id} disabled={Boolean(source.unavailableReason)}>
            {source.unavailableReason ? `${source.label} — ${source.unavailableReason}` : source.label}
          </option>)}
        </Select>}
      </Field>}
      {error && <Text as="p" size="compact" tone="error" role="alert">{error}</Text>}
      <FormActions primary={<Button type="submit" disabled={!canSubmit} loading={pending ? "retain-focus" : false}>
        {labels?.submit ?? "Create environment"}
      </Button>} />
    </Stack>
  </form>;
});

export interface LogExportDraft {
  format: string;
  rowLimit: number;
  lookbackSeconds?: number;
}

export interface LogExportFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "children" | "onChange" | "onSubmit"> {
  /** Formats supported by the host's export endpoint. */
  formats: readonly {id: string; label: string}[];
  rowLimits: readonly number[];
  /** A fixed range is already applied to the host query. */
  range: {kind: "fixed"; label: string} | {kind: "recent"; options: readonly {seconds: number; label: string}[]};
  draft: LogExportDraft;
  onDraftChange: (draft: LogExportDraft) => void;
  onSubmit: (draft: LogExportDraft) => void;
  pending?: boolean;
  error?: string;
  labels?: {format?: string; rowLimit?: string; timeRange?: string; choose?: string; submit?: string};
}

/** Configure a bounded export of the current log query. @since 0.2.14 */
export const LogExportForm = /* @__PURE__ */ forwardRef<HTMLFormElement, LogExportFormProps>(function LogExportForm(
  {formats, rowLimits, range, draft, onDraftChange, onSubmit, pending = false, error, labels, lang, ...props}, ref,
) {
  const numberFormat = new Intl.NumberFormat(lang ?? "en");
  const availableFormats = formats.filter(format => format.id !== "");
  const limits = [...new Set(rowLimits.filter(limit => Number.isSafeInteger(limit) && limit > 0))];
  const windows = range.kind === "recent" ? range.options.filter(option => Number.isSafeInteger(option.seconds) && option.seconds > 0) : [];
  const format = availableFormats.find(option => option.id === draft.format);
  const rowLimit = limits.find(limit => limit === draft.rowLimit);
  const lookbackSeconds = windows.find(option => option.seconds === draft.lookbackSeconds)?.seconds;
  const canExport = Boolean(format && rowLimit && (range.kind === "fixed" || lookbackSeconds));
  const timeRangeLabel = labels?.timeRange ?? "Time range";
  const choose = labels?.choose ?? "Choose…";

  return <form {...props} ref={ref} lang={lang} aria-busy={pending || undefined} onSubmit={event => {
    event.preventDefault();
    if (pending || !canExport) return;
    const {format, rowLimit} = draft;
    onSubmit(lookbackSeconds === undefined ? {format, rowLimit} : {format, rowLimit, lookbackSeconds});
  }}>
    <Stack gap="4">
      {range.kind === "fixed" ? <DescriptionList layout="columns" density="compact"
        items={[{id:"time-range",term:timeRangeLabel,description:range.label}]} />
        : <Field label={timeRangeLabel}>
          {field => <Select {...field} value={lookbackSeconds ?? ""} disabled={pending || !windows.length}
            onChange={event => onDraftChange({...draft,lookbackSeconds:Number(event.currentTarget.value)})}>
            {lookbackSeconds === undefined && <option value="" disabled>{choose}</option>}
            {windows.map(option => <option key={option.seconds} value={option.seconds}>{option.label}</option>)}
          </Select>}
        </Field>}
      <Grid minItemWidth="9rem" gap="3">
        <Field label={labels?.format ?? "Format"}>
          {field => <Select {...field} value={format?.id ?? ""} disabled={pending || !availableFormats.length}
            onChange={event => onDraftChange({...draft,format:event.currentTarget.value})}>
            {!format && <option value="" disabled>{choose}</option>}
            {availableFormats.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
          </Select>}
        </Field>
        <Field label={labels?.rowLimit ?? "Row limit"}>
          {field => <Select {...field} value={rowLimit ?? ""} disabled={pending || !limits.length}
            onChange={event => onDraftChange({...draft,rowLimit:Number(event.currentTarget.value)})}>
            {!rowLimit && <option value="" disabled>{choose}</option>}
            {limits.map(limit => <option key={limit} value={limit}>{numberFormat.format(limit)}</option>)}
          </Select>}
        </Field>
      </Grid>
      {error && <Text as="p" size="compact" tone="error" role="alert">{error}</Text>}
      <FormActions primary={<Button type="submit" disabled={!canExport} loading={pending ? "retain-focus" : false}>
        {labels?.submit ?? "Download logs"}
      </Button>} />
    </Stack>
  </form>;
});

const contentReportPhases = {
  submitted: {label:"Submitted",tone:"neutral"},
  "in-review": {label:"In review",tone:"info"},
  "action-taken": {label:"Action taken",tone:"success"},
  "no-action": {label:"No action taken",tone:"neutral"},
} as const;

export type ContentReportReview =
  | {phase: "submitted" | "in-review"; summary?: never}
  | {phase: "action-taken" | "no-action"; summary?: string};

export interface ContentReportStatusProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  /** A display-safe name for the reported record. */
  title: string;
  review: ContentReportReview;
  reason?: string;
  submittedAt?: Pick<TimestampProps, "dateTime" | "children" | "lang" | "timeZone">;
  headingLevel?: HeadingProps["level"];
  labels?: {
    reason?: string;
    submitted?: string;
    phases?: Partial<Record<ContentReportReview["phase"], string>>;
  };
}

/** A reporter-facing record of submission and the published moderation outcome. @since 0.2.14 */
export const ContentReportStatus = /* @__PURE__ */ forwardRef<HTMLDivElement, ContentReportStatusProps>(function ContentReportStatus(
  {title, review, reason, submittedAt, headingLevel = 2, labels, ...props}, ref,
) {
  const titleId = useId();
  const status = contentReportPhases[review.phase];
  const details: DescriptionItem[] = [];
  if (reason?.trim()) details.push({id:"reason",term:labels?.reason ?? "Reason",description:reason});
  if (submittedAt) details.push({id:"submitted",term:labels?.submitted ?? "Submitted on",
    description:<Timestamp size="compact" {...submittedAt} />});
  return <Stack {...props} ref={ref} role="article" aria-labelledby={titleId} gap="4">
    <Stack gap="2">
      <Heading id={titleId} level={headingLevel} size="group" dir="auto">{title}</Heading>
      <StatusIndicator size="sm" presentation="wrap" label={labels?.phases?.[review.phase] ?? status.label} tone={status.tone} />
      {review.summary?.trim() && <Text as="p" size="compact" tone="subtle" dir="auto">{review.summary}</Text>}
    </Stack>
    {details.length > 0 && <DescriptionList items={details} layout="columns" density="compact" />}
  </Stack>;
});

const moderationEffectStates = {
  active: {label:"In effect",tone:"warning"},
  expired: {label:"Expired",tone:"neutral"},
  reversed: {label:"Reversed",tone:"neutral"},
} as const;

type ModerationNoticeDate = Pick<TimestampProps, "dateTime" | "children" | "lang" | "timeZone">;

export type ModerationNoticeAppeal =
  | {state: "available"; action: ReactNode; deadline?: ModerationNoticeDate}
  | {state: "submitted" | "upheld" | "overturned"; action?: never; deadline?: never};

const moderationAppealResults = {
  submitted: {label:"Appeal submitted",tone:"info"},
  upheld: {label:"Decision upheld",tone:"neutral"},
  overturned: {label:"Appeal accepted",tone:"success"},
} as const;

export interface ModerationNoticeProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  /** Name the effect, such as Posting temporarily restricted. */
  title: string;
  reason: string;
  effect: keyof typeof moderationEffectStates;
  /** Scheduled end of an active restriction, when the service supplies one. */
  endsAt?: ModerationNoticeDate;
  appeal?: ModerationNoticeAppeal;
  headingLevel?: HeadingProps["level"];
  labels?: {
    endsAt?: string;
    appealDeadline?: string;
    effects?: Partial<Record<ModerationNoticeProps["effect"], string>>;
    appealResults?: Partial<Record<keyof typeof moderationAppealResults, string>>;
  };
}

/** A persistent notice for one published moderation decision and the available appeal path. @since 0.2.14 */
export const ModerationNotice = /* @__PURE__ */ forwardRef<HTMLDivElement, ModerationNoticeProps>(function ModerationNotice(
  {title, reason, effect, endsAt, appeal, headingLevel = 2, labels, ...props}, ref,
) {
  const titleId = useId();
  const effectStatus = moderationEffectStates[effect];
  const appealState = appeal?.state === "available" ? undefined : appeal?.state;
  const facts: DescriptionItem[] = [];
  if (endsAt && effect === "active") {
    facts.push({id:"ends",term:labels?.endsAt ?? "Ends",description:<Timestamp format="date-time" {...endsAt} />});
  }
  if (appeal?.state === "available" && appeal.deadline) {
    facts.push({id:"deadline",term:labels?.appealDeadline ?? "Appeal by",description:<Timestamp format="date-time" {...appeal.deadline} />});
  }
  return <Stack {...props} ref={ref} role="article" aria-labelledby={titleId} gap="4">
    <Stack gap="2">
      <Heading id={titleId} level={headingLevel} size="group" dir="auto">{title}</Heading>
      <Inline gap="3">
        <StatusIndicator size="sm" presentation="wrap" label={labels?.effects?.[effect] ?? effectStatus.label} tone={effectStatus.tone} />
        {appealState && <StatusIndicator size="sm" presentation="wrap"
          label={labels?.appealResults?.[appealState] ?? moderationAppealResults[appealState].label}
          tone={moderationAppealResults[appealState].tone} />}
      </Inline>
      <Text as="p" size="compact" tone="subtle" dir="auto">{reason}</Text>
    </Stack>
    {facts.length > 0 && <DescriptionList items={facts} layout="columns" density="compact" />}
    {appeal?.state === "available" && <Inline>{appeal.action}</Inline>}
  </Stack>;
});

export type AccountStandingState = "good" | "at-risk" | "restricted" | "unknown";

export interface AccountStandingProps extends Omit<SectionProps, "children" | "actions"> {
  /** A service-reported state independent of strike totals. */
  standing: AccountStandingState;
  /** Omit when the service has no confirmed active count. */
  activeStrikes?: number;
  /** The next confirmed expiry among active strikes, if available. */
  nextExpiry?: Pick<TimestampProps, "dateTime" | "timeZone" | "children">;
  historyAction?: ReactNode;
  labels?: {
    states?: Partial<Record<AccountStandingState, string>>;
    activeStrikes?: string;
    nextExpiry?: string;
  };
}

const accountStandingStates = {
  good: {label:"Good standing",tone:"success"},
  "at-risk": {label:"At risk",tone:"warning"},
  restricted: {label:"Restricted",tone:"error"},
  unknown: {label:"Unavailable",tone:"neutral"},
} as const;

/** Show the account's overall moderation standing and reported strike facts. @since 0.2.14 */
export const AccountStanding = /* @__PURE__ */ forwardRef<HTMLElement,AccountStandingProps>(function AccountStanding(
  {standing, activeStrikes, nextExpiry, historyAction, labels, headingSize = "group", ...props}, ref,
) {
  if (activeStrikes !== undefined && (!Number.isSafeInteger(activeStrikes) || activeStrikes < 0)) {
    throw new RangeError("Flood AccountStanding requires a nonnegative integer strike count");
  }
  const state = accountStandingStates[standing];
  const facts: DescriptionItem[] = [];
  if (activeStrikes !== undefined) {
    facts.push({id:"strikes",term:labels?.activeStrikes ?? "Active strikes",description:activeStrikes});
  }
  if (nextExpiry && activeStrikes !== 0) {
    facts.push({id:"expiry",term:labels?.nextExpiry ?? "Next expiry",
      description:<Timestamp {...nextExpiry} size="compact" />});
  }
  return <Section {...props} ref={ref} headingSize={headingSize}
    actions={<StatusIndicator size="sm" label={labels?.states?.[standing] ?? state.label} tone={state.tone} />}>
    {(facts.length > 0 || hasFieldContent(historyAction)) && <Stack gap="3">
      {facts.length > 0 && <DescriptionList layout="columns" items={facts} />}
      {hasFieldContent(historyAction) && <Inline gap="2">{historyAction}</Inline>}
    </Stack>}
  </Section>;
});

export interface ModerationAppealDraft {
  decisionId: string;
  explanation: string;
}

export interface ModerationAppealFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "children" | "onChange" | "onSubmit"> {
  decision: {id: string; title: string; reason?: string};
  value: string;
  onValueChange: (explanation: string) => void;
  onSubmit: (appeal: ModerationAppealDraft) => void;
  onCancel?: () => void;
  pending?: boolean;
  error?: string;
  /** A positive character limit for the untrimmed draft. */
  maxLength?: number;
  labels?: {explanation?: string; overLimit?: string; characters?: string; submit?: string; cancel?: string};
}

/** Draft a request to reconsider one published moderation decision. @since 0.2.14 */
export const ModerationAppealForm = /* @__PURE__ */ forwardRef<HTMLFormElement, ModerationAppealFormProps>(function ModerationAppealForm(
  {decision, value, onValueChange, onSubmit, onCancel, pending = false, error, maxLength = 1000, labels, ...props}, ref,
) {
  const explanation = value.trim();
  const tooLong = value.length > maxLength;
  return <form {...props} ref={ref} noValidate aria-busy={pending || undefined} onSubmit={event => {
    event.preventDefault();
    if (!pending && explanation && !tooLong) onSubmit({decisionId:decision.id,explanation});
  }}>
    <Stack gap="4">
      <Stack gap="1">
        <Text as="p" size="label" dir="auto">{decision.title}</Text>
        {decision.reason && <Text as="p" size="compact" tone="subtle" dir="auto">{decision.reason}</Text>}
      </Stack>
      <Field label={labels?.explanation ?? "Why should we reconsider?"} required
        error={tooLong ? labels?.overLimit ?? "Shorten your explanation before sending." : undefined}
        hint={<CharacterCount value={value} max={maxLength} label={labels?.characters} />}>
        {field => <Textarea {...field} value={value} rows={3} autoGrow readOnly={pending}
          onChange={event => onValueChange(event.currentTarget.value)} />}
      </Field>
      {error && <Text as="p" size="compact" tone="error" role="alert">{error}</Text>}
      <FormActions
        secondary={onCancel && <Button type="button" variant="ghost" disabled={pending} onClick={onCancel}>{labels?.cancel ?? "Cancel"}</Button>}
        primary={<Button type="submit" disabled={!explanation || tooLong}
          loading={pending ? "retain-focus" : false}>{labels?.submit ?? "Submit appeal"}</Button>} />
    </Stack>
  </form>;
});

const mutedWordScopeLabels = {"text-and-tags":"Text and tags", "tags-only":"Tags only"} as const;
const mutedWordDurations = {indefinite:"Until removed", "24-hours":"24 hours", "7-days":"7 days", "30-days":"30 days"} as const;

export interface MutedWordDraft {
  term: string;
  scope: MutedWordRule["scope"];
  duration: keyof typeof mutedWordDurations;
  excludeFollowing: boolean;
}

export interface MutedWordFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "children" | "onChange" | "onSubmit"> {
  value: MutedWordDraft;
  onValueChange: (value: MutedWordDraft) => void;
  onSubmit: (value: MutedWordDraft) => void;
  disabled?: boolean;
  pending?: boolean;
  termError?: string;
  error?: string;
  labels?: {
    term?: string;
    scope?: string;
    duration?: string;
    excludeFollowing?: string;
    submit?: string;
    scopes?: Partial<Record<MutedWordDraft["scope"], string>>;
    durations?: Partial<Record<MutedWordDraft["duration"], string>>;
  };
}

/** Draft a personal word or tag mute. The host validates and persists the rule. @since 0.2.14 */
export const MutedWordForm = /* @__PURE__ */ forwardRef<HTMLFormElement, MutedWordFormProps>(function MutedWordForm(
  {value, onValueChange, onSubmit, disabled = false, pending = false, termError, error, labels, ...props}, ref,
) {
  const blocked = disabled || pending;
  const term = value.term.trim();
  const update = (patch: Partial<MutedWordDraft>) => onValueChange({...value,...patch});
  return <form {...props} ref={ref} aria-busy={pending || undefined} onSubmit={event => {
    event.preventDefault();
    if (!blocked && term) onSubmit({...value,term});
  }}>
    <Stack gap="4">
      <Field label={labels?.term ?? "Word, phrase or tag"} required error={termError}>
        {field => <Input {...field} value={value.term} disabled={blocked} autoComplete="off" spellCheck={false}
          onChange={event => update({term:event.currentTarget.value})} />}
      </Field>
      <Grid gap="3" minItemWidth="9rem" maxColumns={2}>
        <Field label={labels?.scope ?? "Match in"}>
          {field => <Select {...field} value={value.scope} disabled={blocked}
            onChange={event => update({scope:event.currentTarget.value as MutedWordDraft["scope"]})}>
            {Object.entries(mutedWordScopeLabels).map(([scope, label]) =>
              <option key={scope} value={scope}>{labels?.scopes?.[scope as MutedWordDraft["scope"]] ?? label}</option>)}
          </Select>}
        </Field>
        <Field label={labels?.duration ?? "Duration"}>
          {field => <Select {...field} value={value.duration} disabled={blocked}
            onChange={event => update({duration:event.currentTarget.value as MutedWordDraft["duration"]})}>
            {Object.entries(mutedWordDurations).map(([duration, label]) =>
              <option key={duration} value={duration}>{labels?.durations?.[duration as MutedWordDraft["duration"]] ?? label}</option>)}
          </Select>}
        </Field>
      </Grid>
      <Checkbox label={labels?.excludeFollowing ?? "Except accounts you follow"} checked={value.excludeFollowing} disabled={blocked}
        onChange={event => update({excludeFollowing:event.currentTarget.checked})} />
      {error && <Text as="p" size="compact" tone="error" role="alert">{error}</Text>}
      <FormActions primary={<Button type="submit" disabled={disabled || !term} loading={pending ? "retain-focus" : false}>
        {labels?.submit ?? "Add mute"}
      </Button>} />
    </Stack>
  </form>;
});

export interface MutedWordListProps extends Omit<SectionProps, "children" | "title"> {
  title?: string;
  rules: readonly MutedWordRule[];
  /** An edit or removal action owned by the host. */
  renderRuleAction?: (rule: MutedWordRule) => ReactNode;
  timeZone?: string;
  labels?: {
    rules?: string;
    details?: string;
    empty?: string;
    scope?: Partial<Record<MutedWordRule["scope"], string>>;
    excludeFollowing?: string;
    expiration?: (time: ReactNode) => ReactNode;
  };
}

/** Show the scope and expiry of a viewer's active word and tag mutes. @since 0.2.14 */
export const MutedWordList = /* @__PURE__ */ forwardRef<HTMLElement, MutedWordListProps>(function MutedWordList(
  {title = "Muted words", rules, renderRuleAction, timeZone, labels, headingSize = "group", ...props}, ref,
) {
  const scopes = {
    ...mutedWordScopeLabels,
    ...labels?.scope,
  };
  return <Section {...props} ref={ref} title={title} headingSize={headingSize}>
    {rules.length ? <DataList aria-label={labels?.rules ?? "Active mute rules"} density="compact" dividers={false}>
      {rules.map(rule => {
        const time = rule.expiration && <Timestamp dateTime={rule.expiration.dateTime}
          timeZone={timeZone} lang={props.lang} format="date-time">{rule.expiration.label}</Timestamp>;
        return <DataListItem key={rule.id} layout="row"
          title={<Text size="label" dir="auto" style={{overflowWrap:"anywhere"}}>{rule.term}</Text>}
          description={<MetadataList label={labels?.details ?? "Rule details"} items={[
            {id:"scope",value:scopes[rule.scope]},
            {id:"exception",value:rule.excludeFollowing && (labels?.excludeFollowing ?? "Except accounts you follow")},
            {id:"expiration",value:time && (labels?.expiration ? labels.expiration(time) : <>Until {time}</>)},
          ]} />}
          actions={renderRuleAction?.(rule)} />;
      })}
    </DataList> : <Text as="p" size="compact" tone="subtle">{labels?.empty ?? "No muted words."}</Text>}
  </Section>;
});

export type RestrictionGroup = {
  id: string;
  label: string;
  /** Scope or policy that supplies this restriction. */
  source?: string;
} & (
  | {mode: "unrestricted"; entries?: never}
  | {mode: "allow-list" | "block-list"; entries: readonly Pick<TagGroupItem, "id" | "label">[]}
);

export interface RestrictionSummaryProps extends Omit<DataListProps, "children" | "dividers" | "density" | "reserveSelectionSpace"> {
  label: string;
  groups: readonly RestrictionGroup[];
  modeLabels?: Partial<Record<RestrictionGroup["mode"], string>>;
}

/** Read configured allow and block lists with their policy scope. @since 0.2.14 */
export const RestrictionSummary = /* @__PURE__ */ forwardRef<HTMLUListElement, RestrictionSummaryProps>(function RestrictionSummary(
  {label, groups, modeLabels, ...props}, ref,
) {
  if (!label.trim() || new Set(groups.map(group => group.id)).size !== groups.length ||
      groups.some(group => !group.id.trim() || !group.label.trim())) {
    throw new Error("Flood RestrictionSummary requires a label and uniquely identified groups");
  }
  const modeText = {
    "allow-list": "Only these allowed",
    "block-list": "Blocked",
    unrestricted: "No restrictions",
    ...modeLabels,
  };
  return <DataList {...props} ref={ref} aria-label={label} density="compact" dividers={false}>
    {groups.map(group => {
      const entries = group.mode === "unrestricted" ? undefined : group.entries;
      if (group.mode !== "unrestricted" && !entries?.length) {
        throw new Error("Flood RestrictionSummary requires entries for an allow list or block list");
      }
      return <DataListItem key={group.id} layout="content"
        title={<Inline align="baseline" gap="2">
          <Text size="label">{group.label}</Text>
          {group.source && <Text size="helper" tone="subtle">{group.source}</Text>}
        </Inline>}
        description={<Text size="compact" tone="subtle">{modeText[group.mode]}</Text>}
        details={entries && <TagGroup size="sm" label={group.label} items={entries} />} />;
    })}
  </DataList>;
});

export type ApprovalChainStatus = "queued" | "pending" | "approved" | "changes-requested" | "rejected" | "skipped";

export interface ApprovalChainReviewer {
  id: string;
  name: string;
  src?: string;
  /** Supporting identity, such as the person this reviewer is covering for. */
  detail?: string;
  /** Include when reviewers within one stage can reach different outcomes. */
  status?: ApprovalChainStatus;
}

export interface ApprovalChainStage {
  id: string;
  label: string;
  status: ApprovalChainStatus;
  reviewers?: readonly ApprovalChainReviewer[];
  /** Accepted approvals and the threshold reported by the host for this stage. */
  approvals?: { received: number; required: number };
  detail?: string;
  timeLabel?: string;
  dateTime?: string;
}

export interface ApprovalChainProps extends Omit<HTMLAttributes<HTMLOListElement>, "children"> {
  label: string;
  stages: readonly ApprovalChainStage[];
  statusLabels?: Partial<Record<ApprovalChainStatus, string>>;
  formatApprovalCount?: (approvals: NonNullable<ApprovalChainStage["approvals"]>) => string;
  density?: TimelineProps["density"];
}

const approvalChainStates = {
  queued: { label: "Queued", tone: "neutral" },
  pending: { label: "Awaiting review", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  "changes-requested": { label: "Changes requested", tone: "warning" },
  rejected: { label: "Rejected", tone: "error" },
  skipped: { label: "Skipped", tone: "neutral" },
} as const;

/** Read-only status of an approval route, including parallel or delegated reviewers. */
export const ApprovalChain = /* @__PURE__ */ forwardRef<HTMLOListElement, ApprovalChainProps>(function ApprovalChain({
  label, stages, statusLabels, formatApprovalCount, density, className, ...props
}, ref) {
  const statusLabel = (status: ApprovalChainStatus) => statusLabels?.[status] ?? approvalChainStates[status].label;
  const approvalCount = ({received, required}: NonNullable<ApprovalChainStage["approvals"]>) =>
    received > required ? `${received} approved · ${required} required` : `${received} of ${required} approvals`;
  return <Timeline {...props} ref={ref} label={label} mode="activity" density={density}
    className={classes("flood-approval-chain", className)}
    items={stages.map(stage => ({
      id: stage.id,
      title: stage.label,
      dateTime: stage.dateTime,
      timeLabel: stage.timeLabel,
      description: stage.approvals ? <Stack gap="1">
        <Text size="helper" tone="subtle" className="flood-approval-chain__count">
          {(formatApprovalCount ?? approvalCount)(stage.approvals)}
        </Text>
        {stage.detail}
      </Stack> : stage.detail,
      summary: <Inline className="flood-approval-chain__row" gap="2">
        <Text size="label" className="flood-approval-chain__label">{stage.label}</Text>
        <Badge size="sm" tone={approvalChainStates[stage.status].tone}>{statusLabel(stage.status)}</Badge>
      </Inline>,
      content: !!stage.reviewers?.length && <ul role="list" className="flood-approval-chain__reviewers">
        {stage.reviewers.map(reviewer => <li key={reviewer.id}>
          <Inline className="flood-approval-chain__row" gap="2">
            <AuthorMeta name={reviewer.name} src={reviewer.src} size="sm" metadata={reviewer.detail} />
            {reviewer.status && <Text size="helper" tone="subtle">{statusLabel(reviewer.status)}</Text>}
          </Inline>
        </li>)}
      </ul>,
    }))} />;
});

export interface ApprovalRequestProps extends Omit<SectionProps, "actions" | "children" | "onSubmit"> {
  /** Facts and artifacts that describe the exact request. */
  evidence?: ReactNode;
  options: readonly ApprovalRequestOption[];
  draft: ApprovalRequestDraft;
  onDraftChange: (draft: ApprovalRequestDraft) => void;
  onDecision: (decision: ApprovalRequestDecision) => void;
  status?: ApprovalRequestStatus;
  labels?: { decision?: string; submit?: string };
}

/** Review the evidence, choose an outcome and submit the decision. @since 0.2.14 */
export const ApprovalRequest = /* @__PURE__ */ forwardRef<HTMLElement, ApprovalRequestProps>(function ApprovalRequest(props, ref) {
  return <ApprovalDecisionForm {...props} ref={ref} />;
});

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  title: string;
  /** Supporting context for the title, such as a status or count. */
  metadata?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  headingId?: string;
  /** Use level 2 when showing a page header inside an existing document outline. */
  headingLevel?: 1 | 2;
  headingSize?: "page" | "large" | "display";
}
/** The primary heading and associated actions inside a page's main region. @since 0.2.11 */
export const PageHeader = /* @__PURE__ */ forwardRef<HTMLElement, PageHeaderProps>(function PageHeader(
  {headingSize = "large", headingLevel = 1, ...props}, ref,
) { return <PageHeading {...props} ref={ref} headingSize={headingSize} headingLevel={headingLevel} />; });

export interface AppTopBarProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  start?: ReactNode;
  end?: ReactNode;
  /** Let a compact breadcrumb shrink within the start group before commands wrap. */
  layout?: "wrap" | "compact";
  bordered?: boolean;
}
/** Persistent application chrome with independent context and action slots. @since 0.2.11 */
export const AppTopBar = /* @__PURE__ */ forwardRef<HTMLElement, AppTopBarProps>(function AppTopBar(
  {bordered = false, ...props}, ref,
) { return <ApplicationTopBar {...props} ref={ref} bordered={bordered} />; });

export interface AppShellNavigationDrawer {
  /** Switch below this shell width in CSS pixels. */
  below: number;
  title: string;
  triggerLabel?: string;
  size?: DrawerProps["size"];
  renderContent: (close: () => void) => ReactNode;
}
export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  navigation?: ReactNode;
  navigationSide?: "start" | "end";
  navigationDrawer?: AppShellNavigationDrawer;
  /** Render function places the shell's responsive trigger in a custom top bar. */
  topBar?: ReactNode | ((navigationTrigger: ReactNode) => ReactNode);
  footer?: ReactNode;
  scroll?: "content" | "page";
  mainId?: string;
  /** Use section when embedding a shell inside an existing main landmark. */
  mainAs?: "main" | "section";
  mainLabel?: string;
  mainRef?: Ref<HTMLElement>;
  scrollLabel?: string;
  scrollOrientation?: ScrollAreaProps["orientation"];
  /** Keep the content width stable with "none" when the layout already clears the overlay rails. */
  scrollContentInset?: ScrollAreaProps["contentInset"];
  skipLabel?: string;
}
/** Composes application navigation and a main landmark with optional bounded scrolling. @since 0.2.11 */
export const AppShell = /* @__PURE__ */ forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  {navigationSide = "start", scroll = "content", mainAs = "main", ...props}, ref,
) { return <ApplicationShell {...props} ref={ref} navigationSide={navigationSide} scroll={scroll} mainAs={mainAs} />; });

export interface SplitProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  main: ReactNode;
  aside: ReactNode;
  side?: "start" | "end";
  ratio?: "balanced" | "main" | "aside";
  collapseAt?: "sm" | "md" | "lg" | "never";
  gap?: Space;
}
export const Split = /* @__PURE__ */ forwardRef<HTMLDivElement, SplitProps>(function Split(
  {side = "end", ratio = "main", collapseAt = "md", gap = "6", ...props}, ref,
) { return <SplitLayout {...props} ref={ref} side={side} ratio={ratio} collapseAt={collapseAt} gap={gap} />; });

export interface HistoryVersion {
  id: string;
  label: string;
  /** Short metadata, such as the author and date of the saved checkpoint. */
  description?: string;
}

export interface VersionHistoryProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "defaultValue"> {
  label: string;
  /** Checkpoints in the host's intended reading order. */
  versions: readonly HistoryVersion[];
  currentId?: string;
  currentLabel?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  renderPreview: (version: HistoryVersion) => ReactNode;
  /** A host-owned action for historical versions, such as a confirmation dialog trigger. */
  renderRestore?: (version: HistoryVersion) => ReactNode;
  emptyContent?: ReactNode;
}

/** Browse saved checkpoints and inspect one selected version. @since 0.2.14 */
export const VersionHistory = /* @__PURE__ */ forwardRef<HTMLDivElement, VersionHistoryProps>(function VersionHistory(props, ref) {
  return <VersionHistoryPanel {...props} ref={ref} />;
});

export interface CenterProps extends HTMLAttributes<HTMLDivElement> {
  inline?: boolean;
  maxWidth?: string;
  minHeight?: string;
}
export const Center = /* @__PURE__ */ forwardRef<HTMLDivElement, CenterProps>(function Center(
  {inline = false, ...props}, ref,
) { return <CenterLayout {...props} ref={ref} inline={inline} />; });

export interface SkipLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
}
export const SkipLink = /* @__PURE__ */ forwardRef<HTMLAnchorElement, SkipLinkProps>(function SkipLink(
  {children = "Skip to content", ...props}, ref,
) { return <SkipNavigation {...props} ref={ref}>{children}</SkipNavigation>; });


export interface ListBoxProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "defaultValue" | "onChange"> {
  label: string;
  hideLabel?: boolean;
  required?: boolean;
  requiredMessage?: string;
  validationMessage?: string;
  description?: string;
  message?: string;
  status?: FieldStatus;
  invalid?: boolean;
  options: readonly ComboboxOption[];
  value?: string | readonly string[];
  defaultValue?: string | readonly string[];
  onValueChange?: (value: string | string[]) => void;
  multiple?: boolean;
  selectionBehavior?: "automatic" | "manual";
  appearance?: "surface" | "plain";
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
  form?: string;
  controlSize?: "sm" | "md" | "lg" | "xl";
}
export const ListBox = /* @__PURE__ */ forwardRef<HTMLDivElement, ListBoxProps>(function ListBox(
  {multiple = false, disabled = false, readOnly = false, hideLabel = false, controlSize = "md", ...props}, ref,
) { return <CollectionListBox {...props} ref={ref} multiple={multiple} disabled={disabled} readOnly={readOnly} hideLabel={hideLabel} controlSize={controlSize} />; });

export interface PinInputProps extends Omit<InputProps, "type" | "children" | "value" | "defaultValue" | "onChange" | "pattern" | "size"> {
  label: string;
  hideLabel?: boolean;
  length?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  mode?: "numeric" | "alphanumeric";
  mask?: boolean;
}
export const PinInput = /* @__PURE__ */ forwardRef<HTMLInputElement, PinInputProps>(function PinInput(
  {length = 6, mode = "numeric", mask = false, hideLabel = false, controlSize = "md", ...props}, ref,
) { return <SegmentedPinInput {...props} ref={ref} length={length} mode={mode} mask={mask} hideLabel={hideLabel} controlSize={controlSize} />; });

export interface RatingProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "children" | "onChange" | "defaultValue"> {
  label: string;
  hideLabel?: boolean;
  value?: number;
  defaultValue?: number;
  max?: number;
  onValueChange?: (value: number) => void;
  getValueLabel?: (value: number, max: number) => string;
  readOnly?: boolean;
  required?: boolean;
  name: string;
  form?: string;
  size?: ContentSize;
}
export const Rating = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, RatingProps>(function Rating(
  {max = 5, defaultValue = 0, hideLabel = false, readOnly = false, size = "md", ...props}, ref,
) { return <StarRating {...props} ref={ref} max={max} defaultValue={defaultValue} hideLabel={hideLabel} readOnly={readOnly} size={size} />; });

export interface RatingValueProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "role"> {
  /** A fractional rating, or null when ratings are unavailable. */
  value: number | null;
  max?: number;
  count?: number;
  size?: ContentSize;
  appearance?: "stars" | "compact";
  showValue?: boolean;
  unratedLabel?: string;
}

/** A noninteractive rating for cards, lists and records. */
export const RatingValue = /* @__PURE__ */ forwardRef<HTMLSpanElement, RatingValueProps>(function RatingValue(
  {value, max = 5, count, size = "md", appearance = "stars", showValue = true, unratedLabel = "No ratings",
    lang, "aria-label": label, className, ...props}, ref,
) {
  if (!Number.isInteger(max) || max < 1 || max > 10 ||
      (value !== null && (!Number.isFinite(value) || value < 0 || value > max)) ||
      (count !== undefined && (!Number.isSafeInteger(count) || count < 0))) {
    throw new Error("Flood RatingValue requires a rating within its scale and a nonnegative integer count");
  }
  const format = new Intl.NumberFormat(lang ?? "en", {maximumFractionDigits: 2});
  const score = value === null ? "" : format.format(value);
  const countText = count === undefined ? undefined : format.format(count);
  const name = value === null ? unratedLabel :
    `${score} out of ${format.format(max)}${countText !== undefined ? ` from ${countText} ${count === 1 ? "rating" : "ratings"}` : ""}`;
  return <span {...props} ref={ref} lang={lang} role="img" aria-label={label ?? name}
    className={classes("flood-rating-value", className)} data-size={size}>
    {value === null ? <Text size="helper" tone="subtle">{unratedLabel}</Text> : <>
      <span className="flood-rating-value__stars" aria-hidden="true">
        {appearance === "compact" ? <RatingStar fill={1} /> :
          Array.from({length:max}, (_, index) => <RatingStar key={index} fill={Math.max(0, Math.min(1, value - index))} />)}
      </span>
      {(showValue || appearance === "compact" || countText !== undefined) && <span className="flood-rating-value__numbers" aria-hidden="true">
        {(showValue || appearance === "compact") && <Text size="compact" className="flood-rating-value__score">{appearance === "compact" ? `${score}/${format.format(max)}` : score}</Text>}
        {countText !== undefined && <Text size="helper" tone="subtle">({countText})</Text>}
      </span>}
    </>}
  </span>;
});

export interface RatingSummaryLabels {
  empty?: string;
  count?: (count: number, formattedCount: string) => string;
  score?: (formattedScore: string, formattedMax: string) => string;
  bucket?: (starCount: number, formattedStarCount: string) => string;
}

export interface RatingBucketFilter {
  /** The accepted star filter, or null for all ratings. */
  value: number | null;
  onValueChange: (stars: number | null) => void;
}

export interface RatingBreakdownProps extends Omit<HTMLAttributes<HTMLUListElement>, "children" | "role"> {
  label: string;
  /** Counts from one star to the highest score. */
  counts: readonly number[];
  labels?: Pick<RatingSummaryLabels, "count" | "bucket" | "empty">;
  filter?: RatingBucketFilter;
}

function countRatings(counts: readonly number[], label: string, component: string) {
  const buckets = Array.from(counts);
  const total = buckets.reduce((sum, count) => sum + count, 0);
  if (!label.trim() || buckets.length < 1 || buckets.length > 10 || !Number.isSafeInteger(total) ||
      buckets.some(count => !Number.isSafeInteger(count) || count < 0)) {
    throw new Error(`Flood ${component} requires a label and one to ten nonnegative safe integer counts with a safe total`);
  }
  return { buckets, total };
}

function ratingCountLabel(labels: RatingBreakdownProps["labels"], count: number, formatted: string) {
  return labels?.count?.(count, formatted) ?? `${formatted} ${count === 1 ? "rating" : "ratings"}`;
}

const RatingBucketList = /* @__PURE__ */ forwardRef<HTMLUListElement, RatingBreakdownProps & { total: number }>(function RatingBucketList({
  label, counts, labels, filter, total, className, lang, ...props
}, ref) {
  const format = new Intl.NumberFormat(lang ?? "en");
  return <List {...props} ref={ref} aria-label={label} lang={lang} marker={false} gap="1"
    className={classes("flood-rating-summary__distribution", className)}>
    {total === 0 ? <li><Text size="helper" tone="subtle">{labels?.empty ?? "No ratings"}</Text></li> :
      counts.map((_, index) => {
        const stars = counts.length - index;
        const count = counts[stars - 1];
        const starText = format.format(stars);
        const countText = format.format(count);
        const bucketLabel = labels?.bucket?.(stars, starText) ?? `${starText} ${stars === 1 ? "star" : "stars"}`;
        const countLabel = ratingCountLabel(labels, count, countText);
        const pressed = filter?.value === stars;
        return <li key={stars} className="flood-rating-summary__bucket" data-filterable={Boolean(filter) || undefined}>
          <Text size="helper" tone="subtle" aria-hidden="true"><bdi>{starText}</bdi></Text>
          <Meter aria-hidden={filter ? true : undefined} label={bucketLabel} value={count} max={total} valueText={countLabel} size="sm" hideLabel/>
          <Text size="helper" tone="subtle" aria-hidden="true" className="flood-rating-summary__bucket-count"><bdi>{countText}</bdi></Text>
          {filter && <Button variant="ghost" className="flood-rating-summary__bucket-action"
            aria-label={`${bucketLabel}, ${countLabel}`} aria-pressed={pressed} disabled={count === 0 && !pressed}
            onClick={() => filter.onValueChange(pressed ? null : stars)} />}
        </li>;
      })}
  </List>;
});

/** The distribution of ratings, with an optional controlled filter. */
export const RatingBreakdown = /* @__PURE__ */ forwardRef<HTMLUListElement, RatingBreakdownProps>(function RatingBreakdown({
  label, counts, ...props
}, ref) {
  const { buckets, total } = countRatings(counts, label, "RatingBreakdown");
  return <RatingBucketList {...props} ref={ref} label={label} counts={buckets} total={total} />;
});

export interface RatingSummaryProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  label: string;
  /** Counts from one star to the highest score. Use zero for any empty bucket. */
  counts: readonly number[];
  labels?: RatingSummaryLabels;
  layout?: "auto" | "stacked";
  filter?: RatingBucketFilter;
}

/** The aggregate score and distribution calculated from the same rating counts. */
export const RatingSummary = /* @__PURE__ */ forwardRef<HTMLDivElement, RatingSummaryProps>(function RatingSummary(
  {label, counts, labels, layout = "auto", filter, lang, className, ...props}, ref,
) {
  const {buckets, total} = countRatings(counts, label, "RatingSummary");
  const max = buckets.length;
  const locale = lang ?? "en";
  const formatNumber = new Intl.NumberFormat(locale);
  const average = total ? Math.min(max, buckets.reduce((sum, count, index) => sum + count * (index + 1), 0) / total) : null;
  const maximum = formatNumber.format(max);
  const score = average === null ? undefined : new Intl.NumberFormat(locale, {maximumFractionDigits: 1}).format(average);
  const scoreLabel = score === undefined ? undefined : labels?.score?.(score, maximum) ?? `${score} out of ${maximum}`;
  return <div {...props} ref={ref} lang={lang} role="group" aria-label={label}
    className={classes("flood-rating-summary", className)} data-layout={layout}>
    {average === null ? <RatingValue value={null} max={max} unratedLabel={labels?.empty}/> :
      <div className="flood-rating-summary__body">
        <Stack gap="1" className="flood-rating-summary__overview">
          <Inline gap="1" align="baseline" aria-hidden="true" className="flood-rating-summary__score">
            <Text className="flood-rating-summary__value"><bdi>{score}</bdi></Text>
            <Text size="compact" tone="subtle">/ <bdi>{maximum}</bdi></Text>
          </Inline>
          <RatingValue value={average} max={max} lang={lang} size="sm" showValue={false} aria-label={scoreLabel}/>
          <Text size="helper" tone="subtle" className="flood-rating-summary__count">{ratingCountLabel(labels, total, formatNumber.format(total))}</Text>
        </Stack>
        <RatingBucketList label={label} counts={buckets} total={total} labels={labels} filter={filter} lang={lang} />
      </div>}
  </div>;
});

export interface DropzoneProps extends Omit<FileInputProps, "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop"> {
  label: string;
  description?: string;
  density?: "compact" | "comfortable";
}
export const Dropzone = /* @__PURE__ */ forwardRef<HTMLInputElement, DropzoneProps>(function Dropzone(
  {description = "Drag files here", multiple = true, ...props}, ref,
) { return <FileDropzone {...props} ref={ref} description={description} multiple={multiple} />; });

export interface FileDropTargetProps extends Omit<HTMLAttributes<HTMLDivElement>,
  "children" | "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop">,
  Pick<FileTriggerProps, "accept" | "capture" | "multiple" | "disabled" | "onFilesSelect"> {
  label: string;
  description?: string;
  chooseLabel?: string;
}

/** A picker and file drop surface for a host-owned import or upload queue. */
export const FileDropTarget = /* @__PURE__ */ forwardRef<HTMLDivElement, FileDropTargetProps>(function FileDropTarget(props, ref) {
  return <OwnedFileDropTarget {...props} ref={ref}/>;
});

export interface CharacterCountProps extends HTMLAttributes<HTMLOutputElement> {
  value?: string;
  count?: number;
  max?: number;
  mode?: "count" | "remaining";
  label?: string;
  overLimitLabel?: string;
  htmlFor?: string;
  form?: string;
}
export const CharacterCount = /* @__PURE__ */ forwardRef<HTMLOutputElement, CharacterCountProps>(function CharacterCount(
  {mode = "count", label = "Characters", overLimitLabel = "Over limit", ...props}, ref,
) { return <SupportingCharacterCount {...props} ref={ref} mode={mode} label={label} overLimitLabel={overLimitLabel} />; });
