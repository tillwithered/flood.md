"use client";

import {
  forwardRef,
  createElement,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
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
  type ImgHTMLAttributes,
  type BlockquoteHTMLAttributes,
} from "react";
import { useFocusableHidden } from "./focusable-hidden.js";
import { resolveFieldStatus, hasFieldContent, mergeDescriptions } from "./field-state.js";
import { SingleSelect } from "./select.js";
import { MixedCheckbox } from "./checkbox.js";
import { OverlayScrollArea } from "./scroll-area.js";
import { ChoiceGroup } from "./choice-group.js";
import { Disclosure } from "./disclosure.js";
import { AnchoredOverlay, ModalOverlay } from "./overlays.js";
import { TabNavigation, BreadcrumbNavigation, PageNavigation } from "./navigation.js";
import { AvatarArtwork } from "./avatar.js";
import { ValueIndicator, FeedbackMessage } from "./feedback.js";
import { DescribedData, TabularData } from "./data-display.js";
import { ActionMenu } from "./menu.js";
import { RovingToolbar } from "./toolbar.js";
import { NumericStepper } from "./numeric-input.js";
import { RangeControl } from "./slider.js";
import {GroupedAvatars, NamedStatus, CaptionedFigure, AttributedQuote, InlineCodeText, MeasuredValue, EventTimeline} from "./content-elements.js";
import { NavigationMenu, StepSequence, ContentSection, SplitLayout, CenterLayout, SkipNavigation } from "./navigation-layout.js";
import { CollectionListBox, SegmentedPinInput, StarRating, FileDropzone, SupportingCharacterCount } from "./form-controls.js";
import { ClipboardAction, NotificationRegion } from "./feedback-actions.js";
import { ConfirmationDialog } from "./alert-dialog.js";
import { FilePicker } from "./file-input.js";
import { SearchField, PasswordField } from "./text-inputs.js";
import { SearchSelection } from "./combobox.js";
import { FreeTagEntry } from "./tag-input.js";
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
import { FileRecord, UploadRecord, ModalImagePreview, FileMetadata } from "./file-records.js";
import { ManagedDataTable } from "./data-table.js";
import { CheckableCard, ExclusiveCard } from "./collection-cards.js";
import { ColorPreview, ColorEditor } from "./color-controls.js";
import { HoverPreview } from "./hover-card.js";
import { HierarchicalSelect } from "./tree-select.js";
import { CivilDateTimePicker } from "./date-time-picker.js";
import { HierarchicalNavigation } from "./navigation-tree.js";
import { AdaptiveActions } from "./overflow-actions.js";
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
  size?: "sm" | "md" | "lg" | "xl";
  variant?: ButtonProps["variant"];
  shape?: ToolbarProps["shape"];
  disabled?: boolean;
}
/** Priority-based overflow composed from Toolbar, Button and Menu. @since 0.2.11 */
export const OverflowActions = /* @__PURE__ */ forwardRef<HTMLDivElement, OverflowActionsProps>(function OverflowActions(props, ref) { return <AdaptiveActions {...props} ref={ref}/>; });
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

export interface FileMetaProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  format?: string;
  size?: number;
  formatSize?: (bytes: number) => string;
}
/** A quiet combined format/size chip; display metadata only. @since 0.2.8 */
export const FileMeta = /* @__PURE__ */ forwardRef<HTMLSpanElement,FileMetaProps>(function FileMeta(props,ref){return <FileMetadata {...props} ref={ref}/>;});

export interface FileActionLabels {
  preview?: string; remove?: string; cancel?: string; retry?: string;
  queued?: string; uploading?: string; success?: string; error?: string; cancelled?: string;
}
export interface FileItemProps extends Omit<HTMLAttributes<HTMLLIElement>, "children" | "title"> {
  name: string;
  size?: number;
  mimeType?: string;
  format?: string | null;
  thumbnail?: ReactNode;
  description?: ReactNode;
  href?: string;
  download?: boolean;
  onPreview?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
  labels?: FileActionLabels;
  formatSize?: (bytes: number) => string;
}
/** A display row; it neither reads files nor creates object URLs. @since 0.2.8 */
export const FileItem = /* @__PURE__ */ forwardRef<HTMLLIElement,FileItemProps>(function FileItem(props,ref){return <FileRecord {...props} ref={ref}/>;});
export interface FileListProps extends DataListProps { label: string; }
/** A named native list of FileItem rows. @since 0.2.8 */
export const FileList = /* @__PURE__ */ forwardRef<HTMLUListElement,FileListProps>(function FileList({label,className,...props},ref){
  if(!label.trim())throw new Error("Flood FileList requires a nonempty label");
  return <DataList {...props} ref={ref} aria-label={label} className={classes("flood-file-list",className)}/>;
});
export interface UploadItemProps extends Omit<FileItemProps,"description"> {
  state: "queued" | "uploading" | "success" | "error" | "cancelled";
  progress?: number;
  error?: string;
  onCancel?: () => void;
  onRetry?: () => void;
}
/** Host-owned upload state with applicable actions only. @since 0.2.8 */
export const UploadItem = /* @__PURE__ */ forwardRef<HTMLLIElement,UploadItemProps>(function UploadItem(props,ref){return <UploadRecord {...props} ref={ref}/>;});
export interface UploadListProps extends FileListProps {}
/** A named native list of UploadItem rows. @since 0.2.8 */
export const UploadList = /* @__PURE__ */ forwardRef<HTMLUListElement,UploadListProps>(function UploadList(props,ref){return <FileList {...props} ref={ref}/>;});
export interface ImagePreviewProps extends Omit<DialogProps,"children" | "description"> {
  src: string;
  alt: string;
  caption?: ReactNode;
  downloadHref?: string;
  downloadLabel?: string;
  loadingLabel?: string;
  errorLabel?: string;
}
/** A single-image viewer using Flood Dialog focus and dismissal. @since 0.2.8 */
export const ImagePreview = /* @__PURE__ */ forwardRef<HTMLDialogElement,ImagePreviewProps>(function ImagePreview(props,ref){return <ModalImagePreview {...props} ref={ref}/>;});

