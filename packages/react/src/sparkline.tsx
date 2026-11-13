import { forwardRef, useId } from "react";
import { Text, type SparklineProps } from "./index.js";

const plotWidth = 96;
const plotHeight = 32;
const plotInset = 3;

function isObservation(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getPlot(values: SparklineProps["values"], domain: SparklineProps["domain"], area: boolean) {
  let observedMin = Infinity;
  let observedMax = -Infinity;
  for (const value of values) {
    if (isObservation(value)) {
      observedMin = Math.min(observedMin, value);
      observedMax = Math.max(observedMax, value);
    }
  }
  if (observedMin === Infinity) return null;

  const [min, max] = domain && Number.isFinite(domain[0]) && Number.isFinite(domain[1]) && domain[0] < domain[1]
    ? domain
    : [observedMin, observedMax];
  const span = max - min;
  const commands: string[] = [];
  const areas: string[] = [];
  const markers: { x: number; y: number; index: number }[] = [];
  let lastPoint: (typeof markers)[number] | undefined;
  let segmentStart = 0;
  let segmentStartX = "";

  for (const [index, value] of values.entries()) {
    if (!isObservation(value)) continue;
    const clamped = Math.min(max, Math.max(min, value));
    // Halve the operands before subtracting if the finite bounds span more than Number.MAX_VALUE.
    const fraction = span === 0 ? 0.5 : Number.isFinite(span)
      ? (clamped - min) / span
      : (clamped / 2 - min / 2) / (max / 2 - min / 2);
    const x = values.length === 1 ? plotWidth / 2 : plotInset + index * (plotWidth - 2 * plotInset) / (values.length - 1);
    const y = plotHeight - plotInset - fraction * (plotHeight - 2 * plotInset);
    const continuesLine = isObservation(values[index - 1]);
    const plotX = x.toFixed(2);
    if (!continuesLine) {
      segmentStart = commands.length;
      segmentStartX = plotX;
    }
    commands.push(`${continuesLine ? "L" : "M"}${plotX} ${y.toFixed(2)}`);

    lastPoint = { x, y, index };
    if (!isObservation(values[index + 1])) {
      if (!continuesLine) markers.push(lastPoint);
      else if (area) areas.push(`${commands.slice(segmentStart).join(" ")} L${plotX} ${plotHeight} H${segmentStartX} Z`);
    }
  }
  if (lastPoint && markers.at(-1) !== lastPoint) markers.push(lastPoint);

  return { path: commands.join(" "), area: areas.join(" "), markers, lastPoint };
}

const markerPath = ({ x, y }: { x: number; y: number }) => `M${x.toFixed(2)} ${y.toFixed(2)}h0`;

export const TrendPlot = /* @__PURE__ */ forwardRef<HTMLDivElement, SparklineProps>(function TrendPlot(
  { values, domain, label, showLabel, size, tone, variant, className, ...props }, ref,
) {
  const gradientId = useId();
  const plot = getPlot(values, domain, variant === "area");

  return (
    <div {...props} ref={ref} className={["flood-sparkline", className].filter(Boolean).join(" ")}
      data-size={size} data-tone={tone} role="img" aria-label={label}>
      {plot ? (
        <svg className="flood-sparkline__plot" viewBox={`0 0 ${plotWidth} ${plotHeight}`}
          preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {plot.area && <>
            <defs><linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop stopColor="currentColor" stopOpacity=".42" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient></defs>
            <path className="flood-sparkline__area" d={plot.area} fill={`url(#${gradientId})`} />
          </>}
          <path className="flood-sparkline__line" d={plot.path} />
          {plot.lastPoint && <path className="flood-sparkline__halo" d={markerPath(plot.lastPoint)} />}
          {plot.markers.map(point => (
            <path key={point.index} className="flood-sparkline__point" d={markerPath(point)}
              data-latest={point === plot.lastPoint || undefined} />
          ))}
        </svg>
      ) : (
        <Text className="flood-sparkline__empty" size="helper" tone="subtle" aria-hidden="true">—</Text>
      )}
      {showLabel && <Text className="flood-sparkline__label" size="helper" tone="subtle" aria-hidden="true">{label}</Text>}
    </div>
  );
});
