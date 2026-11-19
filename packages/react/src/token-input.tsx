import {forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState,
  type ClipboardEvent, type HTMLAttributes} from "react";
import {ScrollArea} from "./index.js";
import {positionLayer, registerLayer} from "./overlay-runtime.js";

type Trigger = "@" | "/";
export type TokenInputPart =
  | {type: "text"; text: string}
  | {type: "token"; id: string; label: string; trigger: Trigger};
export type TokenInputToken = Extract<TokenInputPart, {type: "token"}>;

export interface TokenInputSuggestion extends Omit<TokenInputToken, "type"> {
  description?: string;
  disabled?: boolean;
}

export interface TokenInputProps extends Omit<HTMLAttributes<HTMLDivElement>,
  "children" | "role" | "onChange" | "onSubmit" | "placeholder" | "contentEditable" | "defaultValue"> {
  label: string;
  value?: readonly TokenInputPart[];
  defaultValue?: readonly TokenInputPart[];
  onValueChange?: (value: readonly TokenInputPart[]) => void;
  onSubmit?: (value: readonly TokenInputPart[]) => void;
  suggestions?: readonly TokenInputSuggestion[];
  resolveSuggestions?: (request: {trigger: Trigger; query: string; signal: AbortSignal}) =>
    Promise<readonly TokenInputSuggestion[]>;
  disabled?: boolean;
  readOnly?: boolean;
  controlSize?: "sm" | "md" | "lg" | "xl";
  placeholder?: string;
  /** Submits a JSON array of the accepted parts. */
  name?: string;
  form?: string;
  labels?: {mentions?: string; commands?: string};
}

type Cursor = {start: number; end: number};
type Snapshot = {parts: readonly TokenInputPart[]; caret: number};
type EditKind = "edit" | "undo" | "redo";
type PendingEdit = {key: string; caret: number; previous: Snapshot; kind: EditKind};
const clipboardType = "application/x-flood-token-input";
const empty: readonly TokenInputPart[] = [];
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function textPart(text: string): TokenInputPart {
  return {type: "text", text: text.replace(/[\r\n]+/g, " ")};
}

function compact(parts: readonly TokenInputPart[]) {
  const next: TokenInputPart[] = [];
  for (const part of parts) {
    if (part.type === "token") {
      next.push(part);
      continue;
    }
    if (!part.text) continue;
    const previous = next.at(-1);
    if (previous?.type === "text") next[next.length - 1] = textPart(previous.text + part.text);
    else next.push(textPart(part.text));
  }
  return next;
}

function readParts(node: Node, tokens: WeakMap<Node, TokenInputToken>): TokenInputPart[] {
  const token = tokens.get(node);
  if (token) return [token];
  if (node.nodeType === Node.TEXT_NODE) return [textPart(node.textContent ?? "")];
  return Array.from(node.childNodes).flatMap(child => readParts(child, tokens));
}

function measure(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent?.length ?? 0;
  if (node.nodeType === Node.ELEMENT_NODE && (node as Element).hasAttribute("data-flood-inline-token")) return 1;
  return Array.from(node.childNodes).reduce((sum, child) => sum + measure(child), 0);
}

function readCursor(editor: HTMLElement): Cursor | undefined {
  const selection = editor.ownerDocument.getSelection();
  if (!selection?.rangeCount) return;
  const selected = selection.getRangeAt(0);
  if (!editor.contains(selected.commonAncestorContainer)) return;
  const head = editor.ownerDocument.createRange();
  head.selectNodeContents(editor);
  head.setEnd(selected.startContainer, selected.startOffset);
  const start = measure(head.cloneContents());
  return {start, end: start + measure(selected.cloneContents())};
}

