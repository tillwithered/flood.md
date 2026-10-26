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

const classes = (...values: (string | undefined | false)[]) =>
  values.filter(Boolean).join(" ");

export type ControlSize = "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "subtle" | "outline" | "ghost";
  size?: ControlSize;
  loading?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "solid",
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
export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(
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
export const Kbd = forwardRef<HTMLElement, KbdProps>(function Kbd(
  { size = "sm", className, ...props }, ref,
) {
  return <kbd {...props} ref={ref} className={classes("flood-kbd", className)} data-size={size} />;
});

export interface ToolbarProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  label: string;
  orientation?: "horizontal" | "vertical";
  loop?: boolean;
}
/** @since 0.2.4 */
export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
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
export const DescriptionList = forwardRef<HTMLDListElement, DescriptionListProps>(function DescriptionList(
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
}
/** @since 0.2.4 */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { caption, children, hideCaption = false, density = "comfortable", striped = false, scrollLabel, ...props }, ref,
) {
  return <TabularData {...props} ref={ref} caption={caption} hideCaption={hideCaption} density={density} striped={striped} scrollLabel={scrollLabel}>{children}</TabularData>;
});

export type SemanticTone = "neutral" | "accent" | "error" | "warning" | "success" | "info";
export type BadgeTone = SemanticTone;
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  size?: ContentSize;
  tone?: BadgeTone;
  variant?: "subtle" | "outline";
}
/** @since 0.2.4 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
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
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
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
export const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(
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
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
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
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { label, value, max = 100, valueText, size = "md", tone = "accent", hideLabel = false, ...props }, ref,
) {
  return <ValueIndicator {...props} ref={ref} kind="progress" label={label} value={value} min={0} max={max} valueText={valueText} size={size} tone={tone} hideLabel={hideLabel} />;
});

export interface MeterProps extends Omit<ProgressProps, "value"> {
  value: number;
  min?: number;
}
/** @since 0.2.4 */
export const Meter = forwardRef<HTMLDivElement, MeterProps>(function Meter(
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
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
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
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {activationMode="automatic",orientation="horizontal",controlSize="md",disabled=false,iconOnly=false,...props},ref,
){return <TabNavigation {...props} ref={ref} activationMode={activationMode} orientation={orientation} controlSize={controlSize} disabled={disabled} iconOnly={iconOnly} />;});
export interface BreadcrumbItem {label:string;href?:string;}
export interface BreadcrumbProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  items: readonly BreadcrumbItem[];
  label?: string;
  separator?: string;
}
export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
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
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
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
export type MenuItem = MenuActionItem | MenuSeparator;
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
export const Menu = forwardRef<HTMLDivElement, MenuProps>(function Menu(
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
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  {side = "top", align = "center", delay = 300, disabled = false, ...props}, ref,
) { return <AnchoredOverlay {...props} ref={ref} kind="tooltip" side={side} align={align} delay={delay} disabled={disabled} />; });
export interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title" | "role"> {
  title: string;
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
}
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(function Popover(
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
export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(function Dialog(
  {defaultOpen = false, disabled = false, closeLabel = "Close", closeOnOutsideClick = true, ...props}, ref,
) { return <ModalOverlay {...props} ref={ref} defaultOpen={defaultOpen} disabled={disabled} closeLabel={closeLabel} closeOnOutsideClick={closeOnOutsideClick} />; });

export interface DrawerProps extends DialogProps {
  side?: "start" | "end" | "top" | "bottom";
  size?: "sm" | "md" | "lg";
  footer?: ReactNode;
}
export const Drawer = forwardRef<HTMLDialogElement, DrawerProps>(function Drawer(
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
export const AlertDialog = forwardRef<HTMLDialogElement, AlertDialogProps>(function AlertDialog(
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
export const Collapsible = forwardRef<HTMLDivElement, CollapsibleProps>(function Collapsible(
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
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
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
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
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
export const ToggleGroup = forwardRef<HTMLDivElement, ToggleGroupProps>(function ToggleGroup(
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
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { label, orientation = "horizontal", className, ...props }, ref,
) {
  return <ScrollArea orientation="horizontal" tabIndex={-1} role="group" aria-label={`${label} scrolling`} className="flood-connected-scroll" hidden={props.hidden} dir={props.dir} lang={props.lang} style={{maxInlineSize:"100%"}}><div {...props} ref={ref} role="group" aria-label={label} data-orientation={orientation} className={classes("flood-button-group", className)} /></ScrollArea>;
});

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  status?: FieldStatus;
  invalid?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
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
export const InputGroup = forwardRef<HTMLInputElement, InputGroupProps>(function InputGroup(
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
export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(function FileInput(
  { clearable = true, clearLabel = "Clear files", controlSize = "md", ...props }, ref,
) {
  return <FilePicker {...props} ref={ref} clearable={clearable} clearLabel={clearLabel} controlSize={controlSize} actionComponent={IconButton} iconComponent={IconSlot} />;
});

export interface SearchInputProps extends Omit<InputProps, "type" | "children"> {
  clearable?: boolean;
  clearLabel?: string;
}
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
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
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
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
}
/** @since 0.2.5 */
export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
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
export const MultiSelect = forwardRef<HTMLInputElement, MultiSelectProps>(function MultiSelect(
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
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
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
export const Slider = forwardRef<HTMLFieldSetElement, SliderProps>(function Slider(
  { defaultValue = [50], min = 0, max = 100, step = 1, showValue = true, readOnly = false, controlSize = "md", ...props }, ref,
) {
  return <RangeControl {...props} ref={ref} defaultValue={defaultValue} min={min} max={max} step={step} showValue={showValue} readOnly={readOnly} controlSize={controlSize} fieldsetComponent={Fieldset} />;
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  status?: FieldStatus;
  invalid?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
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
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, indeterminate = false, className, ...props }, ref) {
    return (
      <label hidden={props.hidden} dir={props.dir} lang={props.lang} className={classes("flood-choice", className)}>
        <MixedCheckbox {...props} ref={ref} indeterminate={indeterminate} />
        <span>{label}</span>
      </label>
    );
  },
);
export const Radio = forwardRef<HTMLInputElement, ChoiceProps>(function Radio(
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
export const Switch = forwardRef<HTMLInputElement, ChoiceProps>(function Switch(
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
export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { required, children, className, ...props }, ref,
) {
  return <label {...props} ref={ref} className={classes("flood-label", className)}>{children}{required && <span aria-hidden="true"> *</span>}</label>;
});

export interface FieldsetProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  legend: ReactNode;
  /** @since 0.2.3 */
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  message?: ReactNode;
  status?: FieldStatus;
}
/** A native group: disabled, form ownership and nested fieldsets retain browser behavior. */
export const Fieldset = forwardRef<HTMLFieldSetElement, FieldsetProps>(function Fieldset(
  { legend, hideLabel = false, hint, error, message, status, children, className, id: explicitId, "aria-describedby": describedBy, "aria-invalid": ariaInvalid, ...props }, ref,
) {
  const generatedId = useId();
  const id = explicitId ?? `flood-${generatedId}`;
  const legendRef = useFocusableHidden<HTMLLegendElement>(hideLabel);
  const hasHint = hasFieldContent(hint), hasError = hasFieldContent(error), hasMessage = hasFieldContent(message) && !hasError;
  const resolvedStatus = resolveFieldStatus(status, hasError, ariaInvalid);
  const description = mergeDescriptions(describedBy, hasHint && `${id}-hint`, hasError && `${id}-error`, hasMessage && `${id}-message`);
  return <fieldset {...props} ref={ref} id={id} className={classes("flood-fieldset", className)} data-hide-label={hideLabel || undefined} data-status={resolvedStatus}
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
export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(function RadioGroup(
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
export const SegmentedControl = forwardRef<HTMLFieldSetElement, SegmentedControlProps>(function SegmentedControl(
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
export const CheckboxGroup = forwardRef<HTMLFieldSetElement, CheckboxGroupProps>(function CheckboxGroup(
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
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ variant = "text", size = "md", className, ...props }, ref) {
  return (
    <a {...props} ref={ref} className={classes("flood-link", variant !== "text" && "flood-link--button", variant !== "text" && "flood-button", variant !== "text" && `flood-button--${variant}`, variant !== "text" && `flood-button--${size}`, className)} />
  );
});

/** Explicit opt-in to the dark foundations profile; no global theme mutation. */
export const FloodRoot = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function FloodRoot({ className, ...props }, ref) {
    return <div {...props} ref={ref} data-flood-foundations="neutral" data-flood-theme="dark" className={classes("flood-root", className)} />;
  },
);

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: "span" | "p" | "div";
  size?: "lead" | "body" | "compact" | "label" | "helper";
  tone?: "default" | "subtle" | "error" | "success" | "warning" | "info";
}
export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { as = "span", size = "body", tone = "default", className, ...props }, ref,
) {
  return createElement(as, { ...props, ref, className: classes("flood-text", `flood-type--${size}`, `flood-tone--${tone}`, className) });
});

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: "display" | "large" | "page" | "section";
}
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level = 2, size = "page", className, ...props }, ref,
) {
  return createElement(`h${level}`, { ...props, ref, className: classes("flood-heading", `flood-type--${size}`, className) });
});

export type Space = "0" | "1" | "2" | "3" | "4" | "6" | "8" | "12";
export interface LayoutProps extends HTMLAttributes<HTMLDivElement> {
  gap?: Space;
}
export const Stack = forwardRef<HTMLDivElement, LayoutProps>(function Stack(
  { gap = "4", style, className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={classes("flood-stack", className)} style={{ "--flood-layout-gap": `var(--flood-sys-space-${gap})`, ...style } as CSSProperties} />;
});
export interface InlineProps extends LayoutProps {
  align?: "start" | "center" | "end" | "baseline";
}
export const Inline = forwardRef<HTMLDivElement, InlineProps>(function Inline(
  { gap = "2", align = "center", style, className, ...props }, ref,
) {
  return <div {...props} ref={ref} className={classes("flood-inline", className)} style={{ "--flood-layout-gap": `var(--flood-sys-space-${gap})`, alignItems: align === "start" ? "flex-start" : align === "end" ? "flex-end" : align, ...style } as CSSProperties} />;
});
export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: "default" | "raised" | "overlay";
  padding?: Space;
}
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { elevation = "default", padding = "6", style, className, ...props }, ref,
) {
  return <div {...props} ref={ref} data-flood-elevation={elevation} className={classes("flood-surface", className)} style={{ background: `var(--flood-sys-color-surface-${elevation})`, padding: `var(--flood-sys-space-${padding})`, ...style }} />;
});

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "full";
  gutter?: Space;
}
/** Centered content with logical gutters; max width includes padding. @since 0.2.4 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
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
export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
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
export const VisuallyHidden = forwardRef<HTMLElement, VisuallyHiddenProps>(function VisuallyHidden(
  { as = "span", focusable = false, className, ...props }, ref,
) {
  const hiddenRef = useFocusableHidden<HTMLElement>(focusable, ref);
  return createElement(as, { ...props, ref: hiddenRef, className: classes(focusable ? "flood-visually-hidden--focusable" : "flood-visually-hidden", className) });
});
export interface AspectRatioProps extends HTMLAttributes<HTMLDivElement> {
  ratio?: number;
}
/** Reserve media geometry. Child content may overflow rather than being clipped. @since 0.2.4 */
export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(function AspectRatio(
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
export const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
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
export const List = forwardRef<HTMLUListElement | HTMLOListElement, ListProps>(function List(
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
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
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
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
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
export const IconSlot = forwardRef<HTMLSpanElement, IconSlotProps>(function IconSlot(
  { size = "md", label, className, children, ...props }, ref,
) {
  return <span {...props} ref={ref} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={classes("flood-icon", `flood-icon--${size}`, className)}>{children}</span>;
});
export interface IconButtonProps extends Omit<ButtonProps, "aria-label"> {
  label: string;
}
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", variant = "subtle", className, children, ...props }, ref,
) {
  return <Button {...props} ref={ref} size={size} variant={variant} aria-label={label} className={classes("flood-icon-button", className)}><IconSlot size={size}>{children}</IconSlot></Button>;
});

export const Divider = forwardRef<HTMLHRElement, HTMLAttributes<HTMLHRElement>>(
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
export const CodeSnippet = forwardRef<HTMLDivElement, CodeSnippetProps>(function CodeSnippet(
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
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
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
export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(function CopyButton(
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
export const ToastRegion = forwardRef<HTMLDivElement, ToastRegionProps>(function ToastRegion(
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
export const AvatarGroup = forwardRef<HTMLUListElement, AvatarGroupProps>(function AvatarGroup(
  {max = 4, size = "md", ...props}, ref,
) { return <GroupedAvatars {...props} ref={ref} max={max} size={size}/>; });

export interface StatusIndicatorProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  label: string;
  tone?: SemanticTone;
  size?: ContentSize;
  announce?: boolean;
}
export const StatusIndicator = forwardRef<HTMLSpanElement, StatusIndicatorProps>(function StatusIndicator(
  {tone = "neutral", size = "md", announce = false, ...props}, ref,
) { return <NamedStatus {...props} ref={ref} tone={tone} size={size} announce={announce}/>; });

export interface FigureProps extends HTMLAttributes<HTMLElement> {
  caption?: ReactNode;
  captionPosition?: "before" | "after";
}
export const Figure = forwardRef<HTMLElement, FigureProps>(function Figure(
  {captionPosition = "after", ...props}, ref,
) { return <CaptionedFigure {...props} ref={ref} captionPosition={captionPosition}/>; });

export interface BlockquoteProps extends BlockquoteHTMLAttributes<HTMLQuoteElement> {
  attribution?: ReactNode;
}
export const Blockquote = forwardRef<HTMLQuoteElement, BlockquoteProps>(function Blockquote(props, ref) {
  return <AttributedQuote {...props} ref={ref}/>;
});

export interface InlineCodeProps extends HTMLAttributes<HTMLElement> {
  size?: ContentSize;
  wrap?: boolean;
}
export const InlineCode = forwardRef<HTMLElement, InlineCodeProps>(function InlineCode(
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
export const Metric = forwardRef<HTMLDListElement, MetricProps>(function Metric(
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
export const Timeline = forwardRef<HTMLOListElement, TimelineProps>(function Timeline(props, ref) {
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
export const NavigationList = forwardRef<HTMLElement, NavigationListProps>(function NavigationList(
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
export const Steps = forwardRef<HTMLOListElement, StepsProps>(function Steps(
  {orientation = "horizontal", ...props}, ref,
) { return <StepSequence {...props} ref={ref} orientation={orientation} />; });

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  headingSize?: "display" | "large" | "page" | "section";
}
export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
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
export const Split = forwardRef<HTMLDivElement, SplitProps>(function Split(
  {side = "end", ratio = "main", collapseAt = "md", gap = "6", ...props}, ref,
) { return <SplitLayout {...props} ref={ref} side={side} ratio={ratio} collapseAt={collapseAt} gap={gap} />; });

export interface CenterProps extends HTMLAttributes<HTMLDivElement> {
  inline?: boolean;
  maxWidth?: string;
  minHeight?: string;
}
export const Center = forwardRef<HTMLDivElement, CenterProps>(function Center(
  {inline = false, ...props}, ref,
) { return <CenterLayout {...props} ref={ref} inline={inline} />; });

export interface SkipLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
}
export const SkipLink = forwardRef<HTMLAnchorElement, SkipLinkProps>(function SkipLink(
  {children = "Skip to content", ...props}, ref,
) { return <SkipNavigation {...props} ref={ref}>{children}</SkipNavigation>; });


export interface ListBoxProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "defaultValue" | "onChange"> {
  label: string;
  hideLabel?: boolean;
  options: readonly ComboboxOption[];
  value?: string | readonly string[];
  defaultValue?: string | readonly string[];
  onValueChange?: (value: string | string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
  form?: string;
  controlSize?: "sm" | "md" | "lg" | "xl";
}
export const ListBox = forwardRef<HTMLDivElement, ListBoxProps>(function ListBox(
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
export const PinInput = forwardRef<HTMLInputElement, PinInputProps>(function PinInput(
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
export const Rating = forwardRef<HTMLFieldSetElement, RatingProps>(function Rating(
  {max = 5, defaultValue = 0, hideLabel = false, readOnly = false, size = "md", ...props}, ref,
) { return <StarRating {...props} ref={ref} max={max} defaultValue={defaultValue} hideLabel={hideLabel} readOnly={readOnly} size={size} />; });

export interface DropzoneProps extends Omit<FileInputProps, "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop"> {
  label: string;
  description?: string;
}
export const Dropzone = forwardRef<HTMLInputElement, DropzoneProps>(function Dropzone(
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
export const CharacterCount = forwardRef<HTMLOutputElement, CharacterCountProps>(function CharacterCount(
  {mode = "count", label = "Characters", overLimitLabel = "Over limit", ...props}, ref,
) { return <SupportingCharacterCount {...props} ref={ref} mode={mode} label={label} overLimitLabel={overLimitLabel} />; });
