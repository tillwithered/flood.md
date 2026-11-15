import { Fragment, forwardRef, useEffect, useLayoutEffect, useImperativeHandle, useRef, useState, type ChangeEvent, type ReactNode, type RefCallback } from "react";
import { Grid, type Checkbox, type Fieldset, type FieldsetProps, type ChoiceOption, type GridProps } from "./index.js";

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
  cards?: { minItemWidth: GridProps["minItemWidth"]; render: (index: number, input: GroupInputProps) => ReactNode };
}

type GroupInputProps = {
  ref: RefCallback<HTMLInputElement>;
  name: string;
  value: string;
  form?: string;
  disabled?: boolean;
  required?: boolean;
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

/** Private selection model; native inputs own keyboard, focus, forms and validity. */
export const ChoiceGroup = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, Props>(function ChoiceGroup({
  kind, name, options, selected, initial, onSelectionChange, required, orientation,
  fieldsetComponent: Group, choiceComponent: Choice, cards, legend, ...props
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

  const choices = options.map((option,index) => {
    const input: GroupInputProps = {
      ref: node => { if (node) inputs.current.set(option.value, node); else inputs.current.delete(option.value); },
      name, value:option.value, form:props.form, disabled:option.disabled, required:kind === "radio" ? required : undefined,
      checked:values.includes(option.value), onChange:event => {
          const next = kind === "radio" ? [option.value] : [...new Set(event.currentTarget.checked ? [...values, option.value] : values.filter(value => value !== option.value))];
          if (!controlled) setLocal(next);
          onSelectionChange?.([...next]);
      },
    };
    return cards ? <Fragment key={option.value}>{cards.render(index,input)}</Fragment> :
      <Choice key={option.value} {...input} label={option.label} />;
  });
  const content=options.length ? choices : <span className="flood-hint">No options available.</span>;
  return <Group {...props} ref={root} legend={required ? <>{legend}<span aria-hidden="true"> *</span></> : legend} role={kind === "radio" ? "radiogroup" : "group"}
    aria-required={kind === "radio" ? required || undefined : undefined}
    aria-orientation={kind === "radio" && !cards ? orientation : undefined}>
    {cards ? <Grid gap="2" minItemWidth={cards.minItemWidth} className="flood-choice-cards">{content}</Grid> :
      <div className="flood-choice-group" data-orientation={orientation}>{content}</div>}
  </Group>;
});
