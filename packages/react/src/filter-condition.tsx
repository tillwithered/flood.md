import { forwardRef, type ReactNode } from 'react';
import {
  DatePicker, Field, Fieldset, Grid, IconButton, Input, MultiSelect, NumberInput, Select,
  type FilterConditionProps, type TypedFilterConditionProps, type TypedFilterConditionProperty,
  type TypedFilterConditionValue, type TypedFilterOperand,
} from './index.js';

const scalarLabels = {
  contains: 'contains',
  equals: 'equals',
  'starts-with': 'starts with',
  'at-least': 'is at least',
  'at-most': 'is at most',
  before: 'is before',
  after: 'is after',
};

const operators = {
  choice: ['is', 'is-not'],
  text: ['contains', 'equals', 'starts-with'],
  number: ['at-least', 'at-most', 'equals'],
  date: ['equals', 'before', 'after'],
} as const satisfies Record<TypedFilterOperand['kind'], readonly TypedFilterOperand['operator'][]>;

export function emptyTypedCondition(property: TypedFilterConditionProperty): TypedFilterConditionValue {
  const id = property.id;
  switch (property.kind) {
    case 'choice': return { property: id, kind: 'choice', operator: 'is', values: [] };
    case 'text': return { property: id, kind: 'text', operator: 'contains', text: '' };
    case 'number': return { property: id, kind: 'number', operator: 'at-least', number: null };
    case 'date': return { property: id, kind: 'date', operator: 'equals', date: '' };
  }
}

function typedOperator(value: TypedFilterConditionValue, operator: string): TypedFilterConditionValue {
  switch (value.kind) {
    case 'choice': return { ...value, operator: operator as Extract<TypedFilterOperand, {kind:'choice'}>['operator'] };
    case 'text': return { ...value, operator: operator as Extract<TypedFilterOperand, {kind:'text'}>['operator'] };
    case 'number': return { ...value, operator: operator as Extract<TypedFilterOperand, {kind:'number'}>['operator'] };
    case 'date': return { ...value, operator: operator as Extract<TypedFilterOperand, {kind:'date'}>['operator'] };
  }
}

function operandControl(
  props: TypedFilterConditionProps,
  property: TypedFilterConditionProperty,
  label: string,
  placeholder: string,
): ReactNode {
  const { value, onValueChange, controlSize = 'sm', disabled = false } = props;
  switch (value.kind) {
    case 'text':
      return <Field label={label} hideLabel>{field => <Input {...field} controlSize={controlSize} disabled={disabled}
        value={value.text} onChange={event => onValueChange({ ...value, text: event.currentTarget.value })} />}</Field>;
    case 'number':
      return <Field label={label} hideLabel>{field => <NumberInput {...field} controlSize={controlSize} disabled={disabled}
        appearance="plain" value={value.number} onValueChange={number => onValueChange({ ...value, number })} />}</Field>;
    case 'date':
      return <DatePicker label={label} hideLabel locale={props.locale} controlSize={controlSize} disabled={disabled}
        value={value.date} onValueChange={date => onValueChange({ ...value, date })} />;
    case 'choice':
      return <Field label={label} hideLabel>{field => <MultiSelect {...field} controlSize={controlSize} disabled={disabled}
        options={property.kind === 'choice' ? property.options : []} placeholder={placeholder} value={value.values}
        onValueChange={values => onValueChange({ ...value, values })} />}</Field>;
  }
}

/** The host decides when to apply the predicate and how to execute it. */
export const PredicateRow = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, FilterConditionProps | TypedFilterConditionProps>(function PredicateRow(allProps, ref) {
  const {
    label, properties, value, onValueChange: _onValueChange, onRemove, controlSize = 'sm', labels,
    disabled = false, hideLabel = true, className, mode, ...fieldset
  } = allProps;
  const property = properties.find(candidate => candidate.id === value.property);
  const typed = allProps.mode === 'typed';
  const operatorOptions: readonly string[] = typed ? operators[allProps.value.kind] : operators.choice;
  if (!label.trim() || !properties.length || new Set(properties.map(candidate => candidate.id)).size !== properties.length ||
      properties.some(candidate => !candidate.id.trim() || !candidate.label.trim()) || !property ||
      !operatorOptions?.includes(value.operator) ||
      (typed && (!('kind' in property) || property.kind !== allProps.value.kind))) {
    throw new Error('Flood FilterCondition requires named unique properties and a supported predicate');
  }

  const names = {
    property: `${label} property`, operator: `${label} operator`, values: `${label} values`,
    include: 'is any of', exclude: 'is none of', placeholder: 'Choose values…',
    remove: `Remove ${label.charAt(0).toLowerCase()}${label.slice(1)}`, ...labels,
  };
  const customLabels = typed ? allProps.operatorLabels : undefined;
  const labelsByOperator: Record<string, string> = { 'is': names.include, 'is-not': names.exclude, ...scalarLabels, ...customLabels };
  const { operatorLabels: _labels, locale: _locale, ...native } = fieldset as typeof fieldset & {
    operatorLabels?: TypedFilterConditionProps['operatorLabels'];
    locale?: string;
  };

  function changeProperty(id: string) {
    if (disabled) return;
    if (allProps.mode === 'typed') {
      const next = allProps.properties.find(item => item.id === id);
      if (next && !next.disabled) allProps.onValueChange(emptyTypedCondition(next));
    } else {
      allProps.onValueChange({ ...allProps.value, property: id, values: [] });
    }
  }

  function changeOperator(operator: string) {
    if (disabled || !operatorOptions.includes(operator)) return;
    if (allProps.mode === 'typed') allProps.onValueChange(typedOperator(allProps.value, operator));
    else allProps.onValueChange({ ...allProps.value, operator: operator as FilterConditionProps['value']['operator'] });
  }

  const operand = typed
    ? operandControl(allProps, property as TypedFilterConditionProperty, names.values, names.placeholder)
    : <Field label={names.values} hideLabel>{field => <MultiSelect {...field} controlSize={controlSize}
        options={'options' in property ? property.options : []} value={allProps.value.values} placeholder={names.placeholder} disabled={disabled}
        onValueChange={values => { if (!disabled) allProps.onValueChange({ ...allProps.value, values }); }} />}</Field>;

  return <Fieldset {...native} ref={ref} legend={label} hideLabel={hideLabel} disabled={disabled}
    className={['flood-filter-condition', className].filter(Boolean).join(' ')} data-removable={Boolean(onRemove)} data-mode={mode}>
    <Grid gap="2" className="flood-filter-condition__row">
      <Field label={names.property} hideLabel>{field => <Select {...field} controlSize={controlSize} value={value.property} disabled={disabled}
        onChange={event => changeProperty(event.currentTarget.value)}>
        {properties.map(candidate => <option key={candidate.id} value={candidate.id} disabled={candidate.disabled}>{candidate.label}</option>)}
      </Select>}</Field>
      <Field label={names.operator} hideLabel>{field => <Select {...field} controlSize={controlSize} value={value.operator} disabled={disabled}
        onChange={event => changeOperator(event.currentTarget.value)}>
        {operatorOptions.map(operator => <option key={operator} value={operator}>{labelsByOperator[operator]}</option>)}
      </Select>}</Field>
      <div className="flood-filter-condition__values">{operand}</div>
      {onRemove && <IconButton label={names.remove} size={controlSize} variant="subtle" disabled={disabled}
        className="flood-filter-condition__remove" onClick={() => { if (!disabled) onRemove(); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </IconButton>}
    </Grid>
  </Fieldset>;
});
