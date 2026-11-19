import { forwardRef, useId, useState, type HTMLAttributes, type KeyboardEvent, type PointerEvent, type ReactNode, type Ref } from "react";
import { Inline, Surface, Text, VisuallyHidden, type ChartSeries } from "./index.js";
import { useChartInspection, type ChartInspection } from "./chart-inspection.js";
import { formatPercent } from "./charts.js";

export type { ChartInspection } from "./chart-inspection.js";
const number = new Intl.NumberFormat("en", { maximumSignificantDigits: 21 });
const width = 600;
const height = 240;
const finite = (value: number | null): value is number => value !== null && Number.isFinite(value);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const fraction = (value: number, min: number, max: number) => min === max ? .5
  : Number.isFinite(max - min) ? (value - min) / (max - min) : (value / 2 - min / 2) / (max / 2 - min / 2);

type Named = { id: string; label: string };
type Bounds = readonly [number, number];
type Point = readonly [number, number];

type ChartElementProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label">;

interface ComparisonChartProps extends ChartElementProps {
  label: string;
  emptyLabel?: string;
  navigationLabel?: string;
  onInspect?: (entry: ChartInspection | null) => void;
}

interface ChartFrameProps extends ComparisonChartProps {
  entries: readonly ChartInspection[];
  innerRef: Ref<HTMLDivElement>;
  hitTest?: (event: PointerEvent<HTMLDivElement>) => number;
  plot: (active: number) => ReactNode;
  legend?: ReactNode;
}

function validateNames(items: readonly Named[], name: string) {
  if (new Set(items.map(item => item.id)).size !== items.length ||
      items.some(item => !item.id.trim() || !item.label.trim())) {
    throw new Error("Flood " + name + " requires unique IDs and nonempty labels");
  }
}

function scaleBounds(values: readonly number[], domain: Bounds | undefined, includeZero: boolean, name: string): Bounds {
  let min = includeZero ? 0 : Infinity;
  let max = includeZero ? 0 : -Infinity;
  for (const value of values) { min = Math.min(min, value); max = Math.max(max, value); }
  if (domain) {
    if (!Number.isFinite(domain[0]) || !Number.isFinite(domain[1]) || domain[0] >= domain[1] ||
        domain[0] > min || domain[1] < max) {
      throw new RangeError("Flood " + name + " domain must be finite and contain the scale's observations");
    }
    return domain;
  }
  if (max === -Infinity || (min === 0 && max === 0)) return [0, 1];
  return [min, max];
}

function valueReading(label: string, value: number | null, formatValue = number.format, missingLabel = "No value") {
  return { label, value: finite(value) ? value : null, formattedValue: finite(value) ? formatValue(value) : missingLabel };
}

function legend(items: readonly Named[]) {
  return <Inline className="flood-comparison-chart__legend" gap="4" aria-hidden="true">
    {items.map((item, i) => <Inline align="center" gap="2" key={item.id}>
      <svg viewBox="0 0 20 8" focusable="false" aria-hidden="true" data-series={i}>
        <path className="flood-comparison-chart__line" d="M2 4H18" />
      </svg>
      <Text size="helper" tone="subtle">{item.label}</Text>
    </Inline>)}
  </Inline>;
}

function nearestMark(event: PointerEvent<HTMLDivElement>) {
  const target = event.target as Element;
  const mark = target.closest("[data-chart-hit]");
  return mark && event.currentTarget.contains(mark) ? Number(mark.getAttribute("data-chart-hit")) : -1;
}

