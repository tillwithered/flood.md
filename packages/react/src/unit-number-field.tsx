import {forwardRef, useId} from "react";
import {Fieldset, Field, Grid, Input, NumberInput, Select, type UnitNumberFieldProps} from "./index.js";
import {hasFieldContent, mergeDescriptions, resolveFieldStatus} from "./field-state.js";

export const UnitNumberEditor = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, UnitNumberFieldProps>(function UnitNumberEditor({
  label, units, value, onValueChange, amountLabel = "Amount", unitLabel = "Unit", amountName, unitName,
  min, max, step, required, readOnly, controlSize = "md", form, id: explicitId, className,
  hint, error, message, status, "aria-describedby": describedBy, "aria-invalid": ariaInvalid, ...props
}, ref) {
  const generatedId = useId();
  const id = explicitId ?? `flood-${generatedId}`;
  const selectedUnit = units.find(option => option.value === value.unit);
  if (!label.trim() || !amountLabel.trim() || !unitLabel.trim()) throw new Error("Flood UnitNumberField requires group and control names");
  if (!selectedUnit || new Set(units.map(option => option.value)).size !== units.length
    || units.some(option => !option.value.trim() || !option.label.trim())) {
    throw new Error("Flood UnitNumberField requires unique, named units and a selected unit");
  }

  const hasError = hasFieldContent(error);
  const resolvedStatus = resolveFieldStatus(status, hasError, ariaInvalid);
  const description = mergeDescriptions(describedBy, hasFieldContent(hint) && `${id}-hint`,
    hasError ? `${id}-error` : hasFieldContent(message) && `${id}-message`);

  return <Fieldset {...props} ref={ref} id={id} form={form} legend={label} hint={hint} error={error} message={message}
    className={["flood-unit-number-field", className].filter(Boolean).join(" ")}
    status={resolvedStatus} aria-describedby={describedBy} aria-invalid={ariaInvalid}>
    <Grid className="flood-unit-number-field__layout" gap="3">
      <Field label={amountLabel} describedBy={description} status={resolvedStatus} required={required}>
        {field => <NumberInput {...field} name={amountName} form={form} value={value.amount}
          onValueChange={amount => onValueChange?.({amount, unit:value.unit})} min={min} max={max} step={step}
          appearance="plain" controlSize={controlSize} readOnly={readOnly} />}
      </Field>
      <Field label={unitLabel} describedBy={description} status={resolvedStatus}>
        {field => readOnly
          ? <><Input {...field} form={form} value={selectedUnit.label} controlSize={controlSize} readOnly />
            {unitName !== undefined && <input type="hidden" name={unitName} form={form} value={value.unit} />}</>
          : <Select {...field} name={unitName} form={form} value={value.unit} controlSize={controlSize}
              onChange={event => onValueChange?.({amount:value.amount, unit:event.currentTarget.value})}>
              {units.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
            </Select>}
      </Field>
    </Grid>
  </Fieldset>;
});
