import { forwardRef } from 'react';
import { Field, Fieldset, Grid, IconButton, MultiSelect, Select, type FilterConditionProps } from './index.js';

/** One controlled finite-choice predicate. Query execution and draft/application belong to the host. */
export const PredicateRow = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, FilterConditionProps>(function PredicateRow({
  label, properties, value, onValueChange, onRemove, controlSize = 'sm', labels,
  disabled = false, hideLabel = true, className, ...props
}, ref) {
  const property = properties.find(property => property.id === value.property);
  if (!label.trim() || !properties.length || new Set(properties.map(property => property.id)).size !== properties.length ||
      properties.some(property => !property.id.trim() || !property.label.trim()) || !property ||
      !['is', 'is-not'].includes(value.operator)) throw new Error('Flood FilterCondition requires named unique properties and a supported predicate');
  const names = {
    property: `${label} property`, operator: `${label} operator`, values: `${label} values`,
    include: 'is any of', exclude: 'is none of', placeholder: 'Choose values…', remove: `Remove ${label.charAt(0).toLowerCase()}${label.slice(1)}`,
    ...labels,
  };
  return <Fieldset {...props} ref={ref} legend={label} hideLabel={hideLabel} disabled={disabled}
    className={['flood-filter-condition', className].filter(Boolean).join(' ')} data-removable={Boolean(onRemove)}>
    <Grid gap="2" className="flood-filter-condition__row">
      <Field label={names.property} hideLabel>{field => <Select {...field} controlSize={controlSize} value={value.property} disabled={disabled}
        onChange={event => { if (!disabled) onValueChange({ ...value, property: event.currentTarget.value, values: [] }); }}>
        {properties.map(property => <option key={property.id} value={property.id} disabled={property.disabled}>{property.label}</option>)}
      </Select>}</Field>
      <Field label={names.operator} hideLabel>{field => <Select {...field} controlSize={controlSize} value={value.operator} disabled={disabled}
        onChange={event => { if (!disabled) onValueChange({ ...value, operator: event.currentTarget.value as 'is' | 'is-not' }); }}>
        <option value="is">{names.include}</option><option value="is-not">{names.exclude}</option>
      </Select>}</Field>
      <div className="flood-filter-condition__values"><Field label={names.values} hideLabel>{field => <MultiSelect {...field} controlSize={controlSize}
        options={property.options} value={value.values} placeholder={names.placeholder} disabled={disabled}
        onValueChange={values => { if (!disabled) onValueChange({ ...value, values }); }} />}</Field></div>
      {onRemove && <IconButton label={names.remove} size={controlSize} variant="subtle" disabled={disabled}
        className="flood-filter-condition__remove" onClick={() => { if (!disabled) onRemove(); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </IconButton>}
    </Grid>
  </Fieldset>;
});
