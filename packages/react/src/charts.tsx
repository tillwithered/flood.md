import { forwardRef, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Inline, Meter, Metric, Surface, Table, Text, VisuallyHidden, type BarChartProps, type BarListProps, type ChartSeries, type DonutChartProps, type HeatmapProps, type LineChartProps } from "./index.js";
import { placeOverlay } from "./overlay-runtime.js";

type PlotProps = LineChartProps & Required<Pick<LineChartProps, "variant" | "curve" | "emptyLabel" | "missingLabel" | "navigationLabel">>;
const defaultNumber = new Intl.NumberFormat("en", { maximumSignificantDigits: 21 });
const formatNumber = (value: number) => defaultNumber.format(value);
const observed = (value: number | null): value is number => value !== null && Number.isFinite(value);
const useChartLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function ChartKey() {
  return <svg className="flood-line-chart__key" viewBox="0 0 24 4" aria-hidden="true"><path className="flood-line-chart__stroke" d="M1 2H23" /></svg>;
}

function ChartReadout({series, values}: {series: readonly ChartSeries[]; values: readonly string[]}) {
  return <>{series.map((item, i) => <div className="flood-line-chart__tooltip-row" key={item.id} data-series={i}>
    <ChartKey /><Text size="helper" tone="subtle">{item.label}</Text><Text size="helper">{values[i]}</Text>
  </div>)}</>;
}

function ChartLegend({series, swatch = false}: {series: readonly {id: string; label: string}[]; swatch?: boolean}) {
  return <div className="flood-line-chart__readout" aria-hidden="true">
    <Inline gap="4">{series.map((item, i) => <Inline key={item.id} gap="2" align="center" data-series={i}>
      {swatch ? <span className="flood-donut-chart__key" /> : <ChartKey />}<Text size="compact" tone="subtle">{item.label}</Text>
    </Inline>)}</Inline>
  </div>;
}
const plotWidth = 600;
const plotHeight = 200;
const xFor = (index: number, length: number) => length === 1 ? plotWidth / 2 : index * plotWidth / (length - 1);

function slope(points: readonly (number | null)[], index: number, y: number, fallback: number) {
  const previous = points[index - 1], next = points[index + 1];
  if (previous == null || next == null) return fallback;
  const a = y - previous, b = next - y;
  return a * b > 0 ? 2 * a * b / (a + b) : 0;
}

function yAt(points: readonly (number | null)[], position: number, smooth: boolean) {
  const i = Math.floor(position);
  const start = points[i], end = points[i + 1];
  const t = position - i;
  if (start == null || t === 0) return start;
  if (end == null) return null;
  const delta = end - start;
  if (!smooth) return start + delta * t;
  const u = 1 - t;
  return u ** 3 * start + 3 * u * u * t * (start + slope(points, i, start, delta) / 3)
    + 3 * u * t * t * (end - slope(points, i + 1, end, delta) / 3) + t ** 3 * end;
}

function drawSeries(values: readonly (number | null)[], min: number, max: number, smooth: boolean) {
  const line: string[] = [], area: string[] = [], singles: number[] = [];
  const points = values.map(value => {
    if (!observed(value)) return null;
    const fraction = min === max ? .5 : Number.isFinite(max - min)
      ? (value - min) / (max - min)
      : (value / 2 - min / 2) / (max / 2 - min / 2);
    return (1 - fraction) * plotHeight;
  });
  let segmentStart = 0, startIndex = 0;
  // The harmonic mean keeps control points within each observed interval.
  points.forEach((y, index) => {
    if (y === null) return;
    const x = xFor(index, values.length);
    const starts = index === 0 || points[index - 1] === null;
    if (starts) { segmentStart = line.length; startIndex = index; }
    const previous = points[index - 1];
    if (previous != null && smooth) {
      const startX = xFor(index - 1, values.length), step = (x - startX) / 3;
      const delta = y - previous;
      line.push(`C${startX + step} ${previous + slope(points, index - 1, previous, delta) / 3} ${x - step} ${y - slope(points, index, y, delta) / 3} ${x} ${y}`);
    } else {
      line.push(`${starts ? "M" : "L"}${x} ${y}`);
    }
    if (index + 1 < points.length && points[index + 1] !== null) return;
    if (starts) singles.push(index);
    else area.push(`${line.slice(segmentStart).join(" ")} V${plotHeight} H${xFor(startIndex, values.length)} Z`);
  });
  return { line: line.join(" "), area: area.join(" "), singles, points };
}

