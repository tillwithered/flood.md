import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef } from "react";
import {
  Autocomplete, Button, Field, Fieldset, Grid, IconButton, IconSlot, Input, Stack, Switch, Textarea, VisuallyHidden,
  type KeyValueEditorProps, type KeyValueEntry, type KeyValueRowProps,
} from "./index.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function pairLabels(labels?: KeyValueRowProps["labels"]) {
  return {
    key: labels?.key ?? "Key",
    value: labels?.value ?? "Value",
    enabled: labels?.enabled ?? "Enabled",
    remove: labels?.remove ?? "Remove pair",
  };
}

export const PairRow = /* @__PURE__ */ forwardRef<HTMLDivElement, KeyValueRowProps>(function PairRow({
  value, onValueChange, errors, labels, keyOptions, controlSize = "sm", valueMode = "single-line",
  showEnabled = false, disabled = false, readOnly = false, onRemove, name, form, className, ...props
}, ref) {
  const names = pairLabels(labels);
  const removable = Boolean(onRemove) && !readOnly;
  if (!value.id.trim() || [names.key, names.value, showEnabled ? names.enabled : "Enabled", removable ? names.remove : "Remove pair"].some(label => !label.trim()))
    throw new Error("Flood KeyValueRow requires a stable ID and named controls");

  function change(patch: Partial<Omit<KeyValueEntry, "id">>) {
    if (!disabled && !readOnly) onValueChange({ ...value, ...patch });
  }

  return <div {...props} ref={ref} className={["flood-key-value-row", className].filter(Boolean).join(" ")}
    data-size={controlSize} data-enabled-control={showEnabled || undefined} data-removable={removable || undefined}>
    <Grid gap="2" className="flood-key-value-row__grid">
      {showEnabled && <div className="flood-key-value-row__enable">
        <Switch label={<VisuallyHidden>{names.enabled}</VisuallyHidden>} checked={value.enabled !== false}
          disabled={disabled} readOnly={readOnly} name={name ? `${name}[enabled]` : undefined} value="true" form={form}
          onChange={event => change({ enabled: event.currentTarget.checked })} />
      </div>}
      <div className="flood-key-value-row__key">
        <Field label={names.key} error={errors?.key}>{field => keyOptions?.length
          ? <Autocomplete {...field} data-key-value-key controlSize={controlSize} value={value.key} options={keyOptions}
              disabled={disabled} readOnly={readOnly} name={name ? `${name}[key]` : undefined} form={form}
              onValueChange={key => change({ key })} />
          : <Input {...field} data-key-value-key controlSize={controlSize} value={value.key} disabled={disabled} readOnly={readOnly}
              name={name ? `${name}[key]` : undefined} form={form} onChange={event => change({ key: event.currentTarget.value })} />}</Field>
      </div>
      <div className="flood-key-value-row__value">
        <Field label={names.value} error={errors?.value}>{field => valueMode === "multiline"
          ? <Textarea {...field} controlSize={controlSize} rows={2} autoGrow value={value.value} disabled={disabled} readOnly={readOnly}
              name={name ? `${name}[value]` : undefined} form={form} onChange={event => change({ value: event.currentTarget.value })} />
          : <Input {...field} controlSize={controlSize} value={value.value} disabled={disabled} readOnly={readOnly}
              name={name ? `${name}[value]` : undefined} form={form} onChange={event => change({ value: event.currentTarget.value })} />}</Field>
      </div>
      {removable && <div className="flood-key-value-row__remove">
        <IconButton label={names.remove} type="button" variant="ghost" size={controlSize} disabled={disabled} onClick={onRemove}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </IconButton>
      </div>}
    </Grid>
  </div>;
});

interface FocusRequest {
  opener: Element | null;
  id: string;
  /** For an addition, move to the new row. For a removal, wait for the removed row to leave. */
  kind: "add" | "remove";
  remainingIds: readonly string[];
}