export interface DataTableColumn {
  id: string;
  label: string;
  sortable?: boolean;
  align?: "start" | "end";
  width?: CSSProperties["width"];
}
export interface DataTableRow {
  id: string;
  label?: string;
  cells: Readonly<Record<string, ReactNode>>;
  sortValues?: Readonly<Record<string, string | number | null>>;
  selectionDisabled?: boolean;
}
export interface DataTableSort { column: string; direction: "ascending" | "descending"; }
export interface DataTableLabels {
  loading?: string;
  empty?: string;
  error?: string;
  retry?: string;
  selectPage?: string;
  selectRow?: (label: string) => string;
  results?: (from: number, to: number, total: number) => string;
  selection?: (selected: number, total: number) => string;
  sort?: (label: string) => string;
  pagination?: string;
  previousPage?: string;
  nextPage?: string;
  page?: (page: number) => string;
}
export interface DataTableProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  caption: string;
  hideCaption?: boolean;
  columns: readonly DataTableColumn[];
  rows: readonly DataTableRow[];
  density?: "compact" | "comfortable";
  striped?: boolean;
  minWidth?: CSSProperties["minWidth"];
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
  onPageChange?: (page: number) => void;
  /** Server mode renders rows as the supplied page, without local sorting/slicing. */
  paginationMode?: "client" | "server";
  totalRows?: number;
  /** Server dataset selection is controlled; the host validates IDs outside this page. */
  selectionScope?: "page" | "dataset";
  state?: "ready" | "loading" | "error";
  onRetry?: () => void;
  labels?: DataTableLabels;
}
/** A client-side table composed from native table, checkbox and pagination. @since 0.2.8 */
export const DataTable = /* @__PURE__ */ forwardRef<HTMLDivElement,DataTableProps>(function DataTable(props,ref){return <ManagedDataTable {...props} ref={ref}/>;});

export interface DataListProps extends Omit<HTMLAttributes<HTMLUListElement>, "role"> {
  density?: "compact" | "comfortable";
  dividers?: boolean;
}
/** A native list; links and actions stay independent. @since 0.2.8 */
export const DataList = /* @__PURE__ */ forwardRef<HTMLUListElement,DataListProps>(function DataList({density="comfortable",dividers=true,className,...props},ref){
  return <ul {...props} ref={ref} role="list" data-density={density} data-dividers={dividers} className={classes("flood-data-list",className)}/>;
});
export interface DataListItemProps extends Omit<HTMLAttributes<HTMLLIElement>, "title" | "children"> {
  title: ReactNode;
  description?: ReactNode;
  media?: ReactNode;
  metadata?: ReactNode;
  actions?: ReactNode;
}
/** A structured list row, never an interactive wrapper. @since 0.2.8 */
export const DataListItem = /* @__PURE__ */ forwardRef<HTMLLIElement,DataListItemProps>(function DataListItem({title,description,media,metadata,actions,className,...props},ref){
  return <li {...props} ref={ref} className={classes("flood-data-list-item",className)}>
    {hasFieldContent(media)&&<div className="flood-data-list-item__media">{media}</div>}
    <div className="flood-data-list-item__copy"><div className="flood-data-list-item__title">{title}</div>
      {hasFieldContent(description)&&<div className="flood-data-list-item__description">{description}</div>}
    </div>
    {(hasFieldContent(metadata)||hasFieldContent(actions))&&<div className="flood-data-list-item__trailing">
      {hasFieldContent(metadata)&&<div className="flood-data-list-item__metadata">{metadata}</div>}
      {hasFieldContent(actions)&&<div className="flood-data-list-item__actions">{actions}</div>}
    </div>}
  </li>;
});
export interface CheckCardProps extends Omit<CheckboxProps,"label" | "children"> {
  label: string;
  description?: ReactNode;
  icon?: ReactNode;
  metadata?: ReactNode;
  density?: "compact" | "comfortable";
}
/** A native checkbox inside a clickable noninteractive content card. @since 0.2.8 */
export const CheckCard = /* @__PURE__ */ forwardRef<HTMLInputElement,CheckCardProps>(function CheckCard(props,ref){return <CheckableCard {...props} ref={ref}/>;});
export interface RadioCardProps extends Omit<ChoiceProps,"label" | "children"> {
  label: string;
  description?: ReactNode;
  icon?: ReactNode;
  metadata?: ReactNode;
  density?: "compact" | "comfortable";
}
/** Give exclusive choices the same native name and an enclosing Fieldset. @since 0.2.8 */
export const RadioCard = /* @__PURE__ */ forwardRef<HTMLInputElement,RadioCardProps>(function RadioCard(props,ref){return <ExclusiveCard {...props} ref={ref}/>;});