export const SeriesPlot = /* @__PURE__ */ forwardRef<HTMLDivElement, PlotProps>(function SeriesPlot({
  label, categories, series, domain, variant, curve, showYAxis, showLegend = false, formatValue = formatNumber, emptyLabel, missingLabel, navigationLabel, className, ...props
}, ref) {
  const id = useId();
  const [cursor, setCursor] = useState<number | null>(null);
  const [hover, setHover] = useState<{index: number; inside: boolean} | null>(null);
  const [focused, setFocused] = useState(false);
  const [touchPoint, setTouchPoint] = useState<number | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  let low = Infinity, high = -Infinity;
  if (series.length > 4 || new Set(series.map(item => item.id)).size !== series.length ||
      series.some(item => !item.id.trim() || !item.label.trim() || item.values.length !== categories.length)) {
    throw new Error("Flood LineChart needs up to four uniquely named series with one value per category");
  }
  for (const item of series) for (const value of item.values) {
    if (observed(value)) { low = Math.min(low, value); high = Math.max(high, value); }
  }
  if (domain && (!Number.isFinite(domain[0]) || !Number.isFinite(domain[1]) ||
      domain[0] >= domain[1] || low < domain[0] || high > domain[1])) {
    throw new RangeError("Flood LineChart domain must contain all observations and have finite increasing bounds");
  }
  const hasData = low !== Infinity;
  const [min, max] = domain ?? [low, high];
  const last = categories.length - 1;
  const canInspect = hasData && last > 0;
  useEffect(() => {
    const tip = tipRef.current;
    if (!tip) return;
    const measure = () => tip.style.setProperty("--flood-chart-tip-height", `${tip.offsetHeight}px`);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(tip);
    return () => observer.disconnect();
  }, [canInspect]);
  const active = Math.min(last, hover?.index ?? touchPoint ?? cursor ?? last);
  const showPoint = last > 0 && (focused || hover?.inside || touchPoint !== null);
  const values = hasData ? series.map(item => item.values[active]) : [];
  const formatted = values.map(value => observed(value) ? formatValue(value) : missingLabel);
  const smooth = curve === "smooth";
  const plot = useMemo(() => hasData ? series.map(item => drawSeries(item.values, min, max, smooth)) : [], [series, min, max, smooth, hasData]);
  const ticks = showYAxis ? (min === max ? [min] : [max, max / 2 + min / 2, min]) : [];
  const categoryTicks = last >= 12
    ? [0, Math.round(last / 4), Math.round(last / 2), Math.round(3 * last / 4), last]
    : [0, ...(last > 1 && last % 2 === 0 ? [last / 2] : []), last];
  const pointX = xFor(active, categories.length);
  const pointPercent = pointX / plotWidth * 100;
  const sampleY = plot.find(item => item.points[active] != null)?.points[active] ?? plotHeight / 2;
  const valueText = `${categories[active]}, ${series.map((item, i) => `${item.label}: ${formatted[i]}`).join(", ")}`;
  const pointerPosition = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  };
  const clearPointer = (node: HTMLDivElement) => {
    node.style.removeProperty("--flood-chart-pointer");
    node.style.removeProperty("--flood-chart-pointer-ratio");
    node.style.removeProperty("--flood-chart-pointer-tip-y");
    node.style.removeProperty("--flood-chart-pointer-tip-ratio");
    for (let i = 0; i < plot.length; i++) {
      node.style.removeProperty(`--flood-chart-pointer-y-${i}`);
      node.style.removeProperty(`--flood-chart-pointer-visible-${i}`);
    }
    setHover(null);
  };
  const trackPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || last < 1) return;
    const ratio = pointerPosition(event), position = ratio * last;
    const style = event.currentTarget.style;
    style.setProperty("--flood-chart-pointer", `${ratio * 100}%`);
    style.setProperty("--flood-chart-pointer-ratio", String(ratio));
    let anchorY: number | undefined;
    plot.forEach(({ points }, i) => {
      const y = yAt(points, position, smooth);
      anchorY ??= y ?? undefined;
      style.setProperty(`--flood-chart-pointer-y-${i}`, `${(y ?? 0) / plotHeight * 100}%`);
      style.setProperty(`--flood-chart-pointer-visible-${i}`, y == null ? "0" : "1");
    });
    const anchorRatio = (anchorY ?? plotHeight / 2) / plotHeight;
    style.setProperty("--flood-chart-pointer-tip-y", `${anchorRatio * 100}%`);
    style.setProperty("--flood-chart-pointer-tip-ratio", String(anchorRatio));
    const index = Math.round(position);
    setHover(previous => previous?.inside && previous.index === index ? previous : {index, inside: true});
  };
  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    let next: number;
    switch (event.key) {
      case "ArrowRight": case "ArrowUp": next = active + 1; break;
      case "ArrowLeft": case "ArrowDown": next = active - 1; break;
      case "Home": next = 0; break;
      case "End": next = last; break;
      default: return;
    }
    event.preventDefault();
    clearPointer(event.currentTarget);
    setTouchPoint(null);
    setCursor(Math.min(last, Math.max(0, next)));
  };
  return <div {...props} ref={ref} className={["flood-line-chart", className].filter(Boolean).join(" ")}
    role="group" aria-label={label}>
    {hasData ? <>
      {last > 0 && <VisuallyHidden id={id}>{navigationLabel}</VisuallyHidden>}
      <div className="flood-line-chart__body" data-y-axis={showYAxis || undefined}>
        {showYAxis && <div className="flood-line-chart__y" aria-hidden="true" data-flat={min === max || undefined}>
          {ticks.map((value, i) => <Text key={i} size="helper" tone="subtle">{formatValue(value)}</Text>)}
        </div>}
        <div className="flood-line-chart__plot" role={last > 0 ? "slider" : "img"} tabIndex={last > 0 ? 0 : undefined}
          aria-label={last > 0 ? label : valueText} aria-describedby={last > 0 ? id : undefined}
          aria-valuemin={last > 0 ? 1 : undefined} aria-valuemax={last > 0 ? last + 1 : undefined}
          aria-valuenow={last > 0 ? active + 1 : undefined} aria-valuetext={last > 0 ? valueText : undefined}
          data-inspecting={showPoint || undefined} style={{
            "--flood-chart-point": `${pointPercent}%`,
            "--flood-chart-point-ratio": pointPercent / 100,
            "--flood-chart-point-y": `${sampleY / plotHeight * 100}%`,
            "--flood-chart-point-y-ratio": sampleY / plotHeight,
          } as CSSProperties}
          onFocus={event => {
            if (!hover?.inside) clearPointer(event.currentTarget);
            setFocused(true);
          }} onBlur={() => setFocused(false)} onKeyDown={navigate}
          onPointerEnter={trackPointer} onPointerMove={trackPointer}
          onPointerLeave={event => {
            if (focused || touchPoint !== null) clearPointer(event.currentTarget);
            else setHover(previous => previous?.inside ? {...previous, inside: false} : previous);
          }}
          onPointerUp={event => {
            if (event.pointerType !== "touch" || last < 1) return;
            clearPointer(event.currentTarget);
            const point = Math.round(pointerPosition(event) * last);
            setTouchPoint(current => current === point ? null : point);
          }}>
          <svg viewBox={`0 0 ${plotWidth} ${plotHeight}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
            {variant === "area" && <defs>
              <linearGradient className="flood-line-chart__gradient" id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
                <stop stopColor="currentColor" stopOpacity=".3" /><stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`${id}-area-edges`}>
                <stop stopColor="white" stopOpacity="0" />
                <stop offset=".07" stopColor="white" />
                <stop offset=".93" stopColor="white" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <mask id={`${id}-area-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width={plotWidth} height={plotHeight}>
                <rect width={plotWidth} height={plotHeight} fill={`url(#${id}-area-edges)`} />
              </mask>
            </defs>}
            <defs><mask id={`${id}-highlight`} maskUnits="userSpaceOnUse" x="-4" y="-4" width={plotWidth + 8} height={plotHeight + 8}>
              <linearGradient id={`${id}-highlight-fade`}>
                <stop stopColor="white" stopOpacity="0" />
                <stop offset=".44" stopColor="white" />
                <stop offset=".56" stopColor="white" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <rect className="flood-line-chart__highlight-window" x="-54" y="-4" width="108"
                height={plotHeight + 8} fill={`url(#${id}-highlight-fade)`} />
            </mask></defs>
            {showYAxis && <path className="flood-line-chart__grid" d={min === max ? "M0 100H600" : "M0 0H600M0 100H600M0 200H600"} />}
            {variant === "area" && <path className="flood-line-chart__area" d={plot[0].area}
              fill={`url(#${id}-fill)`} mask={`url(#${id}-area-mask)`} />}
            {plot.map((item, i) => {
              return <g key={series[i].id} data-series={i}>
                <path className="flood-line-chart__stroke" d={item.line} />
                {item.singles.map(index => <path className="flood-line-chart__point" key={index}
                  d={`M${xFor(index, categories.length)} ${item.points[index]}h0`} />)}
              </g>;
            })}
            <g className="flood-line-chart__highlight" mask={`url(#${id}-highlight)`}>
              {plot.map((item, i) => <path key={series[i].id} className="flood-line-chart__stroke" d={item.line} data-series={i} />)}
            </g>
          </svg>
          {last > 0 && <div className="flood-line-chart__inspection" aria-hidden="true">
            <div className="flood-line-chart__cursor">
              {plot.map(({points}, i) => <span key={series[i].id} className="flood-line-chart__marker" data-series={i}
                style={{
                  top: `var(--flood-chart-pointer-y-${i}, ${(points[active] ?? 0) / plotHeight * 100}%)`,
                  opacity: `var(--flood-chart-pointer-visible-${i}, ${points[active] == null ? 0 : 1})`,
                }} />)}
            </div>
            <div className="flood-line-chart__date" aria-hidden="true"><Text size="helper">{categories[active]}</Text></div>
            <div className="flood-line-chart__tooltip-position">
              <Surface ref={tipRef} className="flood-line-chart__tooltip" padding="2" elevation="raised">
                <ChartReadout series={series} values={formatted} />
              </Surface>
            </div>
          </div>}
        </div>
        <div className="flood-line-chart__x" aria-hidden="true">
          {last === 0 ? <Text size="helper" tone="subtle">{categories[0]}</Text> :
            categoryTicks.map((index, tick) => (
              <Text key={index} size="helper" tone="subtle"
                data-intermediate={categoryTicks.length === 5 && (tick === 1 || tick === 3) || undefined}
                data-covered={showPoint && Math.abs(index - active) / last <= .15 || undefined}>{categories[index]}</Text>
            ))}
        </div>
      </div>
      {showLegend && <ChartLegend series={series} />}
    </> : <Text className="flood-line-chart__empty" size="compact" tone="subtle">{emptyLabel}</Text>}
  </div>;
});

