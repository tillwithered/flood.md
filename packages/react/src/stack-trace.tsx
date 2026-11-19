import { forwardRef, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { DataList, DataListItem, IconButton, List, ScrollArea, Text, TruncatedText, type StackFrameProps, type StackTraceProps } from "./index.js";
import { SourceLine } from "./source-line.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const TraceFrame = /* @__PURE__ */ forwardRef<HTMLLIElement, StackFrameProps>(function TraceFrame({
  frame, open, defaultOpen = false, onOpenChange, labels, className, ...props
}, ref) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const expanded = open ?? localOpen;
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const hadPanelFocus = useRef(false);
  const names = {
    anonymous: labels?.anonymous ?? "(anonymous)",
    source: labels?.source ?? "Source context",
    showSource: labels?.showSource ?? "Show source context",
    hideSource: labels?.hideSource ?? "Hide source context",
    currentLine: labels?.currentLine ?? "Current source line",
  };
  const source = frame.source ?? [];
  const hasSource = source.length > 0;
  const showSource = hasSource && expanded;
  const validNumber = (value: number) => Number.isSafeInteger(value) && value > 0;
  if (!frame.id.trim() || Object.values(names).some(name => !name.trim()))
    throw new Error("Flood StackFrame requires a unique frame ID and readable labels");
  if ((frame.line !== undefined && !validNumber(frame.line)) ||
    (frame.column !== undefined && (frame.line === undefined || !validNumber(frame.column))) ||
    source.some(({ line, text }, index) => !validNumber(line) || /[\r\n]/.test(text) || (index > 0 && line <= source[index - 1].line)))
    throw new Error("Flood StackFrame source rows require ascending positive line numbers and one source line per entry");

  useBrowserLayoutEffect(() => {
    if (showSource || !hadPanelFocus.current) return;
    const active = trigger.current?.ownerDocument.activeElement;
    if (active === trigger.current?.ownerDocument.body || panel.current?.contains(active ?? null)) trigger.current?.focus();
    hadPanelFocus.current = false;
  }, [showSource]);

  const location = [frame.path, frame.line, frame.column].filter(value => value !== undefined && value !== "").join(":");
  const title = <Text id={`${id}-function`} size="compact">{frame.functionName?.trim() || names.anonymous}</Text>;
  const description = location && <TruncatedText id={`${id}-location`} className="flood-stack-frame__location" preserveEnd={24}>{location}</TruncatedText>;
  const triggerDescription = `${id}-function${location ? ` ${id}-location` : ""}`;
  const sourceAction = hasSource && <IconButton ref={trigger} label={showSource ? names.hideSource : names.showSource}
    size="sm" variant="ghost" aria-expanded={showSource} aria-controls={`${id}-source`} aria-describedby={triggerDescription} onClick={() => {
      if (open === undefined) setLocalOpen(!expanded);
      onOpenChange?.(!expanded);
    }}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
      strokeLinejoin="round" className="flood-stack-frame__chevron" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  </IconButton>;

  return <DataListItem {...props} ref={ref} layout="content" title={title} description={description} actions={sourceAction}
    className={["flood-stack-frame", className].filter(Boolean).join(" ")} data-source-open={showSource || undefined}
    details={hasSource && <div ref={panel} id={`${id}-source`} hidden={!showSource}
      onFocusCapture={() => { hadPanelFocus.current = true; }}
      onBlurCapture={event => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) hadPanelFocus.current = false;
      }}>
      {showSource && <ScrollArea orientation="horizontal" aria-label={names.source} className="flood-stack-frame__source">
        <List ordered marker={false} gap="0" className="flood-stack-frame__snippet">
          {source.map(row => <li key={row.line} className="flood-stack-frame__line"
            aria-current={row.line === frame.line ? "location" : undefined}>
            <span className="flood-stack-frame__line-number">{row.line}</span>
            <SourceLine text={row.text} label={row.line === frame.line ? names.currentLine : undefined} />
          </li>)}
        </List>
      </ScrollArea>}
    </div>} />;
});

export const TraceList = /* @__PURE__ */ forwardRef<HTMLUListElement, StackTraceProps>(function TraceList({
  label, frames, openIds, defaultOpenIds = [], onOpenIdsChange, labels, emptyLabel = "No stack frames.",
  density = "compact", dividers = false, className, ...props
}, ref) {
  const [localOpenIds, setLocalOpenIds] = useState(defaultOpenIds);
  const ids = new Set(frames.map(frame => frame.id));
  const expandedIds = new Set((openIds ?? localOpenIds).filter(id => ids.has(id)));
  if (![label, emptyLabel].every(name => name.trim()) || ids.size !== frames.length)
    throw new Error("Flood StackTrace requires a readable label and unique frame IDs");

  return <DataList {...props} ref={ref} aria-label={label} density={density} dividers={dividers}
    className={["flood-stack-trace", className].filter(Boolean).join(" ")}>
    {frames.length ? frames.map(frame => <TraceFrame key={frame.id} frame={frame} labels={labels} open={expandedIds.has(frame.id)}
      onOpenChange={open => {
        const next = new Set(expandedIds);
        if (open) next.add(frame.id);
        else next.delete(frame.id);
        if (openIds === undefined) setLocalOpenIds([...next]);
        onOpenIdsChange?.([...next]);
      }} />) : <DataListItem title={<Text size="compact" tone="subtle">{emptyLabel}</Text>} />}
  </DataList>;
});