export interface ColorSwatchProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "color"> {
  value: string; label: string; size?: "sm" | "md" | "lg";
}
/** @since 0.2.8 */
export const ColorSwatch = /* @__PURE__ */ forwardRef<HTMLSpanElement, ColorSwatchProps>(function ColorSwatch(props, ref) { return <ColorPreview {...props} ref={ref} />; });
export interface ColorPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children"> {
  label: string; hideLabel?: boolean; value?: string; defaultValue?: string;
  onValueChange?: (value: string) => void; name?: string; form?: string;
  required?: boolean; disabled?: boolean; readOnly?: boolean;
  controlSize?: "sm" | "md" | "lg"; presets?: readonly string[]; invalidMessage?: string;
  hexLabel?: string; channelLabels?: readonly [string, string, string]; presetsLabel?: string;
}
/** @since 0.2.8 */
export const ColorPicker = /* @__PURE__ */ forwardRef<HTMLInputElement, ColorPickerProps>(function ColorPicker(props, ref) { return <ColorEditor {...props} ref={ref} />; });
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
export interface NavigationTreeItem {
  value: string;
  label: string;
  href?: string;
  icon?: ReactNode;
  disabled?: boolean;
  children?: readonly NavigationTreeItem[];
  content?: ReactNode;
  linkProps?: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children" | "aria-current">;
}
export interface NavigationTreeProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "onChange"> {
  label: string;
  items: readonly NavigationTreeItem[];
  currentValue?: string;
  expandedValues?: readonly string[];
  defaultExpandedValues?: readonly string[];
  onExpandedValuesChange?: (values: string[]) => void;
  expandLabel?: (item: NavigationTreeItem, expanded: boolean) => string;
  size?: ContentSize;
}
/** @since 0.2.7 */
export const NavigationTree = /* @__PURE__ */ forwardRef<HTMLElement, NavigationTreeProps>(function NavigationTree(props, ref) {
  return <HierarchicalNavigation {...props} ref={ref} />;
});

export interface ErrorSummaryItem { id: string; fieldId: string; message: string; }
export interface ErrorSummaryProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title" | "onSelect" | "role" | "aria-live"> {
  title: string;
  errors: readonly ErrorSummaryItem[];
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
  { weekStartsOn = 0, locale = "en-US", autoFocus = false, ...props }, ref,
) { return <DateCalendar {...props} ref={ref} weekStartsOn={weekStartsOn} locale={locale} autoFocus={autoFocus} />; });
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
  loading?: boolean;
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
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        data-tone={tone === "danger" ? tone : undefined}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={classes(
          "flood-button",
          `flood-button--${variant}`,
          `flood-button--${size}`,
          className,
        )}
      >
        {loading && <Spinner decorative />}
        {children}
      </button>
    );
  },
);

export type FieldStatus = "error" | "warning" | "success" | "info";

