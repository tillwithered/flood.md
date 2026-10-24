import {
  Children, Fragment, forwardRef, isValidElement, useEffect, useId,
  useImperativeHandle, useLayoutEffect, useRef, useState,
  type ChangeEvent, type ReactNode,
} from "react";
import type { SelectProps } from "./index.js";
import { OverlayScrollArea } from "./scroll-area.js";

interface Choice { value: string; label: string; disabled: boolean; hidden: boolean; group?: string }
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const text = (children: ReactNode): string => Children.toArray(children).map((child) => typeof child === "string" || typeof child === "number" ? String(child) : isValidElement<{ children?: ReactNode }>(child) ? text(child.props.children) : "").join("");
function initialChoices(children: ReactNode, group?: string, groupDisabled = false, groupHidden = false): Choice[] {
  return Children.toArray(children).flatMap((child): Choice[] => {
    if (!isValidElement<{ children?: ReactNode; value?: string | number; label?: string; disabled?: boolean; hidden?: boolean }>(child)) return [];
    if (child.type === Fragment) return initialChoices(child.props.children, group, groupDisabled, groupHidden);
    if (child.type === "optgroup") return initialChoices(child.props.children, child.props.label, groupDisabled || Boolean(child.props.disabled), groupHidden || Boolean(child.props.hidden));
    if (child.type !== "option") return [];
    const label = text(child.props.children);
    return [{ value: String(child.props.value ?? label), label: child.props.label ?? label, disabled: groupDisabled || Boolean(child.props.disabled), hidden: groupHidden || Boolean(child.props.hidden), group }];
  });
}