export const PairEditor = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, KeyValueEditorProps>(function PairEditor({
  label, value, onValueChange, errorsById, labels, keyOptions, controlSize = "sm", valueMode = "single-line",
  showEnabled = false, disabled = false, readOnly = false, maxRows, name, form, className, ...props
}, forwardedRef) {
  const nextId = useId();
  const serial = useRef(0);
  const root = useRef<HTMLFieldSetElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<FocusRequest | null>(null);
  const rowNodes = useRef(new Map<string, HTMLDivElement>());
  const ids = value.map(entry => entry.id);
  const signature = JSON.stringify(ids);
  const canAdd = !disabled && !readOnly && (maxRows === undefined || value.length < maxRows);
  const addLabel = labels?.add ?? "Add pair";

  if (!label.trim() || !addLabel.trim() || ids.some(id => !id.trim()) || new Set(ids).size !== ids.length)
    throw new Error("Flood KeyValueEditor requires nonempty labels and unique row IDs");
  if (maxRows !== undefined && (!Number.isSafeInteger(maxRows) || maxRows < 1))
    throw new RangeError("Flood KeyValueEditor maxRows must be a positive safe integer");
  useImperativeHandle(forwardedRef, () => root.current!, []);

  useBrowserLayoutEffect(() => {
    const request = pendingFocus.current;
    const node = root.current;
    if (!request || !node) return;
    pendingFocus.current = null;
    const active = node.ownerDocument.activeElement;
    const lostOpener = active === node.ownerDocument.body &&
      (!request.opener?.isConnected || request.opener.matches(":disabled"));
    if ((active !== request.opener && !lostOpener) || disabled || readOnly) return;
    const accepted = rowNodes.current.has(request.id) === (request.kind === "add");
    if (!accepted) return;
    const row = request.kind === "add" ? rowNodes.current.get(request.id)
      : request.remainingIds.map(id => rowNodes.current.get(id)).find(Boolean);
    const target = row?.querySelector<HTMLInputElement>("[data-key-value-key]") ?? addButton.current;
    target?.focus();
  }, [signature, disabled, readOnly]);

  function append() {
    if (!canAdd) return;
    let id: string;
    do { id = `${nextId}-pair-${++serial.current}`; } while (ids.includes(id));
    pendingFocus.current = { opener: root.current?.ownerDocument.activeElement ?? null, id, kind: "add", remainingIds: [] };
    onValueChange([...value, { id, key: "", value: "", ...(showEnabled ? { enabled: true } : {}) }]);
  }

  function remove(entry: KeyValueEntry, index: number) {
    if (disabled || readOnly) return;
    const remainingIds = [ids[index + 1], ids[index - 1]].filter((id): id is string => Boolean(id));
    pendingFocus.current = { opener: root.current?.ownerDocument.activeElement ?? null, id: entry.id, kind: "remove", remainingIds };
    onValueChange(value.filter(item => item.id !== entry.id));
  }

  return <Fieldset {...props} ref={root} legend={label} disabled={disabled} form={form}
    className={["flood-key-value-editor", className].filter(Boolean).join(" ")}>
    <Stack gap="2">
      {value.map((entry, index) => {
        const rowLabel = labels?.row?.(entry, index) ?? `Pair ${index + 1}`;
        return <PairRow key={entry.id} data-continuation={index > 0 || undefined}
          ref={node => { if (node) rowNodes.current.set(entry.id, node); else rowNodes.current.delete(entry.id); }}
          role="group" aria-label={rowLabel} value={entry} keyOptions={keyOptions} controlSize={controlSize} valueMode={valueMode}
          name={name ? `${name}[${index}]` : undefined} form={form} showEnabled={showEnabled}
          disabled={disabled} readOnly={readOnly} errors={errorsById && Object.hasOwn(errorsById, entry.id) ? errorsById[entry.id] : undefined}
          labels={{ ...labels, remove: labels?.remove?.(entry, index) ?? `Remove ${rowLabel.toLowerCase()}` }}
          onValueChange={next => onValueChange(value.map(item => item.id === entry.id ? next : item))}
          onRemove={() => remove(entry, index)} />;
      })}
      {!readOnly && <div className="flood-key-value-editor__add">
        <Button ref={addButton} type="button" size={controlSize} variant="subtle" disabled={!canAdd} onClick={append}>
          <IconSlot size={controlSize}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </IconSlot>
          {addLabel}
        </Button>
      </div>}
    </Stack>
  </Fieldset>;
});