function ChartFrame({
  innerRef, label, entries, plot, legend, hitTest = nearestMark, onInspect, className, emptyLabel = "No data",
  navigationLabel = "Use arrow keys to explore values, or Home and End to jump.", ...props
}: ChartFrameProps) {
  const instructions = useId();
  const [focus, setFocus] = useState(false);
  const [cursor, setCursor] = useState<string>();
  const [hover, setHover] = useState<string>();
  const [touch, setTouch] = useState<string>();
  const [pointerSide, setPointerSide] = useState<"start" | "end">("end");
  const count = entries.length;
  const find = (id: string | undefined) => id === undefined ? -1 : entries.findIndex(entry => entry.id === id);
  const hoverIndex = find(hover);
  const touchIndex = find(touch);
  const currentIndex = Math.max(0, find(cursor));
  const index = hoverIndex >= 0 ? hoverIndex : touchIndex >= 0 ? touchIndex : currentIndex;
  const current = entries[index];
  const visible = !!current && (focus || hoverIndex >= 0 || touchIndex >= 0);
  const readout = current ? [current.label, ...current.values.map(({ label, formattedValue }) => label + ": " + formattedValue)].join(", ") : undefined;
  useChartInspection(visible ? current : null, onInspect);

  function pointerEntry(event: PointerEvent<HTMLDivElement>) {
    const entry = entries[hitTest(event)];
    if (entry) {
      const bounds = event.currentTarget.getBoundingClientRect();
      setPointerSide(event.clientX > bounds.left + bounds.width / 2 ? "start" : "end");
    }
    return entry?.id;
  }

  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    let next: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown": next = index + 1; break;
      case "ArrowLeft":
      case "ArrowUp": next = index - 1; break;
      case "Home": next = 0; break;
      case "End": next = count - 1; break;
      case "Escape":
        if (!visible) return;
        event.preventDefault();
        event.stopPropagation();
        setFocus(false);
        setTouch(undefined);
        setHover(undefined);
        return;
      default: return;
    }
    event.preventDefault();
    setHover(undefined);
    setTouch(undefined);
    setCursor(entries[clamp(next, 0, count - 1)].id);
    setFocus(true);
  }

  return <div {...props} ref={innerRef} className={["flood-comparison-chart", className].filter(Boolean).join(" ")}
    role="group" aria-label={label}>
    {!count ? <Text size="compact" tone="subtle">{emptyLabel}</Text> : <>
      {count > 1 && <VisuallyHidden id={instructions}>{navigationLabel}</VisuallyHidden>}
      <div className="flood-comparison-chart__plot" dir="ltr" role={count > 1 ? "slider" : "img"}
        tabIndex={count > 1 ? 0 : undefined} aria-label={count > 1 ? label : readout}
        aria-describedby={count > 1 ? instructions : undefined} aria-valuemin={count > 1 ? 1 : undefined}
        aria-valuemax={count > 1 ? count : undefined} aria-valuenow={count > 1 ? index + 1 : undefined}
        aria-valuetext={count > 1 ? readout : undefined}
        onPointerMove={event => { if (event.pointerType !== "touch") setHover(pointerEntry(event)); }}
        onPointerLeave={() => setHover(undefined)}
        onPointerUp={event => {
          if (event.pointerType !== "touch") return;
          const picked = pointerEntry(event);
          setTouch(before => before === picked ? undefined : picked);
        }}
        onFocus={event => setFocus(event.currentTarget.matches(":focus-visible"))}
        onBlur={() => setFocus(false)} onKeyDown={navigate}>
        {plot(visible ? index : -1)}
        {visible && <Surface className="flood-chart__tooltip flood-comparison-chart__inspection" elevation="raised" padding="2" aria-hidden="true" dir="auto"
          data-side={hoverIndex >= 0 || touchIndex >= 0 ? pointerSide : index >= count / 2 ? "start" : "end"}>
          <Text size="helper">{current.label}</Text>
          {current.values.map(({ label, formattedValue }, i) => <div className="flood-comparison-chart__reading" key={i}>
            <Text size="helper" tone="subtle">{label}</Text><Text size="helper">{formattedValue}</Text>
          </div>)}
        </Surface>}
      </div>
      {legend}
    </>}
  </div>;
}

export interface ComboChartSeries extends ChartSeries {
  kind: "bar" | "line";
  axis?: "left" | "right";
}

export interface ComboChartAxis {
  label: string;
  domain?: Bounds;
  formatValue?: (value: number) => string;
}

export interface ComboChartProps extends ComparisonChartProps {
  categories: readonly string[];
  series: readonly ComboChartSeries[];
  leftAxis?: ComboChartAxis;
  rightAxis?: ComboChartAxis;
  missingLabel?: string;
}

function Polyline({points}: {points: readonly (Point | null)[]}) {
  const d = points.map((point, i) => point ? (points[i - 1] ? "L" : "M") + point.join(" ") : "").join(" ");
  return <>
    <path className="flood-comparison-chart__line" d={d} />
    {points.map((point, i) => point && !points[i - 1] && !points[i + 1] &&
      <circle key={i} className="flood-comparison-chart__point" cx={point[0]} cy={point[1]} r={3.5} />)}
  </>;
}

