import {
  forwardRef, useEffect, useId, useLayoutEffect, useRef, useState,
  type CSSProperties, type ReactNode,
} from "react";
import {
  Button, DataList, IconButton, ScrollArea, StatusIndicator, Surface, Text, TruncatedText, VisuallyHidden,
  type SpanRowProps, type TraceSpan, type TraceWaterfallProps,
} from "./index.js";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function assertSpan({ label, start, duration }: SpanRowProps["span"]) {
  if (!label.trim() || !Number.isFinite(start) || duration < 0 || !Number.isFinite(start + duration)) {
    throw new Error("Flood SpanRow requires a label, finite start and nonnegative duration");
  }
}

function assertDomain([first, last]: SpanRowProps["domain"]) {
  if (first >= last || !Number.isFinite(last - first)) {
    throw new Error("Flood trace time bounds must be finite and increasing");
  }
}

function durationFormatter(lang: string) {
  const number = new Intl.NumberFormat(lang, { maximumFractionDigits: 2 });
  return (milliseconds: number) => `${number.format(milliseconds)} ms`;
}

type RowPresentation = {
  depth?: number;
  zoom?: { label: string; active: boolean; invoke: () => void };
  branch?: {
    expanded: boolean;
    label: string;
    content: ReactNode;
    toggle: () => void;
  };
};

export const TimingSpanRow = /* @__PURE__ */ forwardRef<HTMLLIElement, SpanRowProps & RowPresentation>(function TimingSpanRow(
  { span, domain, formatTime, startLabel = "Start", depth = 0, branch, zoom, className, lang = "en", ...props },
  ref,
) {
  assertSpan(span);
  assertDomain(domain);
  const disclosureId = useId();
  const disclosure = useRef<HTMLButtonElement>(null);
  const children = useRef<HTMLDivElement>(null);
  const focusWithin = useRef(false);
  useBrowserLayoutEffect(() => {
    const panel = children.current;
    if (!panel || branch?.expanded || !focusWithin.current) return;
    const owner = panel.ownerDocument;
    if (owner.activeElement === owner.body || panel.contains(owner.activeElement)) disclosure.current?.focus();
    focusWithin.current = false;
  }, [branch?.expanded]);
  const format = formatTime ?? durationFormatter(lang);
  const [first, last] = domain;
  const start = Math.max(first, span.start);
  const end = Math.min(last, span.start + span.duration);
  const ratio = (value: number) => 100 * ((value - first) / (last - first));
  const visible = start <= end;
  const markStyle = {
    "--flood-span-start": `${ratio(start)}%`,
    "--flood-span-width": `${ratio(end) - ratio(start)}%`,
  } as CSSProperties;

  return <li {...props} ref={ref} lang={lang}
    className={["flood-span-row", className].filter(Boolean).join(" ")}>
    <div className="flood-span-row__geometry">
      <div className="flood-span-row__label" style={{ "--flood-span-depth": depth } as CSSProperties}>
        {branch && <IconButton ref={disclosure} size="2xs" variant="ghost" label={branch.label}
          aria-expanded={branch.expanded} aria-controls={disclosureId} onClick={branch.toggle}
          className="flood-span-row__disclosure">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <path d="m9 6 6 6-6 6"/>
          </svg>
        </IconButton>}
        <div className="flood-span-row__name">
          <TruncatedText>{span.label}</TruncatedText>
          {span.status && <StatusIndicator size="sm" label={span.status.label} tone={span.status.tone}/>}
        </div>
      </div>
      <div className="flood-span-row__plot" aria-hidden="true" dir="ltr">
        {visible && <div className="flood-span-row__mark" data-tone={span.status?.tone} style={markStyle}/>}
      </div>
      <Text as="span" size="helper" tone="subtle" className="flood-span-row__value">
        <VisuallyHidden>{startLabel}: {format(span.start)}. </VisuallyHidden>
        <TruncatedText>{format(span.duration)}</TruncatedText>
      </Text>
      {zoom && <IconButton size="2xs" variant="ghost" label={zoom.label} aria-pressed={zoom.active}
        onClick={zoom.invoke} className="flood-span-row__zoom">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4m-8.5-11v5m-2.5-2.5h5"/>
        </svg>
      </IconButton>}
    </div>
    {branch && <div ref={children} id={disclosureId} hidden={!branch.expanded}
      onFocusCapture={() => { focusWithin.current = true; }}
      onBlurCapture={event => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) focusWithin.current = false;
      }}>
      {branch.content}
    </div>}
  </li>;
});

