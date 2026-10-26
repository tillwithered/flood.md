import {forwardRef, useEffect, useId, useImperativeHandle, useRef, useState, type RefObject} from "react";
import type {ListBoxProps, PinInputProps, RatingProps, DropzoneProps, CharacterCountProps} from "./index.js";
import {FileInput} from "./index.js";
import {resolveFieldStatus, mergeDescriptions} from "./field-state.js";

const cx = (...values: Array<string | false | undefined>) => values.filter(Boolean).join(" ");
function useNativeReset(ref: RefObject<HTMLInputElement | null>, form: string | undefined, reset: () => void) {
  const callback = useRef(reset);
  useEffect(() => { callback.current = reset; }, [reset]);
  useEffect(() => {
    const owner = ref.current?.form;
    if (!owner) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const listener = (event: Event) => { timer = setTimeout(() => { if (!event.defaultPrevented && ref.current) callback.current(); }, 0); };
    owner.addEventListener("reset", listener);
    return () => { owner.removeEventListener("reset", listener); clearTimeout(timer); };
  }, [ref, form]);
}
function useInheritedDisabled(ref: RefObject<HTMLInputElement | null>, disabled: boolean) {
  const [inherited, setInherited] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => setInherited(node.matches(":disabled"));
    update();
    const observer = new node.ownerDocument.defaultView!.MutationObserver(update);
    let ancestor = node.parentElement;
    while (ancestor) { if (ancestor.localName === "fieldset") observer.observe(ancestor, {attributes:true, attributeFilter:["disabled"]}); ancestor = ancestor.parentElement; }
    return () => observer.disconnect();
  }, [ref, disabled]);
  return disabled || inherited;
}

export const CollectionListBox = forwardRef<HTMLDivElement, ListBoxProps>(function CollectionListBox({
  label, hideLabel = false, options, value, defaultValue, onValueChange, multiple = false,
  disabled = false, readOnly = false, name, form, controlSize = "md", id: explicitId,
  className, onKeyDown, onFocus, ...props
}, forwardedRef) {
  const generated = useId(), id = explicitId ?? `flood-list-box-${generated}`;
  const root = useRef<HTMLDivElement>(null), bridge = useRef<HTMLInputElement>(null);
  useImperativeHandle(forwardedRef, () => root.current!, []);
  const unique = new Set<string>();
  for (const option of options) { if (!option.value || !option.label.trim() || unique.has(option.value)) throw new Error("Flood ListBox options need unique nonempty values and labels"); unique.add(option.value); }
  const normalize = (raw: string | readonly string[] | undefined) => {
    const entries = typeof raw === "string" ? [raw] : [...raw ?? []];
    const result = [...new Set(entries)].filter(entry => unique.has(entry));
    return multiple ? result : result.slice(0, 1);
  };
  const initial = useRef(defaultValue), [local, setLocal] = useState(() => normalize(defaultValue));
  const selected = normalize(value === undefined ? local : value);
  const first = Math.max(0, options.findIndex(option => !option.disabled));
  const [active, setActive] = useState(() => { const index = options.findIndex(option => selected.includes(option.value) && !option.disabled); return index < 0 ? first : index; });
  const effectiveDisabled = useInheritedDisabled(bridge, disabled);
  const search = useRef({text:"", time:0});
  useNativeReset(bridge, form, () => { if (value === undefined) { setLocal(normalize(initial.current)); setActive(first); } });
  const blocked = () => effectiveDisabled || bridge.current?.matches(":disabled");
  const commit = (index: number) => {
    const option = options[index];
    if (!option || option.disabled || blocked() || readOnly) return;
    const next = multiple ? selected.includes(option.value) ? selected.filter(entry => entry !== option.value) : [...selected, option.value] : [option.value];
    if (value === undefined) setLocal(next);
    onValueChange?.(multiple ? [...next] : next[0] ?? "");
  };
  const move = (index: number, choose = !multiple) => {
    setActive(index);
    if (choose) commit(index);
    const target = root.current?.ownerDocument.getElementById(`${id}-option-${index}`);
    target?.scrollIntoView({block:"nearest"});
  };
  return <div className="flood-list-box-field" hidden={props.hidden} dir={props.dir} lang={props.lang}>
    <span id={`${id}-label`} className={cx("flood-form-control__label", hideLabel && "flood-form-control__sr-only")}>{label}</span>
    <div {...props} ref={root} id={id} role="listbox" tabIndex={effectiveDisabled ? -1 : props.tabIndex ?? 0}
      aria-label={props["aria-label"]} aria-labelledby={props["aria-label"] ? undefined : props["aria-labelledby"] ?? `${id}-label`}
      aria-multiselectable={multiple || undefined} aria-disabled={effectiveDisabled || undefined} aria-readonly={readOnly || undefined}
      aria-activedescendant={options[active] ? `${id}-option-${active}` : undefined}
      className={cx("flood-list-box", `flood-control--${controlSize}`, className)}
      onFocus={event => { onFocus?.(event); if (!options[active] || options[active].disabled) setActive(first); }}
      onKeyDown={event => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing || blocked()) return;
        const enabled = options.map((option, index) => !option.disabled ? index : -1).filter(index => index >= 0);
        if (!enabled.length) return;
        const position = enabled.indexOf(active);
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          const next = event.key === "Home" ? enabled[0] : event.key === "End" ? enabled.at(-1)! : event.key === "ArrowDown" ? enabled[(position + 1) % enabled.length] : enabled[(position - 1 + enabled.length) % enabled.length];
          move(next); return;
        }
        if (event.key === " " || event.key === "Enter") { event.preventDefault(); commit(active); return; }
        if (event.key.length === 1) {
          event.preventDefault();
          const time = Date.now(), previous = time - search.current.time < 700 ? search.current.text : "";
          const text = previous + event.key.toLocaleLowerCase(props.lang);
          search.current = {text, time};
          const query = [...text].every(letter => letter === text[0]) ? text[0] : text;
          const match = [...enabled.slice(position + 1), ...enabled.slice(0, position + 1)].find(index => options[index].label.toLocaleLowerCase(props.lang).startsWith(query));
          if (match !== undefined) move(match);
        }
      }}>
      {options.map((option, index) => <div key={option.value} id={`${id}-option-${index}`} role="option"
        aria-selected={selected.includes(option.value)} aria-disabled={option.disabled || undefined}
        data-active={index === active || undefined} className="flood-list-box__option"
        onClick={() => { if (blocked()) return; root.current?.focus(); setActive(index); commit(index); }}>
        <span className="flood-list-box__copy"><span>{option.label}</span>{option.description && <span className="flood-list-box__description">{option.description}</span>}</span>
        <span className="flood-list-box__check" aria-hidden="true">{selected.includes(option.value) ? "✓" : ""}</span>
      </div>)}
      {!options.length && <div role="option" aria-disabled="true" className="flood-list-box__option">No options</div>}
    </div>
    <input ref={bridge} type="hidden" form={form} disabled={disabled} />
    {name && selected.map(entry => <input key={entry} type="hidden" name={name} value={entry} form={form} disabled={disabled} />)}
  </div>;
});