function setCursor(editor: HTMLElement, offset: number) {
  const range = editor.ownerDocument.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  let rest = offset;
  for (const node of editor.childNodes) {
    const length = measure(node);
    if (rest > length) {
      rest -= length;
      continue;
    }
    if (node.nodeType === Node.TEXT_NODE) range.setStart(node, rest);
    else if (rest === 0) range.setStartBefore(node);
    else range.setStartAfter(node);
    range.collapse(true);
    break;
  }
  const selection = editor.ownerDocument.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function slice(parts: readonly TokenInputPart[], from: number, to = Infinity) {
  const result: TokenInputPart[] = [];
  let offset = 0;
  for (const part of parts) {
    const size = part.type === "token" ? 1 : part.text.length;
    if (offset + size > from && offset < to) {
      result.push(part.type === "token" ? part : textPart(part.text.slice(Math.max(0, from - offset), to - offset)));
    }
    offset += size;
  }
  return result;
}

function clipboardParts(serialized: string): TokenInputPart[] | undefined {
  if (!serialized || serialized.length > 32768) return;
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) return;
    const parts: TokenInputPart[] = [];
    for (const item of parsed) {
      if (item?.type === "text" && typeof item.text === "string") parts.push(textPart(item.text));
      else if (item?.type === "token" && typeof item.id === "string" && item.id.trim() &&
        typeof item.label === "string" && item.label.trim() && (item.trigger === "@" || item.trigger === "/")) {
        parts.push({type: "token", id: item.id, label: item.label, trigger: item.trigger});
      } else return;
    }
    return parts;
  } catch {
    return;
  }
}