/** Compare bars and lines over the same categories, optionally on independent Y scales. */
export const ComboChart = /* @__PURE__ */ forwardRef<HTMLDivElement, ComboChartProps>(function ComboChart({
  categories, series, leftAxis, rightAxis, missingLabel, ...props
}, ref) {
  validateNames(series, "ComboChart series");
  if (series.length > 4 || series.some(item => item.values.length !== categories.length)) {
    throw new Error("Flood ComboChart requires up to four series with one value per category");
  }
  const getAxis = (axis: "left" | "right", config: ComboChartAxis | undefined) => {
    const selected = series.filter(item => (item.axis ?? "left") === axis);
    const values = selected.flatMap(item => item.values.filter(finite));
    const bounds = scaleBounds(values, config?.domain, selected.some(item => item.kind === "bar"), "ComboChart " + axis + " axis");
    return { config, bounds, plot: selected.length > 0, format: config?.formatValue ?? number.format };
  };
  const axes = { left: getAxis("left", leftAxis), right: getAxis("right", rightAxis) };
  const barCount = series.filter(item => item.kind === "bar").length;
  const slot = width / Math.max(1, categories.length);
  const barWidth = slot * .68 / Math.max(1, barCount);
  const barGap = Math.min(barWidth * .06, 2);
  const center = (index: number) => (index + .5) * slot;
  const y = (value: number, bounds: Bounds) => height * (1 - fraction(value, ...bounds));
  const entries = series.some(item => item.values.some(finite)) ? categories.map((label, i) => ({
    id: String(i), label,
    values: series.map(item => valueReading(item.label, item.values[i], axes[item.axis ?? "left"].format, missingLabel)),
  })) : [];
  const axisTicks = (axis: typeof axes.left) => axis.bounds[0] === axis.bounds[1] ? [axis.bounds[0]]
    : [axis.bounds[1], axis.bounds[1] / 2 + axis.bounds[0] / 2, axis.bounds[0]];
  const labelIndices = categories.length <= 6 ? categories.map((_, i) => i)
    : [0, Math.round((categories.length - 1) / 4), Math.round((categories.length - 1) / 2),
      Math.round((categories.length - 1) * 3 / 4), categories.length - 1];
  return <ChartFrame {...props} entries={entries} innerRef={ref} legend={legend(series)} plot={active => {
    let barIndex = 0;
    return <div className="flood-comparison-chart__combo">
      {(["left", "right"] as const).map(side => {
        const axis = axes[side];
        return axis.plot && <div className="flood-comparison-chart__axis" data-side={side}
          data-flat={axis.bounds[0] === axis.bounds[1] || undefined} key={side} aria-hidden="true">
          <div>{axisTicks(axis).map(value => <Text key={value} size="helper" tone="subtle">{axis.format(value)}</Text>)}</div>
          {axis.config && <Text size="helper">{axis.config.label}</Text>}
        </div>;
      })}
      <div className="flood-comparison-chart__combo-data" aria-hidden="true">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path className="flood-comparison-chart__guide" d="M0 1H600 M0 120H600 M0 239H600" />
          {active >= 0 && <line className="flood-comparison-chart__cursor" x1={center(active)} x2={center(active)} y2={height} />}
          {series.map((item, seriesIndex) => {
            if (item.kind !== "bar") return null;
            const axis = axes[item.axis ?? "left"].bounds;
            const zero = y(0, axis);
            const offset = (barIndex++ - barCount / 2) * barWidth;
            return <g key={item.id} data-series={seriesIndex}>
              {item.values.map((value, index) => {
                if (!finite(value)) return null;
                const length = Math.max(2, Math.abs(y(value, axis) - zero));
                return <rect key={index} className="flood-comparison-chart__bar"
                  x={center(index) + offset + barGap / 2} y={clamp(value < 0 ? zero : zero - length, 0, height - length)}
                  width={barWidth - barGap} height={length}
                  rx={Math.min(3, barWidth / 4)} data-active={index === active || undefined} />;
              })}
            </g>;
          })}
          {series.map((item, i) => item.kind === "line" && <g key={item.id} data-series={i}>
            <Polyline points={item.values.map((value, index) => finite(value) ? [center(index), y(value, axes[item.axis ?? "left"].bounds)] : null)} />
            {active >= 0 && finite(item.values[active]) && <circle className="flood-comparison-chart__point"
              cx={center(active)} cy={y(item.values[active], axes[item.axis ?? "left"].bounds)} r={4} />}
          </g>)}
          {categories.map((_, i) => <rect key={i} x={i * slot} width={slot} height={height}
            className="flood-comparison-chart__hit" data-chart-hit={i} />)}
        </svg>
        <div className="flood-comparison-chart__categories" data-sparse={categories.length > 6 || undefined}>
          {labelIndices.map(i => <Text key={i} size="helper" tone="subtle" title={categories[i]}
            style={{left: center(i) / width * 100 + "%", maxInlineSize: 100 / labelIndices.length + "%"}}>{categories[i]}</Text>)}
        </div>
      </div>
    </div>;
  }} />;
});

