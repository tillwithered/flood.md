import { forwardRef, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Button, CodeSnippet, CopyButton, DataList, DataListItem, FindBar, HighlightText, IconButton, Inline, LiveFollowControl, ScrollArea, Stack,
  StatusIndicator, Text, Timestamp, type LogContextBoundary, type LogContextProps, type LogRowProps, type LogViewerProps,
} from "./index.js";
import { parseInstant } from "./timestamp.js";
import { literalMatchPattern } from "./literal-match.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const severityLabels = { debug: "Debug", info: "Info", warning: "Warning", error: "Error" };
const severityTones = { debug: "neutral", info: "info", warning: "warning", error: "error" } as const;

function ContextBoundary({state, label, exhaustedLabel}: {state: LogContextBoundary; label: string; exhaustedLabel: string}) {
  return <Stack gap="1" style={{alignItems:"flex-start"}}>
    <Button size="sm" variant="ghost" aria-disabled={state.exhausted || undefined}
      loading={state.pending ? "retain-focus" : false}
      onClick={() => { if (!state.exhausted && !state.pending) state.onLoad(); }}>
      {state.exhausted ? exhaustedLabel : label}
    </Button>
    {state.error && <Text size="helper" tone="error" role="alert">{state.error}</Text>}
  </Stack>;
}

function initialContextScrollTop(viewport: HTMLDivElement, anchor: HTMLLIElement, offset: number, rowHeight: number, scale: number) {
  const height = viewport.clientHeight;
  const target = Math.max(0, Math.min(viewport.scrollHeight - height, offset - (height - rowHeight) / 2));
  const minimum = Math.max(0, offset + rowHeight - height);
  const maximum = Math.min(offset, viewport.scrollHeight - height);
  const viewportTop = viewport.getBoundingClientRect().top;
  let closest: number | undefined;
  for (let row: Element | null = anchor; row; row = row.previousElementSibling) {
    const start = Math.round((row.getBoundingClientRect().top - viewportTop) / scale + viewport.scrollTop);
    if (start < Math.floor(minimum)) break;
    if (start <= Math.ceil(maximum) && (closest === undefined || Math.abs(start - target) < Math.abs(closest - target))) {
      closest = start;
    }
  }
  return closest ?? target;
}

export const ContextualLogWindow = /* @__PURE__ */ forwardRef<HTMLDivElement, LogContextProps>(function ContextualLogWindow(
  {label, anchor, before, after, earlier, later, labels, timeZone, maxViewportHeight, ...props}, ref,
) {
  const viewport = useRef<HTMLDivElement>(null);
  const selected = useRef<HTMLLIElement>(null);
  const previous = useRef<{id:string; offset:number}>(undefined);
  useBrowserLayoutEffect(() => {
    const region = viewport.current;
    const row = selected.current;
    if (!region || !row) return;
    const bounds = row.getBoundingClientRect();
    const viewportBounds = region.getBoundingClientRect();
    const scale = viewportBounds.height / region.offsetHeight || 1;
    const offset = (bounds.top - viewportBounds.top) / scale + region.scrollTop;
    if (previous.current?.id === anchor.id) region.scrollTop += offset - previous.current.offset;
    else region.scrollTop = initialContextScrollTop(region, row, offset, bounds.height / scale, scale);
    previous.current = {id:anchor.id, offset};
  }, [anchor.id, before]);

  return <Stack {...props} gap="2" ref={ref}>
    {earlier && <ContextBoundary state={earlier} label={labels?.earlier ?? "Load earlier"}
      exhaustedLabel={labels?.earliest ?? "No earlier entries"} />}
    <ScrollArea ref={viewport} aria-label={label} tabIndex={0} contentInset="none"
      className="flood-log-viewer__viewport flood-log-context__viewport" style={{maxBlockSize:maxViewportHeight}}>
      <DataList density="compact" dividers={false}>
        {[...before, anchor, ...after].map(entry => <StreamLogRow key={entry.id} entry={entry} timeZone={timeZone}
          ref={entry.id === anchor.id ? selected : undefined} aria-current={entry.id === anchor.id || undefined} />)}
      </DataList>
    </ScrollArea>
    {later && <ContextBoundary state={later} label={labels?.later ?? "Load later"}
      exhaustedLabel={labels?.latest ?? "No later entries"} />}
  </Stack>;
});