type GroupedBarsProps = BarChartProps & Required<Pick<BarChartProps, "emptyLabel" | "missingLabel" | "navigationLabel">>;

export const GroupedBars = /* @__PURE__ */ forwardRef<HTMLDivElement, GroupedBarsProps>(function GroupedBars({
  label, categories, series, domain, layout = "grouped", showLegend = false, formatValue = formatNumber, formatShare = formatPercent, emptyLabel, missingLabel, navigationLabel, className, ...props
}, ref) {
  const instructions = useId();
  const [cursor, setCursor] = useState(0);
  const [hover, setHover] = useState<number>();
  const [focused, setFocused] = useState(false);
  const [touch, setTouch] = useState<number>();
  const last = categories.length - 1;
  const active = Math.min(last, hover ?? touch ?? cursor);
  const inspecting = hover !== undefined || focused || touch !== undefined;
  let low = 0, high = 0, hasData = false;
  if (series.length > 4 || new Set(series.map(item => item.id)).size !== series.length ||
      series.some(item => !item.id.trim() || !item.label.trim() || item.values.length !== categories.length)) {
    throw new Error("Flood BarChart needs up to four uniquely identified series with one value per category");
  }
  const percent = layout === "percent";
  const stacked = layout !== "grouped";
  const groups = categories.map((_, index) => {
    let positive = 0;
    let negative = 0;
    const segments = series.map(item => {
      const value = item.values[index];
      if (!observed(value)) return undefined;
      if (percent && value < 0) throw new RangeError("Flood BarChart percent layout needs nonnegative observations");
      hasData = true;
      const start = stacked ? (value < 0 ? negative : positive) : 0;
      const end = start + value;
      if (!Number.isFinite(end)) throw new RangeError("Flood BarChart stacks must have finite totals");
      if (value < 0) negative = end;
      else positive = end;
      low = Math.min(low, end);
      high = Math.max(high, end);
      return {value, start, end};
    });
    return {segments, positive, negative};
  });
  if (!percent && domain && (!Number.isFinite(domain[0]) || !Number.isFinite(domain[1]) ||
      domain[0] >= domain[1] || low < domain[0] || high > domain[1])) {
    throw new RangeError("Flood BarChart domain must have finite increasing bounds containing zero and all bar extents");
  }
  const [min, max] = percent ? [0, 1] : domain ?? [low, high || (low === 0 ? 1 : 0)];
  const span = max - min;
  const fraction = (value: number) => Number.isFinite(span)
    ? (value - min) / span
    : (value / 2 - min / 2) / (max / 2 - min / 2);
  const zero = fraction(0);
  const values = hasData ? series.map(item => {
    const value = item.values[active];
    if (!observed(value)) return missingLabel;
    const total = groups[active].positive;
    return percent && total > 0 ? `${formatShare(value / total)} · ${formatValue(value)}` : formatValue(value);
  }) : [];
  const valueText = [categories[active], ...series.map((item, i) => `${item.label}: ${values[i]}`)].join(", ");
  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    let next: number;
    switch (event.key) {
      case "ArrowRight": case "ArrowUp": next = active + 1; break;
      case "ArrowLeft": case "ArrowDown": next = active - 1; break;
      case "Home": next = 0; break;
      case "End": next = last; break;
      default: return;
    }
    event.preventDefault();
    setHover(undefined);
    setTouch(undefined);
    setFocused(true);
    setCursor(Math.max(0, Math.min(last, next)));
  };
  return <div {...props} ref={ref} className={["flood-bar-chart", className].filter(Boolean).join(" ")} role="group" aria-label={label} data-layout={layout}>
    {hasData ? <>
      {last > 0 && <VisuallyHidden id={instructions}>{navigationLabel}</VisuallyHidden>}
      <div className="flood-bar-chart__plot" dir="ltr" role={last > 0 ? "slider" : "img"}
        tabIndex={last > 0 ? 0 : undefined} aria-label={last > 0 ? label : valueText}
        aria-describedby={last > 0 ? instructions : undefined}
        aria-valuemin={last > 0 ? 1 : undefined} aria-valuemax={last > 0 ? last + 1 : undefined}
        aria-valuenow={last > 0 ? active + 1 : undefined} aria-valuetext={last > 0 ? valueText : undefined}
        style={{"--flood-bar-zero": zero, "--flood-bar-categories": categories.length} as CSSProperties}
        data-inspecting={inspecting || undefined}
        onFocus={event => setFocused(event.currentTarget.matches(":focus-visible"))} onBlur={() => setFocused(false)}
        onKeyDown={navigate} onPointerLeave={() => setHover(undefined)}>
        <div className="flood-bar-chart__marks" aria-hidden="true">
          {categories.map((category, i) => <div key={i} className="flood-bar-chart__group"
            data-active={inspecting && active === i || undefined}
            onPointerEnter={event => { if (event.pointerType !== "touch") setHover(i); }}
            onPointerUp={event => { if (event.pointerType === "touch") setTouch(current => current === i ? undefined : i); }}>
            <div className="flood-bar-chart__pair">
              {series.map((item, j) => {
                const {segments, positive, negative} = groups[i];
                const segment = segments[j];
                const normalize = (value: number) => percent ? value / (positive || 1) : fraction(value);
                const start = normalize(segment?.start ?? 0);
                const end = normalize(segment?.end ?? 0);
                const outer = segment && segment.end === (segment.value < 0 ? negative : positive);
                return <span key={item.id} className="flood-bar-chart__slot" data-series={j}>
                  {segment && (!stacked || start !== end) && <span className="flood-bar-chart__bar" data-zero={segment.value === 0 || undefined}
                    data-negative={segment.value < 0 || undefined} data-outer={stacked && outer || undefined}
                    style={{insetBlockEnd: `${Math.min(start, end) * 100}%`, blockSize: `${Math.abs(end - start) * 100}%`}} />}
                </span>;
              })}
            </div>
            <Text className="flood-bar-chart__category" size="helper" tone="subtle" dir="auto" title={category}>{category}</Text>
          </div>)}
        </div>
        {inspecting && <Surface className="flood-bar-chart__tooltip" padding="2" elevation="raised" aria-hidden="true"
          style={{
            "--flood-bar-active": `${(active + .5) / categories.length * 100}%`,
            "--flood-bar-tip-side": active >= categories.length / 2 ? -1 : 0,
          } as CSSProperties}>
          <Text size="helper">{categories[active]}</Text>
          <ChartReadout series={series} values={values} />
        </Surface>}
      </div>
      {showLegend && <ChartLegend series={series} />}
    </> : <Text className="flood-line-chart__empty" size="compact" tone="subtle">{emptyLabel}</Text>}
  </div>;
});

