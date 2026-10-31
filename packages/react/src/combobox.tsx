import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { Input, InputGroup, IconButton, ScrollArea, Tag, Button, type ComboboxProps, type InputProps, type ComboboxOption } from "./index.js";
import { mergeDescriptions, resolveFieldStatus } from "./field-state.js";
import { positionLayer, registerLayer } from "./overlay-runtime.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const searchable = (text: string) => text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();

interface SearchSelectionProps extends Omit<ComboboxProps, "value" | "defaultValue" | "onValueChange"> {
  selectedValues?: readonly string[];
  initialValues: readonly string[];
  onSelectionChange?: (value: string[]) => void;
  multiple?: boolean;
  freeText?: boolean;
  textValue?: string;
  initialText?: string;
  onTextChange?: (text: string) => void;
  onOptionSelect?: (option: ComboboxOption) => void;
  removeItemLabel?: string;
}

/** Shared search/layer model. Public single and multiple value contracts stay distinct. */
export const SearchSelection = /* @__PURE__ */ forwardRef<HTMLInputElement, SearchSelectionProps>(function SearchSelection({
  options, selectedOptions = [], query: controlledQuery, onQueryChange, filtering = "local", optionsQuery, loadState = "ready",
  loadingMessage = "Loading options…", errorMessage = "Could not load options.", onRetry, retryLabel = "Try again",
  freeText = false, textValue, initialText = "", onTextChange, onOptionSelect,
  selectedValues: value, initialValues: defaultValue, onSelectionChange: onValueChange, multiple = false, removeItemLabel = "Remove", clearable = false,
  emptyMessage = "No results found.", listLabel = "Options", toggleLabel = "Show options",
  clearLabel = "Clear selection", invalidSelectionMessage = "Select an option.",
  controlSize = "md", readOnly, disabled, required, name, id: explicitId,
  className, onKeyDown, onBlur, onClick, onInvalid, autoComplete = "off", ...props
}, forwardedRef) {
  if (new Set(options.map(option => option.value)).size !== options.length || options.some(option => !option.value || !option.label.trim())) throw new Error("Flood Combobox options need unique nonempty values and labels");
  if (![emptyMessage, listLabel, toggleLabel, clearLabel, invalidSelectionMessage, loadingMessage, errorMessage, retryLabel].every(text => text.trim())) throw new Error("Flood Combobox messages and action labels must be nonempty");
  if (new Set(selectedOptions.map(option=>option.value)).size!==selectedOptions.length || selectedOptions.some(option=>!option.value||!option.label.trim())) throw new Error("Flood selectedOptions requires unique named records");
  for (const values of [defaultValue, value]) if (values !== undefined && (!Array.isArray(values) || new Set(values).size !== values.length || values.some(item => typeof item !== "string" || !item))) throw new Error("Flood selection values must be unique nonempty strings");
  if (multiple && !removeItemLabel.trim()) throw new Error("Flood MultiSelect requires an accessible removal label");
  if (filtering === "manual" && ((freeText ? textValue : controlledQuery) === undefined || optionsQuery === undefined)) throw new Error("Flood manual search requires controlled text/query and optionsQuery");
  const generatedId = useId(), id = explicitId ?? `flood-combobox-${generatedId}`;
  const menuId = `${id}-options`, validationId = `${id}-validation`;
  const input = useRef<HTMLInputElement>(null), root = useRef<HTMLDivElement>(null), panel = useRef<HTMLDivElement>(null), viewport = useRef<HTMLDivElement>(null);
  useImperativeHandle(forwardedRef, () => input.current!, []);
  const initial = useRef([...defaultValue]), initialFreeText = useRef(initialText);
  const [local, setLocal] = useState(() => [...defaultValue]), [draftQuery, setDraftQuery] = useState<string | null>(null);
  const [localText, setLocalText] = useState(initialText);
  const text = textValue ?? localText;
  const query = freeText ? text : draftQuery === null ? null : controlledQuery ?? draftQuery;
  const setQuery = (next: string | null) => { setDraftQuery(next); if (!freeText && next !== null) onQueryChange?.(next); };
  const publishText = (next: string) => { if (textValue === undefined) setLocalText(next); if (next !== text) onTextChange?.(next); };
  const [open, setOpen] = useState(false), [activeValue, setActiveValue] = useState<string>();
  const [validation, setValidation] = useState("");
  const selections = (value ?? local).map(id => selectedOptions.find(option => option.value === id) ?? options.find(option => option.value === id)).filter((option): option is ComboboxOption => Boolean(option));
  const selected = selections[0], selectedIds = selections.map(option => option.value);
  const displayed = freeText ? text : query ?? (multiple ? "" : selected?.label ?? "");
  const resultQuery = freeText ? text : controlledQuery ?? draftQuery ?? "";
  const pending = loadState === "loading" || (filtering === "manual" && optionsQuery !== resultQuery);
  const failed = loadState === "error" && !pending;
  const resultMessage = pending ? loadingMessage : failed ? errorMessage : emptyMessage;
  const filtered = pending || failed ? [] : filtering === "manual" || query === null ? options : options.filter(option => searchable([option.label, ...(option.keywords ?? [])].join(" ")).includes(searchable(query)));
  const enabled = filtered.filter(option => !option.disabled);
  const groups: Array<{label?:string; options:ComboboxOption[]}> = [];
  for (const option of filtered) {
    const previous = groups.at(-1);
    if (previous && previous.label === option.group) previous.options.push(option);
    else groups.push({label:option.group, options:[option]});
  }
  const active = enabled.find(option => option.value === activeValue) ?? enabled[0];
  const optionId = (optionValue: string) => `${menuId}-${options.findIndex(option => option.value === optionValue)}`;
  const current = useRef({ value, textValue, selected, readOnly, disabled });
  current.current = { value, textValue, selected, readOnly, disabled };
  const close = () => {
    if (panel.current?.contains(panel.current.ownerDocument.activeElement)) input.current?.focus({preventScroll:true});
    setOpen(false); setQuery(null);
  };
  const inert = () => Boolean(readOnly || disabled || input.current?.matches(":disabled"));
  const publish = (next: string[]) => {
    if (value === undefined) setLocal(next);
    if (next.length !== selectedIds.length || next.some((id, index) => id !== selectedIds[index])) onValueChange?.([...next]);
    setValidation("");
  };
  const remove = (id: string) => {
    if (inert() || selections.find(option => option.value === id)?.disabled) return;
    publish(selectedIds.filter(value => value !== id)); input.current?.focus({ preventScroll: true });
  };
  const select = (next: string) => {
    if (inert() || (next !== "" && !filtered.some(option => option.value === next && !option.disabled))) return;
    if (freeText) {
      const option = filtered.find(option => option.value === next);
      publishText(option?.label ?? ""); if (option) onOptionSelect?.(option);
      close(); input.current?.focus({preventScroll:true}); return;
    }
    if (multiple) {
      publish(next === "" ? selections.filter(option => option.disabled).map(option => option.value) : selectedIds.includes(next) ? selectedIds.filter(id => id !== next) : [...selectedIds, next]);
      if (next) { setQuery(""); setActiveValue(next); setOpen(true); } else close();
    } else { publish(next ? [next] : []); close(); }
    input.current?.focus({ preventScroll: true });
  };
  const show = () => {
    if (inert()) return;
    setActiveValue(selected?.value); setOpen(true);
  };
  useBrowserLayoutEffect(() => {
    const control = input.current;
    control?.setCustomValidity(!freeText && required && !selections.length ? invalidSelectionMessage : "");
    if (validation && control?.validity.valid) setValidation("");
  });
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const reset = (event: Event) => {
      // React may cancel reset in its delegated handler after this native listener.
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (event.defaultPrevented || !input.current) return;
        if (current.current.value === undefined) setLocal(initial.current);
        if (current.current.textValue === undefined) setLocalText(initialFreeText.current);
        setQuery(null); setOpen(false); setValidation("");
      }, 0);
      timers.add(timer);
    };
    form.addEventListener("reset", reset);
    return () => { form.removeEventListener("reset", reset); timers.forEach(clearTimeout); };
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
      unregister = registerLayer(document, { panel: popup, anchor: () => anchor, close });
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
  }, [open, active?.value, query, options]);
  const glyph = (clear: boolean) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{clear ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="m6 9 6 6 6-6" />}</svg>;
  const inputProps: InputProps & {type:"text"} = {
    ...props, id, type:"text", value:displayed, name:freeText ? name : undefined, disabled, readOnly, required:required && (!multiple || !selections.length), controlSize, autoComplete,
    role:"combobox", "aria-autocomplete":"list", "aria-haspopup":"listbox", "aria-expanded":open, "aria-controls":open ? menuId : undefined,
    "aria-required":required || undefined, "aria-activedescendant":open && active ? optionId(active.value) : undefined,
    "aria-describedby":mergeDescriptions(props["aria-describedby"], validation && validationId, multiple && Boolean(selections.length) && `${id}-selection`),
    invalid:props.invalid || Boolean(validation),
    onChange:event => {
        if (inert()) return;
        const text = event.currentTarget.value; if (freeText) publishText(text); else setQuery(text); setActiveValue(undefined); setOpen(true); setValidation("");
        if (!freeText && !multiple && text === "" && selected) publish([]);
      },
      onClick:event => { onClick?.(event); if (!event.defaultPrevented) show(); },
      onBlur:event => {
        onBlur?.(event);
        if (event.defaultPrevented || root.current?.contains(event.relatedTarget as Node)) return;
        close();
      },
      onInvalid:event => { onInvalid?.(event); if (!event.defaultPrevented) setValidation(event.currentTarget.validationMessage); },
      onKeyDown:event => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
        // The composite owns Backspace; readonly selection must not become browser Back.
        if (multiple && readOnly && event.key === "Backspace") event.preventDefault();
        if (inert()) return;
        const rtl = event.currentTarget.ownerDocument.defaultView?.getComputedStyle(event.currentTarget).direction === "rtl";
        if (multiple && event.key === "Backspace" && displayed === "") {
          const last = [...selections].reverse().find(option => !option.disabled);
          if (last) { event.preventDefault(); remove(last.value); }
        } else if (multiple && event.key === (rtl ? "ArrowRight" : "ArrowLeft") && event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0) {
          const buttons = root.current?.querySelectorAll<HTMLButtonElement>(".flood-tag__remove:not(:disabled)");
          if (buttons?.length) { event.preventDefault(); buttons[buttons.length - 1].focus(); }
        } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          if (!open) { setActiveValue(event.key === "ArrowUp" ? enabled.at(-1)?.value : selected?.value ?? enabled[0]?.value); setOpen(true); }
          else { const index = enabled.findIndex(option => option.value === active?.value); const next = (index + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length; setActiveValue(enabled[next]?.value); }
        } else if (event.key === "Enter" && open) { if (!freeText || active) event.preventDefault(); if (active) select(active.value); else close(); }
        else if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
        else if (event.key === "Tab" && !(failed && onRetry && !event.shiftKey)) close();
      },
  };
  const removable = selections.some(option => !option.disabled);
  const actions = <span className="flood-combobox__actions">
        {clearable && <IconButton label={clearLabel} variant="ghost" size={controlSize} className={!(freeText ? text : selected) ? "flood-combobox__clear-empty" : undefined} disabled={disabled || readOnly || !(freeText ? text : selected) || (multiple && !removable)} aria-hidden={!(freeText ? text : selected) || undefined} tabIndex={-1}
          onPointerDown={event => event.preventDefault()} onClick={() => select("")}>{glyph(true)}</IconButton>}
        <IconButton label={toggleLabel} variant="ghost" size={controlSize} disabled={disabled || readOnly} tabIndex={-1} aria-expanded={open} aria-controls={open ? menuId : undefined}
          onPointerDown={event => event.preventDefault()} onClick={() => { if (open) close(); else show(); input.current?.focus({ preventScroll: true }); }}>{glyph(false)}</IconButton>
      </span>;
  return <div className={multiple ? "flood-combobox flood-multi-select" : "flood-combobox"} ref={root} hidden={props.hidden} dir={props.dir} lang={props.lang}>
    {multiple ? <div className={["flood-input-group", "flood-multi-select__control", `flood-control--${controlSize}`, className].filter(Boolean).join(" ")} style={props.style}
      data-disabled={disabled || undefined} data-readonly={readOnly || undefined} data-status={resolveFieldStatus(props.status, props.invalid || Boolean(validation), props["aria-invalid"])}
      onClick={event => { if (event.target === event.currentTarget && !inert()) { input.current?.focus(); show(); } }}>
      {selections.map(option => <Tag key={option.value} size={controlSize === "sm" ? "sm" : controlSize === "md" ? "md" : "lg"} disabled={disabled || option.disabled}
        onRemove={readOnly ? undefined : () => remove(option.value)} removeLabel={`${removeItemLabel} ${option.label}`}
        removeButtonProps={{tabIndex:-1,onKeyDown:event => {
          if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing || inert()) return;
          const rtl = event.currentTarget.ownerDocument.defaultView?.getComputedStyle(event.currentTarget).direction === "rtl";
          const buttons = [...root.current!.querySelectorAll<HTMLButtonElement>(".flood-tag__remove:not(:disabled)")];
          const index = buttons.indexOf(event.currentTarget);
          if (event.key === "Backspace" || event.key === "Delete") { event.preventDefault(); remove(option.value); }
          else if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); input.current?.focus(); }
          else if (event.key === (rtl ? "ArrowLeft" : "ArrowRight")) { event.preventDefault(); (buttons[index + 1] ?? input.current)?.focus(); }
          else if (event.key === (rtl ? "ArrowRight" : "ArrowLeft")) { event.preventDefault(); (buttons[Math.max(0,index - 1)])?.focus(); }
        }}}>{option.label}</Tag>)}
      <div className="flood-multi-select__editor">
        <Input {...inputProps} ref={input} style={undefined} />
        {actions}
      </div>
    </div> : <InputGroup {...inputProps} ref={input} className={["flood-combobox__control", className].filter(Boolean).join(" ")} end={actions} />}
    {!freeText && (multiple ? selections : [selected]).map((option, index) => <input key={option?.value ?? index} type="hidden" name={name} value={option?.value ?? ""} disabled={disabled} form={props.form} />)}
    {multiple && Boolean(selections.length) && <span id={`${id}-selection`} className="flood-visually-hidden">{selections.map(option => option.label).join(", ")}</span>}
    {open && <div ref={panel} popover="manual" className="flood-select__menu flood-combobox__menu"
      onPointerDown={event => { if (event.pointerType === "mouse") event.preventDefault(); }}>
      <ScrollArea ref={viewport} id={menuId} role="listbox" aria-label={listLabel} aria-busy={pending || undefined} aria-multiselectable={multiple || undefined} orientation="vertical" tabIndex={-1} className="flood-select__viewport">
        {!filtered.length && <div className="flood-select__empty" role="option" aria-disabled="true" aria-selected="false">{resultMessage}</div>}
        {groups.map((group,index) => <div key={index} role={group.label ? "group" : "presentation"} aria-label={group.label}>
          {group.label && <div className="flood-select__group" aria-hidden="true">{group.label}</div>}
          {group.options.map(option => <div key={option.value} id={optionId(option.value)} role="option" aria-selected={selectedIds.includes(option.value)} aria-disabled={option.disabled || undefined}
          className="flood-select__option" data-active={option.value === active?.value || undefined}
          onPointerMove={event => { if (event.pointerType === "mouse" && !option.disabled) setActiveValue(option.value); }}
          onPointerDown={event => {
            // Touch must retain its compatibility click and native scrolling.
            if (event.pointerType === "mouse") event.preventDefault();
          }}
          onMouseDown={event => event.preventDefault()} onClick={() => select(option.value)}>
          <span className="flood-combobox__option-text"><span>{option.label}</span>{option.description && <span className="flood-combobox__description">{option.description}</span>}</span>
          <span className="flood-select__selected" aria-hidden="true">{selectedIds.includes(option.value) ? "✓" : ""}</span>
        </div>)}</div>)}
      </ScrollArea>
      {failed && onRetry && <Button variant="subtle" size="sm" onClick={() => {input.current?.focus({preventScroll:true}); onRetry();}} onBlur={event => {if (!root.current?.contains(event.relatedTarget as Node)) close();}}>{retryLabel}</Button>}
    </div>}
    {open && !filtered.length && <span className="flood-visually-hidden" role="status">{resultMessage}</span>}
    {validation && <span id={validationId} className="flood-select__validation" role="alert">{validation}</span>}
  </div>;
});
