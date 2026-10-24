"use client";

import {
  forwardRef,
  createElement,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type AnchorHTMLAttributes,
  type ReactNode,
  type HTMLAttributes,
  type CSSProperties,
} from "react";
import { SingleSelect } from "./select.js";
import { OverlayScrollArea } from "./scroll-area.js";

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
        {loading && <span className="flood-spinner" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, controlSize = "md", className, ...props },
  ref,
) {
  return (
    <input
      {...props}
      ref={ref}
      aria-invalid={invalid || props["aria-invalid"]}
      className={classes("flood-input", `flood-control--${controlSize}`, className)}
    />
  );
});
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid, controlSize = "md", className, ...props }, ref) {
    return (
      <textarea
        {...props}
        ref={ref}
        aria-invalid={invalid || props["aria-invalid"]}
        className={classes("flood-input", "flood-textarea", `flood-control--${controlSize}`, className)}
      />
    );
  },
);

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
}
/** Native select and option semantics with an independent visual control size. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, controlSize = "md", className, multiple, size, ...props },
  ref,
) {
  const listbox = multiple || (size !== undefined && size > 1);
  if (!listbox) return <SingleSelect {...props} invalid={invalid} controlSize={controlSize} className={className} size={size} ref={ref} />;
  return (
    <span className={classes("flood-select", `flood-control--${controlSize}`, listbox && "flood-select--listbox")}>
      <select
        {...props}
        ref={ref}
        multiple={multiple}
        size={size}
        aria-invalid={invalid || props["aria-invalid"]}
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
export const Checkbox = forwardRef<HTMLInputElement, ChoiceProps>(
  function Checkbox({ label, className, ...props }, ref) {
    return (
      <label className={classes("flood-choice", className)}>
        <input {...props} ref={ref} type="checkbox" className="flood-check" />
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
    <label className={classes("flood-choice", className)}>
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
    <label className={classes("flood-choice", "flood-switch", className)}>
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

export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  required?: boolean;
}
export interface FieldProps {
  id?: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  describedBy?: string;
  children: (props: FieldControlProps) => ReactNode;
}
export function Field({
  id: explicitId,
  label,
  hint,
  error,
  required,
  describedBy,
  children,
}: FieldProps) {
  const generatedId = useId();
  const id = explicitId ?? `flood-${generatedId}`;
  const hasHint = hint !== null && hint !== undefined && hint !== false && hint !== true && hint !== "";
  const hasError = error !== null && error !== undefined && error !== false && error !== true && error !== "";
  const description =
    [...new Set([describedBy, hasHint && `${id}-hint`, hasError && `${id}-error`].filter(Boolean).join(" ").split(/\s+/).filter(Boolean))].join(" ") ||
    undefined;
  return (
    <div className="flood-field">
      <label className="flood-label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children({
        id,
        "aria-describedby": description,
        "aria-invalid": hasError ? true : undefined,
        required,
      })}
      {hasHint && (
        <div id={`${id}-hint`} className="flood-hint">
          {hint}
        </div>
      )}
      {hasError && (
        <div id={`${id}-error`} className="flood-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export const Link = forwardRef<
  HTMLAnchorElement,
  AnchorHTMLAttributes<HTMLAnchorElement>
>(function Link({ className, ...props }, ref) {
  return (
    <a {...props} ref={ref} className={classes("flood-link", className)} />
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
  action?: ReactNode;
}
/** Selectable code with an optional host-owned action; no clipboard side effects. */
export const CodeSnippet = forwardRef<HTMLDivElement, CodeSnippetProps>(function CodeSnippet(
  { code, action, className, ...props }, ref,
) {
  return (
    <div {...props} ref={ref} className={classes("flood-code-snippet", className)}>
      <code className="flood-code-snippet__code">{code}</code>
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
