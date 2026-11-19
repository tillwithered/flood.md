import { forwardRef, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { SliderProps, Fieldset } from "./index.js";
import { hasFieldContent, mergeDescriptions, resolveFieldStatus } from "./field-state.js";

interface Props extends SliderProps {
  fieldsetComponent: typeof Fieldset;
  trackSegments?: readonly { start: number; end: number }[];
  trackMarkers?: readonly number[];
  trackDecoration?: ReactNode;
  minimumGap?: number;
  keyboardStep?: number;
}

interface RailDrag {
  pointerId: number;
  thumb: number;
  pendingTouch?: {x: number; y: number};
}

const touchDragThreshold = 8;

/** Native range inputs keep keyboard/AT interaction; the shared rail handles pointer selection. */
export const RangeControl = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, Props>(function RangeControl({
  fieldsetComponent: Group, trackSegments, trackMarkers, trackDecoration, minimumGap = 0, keyboardStep,
  label, value, defaultValue = [50], onValueChange,
  min = 0, max = 100, step = 1, thumbLabels, showValue = true, formatValue, valuePlacement = "below-label", readOnly = false,
  controlSize = "md", disabled, className, name, onKeyDown, ...props
}, ref) {
  if (![min, max, step, max - min, (max - min) / step].every(Number.isFinite) || min >= max || step <= 0) throw new Error("Flood Slider requires finite increasing bounds and a positive representable step");
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
  const drag = useRef<RailDrag | null>(null);
  const valuesRef = useRef(values); valuesRef.current = values;
  const update = (index: number, next: number) => {
    const before = valuesRef.current;
    const number = Math.max(index === 1 ? before[0] + minimumGap : min,
      Math.min(index === 0 && before.length === 2 ? before[1] - minimumGap : max, snap(next)));
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
    return min + (node.ownerDocument.defaultView?.getComputedStyle(node).direction === "rtl" ? 1 - ratio : ratio) * (max - min);
  };
  const inert = (node: HTMLElement) => disabled || readOnly || Boolean(node.closest("fieldset:disabled"));
  const clearRailDrag = (pointerId: number) => {
    if (drag.current?.pointerId === pointerId) drag.current = null;
  };
  const start = values.length === 1 ? 0 : percent(values[0]);
  const end = percent(values[values.length - 1]);
  const inlineValue = showValue && valuePlacement === "inline" && !props.hideLabel;
  const readout = showValue && <span className="flood-slider__value" aria-hidden="true"><bdi dir={formatValue ? "auto" : "ltr"}>{values.map(number => formatValue?.(number) ?? String(number)).join(" – ")}</bdi></span>;
  const legend = inlineValue ? <span className="flood-slider__label-line"><span>{label}</span>{readout}</span> : label;
  return <Group {...props} id={id} ref={ref} legend={legend} name={name} disabled={disabled}
    className={["flood-slider", `flood-control--${controlSize}`, className].filter(Boolean).join(" ")}
    data-readonly={readOnly || undefined}
    onKeyDown={event => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
      if (readOnly && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(event.key)) event.preventDefault();
      const index = inputs.current.indexOf(event.target as HTMLInputElement);
      const horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
      const vertical = keyboardStep !== undefined && (event.key === "ArrowUp" || event.key === "ArrowDown");
      if (index < 0 || inert(event.currentTarget) || (!horizontal && !vertical)) return;
      // Native WebKit does not reverse horizontal range keys in RTL.
      const rtl = event.currentTarget.ownerDocument.defaultView?.getComputedStyle(event.currentTarget).direction === "rtl";
      event.preventDefault();
      const increase = event.key === "ArrowUp" || event.key === (rtl ? "ArrowLeft" : "ArrowRight");
      const increment = event.shiftKey ? step : keyboardStep ?? step;
      update(index, values[index] + increment * (increase ? 1 : -1));
    }}>
    {!inlineValue && readout}
    <div className="flood-slider__rail" style={{"--flood-slider-start": `${start}%`, "--flood-slider-end": `${100 - end}%`} as CSSProperties}
      onPointerDown={event => {
        if (drag.current || inputs.current.includes(event.target as HTMLInputElement) || inert(event.currentTarget) || event.button !== 0) return;
        if (event.pointerType === "touch" && !event.isPrimary) return;
        event.preventDefault();
        const next = pointValue(event.currentTarget, event.clientX);
        const lowerDistance = Math.abs(next - values[0]);
        const upperDistance = values.length === 2 ? Math.abs(next - values[1]) : Infinity;
        const index = upperDistance < lowerDistance || (values.length === 2 && upperDistance === lowerDistance && next >= values[0]) ? 1 : 0;
        const pendingTouch = event.pointerType === "touch" ? {x:event.clientX,y:event.clientY} : undefined;
        drag.current = {pointerId:event.pointerId,thumb:index,pendingTouch};
        event.currentTarget.setPointerCapture(event.pointerId);
        if (!pendingTouch) {
          inputs.current[index]?.focus({preventScroll:true});
          update(index, next);
        }
      }}
      onPointerMove={event => {
        const current = drag.current;
        if (!current || current.pointerId !== event.pointerId || inert(event.currentTarget)) return;
        if (current.pendingTouch) {
          const dx = Math.abs(event.clientX - current.pendingTouch.x);
          const dy = Math.abs(event.clientY - current.pendingTouch.y);
          if (Math.max(dx, dy) < touchDragThreshold) return;
          if (dy >= dx) {
            drag.current = null;
            return;
          }
          current.pendingTouch = undefined;
        }
        update(current.thumb, pointValue(event.currentTarget, event.clientX));
      }}
      onPointerUp={event => {
        const current = drag.current;
        if (current?.pointerId !== event.pointerId) return;
        drag.current = null;
        const start = current.pendingTouch;
        if (start && !inert(event.currentTarget) &&
            Math.max(Math.abs(event.clientX - start.x), Math.abs(event.clientY - start.y)) < touchDragThreshold) {
          update(current.thumb, pointValue(event.currentTarget, event.clientX));
        }
      }}
      onLostPointerCapture={event => clearRailDrag(event.pointerId)}
      onPointerCancel={event => clearRailDrag(event.pointerId)}>
      <span className="flood-slider__track" aria-hidden="true">
        {trackDecoration}
        {trackSegments?.map(({start, end}, index) => <span key={index} className="flood-slider__segment"
          style={{insetInlineStart:`${percent(start)}%`, insetInlineEnd:`${100 - percent(end)}%`}}/>)}
        <span className="flood-slider__fill" />
        {trackMarkers?.map(marker => <span key={marker} className="flood-slider__marker" style={{insetInlineStart:`${percent(marker)}%`}}/>)}
      </span>
      {values.map((number, index) => <input key={index} ref={node => { inputs.current[index] = node; }} type="range"
        className="flood-slider__input" name={name} form={props.form} value={number} min={min} max={max} step={step} disabled={disabled}
        aria-label={thumbLabels?.[index] ?? (values.length === 1 ? label : `${label}: ${index === 0 ? "minimum" : "maximum"}`)}
        aria-valuemin={index === 1 ? values[0] + minimumGap : min}
        aria-valuemax={index === 0 && values.length === 2 ? values[1] - minimumGap : max}
        aria-valuetext={formatValue?.(number)}
        aria-describedby={describedBy} aria-readonly={readOnly || undefined} aria-invalid={status === "error" || undefined}
        onPointerDown={event => { if (readOnly) event.preventDefault(); }}
        onChange={event => { if (!inert(event.currentTarget)) update(index, event.currentTarget.valueAsNumber); }} />)}
    </div>
  </Group>;
});
