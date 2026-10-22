"use client";

import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

const classes = (...values: (string | undefined | false)[]) =>
  values.filter(Boolean).join(" ");

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
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
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className, ...props },
  ref,
) {
  return (
    <input
      {...props}
      ref={ref}
      aria-invalid={invalid || props["aria-invalid"]}
      className={classes("flood-input", className)}
    />
  );
});
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid, className, ...props }, ref) {
    return (
      <textarea
        {...props}
        ref={ref}
        aria-invalid={invalid || props["aria-invalid"]}
        className={classes("flood-input", "flood-textarea", className)}
      />
    );
  },
);

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
}
export interface FieldProps {
  id?: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: (props: FieldControlProps) => ReactNode;
}
export function Field({
  id: explicitId,
  label,
  hint,
  error,
  children,
}: FieldProps) {
  const generatedId = useId();
  const id = explicitId ?? `flood-${generatedId}`;
  const description =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className="flood-field">
      <label className="flood-label" htmlFor={id}>
        {label}
      </label>
      {children({
        id,
        "aria-describedby": description,
        "aria-invalid": error ? true : undefined,
      })}
      {hint && (
        <div id={`${id}-hint`} className="flood-hint">
          {hint}
        </div>
      )}
      {error && (
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
