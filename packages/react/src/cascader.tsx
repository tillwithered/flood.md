import {forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes} from "react";
import {Button, Inline, ListBox, Popover, ScrollArea, Stack, Text} from "./index.js";
import {PageArrow} from "./navigation.js";

export interface CascaderOption {
  id: string;
  label: string;
  children?: readonly CascaderOption[];
  disabled?: boolean;
}

export interface CascaderProps extends Omit<HTMLAttributes<HTMLDivElement>,
  "children" | "defaultValue" | "onChange" | "placeholder"> {
  label: string;
  options: readonly CascaderOption[];
  /** IDs from the root option to a selectable leaf. An empty path clears the value. */
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: readonly string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  name?: string;
  form?: string;
  controlSize?: "sm" | "md" | "lg" | "xl";
  labels?: {
    previous?: string;
    branch?: string;
    required?: string;
    level?: (level: number, parent?: string) => string;
    path?: (labels: readonly string[]) => string;
  };
}

const empty: readonly string[] = [];

function resolve(options: readonly CascaderOption[], ids: readonly string[]) {
  const nodes: CascaderOption[] = [];
  let choices = options;
  for (const id of ids) {
    const node = choices.find(item => item.id === id);
    if (!node) break;
    nodes.push(node);
    choices = node.children ?? [];
  }
  return nodes;
}

