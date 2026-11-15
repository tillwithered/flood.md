"use client";

import {
  forwardRef,
  createElement,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
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
import { EventTimestamp } from "./timestamp.js";
import { PredicateRow } from "./filter-condition.js";
import { PredicateGroup } from "./filter-group.js";
import { CollectionQueryBar } from "./collection-toolbar.js";
import { CollectionViewSelector } from "./collection-view-switcher.js";
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
import { TabNavigation, BreadcrumbNavigation, PageNavigation, CursorPageNavigation } from "./navigation.js";
import { AvatarArtwork } from "./avatar.js";
import { ValueIndicator, FeedbackMessage, StatusGlyph } from "./feedback.js";
import { DescribedData, TabularData } from "./data-display.js";
import { ActionMenu } from "./menu.js";
import { RovingToolbar } from "./toolbar.js";
import { ComposerForm } from "./message-composer.js";
import { NumericStepper } from "./numeric-input.js";
import { RangeControl } from "./slider.js";
import {GroupedAvatars, NamedStatus, CaptionedFigure, AttributedQuote, InlineCodeText, MeasuredValue, EventTimeline, ExpandableParagraph, OverflowingText} from "./content-elements.js";
import { NavigationMenu, StepSequence, ContentSection, PageHeading, SplitLayout, CenterLayout, SkipNavigation } from "./navigation-layout.js";
import { ApplicationShell, ApplicationTopBar } from "./app-shell.js";
import { CollectionListBox, SegmentedPinInput, RatingStar, StarRating, FileDropzone, OwnedFileDropTarget, SupportingCharacterCount } from "./form-controls.js";
import { ClipboardAction, NotificationRegion } from "./feedback-actions.js";
import { ConfirmationDialog } from "./alert-dialog.js";
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
import { FileRecord, FileGalleryCard, FileThumbnailSurface, FileNameText, UploadRecord, ModalImagePreview, ModalImageGallery, FileMetadata } from "./file-records.js";
import { ManagedDataTable } from "./data-table.js";
import { SkeletonTable } from "./table-skeleton.js";
import { TrendPlot } from "./sparkline.js";
import { SeriesPlot, GroupedBars, RankedBars, ShareRing, ShareBar, HeatmapGrid } from "./charts.js";
import { ScatterPlot } from "./scatter-chart.js";
import { RangePlot } from "./range-chart.js";
import { DumbbellPlot } from "./dumbbell-chart.js";
import { DistributionBoxes } from "./box-plot.js";
import { BulletPlot } from "./bullet-chart.js";
import { HistogramPlot } from "./histogram.js";
import { WaterfallPlot } from "./waterfall-chart.js";
import { CheckableCard, ExclusiveCard } from "./collection-cards.js";
import { ColorPreview, ColorEditor, PaletteChoices } from "./color-controls.js";
import { HoverPreview } from "./hover-card.js";
import { HierarchicalSelect } from "./tree-select.js";
import { CivilDateTimePicker } from "./date-time-picker.js";
import { HierarchicalNavigation } from "./navigation-tree.js";
import { AdaptiveActions } from "./overflow-actions.js";
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
  label: string;
  properties: readonly FilterConditionProperty[];
  value: FilterConditionValue;
  onValueChange: (value: FilterConditionValue) => void;
  onRemove?: () => void;
  controlSize?: "sm" | "md" | "lg" | "xl";
  labels?: Partial<Record<"property" | "operator" | "values" | "include" | "exclude" | "placeholder" | "remove", string>>;
}
/** One finite-choice filter predicate; the host owns application and query semantics. @since 0.2.11 */
export const FilterCondition = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, FilterConditionProps>(function FilterCondition(props, ref) { return <PredicateRow {...props} ref={ref}/>; });