export type ContentSize = "sm" | "md" | "lg";
export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  size?: ContentSize;
  icon?: ReactNode;
  disabled?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
  removeButtonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type" | "disabled" | "onClick" | "aria-label">;
}
/** @since 0.2.5 */
export const Tag = /* @__PURE__ */ forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { size = "md", icon, disabled = false, onRemove, removeLabel, removeButtonProps, className, children, ...props }, ref,
) {
  const label = removeLabel ?? (typeof children === "string" || typeof children === "number" ? `Remove ${children}` : "");
  if (onRemove && !label.trim()) throw new Error("Flood Tag removal needs an accessible removeLabel for rich content");
  const iconSize = size === "sm" ? "2xs" : size === "md" ? "xs" : "sm";
  return <span {...props} ref={ref} className={classes("flood-tag", className)} data-size={size} data-disabled={disabled || undefined}>
    {hasFieldContent(icon) && <IconSlot size={iconSize}>{icon}</IconSlot>}
    <span className="flood-tag__label">{children}</span>
    {onRemove && <IconButton {...removeButtonProps} type="button" className={classes("flood-tag__remove", removeButtonProps?.className)} label={label} variant="ghost" size={iconSize} disabled={disabled} onClick={() => { if (!disabled) onRemove(); }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
    </IconButton>}
  </span>;
});
export interface KbdProps extends HTMLAttributes<HTMLElement> { size?: ContentSize; }
/** @since 0.2.4 */
export const Kbd = /* @__PURE__ */ forwardRef<HTMLElement, KbdProps>(function Kbd(
  { size = "sm", className, ...props }, ref,
) {
  return <kbd {...props} ref={ref} className={classes("flood-kbd", className)} data-size={size} />;
});

export interface ToolbarProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  label: string;
  orientation?: "horizontal" | "vertical";
  loop?: boolean;
  /** Pill keeps a single horizontal rail; rounded permits wrapped tool groups. */
  shape?: "rounded" | "pill";
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
}
export interface DescriptionListProps extends Omit<HTMLAttributes<HTMLDListElement>, "children"> {
  items: readonly DescriptionItem[];
  layout?: "inline" | "stacked";
  density?: DataDensity;
  dividers?: boolean;
}
/** @since 0.2.4 */
export const DescriptionList = /* @__PURE__ */ forwardRef<HTMLDListElement, DescriptionListProps>(function DescriptionList(
  { items, layout = "inline", density = "compact", dividers = false, ...props }, ref,
) {
  return <DescribedData {...props} ref={ref} items={items} layout={layout} density={density} dividers={dividers} />;
});

export interface TableProps extends Omit<TableHTMLAttributes<HTMLTableElement>, "children"> {
  caption: string;
  children: ReactNode;
  hideCaption?: boolean;
  density?: DataDensity;
  striped?: boolean;
  scrollLabel?: string;
  /** Shared cell alignment. Middle keeps mixed record/action rows coherent; top is an explicit prose-table choice. */
  cellVerticalAlign?: "top" | "middle" | "bottom";
}
/** @since 0.2.4 */
export const Table = /* @__PURE__ */ forwardRef<HTMLTableElement, TableProps>(function Table(
  { caption, children, hideCaption = false, density = "comfortable", striped = false, scrollLabel, cellVerticalAlign = "middle", ...props }, ref,
) {
  return <TabularData {...props} ref={ref} caption={caption} hideCaption={hideCaption} density={density} striped={striped} scrollLabel={scrollLabel} cellVerticalAlign={cellVerticalAlign}>{children}</TabularData>;
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

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "role" | "aria-label" | "aria-hidden"> {
  name: string;
  src?: string;
  fallback?: string;
  size?: ContentSize;
  shape?: "circle" | "rounded";
  decorative?: boolean;
}
/** @since 0.2.4 */
export const Avatar = /* @__PURE__ */ forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { name, src, fallback, size = "md", shape = "circle", decorative = false, className, ...props }, ref,
) {
  const initials = name.trim().split(/\s+/u).filter(Boolean).slice(0, 2).map(word => Array.from(word)[0]).join("").toUpperCase();
  return <span {...props} ref={ref} className={classes("flood-avatar", className)} data-size={size} data-shape={shape}
    role={decorative ? undefined : "img"} aria-label={decorative ? undefined : name} aria-hidden={decorative || undefined}>
    <AvatarArtwork key={src ?? ""} src={src} fallback={fallback ?? (initials || "?")} />
  </span>;
});

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  label: string;
  value?: number;
  max?: number;
  valueText?: string;
  size?: ContentSize;
  tone?: SemanticTone;
  hideLabel?: boolean;
}
/** @since 0.2.4 */
export const Progress = /* @__PURE__ */ forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { label, value, max = 100, valueText, size = "md", tone = "accent", hideLabel = false, ...props }, ref,
) {
  return <ValueIndicator {...props} ref={ref} kind="progress" label={label} value={value} min={0} max={max} valueText={valueText} size={size} tone={tone} hideLabel={hideLabel} />;
});

