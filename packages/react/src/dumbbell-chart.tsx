import { forwardRef, useId, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Inline, Surface, Text, VisuallyHidden, type DumbbellChartProps } from "./index.js";

const number = new Intl.NumberFormat("en", { maximumSignificantDigits: 21 });

export const DumbbellPlot = /* @__PURE__ */ forwardRef<HTMLDivElement, DumbbellChartProps>(function DumbbellPlot({
  label, items, domain, beforeLabel = "Before", afterLabel = "After", missingLabel = "No data",
  emptyLabel = "No observations", formatValue = number.format,
  navigationLabel = "Use arrow keys to explore groups, or Home and End to jump.", className, ...props
}, ref) {
  const instructions = useId();
  const [cursor, setCursor] = useState(0);
  const [hover, setHover] = useState<number>();
  const [tap, setTap] = useState<number>();
  const [focused, setFocused] = useState(false);
  const ids = new Set<string>();
  let low = Infinity;
  let high = -Infinity;
  for (const item of items) {
    if (!item.id.trim() || ids.has(item.id) || !item.label.trim()) throw new Error("Flood DumbbellChart needs unique IDs and nonempty labels");
    ids.add(item.id);
    for (const value of [item.before, item.after]) {
      if (value === null) continue;
      if (!Number.isFinite(value)) throw new RangeError("Flood DumbbellChart endpoints must be finite");
      low = Math.min(low, value);
      high = Math.max(high, value);
    }
  }
  if (domain && (!Number.isFinite(domain[0]) || !Number.isFinite(domain[1]) ||
    domain[0] >= domain[1] || domain[0] > low || domain[1] < high)) {
    throw new RangeError("Flood DumbbellChart domain must contain all observed endpoints and have finite increasing bounds");
  }
  const [min, max] = domain ?? [low, high];
  const span = max - min;
  const position = (value: number) => span === 0 ? 50 : 100 * (Number.isFinite(span)
    ? (value - min) / span : (value / 2 - min / 2) / (max / 2 - min / 2));
  const last = items.length - 1;
  const active = Math.min(last, hover ?? tap ?? cursor);
  const item = items[active];
  const inspecting = hover !== undefined || tap !== undefined || focused;
  const values = item ? [item.before, item.after].map(value => value === null ? missingLabel : formatValue(value)) : [];
  const valueText = item && `${item.label}, ${beforeLabel}: ${values[0]}, ${afterLabel}: ${values[1]}`;

  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    let next: number;
    switch (event.key) {
      case "ArrowDown": case "ArrowRight": next = active + 1; break;
      case "ArrowUp": case "ArrowLeft": next = active - 1; break;
      case "Home": next = 0; break;
      case "End": next = last; break;
      case "Escape":
        if (inspecting) event.preventDefault();
        setHover(undefined);
        setTap(undefined);
        setFocused(false);
        return;
      default: return;
    }
    event.preventDefault();
    setHover(undefined);
    setTap(undefined);
    setFocused(true);
    setCursor(Math.max(0, Math.min(last, next)));
  };

  return <div {...props} ref={ref} className={["flood-dumbbell-chart", className].filter(Boolean).join(" ")} role="group" aria-label={label}>
    {low <= high ? <>
      {last > 0 && <VisuallyHidden id={instructions}>{navigationLabel}</VisuallyHidden>}
      <div className="flood-dumbbell-chart__plot" dir="ltr" role={last > 0 ? "slider" : "img"} tabIndex={0}
        aria-label={last > 0 ? label : `${label}. ${valueText}`} aria-describedby={last > 0 ? instructions : undefined}
        aria-valuemin={last > 0 ? 1 : undefined} aria-valuemax={last > 0 ? items.length : undefined}
        aria-valuenow={last > 0 ? active + 1 : undefined} aria-valuetext={last > 0 ? valueText : undefined}
        onFocus={event => setFocused(event.currentTarget.matches(":focus-visible"))} onBlur={() => setFocused(false)}
        onKeyDown={navigate} onPointerLeave={() => setHover(undefined)}>
        <div className="flood-dumbbell-chart__rows" aria-hidden="true">
          {items.map(({id, label: name, before, after}, index) => {
            const start = before === null ? undefined : position(before);
            const end = after === null ? undefined : position(after);
            return <div className="flood-dumbbell-chart__row" key={id} data-active={inspecting && index === active || undefined}
              onPointerEnter={event => { if (event.pointerType !== "touch") setHover(index); }}
              onPointerUp={event => { if (event.pointerType === "touch") setTap(previous => previous === index ? undefined : index); }}>
              <Text className="flood-dumbbell-chart__name" size="helper" tone="subtle" dir="auto" title={name}>{name}</Text>
              <div className="flood-dumbbell-chart__track">
                {start !== undefined && end !== undefined && <span className="flood-dumbbell-chart__connector"
                  style={{left:`${Math.min(start, end)}%`, width:`${Math.abs(end - start)}%`}} />}
                {start !== undefined && <span className="flood-dumbbell-chart__point" data-point="before" style={{left:`${start}%`}} />}
                {end !== undefined && <span className="flood-dumbbell-chart__point" data-point="after" style={{left:`${end}%`}} />}
              </div>
              {inspecting && index === active && <Surface className="flood-chart__tooltip flood-dumbbell-chart__tooltip"
                padding="2" elevation="raised" data-side={index < items.length / 2 ? "below" : "above"}
                style={{"--flood-dumbbell-anchor": (end ?? start ?? 50) / 100} as CSSProperties}>
                <Text size="helper" dir="auto">{name}</Text>
                <Inline gap="2" className="flood-dumbbell-chart__reading"><Text size="helper" tone="subtle">{beforeLabel}</Text><Text size="helper">{values[0]}</Text></Inline>
                <Inline gap="2" className="flood-dumbbell-chart__reading"><Text size="helper" tone="subtle">{afterLabel}</Text><Text size="helper">{values[1]}</Text></Inline>
              </Surface>}
            </div>;
          })}
        </div>
        <div className="flood-dumbbell-chart__axis" aria-hidden="true">
          <Text size="helper" tone="subtle">{formatValue(min)}</Text>
          {min !== max && <Text size="helper" tone="subtle">{formatValue(max)}</Text>}
        </div>
      </div>
      <Inline gap="4" className="flood-dumbbell-chart__legend" aria-hidden="true">
        <Inline gap="2" align="center"><span className="flood-dumbbell-chart__key" data-point="before" /><Text size="helper" tone="subtle">{beforeLabel}</Text></Inline>
        <Inline gap="2" align="center"><span className="flood-dumbbell-chart__key" data-point="after" /><Text size="helper" tone="subtle">{afterLabel}</Text></Inline>
      </Inline>
    </> : <Text size="compact" tone="subtle">{emptyLabel}</Text>}
  </div>;
});