export const SegmentedPinInput = forwardRef<HTMLInputElement, PinInputProps>(function SegmentedPinInput({
  label, hideLabel = false, length = 6, mode = "numeric", mask = false, value, defaultValue = "", onValueChange,
  controlSize = "md", disabled, readOnly, className, style, status, invalid, id: explicitId,
  onFocus, onBlur, onSelect, onPointerDown, onPaste, onKeyUp, autoComplete = "one-time-code", inputMode, ...props
}, forwardedRef) {
  if (!Number.isInteger(length) || length < 1 || length > 12) throw new Error("Flood PinInput length must be an integer from 1 to 12");
  const clean = (text: string) => text.replace(mode === "numeric" ? /[^0-9]/g : /[^a-zA-Z0-9]/g, "").slice(0, length);
  const initial = useRef(clean(defaultValue)), [local, setLocal] = useState(initial.current);
  const text = clean(value ?? local), input = useRef<HTMLInputElement>(null), generated = useId(), id = explicitId ?? `flood-pin-${generated}`;
  const [active, setActive] = useState(0), [focused, setFocused] = useState(false);
  useImperativeHandle(forwardedRef, () => input.current!, []);
  useNativeReset(input, props.form, () => { if (value === undefined) { setLocal(initial.current); setActive(0); } });
  const syncCaret = () => setActive(Math.min(input.current?.selectionStart ?? 0, length - 1));
  const insert = (next: string, caret: number) => {
    const node = input.current;
    if (!node || readOnly || node.matches(":disabled")) return;
    const view = node.ownerDocument.defaultView!;
    Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, "value")!.set!.call(node, next);
    node.dispatchEvent(new view.Event("input", {bubbles:true}));
    node.setSelectionRange(caret, caret); syncCaret();
  };
  return <div className="flood-pin-input-field" hidden={props.hidden} dir={props.dir} lang={props.lang}>
    <label htmlFor={id} className={cx("flood-form-control__label", hideLabel && "flood-form-control__sr-only")}>{label}</label>
    <div className={cx("flood-pin-input", `flood-control--${controlSize}`, className)} style={style}
      data-status={resolveFieldStatus(status, invalid, props["aria-invalid"])} data-disabled={disabled || undefined} data-readonly={readOnly || undefined}>
      <input {...props} id={id} ref={input} className="flood-pin-input__editor" type={mask ? "password" : "text"}
        value={text} maxLength={length} disabled={disabled} readOnly={readOnly} autoComplete={autoComplete}
        inputMode={inputMode ?? (mode === "numeric" ? "numeric" : "text")} pattern={mode === "numeric" ? `[0-9]{${length}}` : `[a-zA-Z0-9]{${length}}`}
        aria-invalid={invalid || status === "error" || props["aria-invalid"]}
        onChange={event => { const next = clean(event.currentTarget.value); if (value === undefined) setLocal(next); onValueChange?.(next); syncCaret(); }}
        onFocus={event => { setFocused(true); syncCaret(); onFocus?.(event); }}
        onBlur={event => { setFocused(false); onBlur?.(event); }}
        onSelect={event => { syncCaret(); onSelect?.(event); }} onKeyUp={event => { syncCaret(); onKeyUp?.(event); }}
        onPointerDown={event => {
          onPointerDown?.(event); if (event.defaultPrevented || event.button !== 0 || disabled) return;
          const slots = Array.from(event.currentTarget.parentElement!.querySelectorAll<HTMLElement>("[data-pin-slot]"));
          const index = slots.findIndex(slot => { const rect = slot.getBoundingClientRect(); return event.clientX >= rect.left && event.clientX <= rect.right; });
          if (index < 0) return;
          event.preventDefault(); event.currentTarget.focus(); const position = Math.min(index, text.length); event.currentTarget.setSelectionRange(position, position); setActive(Math.min(position, length - 1));
        }}
        onPaste={event => {
          onPaste?.(event); if (event.defaultPrevented || readOnly || disabled) return;
          event.preventDefault(); const node = event.currentTarget, start = node.selectionStart ?? 0, end = node.selectionEnd ?? start;
          const pasted = clean(event.clipboardData.getData("text")), next = clean(text.slice(0, start) + pasted + text.slice(end));
          insert(next, Math.min(start + pasted.length, length));
        }} />
      {Array.from({length}, (_, index) => <span key={index} data-pin-slot="" aria-hidden="true" className="flood-pin-input__slot" data-active={focused && index === active || undefined}>{text[index] ? mask ? "•" : text[index] : ""}</span>)}
    </div>
  </div>;
});

