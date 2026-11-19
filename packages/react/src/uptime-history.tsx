import { forwardRef, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Inline, Stack, StatusIndicator, Surface, Text, VisuallyHidden, type UptimeHistoryProps } from "./index.js";

const defaultLabels = {
  operational: "Operational",
  degraded: "Degraded performance",
  outage: "Outage",
  unknown: "No data",
};
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const UptimeHistoryStrip = /* @__PURE__ */ forwardRef<HTMLDivElement, UptimeHistoryProps>(function UptimeHistoryStrip(
  { label, periods, summary, statusLabels, emptyLabel = "No availability history", currentStatus, showRange = true,
    className, ...props }, ref,
) {
  const list = useRef<HTMLOListElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<string>();
  const [keyboard, setKeyboard] = useState(false);
  const [hovered, setHovered] = useState<string>();
  const [tapped, setTapped] = useState<string>();
  const ids = new Set(periods.map(period => period.id));
  if (!label.trim() || ids.size !== periods.length ||
      periods.some(period => !period.id.trim() || !period.label.trim())) {
    throw new Error("Flood UptimeHistory requires a label and uniquely named periods");
  }
  const names = { ...defaultLabels, ...statusLabels };
  const last = periods.length - 1;
  const focusId = cursor && ids.has(cursor) ? cursor : periods[last]?.id;
  const activeId = hovered ?? tapped ?? (keyboard ? focusId : undefined);
  const activeIndex = periods.findIndex(period => period.id === activeId);
  const active = periods[activeIndex];

  useBrowserLayoutEffect(() => {
    const panel = tooltip.current;
    const track = list.current;
    if (!panel || !track) return;
    const position = () => {
      const width = track.clientWidth;
      const center = (activeIndex + 0.5) / periods.length * width;
      panel.style.left = `${Math.max(0, Math.min(width - panel.offsetWidth, center - panel.offsetWidth / 2))}px`;
    };
    position();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(position);
    observer.observe(panel);
    observer.observe(track);
    return () => observer.disconnect();
  }, [activeIndex, periods.length]);

  const findPointerPeriod = (event: PointerEvent<HTMLOListElement>) => {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    const index = Math.floor((event.clientX - left) / width * periods.length);
    return periods[Math.max(0, Math.min(last, index))]?.id;
  };
  const move = (event: KeyboardEvent<HTMLOListElement>) => {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    const index = periods.findIndex(period => period.id === focusId);
    const next = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: last }[event.key];
    if (next === undefined && (event.key !== "Escape" || !active)) return;
    event.preventDefault();
    setHovered(undefined);
    setTapped(undefined);
    if (event.key === "Escape") {
      setKeyboard(false);
      return;
    }
    setKeyboard(true);
    const item = list.current?.children[Math.max(0, Math.min(last, next ?? index))];
    if (item instanceof HTMLElement) item.focus();
  };

  return <Stack {...props} ref={ref} gap="2" className={["flood-uptime-history", className].filter(Boolean).join(" ")}>
    <Inline align="baseline" gap="2" style={{ justifyContent: "space-between" }}>
      <Text size="label">{label}</Text>
      {currentStatus ? <Inline align="baseline" gap="2">
        {summary && <Text size="compact" tone="subtle">{summary}</Text>}
        <StatusIndicator {...currentStatus} size="sm" presentation="wrap" />
      </Inline> : summary && <Text size="compact" tone="subtle">{summary}</Text>}
    </Inline>
    {periods.length ? <>
      <ol ref={list} role="list" aria-label={label} dir="ltr" className="flood-uptime-history__periods"
          style={{ "--flood-uptime-periods": periods.length } as CSSProperties}
          onKeyDown={move}
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setKeyboard(false); }}
          onPointerMove={event => { if (event.pointerType !== "touch") setHovered(findPointerPeriod(event)); }}
          onPointerLeave={() => setHovered(undefined)}
          onPointerUp={event => {
            if (event.pointerType !== "touch") return;
            const id = findPointerPeriod(event);
            setHovered(undefined);
            setTapped(previous => previous === id ? undefined : id);
          }}>
          {periods.map(period => <li key={period.id} tabIndex={period.id === focusId ? 0 : -1}
            data-status={period.status} data-active={period.id === activeId || undefined}
            onFocus={event => { setCursor(period.id); setKeyboard(event.currentTarget.matches(":focus-visible")); }}>
            <VisuallyHidden dir="auto">{[period.label, names[period.status], period.detail].filter(Boolean).join(". ")}</VisuallyHidden>
          </li>)}
      </ol>
      {showRange && periods.length > 1 && <Inline gap="2" dir="ltr" aria-hidden="true" style={{ justifyContent: "space-between" }}>
        <Text size="helper" tone="subtle" dir="auto">{periods[0].edgeLabel ?? periods[0].label}</Text>
        <Text size="helper" tone="subtle" dir="auto">{periods[last].edgeLabel ?? periods[last].label}</Text>
      </Inline>}
      {active && <Surface ref={tooltip} aria-hidden="true" className="flood-chart__tooltip flood-uptime-history__tooltip"
        elevation="raised" padding="2">
        <Stack gap="1" dir="auto">
          <Text size="helper" tone="subtle">{active.label}</Text>
          <Text size="compact">{names[active.status]}</Text>
          {active.detail && <Text size="helper" tone="subtle">{active.detail}</Text>}
        </Stack>
      </Surface>}
    </> : <Text size="compact" tone="subtle">{emptyLabel}</Text>}
  </Stack>;
});