export interface MeterProps extends Omit<ProgressProps, "value"> {
  value: number;
  min?: number;
}
/** @since 0.2.4 */
export const Meter = /* @__PURE__ */ forwardRef<HTMLDivElement, MeterProps>(function Meter(
  { label, value, min = 0, max = 100, valueText, size = "md", tone = "neutral", hideLabel = false, ...props }, ref,
) {
  return <ValueIndicator {...props} ref={ref} kind="meter" label={label} value={value} min={min} max={max} valueText={valueText} size={size} tone={tone} hideLabel={hideLabel} />;
});

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "role" | "aria-live"> {
  title?: string;
  tone?: "neutral" | FieldStatus;
  icon?: ReactNode;
  announcement?: "off" | "polite" | "assertive";
}
/** @since 0.2.4 */
export const Alert = /* @__PURE__ */ forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { title, tone = "info", icon, announcement = "off", ...props }, ref,
) {
  return <FeedbackMessage {...props} ref={ref} title={title} tone={tone} icon={icon} announcement={announcement} />;
});

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}
export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "defaultValue" | "onChange"> {
  label: string;
  items: readonly TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  activationMode?: "automatic" | "manual";
  orientation?: "horizontal" | "vertical";
  controlSize?: "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  iconOnly?: boolean;
}
export const Tabs = /* @__PURE__ */ forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {activationMode="automatic",orientation="horizontal",controlSize="md",disabled=false,iconOnly=false,...props},ref,
){return <TabNavigation {...props} ref={ref} activationMode={activationMode} orientation={orientation} controlSize={controlSize} disabled={disabled} iconOnly={iconOnly} />;});
export interface BreadcrumbItem {label:string;href?:string;}
export interface BreadcrumbProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  items: readonly BreadcrumbItem[];
  label?: string;
  separator?: string;
}
export const Breadcrumb = /* @__PURE__ */ forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
  {label="Breadcrumb",separator="/",...props},ref,
){return <BreadcrumbNavigation {...props} ref={ref} label={label} separator={separator} />;});
export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "onChange"> {
  page: number;
  pageCount: number;
  onPageChange?: (page: number) => void;
  getHref?: (page: number) => string;
  siblingCount?: 0 | 1 | 2;
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

export interface OverlayTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref: RefCallback<HTMLButtonElement>;
}
export interface MenuActionItem {
  id: string;
  type?: "item";
  label: string;
  icon?: ReactNode;
  shortcut?: string;
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
export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "content" | "title" | "role"> {
  content: string;
  trigger: (props: OverlayTriggerProps) => ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  delay?: number;
  disabled?: boolean;
}
export const Tooltip = /* @__PURE__ */ forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  {side = "top", align = "center", delay = 300, disabled = false, ...props}, ref,
) { return <AnchoredOverlay {...props} ref={ref} kind="tooltip" side={side} align={align} delay={delay} disabled={disabled} />; });
export interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title" | "role"> {
  title: string;
  chrome?: "default" | "minimal";
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
}
export const Popover = /* @__PURE__ */ forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  {side = "bottom", align = "start", defaultOpen = false, disabled = false, closeLabel = "Close", ...props}, ref,
) { return <AnchoredOverlay {...props} ref={ref} kind="popover" side={side} align={align} defaultOpen={defaultOpen} disabled={disabled} closeLabel={closeLabel} />; });
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
}
export const Dialog = /* @__PURE__ */ forwardRef<HTMLDialogElement, DialogProps>(function Dialog(
  {defaultOpen = false, disabled = false, closeLabel = "Close", closeOnOutsideClick = true, ...props}, ref,
) { return <ModalOverlay {...props} ref={ref} defaultOpen={defaultOpen} disabled={disabled} closeLabel={closeLabel} closeOnOutsideClick={closeOnOutsideClick} />; });

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