export const StarRating = forwardRef<HTMLFieldSetElement, RatingProps>(function StarRating({
  label, hideLabel = false, value, defaultValue = 0, max = 5, onValueChange, getValueLabel,
  readOnly = false, required, name, form, size = "md", disabled, className, onKeyDown, ...props
}, forwardedRef) {
  if (!name?.trim()) throw new Error("Flood Rating requires a nonempty native group name");
  if (!Number.isInteger(max) || max < 1 || max > 10) throw new Error("Flood Rating max must be an integer from 1 to 10");
  if (![value ?? 0, defaultValue].every(entry => Number.isInteger(entry) && entry >= 0 && entry <= max)) throw new Error("Flood Rating values must be integers from zero to max");
  const root = useRef<HTMLFieldSetElement>(null), first = useRef<HTMLInputElement>(null), initial = useRef(defaultValue);
  useImperativeHandle(forwardedRef, () => root.current!, []);
  const [local, setLocal] = useState(defaultValue), [hover, setHover] = useState<number | null>(null), current = value ?? local;
  useNativeReset(first, form, () => {
    if (value === undefined) setLocal(initial.current);
    else root.current?.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach(input => { input.checked = Number(input.value) === value; });
  });
  const change = (next: number) => { if (readOnly || disabled || first.current?.matches(":disabled")) return; if (value === undefined) setLocal(next); onValueChange?.(next); };
  const display = hover ?? current;
  return <fieldset {...props} ref={root} disabled={disabled} form={form} role="radiogroup" aria-readonly={readOnly || undefined}
    className={cx("flood-rating", `flood-rating--${size}`, className)} onPointerLeave={() => setHover(null)}
    onKeyDown={event => {
      onKeyDown?.(event); if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing || disabled) return;
      const inputs = Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)'));
      const index = inputs.indexOf(event.target as HTMLInputElement); if (index < 0 || !inputs.length) return;
      const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
      let next = -1;
      if (event.key === "Home") next = 0; else if (event.key === "End") next = inputs.length - 1;
      else if (event.key === "ArrowUp" || event.key === (rtl ? "ArrowLeft" : "ArrowRight")) next = (index + 1) % inputs.length;
      else if (event.key === "ArrowDown" || event.key === (rtl ? "ArrowRight" : "ArrowLeft")) next = (index - 1 + inputs.length) % inputs.length;
      if (next >= 0) { event.preventDefault(); inputs[next].focus(); change(next + 1); }
      else if (readOnly && event.key === " ") event.preventDefault();
    }}>
    <legend className={cx("flood-form-control__label", hideLabel && "flood-form-control__sr-only")}>{label}</legend>
    <div className="flood-rating__choices">{Array.from({length:max}, (_, index) => {
      const number = index + 1;
      return <label key={number} className="flood-rating__choice" data-filled={number <= display || undefined}
        onPointerEnter={() => { if (!readOnly && !disabled && !first.current?.matches(":disabled")) setHover(number); }}>
        <input ref={index === 0 ? first : undefined} type="radio" name={name} form={form} value={number} required={required}
          disabled={disabled} checked={current === number} tabIndex={current === number || current === 0 && number === 1 ? 0 : -1}
          aria-label={getValueLabel?.(number, max) ?? `${number} of ${max} stars`}
          onClick={event => { if (readOnly) event.preventDefault(); }} onChange={() => change(number)} />
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9L12 3Z"/></svg>
      </label>;
    })}</div>
  </fieldset>;
});

