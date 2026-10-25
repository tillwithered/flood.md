import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import type {FileInputProps, IconButton, IconSlot} from "./index.js";
import {resolveFieldStatus} from "./field-state.js";

interface Props extends FileInputProps {
  actionComponent: typeof IconButton;
  iconComponent: typeof IconSlot;
}

/** FileList and native form submission stay owned by the browser. */
export const FilePicker = forwardRef<HTMLInputElement, Props>(function FilePicker({
  actionComponent: Action, iconComponent: Icon, clearable = true,
  clearLabel = "Clear files", placeholder, controlSize = "md", className, style,
  status, invalid, disabled, multiple, onChange, onFilesChange, ...props
}, ref) {
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current!, []);
  const [names, setNames] = useState<string[]>([]);
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reset = (event: Event) => { timer = setTimeout(() => {
      if (!event.defaultPrevented && input.current) setNames(Array.from(input.current.files ?? [], file => file.name));
    }, 0); };
    form.addEventListener("reset", reset);
    return () => { form.removeEventListener("reset", reset); clearTimeout(timer); };
  }, [props.form]);
  const clear = () => {
    const node = input.current;
    if (!node || node.matches(":disabled")) return;
    node.value = "";
    node.dispatchEvent(new node.ownerDocument.defaultView!.Event("change", {bubbles: true}));
    node.focus();
  };
  const summary = names.join(", ");
  return <div hidden={props.hidden} dir={props.dir} lang={props.lang} style={style}
    className={["flood-input-group", "flood-file-input", `flood-control--${controlSize}`, className].filter(Boolean).join(" ")}
    data-status={resolveFieldStatus(status, invalid, props["aria-invalid"])} data-disabled={disabled || undefined}>
    <div className="flood-file-input__picker">
      <input {...props} ref={input} type="file" disabled={disabled} multiple={multiple}
        aria-invalid={invalid || status === "error" || props["aria-invalid"]}
        className="flood-file-input__native" onChange={event => {
          const files = Array.from(event.currentTarget.files ?? []);
          setNames(files.map(file => file.name));
          onChange?.(event);
          onFilesChange?.(files);
        }}/>
      <span className="flood-file-input__display" aria-hidden="true" data-empty={names.length === 0 || undefined}>
        <Icon size={controlSize}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V3m-4 4 4-4 4 4M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/></svg></Icon>
        <span className="flood-file-input__summary" title={summary || undefined}>{summary || placeholder || (multiple ? "Choose files" : "Choose a file")}</span>
      </span>
    </div>
    {clearable && names.length > 0 && <div className="flood-input-group__addon flood-input-group__addon--end"><Action label={clearLabel} size={controlSize} variant="ghost" disabled={disabled}
      onPointerDown={event => event.preventDefault()} onClick={clear}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg></Action></div>}
  </div>;
});
