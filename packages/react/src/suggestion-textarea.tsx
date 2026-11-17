import {forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState} from "react";
import {ScrollArea, Textarea, type QueryInputProps, type SuggestionTextareaProps, type TextSuggestionItem} from "./index.js";
import {positionLayer, registerLayer} from "./overlay-runtime.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
type Selection = {value:string; start:number; end:number};
type CaretSuggestionEditorProps = SuggestionTextareaProps & {
  resolveSuggestions?: QueryInputProps["resolveSuggestions"];
  onSubmitQuery?: () => void;
};
const normalize = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();

function activeToken(value: string, start: number, end: number) {
  if (start !== end) return;
  const match = value.slice(0,start).match(/(?:^|[\s([{])([@/])([\p{L}\p{M}\p{N}_-]*)$/u);
  if (!match) return;
  const trigger = match[1] as "@" | "/";
  const query = match[2];
  const suffix = value.slice(end).match(/^[\p{L}\p{M}\p{N}_-]*/u)?.[0] ?? "";
  return {trigger, query, start:start-query.length-1, end:end+suffix.length};
}

const caretStyles = ["direction", "font-family", "font-size", "font-weight", "font-style", "font-kerning",
  "font-feature-settings", "font-variation-settings", "letter-spacing", "line-height", "text-align", "text-transform", "text-indent",
  "padding-left", "padding-right", "padding-top", "padding-bottom", "tab-size", "white-space", "word-break", "overflow-wrap"] as const;

/** A native textarea does not expose a caret rectangle. Mirror its text layout for that measurement. */
function caretBounds(input: HTMLTextAreaElement, caret: number) {
  const document = input.ownerDocument;
  const view = document.defaultView!;
  const instance = document.createElement("div");
  const style = view.getComputedStyle(input);
  for (const name of caretStyles) instance.style.setProperty(name, style.getPropertyValue(name));
  Object.assign(instance.style, {position:"fixed", left:"0", top:"0", width:`${input.clientWidth}px`,
    border:"none", boxSizing:"border-box", visibility:"hidden", pointerEvents:"none"});
  const text = document.createTextNode(`${input.value}\u200b`);
  instance.append(text);
  document.body.append(instance);
  const range = document.createRange();
  range.setStart(text,caret);
  range.collapse(true);
  const anchor = range.getBoundingClientRect();
  const mirror = instance.getBoundingClientRect();
  instance.remove();
  const viewport = input.getBoundingClientRect();
  const zoom = input.offsetWidth ? viewport.width / input.offsetWidth : 1;
  const mirrorZoom = input.clientWidth ? mirror.width / input.clientWidth : 1;
  const left = viewport.left + (input.clientLeft + (anchor.left - mirror.left) / mirrorZoom - input.scrollLeft) * zoom;
  const top = viewport.top + (input.clientTop + (anchor.top - mirror.top) / mirrorZoom - input.scrollTop) * zoom;
  const height = anchor.height / mirrorZoom * zoom;
  return new view.DOMRect(Math.max(viewport.left,Math.min(viewport.right,left)),
    Math.max(viewport.top,Math.min(viewport.bottom-height,top)),0,height);
}

function placeCaretLayer(node: HTMLTextAreaElement, layer: HTMLDivElement) {
  if (!layer.matches(":popover-open") || !node.getClientRects().length) return;
  positionLayer(node,layer,"bottom","start",false,caretBounds(node,node.selectionStart));
}

export const CaretSuggestionEditor = /* @__PURE__ */ forwardRef<HTMLTextAreaElement, CaretSuggestionEditorProps>(function CaretSuggestionEditor({
  value, onValueChange, suggestions, onSuggestionSelect, resolveSuggestions, onSubmitQuery, disabled, readOnly, controlSize = "md",
  onFocus, onBlur, onSelect, onCompositionStart, onCompositionEnd, onKeyDown, ...props
}, ref) {
  if (new Set(suggestions.map(group=>group.trigger)).size!==suggestions.length || suggestions.some(group=>
    !group.label.trim() || new Set(group.items.map(item=>item.id)).size!==group.items.length
    || group.items.some(item=>!item.id.trim() || !item.label.trim() || !item.insertText)
  )) throw new Error("Flood SuggestionTextarea requires unique triggers and option IDs, named groups and options, and nonempty insertions");
  const id = useId();
  const listId = `${id}-suggestions`;
  const input = useRef<HTMLTextAreaElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const pending = useRef<{value:string; caret:number}>(undefined);
  const [selection, setSelection] = useState<Selection>();
  const [dismissed, setDismissed] = useState<Selection>();
  const [highlighted, setHighlighted] = useState<{item:string; value:string; caret:number}>();
  const [focused, setFocused] = useState(false);
  const [composing, setComposing] = useState(false);
  useImperativeHandle(ref, () => input.current!, []);
  const currentSelection = focused && !composing && !disabled && !readOnly && selection?.value === value
    && (dismissed?.value !== value || dismissed.start !== selection.start) ? selection : undefined;
  const token = currentSelection && !resolveSuggestions
    ? activeToken(value,currentSelection.start,currentSelection.end) : undefined;
  const group = token && suggestions.find(group=>group.trigger === token.trigger);
  const resolved = resolveSuggestions && currentSelection && currentSelection.start === currentSelection.end
    ? resolveSuggestions({value,caret:currentSelection.start}) : undefined;
  if (resolved && (!resolved.label.trim() || !Number.isInteger(resolved.start) || !Number.isInteger(resolved.end)
    || resolved.start < 0 || resolved.end > value.length || resolved.start > currentSelection!.start
    || resolved.end < currentSelection!.end || new Set(resolved.items.map(item=>item.id)).size !== resolved.items.length
    || resolved.items.some(item=>!item.id.trim() || !item.label.trim() || !item.insertText)))
    throw new Error("Flood QueryInput suggestions require a named group, a range covering the caret, and unique named insertions");
  const activeGroup = resolved ?? group;
  const compactMentions = group?.trigger === "@" && group.items.every(item => !item.description);
  const query = normalize(token?.query ?? "");
  const items = resolved?.items ?? group?.items.filter(item => normalize(`${item.label} ${item.description ?? ""}`).includes(query)) ?? [];
  const enabled = items.filter(item=>!item.disabled);
  const active = enabled.find(item=>item.id===highlighted?.item && highlighted.value===value && highlighted.caret===selection?.start) ?? enabled[0];
  const open = Boolean(activeGroup && items.length);
  const optionId = (item: TextSuggestionItem) => `${listId}-${activeGroup?.items.indexOf(item)}`;

  const updateSelection = (node: HTMLTextAreaElement) => {
    const next = {value:node.value, start:node.selectionStart, end:node.selectionEnd};
    setSelection(previous=>previous?.value === next.value && previous.start === next.start && previous.end === next.end ? previous : next);
    setDismissed(previous=>previous?.value === next.value && previous.start === next.start ? previous : undefined);
  };
  const dismiss = () => setDismissed(selection);
  const current = useRef({dismiss});
  current.current = {dismiss};

  useBrowserLayoutEffect(() => {
    const next = pending.current, node = input.current;
    if (!next || !node) return;
    pending.current = undefined;
    if (next.value !== value) return;
    node.setSelectionRange(next.caret, next.caret);
    updateSelection(node);
    setDismissed({value, start:next.caret, end:next.caret});
  }, [value, dismissed]);

  useBrowserLayoutEffect(() => {
    const node = input.current, layer = panel.current;
    if (!open || !node || !layer) return;
    const document = node.ownerDocument;
    const view = document.defaultView!;
    const place = () => placeCaretLayer(node,layer);
    const enclosingDialog = node.closest("dialog");
    if (enclosingDialog && !enclosingDialog.open) return;
    layer.style.visibility = "hidden";
    layer.showPopover();
    place();
    const unregister = registerLayer(document,{panel:layer, anchor:()=>node, close:()=>current.current.dismiss()});
    const observer = new view.ResizeObserver(place);
    observer.observe(node);
    observer.observe(layer);
    document.addEventListener("scroll",place,true);
    view.addEventListener("resize",place);
    view.visualViewport?.addEventListener("resize",place);
    view.visualViewport?.addEventListener("scroll",place);
    return () => {
      observer.disconnect();
      unregister();
      document.removeEventListener("scroll",place,true);
      view.removeEventListener("resize",place);
      view.visualViewport?.removeEventListener("resize",place);
      view.visualViewport?.removeEventListener("scroll",place);
      if (layer.matches(":popover-open")) layer.hidePopover();
    };
  }, [open]);

  useBrowserLayoutEffect(() => {
    if (open && input.current && panel.current) placeCaretLayer(input.current,panel.current);
  }, [open,selection,activeGroup]);

  useBrowserLayoutEffect(() => {
    if (!open || !active) return;
    const area = viewport.current;
    const option = input.current?.ownerDocument.getElementById(optionId(active));
    if (!area || !option) return;
    const container = area.getBoundingClientRect(), row = option.getBoundingClientRect();
    const zoom = area.currentCSSZoom ?? 1;
    if (row.top < container.top) area.scrollTop -= (container.top-row.top)/zoom;
    else if (row.bottom > container.bottom) area.scrollTop += (row.bottom-container.bottom)/zoom;
  }, [active,open,listId]);

  const select = (item: TextSuggestionItem) => {
    const node = input.current;
    const range = resolved ?? token;
    if (!node || !range || node.matches(":disabled,[readonly]") || item.disabled) return;
    const next = value.slice(0,range.start) + item.insertText + value.slice(range.end);
    const caret = range.start + item.insertText.length;
    pending.current = {value:next, caret};
    dismiss();
    onValueChange(next);
    if (token) onSuggestionSelect?.({trigger:token.trigger,item,start:token.start,end:token.end});
  };

  return <>
    <Textarea {...props} ref={input} value={value} controlSize={controlSize} disabled={disabled} readOnly={readOnly}
      aria-autocomplete="list" aria-haspopup="listbox" aria-controls={open ? listId : undefined}
      aria-activedescendant={open && active ? optionId(active) : undefined}
      onFocus={event=>{onFocus?.(event); setFocused(true); updateSelection(event.currentTarget);}}
      onBlur={event=>{onBlur?.(event); setFocused(false);}}
      onSelect={event=>{onSelect?.(event); updateSelection(event.currentTarget);}}
      onChange={event=>{updateSelection(event.currentTarget); onValueChange(event.currentTarget.value);}}
      onCompositionStart={event=>{onCompositionStart?.(event); setComposing(true);}}
      onCompositionEnd={event=>{onCompositionEnd?.(event); setComposing(false); updateSelection(event.currentTarget);}}
      onKeyDown={event=>{
        onKeyDown?.(event);
        if (event.defaultPrevented || event.nativeEvent.isComposing || composing || event.keyCode===229
          || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key==="Enter" && onSubmitQuery && (!open || !active)) {
          event.preventDefault();
          if (!event.repeat && !event.currentTarget.matches(":disabled,[readonly]")) onSubmitQuery();
        } else if (!open) return;
        else if (event.key==="Escape") {
          event.preventDefault();
          dismiss();
        } else if (event.key==="Enter" && active) {
          event.preventDefault();
          if (!event.repeat) select(active);
        } else if (enabled.length && (event.key==="ArrowUp" || event.key==="ArrowDown")) {
          event.preventDefault();
          const index = active ? enabled.indexOf(active) : 0;
          const next = enabled[(index + (event.key==="ArrowUp" ? -1 : 1) + enabled.length) % enabled.length];
          setHighlighted({item:next.id,value,caret:event.currentTarget.selectionStart});
        }
      }}
    />
    {open && activeGroup && <div ref={panel} popover="manual" data-query-suggestions={resolveSuggestions ? true : undefined}
      data-compact-mentions={compactMentions || undefined}
      className={`flood-overlay-panel flood-suggestion-textarea__panel flood-control--${controlSize}`}>
      <ScrollArea ref={viewport} id={listId} role="listbox" tabIndex={-1} aria-label={activeGroup.label}
        className="flood-command-list__viewport flood-suggestion-textarea__viewport">
        {items.map(item=><div key={item.id} id={optionId(item)} role="option" className="flood-command-list__option"
          aria-selected={active?.id===item.id} data-active={active?.id===item.id || undefined} aria-disabled={item.disabled || undefined}
          onPointerMove={event=>{
            if (event.pointerType==="mouse" && !item.disabled && selection) setHighlighted({item:item.id,value,caret:selection.start});
          }}
          onPointerDown={event=>{if(event.pointerType==="mouse")event.preventDefault();}}
          onMouseDown={event=>event.preventDefault()} onClick={()=>select(item)}>
          <span className="flood-command-list__copy">
            <span className="flood-command-list__label">{item.label}</span>
            {item.description && <span className="flood-command-list__description">{item.description}</span>}
          </span>
        </div>)}
      </ScrollArea>
    </div>}
  </>;
});