/** Select a full category path by opening one branch at a time. */
export const Cascader = /* @__PURE__ */ forwardRef<HTMLDivElement, CascaderProps>(function Cascader({
  label, options, value, defaultValue = empty, onValueChange, placeholder = "Select an option",
  disabled, readOnly, required, name, form, controlSize = "md", labels, id, className, ...props
}, ref) {
  const generated = useId();
  const labelId = `${generated}-label`;
  const valueId = `${generated}-value`;
  const errorId = `${generated}-error`;
  const initial = useRef(defaultValue);
  const [local, setLocal] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [draft, setDraft] = useState<readonly string[]>(empty);
  const committedIds = value ?? local;
  const resolvedValue = resolve(options, committedIds);
  const committed = resolvedValue.length === committedIds.length && !resolvedValue.at(-1)?.children?.length
    ? resolvedValue : [];
  const branches = resolve(options, draft).filter(node => node.children?.length);
  const columns = [options, ...branches.map(node => node.children!)];
  const triggerRef = useRef<HTMLButtonElement>(null);
  const currentColumn = useRef<HTMLDivElement>(null);
  const validation = useRef<HTMLInputElement>(null);
  const toFocus = useRef<number | undefined>(undefined);
  const columnRefs = useRef<Array<HTMLDivElement | null>>([]);
  const visible = open && !disabled && !readOnly;
  const missing = !!required && !committed.length && !readOnly;
  const message = labels?.required ?? "Choose a value.";
  const display = committed.length ? labels?.path?.(committed.map(node => node.label)) ??
    committed.map(node => node.label).join(" / ") : placeholder;

  useEffect(() => {
    const owner = validation.current?.form;
    if (!owner) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = (event: Event) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (event.defaultPrevented) return;
        if (value === undefined) setLocal(initial.current);
        setTouched(false);
        setOpen(false);
      }, 0);
    };
    owner.addEventListener("reset", reset);
    return () => { owner.removeEventListener("reset", reset); clearTimeout(timer); };
  }, [form, value === undefined]);

  useEffect(() => {
    if (disabled || readOnly) setOpen(false);
  }, [disabled, readOnly]);

  useEffect(() => {
    if (toFocus.current === undefined || !visible) return;
    const node = columnRefs.current[toFocus.current];
    toFocus.current = undefined;
    if (!node) return;
    node.focus({preventScroll: true});
    node.scrollIntoView({block: "nearest", inline: "nearest"});
  }, [branches.length, draft, visible]);

  function focusColumn(level: number) {
    const node = columnRefs.current[level];
    node?.focus({preventScroll: true});
    node?.scrollIntoView({block: "nearest", inline: "nearest"});
  }

  function choose(option: CascaderOption, level: number) {
    if (option.disabled || disabled || readOnly || triggerRef.current?.matches(":disabled")) return;
    const path = [...branches.slice(0, level).map(node => node.id), option.id];
    if (option.children?.length) {
      toFocus.current = level + 1;
      setDraft(path);
      return;
    }
    if (value === undefined) setLocal(path);
    if (path.length !== committedIds.length || path.some((id, index) => id !== committedIds[index])) onValueChange?.(path);
    setTouched(false);
    setOpen(false);
  }

  return <Stack {...props} ref={ref} gap="1" className={["flood-cascader", className].filter(Boolean).join(" ")}>
    <Popover title={label} chrome="minimal" open={visible} disabled={disabled || readOnly} initialFocusRef={currentColumn}
      className="flood-cascader__panel" onOpenChange={next => {
        if (next) {
          setDraft(committed.slice(0, -1).map(node => node.id));
          setOpen(true);
        } else setOpen(false);
      }}
      trigger={control => <Button {...control} ref={node => { control.ref(node); triggerRef.current = node; }}
        id={id} size={controlSize} variant="outline" aria-labelledby={props["aria-labelledby"] ?? `${labelId} ${valueId}`}
        aria-describedby={[props["aria-describedby"], touched && missing ? errorId : null].filter(Boolean).join(" ") || undefined}
        aria-invalid={touched && missing ? true : props["aria-invalid"]}
        disabled={disabled} aria-disabled={readOnly || undefined} onClick={readOnly ? undefined : control.onClick}
        className="flood-cascader__trigger">
        <span id={labelId} className="flood-visually-hidden">{label}</span>
        <span id={valueId} className="flood-cascader__value" data-placeholder={!committed.length || undefined}>{display}</span>
        <span className="flood-cascader__arrow" aria-hidden="true"><PageArrow previous={false} /></span>
      </Button>}>
      {branches.length > 0 && <Inline className="flood-cascader__navigation">
        <Button variant="ghost" size="sm" onClick={() => {
          toFocus.current = branches.length - 1;
          setDraft(branches.slice(0, -1).map(node => node.id));
        }}>{labels?.previous ?? "Back"}</Button>
        <Text size="helper" tone="subtle">{branches.at(-1)?.label}</Text>
      </Inline>}
      <ScrollArea orientation="horizontal" tabIndex={-1} className="flood-cascader__tracks">
        <div className="flood-cascader__columns">
          {columns.map((items, level) => <div key={JSON.stringify(draft.slice(0, level))}
            className="flood-cascader__column" data-current={level === columns.length - 1 || undefined}>
            <ScrollArea tabIndex={-1} className="flood-cascader__column-scroll">
              <ListBox ref={node => {
                columnRefs.current[level] = node;
                if (level === columns.length - 1) currentColumn.current = node;
              }}
                label={labels?.level?.(level + 1, branches[level - 1]?.label) ??
                  (level ? `Options in ${branches[level - 1]?.label}` : label)}
                hideLabel appearance="plain" controlSize={controlSize} form={form}
                selectionBehavior="manual" value={branches[level]?.id ??
                  (branches.every((node, i) => committed[i]?.id === node.id) ? committed[level]?.id : undefined) ?? ""}
                options={items.map(item => ({value: item.id, label: item.label, disabled: item.disabled,
                  description: item.children?.length ? labels?.branch ?? "More options" : undefined}))}
                onValueChange={id => {
                  const choice = items.find(item => item.id === id);
                  if (choice) choose(choice, level);
                }}
                onKeyDown={event => {
                  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
                      event.shiftKey || event.nativeEvent.isComposing) return;
                  const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
                  const forward = rtl ? "ArrowLeft" : "ArrowRight";
                  const backward = rtl ? "ArrowRight" : "ArrowLeft";
                  if (event.key === forward) {
                    const active = event.currentTarget.getAttribute("aria-activedescendant");
                    const item = items.find((_, index) => active === `${event.currentTarget.id}-option-${index}`);
                    if (item?.children?.length && !item.disabled) {
                      event.preventDefault();
                      choose(item, level);
                    }
                  } else if (event.key === backward && level > 0) {
                    event.preventDefault();
                    toFocus.current = level - 1;
                    setDraft(branches.slice(0, level - 1).map(node => node.id));
                  } else if (event.key === backward) {
                    event.preventDefault();
                    focusColumn(0);
                  }
                }} />
            </ScrollArea>
          </div>)}
        </div>
      </ScrollArea>
    </Popover>
    <input ref={validation} type="text" className="flood-form-control__sr-only" tabIndex={-1} aria-hidden="true"
      autoComplete="off" form={form} disabled={disabled} readOnly={readOnly} required={required && !readOnly}
      value={committed.length ? "selected" : ""} onChange={() => {}} onInvalid={event => {
        event.preventDefault();
        setTouched(true);
        triggerRef.current?.focus();
      }} />
    {name && <input type="hidden" name={name} form={form} disabled={disabled}
      value={committed.length ? JSON.stringify(committed.map(node => node.id)) : ""} />}
    {touched && missing && <Text id={errorId} size="helper" tone="error" role="alert">{message}</Text>}
  </Stack>;
});
