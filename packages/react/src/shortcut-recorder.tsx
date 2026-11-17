import { forwardRef, useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  Button, Inline, KeyboardShortcut, Popover, Stack, Text,
  type RecordedShortcut, type ShortcutModifier, type ShortcutRecorderProps,
} from "./index.js";

const modifierFlags = [
  ["Control", "ctrlKey"], ["Alt", "altKey"], ["Shift", "shiftKey"], ["Meta", "metaKey"],
] as const;
const modifierNames: Record<ShortcutModifier, string> = { Control: "Ctrl", Alt: "Alt", Shift: "Shift", Meta: "Meta" };
const keyNames: Record<string, string> = { " ": "Space", ArrowUp: "Up", ArrowDown: "Down", ArrowLeft: "Left", ArrowRight: "Right" };
const formatKeys = ({ key, modifiers }: RecordedShortcut) => [
  ...modifiers.map(modifier => modifierNames[modifier]),
  Object.hasOwn(keyNames, key) ? keyNames[key] : key.length === 1 ? key.toUpperCase() : key,
];

const strings = {
  unassigned: "Record shortcut",
  capture: "Press your shortcut",
  empty: "No shortcut",
  clear: "Clear",
  save: "Save",
  cancel: "Cancel",
  modifierRequired: "Include Ctrl, Alt, Shift, or Meta.",
};

export const ShortcutCapture = /* @__PURE__ */ forwardRef<HTMLDivElement, ShortcutRecorderProps>(function ShortcutCapture({
  label, value, defaultValue = null, onValueChange, validate, requireModifier = true,
  disabled = false, formatKeys: display = formatKeys, labels, className, ...props
}, ref) {
  const copy = { ...strings, ...labels };
  const [local, setLocal] = useState(defaultValue);
  const accepted = value === undefined ? local : value;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RecordedShortcut | null>();
  const [invalidAttempt, setInvalidAttempt] = useState(false);
  const capture = useRef<HTMLDivElement>(null);
  const error = invalidAttempt ? copy.modifierRequired : draft ? validate?.(draft) : undefined;
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  function changeOpen(next: boolean) {
    setOpen(next);
    if (next) {
      setDraft(undefined);
      setInvalidAttempt(false);
    }
  }

  function save() {
    if (disabled || draft === undefined || error) return;
    if (value === undefined) setLocal(draft);
    onValueChange?.(draft);
    setOpen(false);
  }

  function record(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Tab" || event.key === "Escape" || disabled) return;
    event.stopPropagation();
    if (event.nativeEvent.isComposing || event.getModifierState("AltGraph") || ["Dead", "Unidentified", "Process", "AltGraph"].includes(event.key)) return;
    event.preventDefault();
    if (event.repeat || modifierFlags.some(([modifier]) => modifier === event.key)) return;
    const modifiers = modifierFlags.filter(([, flag]) => event[flag]).map(([modifier]) => modifier);
    if (event.key === "Enter" && !modifiers.length) {
      save();
      return;
    }
    if (requireModifier && !modifiers.length) {
      setInvalidAttempt(true);
      return;
    }
    setInvalidAttempt(false);
    setDraft({ key: event.key, code: event.code, modifiers });
  }

  return <Popover {...props} ref={ref} className={["flood-shortcut-recorder", className].filter(Boolean).join(" ")}
    title={label} closeLabel={copy.cancel} disabled={disabled} open={open && !disabled} onOpenChange={changeOpen}
    initialFocusRef={capture}
    trigger={trigger => <Button {...trigger} size="sm" variant="outline"
      >
      {accepted ? <KeyboardShortcut keys={display(accepted)} /> : copy.unassigned}
    </Button>}>
    <Stack gap="3">
      <div ref={capture} className="flood-shortcut-recorder__capture" role="group" tabIndex={0}
        aria-label={copy.capture} onKeyDown={record}>
        <Text aria-hidden="true" size="helper" tone="subtle">{copy.capture}</Text>
        <span className="flood-shortcut-recorder__readout" aria-live="polite">
          {draft ? <KeyboardShortcut keys={display(draft)} size="md" />
            : draft === null ? <Text size="compact" tone="subtle">{copy.empty}</Text> : null}
        </span>
      </div>
      {error && <Text size="helper" tone="error" role="status">{error}</Text>}
      <Inline gap="2" className="flood-shortcut-recorder__actions">
        <Button size="sm" variant="ghost" disabled={draft === null || (!accepted && draft === undefined)}
          onClick={() => { setDraft(null); setInvalidAttempt(false); capture.current?.focus(); }}>{copy.clear}</Button>
        <Button size="sm" disabled={draft === undefined || Boolean(error)} onClick={save}>{copy.save}</Button>
      </Inline>
    </Stack>
  </Popover>;
});
