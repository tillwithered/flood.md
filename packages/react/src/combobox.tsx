import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { InputGroup, IconButton, ScrollArea, type ComboboxProps } from "./index.js";
import { mergeDescriptions } from "./field-state.js";
import { positionLayer, registerLayer } from "./overlay-runtime.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const searchable = (text: string) => text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();

/** Editable input plus a single-choice list. Search text is never a submitted value. */
export const SearchSelection = forwardRef<HTMLInputElement, ComboboxProps>(function SearchSelection({
  options, value, defaultValue = "", onValueChange, clearable = true,
  emptyMessage = "No results found.", listLabel = "Options", toggleLabel = "Show options",
  clearLabel = "Clear selection", invalidSelectionMessage = "Select an option.",
  controlSize = "md", readOnly, disabled, required, name, id: explicitId,
  className, onKeyDown, onBlur, onClick, onInvalid, autoComplete = "off", ...props
}, forwardedRef) {
  if (new Set(options.map(option => option.value)).size !== options.length || options.some(option => !option.value || !option.label.trim())) throw new Error("Flood Combobox options need unique nonempty values and labels");
  if (![emptyMessage, listLabel, toggleLabel, clearLabel, invalidSelectionMessage].every(text => text.trim())) throw new Error("Flood Combobox messages and action labels must be nonempty");
  const generatedId = useId(), id = explicitId ?? `flood-combobox-${generatedId}`;
  const menuId = `${id}-options`, validationId = `${id}-validation`;
  const input = useRef<HTMLInputElement>(null), root = useRef<HTMLDivElement>(null), panel = useRef<HTMLDivElement>(null), viewport = useRef<HTMLDivElement>(null);
  useImperativeHandle(forwardedRef, () => input.current!, []);
  const initial = useRef(defaultValue);
  const [local, setLocal] = useState(defaultValue), [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false), [activeValue, setActiveValue] = useState<string>();
  const [validation, setValidation] = useState("");
  const selected = options.find(option => option.value === (value ?? local));
  const displayed = query ?? selected?.label ?? "";
  const filtered = query === null ? options : options.filter(option => searchable([option.label, ...(option.keywords ?? [])].join(" ")).includes(searchable(query)));
  const enabled = filtered.filter(option => !option.disabled);
  const active = enabled.find(option => option.value === activeValue) ?? enabled[0];
  const optionId = (optionValue: string) => `${menuId}-${options.findIndex(option => option.value === optionValue)}`;
  const current = useRef({ value, selected, readOnly, disabled });
  current.current = { value, selected, readOnly, disabled };
  const close = () => { setOpen(false); setQuery(null); };
  const inert = () => Boolean(readOnly || disabled || input.current?.matches(":disabled"));
  const select = (next: string) => {
    if (inert() || (next !== "" && !options.some(option => option.value === next && !option.disabled))) return;
    if (value === undefined) setLocal(next);
    if (next !== (selected?.value ?? "")) onValueChange?.(next);
    setValidation(""); close(); input.current?.focus({ preventScroll: true });
  };
  const show = () => {
    if (inert()) return;
    setActiveValue(selected?.value); setOpen(true);
  };
  useBrowserLayoutEffect(() => {
    input.current?.setCustomValidity(required && !selected ? invalidSelectionMessage : "");
  }, [required, selected?.value, invalidSelectionMessage]);
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const reset = (event: Event) => queueMicrotask(() => {
      if (event.defaultPrevented) return;
      if (current.current.value === undefined) setLocal(initial.current);
      setQuery(null); setOpen(false); setValidation("");
    });
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [props.form]);
  useEffect(() => {
    const control = input.current, Observer = control?.ownerDocument.defaultView?.MutationObserver;
    if (!control || !Observer) return;
    const observer = new Observer(() => { if (control.matches(":disabled")) { setOpen(false); setQuery(null); } });
    let parent = control.parentElement;
    while (parent) { if (parent.localName === "fieldset") observer.observe(parent, { attributes: true, attributeFilter: ["disabled"] }); parent = parent.parentElement; }
    return () => observer.disconnect();
  }, []);
  useEffect(() => { if (disabled || readOnly || props.hidden) { setOpen(false); setQuery(null); } }, [disabled, readOnly, props.hidden]);
  useBrowserLayoutEffect(() => {
    if (!open || !panel.current || !root.current || !input.current) return;
    const popup = panel.current, anchor = root.current, control = input.current;
    const document = popup.ownerDocument, view = document.defaultView!;
    let alive = true, frame = 0, unregister = () => {};
    const assign = (element: HTMLElement, property: string, value: string) => { if (element.style.getPropertyValue(property) !== value) element.style.setProperty(property, value); };
    const update = () => {
      if (!alive) return;
      if (!anchor.isConnected || !anchor.getClientRects().length || control.matches(":disabled")) { setOpen(false); setQuery(null); return; }
      const rect = anchor.getBoundingClientRect(), visual = view.visualViewport;
      const rootSize = parseFloat(view.getComputedStyle(document.documentElement).fontSize);
      const length = (name: string) => { const raw = view.getComputedStyle(control).getPropertyValue(name).trim(); return parseFloat(raw) * (raw.endsWith("rem") ? rootSize : 1); };
      const gap = length("--flood-sys-space-2") || 0;
      const width = visual?.width ?? view.innerWidth, height = visual?.height ?? view.innerHeight, top = visual?.offsetTop ?? 0;
      const room = Math.max(top + height - rect.bottom - gap * 2, rect.top - top - gap * 2);
      const maxHeight = Math.min(length("--flood-sys-control-md-height") * 8, Math.max(0, room));
      assign(popup, "width", `${Math.min(rect.width, Math.max(0, width - gap * 2))}px`);
      assign(popup, "max-height", `${maxHeight}px`);
      assign(popup, "column-gap", "var(--flood-sys-space-2)");
      const css = view.getComputedStyle(popup);
      const inset = parseFloat(css.paddingTop) + parseFloat(css.paddingBottom) + parseFloat(css.borderTopWidth) + parseFloat(css.borderBottomWidth);
      if (viewport.current) assign(viewport.current, "max-height", `${Math.max(0, maxHeight - inset)}px`);
      positionLayer(anchor, popup, "bottom", "start");
      frame = view.requestAnimationFrame(update);
    };
    const start = () => {
      if (!alive) return;
      const dialog = anchor.closest("dialog");
      if (dialog && !dialog.open) { frame = view.requestAnimationFrame(start); return; }
      if (typeof popup.showPopover !== "function") throw new Error("Flood Combobox requires the native Popover API");
      popup.style.visibility = "hidden"; popup.showPopover(); update();
      unregister = registerLayer(document, { panel: popup, anchor: () => anchor, close: () => { setOpen(false); setQuery(null); } });
    };
    const toggle = (event: Event) => { if (alive && (event as ToggleEvent).newState === "closed" && !popup.matches(":popover-open")) { setOpen(false); setQuery(null); } };
    popup.addEventListener("toggle", toggle); start();
    return () => { alive = false; view.cancelAnimationFrame(frame); unregister(); popup.removeEventListener("toggle", toggle); if (popup.matches(":popover-open")) popup.hidePopover(); };
  }, [open]);
  useEffect(() => {
    if (!open || !active || !viewport.current) return;
    const option = panel.current?.ownerDocument.getElementById(optionId(active.value));
    if (!option) return;
    const area = viewport.current, a = option.getBoundingClientRect(), b = area.getBoundingClientRect();
    if (a.top < b.top) area.scrollTop -= b.top - a.top;
    else if (a.bottom > b.bottom) area.scrollTop += a.bottom - b.bottom;
  }, [open, active?.value, query]);
  const glyph = (clear: boolean) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{clear ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="m6 9 6 6 6-6" />}</svg>;
  return <div className="flood-combobox" ref={root} hidden={props.hidden} dir={props.dir} lang={props.lang}>
    <InputGroup {...props} ref={input} id={id} type="text" value={displayed} disabled={disabled} readOnly={readOnly} required={required} controlSize={controlSize}
      autoComplete={autoComplete} role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? menuId : undefined}
      aria-activedescendant={open && active ? optionId(active.value) : undefined}
      aria-describedby={mergeDescriptions(props["aria-describedby"], validation && validationId)}
      invalid={props.invalid || Boolean(validation)} className={["flood-combobox__control", className].filter(Boolean).join(" ")}
      onChange={event => {
        if (inert()) return;
        const text = event.currentTarget.value; setQuery(text); setActiveValue(undefined); setOpen(true); setValidation("");
        if (text === "" && selected) { if (value === undefined) setLocal(""); onValueChange?.(""); }
      }}
      onClick={event => { onClick?.(event); if (!event.defaultPrevented) show(); }}
      onBlur={event => {
        onBlur?.(event);
        if (event.defaultPrevented || root.current?.contains(event.relatedTarget as Node)) return;
        close();
      }}
      onInvalid={event => { onInvalid?.(event); if (!event.defaultPrevented) setValidation(event.currentTarget.validationMessage); }}
      onKeyDown={event => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing || inert()) return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          if (!open) { setActiveValue(event.key === "ArrowUp" ? enabled.at(-1)?.value : selected?.value ?? enabled[0]?.value); setOpen(true); }
          else { const index = enabled.findIndex(option => option.value === active?.value); const next = (index + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length; setActiveValue(enabled[next]?.value); }
        } else if (event.key === "Enter" && open) { event.preventDefault(); if (active) select(active.value); }
        else if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
        else if (event.key === "Tab") close();
      }}
      end={<span className="flood-combobox__actions">
        {clearable && <IconButton label={clearLabel} variant="ghost" size={controlSize} className={!selected ? "flood-combobox__clear-empty" : undefined} disabled={disabled || readOnly || !selected} aria-hidden={!selected || undefined} tabIndex={-1}
          onPointerDown={event => event.preventDefault()} onClick={() => select("")}>{glyph(true)}</IconButton>}
        <IconButton label={toggleLabel} variant="ghost" size={controlSize} disabled={disabled || readOnly} tabIndex={-1} aria-expanded={open} aria-controls={open ? menuId : undefined}
          onPointerDown={event => event.preventDefault()} onClick={() => { if (open) close(); else show(); input.current?.focus({ preventScroll: true }); }}>{glyph(false)}</IconButton>
      </span>} />
    <input type="hidden" name={name} value={selected?.value ?? ""} disabled={disabled} form={props.form} />
    {open && <div ref={panel} popover="manual" className="flood-select__menu flood-combobox__menu"
      onPointerDown={event => { if (event.pointerType === "mouse") event.preventDefault(); }}>
      <ScrollArea ref={viewport} id={menuId} role="listbox" aria-label={listLabel} orientation="vertical" tabIndex={-1} className="flood-select__viewport">
        {!filtered.length && <div className="flood-select__empty" role="option" aria-disabled="true" aria-selected="false">{emptyMessage}</div>}
        {filtered.map(option => <div key={option.value} id={optionId(option.value)} role="option" aria-selected={option.value === selected?.value} aria-disabled={option.disabled || undefined}
          className="flood-select__option" data-active={option.value === active?.value || undefined}
          onPointerMove={event => { if (event.pointerType === "mouse" && !option.disabled) setActiveValue(option.value); }}
          onPointerDown={event => event.preventDefault()} onClick={() => select(option.value)}>
          <span className="flood-combobox__option-text"><span>{option.label}</span>{option.description && <span className="flood-combobox__description">{option.description}</span>}</span>
          <span className="flood-select__selected" aria-hidden="true">{selected?.value === option.value ? "✓" : ""}</span>
        </div>)}
      </ScrollArea>
    </div>}
    {open && !filtered.length && <span className="flood-visually-hidden" role="status">{emptyMessage}</span>}
    {validation && <span id={validationId} className="flood-select__validation" role="alert">{validation}</span>}
  </div>;
});