type ShareRingProps = DonutChartProps & Required<Pick<DonutChartProps, "totalLabel" | "emptyLabel" | "navigationLabel">>;
const defaultPercent = new Intl.NumberFormat("en", {style:"percent", maximumFractionDigits:1});
const formatPercent = (share: number) => defaultPercent.format(share);
const paletteSize = 6;

function ringSector(start: number, end: number) {
  const point = (turn: number, radius: number) => {
    const angle = (turn - .25) * 2 * Math.PI;
    return `${100 + radius * Math.cos(angle)} ${100 + radius * Math.sin(angle)}`;
  };
  if (end - start === 1) {
    return "M 100 8 A 92 92 0 0 1 100 192 A 92 92 0 0 1 100 8 Z " +
      "M 100 24 A 76 76 0 0 0 100 176 A 76 76 0 0 0 100 24 Z";
  }
  const outerRadius = 92;
  const innerRadius = 76;
  const corner = Math.min(3.5, (end - start) * 2 * Math.PI * innerRadius / 4);
  const outerInset = corner / (2 * Math.PI * outerRadius);
  const innerInset = corner / (2 * Math.PI * innerRadius);
  const middle = (start + end) / 2;
  return `M ${point(start + outerInset, outerRadius)}
    A 92 92 0 0 1 ${point(middle, outerRadius)} A 92 92 0 0 1 ${point(end - outerInset, outerRadius)}
    Q ${point(end, outerRadius)} ${point(end, outerRadius - corner)}
    L ${point(end, innerRadius + corner)}
    Q ${point(end, innerRadius)} ${point(end - innerInset, innerRadius)}
    A 76 76 0 0 0 ${point(middle, innerRadius)} A 76 76 0 0 0 ${point(start + innerInset, innerRadius)}
    Q ${point(start, innerRadius)} ${point(start, innerRadius + corner)}
    L ${point(start, outerRadius - corner)}
    Q ${point(start, outerRadius)} ${point(start + outerInset, outerRadius)} Z`;
}