/** Compose plain text with atomic mentions and commands. */
export const TokenInput = /* @__PURE__ */ forwardRef<HTMLDivElement, TokenInputProps>(function TokenInput({
  label, value, defaultValue = empty, onValueChange, onSubmit, suggestions = emptySuggestions, resolveSuggestions,
  disabled, readOnly, controlSize = "md", placeholder, name, form, labels, className, onKeyDown, onFocus, onBlur,
  onCompositionStart, onCompositionEnd, onCopy, onCut, onPaste, onInput, ...props
}, ref) {
  const [local, setLocal] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const [composing, setComposing] = useState(false);
  const [cursor, setSelection] = useState<Cursor>();
  const [dismissed, setDismissed] = useState<string>();
  const [highlighted, setHighlighted] = useState<string>();
  const [formDisabled, setFormDisabled] = useState(false);
  const listId = useId();
  const [remote, setRemote] = useState<{key: string; items: readonly TokenInputSuggestion[]}>();
  const editor = useRef<HTMLDivElement>(null);
  const bridge = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const renderedTokens = useRef(new WeakMap<Node, TokenInputToken>());
  const pending = useRef<PendingEdit | undefined>(undefined);
  const history = useRef<{past: Snapshot[]; future: Snapshot[]}>({past: [], future: []});
  const lastAccepted = useRef<string | undefined>(undefined);
  const initial = useRef(defaultValue);
  const parts = compact(value ?? local);
  const serialized = JSON.stringify(parts);
  const prefix = cursor && readQuery(parts, cursor);
  const queryKey = prefix ? `${prefix.start}:${prefix.trigger}${prefix.query}` : "";
  const unavailable = disabled || formDisabled;
  const activeQuery = focused && !composing && !unavailable && !readOnly && prefix && queryKey !== dismissed ? prefix : undefined;
  const available = resolveSuggestions ? remote?.key === queryKey ? remote.items : [] :
    suggestions.filter(item => item.trigger === activeQuery?.trigger
      && item.label.toLowerCase().includes(activeQuery.query.toLowerCase()));
  const enabled = available.filter(item => !item.disabled);
  const active = enabled.find(item => item.id === highlighted) ?? enabled[0];
  const optionId = (item: TokenInputSuggestion) => `${listId}-${available.indexOf(item)}`;
  const open = Boolean(activeQuery && available.length);
  const close = useRef(() => setDismissed(queryKey));
  close.current = () => setDismissed(queryKey);
  useImperativeHandle(ref, () => editor.current!, []);

  function paint() {
    const node = editor.current;
    if (!node) return;
    const next = pending.current;
    pending.current = undefined;
    if (lastAccepted.current !== serialized) {
      const entries = history.current;
      if (next?.key !== serialized) {
        entries.past = [];
        entries.future = [];
      } else if (next.kind === "undo") {
        entries.past.pop();
        entries.future.push(next.previous);
      } else if (next.kind === "redo") {
        entries.future.pop();
        entries.past.push(next.previous);
      } else {
        entries.past = [...entries.past.slice(-49), next.previous];
        entries.future = [];
      }
      lastAccepted.current = serialized;
    }
    const caret = next?.key === serialized ? next.caret : readCursor(node)?.start;
    if (JSON.stringify(compact(readParts(node, renderedTokens.current))) !== serialized) {
      const document = node.ownerDocument;
      const children = parts.map(part => {
        if (part.type === "text") return document.createTextNode(part.text);
        // The browser owns this contenteditable tree. Reuse the Tag material on its atomic inline node.
        const token = document.createElement("span");
        token.className = "flood-tag flood-token-input__token";
        token.setAttribute("data-flood-inline-token", "");
        token.setAttribute("data-size", "sm");
        token.contentEditable = "false";
        token.textContent = part.trigger + part.label;
        renderedTokens.current.set(token, part);
        return token;
      });
      node.replaceChildren(...children);
      if (caret !== undefined && document.activeElement === node) setCursor(node, caret);
    }
    setSelection(previous => {
      const current = readCursor(node);
      return current?.start === previous?.start && current?.end === previous?.end ? previous : current;
    });
  }

  useBrowserLayoutEffect(() => { if (!composing) paint(); });
  useEffect(() => {
    const node = bridge.current;
    if (!node) return;
    const update = () => setFormDisabled(node.matches(":disabled"));
    const observer = new node.ownerDocument.defaultView!.MutationObserver(update);
    for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) {
      if (ancestor.localName === "fieldset") observer.observe(ancestor, {attributes: true, attributeFilter: ["disabled"]});
    }
    update();
    return () => observer.disconnect();
  }, [disabled]);
  useEffect(() => {
    const node = editor.current;
    if (!node || !focused) return;
    const select = () => {
      const next = readCursor(node);
      setSelection(previous => next?.start === previous?.start && next?.end === previous?.end ? previous : next);
    };
    node.ownerDocument.addEventListener("selectionchange", select);
    return () => node.ownerDocument.removeEventListener("selectionchange", select);
  }, [focused]);
  useEffect(() => {
    setDismissed(previous => previous === queryKey ? previous : undefined);
    setHighlighted(undefined);
  }, [queryKey]);
  useEffect(() => {
    if (!activeQuery || !resolveSuggestions) return;
    const abort = new AbortController();
    const {trigger, query} = activeQuery;
    void Promise.resolve().then(() => resolveSuggestions({trigger, query, signal: abort.signal})).then(items => {
      if (!abort.signal.aborted) setRemote({key: queryKey, items: items.filter(item => item.trigger === trigger)});
    }, () => {
      if (!abort.signal.aborted) setRemote({key: queryKey, items: []});
    });
    return () => abort.abort();
  }, [activeQuery?.trigger, activeQuery?.query, queryKey, resolveSuggestions]);
  useEffect(() => {
    const node = bridge.current;
    const owner = node?.form;
    const target = editor.current;
    if (!node || !owner || !target) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = (event: Event) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (event.defaultPrevented) return;
        if (value === undefined) setLocal(initial.current);
        history.current = {past: [], future: []};
      }, 0);
    };
    owner.addEventListener("reset", reset);
    return () => { owner.removeEventListener("reset", reset); clearTimeout(timer); };
  }, [form, value === undefined]);
  useBrowserLayoutEffect(() => {
    const node = editor.current;
    const layer = panel.current;
    if (!open || !node || !layer) return;
    const document = node.ownerDocument;
    const view = document.defaultView!;
    const place = () => {
      const selection = document.getSelection();
      const range = selection?.rangeCount && selection.getRangeAt(0);
      const rect = range && node.contains(range.commonAncestorContainer) ? range.getBoundingClientRect() : undefined;
      positionLayer(node, layer, "bottom", "start", false, rect?.height ? rect : undefined);
    };
    const enclosing = node.closest("dialog");
    if (enclosing && !enclosing.open) return;
    layer.style.visibility = "hidden";
    layer.showPopover();
    place();
    const unregister = registerLayer(document, {panel: layer, anchor: () => node, close: () => close.current()});
    const resize = new view.ResizeObserver(place);
    resize.observe(layer);
    document.addEventListener("scroll", place, true);
    document.addEventListener("selectionchange", place);
    view.addEventListener("resize", place);
    view.visualViewport?.addEventListener("resize", place);
    view.visualViewport?.addEventListener("scroll", place);
    return () => {
      unregister();
      resize.disconnect();
      document.removeEventListener("scroll", place, true);
      document.removeEventListener("selectionchange", place);
      view.removeEventListener("resize", place);
      view.visualViewport?.removeEventListener("resize", place);
      view.visualViewport?.removeEventListener("scroll", place);
      if (layer.matches(":popover-open")) layer.hidePopover();
    };
  }, [open]);
  useBrowserLayoutEffect(() => {
    const area = viewport.current;
    if (!open || !active || !area) return;
    const option = area.ownerDocument.getElementById(optionId(active));
    if (!option) return;
    const itemBounds = option.getBoundingClientRect();
    const bounds = area.getBoundingClientRect();
    if (itemBounds.top < bounds.top) area.scrollTop -= bounds.top - itemBounds.top;
    if (itemBounds.bottom > bounds.bottom) area.scrollTop += itemBounds.bottom - bounds.bottom;
  }, [open, active]);

  function publish(next: readonly TokenInputPart[], caret: number, kind: EditKind = "edit") {
    const accepted = compact(next);
    const key = JSON.stringify(accepted);
    pending.current = {key, caret, previous: {parts, caret: cursor?.end ?? caret}, kind};
    if (value === undefined) setLocal(accepted);
    if (key !== serialized) onValueChange?.(accepted);
    // Controlled hosts may refuse an edit without causing a new render.
    queueMicrotask(() => {
      if (pending.current?.key === key) paint();
    });
  }

  function restore(kind: "undo" | "redo") {
    const entries = history.current;
    const snapshot = (kind === "undo" ? entries.past : entries.future).at(-1);
    if (snapshot) {
      setDismissed(queryKey);
      publish(snapshot.parts, snapshot.caret, kind);
    } else paint();
  }

  function replace(from: number, to: number, insert: readonly TokenInputPart[]) {
    const width = insert.reduce((length, part) => length + (part.type === "token" ? 1 : part.text.length), 0);
    publish([...slice(parts, 0, from), ...insert, ...slice(parts, to)], from + width);
  }

  function pick(item: TokenInputSuggestion) {
    if (!activeQuery || item.disabled || bridge.current?.matches(":disabled")) return;
    setHighlighted(undefined);
    replace(activeQuery.start, activeQuery.end, [{type: "token", id: item.id, label: item.label, trigger: item.trigger}, textPart(" ")]);
  }

  function copy(event: ClipboardEvent<HTMLDivElement>, cut: boolean) {
    const region = readCursor(event.currentTarget);
    if (!region || region.start === region.end) return;
    const selected = slice(parts, region.start, region.end);
    event.preventDefault();
    event.clipboardData.setData(clipboardType, JSON.stringify(selected));
    event.clipboardData.setData("text/plain", selected.map(part => part.type === "text" ? part.text : part.trigger + part.label).join(""));
    if (cut && !disabled && !readOnly && !bridge.current?.matches(":disabled")) replace(region.start, region.end, []);
  }

  return <>
    <div {...props} ref={editor} role="combobox" aria-label={props["aria-labelledby"] ? undefined : label}
      aria-expanded={open} aria-autocomplete="list" aria-controls={open ? listId : undefined}
      aria-activedescendant={open && active ? optionId(active) : undefined}
      aria-disabled={unavailable || undefined} aria-readonly={readOnly || undefined}
      contentEditable={!unavailable && !readOnly} suppressContentEditableWarning
      tabIndex={unavailable ? -1 : props.tabIndex ?? 0} data-placeholder={placeholder} data-empty={!parts.length || undefined}
      className={["flood-input", `flood-control--${controlSize}`, "flood-token-input", className].filter(Boolean).join(" ")}
      onFocus={event => { onFocus?.(event); setFocused(true); }}
      onBlur={event => { onBlur?.(event); setFocused(false); setDismissed(undefined); }}
      onCompositionStart={event => { onCompositionStart?.(event); setComposing(true); }}
      onCompositionEnd={event => {
        onCompositionEnd?.(event);
        setComposing(false);
        const node = event.currentTarget;
        if (!readOnly && !disabled) publish(readParts(node, renderedTokens.current), readCursor(node)?.start ?? 0);
      }}
      onInput={event => {
        onInput?.(event);
        const node = event.currentTarget;
        const native = event.nativeEvent as InputEvent;
        if (!composing && !native.isComposing && !event.defaultPrevented) {
          if (!unavailable && !readOnly && (native.inputType === "historyUndo" || native.inputType === "historyRedo")) {
            restore(native.inputType === "historyUndo" ? "undo" : "redo");
            return;
          }
          publish(disabled || readOnly || bridge.current?.matches(":disabled") ? parts
            : readParts(node, renderedTokens.current), readCursor(node)?.start ?? 0);
        }
      }}
      onKeyDown={event => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.nativeEvent.isComposing || composing || event.keyCode === 229 ||
            disabled || readOnly || bridge.current?.matches(":disabled")) return;
        const command = (event.ctrlKey || event.metaKey) && !event.altKey;
        const key = event.key.toLowerCase();
        if (command && (key === "z" || key === "y")) {
          event.preventDefault();
          restore(key === "y" || event.shiftKey ? "redo" : "undo");
        } else if (command && event.key === " " && prefix && queryKey === dismissed) {
          event.preventDefault();
          setDismissed(undefined);
        } else if ((event.key === "Backspace" || event.key === "Delete") && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const selection = readCursor(event.currentTarget);
          if (!selection) return;
          const {start, end} = selection;
          const from = start === end && event.key === "Backspace" ? Math.max(0, start - 1) : start;
          const to = start === end && event.key === "Delete" ? end + 1 : end;
          if (slice(parts, from, to).some(part => part.type === "token")) {
            event.preventDefault();
            replace(from, to, []);
          }
        } else if (event.key === "Enter") {
          event.preventDefault();
          if (event.repeat) return;
          if (open && active) pick(active);
          else if (onSubmit) onSubmit(parts);
          else bridge.current?.form?.requestSubmit();
        } else if (open && (event.key === "ArrowDown" || event.key === "ArrowUp") && enabled.length) {
          event.preventDefault();
          const index = active ? enabled.indexOf(active) : 0;
          setHighlighted(enabled[(enabled.length + index + (event.key === "ArrowUp" ? -1 : 1)) % enabled.length].id);
        } else if (open && event.key === "Escape") {
          event.preventDefault();
          setDismissed(queryKey);
        }
      }}
      onCopy={event => { onCopy?.(event); if (!event.defaultPrevented) copy(event, false); }}
      onCut={event => { onCut?.(event); if (!event.defaultPrevented) copy(event, true); }}
      onPaste={event => {
        onPaste?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        const range = readCursor(event.currentTarget);
        if (!range || disabled || readOnly || bridge.current?.matches(":disabled")) return;
        const structured = clipboardParts(event.clipboardData.getData(clipboardType));
        replace(range.start, range.end, structured ?? [textPart(event.clipboardData.getData("text/plain"))]);
      }}
      onDrop={event => { props.onDrop?.(event); event.preventDefault(); }} />
    <input ref={bridge} type="hidden" name={name} form={form} disabled={disabled} value={serialized} />
    {open && activeQuery && <div ref={panel} popover="manual"
      className={`flood-overlay-panel flood-suggestion-textarea__panel flood-control--${controlSize}`}>
      <ScrollArea ref={viewport} id={listId} role="listbox" tabIndex={-1}
        aria-label={activeQuery.trigger === "@" ? labels?.mentions ?? "Mentions" : labels?.commands ?? "Commands"}
        className="flood-command-list__viewport flood-suggestion-textarea__viewport">
        {available.map((item, index) => <div key={`${item.id}-${index}`} id={optionId(item)} role="option"
          aria-selected={item === active} aria-disabled={item.disabled || undefined}
          className="flood-command-list__option" data-active={item === active || undefined}
          onPointerMove={event => { if (event.pointerType === "mouse" && !item.disabled) setHighlighted(item.id); }}
          onMouseDown={event => event.preventDefault()} onClick={() => pick(item)}>
          <span className="flood-command-list__copy">
            <span className="flood-command-list__label">{item.label}</span>
            {item.description && <span className="flood-command-list__description">{item.description}</span>}
          </span>
        </div>)}
      </ScrollArea>
    </div>}
  </>;
});

const emptySuggestions: readonly TokenInputSuggestion[] = [];

function readQuery(parts: readonly TokenInputPart[], cursor: Cursor) {
  if (cursor.start !== cursor.end) return;
  const left = slice(parts, 0, cursor.start).at(-1);
  if (left?.type !== "text") return;
  const match = left.text.match(/(?:^|[\s([{])([@/])([\p{L}\p{M}\p{N}_-]*)$/u);
  if (!match) return;
  const right = slice(parts, cursor.end)[0];
  const suffix = right?.type === "text" ? right.text.match(/^[\p{L}\p{M}\p{N}_-]*/u)?.[0] ?? "" : "";
  return {trigger: match[1] as Trigger, query: match[2], start: cursor.start - match[2].length - 1,
    end: cursor.end + suffix.length};
}
