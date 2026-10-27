import {forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState} from "react";
import {Input, Label, Slider, type ColorPickerProps, type ColorSwatchProps} from "./index.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
/** The first color contract deliberately accepts only opaque RGB hex values. */
export function normalizeHexColor(value: string): string | undefined {
  const text = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(text)) return text;
  if (/^#[0-9a-f]{3}$/.test(text)) return `#${[...text.slice(1)].map(character => character + character).join("")}`;
  return undefined;
}
function checkedColor(value: string) {
  const normalized = normalizeHexColor(value);
  if (!normalized) throw new Error("Flood color values must be opaque #rgb or #rrggbb hex strings");
  return normalized;
}
const cx = (...values: Array<string | false | undefined>) => values.filter(Boolean).join(" ");

export const ColorPreview = /* @__PURE__ */ forwardRef<HTMLSpanElement, ColorSwatchProps>(function ColorPreview({
  value, label, size = "md", className, style, ...props
}, ref) {
  if (!label.trim()) throw new Error("Flood ColorSwatch requires a nonempty label");
  const color = checkedColor(value);
  return <span {...props} ref={ref} role="img" aria-label={label}
    className={cx("flood-color-swatch", `flood-color-swatch--${size}`, className)}
    style={{...style, backgroundColor:color}} />;
});

export const ColorEditor = /* @__PURE__ */ forwardRef<HTMLInputElement, ColorPickerProps>(function ColorEditor({
  label, hideLabel = false, value, defaultValue = "", onValueChange, name, form, required = false,
  disabled = false, readOnly = false, controlSize = "md", presets = [],
  invalidMessage = "Enter a color in #rrggbb format.", hexLabel = "Hex", channelLabels = ["Red", "Green", "Blue"],
  presetsLabel = "Preset colors", id: explicitId, className, ...props
}, ref) {
  if (![label, invalidMessage, hexLabel, presetsLabel, ...channelLabels].every(text => text.trim()) || channelLabels.length !== 3) throw new Error("Flood ColorPicker requires nonempty labels and three channel names");
  const canonical = (color: string) => color === "" ? "" : checkedColor(color);
  const initial = useRef(canonical(defaultValue));
  const [local, setLocal] = useState(initial.current);
  const current = value === undefined ? local : canonical(value);
  const [draft, setDraft] = useState(current), [showError, setShowError] = useState(false);
  const pending = useRef<string | undefined>(undefined);
  const previous = useRef({current, readOnly});
  const input = useRef<HTMLInputElement>(null);
  const generated = useId(), id = explicitId ?? `flood-color-picker-${generated}`;
  const choices = [...new Set(presets.map(checkedColor))];
  useImperativeHandle(ref, () => input.current!, []);
  useBrowserLayoutEffect(() => {
    // Keep the user's short valid spelling while they continue typing six digits.
    // A refused controlled request restores the host's accepted value instead.
    if (pending.current !== undefined) {
      if (pending.current !== current) setDraft(current);
      pending.current = undefined;
    } else if (previous.current.current !== current || previous.current.readOnly !== readOnly) setDraft(current);
    previous.current = {current, readOnly};
  });
  const invalidDraft = draft !== "" && !normalizeHexColor(draft);
  const message = readOnly ? "" : invalidDraft || (required && !current) ? invalidMessage : "";
  useBrowserLayoutEffect(() => { input.current?.setCustomValidity(message); });
  const controlled = useRef(value !== undefined); controlled.current = value !== undefined;
  useEffect(() => {
    const owner = input.current?.form;
    if (!owner) return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const reset = (event: Event) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (event.defaultPrevented || !input.current) return;
        if (!controlled.current) { setLocal(initial.current); setDraft(initial.current); }
        else setDraft(input.current.dataset.acceptedValue ?? "");
        setShowError(false);
      }, 0);
      timers.add(timer);
    };
    owner.addEventListener("reset", reset);
    return () => { owner.removeEventListener("reset", reset); timers.forEach(clearTimeout); };
  }, [form]);
  const blocked = () => disabled || readOnly || input.current?.matches(":disabled");
  const commit = (next: string, raw = next) => {
    if (blocked()) return;
    pending.current = next;
    setDraft(raw);
    if (value === undefined) setLocal(next);
    setShowError(false);
    if (next !== current) onValueChange?.(next);
  };
  const channels = [0, 1, 2].map(index => parseInt((current || "#000000").slice(index * 2 + 1, index * 2 + 3), 16));
  return <div {...props} id={id} className={cx("flood-color-picker", className)} role="group"
    aria-labelledby={props["aria-label"] ? undefined : props["aria-labelledby"] ?? `${id}-label`}
    data-disabled={disabled || undefined} data-readonly={readOnly || undefined}>
    <Label id={`${id}-label`} htmlFor={`${id}-hex`} required={required} className={hideLabel ? "flood-visually-hidden" : undefined}>{label}</Label>
    <div className="flood-color-picker__panel">
      <div className="flood-color-picker__value">
        {current ? <ColorPreview value={current} label={current} size="lg" /> : <span className="flood-color-picker__empty" aria-hidden="true" />}
        <div className="flood-color-picker__hex">
          <Label htmlFor={`${id}-hex`}>{hexLabel}</Label>
          <Input ref={input} id={`${id}-hex`} form={form} value={draft} data-accepted-value={current}
            autoComplete="off" autoCapitalize="off" spellCheck={false} dir="ltr" placeholder="#rrggbb"
            controlSize={controlSize} readOnly={readOnly} disabled={disabled} required={required}
            aria-invalid={showError && Boolean(message) || undefined} aria-describedby={[props["aria-describedby"], showError && message ? `${id}-error` : undefined].filter(Boolean).join(" ") || undefined}
            onChange={event => {
              if (blocked()) return;
              const text = event.currentTarget.value;
              setDraft(text); setShowError(false);
              const normalized = normalizeHexColor(text);
              if (!text || normalized) commit(normalized ?? "", text);
            }}
            onBlur={() => { if (!message) setDraft(current); else if (!readOnly) setShowError(true); }}
            onInvalid={() => setShowError(true)} />
        </div>
      </div>
      <div className="flood-color-picker__channels">
        {channelLabels.map((channel, index) => <Slider key={index} label={channel}
          min={0} max={255} step={1} value={[channels[index]]} controlSize="sm" disabled={disabled} readOnly={readOnly}
          form={form} onValueChange={next => {
            const numbers = channels.map((number, position) => position === index ? next[0] : number);
            commit(`#${numbers.map(number => number.toString(16).padStart(2, "0")).join("")}`);
          }} />)}
      </div>
      {choices.length > 0 && <div className="flood-color-picker__presets" role="group" aria-label={presetsLabel}>
        {choices.map(color => <button key={color} type="button" className="flood-color-picker__preset"
          aria-label={color} aria-pressed={current === color} aria-disabled={readOnly || undefined} disabled={disabled}
          onClick={() => commit(color)}><ColorPreview value={color} label={color} size="sm" aria-hidden="true" /></button>)}
      </div>}
    </div>
    {name && <input type="hidden" name={name} form={form} value={invalidDraft && !readOnly ? "" : current} disabled={disabled} />}
    {showError && message && <span id={`${id}-error`} className="flood-error" role="alert">{message}</span>}
  </div>;
});
