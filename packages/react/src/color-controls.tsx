import {forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties} from "react";
import {Button, Collapsible, ColorPalette, ColorSwatch, Inline, Input, Label, Slider, type ColorPaletteProps, type ColorPickerProps, type ColorSwatchProps} from "./index.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
export function normalizeHexColor(value: string, allowAlpha = false): string | undefined {
  const text = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(text)) return text;
  if (/^#[0-9a-f]{3}$/.test(text)) return `#${[...text.slice(1)].map(character => character + character).join("")}`;
  if (allowAlpha && /^#[0-9a-f]{8}$/.test(text)) return text;
  if (allowAlpha && /^#[0-9a-f]{4}$/.test(text)) return `#${[...text.slice(1)].map(character => character + character).join("")}`;
  return undefined;
}
function checkedColor(value: string, allowAlpha = false) {
  const normalized = normalizeHexColor(value,allowAlpha);
  if (!normalized) throw new Error(allowAlpha ? "Flood color values must be RGB or RGBA hex strings" : "Flood color values must be opaque #rgb or #rrggbb hex strings");
  return normalized;
}
const cx = (...values: Array<string | false | undefined>) => values.filter(Boolean).join(" ");

export const ColorPreview = /* @__PURE__ */ forwardRef<HTMLSpanElement, ColorSwatchProps>(function ColorPreview({
  value, label, size = "md", className, style, ...props
}, ref) {
  if (!label.trim()) throw new Error("Flood ColorSwatch requires a nonempty label");
  const color = checkedColor(value,true);
  const translucent = color.length === 9 && !color.endsWith("ff");
  return <span {...props} ref={ref} role="img" aria-label={label}
    data-alpha={translucent || undefined}
    className={cx("flood-color-swatch", `flood-color-swatch--${size}`, className)}
    style={translucent ? {...style, "--flood-color-sample":color} as CSSProperties : {...style, backgroundColor:color}} />;
});

export const PaletteChoices = /* @__PURE__ */ forwardRef<HTMLDivElement, ColorPaletteProps>(function PaletteChoices({
  label, options, value, onValueChange, appearance, disabled, readOnly, className, ...props
}, ref) {
  const selected = value ? checkedColor(value,true) : "";
  const entries = options.map(option => ({...option, value: checkedColor(option.value,true)}));
  if (!label.trim() || entries.some(option => !option.label.trim()) ||
      new Set(entries.map(option => option.value)).size !== entries.length) {
    throw new Error("Flood ColorPalette requires a name and uniquely colored, named options");
  }
  return <Inline {...props} ref={ref} role="group" aria-label={label} gap="1"
    className={cx("flood-color-palette", className)} data-appearance={appearance} data-readonly={readOnly || undefined}>
    {entries.map(option => <Button key={option.value} size="sm" variant="ghost" className="flood-color-palette__choice"
      aria-label={option.label} aria-pressed={selected === option.value} aria-disabled={readOnly || undefined}
      disabled={disabled || option.disabled} onClick={() => {
        if (!readOnly) onValueChange(option.value);
      }}>
      <ColorSwatch value={option.value} label={option.label} size="sm" aria-hidden="true" />
      {appearance === "labeled" && option.label}
    </Button>)}
  </Inline>;
});

export const ColorEditor = /* @__PURE__ */ forwardRef<HTMLInputElement, ColorPickerProps>(function ColorEditor({
  label, hideLabel = false, value, defaultValue = "", onValueChange, name, form, required = false,
  disabled = false, readOnly = false, controlSize = "md", presets = [], appearance = "contained",
  allowAlpha = false, alphaLabel = "Opacity (%)", channelDisclosureLabel,
  invalidMessage = allowAlpha ? "Enter a color in #rrggbbaa format." : "Enter a color in #rrggbb format.",
  hexLabel = "Hex", channelLabels = ["Red", "Green", "Blue"],
  presetsLabel = "Preset colors", id: explicitId, className, ...props
}, ref) {
  if (![label, invalidMessage, hexLabel, presetsLabel, alphaLabel, ...channelLabels].every(text => text.trim()) || channelLabels.length !== 3) throw new Error("Flood ColorPicker requires nonempty labels and three channel names");
  const normalize = (color: string) => {
    const normalized=normalizeHexColor(color,allowAlpha);
    return allowAlpha && normalized?.length===7 ? `${normalized}ff` : normalized;
  };
  const canonical = (color: string) => {
    if (!color) return "";
    const normalized=normalize(color);
    if (!normalized) throw new Error("Flood ColorPicker received a color outside its hex format");
    return normalized;
  };
  const [initial] = useState(() => canonical(defaultValue));
  const [local, setLocal] = useState(initial);
  const toLocalFormat = (color: string) => canonical(!allowAlpha && color.length === 9 ? color.slice(0,7) : color);
  const current = value === undefined ? toLocalFormat(local) : canonical(value);
  const [draft, setDraft] = useState(current), [showError, setShowError] = useState(false);
  const pending = useRef<string | undefined>(undefined);
  const previous = useRef({current, readOnly});
  const input = useRef<HTMLInputElement>(null);
  const generated = useId(), id = explicitId ?? `flood-color-picker-${generated}`;
  const choices = [...new Set(presets.map(preset => checkedColor(preset,allowAlpha)).map(canonical))];
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
  const invalidDraft = draft !== "" && !normalize(draft);
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
        if (!controlled.current) { setLocal(initial); setDraft(toLocalFormat(initial)); }
        else setDraft(input.current.dataset.acceptedValue ?? "");
        setShowError(false);
      }, 0);
      timers.add(timer);
    };
    owner.addEventListener("reset", reset);
    return () => { owner.removeEventListener("reset", reset); timers.forEach(clearTimeout); };
  }, [form, allowAlpha, initial]);
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
  const alpha = current.length === 9 ? parseInt(current.slice(7),16) : 255;
  const hexByte = (value: number) => value.toString(16).padStart(2,"0");
  const channelControls = <div className="flood-color-picker__channels">
    {channelLabels.map((channel, index) => <Slider key={index} label={channel}
      min={0} max={255} step={1} value={[channels[index]]} controlSize="sm" valuePlacement="inline" disabled={disabled} readOnly={readOnly}
      form={form} onValueChange={next => {
        const numbers = channels.map((number, position) => position === index ? next[0] : number);
        commit(`#${numbers.map(hexByte).join("")}${allowAlpha?hexByte(alpha):""}`);
      }} />)}
    {allowAlpha && <Slider label={alphaLabel} min={0} max={100} step={1} value={[Math.round(alpha * 100 / 255)]}
      controlSize="sm" valuePlacement="inline" disabled={disabled} readOnly={readOnly} form={form}
      onValueChange={next => commit(`#${channels.map(hexByte).join("")}${hexByte(Math.round(next[0] * 255 / 100))}`)} />}
  </div>;
  return <div {...props} id={id} className={cx("flood-color-picker", className)} role="group"
    aria-labelledby={props["aria-label"] ? undefined : props["aria-labelledby"] ?? `${id}-label`}
    data-disabled={disabled || undefined} data-readonly={readOnly || undefined} data-appearance={appearance}
    data-channel-disclosure={Boolean(channelDisclosureLabel) || undefined}>
    <Label id={`${id}-label`} htmlFor={`${id}-hex`} required={required} className={hideLabel ? "flood-visually-hidden" : undefined}>{label}</Label>
    <div className="flood-color-picker__panel">
      <div className="flood-color-picker__value">
        {current ? <ColorSwatch value={current} label={current} size="lg" /> : <span className="flood-color-picker__empty" aria-hidden="true" />}
        <div className="flood-color-picker__hex">
          <Label htmlFor={`${id}-hex`}>{hexLabel}</Label>
          <Input ref={input} id={`${id}-hex`} form={form} value={draft} data-accepted-value={current}
            autoComplete="off" autoCapitalize="off" spellCheck={false} dir="ltr" placeholder={allowAlpha?"#rrggbbaa":"#rrggbb"}
            controlSize={controlSize} readOnly={readOnly} disabled={disabled} required={required}
            aria-invalid={showError && Boolean(message) || undefined} aria-describedby={[props["aria-describedby"], showError && message ? `${id}-error` : undefined].filter(Boolean).join(" ") || undefined}
            onChange={event => {
              if (blocked()) return;
              const text = event.currentTarget.value;
              setDraft(text); setShowError(false);
              const normalized = normalize(text);
              if (!text || normalized) commit(normalized ?? "", text);
            }}
            onBlur={() => { if (!message) setDraft(current); else if (!readOnly) setShowError(true); }}
            onInvalid={() => setShowError(true)} />
        </div>
      </div>
      {channelDisclosureLabel ? <Collapsible title={channelDisclosureLabel} variant="flush" controlSize="sm"
        disabled={disabled}>{channelControls}</Collapsible> : channelControls}
      {choices.length > 0 && <ColorPalette label={presetsLabel} options={choices.map(color => ({value:color, label:color}))}
        value={current} disabled={disabled} readOnly={readOnly} onValueChange={commit} />}
    </div>
    {name && <input type="hidden" name={name} form={form} value={invalidDraft && !readOnly ? "" : current} disabled={disabled} />}
    {showError && message && <span id={`${id}-error`} className="flood-error" role="alert">{message}</span>}
  </div>;
});
