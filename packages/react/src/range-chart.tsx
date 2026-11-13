import { forwardRef, useId, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Surface, Text, VisuallyHidden, type RangeChartProps } from "./index.js";

const number = new Intl.NumberFormat("en", { maximumSignificantDigits: 21 });

export const RangePlot = /* @__PURE__ */ forwardRef<HTMLDivElement, RangeChartProps>(function RangePlot({
  label, items, domain, formatValue = value => number.format(value),
  lowLabel = "Low", highLabel = "High", midpointLabel = "Midpoint",
  emptyLabel = "No observations", missingLabel = "No data",
  navigationLabel = "Use the arrow keys to explore categories, or Home and End to jump.",
  className, ...props
}, ref) {
  const instructions = useId();
  const [cursor, setCursor] = useState(0);
  const [hovered, setHovered] = useState<number>();
  const [tapped, setTapped] = useState<number>();
  const [focused, setFocused] = useState(false);
  let min = Infinity;
  let max = -Infinity;
  const ids = new Set<string>();
  const intervals = items.map(item => {
    const {id, label: name, low, high, midpoint} = item;
    if (!id.trim() || ids.has(id) || !name.trim()) {
      throw new Error("Flood RangeChart needs unique item IDs and nonempty labels");
    }
    ids.add(id);
    if ((low !== null && !Number.isFinite(low)) || (high !== null && !Number.isFinite(high)) ||
        (midpoint !== undefined && !Number.isFinite(midpoint))) {
      throw new RangeError("Flood RangeChart bounds and midpoints must be finite");
    }
    if (low === null || high === null) return undefined;
    if (low > high || (midpoint !== undefined && (midpoint < low || midpoint > high))) {
      throw new RangeError("Flood RangeChart midpoint must lie within its ordered bounds");
    }
    min = Math.min(min, low);
    max = Math.max(max, high);
    return {low, high, midpoint};
  });
  const hasData = min <= max;
  if (domain && (!Number.isFinite(domain[0]) || !Number.isFinite(domain[1]) ||
      domain[0] >= domain[1] || (hasData && (domain[0] > min || domain[1] < max)))) {
    throw new RangeError("Flood RangeChart domain must contain all complete intervals and have finite increasing bounds");
  }
  const [floor, ceiling] = domain ?? [min, max];
  const span = ceiling - floor;
  const scale = (value: number) => span === 0 ? .5 : Number.isFinite(span)
    ? (value - floor) / span
    : (value / 2 - floor / 2) / (ceiling / 2 - floor / 2);

  const last = items.length - 1;
  const active = Math.min(hovered ?? tapped ?? cursor, last);
  const inspecting = hovered !== undefined || tapped !== undefined || focused;
  const current = intervals[active];
  const readings = current ? [
    {name: highLabel, value: formatValue(current.high)},
    ...(current.midpoint === undefined ? [] : [{name: midpointLabel, value: formatValue(current.midpoint)}]),
    {name: lowLabel, value: formatValue(current.low)},
  ] : [];
  const accessibleValue = [items[active]?.label, ...(current
    ? readings.map(reading => `${reading.name}: ${reading.value}`)
    : [missingLabel])].filter(Boolean).join(", ");
  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    let next: number;
    switch (event.key) {
      case "ArrowRight": case "ArrowUp": next = active + 1; break;
      case "ArrowLeft": case "ArrowDown": next = active - 1; break;
      case "Home": next = 0; break;
      case "End": next = last; break;
      case "Escape":
        setHovered(undefined);
        setTapped(undefined);
        setFocused(false);
        return;
      default: return;
    }
    event.preventDefault();
    setHovered(undefined);
    setTapped(undefined);
    setFocused(true);
    setCursor(Math.max(0, Math.min(last, next)));
  };

  return <div {...props} ref={ref} className={["flood-range-chart", className].filter(Boolean).join(" ")} role="group" aria-label={label}>
    {hasData ? <>
      {last > 0 && <VisuallyHidden id={instructions}>{navigationLabel}</VisuallyHidden>}
      <div className="flood-range-chart__plot" dir="ltr"
        style={{"--flood-range-columns": items.length} as CSSProperties}
        role={last > 0 ? "slider" : "img"} tabIndex={last > 0 ? 0 : undefined}
        aria-label={last > 0 ? label : accessibleValue}
        aria-describedby={last > 0 ? instructions : undefined}
        aria-valuemin={last > 0 ? 1 : undefined} aria-valuemax={last > 0 ? items.length : undefined}
        aria-valuenow={last > 0 ? active + 1 : undefined} aria-valuetext={last > 0 ? accessibleValue : undefined}
        onKeyDown={navigate}
        onFocus={event => setFocused(event.currentTarget.matches(":focus-visible"))}
        onBlur={() => setFocused(false)}
        onPointerLeave={() => setHovered(undefined)}>
        <div className="flood-range-chart__columns" aria-hidden="true">
          {items.map((item, index) => {
            const interval = intervals[index];
            return <div key={item.id} className="flood-range-chart__column"
              data-active={inspecting && index === active || undefined}
              onPointerEnter={event => { if (event.pointerType !== "touch") setHovered(index); }}
              onPointerUp={event => { if (event.pointerType === "touch") setTapped(previous => previous === index ? undefined : index); }}>
              <div className="flood-range-chart__track">
                {interval && <>
                  <span className="flood-range-chart__band" style={{
                    insetBlockStart: `${(1 - scale(interval.high)) * 100}%`,
                    insetBlockEnd: interval.low === interval.high ? undefined : `${scale(interval.low) * 100}%`,
                  }} data-flat={interval.low === interval.high || undefined} />
                  {interval.midpoint !== undefined && <span className="flood-range-chart__midpoint"
                    style={{insetBlockStart: `${(1 - scale(interval.midpoint)) * 100}%`}} />}
                </>}
              </div>
              <Text className="flood-range-chart__category" size="helper" tone="subtle" dir="auto" title={item.label}>{item.label}</Text>
            </div>;
          })}
        </div>
        {inspecting && <Surface className="flood-chart__tooltip flood-range-chart__tooltip" padding="2" elevation="raised" aria-hidden="true"
          style={{
            "--flood-range-position": `${(active + .5) / items.length * 100}%`,
            "--flood-range-tip-side": active >= items.length / 2 ? -1 : 0,
          } as CSSProperties}>
          <Text size="helper">{items[active].label}</Text>
          {current ? readings.map((reading, index) => <div className="flood-range-chart__reading" key={index}>
            <Text size="helper" tone="subtle">{reading.name}</Text>
            <Text size="helper">{reading.value}</Text>
          </div>) : <Text size="helper" tone="subtle">{missingLabel}</Text>}
        </Surface>}
      </div>
    </> : <Text className="flood-range-chart__empty" size="compact" tone="subtle">{emptyLabel}</Text>}
  </div>;
});
