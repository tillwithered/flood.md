import { forwardRef, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type { SliderProps, Fieldset } from "./index.js";
import { hasFieldContent, mergeDescriptions, resolveFieldStatus } from "./field-state.js";

interface Props extends SliderProps { fieldsetComponent: typeof Fieldset; }

/** Native range inputs keep keyboard/AT interaction; the shared rail handles pointer selection. */
export const RangeControl = forwardRef<HTMLFieldSetElement, Props>(function RangeControl({
  fieldsetComponent: Group, label, value, defaultValue = [50], onValueChange,
  min = 0, max = 100, step = 1, thumbLabels, showValue = true, readOnly = false,
  controlSize = "md", disabled, className, name, onKeyDown, ...props
}, ref) {
  if (![min, max, step].every(Number.isFinite) || min >= max || step <= 0) throw new Error("Flood Slider requires finite increasing bounds and a positive step");
  if (!label.trim()) throw new Error("Flood Slider requires an accessible label");
  const generatedId = useId();
  const id = props.id ?? `flood-slider-${generatedId}`;
  const hasError = hasFieldContent(props.error);
  const status = resolveFieldStatus(props.status, hasError, props["aria-invalid"]);
  const describedBy = mergeDescriptions(props["aria-describedby"], hasFieldContent(props.hint) && `${id}-hint`, hasError && `${id}-error`, !hasError && hasFieldContent(props.message) && `${id}-message`);
  const snap = (number: number) => Number(Math.max(min, Math.min(min + Math.floor((max - min) / step + 1e-9) * step, min + Math.round((number - min) / step) * step)).toPrecision(14));
  const normalize = (numbers: readonly number[]) => {
    if ((numbers.length !== 1 && numbers.length !== 2) || numbers.some(number => !Number.isFinite(number)) || (numbers.length === 2 && numbers[0] > numbers[1])) throw new Error("Flood Slider accepts one value or an ordered pair of finite values");
    return numbers.map(snap);
  };
  const initial = useRef(normalize(defaultValue));
  const [local, setLocal] = useState(initial.current);
  const values = normalize(value ?? local);
  if (thumbLabels && (thumbLabels.length !== values.length || thumbLabels.some(text => !text.trim()))) throw new Error("Flood Slider needs one nonempty label per thumb");
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const drag = useRef<number | null>(null);
  const valuesRef = useRef(values); valuesRef.current = values;
  const update = (index: number, next: number) => {
    const before = valuesRef.current;
    const number = Math.max(index === 1 ? before[0] : min, Math.min(index === 0 && before.length === 2 ? before[1] : max, snap(next)));
    const result = before.map((old, position) => position === index ? number : old);
    if (result.every((number, position) => number === before[position])) return;
    if (value === undefined) { valuesRef.current = result; setLocal(result); }
    onValueChange?.([...result]);
  };
  useEffect(() => {
    const form = inputs.current[0]?.form;
    if (!form || value !== undefined) return;
    const reset = (event: Event) => queueMicrotask(() => { if (!event.defaultPrevented) setLocal(initial.current); });
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [value, props.form]);
  const percent = (number: number) => 100 * (number - min) / (max - min);
  const pointValue = (node: HTMLDivElement, clientX: number) => {
    const box = node.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - box.left) / box.width));
    return min + (getComputedStyle(node).direction === "rtl" ? 1 - ratio : ratio) * (max - min);
  };
  const inert = (node: HTMLElement) => disabled || readOnly || Boolean(node.closest("fieldset:disabled"));
  const start = values.length === 1 ? 0 : percent(values[0]);
  const end = percent(values[values.length - 1]);
  return <Group {...props} id={id} ref={ref} legend={label} name={name} disabled={disabled}
    className={["flood-slider", `flood-control--${controlSize}`, className].filter(Boolean).join(" ")}
    data-readonly={readOnly || undefined}
    onKeyDown={event => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
      if (readOnly && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(event.key)) event.preventDefault();
    }}>
    {showValue && <div className="flood-slider__value" aria-hidden="true"><bdi dir="ltr">{values.join(" – ")}</bdi></div>}
    <div className="flood-slider__rail" style={{"--flood-slider-start": `${start}%`, "--flood-slider-end": `${100 - end}%`} as CSSProperties}
      onPointerDown={event => {
        if (event.target instanceof HTMLInputElement || inert(event.currentTarget) || event.button !== 0) return;
        event.preventDefault();
        const next = pointValue(event.currentTarget, event.clientX);
        const index = values.length === 2 && Math.abs(next - values[1]) <= Math.abs(next - values[0]) ? 1 : 0;
        drag.current = index; inputs.current[index]?.focus();
        event.currentTarget.setPointerCapture(event.pointerId); update(index, next);
      }}
      onPointerMove={event => { if (drag.current !== null && !inert(event.currentTarget)) update(drag.current, pointValue(event.currentTarget, event.clientX)); }}
      onPointerUp={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <span className="flood-slider__track" aria-hidden="true"><span className="flood-slider__fill" /></span>
      {values.map((number, index) => <input key={index} ref={node => { inputs.current[index] = node; }} type="range"
        className="flood-slider__input" name={name} form={props.form} value={number} min={min} max={max} step={step} disabled={disabled}
        aria-label={thumbLabels?.[index] ?? (values.length === 1 ? label : `${label}: ${index === 0 ? "minimum" : "maximum"}`)}
        aria-valuemin={index === 1 ? values[0] : min} aria-valuemax={index === 0 && values.length === 2 ? values[1] : max}
        aria-describedby={describedBy} aria-readonly={readOnly || undefined} aria-invalid={status === "error" || undefined}
        onPointerDown={event => { if (readOnly) event.preventDefault(); }}
        onChange={event => { if (!inert(event.currentTarget)) update(index, event.currentTarget.valueAsNumber); }} />)}
    </div>
  </Group>;
});