/** Internal implementation. The public entry retains the native SelectProps/ref contract. */
export const SingleSelect = forwardRef<HTMLSelectElement, SelectProps>(function SingleSelect({
  children, value, defaultValue, onChange, onInvalid, onFocus, onBlur, onKeyDown, onKeyUp, onClick,
  disabled, required, id, className, style, title, autoFocus, invalid, controlSize = "md",
  "aria-label": ariaLabel, "aria-labelledby": labelledBy, "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid, ...nativeProps
}, forwardedRef) {
  const generatedId = useId();
  const triggerId = id ?? `flood-select-${generatedId}`;
  const menuId = `${triggerId}-options`, validationId = `${triggerId}-validation`;
  const native = useRef<HTMLSelectElement>(null), trigger = useRef<HTMLButtonElement>(null), menu = useRef<HTMLDivElement>(null);
  const scrollViewport = useRef<HTMLDivElement>(null);
  const [choices, setChoices] = useState(() => initialChoices(children));
  const [selected, setSelected] = useState(() => String(defaultValue ?? initialChoices(children).find((choice) => !choice.disabled && !choice.hidden)?.value ?? ""));
  const [open, setOpen] = useState(false), [active, setActive] = useState(-1);
  const [validation, setValidation] = useState("");
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 0, viewportHeight: 0 });
  const controlled = value !== undefined;
  const currentValue = controlled ? String(value) : selected;
  const current = useRef({ controlled, value: currentValue });
  current.current = { controlled, value: currentValue };
  const search = useRef({ value: "", time: 0 });
  useImperativeHandle(forwardedRef, () => native.current!, []);

  function readChoices(): Choice[] {
    if (!native.current) return choices;
    return Array.from(native.current.options).map((option) => {
      const parent = option.parentElement;
      const group = parent?.tagName === "OPTGROUP" ? parent as HTMLOptGroupElement : undefined;
      return { value: option.value, label: option.label, disabled: option.disabled || Boolean(group?.disabled), hidden: Boolean(option.hidden) || Boolean(group?.hidden), group: group?.label };
    });
  }
  useBrowserLayoutEffect(() => {
    setChoices(readChoices());
    if (!controlled && native.current) setSelected(native.current.value);
  }, [children, value]);
  useBrowserLayoutEffect(() => {
    const control = native.current;
    if (!control) return;
    const focus = control.focus;
    control.focus = (options) => trigger.current?.focus(options);
    return () => { control.focus = focus; };
  }, []);
  useEffect(() => { if (autoFocus) trigger.current?.focus(); }, [autoFocus]);
  useEffect(() => {
    const form = native.current?.form;
    if (!form) return;
    const reset = (event: Event) => setTimeout(() => {
      if (event.defaultPrevented || !native.current) return;
      if (current.current.controlled) native.current.value = current.current.value;
      else setSelected(native.current.value);
      setChoices(readChoices()); setValidation(""); setOpen(false);
    }, 0);
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [nativeProps.form]);
  useEffect(() => {
    const observer = new MutationObserver(() => { if (trigger.current?.matches(":disabled")) setOpen(false); });
    let parent = trigger.current?.parentElement;
    while (parent) { if (parent.tagName === "FIELDSET") observer.observe(parent, { attributes: true, attributeFilter: ["disabled"] }); parent = parent.parentElement; }
    return () => observer.disconnect();
  }, []);
  useEffect(() => { if (disabled || nativeProps.hidden) setOpen(false); }, [disabled, nativeProps.hidden]);

  function enabled(choice: Choice) { return !choice.disabled && !choice.hidden; }
  function openMenu(index?: number) {
    if (trigger.current?.matches(":disabled")) return;
    const fresh = readChoices(); setChoices(fresh);
    const nativeValue = !current.current.controlled && native.current ? native.current.value : current.current.value;
    if (!current.current.controlled) setSelected(nativeValue);
    const selectedIndex = fresh.findIndex((choice) => choice.value === nativeValue && enabled(choice));
    setActive(index ?? (selectedIndex >= 0 ? selectedIndex : fresh.findIndex(enabled)));
    search.current = { value: "", time: 0 }; setOpen(true);
  }
  function commit(index: number) {
    const choice = choices[index], control = native.current;
    if (!choice || !enabled(choice) || !control || trigger.current?.matches(":disabled")) { setOpen(false); return; }
    if (choice.value !== control.value) {
      control.value = choice.value;
      control.dispatchEvent(new Event("input", { bubbles: true }));
      control.dispatchEvent(new Event("change", { bubbles: true }));
    }
    setOpen(false);
  }
  function change(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.currentTarget.value;
    onChange?.(event);
    if (!current.current.controlled) setSelected(next);
    queueMicrotask(() => {
      if (!native.current) return;
      if (current.current.controlled) native.current.value = current.current.value;
      if (native.current.validity.valid) setValidation("");
    });
  }
  // Native callbacks receive events dispatched on the actual select, never a cast button event.
  function mirror(event: Event) { return native.current?.dispatchEvent(event) ?? true; }
  function navigate(delta: number) {
    const fresh = readChoices();
    if (!open) { openMenu(); return; }
    let index = active;
    for (let step = 0; step < fresh.length; step++) {
      const next = index + delta;
      if (next < 0 || next >= fresh.length) break;
      index = next;
      if (enabled(fresh[index])) { setActive(index); break; }
    }
  }
  useBrowserLayoutEffect(() => {
    if (!open || !menu.current || !trigger.current) return;
    const popup = menu.current, button = trigger.current;
    if (typeof popup.showPopover === "function" && !popup.matches(":popover-open")) popup.showPopover();
    const rect = button.getBoundingClientRect();
    const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const length = (name: string) => { const raw = getComputedStyle(button).getPropertyValue(name).trim(); return parseFloat(raw) * (raw.endsWith("rem") ? rootSize : 1); };
    const gap = length("--flood-sys-space-2") || 0;
    const below = Math.max(0, innerHeight - rect.bottom - gap * 2), above = Math.max(0, rect.top - gap * 2);
    const maxHeight = Math.min(length("--flood-sys-control-md-height") * 8, Math.max(below, above));
    const width = Math.min(rect.width, Math.max(0, innerWidth - gap * 2));
    popup.style.width = `${width}px`;
    popup.style.maxHeight = `${maxHeight}px`;
    const popupStyle = getComputedStyle(popup);
    const inset = parseFloat(popupStyle.paddingTop) + parseFloat(popupStyle.paddingBottom) + parseFloat(popupStyle.borderTopWidth) + parseFloat(popupStyle.borderBottomWidth);
    const viewportHeight = Math.max(0, maxHeight - inset);
    if (scrollViewport.current) scrollViewport.current.style.maxHeight = `${viewportHeight}px`;
    const height = popup.getBoundingClientRect().height;
    const top = below >= height || below >= above ? rect.bottom + gap : Math.max(gap, rect.top - gap - height);
    setPosition({ left: Math.max(gap, Math.min(rect.left, innerWidth - gap - width)), top, width, maxHeight, viewportHeight });
  }, [open, choices]);
  useEffect(() => {
    if (!open || (choices[active] && enabled(choices[active]))) return;
    const selectedIndex = choices.findIndex((choice) => choice.value === currentValue && enabled(choice));
    setActive(selectedIndex >= 0 ? selectedIndex : choices.findIndex(enabled));
  }, [choices, open, active, currentValue]);
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>(`[data-option-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !trigger.current?.contains(event.target) && !menu.current?.contains(event.target)) setOpen(false); };
    const scroll = (event: Event) => { if (event.target instanceof Node && menu.current?.contains(event.target)) return; setOpen(false); };
    const resize = () => setOpen(false);
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("scroll", scroll, true);
    window.addEventListener("resize", resize);
    return () => { document.removeEventListener("pointerdown", outside, true); document.removeEventListener("scroll", scroll, true); window.removeEventListener("resize", resize); };
  }, [open]);

  const displayed = choices.find((choice) => choice.value === currentValue)?.label ?? "Select an option";
  const descriptions = [describedBy, validation && validationId].filter(Boolean).join(" ") || undefined;
  const visibleAttributes = Object.fromEntries(Object.entries(nativeProps).filter(([key]) => key.startsWith("data-") || key.startsWith("aria-")));
  const nativeAttributes = Object.fromEntries(Object.entries(nativeProps).filter(([key]) => !key.startsWith("data-") && !key.startsWith("aria-") && !["tabIndex", "accessKey", "dir", "lang", "hidden"].includes(key)));
  const groups: Array<{ label?: string; items: Array<{ choice: Choice; index: number }> }> = [];
  choices.forEach((choice, index) => {
    if (choice.hidden) return;
    const previous = groups[groups.length - 1];
    if (previous && previous.label === choice.group) previous.items.push({ choice, index });
    else groups.push({ label: choice.group, items: [{ choice, index }] });
  });
  const renderOption = ({ choice, index }: { choice: Choice; index: number }) => <div key={`${index}-${choice.value}`}
    id={`${menuId}-${index}`} role="option" aria-selected={choice.value === currentValue} aria-disabled={choice.disabled || undefined}
    className="flood-select__option" data-active={index === active || undefined} data-option-index={index}
    onPointerDown={(event) => event.preventDefault()} onPointerMove={() => { if (enabled(choice)) setActive(index); }}
    onClick={() => { if (enabled(choice)) { commit(index); trigger.current?.focus(); } }}>
    <span>{choice.label}</span><span className="flood-select__selected" aria-hidden="true">{choice.value === currentValue ? "✓" : ""}</span>
  </div>;
  return <span className={`flood-select flood-select--custom flood-control--${controlSize}`} dir={nativeProps.dir} lang={nativeProps.lang} hidden={nativeProps.hidden}>
    <button
      {...visibleAttributes} ref={trigger} id={triggerId} type="button" role="combobox" disabled={disabled}
      tabIndex={nativeProps.tabIndex} accessKey={nativeProps.accessKey} dir={nativeProps.dir} lang={nativeProps.lang} hidden={nativeProps.hidden}
      className={["flood-input flood-select__control", `flood-control--${controlSize}`, className].filter(Boolean).join(" ")}
      style={style} title={title} aria-label={ariaLabel} aria-labelledby={labelledBy}
      aria-describedby={descriptions} aria-invalid={invalid || ariaInvalid || Boolean(validation) || undefined}
      aria-required={required || undefined} aria-expanded={open} aria-haspopup="listbox" aria-controls={menuId}
      aria-activedescendant={open && active >= 0 && choices[active] && !choices[active].hidden ? `${menuId}-${active}` : undefined}
      onFocus={(event) => { if (onFocus) mirror(new FocusEvent("focusin", { bubbles: true, relatedTarget: event.relatedTarget })); }}
      onBlur={(event) => { if (onBlur) mirror(new FocusEvent("focusout", { bubbles: true, relatedTarget: event.relatedTarget })); setOpen(false); }}
      onClick={() => { if (onClick && !mirror(new MouseEvent("click", { bubbles: true, cancelable: true }))) return; if (open) setOpen(false); else openMenu(); }}
      onKeyUp={(event) => { if (onKeyUp) mirror(new KeyboardEvent("keyup", { key: event.key, bubbles: true, cancelable: true })); }}
      onKeyDown={(event) => {
        if (onKeyDown && !mirror(new KeyboardEvent("keydown", { key: event.key, code: event.code, bubbles: true, cancelable: true, ctrlKey: event.ctrlKey, shiftKey: event.shiftKey, altKey: event.altKey, metaKey: event.metaKey }))) { event.preventDefault(); return; }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); navigate(event.key === "ArrowDown" ? 1 : -1); }
        else if (event.key === "Home" || event.key === "End") { event.preventDefault(); const fresh = readChoices(); const index = event.key === "Home" ? fresh.findIndex(enabled) : fresh.reduce((last, choice, index) => enabled(choice) ? index : last, -1); if (open) setActive(index); else openMenu(index); }
        else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (open) commit(active); else openMenu(); }
        else if (event.key === "Escape" && open) { event.preventDefault(); setOpen(false); }
        else if (event.key === "Tab" && open) commit(active);
        else if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
          event.preventDefault(); const now = Date.now(); const fresh = readChoices();
          const query = (now - search.current.time > 700 ? "" : search.current.value) + event.key.toLocaleLowerCase();
          search.current = { value: query, time: now };
          const repeated = [...query].every((character) => character === query[0]);
          const needle = repeated ? query[0] : query;
          const from = repeated ? active + 1 : Math.max(0, active);
          const index = fresh.map((_, offset) => (from + offset + fresh.length) % fresh.length).find((candidate) => enabled(fresh[candidate]) && fresh[candidate].label.toLocaleLowerCase().startsWith(needle));
          if (!open) { setChoices(fresh); setOpen(true); }
          if (index !== undefined) setActive(index);
        }
      }}
    ><span className="flood-select__value">{displayed}</span></button>
    <select {...nativeAttributes} ref={native} id={`${triggerId}-native`} className="flood-select__native" hidden aria-hidden="true" tabIndex={-1}
      disabled={disabled} required={required} value={value} defaultValue={defaultValue} onChange={change}
      onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown} onKeyUp={onKeyUp} onClick={onClick}
      onInvalid={(event) => { onInvalid?.(event); const prevented = event.defaultPrevented; event.preventDefault(); if (!prevented) { setValidation(event.currentTarget.validationMessage); trigger.current?.focus(); } }}
    >{children}</select>
    {open && <div ref={menu} id={menuId} role="listbox" aria-label={ariaLabel} aria-labelledby={ariaLabel ? undefined : labelledBy ?? triggerId} popover="manual"
      className="flood-select__menu" onPointerDown={(event) => event.preventDefault()} onClick={(event) => event.preventDefault()} style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight || undefined }}>
      <OverlayScrollArea ref={scrollViewport} orientation="vertical" tabIndex={-1} className="flood-select__viewport" style={{ maxHeight: position.viewportHeight || undefined }}>
        {!choices.some((choice) => !choice.hidden) && <div className="flood-select__empty">No options</div>}
        {groups.map((group, index) => group.label ? <div key={index} role="group" aria-label={group.label}>
          <div className="flood-select__group" aria-hidden="true">{group.label}</div>{group.items.map(renderOption)}
        </div> : <Fragment key={index}>{group.items.map(renderOption)}</Fragment>)}
      </OverlayScrollArea>
    </div>}
    {validation && <span className="flood-select__validation" id={validationId} role="alert">{validation}</span>}
  </span>;
});