export const ShareRing = /* @__PURE__ */ forwardRef<HTMLDivElement, ShareRingProps>(function ShareRing({
  label, items, totalLabel, emptyLabel, navigationLabel, showLegend, formatValue = formatNumber,
  formatShare = formatPercent, className, ...props
}, ref) {
  const instructions = useId();
  const [cursor, setCursor] = useState(0);
  const [hovered, setHovered] = useState<number>();
  const [tapped, setTapped] = useState<number>();
  const [focused, setFocused] = useState(false);
  if (items.length > paletteSize) throw new RangeError("Flood DonutChart supports up to six categories");
  const ids = new Set<string>();
  const ends: number[] = [];
  let total = 0;
  for (const item of items) {
    if (!item.id.trim() || ids.has(item.id) || !item.label.trim() || !Number.isFinite(item.value) || item.value < 0) {
      throw new Error("Flood DonutChart needs unique IDs, nonempty labels and finite nonnegative values");
    }
    ids.add(item.id);
    total += item.value;
    ends.push(total);
  }
  if (!Number.isFinite(total)) throw new RangeError("Flood DonutChart needs a finite total");

  const last = items.length - 1;
  const active = Math.min(last, hovered ?? tapped ?? cursor);
  const selected = items[active];
  const inspecting = hovered !== undefined || tapped !== undefined || focused;
  const totalText = formatValue(total);
  const share = selected && total > 0 ? formatShare(selected.value / total) : undefined;
  const valueText = selected ? [selected.label, formatValue(selected.value), share].filter(Boolean).join(", ") : undefined;
  const segmentAt = (event: PointerEvent<SVGSVGElement>) => {
    if (total === 0) return undefined;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return undefined;
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    const radius = Math.hypot(x, y);
    if (radius < .28 || radius > .5) return undefined;

    const turn = (Math.atan2(y, x) / (2 * Math.PI) + 1.25) % 1;
    const index = ends.findIndex(end => turn < end / total);
    return index === -1 ? undefined : index;
  };
  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    let next: number;
    switch (event.key) {
      case "ArrowRight": case "ArrowUp": next = active + 1; break;
      case "ArrowLeft": case "ArrowDown": next = active - 1; break;
      case "Home": next = 0; break;
      case "End": next = last; break;
      case "Escape": setHovered(undefined); setTapped(undefined); setFocused(false); return;
      default: return;
    }
    event.preventDefault();
    setHovered(undefined);
    setTapped(undefined);
    setFocused(true);
    setCursor(Math.max(0, Math.min(last, next)));
  };

  const showSelection = inspecting && Boolean(selected);
  const totalName = `${totalLabel}: ${totalText}`;
  let offset = 0;
  const separate = items.filter(item => item.value > 0).length > 1;
  return <div {...props} ref={ref} className={["flood-donut-chart", className].filter(Boolean).join(" ")} role="group" aria-label={label}>
    {last > 0 && <VisuallyHidden id={instructions}>{totalName}. {navigationLabel}</VisuallyHidden>}
    <div className="flood-donut-chart__plot" role={last > 0 ? "slider" : "img"} tabIndex={last > 0 ? 0 : undefined}
      aria-label={last > 0 ? label : [label, valueText, items.length ? totalName : emptyLabel].filter(Boolean).join(". ")}
      aria-describedby={last > 0 ? instructions : undefined}
      aria-valuemin={last > 0 ? 1 : undefined} aria-valuemax={last > 0 ? last + 1 : undefined}
      aria-valuenow={last > 0 ? active + 1 : undefined} aria-valuetext={last > 0 ? valueText : undefined}
      onPointerLeave={() => setHovered(undefined)}
      onFocus={event => setFocused(event.currentTarget.matches(":focus-visible"))}
      onBlur={() => setFocused(false)} onKeyDown={navigate}>
      <svg viewBox="0 0 200 200" aria-hidden="true"
        onPointerMove={event => { if (event.pointerType !== "touch") setHovered(segmentAt(event)); }}
        onPointerEnter={event => { if (event.pointerType !== "touch") setHovered(segmentAt(event)); }}
        onPointerUp={event => {
          if (event.pointerType !== "touch") return;
          const next = segmentAt(event);
          setTapped(current => current === next ? undefined : next);
        }}>
        {total === 0 && <circle className="flood-donut-chart__track" cx="100" cy="100" r="84" />}
        {items.map((item, i) => {
          if (item.value === 0) return null;
          const length = item.value / total;
          if (length === 0) return null;
          const gap = separate ? Math.min(.0065, length * .2) : 0;
          const start = offset + gap;
          offset += length;
          return <path key={item.id} className="flood-donut-chart__segment"
            data-slice={i} data-active={showSelection && active === i || undefined}
            d={ringSector(start, offset - gap)}
          />;
        })}
      </svg>
      <div className="flood-donut-chart__readout" aria-hidden="true">
        {items.length ? <Metric size="sm" label={showSelection ? selected.label : totalLabel}
          value={showSelection ? formatValue(selected.value) : totalText} hint={showSelection ? share : undefined} />
          : <Text size="compact" tone="subtle">{emptyLabel}</Text>}
      </div>
    </div>
    {showLegend && items.length > 0 && <ChartLegend series={items} swatch />}
  </div>;
});

