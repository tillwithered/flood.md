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
  clearLabel = "Clear files", selectionLabel = "Selected files", removeFileLabel = "Remove file", placeholder, controlSize = "md", className, style,
  status, invalid, disabled, multiple, onChange, onFilesChange, ...props
}, ref) {
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current!, []);
  const [files, setFiles] = useState<File[]>([]);
  const selected = useRef<File[]>([]);
  const replacing = useRef(false);
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reset = (event: Event) => { timer = setTimeout(() => {
      if (!event.defaultPrevented && input.current) {
        selected.current = Array.from(input.current.files ?? []);
        setFiles(selected.current);
      }
    }, 0); };
    form.addEventListener("reset", reset);
    return () => { form.removeEventListener("reset", reset); clearTimeout(timer); };
  }, [props.form]);
  const clear = () => {
    const node = input.current;
    if (!node || node.matches(":disabled")) return;
    notify([]);
    node.focus();
  };
  const notify = (next: readonly File[]) => {
    const node = input.current;
    if (!node || node.matches(":disabled")) return;
    const transfer = new node.ownerDocument.defaultView!.DataTransfer();
    next.forEach(file => transfer.items.add(file));
    node.files = transfer.files;
    replacing.current = true;
    try { node.dispatchEvent(new node.ownerDocument.defaultView!.Event("change", {bubbles:true})); }
    finally { replacing.current = false; }
  };
  const summary = multiple && files.length ? `${selectionLabel} (${files.length})` : files[0]?.name ?? "";
  const cross = <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>;
  const fileSize = (size: number) => new Intl.NumberFormat(props.lang, {style:"unit",unit:size < 1000 ? "byte" : size < 1000000 ? "kilobyte" : "megabyte",maximumFractionDigits:1}).format(size < 1000 ? size : size < 1000000 ? size / 1000 : size / 1000000);
  return <div className="flood-file-input-field" hidden={props.hidden} dir={props.dir} lang={props.lang}><div hidden={props.hidden} dir={props.dir} lang={props.lang} style={style}
    className={["flood-input-group", "flood-file-input", `flood-control--${controlSize}`, className].filter(Boolean).join(" ")}
    data-status={resolveFieldStatus(status, invalid, props["aria-invalid"])} data-disabled={disabled || undefined}>
    <div className="flood-file-input__picker">
      <input {...props} ref={input} type="file" disabled={disabled} multiple={multiple}
        aria-invalid={invalid || status === "error" || props["aria-invalid"]}
        className="flood-file-input__native" onChange={event => {
          const node = event.currentTarget;
          const picked = Array.from(node.files ?? []);
          let next = picked;
          if (multiple && !replacing.current && picked.length > 0) {
            const seen = new Set<string>();
            next = [...selected.current, ...picked].filter(file => {
              const identity = JSON.stringify([file.name, file.size, file.type, file.lastModified, file.webkitRelativePath]);
              if (seen.has(identity)) return false;
              seen.add(identity);
              return true;
            });
            const transfer = new node.ownerDocument.defaultView!.DataTransfer();
            next.forEach(file => transfer.items.add(file));
            node.files = transfer.files;
          }
          selected.current = next;
          setFiles(next);
          onChange?.(event);
          onFilesChange?.(next);
        }}/>
      <span className="flood-file-input__display" aria-hidden="true" data-empty={files.length === 0 || undefined}>
        <Icon size={controlSize}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V3m-4 4 4-4 4 4M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/></svg></Icon>
        <span className="flood-file-input__summary" title={summary || undefined}>{summary || placeholder || (multiple ? "Choose files" : "Choose a file")}</span>
      </span>
    </div>
    {clearable && files.length > 0 && <div className="flood-input-group__addon flood-input-group__addon--end"><Action label={clearLabel} size={controlSize} variant="ghost" disabled={disabled}
      onPointerDown={event => event.preventDefault()} onClick={clear}>{cross}</Action></div>}
  </div>
    {multiple && files.length > 0 && <details className="flood-file-input__selection" open>
      <summary>{selectionLabel}<span className="flood-file-input__count">{files.length}</span></summary>
      <ul className="flood-file-input__list">
        {files.map((file, index) => <li className="flood-file-input__file" key={`${file.name}-${file.lastModified}-${index}`}>
          <span className="flood-file-input__metadata"><span className="flood-file-input__name" dir="auto">{file.name}</span><span className="flood-file-input__size">{fileSize(file.size)}</span></span>
          {clearable && <Action label={`${removeFileLabel} ${file.name}`} size="sm" variant="ghost" disabled={disabled} onClick={event => {
            const node = input.current;
            if (!node || node.matches(":disabled")) return;
            const list = event.currentTarget.closest("ul")!;
            notify(Array.from(node.files ?? []).filter((_, position) => position !== index));
            node.ownerDocument.defaultView!.requestAnimationFrame(() => {
              if (!node.isConnected) return;
              const buttons = list.querySelectorAll<HTMLButtonElement>("button");
              (buttons[Math.min(index, buttons.length - 1)] ?? node).focus();
            });
          }}>{cross}</Action>}
        </li>)}
      </ul>
    </details>}
  </div>;
});
