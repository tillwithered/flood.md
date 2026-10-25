import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { SearchInputProps, PasswordInputProps, InputGroup, IconButton, IconSlot } from "./index.js";

type Parts = { group: typeof InputGroup; action: typeof IconButton; icon: typeof IconSlot };
const glyph = (kind: "search" | "clear" | "eye", visible = false) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind === "search" ? <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></> : kind === "clear" ? <path d="m6 6 12 12M18 6 6 18"/> : <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{visible && <path d="m3 3 18 18"/>}</>}</svg>;

export const SearchField = forwardRef<HTMLInputElement, SearchInputProps & Parts>(function SearchField({group: Group, action: Action, icon: Icon, clearable = true, clearLabel = "Clear search", controlSize = "md", className, value, defaultValue, onChange, disabled, readOnly, ...props}, ref) {
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current!, []);
  const [text, setText] = useState(String(defaultValue ?? ""));
  const current = value === undefined ? text : String(value);
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const reset = (event: Event) => setTimeout(() => { if (!event.defaultPrevented && input.current) setText(input.current.value); }, 0);
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [props.form]);
  const clear = () => {
    const node = input.current;
    if (!node || readOnly || node.matches(":disabled")) return;
    const view = node.ownerDocument.defaultView!;
    Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, "value")!.set!.call(node, "");
    node.dispatchEvent(new view.Event("input", {bubbles:true}));
    node.focus();
  };
  return <Group {...props} ref={input} type="search" controlSize={controlSize} className={["flood-search-input", className].filter(Boolean).join(" ")} value={value} defaultValue={defaultValue} disabled={disabled} readOnly={readOnly}
    onChange={event => { setText(event.currentTarget.value); onChange?.(event); }}
    start={<Icon size={controlSize}>{glyph("search")}</Icon>}
    end={clearable && current.length > 0 && !readOnly ? <Action label={clearLabel} variant="ghost" size={controlSize} disabled={disabled} onPointerDown={event => event.preventDefault()} onClick={clear}>{glyph("clear")}</Action> : undefined}/>;
});

export const PasswordField = forwardRef<HTMLInputElement, PasswordInputProps & Parts>(function PasswordField({group: Group, action: Action, icon: _Icon, visible, defaultVisible = false, onVisibleChange, showPasswordLabel = "Show password", hidePasswordLabel = "Hide password", controlSize = "md", className, disabled, ...props}, ref) {
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current!, []);
  const [local, setLocal] = useState(defaultVisible);
  const shown = visible ?? local;
  return <Group {...props} ref={input} type={shown ? "text" : "password"} disabled={disabled} controlSize={controlSize} className={["flood-password-input", className].filter(Boolean).join(" ")}
    end={<Action label={shown ? hidePasswordLabel : showPasswordLabel} variant="ghost" size={controlSize} disabled={disabled} onPointerDown={event => event.preventDefault()} onClick={() => {
      const node = input.current;
      if (!node || node.matches(":disabled")) return;
      const start = node.selectionStart, end = node.selectionEnd, direction = node.selectionDirection;
      if (visible === undefined) setLocal(!shown);
      onVisibleChange?.(!shown);
      requestAnimationFrame(() => { if (start !== null && end !== null && node.isConnected) node.setSelectionRange(start, end, direction ?? undefined); });
    }}>{glyph("eye", shown)}</Action>}/>;
});