export interface CollapsibleProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "onChange"> {
  title: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
  headingLevel?: 2 | 3 | 4 | 5 | 6;
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
}
export const Accordion = /* @__PURE__ */ forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  {label, items, expansionMode = "single", value, defaultValue = [], onValueChange, disabled = false, controlSize = "md", headingLevel = 3, className, onKeyDown, ...props}, ref,
) {
  const [local, setLocal] = useState(() => [...new Set(defaultValue)]);
  const expanded = value ?? local;
  if (new Set(items.map(item => item.value)).size !== items.length) throw new Error("Flood accordion item values must be unique");
  if (expansionMode === "single" && new Set(expanded).size > 1) throw new Error("Flood single Accordion accepts at most one value");
  return <div {...props} ref={ref} role="group" aria-label={label} className={classes("flood-accordion", className)} onKeyDown={event => {
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

export interface SearchInputProps extends Omit<InputProps, "type" | "children"> {
  clearable?: boolean;
  clearLabel?: string;
}
export const SearchInput = /* @__PURE__ */ forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { clearable = true, clearLabel = "Clear search", controlSize = "md", ...props }, ref,
) {
  return <SearchField {...props} ref={ref} clearable={clearable} clearLabel={clearLabel} controlSize={controlSize} group={InputGroup} action={IconButton} icon={IconSlot} />;
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
  description?: string;
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

export interface MultiSelectProps extends Omit<ComboboxProps, "value" | "defaultValue" | "onValueChange"> {
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  removeItemLabel?: string;
}
/** @since 0.2.5 */
export const MultiSelect = /* @__PURE__ */ forwardRef<HTMLInputElement, MultiSelectProps>(function MultiSelect(
  { value, defaultValue = [], onValueChange, removeItemLabel = "Remove", clearable = false, emptyMessage = "No results found.", listLabel = "Options", toggleLabel = "Show options", clearLabel = "Clear selection", invalidSelectionMessage = "Select at least one option.", controlSize = "md", ...props }, ref,
) {
  return <SearchSelection {...props} ref={ref} multiple selectedValues={value} initialValues={defaultValue} onSelectionChange={onValueChange} removeItemLabel={removeItemLabel} clearable={clearable} emptyMessage={emptyMessage} listLabel={listLabel} toggleLabel={toggleLabel} clearLabel={clearLabel} invalidSelectionMessage={invalidSelectionMessage} controlSize={controlSize} />;
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
}
/** @since 0.2.5 */
export const NumberInput = /* @__PURE__ */ forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { defaultValue = 0, step = 1, controlSize = "md", decreaseLabel = "Decrease value", increaseLabel = "Increase value", ...props }, ref,
) {
  return <NumericStepper {...props} ref={ref} defaultValue={defaultValue} step={step} controlSize={controlSize} decreaseLabel={decreaseLabel} increaseLabel={increaseLabel} inputComponent={InputGroup} buttonComponent={IconButton} />;
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
  readOnly?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
}
/** @since 0.2.5 */
export const Slider = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, SliderProps>(function Slider(
  { defaultValue = [50], min = 0, max = 100, step = 1, showValue = true, readOnly = false, controlSize = "md", ...props }, ref,
) {
  return <RangeControl {...props} ref={ref} defaultValue={defaultValue} min={min} max={max} step={step} showValue={showValue} readOnly={readOnly} controlSize={controlSize} fieldsetComponent={Fieldset} />;
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  status?: FieldStatus;
  invalid?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
}
export const Textarea = /* @__PURE__ */ forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid, status, controlSize = "md", className, ...props }, ref) {
    return (
      <textarea
        {...props}
        ref={ref}
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
}
export const Checkbox = /* @__PURE__ */ forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, indeterminate = false, className, ...props }, ref) {
    return (
      <label hidden={props.hidden} dir={props.dir} lang={props.lang} className={classes("flood-choice", className)}>
        <MixedCheckbox {...props} ref={ref} indeterminate={indeterminate} />
        <span>{label}</span>
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
export const Switch = /* @__PURE__ */ forwardRef<HTMLInputElement, ChoiceProps>(function Switch(
  { label, className, ...props },
  ref,
) {
  return (
    <label hidden={props.hidden} dir={props.dir} lang={props.lang} className={classes("flood-choice", "flood-switch", className)}>
      <span>{label}</span>
      <input
        {...props}
        ref={ref}
        type="checkbox"
        role="switch"
        className="flood-switch-input"
      />
    </label>
  );
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
  /** @since 0.2.3 */
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  message?: ReactNode;
  status?: FieldStatus;
}
/** A native group: disabled, form ownership and nested fieldsets retain browser behavior. */
export const Fieldset = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, FieldsetProps>(function Fieldset(
  { legend, legendSize = "label", hideLabel = false, hint, error, message, status, children, className, id: explicitId, "aria-describedby": describedBy, "aria-invalid": ariaInvalid, ...props }, ref,
) {
  const generatedId = useId();
  const id = explicitId ?? `flood-${generatedId}`;
  const legendRef = useFocusableHidden<HTMLLegendElement>(hideLabel);
  const hasHint = hasFieldContent(hint), hasError = hasFieldContent(error), hasMessage = hasFieldContent(message) && !hasError;
  const resolvedStatus = resolveFieldStatus(status, hasError, ariaInvalid);
  const description = mergeDescriptions(describedBy, hasHint && `${id}-hint`, hasError && `${id}-error`, hasMessage && `${id}-message`);
  return <fieldset {...props} ref={ref} id={id} className={classes("flood-fieldset", className)} data-legend-size={legendSize} data-hide-label={hideLabel || undefined} data-status={resolvedStatus}
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

export interface SegmentedControlProps extends Omit<RadioGroupProps, "legend" | "options"> {
  label: string;
  options: readonly ToggleOption[];
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
      {iconOnly ? <span className="flood-segmented__name">{option.label}</span> : option.label}
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
  return (
    <div className="flood-field" data-hide-label={hideLabel || undefined} data-status={resolvedStatus}>
      <Label ref={labelRef} htmlFor={id} required={required} className={hideLabel ? "flood-visually-hidden--focusable" : undefined}>{label}</Label>
      {children({
        id,
        "aria-describedby": description,
        "aria-invalid": hasError || resolvedStatus === "error" ? true : undefined,
        status: resolvedStatus,
        required,
      })}
      {hasHint && (
        <div id={`${id}-hint`} className="flood-hint">
          {hint}
        </div>
      )}
      {hasMessage && !hasError && <div id={`${id}-message`} className="flood-message" role={resolvedStatus === "error" ? "alert" : undefined}>{message}</div>}
      {hasError && (
        <div id={`${id}-error`} className="flood-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "text" | "solid" | "subtle" | "outline" | "ghost";
  size?: ControlSize;
}
export const Link = /* @__PURE__ */ forwardRef<HTMLAnchorElement, LinkProps>(function Link({ variant = "text", size = "md", className, ...props }, ref) {
  return (
    <a {...props} ref={ref} className={classes("flood-link", variant !== "text" && "flood-link--button", variant !== "text" && "flood-button", variant !== "text" && `flood-button--${variant}`, variant !== "text" && `flood-button--${size}`, className)} />
  );
});

/** Explicit opt-in to the dark foundations profile; no global theme mutation. */
export const FloodRoot = /* @__PURE__ */ forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function FloodRoot({ className, ...props }, ref) {
    return <div {...props} ref={ref} data-flood-foundations="neutral" data-flood-theme="dark" className={classes("flood-root", className)} />;
  },
);

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: "span" | "p" | "div";
  size?: "lead" | "body" | "compact" | "label" | "helper";
  tone?: "default" | "subtle" | "error" | "success" | "warning" | "info";
}
export const Text = /* @__PURE__ */ forwardRef<HTMLElement, TextProps>(function Text(
  { as = "span", size = "body", tone = "default", className, ...props }, ref,
) {
  return createElement(as, { ...props, ref, className: classes("flood-text", `flood-type--${size}`, `flood-tone--${tone}`, className) });
});

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: "display" | "large" | "page" | "section";
}
export const Heading = /* @__PURE__ */ forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level = 2, size = "page", className, ...props }, ref,
) {
  return createElement(`h${level}`, { ...props, ref, className: classes("flood-heading", `flood-type--${size}`, className) });
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
  minItemWidth?: string;
  gap?: Space;
}
/** Auto-fit by default; explicit columns retain their count at every width. @since 0.2.4 */
export const Grid = /* @__PURE__ */ forwardRef<HTMLDivElement, GridProps>(function Grid(
  { columns, minItemWidth, gap = "4", className, style, ...props }, ref,
) {
  return <div {...props} ref={ref} className={classes("flood-grid", className)} style={{
    gridTemplateColumns: columns ? `repeat(${columns}, minmax(0, 1fr))` : undefined,
    "--flood-grid-min": minItemWidth, "--flood-layout-gap": `var(--flood-sys-space-${gap})`, ...style,
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
export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  density?: "compact" | "comfortable";
}
/** Static empty content, not loading, an error boundary or a live announcement. @since 0.2.4 */
export const EmptyState = /* @__PURE__ */ forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { title, description, icon, actions, headingLevel = 2, density = "comfortable", className, ...props }, ref,
) {
  if (typeof title !== "string" || !title.trim()) throw new Error("Flood EmptyState requires a nonempty title");
  return <Stack {...props} ref={ref} gap="4" data-density={density} className={classes("flood-empty-state", className)}>
    {hasFieldContent(icon) && <div className="flood-empty-state__icon"><IconSlot size="2xl">{icon}</IconSlot></div>}
    <Stack gap="1"><Heading level={headingLevel} size="section">{title}</Heading>
      {hasFieldContent(description) && <Text as="div" size="compact" tone="subtle">{description}</Text>}
    </Stack>
    {hasFieldContent(actions) && <Inline gap="2" className="flood-empty-state__actions">{actions}</Inline>}
  </Stack>;
});

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  density?: "compact" | "comfortable";
  elevation?: "default" | "raised";
}
/** A structured content surface, not an interactive wrapper. @since 0.2.4 */
export const Card = /* @__PURE__ */ forwardRef<HTMLDivElement, CardProps>(function Card(
  { title, description, actions, footer, headingLevel = 2, density = "comfortable", elevation = "default", children, className, ...props }, ref,
) {
  const present = hasFieldContent;
  const heading = present(title), hint = present(description), action = present(actions);
  return <Surface {...props} ref={ref} elevation={elevation} padding={density === "compact" ? "4" : "6"}
    data-density={density} className={classes("flood-card", className)}>
    {(heading || hint || action) && <div className="flood-card__header">
      {(heading || hint) && <div className="flood-card__intro">
        {heading && <Heading level={headingLevel} size="section">{title}</Heading>}
        {hint && <Text as="div" size="compact" tone="subtle">{description}</Text>}
      </div>}
      {action && <div className="flood-card__actions">{actions}</div>}
    </div>}
    {present(children) && <div className="flood-card__body">{children}</div>}
    {present(footer) && <div className="flood-card__footer">{footer}</div>}
  </Surface>;
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
export interface IconButtonProps extends Omit<ButtonProps, "aria-label"> {
  label: string;
}
export const IconButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", variant = "subtle", className, children, ...props }, ref,
) {
  return <Button {...props} ref={ref} size={size} variant={variant} aria-label={label} className={classes("flood-icon-button", className)}><IconSlot size={size}>{children}</IconSlot></Button>;
});

export const Divider = /* @__PURE__ */ forwardRef<HTMLHRElement, HTMLAttributes<HTMLHRElement>>(
  function Divider({ className, ...props }, ref) {
    return <hr {...props} ref={ref} className={classes("flood-divider", className)} />;
  },
);

export interface CodeSnippetProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  code: string;
  codeDirection?: "ltr" | "rtl" | "auto";
  action?: ReactNode;
}
/** Selectable code with an optional host-owned action; no clipboard side effects. */
export const CodeSnippet = /* @__PURE__ */ forwardRef<HTMLDivElement, CodeSnippetProps>(function CodeSnippet(
  { code, codeDirection = "ltr", action, className, ...props }, ref,
) {
  return (
    <div {...props} ref={ref} className={classes("flood-code-snippet", className)}>
      <code dir={codeDirection} className="flood-code-snippet__code">{code}</code>
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
}
export interface AvatarGroupProps extends Omit<HTMLAttributes<HTMLUListElement>, "children"> {
  items: readonly AvatarGroupItem[];
  label: string;
  max?: number;
  size?: ContentSize;
  overflowLabel?: string;
}
export const AvatarGroup = /* @__PURE__ */ forwardRef<HTMLUListElement, AvatarGroupProps>(function AvatarGroup(
  {max = 4, size = "md", ...props}, ref,
) { return <GroupedAvatars {...props} ref={ref} max={max} size={size}/>; });

export interface StatusIndicatorProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  label: string;
  tone?: SemanticTone;
  size?: ContentSize;
  announce?: boolean;
}
export const StatusIndicator = /* @__PURE__ */ forwardRef<HTMLSpanElement, StatusIndicatorProps>(function StatusIndicator(
  {tone = "neutral", size = "md", announce = false, ...props}, ref,
) { return <NamedStatus {...props} ref={ref} tone={tone} size={size} announce={announce}/>; });

export interface FigureProps extends HTMLAttributes<HTMLElement> {
  caption?: ReactNode;
  captionPosition?: "before" | "after";
}
export const Figure = /* @__PURE__ */ forwardRef<HTMLElement, FigureProps>(function Figure(
  {captionPosition = "after", ...props}, ref,
) { return <CaptionedFigure {...props} ref={ref} captionPosition={captionPosition}/>; });

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

export interface MetricTrend {
  label: string;
  direction: "up" | "down" | "flat";
  tone?: SemanticTone;
}
export interface MetricProps extends Omit<HTMLAttributes<HTMLDListElement>, "children"> {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: MetricTrend;
  size?: ContentSize;
}
export const Metric = /* @__PURE__ */ forwardRef<HTMLDListElement, MetricProps>(function Metric(
  {size = "md", ...props}, ref,
) { return <MeasuredValue {...props} ref={ref} size={size}/>; });

export interface TimelineItem {
  id: string;
  title: string;
  description?: ReactNode;
  state?: "complete" | "current" | "upcoming";
  dateTime?: string;
  timeLabel?: string;
  icon?: ReactNode;
}
export interface TimelineProps extends Omit<HTMLAttributes<HTMLOListElement>, "children"> {
  label: string;
  items: readonly TimelineItem[];
  stateLabels?: {complete?: string; current?: string; upcoming?: string};
}
export const Timeline = /* @__PURE__ */ forwardRef<HTMLOListElement, TimelineProps>(function Timeline(props, ref) {
  return <EventTimeline {...props} ref={ref}/>;
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

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  headingSize?: "display" | "large" | "page" | "section";
}
export const Section = /* @__PURE__ */ forwardRef<HTMLElement, SectionProps>(function Section(
  {headingLevel = 2, headingSize = "section", ...props}, ref,
) { return <ContentSection {...props} ref={ref} headingLevel={headingLevel} headingSize={headingSize} />; });

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

export interface DropzoneProps extends Omit<FileInputProps, "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop"> {
  label: string;
  description?: string;
}
export const Dropzone = /* @__PURE__ */ forwardRef<HTMLInputElement, DropzoneProps>(function Dropzone(
  {description = "Drop files here or choose from your device.", multiple = true, ...props}, ref,
) { return <FileDropzone {...props} ref={ref} description={description} multiple={multiple} />; });

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
