import { forwardRef, useId } from "react";
import type { AlertProps, ProgressProps } from "./index.js";
import { VisuallyHidden } from "./index.js";

export function validateRange(value: number | undefined, min: number, max: number, allowUnknown: boolean) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min || !Number.isFinite(max - min))
    throw new RangeError("Flood indicators require a finite increasing range");
  if (value === undefined && allowUnknown) return;
  if (value === undefined || !Number.isFinite(value) || value < min || value > max)
    throw new RangeError("Flood indicator value must be finite and within its range");
}

type IndicatorProps = ProgressProps & { kind: "progress" | "meter"; min: number; max: number };
export const ValueIndicator = /* @__PURE__ */ forwardRef<HTMLDivElement, IndicatorProps>(function ValueIndicator(
  { kind, label, value, min, max, valueText, size, tone, hideLabel, className, ...props }, ref,
) {
  const labelId = `flood-indicator-${useId()}`;
  validateRange(value, min, max, kind === "progress");
  const unknown = value === undefined;
  const percent = unknown ? undefined : ((value - min) / (max - min)) * 100;
  const caption = <><span id={labelId}>{label}</span>{valueText && <span className="flood-indicator__value" aria-hidden="true">{valueText}</span>}</>;
  return <div {...props} ref={ref} className={["flood-indicator", className].filter(Boolean).join(" ")}
    data-kind={kind} data-size={size} data-tone={tone} data-indeterminate={unknown}>
    {hideLabel ? <VisuallyHidden as="div">{caption}</VisuallyHidden> : <div className="flood-indicator__caption">{caption}</div>}
    <div className="flood-indicator__track" role={kind === "meter" ? "meter" : "progressbar"}
      aria-labelledby={labelId} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={valueText}>
      <span className="flood-indicator__fill" style={{ inlineSize: percent === undefined ? undefined : `${percent}%` }} />
    </div>
  </div>;
});

function StatusGlyph({ tone }: { tone: AlertProps["tone"] }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" focusable="false">
    {tone === "success" ? <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></> :
      tone === "warning" ? <><path d="m12 3 10 17H2L12 3Z" /><path d="M12 9v4m0 3h.01" /></> :
        tone === "error" ? <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></> :
          <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-9h.01" /></>}
  </svg>;
}

export const FeedbackMessage = /* @__PURE__ */ forwardRef<HTMLDivElement, AlertProps>(function FeedbackMessage(
  { title, tone, icon, announcement, children, className, ...props }, ref,
) {
  const artwork = icon === undefined ? <StatusGlyph tone={tone} /> : icon;
  return <div {...props} ref={ref} className={["flood-alert", className].filter(Boolean).join(" ")} data-tone={tone}
    role={announcement === "assertive" ? "alert" : announcement === "polite" ? "status" : undefined}
    aria-atomic={announcement === "off" ? undefined : true}>
    {artwork != null && <span className="flood-alert__icon" aria-hidden="true">{artwork}</span>}
    <div className="flood-alert__content">
      {title && <p className="flood-alert__title">{title}</p>}
      {children != null && <div className="flood-alert__body">{children}</div>}
    </div>
  </div>;
});
