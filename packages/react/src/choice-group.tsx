import { forwardRef, useEffect, useLayoutEffect, useImperativeHandle, useRef, useState } from "react";
import type { Checkbox, Fieldset, FieldsetProps, ChoiceOption } from "./index.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface Props extends Omit<FieldsetProps, "children" | "defaultValue"> {
  name: string;
  options: readonly ChoiceOption[];
  kind: "radio" | "checkbox";
  selected?: readonly string[];
  initial: readonly string[];
  onSelectionChange?: (value: string[]) => void;
  required?: boolean;
  orientation: "vertical" | "horizontal";
  fieldsetComponent: typeof Fieldset;
  choiceComponent: typeof Checkbox;
}

/** Private selection model; native inputs own keyboard, focus, forms and validity. */
export const ChoiceGroup = forwardRef<HTMLFieldSetElement, Props>(function ChoiceGroup({
  kind, name, options, selected, initial, onSelectionChange, required, orientation,
  fieldsetComponent: Group, choiceComponent: Choice, legend, ...props
}, forwardedRef) {
  if (new Set(options.map(option => option.value)).size !== options.length) throw new Error("Flood choice group option values must be unique");
  const root = useRef<HTMLFieldSetElement>(null);
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const [local, setLocal] = useState(() => [...new Set(initial)]);
  const controlled = selected !== undefined;
  const values = controlled ? selected : local;
  const latest = useRef({ controlled, selected, initial });
  useBrowserLayoutEffect(() => { latest.current = { controlled, selected, initial }; });
  useImperativeHandle(forwardedRef, () => root.current!, []);
  useEffect(() => {
    const fieldset = root.current;
    if (!fieldset) return;
    const eventRoot = fieldset.getRootNode();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const reset = (event: Event) => {
      if (!fieldset.form || event.target !== fieldset.form) return;
      // Wait for the whole dispatch/default action, including React's delegated
      // reset handler. A microtask can run between native event listeners.
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (event.defaultPrevented || root.current !== fieldset || event.target !== fieldset.form) return;
        const current = latest.current;
        const next = [...new Set(current.controlled ? current.selected : current.initial)];
        if (!current.controlled) setLocal(next);
        // Controlled groups must also undo native DOM reset if the host keeps its value.
        inputs.current.forEach(input => { input.checked = next.includes(input.value); });
      }, 0);
      timers.add(timer);
    };
    eventRoot.addEventListener("reset", reset, true);
    return () => { eventRoot.removeEventListener("reset", reset, true); timers.forEach(clearTimeout); };
  }, []);

  return <Group {...props} ref={root} legend={required ? <>{legend}<span aria-hidden="true"> *</span></> : legend} role={kind === "radio" ? "radiogroup" : "group"}
    aria-required={kind === "radio" ? required || undefined : undefined}
    aria-orientation={kind === "radio" ? orientation : undefined}>
    <div className="flood-choice-group" data-orientation={orientation}>
      {options.length === 0 && <span className="flood-hint">No options available.</span>}
      {options.map(option => <Choice key={option.value} ref={input => { if (input) inputs.current.set(option.value, input); else inputs.current.delete(option.value); }} name={name} value={option.value} label={option.label}
        form={props.form} disabled={option.disabled} required={kind === "radio" ? required : undefined}
        checked={values.includes(option.value)} onChange={event => {
          const next = kind === "radio" ? [option.value] : [...new Set(event.currentTarget.checked ? [...values, option.value] : values.filter(value => value !== option.value))];
          if (!controlled) setLocal(next);
          onSelectionChange?.([...next]);
        }} />)}
    </div>
  </Group>;
});