export interface FunnelChartStage extends Named { value: number }

export interface FunnelChartProps extends ComparisonChartProps {
  /** Ordered stages. Values must be nonnegative and nonincreasing. */
  stages: readonly FunnelChartStage[];
  formatValue?: (value: number) => string;
  formatShare?: (share: number) => string;
  valueLabel?: string;
  shareLabel?: string;
  emptyShareLabel?: string;
}

/** Show how much of an initial group reaches each ordered stage. */
export const FunnelChart = /* @__PURE__ */ forwardRef<HTMLDivElement, FunnelChartProps>(function FunnelChart({
  stages, formatValue = number.format, formatShare = formatPercent, valueLabel = "Value", shareLabel = "Of initial stage",
  emptyShareLabel = "No share", ...props
}, ref) {
  validateNames(stages, "FunnelChart stages");
  if (stages.some(({value}, index) => !Number.isFinite(value) || value < 0 || (index > 0 && value > stages[index - 1].value))) {
    throw new RangeError("Flood FunnelChart requires finite nonnegative, nonincreasing stage values");
  }
  const initial = stages[0]?.value ?? 0;
  const entries = stages.map(({id, label, value}) => ({
    id, label, values: [
      valueReading(valueLabel, value, formatValue),
      valueReading(shareLabel, initial === 0 ? null : value / initial, formatShare, emptyShareLabel),
    ],
  }));
  return <ChartFrame {...props} entries={entries} innerRef={ref} plot={active =>
    <div className="flood-comparison-chart__funnel" aria-hidden="true">
      {stages.map((stage, index) => {
        const top = initial === 0 ? 0 : stage.value / initial * width;
        const bottom = initial === 0 ? 0 : (stages[index + 1]?.value ?? stage.value) / initial * width;
        const left = (width - top) / 2;
        const nextLeft = (width - bottom) / 2;
        return <div className="flood-comparison-chart__funnel-row" key={stage.id} data-chart-hit={index}
          data-active={index === active || undefined}>
          <Text size="helper" dir="auto">{stage.label}</Text>
          <svg viewBox={`0 0 ${width} 48`} preserveAspectRatio="none" focusable="false">
            {top === 0 ? <path className="flood-comparison-chart__line" d="M300 3V45" /> :
              <path className="flood-comparison-chart__funnel-segment"
                d={`M${left} 1H${left + top}L${nextLeft + bottom} 47H${nextLeft}Z`} />}
          </svg>
          <Text size="helper">{formatValue(stage.value)}</Text>
        </div>;
      })}
    </div>
  } />;
});

export type RadarChartAxis = Named;

export interface RadarChartProps extends ComparisonChartProps {
  axes: readonly RadarChartAxis[];
  series: readonly ChartSeries[];
  /** Shared increasing scale for the axes. Defaults to a scale that includes zero. */
  domain?: Bounds;
  formatValue?: (value: number) => string;
  missingLabel?: string;
}

