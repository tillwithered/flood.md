import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { NumberInputProps, InputGroup, IconButton } from "./index.js";

interface Props extends NumberInputProps {
  inputComponent: typeof InputGroup;
  buttonComponent: typeof IconButton;
}

/** Prefer native stepping while keeping a deterministic fallback for controlled inputs. */
export const NumericStepper = /* @__PURE__ */ forwardRef<HTMLInputElement, Props>(function NumericStepper({
  inputComponent: Group, buttonComponent: Action, value, defaultValue = 0,
  onValueChange, min, max, step = 1, disabled, readOnly, controlSize = "md",
  decreaseLabel = "Decrease value", increaseLabel = "Increase value", className, appearance = "stepper",
  onBlur, onKeyDown, ...props
}, ref) {
  if (!Number.isFinite(step) || step <= 0 || (min !== undefined && !Number.isFinite(min)) || (max !== undefined && !Number.isFinite(max)) || (min !== undefined && max !== undefined && min > max)) throw new Error("Flood NumberInput requires finite bounds and a positive step");
  for (const number of [value, defaultValue]) if (number !== undefined && number !== null && !Number.isFinite(number)) throw new Error("Flood NumberInput value must be finite or null");
  const hasSteppers = appearance === "stepper";
  if (hasSteppers && (!decreaseLabel.trim() || !increaseLabel.trim())) throw new Error("Flood NumberInput step actions require accessible names");
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current!, []);
  const initial = useRef(defaultValue === null ? "" : String(defaultValue));
  const [local, setLocal] = useState(initial.current);
  const [, refresh] = useState(0);
  const current = value === undefined ? local : value === null ? "" : String(value);
  const number = current === "" ? null : Number(current);
  const publish = (text: string) => {
    setLocal(text);
    refresh(revision => revision + 1);
    onValueChange?.(text === "" ? null : Number(text));
  };
  useEffect(() => {
    const form = input.current?.form;
    if (!form || value !== undefined) return;
    const reset = (event: Event) => queueMicrotask(() => { if (!event.defaultPrevented) setLocal(initial.current); });
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [value, props.form]);
  const move = (direction: number) => {
    const node = input.current;
    if (!node || disabled || readOnly || node.matches(":disabled")) return;
    const previous = node.value;
    if (direction > 0) node.stepUp(); else node.stepDown();
    if (node.value !== previous) { publish(node.value); return; }
    const before = node.value === "" ? (direction > 0 ? min ?? 0 : max ?? 0) : Number(node.value);
    const decimalPlaces = (value: number) => { const [coefficient, exponent] = String(value).toLowerCase().split("e"); return Math.max(0, (coefficient.split(".")[1]?.length ?? 0) - Number(exponent ?? 0)); };
    const precision = Math.max(decimalPlaces(step), decimalPlaces(before), min === undefined ? 0 : decimalPlaces(min), max === undefined ? 0 : decimalPlaces(max));
    const candidate = Number((before + direction * step).toFixed(precision));
    const next = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, candidate));
    if (next !== before) { node.value = String(next); publish(node.value); }
  };
  const glyph = (increase: boolean) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14" />{increase && <path d="M12 5v14" />}</svg>;
  return <Group {...props} ref={input} type="number" value={current} min={min} max={max} step={step}
    controlSize={controlSize} disabled={disabled} readOnly={readOnly}
    className={["flood-number-input", !hasSteppers && "flood-number-input--plain", className].filter(Boolean).join(" ")}
    onChange={event => { if (!readOnly && !disabled) publish(event.currentTarget.value); }}
    onBlur={event => {
      onBlur?.(event);
      if (event.defaultPrevented || readOnly || disabled || event.currentTarget.value === "") return;
      const node = event.currentTarget;
      const before = node.value;
      if (node.validity.rangeUnderflow && min !== undefined) node.value = String(min);
      if (node.validity.rangeOverflow && max !== undefined) node.value = String(max);
      if (node.value !== before) publish(node.value);
    }}
    onKeyDown={event => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.nativeEvent.isComposing || readOnly || disabled) return;
      if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); move(event.key === "ArrowUp" ? 1 : -1); }
    }}
    start={hasSteppers ? <Action label={decreaseLabel} variant="ghost" size={controlSize} disabled={disabled || readOnly || (number !== null && min !== undefined && number <= min)} onClick={() => move(-1)}>{glyph(false)}</Action> : undefined}
    end={hasSteppers ? <Action label={increaseLabel} variant="ghost" size={controlSize} disabled={disabled || readOnly || (number !== null && max !== undefined && number >= max)} onClick={() => move(1)}>{glyph(true)}</Action> : undefined} />;
});