function inspectTrace(spans: readonly TraceSpan[], zoomId: string | null | undefined) {
  const ids = new Set<string>();
  let first = 0;
  let last = 0;
  let zoomSpan: TraceSpan | undefined;
  const visit = (items: readonly TraceSpan[]) => {
    for (const span of items) {
      if (!span.id.trim() || ids.has(span.id)) throw new Error("Flood TraceWaterfall requires unique span IDs");
      ids.add(span.id);
      assertSpan(span);
      first = Math.min(first, span.start);
      last = Math.max(last, span.start + span.duration);
      if (span.id === zoomId && canZoomTo(span)) zoomSpan = span;
      if (span.children) visit(span.children);
    }
  };
  visit(spans);
  return { bounds: [first, last > first ? last : first + 1] as const, zoomSpan };
}

function canZoomTo(span: TraceSpan) {
  return span.start < span.start + span.duration;
}

export const TimingWaterfall = /* @__PURE__ */ forwardRef<HTMLDivElement, TraceWaterfallProps>(function TimingWaterfall(
  {
    label, spans, domain, zoom, formatTime, collapsedIds, defaultCollapsedIds = [], onCollapsedIdsChange,
    maxViewportHeight = "22rem", labels, lang = "en", className, ...props
  },
  ref,
) {
  if (!label.trim()) throw new Error("Flood TraceWaterfall requires a label");
  const { bounds, zoomSpan } = inspectTrace(spans, zoom?.spanId);
  const baseDomain = domain ?? bounds;
  assertDomain(baseDomain);
  const visibleTime = zoomSpan ? [zoomSpan.start, zoomSpan.start + zoomSpan.duration] as const : baseDomain;
  const [first, last] = visibleTime;
  const format = formatTime ?? durationFormatter(lang);
  const [local, setLocal] = useState([...defaultCollapsedIds]);
  const collapsed = new Set(collapsedIds ?? local);
  const renderList = (items: readonly TraceSpan[], depth: number): ReactNode =>
    <DataList density="compact" dividers={false}>
      {items.map(span => {
        const expanded = !collapsed.has(span.id);
        const toggle = () => {
          const next = expanded ? [...collapsed, span.id] : [...collapsed].filter(id => id !== span.id);
          if (collapsedIds === undefined) setLocal(next);
          onCollapsedIdsChange?.(next);
        };
        const branch = span.children?.length ? {
          expanded, toggle,
          label: labels?.formatDisclosure?.(span.label, expanded) ?? `${expanded ? "Collapse" : "Expand"} ${span.label}`,
          content: renderList(span.children, depth + 1),
        } : undefined;
        const active = zoomSpan?.id === span.id;
        return <TimingSpanRow key={span.id} span={span} depth={depth} domain={visibleTime}
          formatTime={format} startLabel={labels?.start} branch={branch} lang={lang}
          zoom={zoom && canZoomTo(span) ? { active, label: labels?.formatZoom?.(span.label) ?? `Zoom to ${span.label}`,
            invoke: () => zoom.onChange(active ? null : span.id) } : undefined}/>;
      })}
    </DataList>;

  return <Surface {...props} ref={ref} lang={lang} padding="3" data-zoomable={zoom ? "true" : undefined}
    className={["flood-trace-waterfall", className].filter(Boolean).join(" ")}>
    {spans.length > 0 ? <>
      {zoom && <div className="flood-trace-waterfall__controls">
        <VisuallyHidden role="status">{format(first)} – {format(last)}</VisuallyHidden>
        <Text as="span" size="helper" tone="subtle" aria-hidden="true" className="flood-trace-waterfall__window">
          {format(first)} – {format(last)}
        </Text>
        <Button size="sm" variant="ghost" aria-disabled={!zoomSpan} onClick={() => { if (zoomSpan) zoom.onChange(null); }}>
          {labels?.resetZoom ?? "Reset zoom"}
        </Button>
      </div>}
      <div aria-hidden="true" className="flood-trace-waterfall__axis">
        <Text as="span" size="helper" tone="subtle">{labels?.span ?? "Span"}</Text>
        <div className="flood-trace-waterfall__ticks" dir="ltr">
          {[first, first + (last - first) / 2, last].map((tick, index) =>
            <Text as="span" size="helper" tone="subtle" key={index}>{format(tick)}</Text>)}
        </div>
        <Text as="span" size="helper" tone="subtle" className="flood-span-row__value">{labels?.duration ?? "Duration"}</Text>
      </div>
      <ScrollArea aria-label={label} tabIndex={0} contentInset="none" style={{ maxBlockSize: maxViewportHeight }}
        className="flood-trace-waterfall__viewport">
        {renderList(spans, 0)}
      </ScrollArea>
    </> : <Text as="p" size="compact" tone="subtle">{labels?.empty ?? "No spans"}</Text>}
  </Surface>;
});
