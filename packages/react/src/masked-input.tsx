import {forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState} from "react";
import {Input, type InputProps} from "./index.js";

export interface MaskedInputProps extends Omit<InputProps, "value" | "defaultValue" | "type" | "onChange" | "maxLength" | "minLength"> {
  /** 9 is a digit, A a letter, * a letter or digit. Backslash escapes a literal. */
  mask: string;
  /** Unformatted value. An empty string represents no entry. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Allows a partial value to be submitted. */
  allowPartial?: boolean;
  /** Native validation message for an incomplete mask. */
  incompleteMessage?: string;
}

type Slot = {pattern: RegExp};
type Part = Slot | {literal: string};
type Mask = {parts: Part[]; slots: Slot[]};
type Rendered = {text: string; positions: number[]};
const patterns: Record<string, RegExp> = {"9": /^[0-9]$/, "A": /^[a-z]$/i, "*": /^[a-z0-9]$/i};
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function compile(mask: string): Mask {
  const parts: Part[] = [];
  const slots: Slot[] = [];
  let escaped = false;
  for (const character of mask) {
    if (!escaped && character === "\\") {
      escaped = true;
      continue;
    }
    if (!escaped && patterns[character]) {
      const slot = {pattern: patterns[character]};
      slots.push(slot);
      parts.push(slot);
    } else {
      parts.push({literal: character});
    }
    escaped = false;
  }
  if (escaped || !slots.length) throw new Error("Flood MaskedInput requires a mask with at least one slot and no unfinished escape");
  return {parts, slots};
}

function scrub(text: string, slots: readonly Slot[], offset = 0) {
  let value = "";
  for (const character of text) {
    const slot = slots[offset + value.length];
    if (!slot) break;
    if (slot.pattern.test(character)) value += character;
  }
  return value;
}

function render(value: string, mask: Mask): Rendered {
  let text = "";
  let literal = "";
  const positions: number[] = [];
  for (const part of mask.parts) {
    if ("literal" in part) {
      literal += part.literal;
      continue;
    }
    if (positions.length >= value.length) break;
    text += literal + value[positions.length];
    positions.push(text.length);
    literal = "";
  }
  if (value.length === mask.slots.length) text += literal;
  return {text, positions};
}

function formattedPaste(text: string, mask: Mask) {
  let value = "";
  let offset = 0;
  for (const part of mask.parts) {
    if ("literal" in part) {
      if (!text.startsWith(part.literal, offset)) return undefined;
      offset += part.literal.length;
    } else {
      const character = text[offset++];
      if (!character || !part.pattern.test(character)) return undefined;
      value += character;
    }
  }
  return offset === text.length ? value : undefined;
}

function diff(before: string, after: string, caret: number) {
  let start = 0;
  while (start < caret && start < before.length && before[start] === after[start]) start++;
  let end = before.length;
  let afterEnd = after.length;
  while (end > start && afterEnd > Math.max(caret, start) && before[end - 1] === after[afterEnd - 1]) {
    end--;
    afterEnd--;
  }
  return {start, end, inserted: after.slice(start, afterEnd)};
}

/** Edit a fixed-format value while preserving the native text field and its caret. */
export const MaskedInput = /* @__PURE__ */ forwardRef<HTMLInputElement, MaskedInputProps>(function MaskedInput({
  mask: specification, value, defaultValue = "", onValueChange, allowPartial = false,
  incompleteMessage = "Complete this field.", disabled, readOnly, required, name, form,
  onCompositionStart, onCompositionEnd, ...props
}, ref) {
  const mask = useMemo(() => compile(specification), [specification]);
  const control = useRef<HTMLInputElement>(null);
  const initial = useRef(defaultValue);
  const [local, setLocal] = useState(defaultValue);
  const [draft, setDraft] = useState<string>();
  const composing = useRef(false);
  const pending = useRef<{value: string; position: number; node: HTMLInputElement} | undefined>(undefined);
  const raw = scrub(value ?? local, mask.slots);
  const painted = render(raw, mask);
  useImperativeHandle(ref, () => control.current!, []);

  useBrowserLayoutEffect(() => {
    const cursor = pending.current;
    if (cursor) {
      const position = cursor.value === raw ? (painted.positions[cursor.position - 1] ?? 0)
        : Math.min(cursor.node.selectionStart ?? 0, painted.text.length);
      if (cursor.node.ownerDocument.activeElement === cursor.node) cursor.node.setSelectionRange(position, position);
      pending.current = undefined;
    }
    control.current?.setCustomValidity(!readOnly && raw && !allowPartial && raw.length !== mask.slots.length ? incompleteMessage : "");
  });

  useEffect(() => {
    const owner = control.current?.form;
    if (!owner) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = (event: Event) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (event.defaultPrevented) return;
        if (value === undefined) setLocal(initial.current);
        setDraft(undefined);
        composing.current = false;
      }, 0);
    };
    owner.addEventListener("reset", reset);
    return () => { owner.removeEventListener("reset", reset); clearTimeout(timer); };
  }, [form, value === undefined]);

  function edit(node: HTMLInputElement, inputType?: string) {
    const caret = node.selectionStart ?? node.value.length;
    const change = diff(painted.text, node.value, caret);
    let from = painted.positions.filter(position => position <= change.start).length;
    let to = painted.positions.filter(position => position <= change.end).length;
    if (from === to && !change.inserted) {
      if (inputType === "deleteContentBackward") from = Math.max(0, from - 1);
      if (inputType === "deleteContentForward") to = Math.min(raw.length, to + 1);
    }
    const pasted = from === 0 && to === raw.length ? formattedPaste(change.inserted, mask) : undefined;
    const inserted = pasted ?? scrub(change.inserted, mask.slots, from);
    const next = scrub(raw.slice(0, from) + inserted + raw.slice(to), mask.slots);
    const position = Math.min(next.length, from + inserted.length);
    pending.current = {value: next, position, node};
    if (value === undefined) setLocal(next);
    if (next !== raw) onValueChange?.(next);
    // React may skip rendering when a keystroke was refused or left the value unchanged.
    queueMicrotask(() => {
      if (pending.current?.node !== node || node.ownerDocument.activeElement !== node) return;
      pending.current = undefined;
      node.setSelectionRange(painted.positions[Math.min(position, raw.length) - 1] ?? 0, painted.positions[Math.min(position, raw.length) - 1] ?? 0);
    });
  }

  return <>
    <Input {...props} ref={control} type="text" inputMode={props.inputMode ?? (mask.slots.every(slot => slot.pattern === patterns["9"]) ? "numeric" : "text")}
      form={form} disabled={disabled} readOnly={readOnly} required={required} value={draft ?? painted.text}
      onChange={event => {
        if (composing.current || (event.nativeEvent as InputEvent).isComposing) setDraft(event.currentTarget.value);
        else edit(event.currentTarget, (event.nativeEvent as InputEvent).inputType);
      }}
      onCompositionStart={event => {
        onCompositionStart?.(event);
        composing.current = true;
        setDraft(event.currentTarget.value);
      }}
      onCompositionEnd={event => {
        onCompositionEnd?.(event);
        composing.current = false;
        setDraft(undefined);
        edit(event.currentTarget);
      }} />
    {name && <input type="hidden" name={name} form={form} disabled={disabled} value={raw} />}
  </>;
});
