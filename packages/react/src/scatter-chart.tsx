import { forwardRef, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Surface, Text, VisuallyHidden, type ScatterChartProps, type ScatterChartPoint } from "./index.js";
import { placeOverlay } from "./overlay-runtime.js";

type ScatterDomain = readonly [number, number];

const numberFormat = new Intl.NumberFormat("en", { maximumSignificantDigits: 21 });
const formatNumber = (value: number) => numberFormat.format(value);
const useChartLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function scaleFor(points: readonly ScatterChartPoint[], axis: "x" | "y", domain?: ScatterDomain): ScatterDomain {
  let low = Infinity;
  let high = -Infinity;
  for (const point of points) {
    low = Math.min(low, point[axis]);
    high = Math.max(high, point[axis]);
  }
  if (domain) {
    const [min, max] = domain;
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max || low < min || high > max) {
      throw new RangeError(`Flood ScatterChart ${axis} domain must have finite increasing bounds containing all observations`);
    }
    return domain;
  }
  return points.length ? [low, high] : [0, 1];
}

function normalize(value: number, [min, max]: ScatterDomain) {
  if (min === max) return .5;
  const span = max - min;
  return Number.isFinite(span) ? (value - min) / span : (value / 2 - min / 2) / (max / 2 - min / 2);
}

function ticks([min, max]: ScatterDomain) {
  const midpoint = min / 2 + max / 2;
  return min === max ? [min] : midpoint === min || midpoint === max ? [min, max] : [min, midpoint, max];
}

