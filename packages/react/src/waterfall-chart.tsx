import { forwardRef, useId, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Surface, Text, VisuallyHidden, type WaterfallChartProps } from "./index.js";

const number = new Intl.NumberFormat("en", { maximumSignificantDigits: 21 });

export const WaterfallPlot = /* @__PURE__ */ forwardRef<HTMLDivElement, WaterfallChartProps>(function WaterfallPlot({
  label, steps, domain, formatValue = number.format, changeLabel = "Change", totalLabel = "Total",
  emptyLabel = "No steps", navigationLabel = "Use arrow keys to explore steps, or Home and End to jump.",
  className, ...props
}, ref) {
  const instructions = useId();
  const [cursor, setCursor] = useState(0);
  const [hovered, setHovered] = useState<number>();
  const [tapped, setTapped] = useState<number>();
  const [focused, setFocused] = useState(false);
  const ids = new Set<string>();
  let running = 0;
  let low = 0;
  let high = 0;
  const bars = steps.map(step => {
    if (!step.id.trim() || ids.has(step.id) || !step.label.trim() || !Number.isFinite(step.value)) {
      throw new Error("Flood WaterfallChart needs unique step IDs, labels and finite values");
    }
    ids.add(step.id);
    const total = step.kind === "total";
    const start = total ? 0 : running;
    const end = start + step.value;
    if (!Number.isFinite(end)) throw new RangeError("Flood WaterfallChart running totals must be finite");
    low = Math.min(low, start, end);
    high = Math.max(high, start, end);
    running = end;
    return { ...step, start, end, total };
  });
  if (domain && (!Number.isFinite(domain[0]) || !Number.isFinite(domain[1]) ||
      domain[0] >= domain[1] || domain[0] > low || domain[1] < high)) {
    throw new RangeError("Flood WaterfallChart domain must contain zero and all running totals");
  }
  const [min, max] = domain ?? [low, low === high ? 1 : high];
  const span = max - min;
  const percent = (value: number) => 100 * (Number.isFinite(span)
    ? (value - min) / span
    : (value / 2 - min / 2) / (max / 2 - min / 2));
  const last = bars.length - 1;
  const active = Math.min(last, hovered ?? tapped ?? cursor);
  const current = bars[active];
  const inspecting = hovered !== undefined || tapped !== undefined || focused;
  const change = current && !current.total ? `${current.value > 0 ? "+" : ""}${formatValue(current.value)}` : undefined;
  const total = current ? formatValue(current.end) : undefined;
  const accessible = current && [current.label, ...(change === undefined ? [] : [`${changeLabel}: ${change}`]), `${totalLabel}: ${total}`].join(", ");

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
    setCursor(Math.max(0, Math.min(next, last)));
  };
  return <div {...props} ref={ref} className={["flood-waterfall-chart", className].filter(Boolean).join(" ")} role="group" aria-label={label}>
    {current ? <>
      {last > 0 && <VisuallyHidden id={instructions}>{navigationLabel}</VisuallyHidden>}
      <div className="flood-waterfall-chart__plot" dir="ltr" role={last > 0 ? "slider" : "img"} tabIndex={last > 0 ? 0 : undefined}
        aria-label={last > 0 ? label : accessible} aria-describedby={last > 0 ? instructions : undefined}
        aria-valuemin={last > 0 ? 1 : undefined} aria-valuemax={last > 0 ? bars.length : undefined}
        aria-valuenow={last > 0 ? active + 1 : undefined} aria-valuetext={last > 0 ? accessible : undefined}
        style={{"--flood-waterfall-columns": bars.length, "--flood-waterfall-zero": 1 - percent(0) / 100} as CSSProperties}
        onFocus={event => setFocused(event.currentTarget.matches(":focus-visible"))} onBlur={() => setFocused(false)}
        onKeyDown={navigate} onPointerLeave={() => setHovered(undefined)}>
        <div className="flood-waterfall-chart__columns" aria-hidden="true">
          {bars.map((bar, index) => {
            const start = percent(bar.start);
            const end = percent(bar.end);
            const next = bars[index + 1];
            const connectBefore = index > 0 && (!bar.total || bars[index - 1].end === bar.end);
            const connectAfter = next && (!next.total || bar.end === next.end);
            return <div className="flood-waterfall-chart__column" key={bar.id}
              data-active={inspecting && index === active || undefined}
              onPointerEnter={event => { if (event.pointerType !== "touch") setHovered(index); }}
              onPointerUp={event => { if (event.pointerType === "touch") setTapped(previous => previous === index ? undefined : index); }}>
              <div className="flood-waterfall-chart__track">
                {connectBefore && <span className="flood-waterfall-chart__connector" data-side="before"
                  style={{ insetBlockEnd: `${bar.total ? end : start}%` }} />}
                {connectAfter && <span className="flood-waterfall-chart__connector" data-side="after"
                  style={{ insetBlockEnd: `${end}%` }} />}
                <span className="flood-waterfall-chart__bar"
                  data-kind={bar.total ? "total" : bar.value < 0 ? "decrease" : "increase"}
                  data-flat={start === end || undefined}
                  style={{ insetBlockEnd: `${Math.min(start, end)}%`, blockSize: `${Math.abs(start - end)}%` }} />
              </div>
              <Text className="flood-waterfall-chart__category" size="helper" tone="subtle" dir="auto" title={bar.label}>{bar.label}</Text>
            </div>;
          })}
        </div>
        {inspecting && <Surface className="flood-chart__tooltip flood-waterfall-chart__tooltip" elevation="raised" padding="2" aria-hidden="true"
          style={{
            "--flood-waterfall-position": `${(active + .5) / bars.length * 100}%`,
            "--flood-waterfall-tip-side": active >= bars.length / 2 ? -1 : 0,
          } as CSSProperties}>
          <Text size="helper">{current.label}</Text>
          {change !== undefined && <div className="flood-waterfall-chart__reading">
            <Text size="helper" tone="subtle">{changeLabel}</Text><Text size="helper">{change}</Text>
          </div>}
          <div className="flood-waterfall-chart__reading">
            <Text size="helper" tone="subtle">{totalLabel}</Text><Text size="helper">{total}</Text>
          </div>
        </Surface>}
      </div>
    </> : <Text className="flood-waterfall-chart__empty" size="compact" tone="subtle">{emptyLabel}</Text>}
  </div>;
});