type HeatmapGridProps = HeatmapProps & Required<Pick<HeatmapProps, "missingLabel" | "emptyLabel">>;

export const HeatmapGrid = /* @__PURE__ */ forwardRef<HTMLDivElement, HeatmapGridProps>(function HeatmapGrid({
  label, columns, rows, max, formatValue = formatNumber, missingLabel, emptyLabel, className, ...props
}, ref) {
  const table = useRef<HTMLTableElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState(0);
  const [hovered, setHovered] = useState<number>();
  const [focused, setFocused] = useState(false);
  const [tapped, setTapped] = useState<number>();
  const width = columns.length;
  const cellCount = width * rows.length;
  const last = cellCount - 1;
  let largest = 0;
  const ids = new Set<string>();
  for (const row of rows) {
    if (!row.id.trim() || ids.has(row.id) || !row.label.trim() || row.values.length !== width) {
      throw new Error("Flood Heatmap needs unique row IDs, labels and one value per column");
    }
    ids.add(row.id);
    for (const value of row.values) {
      if (value === null) continue;
      if (!Number.isFinite(value) || value < 0) throw new RangeError("Flood Heatmap values must be finite and nonnegative");
      largest = Math.max(largest, value);
    }
  }
  const limit = max ?? (largest || 1);
  if (!Number.isFinite(limit) || limit <= 0 || limit < largest) {
    throw new RangeError("Flood Heatmap max must be finite, positive and at least the largest observation");
  }

  const current = Math.min(cursor, last);
  const inspection = hovered ?? tapped ?? (focused ? current : undefined);
  const active = inspection === undefined ? -1 : Math.min(inspection, last);
  const activeRow = active >= 0 ? rows[Math.floor(active / width)] : undefined;
  const activeValue = activeRow?.values[active % width];
  useChartLayoutEffect(() => {
    const panel = tooltip.current;
    const area = panel?.offsetParent;
    const cell = table.current?.tBodies[0]?.rows[Math.floor(active / width)]?.cells[active % width + 1];
    if (!panel || !(area instanceof HTMLElement) || !cell) return;

    const position = () => {
      const bounds = area.getBoundingClientRect();
      if (!bounds.width) return;
      const scale = bounds.width / area.offsetWidth || 1;
      const gap = parseFloat(getComputedStyle(panel).columnGap) * scale;
      const { left, top } = placeOverlay(cell.getBoundingClientRect(), panel.getBoundingClientRect(), bounds, "top", "center", gap);
      panel.style.left = `${(left - bounds.left) / scale}px`;
      panel.style.top = `${(top - bounds.top) / scale}px`;
    };
    position();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(position);
    observer?.observe(area);
    observer?.observe(panel);
    observer?.observe(cell);
    area.addEventListener("scroll", position, true);
    window.addEventListener("resize", position);
    return () => {
      observer?.disconnect();
      area.removeEventListener("scroll", position, true);
      window.removeEventListener("resize", position);
    };
  }, [active, width]);
  const navigate = (event: KeyboardEvent<HTMLTableCellElement>, index: number) => {
    const rowStart = index - index % width;
    const rowEnd = rowStart + width - 1;
    let next: number;
    switch (event.key) {
      case "ArrowRight": next = Math.min(rowEnd, index + 1); break;
      case "ArrowLeft": next = Math.max(rowStart, index - 1); break;
      case "ArrowUp": next = index >= width ? index - width : index; break;
      case "ArrowDown": next = index + width < cellCount ? index + width : index; break;
      case "Home": next = event.ctrlKey ? 0 : rowStart; break;
      case "End": next = event.ctrlKey ? last : rowEnd; break;
      default: return;
    }
    event.preventDefault();
    setHovered(undefined);
    setTapped(undefined);
    table.current?.tBodies[0].rows[Math.floor(next / width)].cells[next % width + 1].focus();
  };

  return <div {...props} ref={ref} className={["flood-heatmap", className].filter(Boolean).join(" ")}>
    {cellCount ? <>
      <Table ref={table} className="flood-heatmap__table" caption={label} hideCaption dir="ltr"
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
        <thead><tr><td />{columns.map((column, index) =>
          <th scope="col" key={index}><Text size="helper" tone="subtle" dir="auto" title={column}>{column}</Text></th>)}</tr></thead>
        <tbody onPointerLeave={() => setHovered(undefined)}>
          {rows.map((row, y) => <tr key={row.id}>
            <th scope="row"><Text size="helper" tone="subtle" dir="auto" title={row.label}>{row.label}</Text></th>
            {row.values.map((value, x) => {
              const index = y * width + x;
              return <td key={x} className="flood-heatmap__cell" tabIndex={index === current ? 0 : -1}
                data-active={index === active || undefined} data-missing={value === null || undefined}
                style={{"--flood-heatmap-level": value === null ? 0 : value / limit} as CSSProperties}
                onFocus={event => { setCursor(index); setFocused(event.currentTarget.matches(":focus-visible")); }}
                onKeyDown={event => navigate(event, index)}
                onPointerEnter={event => { if (event.pointerType !== "touch") setHovered(index); }}
                onPointerUp={event => { if (event.pointerType === "touch") setTapped(previous => previous === index ? undefined : index); }}>
                <VisuallyHidden>{value === null ? missingLabel : formatValue(value)}</VisuallyHidden>
              </td>;
            })}
          </tr>)}
        </tbody>
      </Table>
      {activeRow && <Surface ref={tooltip} className="flood-heatmap__tooltip" padding="2" elevation="raised" aria-hidden="true">
        <Text size="helper" tone="subtle">{activeRow.label} · {columns[active % width]}</Text>
        <Text size="compact">{activeValue == null ? missingLabel : formatValue(activeValue)}</Text>
      </Surface>}
    </> : <Text size="compact" tone="subtle">{emptyLabel}</Text>}
  </div>;
});