export const ScatterPlot = /* @__PURE__ */ forwardRef<HTMLDivElement, ScatterChartProps>(function ScatterPlot({
  label, xLabel, yLabel, points, xDomain, yDomain, formatX = formatNumber, formatY = formatNumber,
  emptyLabel = "No data", navigationLabel = "Use arrow keys to inspect points, or Home and End to jump.",
  className, ...props
}, ref) {
  const instructions = useId();
  const plot = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<string>();
  const [hover, setHover] = useState<string>();
  const [touch, setTouch] = useState<string>();
  const [focused, setFocused] = useState(false);
  const data = useMemo(() => {
    const ids = new Set<string>();
    for (const point of points) {
      if (!point.id.trim() || ids.has(point.id) || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        throw new Error("Flood ScatterChart needs unique nonempty point IDs and finite coordinates");
      }
      ids.add(point.id);
    }
    const xScale = scaleFor(points, "x", xDomain);
    const yScale = scaleFor(points, "y", yDomain);
    return {
      xScale,
      yScale,
      positions: points.map(point => ({
        point,
        x: normalize(point.x, xScale),
        y: 1 - normalize(point.y, yScale),
      })),
    };
  }, [points, xDomain, yDomain]);

  const activeId = hover ?? touch ?? cursor;
  const index = activeId === undefined ? 0 : Math.max(0, points.findIndex(point => point.id === activeId));
  const active = data.positions[index];
  const inspecting = Boolean(active && (hover !== undefined || touch !== undefined || focused));
  const xText = active ? formatX(active.point.x) : "";
  const yText = active ? formatY(active.point.y) : "";
  const valueText = [active?.point.label, `${xLabel}: ${xText}`, `${yLabel}: ${yText}`].filter(Boolean).join(", ");
  const canNavigate = points.length > 1;

  useChartLayoutEffect(() => {
    const panel = tooltip.current;
    const frame = plot.current;
    const content = area.current;
    if (!panel || !frame || !content || !active || !inspecting) return;
    const position = () => {
      const bounds = frame.getBoundingClientRect();
      if (!bounds.width || !frame.offsetWidth) return;
      const region = content.getBoundingClientRect();
      const scale = bounds.width / frame.offsetWidth;
      const pointX = region.left + active.x * region.width;
      const pointY = region.top + active.y * region.height;
      // The panel's column gap is the anchor clearance. The inner grid owns text spacing.
      const gap = parseFloat(getComputedStyle(panel).columnGap) * scale;
      const anchor = {left: pointX, right: pointX, top: pointY, bottom: pointY, width: 0, height: 0};
      const size = panel.getBoundingClientRect();
      const edge = gap / 4;
      const insetAdjustment = gap - edge;
      const placementBounds = {
        left: bounds.left - insetAdjustment,
        top: bounds.top - insetAdjustment,
        width: bounds.width + 2 * insetAdjustment,
        height: bounds.height + 2 * insetAdjustment,
      };
      const hasSideRoom = Math.max(pointX - bounds.left, bounds.right - pointX) >= size.width + gap + edge;
      const side = hasSideRoom ? (active.x < .5 ? "right" : "left") : "top";
      const { left, top } = placeOverlay(anchor, size, placementBounds, side, "center", gap);
      panel.style.left = `${(left - bounds.left) / scale}px`;
      panel.style.top = `${(top - bounds.top) / scale}px`;
      panel.dataset.positioned = "";
    };
    position();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(position);
    observer.observe(frame);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [active, inspecting, xText, yText]);

  const nearest = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = area.current?.getBoundingClientRect();
    if (!bounds) return undefined;
    let distance = Infinity;
    let id: string | undefined;
    for (const {point, x, y} of data.positions) {
      const next = (bounds.left + x * bounds.width - event.clientX) ** 2 + (bounds.top + y * bounds.height - event.clientY) ** 2;
      if (next < distance) {
        distance = next;
        id = point.id;
      }
    }
    return id;
  };
  const trackPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") setHover(nearest(event));
  };
  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    let next: number;
    switch (event.key) {
      case "ArrowRight": case "ArrowUp": next = index + 1; break;
      case "ArrowLeft": case "ArrowDown": next = index - 1; break;
      case "Home": next = 0; break;
      case "End": next = points.length - 1; break;
      case "Escape":
        if (inspecting) event.preventDefault();
        setHover(undefined);
        setTouch(undefined);
        setFocused(false);
        return;
      default: return;
    }
    event.preventDefault();
    setHover(undefined);
    setTouch(undefined);
    setFocused(true);
    setCursor(points[Math.max(0, Math.min(next, points.length - 1))].id);
  };

  return <div {...props} ref={ref} className={["flood-scatter-chart", className].filter(Boolean).join(" ")} role="group" aria-label={label}>
    {!active ? <Text className="flood-scatter-chart__empty" size="compact" tone="subtle">{emptyLabel}</Text> : <>
      {canNavigate && <VisuallyHidden id={instructions}>{navigationLabel}</VisuallyHidden>}
      <Text className="flood-scatter-chart__vertical-label" size="helper" tone="subtle" aria-hidden="true" dir="auto">{yLabel}</Text>
      <div className="flood-scatter-chart__layout" dir="ltr">
        <div className="flood-scatter-chart__ticks flood-scatter-chart__ticks--y" aria-hidden="true">
          {ticks(data.yScale).slice().reverse().map(tick => <Text key={tick} size="helper" tone="subtle">{formatY(tick)}</Text>)}
        </div>
        <div ref={plot} className="flood-scatter-chart__plot" role={canNavigate ? "slider" : "img"} tabIndex={0}
          aria-label={canNavigate ? label : `${label}. ${valueText}`} aria-describedby={canNavigate ? instructions : undefined}
          aria-valuemin={canNavigate ? 1 : undefined} aria-valuemax={canNavigate ? points.length : undefined}
          aria-valuenow={canNavigate ? index + 1 : undefined} aria-valuetext={canNavigate ? valueText : undefined}
          onFocus={event => setFocused(event.currentTarget.matches(":focus-visible"))}
          onBlur={() => setFocused(false)} onKeyDown={navigate}
          onPointerEnter={trackPointer} onPointerMove={trackPointer} onPointerLeave={() => setHover(undefined)}
          onPointerUp={event => {
            if (event.pointerType !== "touch") return;
            const next = nearest(event);
            setHover(undefined);
            setTouch(current => current === next ? undefined : next);
          }}>
          <div ref={area} className="flood-scatter-chart__area" aria-hidden="true">
            {inspecting && <span className="flood-scatter-chart__guides" style={{"--flood-scatter-x": `${active.x * 100}%`, "--flood-scatter-y": `${active.y * 100}%`} as CSSProperties} />}
            {data.positions.map(({point, x, y}, i) => <span key={point.id} className="flood-scatter-chart__point"
              data-active={inspecting && i === index || undefined}
              style={{left: `${x * 100}%`, top: `${y * 100}%`}} />)}
          </div>
          {inspecting && <Surface ref={tooltip} className="flood-chart__tooltip flood-scatter-chart__tooltip" elevation="raised" padding="2" aria-hidden="true">
            <div className="flood-scatter-chart__tooltip-content">
              {active.point.label && <Text size="helper" dir="auto" data-point-label="">{active.point.label}</Text>}
              <Text size="helper" tone="subtle" dir="auto">{xLabel}</Text><Text size="helper" data-coordinate="">{xText}</Text>
              <Text size="helper" tone="subtle" dir="auto">{yLabel}</Text><Text size="helper" data-coordinate="">{yText}</Text>
            </div>
          </Surface>}
        </div>
        <div className="flood-scatter-chart__ticks flood-scatter-chart__ticks--x" aria-hidden="true">
          {ticks(data.xScale).map(tick => <Text key={tick} size="helper" tone="subtle">{formatX(tick)}</Text>)}
        </div>
        <Text className="flood-scatter-chart__horizontal-label" size="helper" tone="subtle" aria-hidden="true" dir="auto">{xLabel}</Text>
      </div>
    </>}
  </div>;
});
