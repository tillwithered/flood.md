import { forwardRef, useId, type CSSProperties } from "react";
import type { AlertProps, MeterReference, ProgressProps } from "./index.js";
import { VisuallyHidden } from "./index.js";
import { hasFieldContent } from "./field-state.js";

export function validateRange(value: number | undefined, min: number, max: number, allowUnknown: boolean) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min || !Number.isFinite(max - min))
    throw new RangeError("Flood indicators require a finite increasing range");
  if (value === undefined && allowUnknown) return;
  if (value === undefined || !Number.isFinite(value) || value < min || value > max)
    throw new RangeError("Flood indicator value must be finite and within its range");
}

type IndicatorProps = ProgressProps & { kind: "progress" | "meter"; shape?: "ring"; min: number; max: number; reference?: MeterReference };
export const ValueIndicator = /* @__PURE__ */ forwardRef<HTMLDivElement, IndicatorProps>(function ValueIndicator(
  { kind, shape, label, value, min, max, reference, valueText, size, tone, hideLabel, layout = "stacked", className, ...props }, ref,
) {
  const labelId = `flood-indicator-${useId()}`;
  const referenceId = `${labelId}-reference`;
  validateRange(value, min, max, kind === "progress");
  if (reference) {
    validateRange(reference.value, min, max, false);
    if (!reference.label.trim()) throw new Error("Flood Meter reference requires a label");
  }
  const unknown = value === undefined;
  const percent = unknown ? undefined : ((value - min) / (max - min)) * 100;
  const referencePercent = reference ? ((reference.value - min) / (max - min)) * 100 : undefined;
  const ring = shape === "ring";
  const caption = <><span id={labelId}>{label}</span>{valueText && <span className="flood-indicator__value" aria-hidden="true">{valueText}</span>}</>;
  return <div {...props} ref={ref} className={["flood-indicator", className].filter(Boolean).join(" ")}
    data-kind={kind} data-shape={shape} data-size={size} data-tone={tone} data-layout={ring ? undefined : layout} data-indeterminate={unknown}>
    {hideLabel ? <VisuallyHidden as="div">{caption}</VisuallyHidden> : <div className="flood-indicator__caption">{caption}</div>}
    <div className={ring ? "flood-indicator__ring" : "flood-indicator__track"} role={kind === "meter" ? "meter" : "progressbar"}
      aria-labelledby={labelId} aria-describedby={reference ? referenceId : undefined}
      aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={valueText}>
      {ring ? <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <circle className="flood-indicator__ring-track" cx="20" cy="20" r="17" />
        <circle className="flood-indicator__ring-fill" cx="20" cy="20" r="17" pathLength="100"
          data-empty={percent === 0 || undefined} style={{ strokeDasharray: `${percent ?? 28} 100` }} />
      </svg> : <span className="flood-indicator__fill" style={{ inlineSize: percent === undefined ? undefined : `${percent}%` }} />}
      {reference && <span className="flood-indicator__reference" aria-hidden="true"
        style={{"--flood-indicator-reference-position": `${referencePercent}%`} as CSSProperties} />}
    </div>
    {reference && (hideLabel ? <VisuallyHidden id={referenceId}>{reference.label}</VisuallyHidden>
      : <span id={referenceId} className="flood-indicator__reference-label">{reference.label}</span>)}
  </div>;
});

export function StatusGlyph({ tone }: { tone: AlertProps["tone"] }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" focusable="false">
    {tone === "success" ? <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></> :
      tone === "warning" ? <><path d="m12 3 10 17H2L12 3Z" /><path d="M12 9v4m0 3h.01" /></> :
        tone === "error" ? <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></> :
          <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-9h.01" /></>}
  </svg>;
}

export const FeedbackMessage = /* @__PURE__ */ forwardRef<HTMLDivElement, AlertProps>(function FeedbackMessage(
  { title, appearance = "banner", tone, icon, action, announcement, children, className, ...props }, ref,
) {
  const artwork = icon === undefined ? <StatusGlyph tone={tone} /> : icon;
  const hasAction = hasFieldContent(action);
  const live = {
    role: announcement === "assertive" ? "alert" : announcement === "polite" ? "status" : undefined,
    "aria-atomic": announcement === "off" ? undefined : true,
  };
  const message = <>
    {artwork != null && <span className="flood-alert__icon" aria-hidden="true">{artwork}</span>}
    <div className="flood-alert__content">
      {title && <p className="flood-alert__title">{title}</p>}
      {children != null && <div className="flood-alert__body">{children}</div>}
    </div>
  </>;
  return <div {...props} ref={ref} className={["flood-alert", className].filter(Boolean).join(" ")} data-tone={tone} data-appearance={appearance}
    data-has-action={hasAction || undefined} {...(!hasAction ? live : undefined)}>
    {hasAction ? <>
      <div className="flood-alert__message" {...live}>{message}</div>
      <div className="flood-alert__action">{action}</div>
    </> : message}
  </div>;
});