type StreamLogRowProps = LogRowProps & { revealPayload?: (payload: HTMLDivElement) => void; matchQuery?: string };

export const StreamLogRow = /* @__PURE__ */ forwardRef<HTMLLIElement, StreamLogRowProps>(function StreamLogRow(
  {
    entry, timeZone = "UTC", severityLabel, showPayloadLabel = "Show payload", hidePayloadLabel = "Hide payload",
    copyLabel = "Copy payload", onPayloadOpenChange, revealPayload, matchQuery, lang = "en", className, ...props
  },
  ref,
) {
  const payloadId = useId();
  const payloadNode = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const { payload } = entry;
  const hasPayload = payload !== undefined;
  const time = new Intl.DateTimeFormat(lang, {
    timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).format(parseInstant(entry.dateTime, "LogRow"));
  useBrowserLayoutEffect(() => {
    if (expanded && payloadNode.current) revealPayload?.(payloadNode.current);
  }, [expanded, revealPayload]);

  return <DataListItem {...props} ref={ref} lang={lang} layout="content" data-severity={entry.severity}
    className={["flood-log-row", className].filter(Boolean).join(" ")}
    media={<div className="flood-log-row__metadata">
      <Timestamp dateTime={entry.dateTime} lang={lang}>{time}</Timestamp>
      <StatusIndicator label={severityLabel ?? severityLabels[entry.severity]}
        tone={severityTones[entry.severity]} presentation="chip" size="sm"/>
    </div>}
    title={<Inline align="baseline" gap="2" className="flood-log-row__summary">
      <Text as="span" size="compact" className="flood-log-row__message">
        {matchQuery ? <HighlightText query={matchQuery}>{entry.message}</HighlightText> : entry.message}
      </Text>
      {entry.source && <Text as="span" size="helper" tone="subtle" className="flood-log-row__source">{entry.source}</Text>}
    </Inline>}
    actions={hasPayload && <IconButton label={expanded ? hidePayloadLabel : showPayloadLabel}
      size="xs" variant="ghost" aria-expanded={expanded} aria-controls={payloadId}
      onClick={() => {
        setExpanded(!expanded);
        onPayloadOpenChange?.(!expanded);
      }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
        strokeLinejoin="round" aria-hidden="true" className="flood-log-row__chevron">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </IconButton>}
    details={hasPayload && <div ref={payloadNode} className="flood-log-row__payload" id={payloadId} hidden={!expanded}>
      {expanded && <CodeSnippet code={payload} action={<CopyButton value={payload}
        copyLabel={copyLabel} iconOnly size="xs" variant="ghost"/>}/>}
    </div>}
  />;
});

type FollowState = { following: true } | { following: false; seen: Set<string> };

const proximity = (viewport: HTMLDivElement) => viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop;

export const StreamLogViewer = /* @__PURE__ */ forwardRef<HTMLDivElement, LogViewerProps>(function StreamLogViewer(
  {
    label, entries, maxViewportHeight = "20rem", defaultFollowing = true, onFollowingChange,
    searchable = false, findLabels, timeZone = "UTC", labels, lang = "en", className, ...props
  },
  ref,
) {
  const viewport = useRef<HTMLDivElement>(null);
  const reveal = useCallback((target: HTMLElement) => {
    const element = viewport.current;
    if (!element) return;
    const panel = target.getBoundingClientRect();
    const view = element.getBoundingClientRect();
    if (!view.height) return;
    const nearest = panel.top < view.top ? panel.top - view.top
      : Math.max(0, panel.top + Math.min(panel.height, view.height) - view.bottom);
    if (nearest) element.scrollTop += nearest * element.clientHeight / view.height;
  }, []);
  const [state, setState] = useState<FollowState>(() => defaultFollowing
    ? { following: true }
    : { following: false, seen: new Set(entries.map(entry => entry.id)) });
  const { following } = state;
  const [query, setQuery] = useState("");
  const [requestedMatchId, setRequestedMatchId] = useState<string | null>(null);
  const literal = searchable ? query.trim() : "";
  const matchingIds = useMemo(() => {
    if (!literal) return new Set<string>();
    const pattern = literalMatchPattern(literal, "iu");
    return new Set(entries.filter(entry => pattern.test(entry.message)).map(entry => entry.id));
  }, [entries, literal]);
  const matchingOrder = [...matchingIds];
  const activeIndex = requestedMatchId === null ? 0 : Math.max(0, matchingOrder.indexOf(requestedMatchId));
  const activeId = matchingOrder[activeIndex];
  const activeRow = useRef<HTMLLIElement>(null);
  const lastReveal = useRef<{ id?: string; literal: string }>({ literal: "" });
  if (!label.trim() || entries.some(entry => !entry.id.trim()) || new Set(entries.map(entry => entry.id)).size !== entries.length) {
    throw new Error("Flood LogViewer requires a label and unique entry IDs");
  }
  const queued = state.following ? 0 : entries.filter(entry => !state.seen.has(entry.id)).length;
  const changeFollowing = (next: boolean) => {
    if (next === following) return;
    setState(next ? { following: true } : { following: false, seen: new Set(entries.map(entry => entry.id)) });
    onFollowingChange?.(next);
  };

  useBrowserLayoutEffect(() => {
    const element = viewport.current;
    if (following && element) element.scrollTop = element.scrollHeight;
  }, [entries, following]);

  useBrowserLayoutEffect(() => {
    const changed = lastReveal.current.id !== activeId || lastReveal.current.literal !== literal;
    lastReveal.current = { id: activeId, literal };
    if (changed && !following && activeRow.current) reveal(activeRow.current);
  }, [activeId, literal, following, reveal]);

  const changeQuery = (next: string) => {
    setQuery(next);
    setRequestedMatchId(null);
    if (next.trim()) changeFollowing(false);
  };

  const moveMatch = (step: number) => {
    if (!matchingOrder.length) return;
    changeFollowing(false);
    const nextId = matchingOrder[(activeIndex + step + matchingOrder.length) % matchingOrder.length];
    setRequestedMatchId(nextId);
    if (nextId === activeId && activeRow.current) reveal(activeRow.current);
  };

  return <div {...props} ref={ref} lang={lang} data-following={following}
    className={["flood-log-viewer", className].filter(Boolean).join(" ")}>
    <Stack gap="2">
      <LiveFollowControl className="flood-log-viewer__controls" following={following} queued={queued}
        labels={labels} onFollowingChange={changeFollowing} />
      {searchable && <FindBar label={findLabels?.group ?? "Find in logs"} labels={findLabels}
        query={query} onQueryChange={changeQuery} matchCount={matchingOrder.length}
        activeMatch={activeId === undefined ? null : activeIndex + 1}
        onPreviousMatch={() => moveMatch(-1)} onNextMatch={() => moveMatch(1)} />}
      <ScrollArea ref={viewport} aria-label={label} tabIndex={0} contentInset="none"
        className="flood-log-viewer__viewport" style={{ maxBlockSize: maxViewportHeight }}
        onScroll={event => {
          if (following && proximity(event.currentTarget) > 2) changeFollowing(false);
        }}>
        {entries.length > 0
          ? <DataList density="compact" dividers={false}>{entries.map(entry =>
            <StreamLogRow key={entry.id} entry={entry} lang={lang} timeZone={timeZone}
              ref={entry.id === activeId ? activeRow : undefined} aria-current={entry.id === activeId || undefined}
              matchQuery={matchingIds.has(entry.id) ? literal : undefined}
              severityLabel={labels?.severity?.[entry.severity]}
              showPayloadLabel={labels?.showPayload} hidePayloadLabel={labels?.hidePayload} copyLabel={labels?.copyPayload}
              revealPayload={reveal}
              onPayloadOpenChange={open => { if (open) changeFollowing(false); }}/>)}</DataList>
          : <Text as="p" size="compact" tone="subtle" className="flood-log-viewer__empty">{labels?.empty ?? "No log entries"}</Text>}
      </ScrollArea>
    </Stack>
  </div>;
});
