import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { Button, Fieldset, FilterCondition, IconSlot, Inline, SegmentedControl, Stack, type FilterGroupProps } from './index.js';

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export const PredicateGroup = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, FilterGroupProps>(function PredicateGroup({
  label, properties, value, onValueChange, controlSize = 'sm', hideLabel = true, disabled = false,
  allowDuplicateProperties = false, maxConditions, labels, conditionLabels, className, ...props
}, forwardedRef) {
  const root = useRef<HTMLFieldSetElement>(null), add = useRef<HTMLButtonElement>(null), serial = useRef(0);
  const generated = useId();
  useImperativeHandle(forwardedRef, () => root.current!, []);
  const pending = useRef<{ kind: 'add' | 'remove'; id: string; next?: string; previous?: string; source: string; opener: Element | null } | null>(null);
  const ids = value.conditions.map(condition => condition.id);
  const source = JSON.stringify(ids);
  if (!label.trim() || !['all', 'any'].includes(value.match) || ids.some(id => !id.trim()) || new Set(ids).size !== ids.length)
    throw new Error('Flood FilterGroup requires a named group, unique condition IDs and a supported match mode');
  if (maxConditions !== undefined && (!Number.isSafeInteger(maxConditions) || maxConditions < 1))
    throw new Error('Flood FilterGroup maxConditions must be a positive safe integer');
  if (new Set(properties.map(property => property.id)).size !== properties.length || properties.some(property => !property.id.trim() || !property.label.trim()))
    throw new Error('Flood FilterGroup properties require unique nonempty IDs and labels');
  const names = { match: 'Match conditions', all: 'All conditions', any: 'Any condition', add: 'Add condition', condition: 'Condition', ...labels };
  if (Object.values(names).some(name => typeof name !== 'string' || !name.trim())) throw new Error('Flood FilterGroup control labels must be nonempty');
  const available = properties.filter(property => !property.disabled &&
    (allowDuplicateProperties || !value.conditions.some(condition => condition.property === property.id)));
  const canAdd = !disabled && available.length > 0 && (maxConditions === undefined || ids.length < maxConditions);

  useBrowserLayoutEffect(() => {
    const request = pending.current, node = root.current;
    if (!request || !node) return;
    const accepted = request.kind === 'add' ? ids.includes(request.id) : !ids.includes(request.id);
    if (!accepted) { if (source !== request.source) pending.current = null; return; }
    pending.current = null;
    const active = node.ownerDocument.activeElement;
    if (active !== request.opener && !(active === node.ownerDocument.body && (!request.opener?.isConnected || request.opener.matches(':disabled')))) return;
    const rows = Array.from(node.querySelectorAll<HTMLElement>('[data-filter-condition-id]'));
    const targetId = request.kind === 'add' ? request.id : ids.includes(request.next ?? '') ? request.next : request.previous;
    const row = rows.find(row => row.dataset.filterConditionId === targetId);
    (row?.querySelector<HTMLElement>('[role="combobox"]') ?? (add.current?.disabled ? node : add.current))?.focus({ preventScroll: true });
  }, [source]);

  function append() {
    if (!canAdd) return;
    let id: string;
    do { id = `${generated}-condition-${++serial.current}`; } while (ids.includes(id));
    pending.current = { kind: 'add', id, source, opener: root.current?.ownerDocument.activeElement ?? null };
    onValueChange({ ...value, conditions: [...value.conditions, { id, property: available[0].id, operator: 'is', values: [] }] });
  }
  function remove(id: string, index: number) {
    if (disabled) return;
    pending.current = { kind: 'remove', id, source, next: ids[index + 1], previous: ids[index - 1], opener: root.current?.ownerDocument.activeElement ?? null };
    onValueChange({ ...value, conditions: value.conditions.filter(condition => condition.id !== id) });
  }

  return <Fieldset {...props} ref={root} tabIndex={props.tabIndex ?? -1} legend={label} hideLabel={hideLabel} disabled={disabled}
    className={['flood-filter-group', className].filter(Boolean).join(' ')}>
    <Stack gap="3">
      {ids.length > 1 && <SegmentedControl label={names.match} name={`${generated}-match`} hideLabel controlSize={controlSize} value={value.match} disabled={disabled}
        options={[{ value: 'all', label: names.all }, { value: 'any', label: names.any }]}
        onValueChange={match => { if (!disabled) onValueChange({ ...value, match: match as 'all' | 'any' }); }} />}
      {value.conditions.map((condition, index) => <FilterCondition key={condition.id} data-filter-condition-id={condition.id}
        label={`${names.condition} ${index + 1}`} labels={conditionLabels} controlSize={controlSize} disabled={disabled}
        properties={properties.map(property => ({ ...property, disabled: property.disabled || (!allowDuplicateProperties && value.conditions.some(other => other.id !== condition.id && other.property === property.id)) }))}
        value={condition} onValueChange={next => { if (!disabled) onValueChange({ ...value, conditions: value.conditions.map(row => row.id === condition.id ? { ...row, ...next, id: row.id } : row) }); }}
        onRemove={() => remove(condition.id, index)} />)}
      <Inline gap="2"><Button ref={add} data-add-condition variant="subtle" size={controlSize} disabled={!canAdd} onClick={append}>
        <IconSlot size={controlSize}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></IconSlot>
        {names.add}
      </Button></Inline>
    </Stack>
  </Fieldset>;
});
