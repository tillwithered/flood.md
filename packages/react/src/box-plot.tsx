import { forwardRef, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Surface, Text, VisuallyHidden, type BoxPlotProps, type BoxPlotSummary } from "./index.js";
import { placeOverlay } from "./overlay-runtime.js";

const number = new Intl.NumberFormat("en", { maximumSignificantDigits: 21 });
const useChartLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const stats = ["low", "q1", "median", "q3", "high"] as const;
const defaults: Record<keyof BoxPlotSummary | "outliers", string> = {
  low: "Lower whisker", q1: "Q1", median: "Median", q3: "Q3", high: "Upper whisker", outliers: "Outliers",
};
const tooltipRows = [[2], [1, 3], [0, 4], [5]] as const;

export const DistributionBoxes = /* @__PURE__ */ forwardRef<HTMLDivElement, BoxPlotProps>(function DistributionBoxes({
  label, items, domain, formatValue = number.format, formatAxisValue = formatValue, statisticLabels, emptyLabel = "No observations",
  missingLabel = "No data", navigationLabel = "Use the arrow keys to explore groups, or Home and End to jump.",
  className, ...props
}, ref) {
  const instructions = useId();
  const plot = useRef<HTMLDivElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState(0);
  const [hover, setHover] = useState<number>();
  const [touch, setTouch] = useState<number>();
  const [focused, setFocused] = useState(false);

  const ids = new Set<string>();
  let min = Infinity;
  let max = -Infinity;
  for (const {id, label: name, summary, outliers = []} of items) {
    if (!id.trim() || ids.has(id) || !name.trim()) throw new Error("Flood BoxPlot needs unique IDs and nonempty labels");
    ids.add(id);
    if (!summary) {
      if (outliers.length) throw new RangeError("Flood BoxPlot outliers require a summary");
      continue;
    }
    const values = stats.map(key => summary[key]);
    if (values.some((value, i) => !Number.isFinite(value) || (i > 0 && value < values[i - 1]))) {
      throw new RangeError("Flood BoxPlot statistics must be finite and ordered from low to high");
    }
    min = Math.min(min, summary.low);
    max = Math.max(max, summary.high);
    for (const value of outliers) {
      if (!Number.isFinite(value) || (value >= summary.low && value <= summary.high)) {
        throw new RangeError("Flood BoxPlot outliers must be finite and outside the whiskers");
      }
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  if (domain && (!Number.isFinite(domain[0]) || !Number.isFinite(domain[1]) ||
      domain[0] >= domain[1] || domain[0] > min || domain[1] < max)) {
    throw new RangeError("Flood BoxPlot domain must have finite increasing bounds containing every observation");
  }
  const hasData = min <= max;
  const [floor, ceiling] = domain ?? [min, max];
  const span = ceiling - floor;
  const position = (value: number) => {
    if (span === 0) return 50;
    return 100 * (Number.isFinite(span) ? (value - floor) / span : (value / 2 - floor / 2) / (ceiling / 2 - floor / 2));
  };

  const last = items.length - 1;
  const active = Math.min(hover ?? touch ?? cursor, last);
  const item = items[active];
  const summary = item?.summary;
  const inspecting = hover !== undefined || touch !== undefined || focused;
  const readouts = summary ? stats.map(key => ({
    label: statisticLabels?.[key] ?? defaults[key], value: formatValue(summary[key]),
  })) : [];
  if (item?.outliers?.length) {
    readouts.push({ label: statisticLabels?.outliers ?? defaults.outliers, value: number.format(item.outliers.length) });
  }
  const valueText = [item?.label, ...(summary ? readouts.map(entry => `${entry.label}: ${entry.value}`) : [missingLabel])].join(", ");

  useChartLayoutEffect(() => {
    const panel = tooltip.current;
    const frame = plot.current;
    if (!panel || !frame) return;
    const mark = frame.querySelector<HTMLElement>("[data-active] .flood-box-plot__median, [data-active] .flood-box-plot__missing");
    if (!mark) return;
    const positionTooltip = () => {
      const bounds = frame.getBoundingClientRect();
      if (!bounds.width || !frame.offsetWidth) return;
      const marker = mark.getBoundingClientRect();
      const scale = bounds.width / frame.offsetWidth;
      const gap = parseFloat(getComputedStyle(panel).columnGap) * scale;
      const size = panel.getBoundingClientRect();
      const x = (marker.left + marker.right) / 2;
      const y = (marker.top + marker.bottom) / 2;
      const anchor = {left:x, right:x, top:y, bottom:y, width:0, height:0};
      const horizontalRoom = size.width + 2 * gap;
      const side = bounds.right - x >= horizontalRoom ? "right"
        : x - bounds.left >= horizontalRoom ? "left"
        : y - bounds.top < bounds.bottom - y ? "bottom" : "top";
      const {left, top} = placeOverlay(anchor, size, bounds, side, "center", gap);
      panel.style.left = `${(left - bounds.left) / scale}px`;
      panel.style.top = `${(top - bounds.top) / scale}px`;
      panel.dataset.positioned = "";
    };
    positionTooltip();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(positionTooltip);
    observer.observe(frame);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [active, inspecting, item, formatValue, floor, ceiling]);

  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    let next: number;
    switch (event.key) {
      case "ArrowRight": case "ArrowUp": next = active + 1; break;
      case "ArrowLeft": case "ArrowDown": next = active - 1; break;
      case "Home": next = 0; break;
      case "End": next = last; break;
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
    setCursor(Math.max(0, Math.min(last, next)));
  };

  return <div {...props} ref={ref} className={["flood-box-plot", className].filter(Boolean).join(" ")} role="group" aria-label={label}>
    {hasData ? <>
      {last > 0 && <VisuallyHidden id={instructions}>{navigationLabel}</VisuallyHidden>}
      <div ref={plot} className="flood-box-plot__plot" dir="ltr" role={last > 0 ? "slider" : "img"} tabIndex={last > 0 ? 0 : undefined}
        aria-label={last > 0 ? label : `${label}. ${valueText}`} aria-describedby={last > 0 ? instructions : undefined}
        aria-valuemin={last > 0 ? 1 : undefined} aria-valuemax={last > 0 ? items.length : undefined}
        aria-valuenow={last > 0 ? active + 1 : undefined} aria-valuetext={last > 0 ? valueText : undefined}
        onFocus={event => setFocused(event.currentTarget.matches(":focus-visible"))} onBlur={() => setFocused(false)}
        onKeyDown={navigate} onPointerLeave={() => setHover(undefined)}>
        <div className="flood-box-plot__rows" aria-hidden="true">
          {items.map(({id, label: name, summary: values, outliers}, index) => <div key={id} className="flood-box-plot__row"
            data-active={inspecting && index === active || undefined}
            onPointerEnter={event => { if (event.pointerType !== "touch") setHover(index); }}
            onPointerUp={event => { if (event.pointerType === "touch") setTouch(previous => previous === index ? undefined : index); }}>
            <Text className="flood-box-plot__category" size="helper" tone="subtle" dir="auto" title={name}>{name}</Text>
            <div className="flood-box-plot__track">
              {values && <>
                <span className="flood-box-plot__whisker" data-side="start" style={{left:`${position(values.low)}%`, right:`${100 - position(values.q1)}%`}} />
                <span className="flood-box-plot__whisker" data-side="end" style={{left:`${position(values.q3)}%`, right:`${100 - position(values.high)}%`}} />
                <span className="flood-box-plot__box" style={{left:`${position(values.q1)}%`, right:`${100 - position(values.q3)}%`}} />
                <span className="flood-box-plot__median" style={{left:`${position(values.median)}%`}} />
                {outliers?.map((value, i) => <span className="flood-box-plot__outlier" key={i} style={{left:`${position(value)}%`}} />)}
              </>}
              {!values && <span className="flood-box-plot__missing" />}
            </div>
          </div>)}
        </div>
        <div className="flood-box-plot__axis" aria-hidden="true">
          <Text size="helper" tone="subtle">{formatAxisValue(floor)}</Text>
          {floor !== ceiling && <>
            <Text size="helper" tone="subtle">{formatAxisValue(floor / 2 + ceiling / 2)}</Text>
            <Text size="helper" tone="subtle">{formatAxisValue(ceiling)}</Text>
          </>}
        </div>
        {inspecting && item && <Surface ref={tooltip} className="flood-chart__tooltip flood-box-plot__tooltip" aria-hidden="true" padding="2" elevation="raised">
          <Text size="helper" dir="auto">{item.label}</Text>
          {summary ? tooltipRows.map(([start, end]) => {
            const first = readouts[start];
            if (!first) return null;
            const last = end === undefined ? undefined : readouts[end];
            return <div className="flood-box-plot__reading" key={start}>
              <Text size="helper" tone="subtle" dir="auto">{start === 0 ? statisticLabels?.whiskers ?? "Whiskers" :
                last ? `${first.label}–${last.label}` : first.label}</Text>
              <Text size="helper" tone={start === 2 ? "default" : "subtle"}>
                {last ? <><span>{first.value}–</span><wbr /><span>{last.value}</span></> : first.value}
              </Text>
            </div>;
          }) : <Text size="helper" tone="subtle">{missingLabel}</Text>}
        </Surface>}
      </div>
    </> : <Text className="flood-box-plot__empty" size="compact" tone="subtle">{emptyLabel}</Text>}
  </div>;
});