export const RankedBars = /* @__PURE__ */ forwardRef<HTMLDivElement, BarListProps>(function RankedBars({
  label, items, max, tone, emptyLabel, className, ...props
}, ref) {
  let largest = 0;
  const ids = new Set<string>();
  for (const item of items) {
    if (!item.id.trim() || ids.has(item.id) || !item.label.trim() || !Number.isFinite(item.value) || item.value < 0) {
      throw new Error("Flood BarList needs unique IDs, nonempty labels and finite nonnegative values");
    }
    ids.add(item.id);
    largest = Math.max(largest, item.value);
  }
  const limit = max ?? (largest || 1);
  if (!Number.isFinite(limit) || limit <= 0 || limit < largest) {
    throw new RangeError("Flood BarList max must be positive, finite and at least the largest item");
  }
  return <div {...props} ref={ref} className={["flood-bar-list", className].filter(Boolean).join(" ")} role="group" aria-label={label}>
    {items.length ? <ul className="flood-bar-list__items" role="list">
      {items.map(item => <li key={item.id}><Meter label={item.label} value={item.value} max={limit}
        valueText={item.valueText ?? formatNumber(item.value)} tone={tone} size="sm" /></li>)}
    </ul> : <Text size="compact" tone="subtle">{emptyLabel}</Text>}
  </div>;
});
