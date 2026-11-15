import {forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef} from "react";
import {FileDropTarget, ScrollArea, Section, Stack, UploadItem, UploadList, type UploadQueueProps} from "./index.js";
import {tabbables} from "./overlay-runtime.js";
import {hasFieldContent} from "./field-state.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const UploadQueueContent = /* @__PURE__ */ forwardRef<HTMLElement, UploadQueueProps>(function UploadQueueContent({
  title, entries, picker, listLabel = title, maxListHeight = "18rem", density = "compact", emptyContent,
  headingSize = "group", className, onFocusCapture, onBlurCapture, ...props
}, ref) {
  if (entries.some(entry => !entry.id.trim()) || new Set(entries.map(entry => entry.id)).size !== entries.length) {
    throw new Error("Flood UploadQueue requires unique nonempty entry IDs");
  }
  const section = useRef<HTMLElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const pickerRoot = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<{element:HTMLElement; id:string; index:number} | null>(null);
  useImperativeHandle(ref, () => section.current!, []);

  useBrowserLayoutEffect(() => {
    const previous = lastFocused.current, root = section.current;
    if (!root || !previous || previous.element.isConnected) return;
    lastFocused.current = null;
    if (root.ownerDocument.activeElement !== root.ownerDocument.body) return;
    const rows = Array.from(list.current?.querySelectorAll<HTMLElement>(":scope > [data-upload-queue-entry]") ?? []);
    const nextIndex = entries.findIndex(entry => entry.id === previous.id);
    const targetIndex = nextIndex < 0 ? Math.min(previous.index, rows.length - 1) : nextIndex;
    const candidates = rows.map((row, index) => ({row, distance:Math.abs(index - targetIndex)}))
      .sort((a, b) => a.distance - b.distance);
    let nextAction: HTMLElement | undefined;
    for (const {row} of candidates) {
      nextAction = tabbables(row)[0];
      if (nextAction) break;
    }
    const fallback = nextAction ?? (pickerRoot.current && tabbables(pickerRoot.current)[0]) ?? root;
    fallback.focus();
  });

  return <Section {...props} ref={section} title={title} headingSize={headingSize} tabIndex={props.tabIndex ?? -1}
    className={["flood-upload-queue", className].filter(Boolean).join(" ")}
    onFocusCapture={event => {
      const row = event.target.closest<HTMLElement>("[data-upload-queue-entry]");
      const id = row?.dataset.uploadQueueEntry;
      lastFocused.current = id === undefined ? null : {element:event.target, id, index:entries.findIndex(entry => entry.id === id)};
      onFocusCapture?.(event);
    }}
    onBlurCapture={event => {
      if (event.relatedTarget && event.relatedTarget !== event.currentTarget.ownerDocument.body &&
          !event.currentTarget.contains(event.relatedTarget)) lastFocused.current = null;
      onBlurCapture?.(event);
    }}>
    {(picker || entries.length > 0 || hasFieldContent(emptyContent)) && <Stack gap="2">
      {picker && <FileDropTarget {...picker} ref={pickerRoot}/>}
      {entries.length > 0 ? <ScrollArea aria-label={listLabel} contentInset="none" className="flood-upload-queue__viewport"
        style={{maxBlockSize:maxListHeight}}>
        <UploadList ref={list} label={listLabel} appearance="plain" density={density} dividers={false}>
          {entries.map(({id, ...entry}) => <UploadItem key={id} {...entry} data-upload-queue-entry={id}/>)}
        </UploadList>
      </ScrollArea> : emptyContent}
    </Stack>}
  </Section>;
});
