import {forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState} from "react";
import type {EditableProps} from "./index.js";
import {Button, IconButton, IconSlot, Input, InputGroup, Text} from "./index.js";
import {mergeDescriptions} from "./field-state.js";
import {positionLayer, registerLayer} from "./overlay-runtime.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const cx = (...values: Array<string | undefined | false>) => values.filter(Boolean).join(" ");

/** A draft is private until explicitly committed; native forms receive committed text. */
export const InlineEditable = /* @__PURE__ */ forwardRef<HTMLDivElement, EditableProps>(function InlineEditable({
  label, hideLabel = false, value, defaultValue = "", onValueChange,
  editing, defaultEditing = false, onEditingChange, onCommit, onCancel,
  validate, inputMode, previewVariant = "subtle", editorOverlayWidth,
  blurAction = "commit", readOnly = false, disabled = false, placeholder = "Empty",
  controlSize = "md", showActions = true, editLabel = "Edit", saveLabel = "Save", cancelLabel = "Cancel",
  inputRef, name, form, id: explicitId, className, onBlur, onKeyDown, ...props
}, forwardedRef) {
  if (![label, editLabel, saveLabel, cancelLabel].every(text => text.trim())) throw new Error("Flood Editable requires nonempty control and action labels");
  const initial = useRef(defaultValue), [local, setLocal] = useState(defaultValue);
  const committed = value ?? local;
  const [localEditing, setLocalEditing] = useState(defaultEditing);
  const requested = editing ?? localEditing, active = requested && !disabled && !readOnly;
  const [draft, setDraft] = useState(committed);
  const [validationError, setValidationError] = useState<string>();
  const root = useRef<HTMLDivElement>(null), editor = useRef<HTMLInputElement>(null), bridge = useRef<HTMLInputElement>(null), preview = useRef<HTMLButtonElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const floating = editorOverlayWidth !== undefined;
  const fitDraft = editorOverlayWidth === "fit-content";
  const current = useRef({committed, active, draft, value, editing, onValueChange, onEditingChange, onCommit, onCancel, validate});
  current.current = {committed, active, draft, value, editing, onValueChange, onEditingChange, onCommit, onCancel, validate};
  const composing = useRef(false), resolved = useRef(false), wasActive = useRef(false);
  const generated = useId(), id = explicitId ?? `flood-editable-${generated}`, inputId = `${id}-input`, previewId = `${id}-preview`;
  useImperativeHandle(forwardedRef, () => root.current!, []);
  useImperativeHandle(inputRef, () => editor.current!, [active, readOnly]);
  const requestEditing = (next: boolean) => {
    if (current.current.editing === undefined) setLocalEditing(next);
    current.current.onEditingChange?.(next);
  };
  const start = () => {
    if (disabled || readOnly || current.current.active || preview.current?.matches(":disabled")) return;
    setDraft(current.current.committed); resolved.current = false; requestEditing(true);
  };
  const finish = (action: "commit" | "cancel", restoreFocus: boolean) => {
    if (!current.current.active || resolved.current || (composing.current && action === "commit") || editor.current?.matches(":disabled")) return;
    const next = current.current.draft;
    const message = action === "commit" ? current.current.validate?.(next) : undefined;
    setValidationError(message);
    if (message) return;
    resolved.current = true;
    if (action === "commit") {
      if (next !== current.current.committed) {
        if (current.current.value === undefined) setLocal(next);
        current.current.onValueChange?.(next);
      }
      current.current.onCommit?.(next);
    } else {
      setDraft(current.current.committed);
      current.current.onCancel?.();
    }
    requestEditing(false);
    if (restoreFocus) {
      const document = root.current?.ownerDocument;
      document?.defaultView?.requestAnimationFrame(() => {
        if (current.current.active || !preview.current?.isConnected || preview.current.matches(":disabled")) return;
        const focused = document.activeElement;
        if (focused === document.body || root.current?.contains(focused)) preview.current.focus({preventScroll:true});
      });
    }
    // A controlled host may refuse to close and allow a later deliberate attempt.
    queueMicrotask(() => { resolved.current = false; });
  };
  useBrowserLayoutEffect(() => {
    const panel = layer.current, anchor = preview.current;
    if (!active || !floating || !panel || !anchor) return;
    const document = panel.ownerDocument, view = document.defaultView!;
    panel.showPopover();
    let frame = 0;
    const position = () => {
      positionLayer(anchor, panel, "bottom", "end", true);
      frame = view.requestAnimationFrame(position);
    };
    position();
    const unregister = registerLayer(document, {
      panel, anchor: () => anchor, close: () => finish("cancel", true), closeOnFocusOutside: false,
      outside: () => { if (blurAction !== "none") finish(blurAction, false); },
    });
    return () => {
      unregister();
      view.cancelAnimationFrame(frame);
      if (panel.matches(":popover-open")) panel.hidePopover();
    };
  }, [active, floating, blurAction]);
  useBrowserLayoutEffect(() => {
    let frame = 0;
    if (active && !wasActive.current) {
      setDraft(current.current.committed); setValidationError(undefined); resolved.current = false; composing.current = false;
      const view = editor.current?.ownerDocument.defaultView;
      if (view) frame = view.requestAnimationFrame(() => { if (current.current.active && editor.current && !editor.current.matches(":disabled")) { editor.current.focus(); editor.current.select(); } });
    }
    if (!active && wasActive.current) { composing.current = false; setDraft(current.current.committed); }
    wasActive.current = active;
    return () => { editor.current?.ownerDocument.defaultView?.cancelAnimationFrame(frame); };
  }, [active]);
  useEffect(() => {
    if ((disabled || readOnly) && requested) requestEditing(false);
  }, [disabled, readOnly, requested]);
  useEffect(() => {
    const owner = bridge.current?.form;
    if (!owner) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reset = (event: Event) => { timer = setTimeout(() => {
      if (event.defaultPrevented || !root.current) return;
      if (current.current.value === undefined) setLocal(initial.current);
      setDraft(current.current.value === undefined ? initial.current : current.current.committed);
      if (current.current.active) requestEditing(false);
    }, 0); };
    owner.addEventListener("reset", reset);
    return () => { owner.removeEventListener("reset", reset); clearTimeout(timer); };
  }, [form]);
  const glyph = (kind: "edit" | "save" | "cancel") => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind === "save" ? <path d="m5 12 4 4L19 6"/> : kind === "cancel" ? <path d="m6 6 12 12M18 6 6 18"/> : <><path d="m15 5 4 4M4 20l4-1L20 7a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"/></>}</svg>;
  const errorId = `${inputId}-error`;
  const editorProps = {id:inputId, inputMode, "aria-describedby":mergeDescriptions(props["aria-describedby"], active && validationError ? errorId : undefined),
    "aria-invalid":active && validationError ? true : props["aria-invalid"], controlSize, disabled};
  const editButton = <Button ref={preview} id={previewId} type="button" variant={previewVariant} size={controlSize} disabled={disabled}
    className="flood-editable__preview" aria-describedby={props["aria-describedby"]} aria-label={`${editLabel}: ${label}. ${committed || placeholder}`}
    aria-hidden={active && floating || undefined} tabIndex={active && floating ? -1 : undefined} onClick={start}>
    <span className="flood-editable__value" data-empty={!committed || undefined}>{committed || placeholder}</span><IconSlot size={controlSize}>{glyph("edit")}</IconSlot>
  </Button>;
  const editorContent = active && <>
    <InputGroup {...editorProps} ref={editor} value={draft} placeholder={placeholder}
      size={fitDraft ? Math.max(4, (draft || placeholder).length + 1) : undefined}
      onChange={event => { setValidationError(undefined); setDraft(event.currentTarget.value); current.current.draft = event.currentTarget.value; }}
      onCompositionStart={() => { composing.current = true; }} onCompositionEnd={event => {
        composing.current = false; setDraft(event.currentTarget.value); current.current.draft = event.currentTarget.value;
        const document = event.currentTarget.ownerDocument;
        if (blurAction !== "none" && !root.current?.contains(document.activeElement)) queueMicrotask(() => finish(blurAction,false));
      }}
      end={showActions ? <div className="flood-editable__actions">
        <IconButton type="button" label={saveLabel} size={controlSize} variant="ghost" onPointerDown={event => { if (event.pointerType === "mouse") event.preventDefault(); }} onMouseDown={event => event.preventDefault()} onClick={() => finish("commit",true)}>{glyph("save")}</IconButton>
        <IconButton type="button" label={cancelLabel} size={controlSize} variant="ghost" onPointerDown={event => { if (event.pointerType === "mouse") event.preventDefault(); }} onMouseDown={event => event.preventDefault()} onClick={() => finish("cancel",true)}>{glyph("cancel")}</IconButton>
      </div> : undefined}/>
    {validationError && <Text as="p" id={errorId} role="alert" size="helper" tone="error" className="flood-editable__error">{validationError}</Text>}
  </>;
  return <div {...props} ref={root} id={id} className={cx("flood-editable",className)} data-editing={active || undefined} data-disabled={disabled || undefined} data-readonly={readOnly || undefined}
    onKeyDown={event => {
      onKeyDown?.(event);
      if (event.defaultPrevented || !current.current.active || event.target !== editor.current || event.nativeEvent.isComposing || composing.current || event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === "Enter" || event.key === "Escape") { event.preventDefault(); finish(event.key === "Enter" ? "commit" : "cancel",true); }
    }}
    onBlur={event => {
      onBlur?.(event);
      if (event.defaultPrevented || !current.current.active || event.currentTarget.contains(event.relatedTarget as Node | null) || blurAction === "none") return;
      finish(blurAction,false);
    }}>
    <label htmlFor={active || readOnly ? inputId : previewId} className={cx("flood-label",hideLabel && "flood-visually-hidden")}>{label}</label>
    <input ref={bridge} type="hidden" name={name} form={form} value={committed} disabled={disabled}/>
    {readOnly ? <Input {...editorProps} ref={editor} value={committed} readOnly/> : (!active || floating) && editButton}
    {active && (floating
      ? <div ref={layer} popover="manual" className="flood-overlay-panel flood-editable__overlay" data-fit-draft={fitDraft || undefined} style={{inlineSize: editorOverlayWidth}}>{editorContent}</div>
      : editorContent)}
  </div>;
});
