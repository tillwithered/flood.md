import {forwardRef, useEffect, useId, useImperativeHandle, useRef, useState} from "react";
import {Input, Label, ScrollArea, Surface, Text, VisuallyHidden, type CommandListProps, type CommandListItem} from "./index.js";

const searchable = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu,"").toLowerCase();

/** Searchable action suggestions. No selected form value or modal lifecycle. */
export const SearchCommandList = /* @__PURE__ */ forwardRef<HTMLInputElement, CommandListProps>(function SearchCommandList({
  label, hideLabel = false, items, query, defaultQuery = "", onQueryChange, onAction,
  disabled = false, loading = false, placeholder = "Search commands…", emptyMessage = "No commands found.",
  loadingMessage = "Loading commands…", controlSize = "md", id: explicitId, className, onKeyDown, ...props
}, forwardedRef) {
  if (![label,emptyMessage,loadingMessage].every(value => value.trim())) throw new Error("Flood CommandList requires nonempty accessible labels and state messages");
  if (new Set(items.map(item => item.id)).size !== items.length || items.some(item => !item.id.trim() || !item.label.trim())) throw new Error("Flood CommandList items require unique nonempty IDs and labels");
  const generated = useId(), rootId = explicitId ?? `flood-command-list-${generated}`, inputId = `${rootId}-input`, listId = `${rootId}-list`;
  const input = useRef<HTMLInputElement>(null), viewport = useRef<HTMLDivElement>(null), composing = useRef(false);
  useImperativeHandle(forwardedRef,() => input.current!,[]);
  const [localQuery,setLocalQuery] = useState(defaultQuery), [activeId,setActiveId] = useState<string>(), [inheritedDisabled,setInheritedDisabled] = useState(false);
  const text = query ?? localQuery;
  const terms = searchable(text).trim().split(/\s+/).filter(Boolean);
  const filtered = items.filter(item => {
    const haystack = searchable([item.label,item.description ?? "",item.group ?? "",...(item.keywords ?? [])].join(" "));
    return terms.every(term => haystack.includes(term));
  });
  const groups = new Map<string,CommandListItem[]>();
  for (const item of filtered) {
    const key = item.group?.trim() ?? "", group = groups.get(key);
    if (group) group.push(item); else groups.set(key,[item]);
  }
  const effectiveDisabled = disabled || inheritedDisabled;
  const enabled = loading || effectiveDisabled ? [] : [...groups.values()].flat().filter(item => !item.disabled);
  const active = enabled.find(item => item.id === activeId) ?? enabled[0];
  const positions = new Map(items.map((item,index) => [item.id,index]));
  const optionId = (item: CommandListItem) => `${listId}-option-${positions.get(item.id)}`;
  const blocked = () => Boolean(disabled || loading || input.current?.matches(":disabled"));
  const invoke = (item: CommandListItem) => {
    if (blocked() || item.disabled) return;
    input.current?.focus({preventScroll:true});
    onAction?.(item.id);
  };
  useEffect(() => { setActiveId(undefined); },[text]);
  useEffect(() => {
    const node = input.current, view = node?.ownerDocument.defaultView;
    if (!node || !view) return;
    const update = () => setInheritedDisabled(node.matches(":disabled"));
    update();
    const observer = new view.MutationObserver(update);
    for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) if (ancestor.localName === "fieldset") observer.observe(ancestor,{attributes:true,attributeFilter:["disabled"]});
    return () => observer.disconnect();
  },[disabled]);
  useEffect(() => {
    if (!active || !viewport.current) return;
    const option = input.current?.ownerDocument.getElementById(optionId(active));
    if (!option) return;
    const area = viewport.current, a = option.getBoundingClientRect(), b = area.getBoundingClientRect();
    if (a.top < b.top) area.scrollTop -= b.top - a.top;
    else if (a.bottom > b.bottom) area.scrollTop += a.bottom - b.bottom;
  },[active?.id,text,loading,items]);
  const status = loading ? loadingMessage : filtered.length ? "" : emptyMessage;
  return <div {...props} id={rootId} className={["flood-command-list",`flood-control--${controlSize}`,className].filter(Boolean).join(" ")} data-disabled={effectiveDisabled || undefined}
    onKeyDown={event => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.target !== input.current || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.nativeEvent.isComposing || composing.current) return;
      if (event.key === "Enter") { event.preventDefault(); if (active) invoke(active); return; }
      if (blocked() || !enabled.length) return;
      if (!["ArrowDown","ArrowUp","Home","End"].includes(event.key)) return;
      event.preventDefault();
      const index = enabled.findIndex(item => item.id === active?.id);
      const next = event.key === "Home" ? 0 : event.key === "End" ? enabled.length-1 : (index + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length;
      setActiveId(enabled[next].id);
    }}>
    <Label htmlFor={inputId} className={hideLabel ? "flood-visually-hidden" : undefined}>{label}</Label>
    <Input ref={input} id={inputId} value={text} disabled={disabled} type="text" controlSize={controlSize} placeholder={placeholder} autoComplete="off" spellCheck={false}
      role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="true" aria-controls={listId} aria-activedescendant={active ? optionId(active) : undefined}
      onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
      onChange={event => { const next = event.currentTarget.value; if (disabled || event.currentTarget.matches(":disabled")) return; if (query === undefined) setLocalQuery(next); onQueryChange?.(next); }} />
    <Surface padding="1" className="flood-command-list__surface">
      <ScrollArea ref={viewport} id={listId} role="listbox" aria-label={label} aria-busy={loading || undefined} aria-disabled={effectiveDisabled || undefined} tabIndex={-1} className="flood-command-list__viewport" style={{maxHeight:"18rem"}}>
        {status ? <div role="option" aria-disabled="true" aria-selected="false" className="flood-command-list__empty"><Text size="compact" tone="subtle">{status}</Text></div> : [...groups].map(([group,entries],groupIndex) => {
          const content = entries.map(item => <div key={item.id} id={optionId(item)} role="option"
            aria-disabled={item.disabled || effectiveDisabled || undefined} aria-selected={item.id === active?.id} data-active={item.id === active?.id || undefined} className="flood-command-list__option"
            onPointerMove={event => { if (event.pointerType === "mouse" && !blocked() && !item.disabled) setActiveId(item.id); }}
            onPointerDown={event => { if (event.pointerType === "mouse") event.preventDefault(); }} onMouseDown={event => event.preventDefault()} onClick={() => invoke(item)}>
            <span className="flood-command-list__label">{item.label}</span>{item.description && <span className="flood-command-list__description">{item.description}</span>}
          </div>);
          return group ? <div key={`group:${group}`} role="group" aria-labelledby={`${listId}-group-${groupIndex}`} className="flood-command-list__group">
            <Text as="div" size="helper" tone="subtle" id={`${listId}-group-${groupIndex}`} className="flood-command-list__group-label">{group}</Text>{content}
          </div> : <div key="ungrouped" role="group" className="flood-command-list__group">{content}</div>;
        })}
      </ScrollArea>
    </Surface>
    <VisuallyHidden role="status">{status}</VisuallyHidden>
  </div>;
});