export const FileDropzone = forwardRef<HTMLInputElement, DropzoneProps>(function FileDropzone({
  label, description = "Drop files here or choose from your device.", multiple = true, disabled,
  className, style, id: explicitId, status, invalid, ...props
}, forwardedRef) {
  const input = useRef<HTMLInputElement>(null), generated = useId(), id = explicitId ?? `flood-dropzone-${generated}`;
  useImperativeHandle(forwardedRef, () => input.current!, []);
  const [dragging, setDragging] = useState(false), depth = useRef(0);
  const isFiles = (types: readonly string[]) => Array.from(types).includes("Files");
  return <div hidden={props.hidden} dir={props.dir} lang={props.lang} style={style}
    className={cx("flood-dropzone", className)} data-dragging={dragging || undefined} data-disabled={disabled || undefined}
    data-status={resolveFieldStatus(status, invalid, props["aria-invalid"])}
    onDragEnter={event => { if (!isFiles(event.dataTransfer.types)) return; event.preventDefault(); depth.current++; if (!disabled && !input.current?.matches(":disabled")) setDragging(true); }}
    onDragLeave={event => { if (!isFiles(event.dataTransfer.types)) return; depth.current = Math.max(0, depth.current - 1); if (!depth.current) setDragging(false); }}
    onDragOver={event => { if (!isFiles(event.dataTransfer.types)) return; event.preventDefault(); event.dataTransfer.dropEffect = disabled || input.current?.matches(":disabled") ? "none" : "copy"; }}
    onDrop={event => {
      if (!isFiles(event.dataTransfer.types)) return;
      event.preventDefault(); depth.current = 0; setDragging(false);
      const node = input.current;
      if (!node || disabled || node.matches(":disabled")) return;
      const picked = Array.from(event.dataTransfer.files); if (!picked.length) return;
      const transfer = new node.ownerDocument.defaultView!.DataTransfer();
      (multiple ? picked : picked.slice(0, 1)).forEach(file => transfer.items.add(file));
      node.files = transfer.files; node.dispatchEvent(new node.ownerDocument.defaultView!.Event("change", {bubbles:true}));
    }}>
    <div className="flood-dropzone__intro">
      <label htmlFor={id} className="flood-dropzone__label"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V3m-4 4 4-4 4 4M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/></svg><span>{label}</span></label>
      {description && <p id={`${id}-description`} className="flood-dropzone__description">{description}</p>}
    </div>
    <FileInput {...props} ref={input} id={id} multiple={multiple} disabled={disabled} status={status} invalid={invalid}
      aria-describedby={mergeDescriptions(props["aria-describedby"], Boolean(description) && `${id}-description`)} />
  </div>;
});

export const SupportingCharacterCount = forwardRef<HTMLOutputElement, CharacterCountProps>(function SupportingCharacterCount({
  value = "", count, max, mode = "count", label = "Characters", overLimitLabel = "Over limit", className, ...props
}, ref) {
  const current = count ?? [...value].length;
  if (!Number.isInteger(current) || current < 0 || max !== undefined && (!Number.isInteger(max) || max < 0)) throw new Error("Flood CharacterCount requires nonnegative integer counts and limits");
  const over = max !== undefined && current > max, number = new Intl.NumberFormat(props.lang);
  const text = mode === "remaining" && max !== undefined ? number.format(max - current) : max === undefined ? number.format(current) : `${number.format(current)} / ${number.format(max)}`;
  return <output {...props} ref={ref} aria-live={props["aria-live"] ?? "off"} className={cx("flood-character-count", className)} data-over-limit={over || undefined}
    aria-label={props["aria-label"] ?? `${label}: ${text}${over ? `. ${overLimitLabel}` : ""}`}><span>{text}</span>{over && <span className="flood-character-count__warning">{overLimitLabel}</span>}</output>;
});
