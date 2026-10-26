import {forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState} from "react";
import {Input, Label, Tag, type TagInputProps} from "./index.js";
import {mergeDescriptions, resolveFieldStatus} from "./field-state.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const normalize = (values: readonly string[]) => [...new Set(values.map(value => value.trim()).filter(Boolean))];
const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((value,index) => value === b[index]);

/** Free text tokens. Known-option IDs and suggestion layers belong to MultiSelect. */
export const FreeTagEntry = forwardRef<HTMLInputElement, TagInputProps>(function FreeTagEntry({
  label, hideLabel = false, value, defaultValue = [], onValueChange, delimiters = [","], removeLabel = "Remove",
  requiredMessage = "Add at least one tag.", controlSize = "md", disabled, readOnly, required, name, form,
  id: explicitId, className, style, onKeyDown, onPaste, onInvalid, onCompositionStart, onCompositionEnd, ...props
}, forwardedRef) {
  if (!label.trim() || !removeLabel.trim() || !requiredMessage.trim()) throw new Error("Flood TagInput requires nonempty accessible labels and validation message");
  if (delimiters.some(delimiter => [...delimiter].length !== 1 || delimiter === "\n" || delimiter === "\r")) throw new Error("Flood TagInput delimiters must be single characters other than newlines");
  for (const values of [value, defaultValue]) if (values !== undefined && (!Array.isArray(values) || values.some(item => typeof item !== "string"))) throw new Error("Flood TagInput values must be arrays of strings");
  const generated = useId(), id = explicitId ?? `flood-tag-input-${generated}`;
  const input = useRef<HTMLInputElement>(null), root = useRef<HTMLDivElement>(null), composing = useRef(false);
  useImperativeHandle(forwardedRef, () => input.current!, []);
  const initial = useRef(normalize(defaultValue));
  const [local, setLocal] = useState(initial.current), [draft, setDraft] = useState(""), [validation, setValidation] = useState("");
  const tags = value === undefined ? local : normalize(value);
  const controlled = useRef(value !== undefined);
  controlled.current = value !== undefined;
  const pending = useRef<{tags:string[]; draft:string; remaining:string} | undefined>(undefined);
  const blocked = () => Boolean(disabled || readOnly || input.current?.matches(":disabled"));
  const publish = (next: string[]) => {
    if (same(tags,next)) return;
    if (value === undefined) setLocal(next);
    onValueChange?.([...next]);
    setValidation("");
  };
  const add = (parts: string[], remaining = "", source = draft) => {
    const next = normalize([...tags,...parts]);
    if (same(tags,next)) { pending.current = undefined; setDraft(remaining); return; }
    if (value === undefined) setDraft(remaining);
    else { pending.current = {tags:next,draft:source,remaining}; setDraft(source); }
    publish(next);
  };
  useBrowserLayoutEffect(() => {
    const request = pending.current;
    if (request && same(tags,request.tags)) {
      pending.current = undefined;
      setDraft(current => current === request.draft ? request.remaining : current);
    }
    input.current?.setCustomValidity(required && tags.length === 0 ? requiredMessage : "");
  });
  useEffect(() => {
    const owner = input.current?.form;
    if (!owner) return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const reset = (event: Event) => {
      // React's delegated onReset may cancel after this native listener returns.
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (event.defaultPrevented || !input.current) return;
        if (!controlled.current) setLocal([...initial.current]);
        pending.current = undefined; setDraft(""); setValidation("");
      },0);
      timers.add(timer);
    };
    owner.addEventListener("reset",reset);
    return () => { owner.removeEventListener("reset",reset); timers.forEach(clearTimeout); };
  },[form]);
  const remove = (tag: string) => {
    if (blocked()) return;
    publish(tags.filter(value => value !== tag));
    input.current?.focus({preventScroll:true});
  };
  const split = (text: string, includeNewlines = false) => {
    const separators = new Set([...delimiters,...(includeNewlines ? ["\n","\r"] : [])]);
    const parts = [""];
    for (const character of text) {
      if (separators.has(character)) parts.push("");
      else parts[parts.length-1] += character;
    }
    return parts;
  };
  const removeButtons = () => [...root.current?.querySelectorAll<HTMLButtonElement>(".flood-tag__remove:not(:disabled)") ?? []];
  const rtl = () => input.current?.ownerDocument.defaultView?.getComputedStyle(input.current).direction === "rtl";
  return <div ref={root} className="flood-tag-input" hidden={props.hidden} dir={props.dir} lang={props.lang}>
    <Label htmlFor={id} required={required} className={hideLabel ? "flood-visually-hidden" : undefined}>{label}</Label>
    <div className={["flood-input-group", "flood-tag-input__control", `flood-control--${controlSize}`,className].filter(Boolean).join(" ")} style={style}
      data-disabled={disabled || undefined} data-readonly={readOnly || undefined} data-status={resolveFieldStatus(props.status,props.invalid || Boolean(validation),props["aria-invalid"])}
      onClick={event => { if (!blocked() && !(event.target as HTMLElement).closest("button,input")) input.current?.focus(); }}>
      {tags.map(tag => <Tag key={tag} size={controlSize === "sm" ? "sm" : controlSize === "md" ? "md" : "lg"}
        disabled={disabled} onRemove={readOnly ? undefined : () => remove(tag)} removeLabel={`${removeLabel} ${tag}`}
        removeButtonProps={{tabIndex:-1,onKeyDown:event => {
          if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing || blocked()) return;
          const buttons = removeButtons(), index = buttons.indexOf(event.currentTarget);
          if (event.key === "Backspace" || event.key === "Delete") { event.preventDefault(); remove(tag); }
          else if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); input.current?.focus(); }
          else if (event.key === (rtl() ? "ArrowLeft" : "ArrowRight")) { event.preventDefault(); (buttons[index+1] ?? input.current)?.focus(); }
          else if (event.key === (rtl() ? "ArrowRight" : "ArrowLeft")) { event.preventDefault(); buttons[Math.max(0,index-1)]?.focus(); }
        }}}>{tag}</Tag>)}
      <Input {...props} ref={input} id={id} type="text" form={form} value={draft} controlSize={controlSize} disabled={disabled} readOnly={readOnly}
        required={required && tags.length === 0} aria-required={required || undefined}
        aria-describedby={mergeDescriptions(props["aria-describedby"],tags.length > 0 && `${id}-selection`,Boolean(validation) && `${id}-validation`)}
        invalid={props.invalid || Boolean(validation)}
        onChange={event => {
          if (blocked()) return;
          pending.current = undefined;
          const text = event.currentTarget.value;
          if (composing.current || ("isComposing" in event.nativeEvent && event.nativeEvent.isComposing)) { setDraft(text); return; }
          const parts = split(text);
          if (parts.length > 1) add(parts.slice(0,-1),parts.at(-1)!,text);
          else setDraft(text);
        }}
        onCompositionStart={event => { composing.current = true; onCompositionStart?.(event); }}
        onCompositionEnd={event => { composing.current = false; onCompositionEnd?.(event); }}
        onInvalid={event => { onInvalid?.(event); if (!event.defaultPrevented) setValidation(event.currentTarget.validationMessage); }}
        onKeyDown={event => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing || composing.current) return;
          if (readOnly && event.key === "Backspace") { event.preventDefault(); return; }
          if (blocked()) return;
          if (event.key === "Enter" && draft.trim()) { event.preventDefault(); add([draft]); }
          else if (delimiters.includes(event.key)) { event.preventDefault(); add([draft]); }
          else if (event.key === "Backspace" && !draft && tags.length && !event.shiftKey) { event.preventDefault(); remove(tags.at(-1)!); }
          else if (event.key === (rtl() ? "ArrowRight" : "ArrowLeft") && !event.shiftKey && event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0) {
            const last = removeButtons().at(-1); if (last) { event.preventDefault(); last.focus(); }
          }
        }}
        onPaste={event => {
          onPaste?.(event);
          if (event.defaultPrevented || blocked() || composing.current) return;
          const pasted = event.clipboardData.getData("text/plain");
          if (split(pasted,true).length === 1) return;
          event.preventDefault();
          const node = event.currentTarget, text = draft.slice(0,node.selectionStart ?? draft.length) + pasted + draft.slice(node.selectionEnd ?? draft.length);
          add(split(text,true),"",text);
        }} />
    </div>
    {name && tags.map(tag => <input key={tag} type="hidden" name={name} value={tag} form={form} disabled={disabled} />)}
    {tags.length > 0 && <span id={`${id}-selection`} className="flood-visually-hidden">{tags.join(", ")}</span>}
    {validation && <span id={`${id}-validation`} role="alert" className="flood-error">{validation}</span>}
  </div>;
});