/** Compare profiles across three or more dimensions measured on a shared scale. */
export const RadarChart = /* @__PURE__ */ forwardRef<HTMLDivElement, RadarChartProps>(function RadarChart({
  axes, series, domain, formatValue = number.format, missingLabel, ...props
}, ref) {
  validateNames(axes, "RadarChart axes");
  validateNames(series, "RadarChart series");
  if ((axes.length > 0 && axes.length < 3) || series.length > 4 || series.some(item => item.values.length !== axes.length)) {
    throw new Error("Flood RadarChart requires at least three axes and up to four series with one value per axis");
  }
  const values = series.flatMap(item => item.values.filter(finite));
  const bounds = scaleBounds(values, domain, !domain, "RadarChart");
  const point = (i: number, length: number): Point => {
    const angle = -Math.PI / 2 + 2 * Math.PI * i / axes.length;
    return [120 + length * Math.cos(angle), 120 + length * Math.sin(angle)];
  };
  const ring = (length: number) => axes.map((_, i) => point(i, length).join(",")).join(" ");
  const entries = values.length ? axes.map((axis, i) => ({
    ...axis, values: series.map(item => valueReading(item.label, item.values[i], formatValue, missingLabel)),
  })) : [];
  return <ChartFrame {...props} innerRef={ref} entries={entries} legend={legend(series)} plot={active =>
    <div className="flood-comparison-chart__radar">
      <div className="flood-comparison-chart__radar-plot" aria-hidden="true">
        <svg viewBox="0 0 240 240" focusable="false">
        {[24, 48, 72, 96].map(length => <polygon className="flood-comparison-chart__guide" key={length} points={ring(length)} />)}
        {axes.map(({id}, i) => {
          const [x, y] = point(i, 96);
          return <line className="flood-comparison-chart__guide" data-active={active === i || undefined} key={id} x1={120} y1={120} x2={x} y2={y} />;
        })}
        {series.map((item, index) => {
          const points = item.values.map((value, i) => finite(value) ? point(i, fraction(value, ...bounds) * 96) : null);
          const firstGap = points.findIndex(p => p === null);
          const complete = firstGap < 0;
          const ordered = complete ? points : [...points.slice(firstGap + 1), ...points.slice(0, firstGap + 1)];
          return <g key={item.id} data-series={index}>
            {complete ? <polygon className="flood-comparison-chart__radar-profile" points={points.map(p => p?.join(",")).join(" ")} /> :
              <Polyline points={ordered} />}
          </g>;
        })}
        {axes.map(({id}, i) => {
          const before = point(i - .5, 115);
          const after = point(i + .5, 115);
          return <path className="flood-comparison-chart__hit" key={id} data-chart-hit={i}
            d={`M120 120L${before.join(" ")}A115 115 0 0 1 ${after.join(" ")}Z`} />;
        })}
        </svg>
        {axes.map(({id}, i) => {
          const [x, y] = point(i, 108);
          return <Text className="flood-comparison-chart__radar-index" size="helper" tone="subtle"
            key={id} style={{left: x / 2.4 + "%", top: y / 2.4 + "%"}}>{i + 1}</Text>;
        })}
      </div>
      <div className="flood-comparison-chart__radar-key" aria-hidden="true">
        {axes.map(({id, label}, i) => <Text size="helper" dir="auto" key={id} data-chart-hit={i}
          data-active={active === i || undefined}>{i + 1}. {label}</Text>)}
      </div>
      <Text className="flood-comparison-chart__radar-scale" size="helper" aria-hidden="true">{formatValue(bounds[0])}–{formatValue(bounds[1])}</Text>
    </div>
  } />;
});

export type SankeyChartNode = Named;

export interface SankeyChartLink {
  id: string;
  source: string;
  target: string;
  value: number;
}

export interface SankeyChartProps extends ComparisonChartProps {
  nodes: readonly SankeyChartNode[];
  /** Every link must be positive and finite. The graph must be acyclic. */
  links: readonly SankeyChartLink[];
  formatValue?: (value: number) => string;
  valueLabel?: string;
}