export interface FilterGroupCondition extends FilterConditionValue { id: string; }
export interface FilterGroupValue {
  match: "all" | "any";
  conditions: FilterGroupCondition[];
}
export interface FilterGroupProps extends Omit<FieldsetProps, "children" | "legend" | "onChange"> {
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
/** A flat controlled group of finite-choice predicates, without query execution or Apply/Cancel ownership. @since 0.2.11 */
export const FilterGroup = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, FilterGroupProps>(function FilterGroup(props, ref) { return <PredicateGroup {...props} ref={ref}/>; });

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

export interface BulkActionBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onAction"> {
  label: string;
  selectionCount: number;
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

export interface FileMetaProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  format?: string;
  size?: number;
  variant?: "chip" | "plain";
  formatSize?: (bytes: number) => string;
}
/** A quiet combined format/size chip; display metadata only. @since 0.2.8 */
export const FileMeta = /* @__PURE__ */ forwardRef<HTMLSpanElement,FileMetaProps>(function FileMeta(props,ref){return <FileMetadata {...props} ref={ref}/>;});

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
  Pick<FileItemProps, "name" | "nameOverflow" | "size" | "mimeType" | "format" | "description" | "href" | "download" | "downloadHref" | "onPreview" | "onRemove" | "disabled" | "labels" | "formatSize"> {
  thumbnailSrc?: string;
  thumbnailFit?: ImageProps["fit"];
  thumbnailRatio?: number;
  thumbnailPlacement?: "top" | "body";
  /** Place the onPreview command on the artwork instead of in the footer. */
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
      {onUnreadChange && <IconButton type="button" size="xs" variant="ghost" label={readLabel} title={readLabel} onClick={() => onUnreadChange(!unread)}>
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
  loadingPlaceholder?: Pick<ListSkeletonProps, "rows" | "media" | "description" | "metadata">;
  onRetry?: () => void;
  retrying?: boolean;
  density?: NotificationListProps["density"];
  /** Condensed rows for an inbox inside a floating surface. */
  appearance?: "default" | "overlay";
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

export interface KeyboardShortcutProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  keys: KeyboardShortcutKeys;
  /** Localized spoken form, useful when keycaps contain platform glyphs. */
  label?: string;
  size?: ContentSize;
  presentation?: "keys" | "compact";
}

/** A display-only shortcut with a consistent visual and spoken key order. */
export const KeyboardShortcut = /* @__PURE__ */ forwardRef<HTMLSpanElement, KeyboardShortcutProps>(function KeyboardShortcut(
  {keys, label, size = "sm", presentation = "keys", className, ...props}, ref,
) {
  const parts = typeof keys === "string" ? [keys] : keys;
  if (!parts.length) return null;
  return <span {...props} ref={ref} dir="ltr" className={classes("flood-keyboard-shortcut", className)}>
    <VisuallyHidden>{label ?? parts.join(" + ")}</VisuallyHidden>
    {presentation === "compact"
      ? <Kbd size={size} aria-hidden="true">{parts.join(" ")}</Kbd>
      : parts.map((key, index) => <Kbd key={index} size={size} aria-hidden="true">{key}</Kbd>)}
  </span>;
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
  /** Keep a recognizable plain-text value on one line with full text on focus. */
  valueOverflow?: "wrap" | "truncate";
  /** A compact utility action for this value, such as copying an identifier. */
  action?: ReactNode;
}
export interface DescriptionListProps extends Omit<HTMLAttributes<HTMLDListElement>, "children"> {
  items: readonly DescriptionItem[];
  /** Inline adapts, columns retain shared tracks, and grid tiles short facts. */
  layout?: "inline" | "columns" | "stacked" | "grid";
  density?: DataDensity;
  dividers?: boolean;
}
/** @since 0.2.4 */
export const DescriptionList = /* @__PURE__ */ forwardRef<HTMLDListElement, DescriptionListProps>(function DescriptionList(
  { items, layout = "inline", density = "compact", dividers = false, ...props }, ref,
) {
  return <DescribedData {...props} ref={ref} items={items} layout={layout} density={density} dividers={dividers} />;
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

export interface ChangeListItem extends Pick<ValueChangeProps, "before" | "after"> {
  id: string;
  label: string;
}

export interface ChangeListProps extends Omit<DescriptionListProps, "items"> {
  items: readonly ChangeListItem[];
  valueLayout?: ValueChangeProps["layout"];
  labels?: ValueChangeProps["labels"];
}

/** Named changes presented on shared definition-list tracks. */
export const ChangeList = /* @__PURE__ */ forwardRef<HTMLDListElement, ChangeListProps>(function ChangeList(
  {items, valueLayout, labels, ...props}, ref,
) {
  return <DescriptionList {...props} ref={ref} items={items.filter(item => hasFieldContent(item.before) || hasFieldContent(item.after)).map(item => ({
    id: item.id, term: item.label,
    description: <ValueChange before={item.before} after={item.after} layout={valueLayout} labels={labels} />,
  }))} />;
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

export interface ComparisonTableColumn {
  id: string;
  label: string;
}

export interface ComparisonTableRow {
  id: string;
  label: string;
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
}

/** A table of shared criteria with a pinned criterion column. */
export const ComparisonTable = /* @__PURE__ */ forwardRef<HTMLTableElement, ComparisonTableProps>(function ComparisonTable(
  {criterionLabel, columns, rows, featuredColumnId, unavailableLabel = "Unavailable", className, ...props}, ref,
) {
  if ([columns, rows].some(items => items.some(({id}) => !id.trim()) || new Set(items.map(({id}) => id)).size !== items.length)) {
    throw new Error("Flood ComparisonTable requires unique nonempty option and criterion IDs");
  }
  return <Table {...props} ref={ref} className={classes("flood-comparison-table", className)}>
    <thead>
      <tr>
        <th scope="col">{criterionLabel}</th>
        {columns.map(column => <th scope="col" key={column.id}
          data-featured={column.id === featuredColumnId || undefined}>{column.label}</th>)}
      </tr>
    </thead>
    <tbody>
      {rows.map(row => <tr key={row.id}>
        <th scope="row">{row.label}</th>
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

export interface CommentProps extends HTMLAttributes<HTMLElement> {
  author: Pick<AuthorMetaProps, "name" | "src" | "fallback" | "metadata" | "presence">;
  size?: AuthorMetaProps["size"];
  /** Host-owned commands such as Reply or Copy link. */
  actions?: ReactNode;
  /** Opens the reply editor for this comment. The host owns its placement and focus. */
  onReply?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  replyLabel?: string;
  attachments?: ReactNode;
  reactions?: ReactNode;
  /** A persistent add-reaction affordance when this message already has reactions. */
  reactionPicker?: ReactNode;
  /** Reveal secondary actions on pointer hover or keyboard focus, while keeping their layout space. */
  actionVisibility?: "on-interaction" | "always";
}

/** An attributed message with its own optional actions. */
export const Comment = /* @__PURE__ */ forwardRef<HTMLElement, CommentProps>(function Comment(
  {author, size = "md", actions, onReply, replyLabel = "Reply", attachments, reactions, reactionPicker, actionVisibility = "on-interaction", children, className, ...props}, ref,
) {
  const hasReactions = Array.isArray(reactions) ? reactions.some(hasFieldContent) : hasFieldContent(reactions);
  const hasActions = Boolean(onReply) || hasFieldContent(actions);
  return <article {...props} ref={ref} className={classes("flood-comment", className)} data-action-visibility={actionVisibility}>
    <AuthorMeta {...author} size={size} metadataPlacement="inline" />
    <div className="flood-comment__body">
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

export interface CommentThreadItem extends Pick<CommentProps, "author" | "actions" | "onReply" | "replyLabel" | "attachments" | "reactions" | "reactionPicker"> {
  id: string;
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
}

/** Related authored messages in the order supplied by the host. */
export const CommentThread = /* @__PURE__ */ forwardRef<HTMLOListElement, CommentThreadProps>(function CommentThread(
  {items, size = "sm", actionVisibility, dividers = false, className, ...props}, ref,
) {
  return <ol {...props} ref={ref} className={classes("flood-comment-thread", className)} data-dividers={dividers} data-size={size} role="list">
    {renderCommentThreadItems(items, size, actionVisibility, 0)}
  </ol>;
});

function renderCommentThreadItems(
  items: readonly CommentThreadItem[],
  size: NonNullable<CommentThreadProps["size"]>,
  actionVisibility: CommentThreadProps["actionVisibility"],
  depth: number,
): ReactNode {
  return items.map(item => {
    const replies = item.replies?.length ? <ol className="flood-comment-thread__replies" role="list" data-indent={depth < 2}>
      {renderCommentThreadItems(item.replies, size, actionVisibility, depth + 1)}
    </ol> : null;
    return <li key={item.id}>
      <Comment author={item.author} size={size} actions={item.actions} onReply={item.onReply} replyLabel={item.replyLabel} attachments={item.attachments} reactions={item.reactions}
        reactionPicker={item.reactionPicker} actionVisibility={actionVisibility}>{item.body}</Comment>
      {replies && (item.repliesDisclosure ? <Collapsible title={item.repliesDisclosure.label}
        defaultOpen={item.repliesDisclosure.defaultOpen} controlSize="sm" variant="flush" className="flood-comment-thread__disclosure">
        {replies}
      </Collapsible> : replies)}
    </li>;
  });
}

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

export interface CollapsibleProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "onChange"> {
  title: string;
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
  {label, icon, count, pressed, variant = "subtle", className, "aria-describedby":describedBy, ...props}, ref,
) {
  const countId = useId();
  if (!label.trim() || !Number.isSafeInteger(count) || count < 0) throw new Error("Flood ReactionButton requires a label and a nonnegative count");
  return <Toggle {...props} ref={ref} size="xs" variant={variant} pressed={pressed}
    className={classes("flood-reaction-button", className)} aria-label={label} aria-describedby={mergeDescriptions(describedBy, countId)}>
    <IconSlot size="2xs">{icon}</IconSlot>
    <span id={countId} className="flood-reaction-button__count">{count}</span>
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
  return <ButtonGroup {...props} ref={ref}>
    <Button {...primaryButtonProps} size={size} variant={variant} disabled={disabled || primaryButtonProps?.disabled}>
      {children}
    </Button>
    <Menu label={menuLabel} items={items} onAction={onAction} disabled={disabled || items.length === 0} align="end"
      trigger={triggerProps => <IconButton {...triggerProps} label={menuLabel} size={size} variant={variant}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </IconButton>}
    />
  </ButtonGroup>;
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
}

/** A named group of independently actionable or switchable settings. */
export const SettingGroup = /* @__PURE__ */ forwardRef<HTMLElement, SettingGroupProps>(function SettingGroup(
  {density = "comfortable", dividers = false, headingSize = "group", className, ...props}, ref,
) {
  return <Section {...props} ref={ref} headingSize={headingSize} className={classes("flood-setting-group", className)}
    data-density={density} data-dividers={dividers} />;
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

export interface TimestampProps extends Omit<TimeHTMLAttributes<HTMLTimeElement>, "dateTime" | "children"> {
  dateTime: string;
  /** Use provided text while keeping the machine-readable dateTime. */
  children?: string;
  format?: "date" | "time" | "date-time";
  /** Format elapsed time against this explicitly zoned ISO instant. */
  relativeTo?: string;
  /** Display time zone for absolute instants. Civil dates are never shifted. */
  timeZone?: string;
  size?: "helper" | "compact";
}

/** A semantic timestamp with localized formatting for civil dates or zoned instants. */
export const Timestamp = /* @__PURE__ */ forwardRef<HTMLTimeElement, TimestampProps>(function Timestamp(props, ref) {
  return <EventTimestamp {...props} ref={ref} />;
});

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
/** A plain-text excerpt that can reveal its full passage in place. */
export const ExpandableText = /* @__PURE__ */ forwardRef<HTMLDivElement, ExpandableTextProps>(function ExpandableText(props, ref) {
  return <ExpandableParagraph {...props} ref={ref} />;
});

export interface TruncatedTextProps extends Pick<HTMLAttributes<HTMLSpanElement>, "id" | "className" | "style" | "dir" | "lang" | "hidden"> {
  children: string;
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
export interface ImageComparisonSource extends Pick<ImageProps, "src" | "alt" | "srcSet" | "sizes"> {
  src: string;
  /** Visible label for this version, such as Original or Revised. */
  label: string;
}
export interface ImageComparisonProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "defaultValue"> {
  before: ImageComparisonSource;
  after: ImageComparisonSource;
  /** Accessible label of the slider. Its value is the visible percentage of the before image. */
  label: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  ratio?: number;
  fit?: ImageProps["fit"];
  disabled?: boolean;
}
/** Compare two images in the same fixed frame by revealing one over the other. */
export const ImageComparison = /* @__PURE__ */ forwardRef<HTMLDivElement, ImageComparisonProps>(function ImageComparison(
  {before, after, label, value, defaultValue = 50, onValueChange, ratio, fit = "contain", disabled, className, ...props}, ref,
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
  return <div {...props} ref={ref} className={classes("flood-image-comparison", className)}>
    <AspectRatio ratio={ratio} className="flood-image-comparison__frame"
      style={{"--flood-comparison-position":`${percent}%`} as CSSProperties}>
      <Image {...beforeImage} fit={fit} draggable={false}/>
      <Image {...afterImage} fit={fit} draggable={false} className="flood-image-comparison__after"/>
      <span className="flood-image-comparison__divider" aria-hidden="true"/>
      <span className="flood-image-comparison__grip" aria-hidden="true">
        <IconSlot><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m9 7-5 5 5 5m6-10 5 5-5 5"/></svg></IconSlot>
      </span>
      <Slider label={label} hideLabel showValue={false} disabled={disabled} value={[percent]} className="flood-image-comparison__control"
        onValueChange={([next]) => {
          if (value === undefined) setLocalValue(next);
          onValueChange?.(next);
        }}/>
    </AspectRatio>
    <Inline align="baseline" gap="3" className="flood-image-comparison__labels">
      <Text size="helper" tone="subtle">{beforeLabel}</Text>
      <Text size="helper" tone="subtle">{afterLabel}</Text>
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
/** A structured content surface, not an interactive wrapper. @since 0.2.4 */
export const Card = /* @__PURE__ */ forwardRef<HTMLDivElement, CardProps>(function Card(
  { media, title, description, actions, footer, footerDivider = true, selection, headingLevel = 2, headingSize = "section", density = "comfortable",
    elevation = "default", children, className, style, ...props }, ref,
) {
  const present = hasFieldContent;
  const heading = present(title), hint = present(description), action = present(actions);
  return <Surface {...props} ref={ref} elevation={elevation} padding={density === "compact" ? "4" : "6"}
    style={selection?.checked ? {
      background: `linear-gradient(var(--flood-sys-color-selection-background), var(--flood-sys-color-selection-background)), var(--flood-sys-color-surface-${elevation})`,
      ...style,
    } : style}
    {...(selection && {"data-selectable":true,"data-selected":selection.checked || undefined})}
    data-density={density} className={classes("flood-card", className)}>
    {present(media) && <div className="flood-card__media">{media}</div>}
    {(heading || hint || action || selection) && <div className="flood-card__header">
      {(heading || hint || action) && <div className="flood-card__header-main">
        {(heading || hint) && <div className="flood-card__intro">
          {heading && <Heading level={headingLevel} size={headingSize}>{title}</Heading>}
          {hint && <Text as="div" size="compact" tone="subtle">{description}</Text>}
        </div>}
        {action && <div className="flood-card__actions">{actions}</div>}
      </div>}
      {selection && <RecordCheckbox className="flood-card__selection" selection={selection} />}
    </div>}
    {present(children) && <div className="flood-card__body">{children}</div>}
    {present(footer) && <div className="flood-card__footer" data-divider={footerDivider || undefined}>{footer}</div>}
  </Surface>;
});

export interface CardSkeletonProps extends Omit<CardProps, "title" | "description" | "actions" | "footer" | "selection" | "children" | "aria-hidden" | "media"> {
  /** Match the width-to-height ratio used by the loaded media slot. */
  mediaRatio?: number;
  description?: boolean;
  headerAction?: boolean;
  bodyLines?: number;
  footerAction?: boolean;
  animate?: boolean;
}

/** Decorative loading geometry for a Card. The surrounding region owns announcements. */
export const CardSkeleton = /* @__PURE__ */ forwardRef<HTMLDivElement, CardSkeletonProps>(function CardSkeleton(
  {mediaRatio, description = false, headerAction = false, bodyLines = 2, footerAction = false, animate = true, className, ...props}, ref,
) {
  if (!Number.isSafeInteger(bodyLines) || bodyLines < 0) throw new Error("Flood CardSkeleton requires a nonnegative bodyLines count");
  const line = (width: string, key?: number) => <span key={key} className="flood-card-skeleton__line">
    <Skeleton width={width} height=".65em" animate={animate} />
  </span>;
  return <Card {...props} ref={ref} className={className} aria-hidden="true"
    media={mediaRatio === undefined ? undefined : <AspectRatio ratio={mediaRatio}><Skeleton shape="rounded" height="100%" animate={animate}/></AspectRatio>}
    title={line("9em")}
    description={description ? line("12em") : undefined}
    actions={headerAction ? <Skeleton width="3.25rem" className="flood-card-skeleton__header-action" animate={animate} /> : undefined}
    footer={footerAction ? <Skeleton width="7rem" className="flood-card-skeleton__footer-action" animate={animate} /> : undefined}>
    {bodyLines > 0 && <Text as="div" size="compact">{Array.from({length: bodyLines}, (_, index) =>
      line(index === bodyLines - 1 ? "66%" : "94%", index))}</Text>}
  </Card>;
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
  /** Glyph size only; size continues to own the interactive target and insets. */
  iconSize?: ControlSize;
}
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

export interface CopyableValueProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  value: string;
  appearance?: "text" | "code";
  /** Wrap when the entire value must stay visible. Truncate in a dense row with room for a recognizable prefix. */
  overflow?: "wrap" | "truncate";
  copyLabel?: string;
  copiedLabel?: string;
  errorLabel?: string;
}

function PresentedValue({value, appearance, overflow}: Pick<CopyableValueProps, "value"|"appearance"|"overflow">) {
  if (overflow === "truncate") {
    return <OverflowingText appearance={appearance} dir="auto" className="flood-copyable-value__text">{value}</OverflowingText>;
  }
  return appearance === "code"
    ? <InlineCode size="sm" className="flood-copyable-value__text"><bdi>{value}</bdi></InlineCode>
    : <Text size="compact" className="flood-copyable-value__text"><bdi>{value}</bdi></Text>;
}

/** A readable value with a named, compact clipboard action. */
export const CopyableValue = /* @__PURE__ */ forwardRef<HTMLSpanElement, CopyableValueProps>(function CopyableValue(
  {value, appearance = "text", overflow = "wrap", copyLabel = "Copy value", copiedLabel, errorLabel, className, ...props}, ref,
) {
  return <span {...props} ref={ref} className={classes("flood-copyable-value", className)}>
    <PresentedValue value={value} appearance={appearance} overflow={overflow}/>
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
  {value, appearance="code", overflow="truncate", visible, defaultVisible=false, onVisibleChange,
    copyable=false, showLabel="Show value", hideLabel="Hide value", hiddenValueLabel="Value hidden",
    copyLabel="Copy value", copiedLabel, errorLabel, className, ...props}, ref,
){
  const valueId = useId();
  const [localVisible,setLocalVisible] = useState(defaultVisible);
  const shown = visible ?? localVisible;
  const actionLabel = shown ? hideLabel : showLabel;
  return <span {...props} ref={ref} className={classes("flood-copyable-value","flood-reveal-value",className)}>
    <span id={valueId} className="flood-reveal-value__display">
      {shown ? <PresentedValue value={value} appearance={appearance} overflow={overflow}/> : <>
        <span aria-hidden="true"><PresentedValue value="••••••••" appearance={appearance}/></span>
        <VisuallyHidden>{hiddenValueLabel}</VisuallyHidden>
      </>}
    </span>
    <IconButton size="xs" variant="ghost" label={actionLabel} title={actionLabel}
      aria-expanded={shown} aria-controls={valueId} onClick={()=>{
        if (visible === undefined) setLocalVisible(!shown);
        onVisibleChange?.(!shown);
      }}><VisibilityGlyph visible={shown}/></IconButton>
    {copyable && <CopyButton key={String(shown)} iconOnly size="xs" variant="ghost" value={shown ? value : ""} disabled={!shown}
      copyLabel={copyLabel} copiedLabel={copiedLabel} errorLabel={errorLabel}/>}
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
  layout?: "inline" | "stacked";
}

/** A metric and its optional history on one shared surface. */
export const MetricCard = /* @__PURE__ */ forwardRef<HTMLDivElement, MetricCardProps>(function MetricCard(
  {metric, chart, chartLoading, layout = "inline", padding = "4", className, ...props}, ref,
) {
  const value = <Metric {...metric} />;
  const loadingPlot = chartLoading ?? metric.state === "loading";
  const plot = (hasFieldContent(chart) || chartLoading === true) && (
    <div className="flood-metric-card__chart" aria-busy={loadingPlot || undefined}>
      {loadingPlot ? <Skeleton shape="rounded" className="flood-metric-card__chart-placeholder"/> : chart}
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
    {populated.length ? populated.map(group =>
      <Stack key={group.id} gap={density === "compact" ? "2" : "3"}>
        <Heading level={headingLevel} size="group" className="flood-activity-timeline__heading">
          {group.dateTime ? <Timestamp dateTime={group.dateTime}>{group.label}</Timestamp> : group.label}
        </Heading>
        <Timeline label={group.label} items={group.items} mode="activity" layout="feed" density={density} />
      </Stack>,
    ) : emptyContent}
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

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  title: string;
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

export interface RatingSummaryProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  label: string;
  /** Counts from one star to the highest score. Use zero for any empty bucket. */
  counts: readonly number[];
  labels?: RatingSummaryLabels;
  layout?: "auto" | "stacked";
}

/** The aggregate score and distribution calculated from the same rating counts. */
export const RatingSummary = /* @__PURE__ */ forwardRef<HTMLDivElement, RatingSummaryProps>(function RatingSummary(
  {label, counts, labels, layout = "auto", lang, className, ...props}, ref,
) {
  const buckets = Array.from(counts);
  const max = buckets.length;
  const total = buckets.reduce((sum, count) => sum + count, 0);
  if (!label.trim() || max < 1 || max > 10 || !Number.isSafeInteger(total) ||
      buckets.some(count => !Number.isSafeInteger(count) || count < 0)) {
    throw new Error("Flood RatingSummary requires a label and one to ten nonnegative safe integer counts with a safe total");
  }
  const locale = lang ?? "en";
  const formatNumber = new Intl.NumberFormat(locale);
  const countLabel = (count: number, formatted: string) => labels?.count?.(count, formatted) ??
    `${formatted} ${count === 1 ? "rating" : "ratings"}`;
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
          <Text size="helper" tone="subtle" className="flood-rating-summary__count">{countLabel(total, formatNumber.format(total))}</Text>
        </Stack>
        <List marker={false} gap="1" className="flood-rating-summary__distribution">
          {[...buckets].reverse().map((count, index) => {
            const stars = max - index;
            const starText = formatNumber.format(stars);
            const countText = formatNumber.format(count);
            const bucketLabel = labels?.bucket?.(stars, starText) ?? `${starText} ${stars === 1 ? "star" : "stars"}`;
            return <li key={stars} className="flood-rating-summary__bucket">
              <Text size="helper" tone="subtle" aria-hidden="true"><bdi>{starText}</bdi></Text>
              <Meter label={bucketLabel} value={count} max={total} valueText={countLabel(count, countText)} size="sm" hideLabel/>
              <Text size="helper" tone="subtle" aria-hidden="true" className="flood-rating-summary__bucket-count"><bdi>{countText}</bdi></Text>
            </li>;
          })}
        </List>
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