function sankeyLayout(nodes: readonly SankeyChartNode[], links: readonly SankeyChartLink[]) {
  validateNames(nodes, "SankeyChart nodes");
  const ids = new Set<string>();
  const byId = new Map(nodes.map(node => [node.id, {
    ...node, depth: 0, degree: 0, incoming: 0, outgoing: 0, x: 0, y: 0, nextStart: 0, nextEnd: 0,
    links: [] as SankeyChartLink[],
  }]));
  for (const link of links) {
    const source = byId.get(link.source);
    const target = byId.get(link.target);
    if (!link.id.trim() || ids.has(link.id) || !source || !target || source === target || !Number.isFinite(link.value) || link.value <= 0) {
      throw new Error("Flood SankeyChart needs positive finite links with unique IDs and existing distinct nodes");
    }
    ids.add(link.id);
    source.links.push(link);
    source.outgoing += link.value;
    target.incoming += link.value;
    target.degree++;
    if (!Number.isFinite(source.outgoing) || !Number.isFinite(target.incoming)) throw new RangeError("Flood SankeyChart node totals must be finite");
  }
  const ready = [...byId.values()].filter(node => node.degree === 0);
  let maxDepth = 0;
  for (let i = 0; i < ready.length; i++) {
    const source = ready[i];
    for (const link of source.links) {
      const target = byId.get(link.target)!;
      target.depth = Math.max(target.depth, source.depth + 1);
      maxDepth = Math.max(maxDepth, target.depth);
      if (--target.degree === 0) ready.push(target);
    }
  }
  if (ready.length !== nodes.length) throw new Error("Flood SankeyChart requires an acyclic graph");
  const columns = Array.from({length: maxDepth + 1}, () => [] as typeof ready);
  for (const node of byId.values()) if (node.incoming || node.outgoing) columns[node.depth].push(node);
  const metric = (node: (typeof ready)[number]) => Math.max(node.incoming, node.outgoing);
  const pad = 10;
  const nodeWidth = Math.min(12, (width - 2 * pad) / Math.max(1, maxDepth * 2));
  const largestNode = [...byId.values()].reduce((max, node) => Math.max(max, metric(node)), 0);
  const scaled = (value: number) => largestNode === 0 ? 0 : value / largestNode;
  const maxGaps = columns.reduce((max, column) => Math.max(max, column.length - 1), 1);
  const gap = Math.min(12, (height - 2 * pad) * .45 / maxGaps);
  const totalHeight = (column: typeof ready) => column.reduce((total, node) => total + scaled(metric(node)), 0);
  const units = columns.reduce((min, column) => {
    const total = totalHeight(column);
    return total ? Math.min(min, (height - 2 * pad - gap * (column.length - 1)) / total) : min;
  }, Infinity);
  columns.forEach((column, depth) => {
    const x = pad + (width - 2 * pad - nodeWidth) * depth / Math.max(1, maxDepth);
    let y = (height - totalHeight(column) * units - gap * (column.length - 1)) / 2;
    for (const node of column) {
      node.x = x;
      node.y = y;
      node.nextStart = y + scaled(metric(node) - node.outgoing) * units / 2;
      node.nextEnd = y + scaled(metric(node) - node.incoming) * units / 2;
      y += scaled(metric(node)) * units + gap;
    }
  });
  const ribbons = links.map(link => {
    const source = byId.get(link.source)!;
    const target = byId.get(link.target)!;
    const size = scaled(link.value) * units;
    const x = source.x + nodeWidth, z = target.x;
    const start = source.nextStart, end = target.nextEnd;
    const middle = x / 2 + z / 2;
    source.nextStart += size;
    target.nextEnd += size;
    return { link, source, target, path: `M${x} ${start}C${middle} ${start} ${middle} ${end} ${z} ${end}
      V${end + size}C${middle} ${end + size} ${middle} ${start + size} ${x} ${start + size}Z` };
  });
  const markers = columns.flat().map(node => ({...node, size: scaled(metric(node)) * units}));
  return {ribbons, markers, nodeWidth};
}

/** Trace the movement of a quantity through an acyclic network. */
export const SankeyChart = /* @__PURE__ */ forwardRef<HTMLDivElement, SankeyChartProps>(function SankeyChart({
  nodes, links, formatValue = number.format, valueLabel = "Flow", ...props
}, ref) {
  const {ribbons, markers, nodeWidth} = sankeyLayout(nodes, links);
  const delimiter = " → ";
  const entries = ribbons.map(({link, source, target}) => ({
    id: link.id, label: source.label + delimiter + target.label, values: [valueReading(valueLabel, link.value, formatValue)],
  }));
  return <ChartFrame {...props} innerRef={ref} entries={entries} plot={active => {
    const picked = ribbons[active];
    return <div className="flood-comparison-chart__sankey">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {ribbons.map(({link, path}, index) => <path key={link.id} data-chart-hit={index} d={path}
          className="flood-comparison-chart__ribbon" data-active={active === index || undefined} />)}
        {markers.map(node => <rect key={node.id} className="flood-comparison-chart__node"
          x={node.x} y={node.y} width={nodeWidth} height={node.size} rx={2}
          data-active={node.id === picked?.source.id || node.id === picked?.target.id || undefined} />)}
      </svg>
      <div className="flood-comparison-chart__sankey-key" aria-hidden="true">
        {entries.map((entry, i) => <div key={entry.id} data-chart-hit={i} data-active={i === active || undefined}>
          <Text size="helper" dir="auto">{entry.label}</Text><Text size="helper">{entry.values[0].formattedValue}</Text>
        </div>)}
      </div>
    </div>;
  }} />;
});
