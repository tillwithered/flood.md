import { forwardRef, useId, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Inline, Surface, Text, VisuallyHidden, type HistogramProps } from "./index.js";

const defaultBoundary = new Intl.NumberFormat("en", { maximumSignificantDigits: 12 });
const defaultCount = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });

export const HistogramPlot = /* @__PURE__ */ forwardRef<HTMLDivElement, HistogramProps>(function HistogramPlot({
  label, xLabel, showXAxisLabel = true, start, binWidth, counts, maxCount, countLabel = "Count",
  formatBoundary = defaultBoundary.format, formatCount = defaultCount.format,
  emptyLabel = "No observations", navigationLabel = "Use arrow keys to explore intervals, or Home and End to jump.",
  className, ...props
}, ref) {
  const instructions = useId();
  const [cursor, setCursor] = useState(0);
  const [hovered, setHovered] = useState<number>();
  const [tapped, setTapped] = useState<number>();
  const [focused, setFocused] = useState(false);

  if (!Number.isFinite(start) || !Number.isFinite(binWidth) || binWidth <= 0) {
    throw new RangeError("Flood Histogram requires a finite start and positive finite bin width");
  }
  let largest = 0;
  let previous = start;
  const bins = counts.map((count, i) => {
    const end = start + (i + 1) * binWidth;
    if (!Number.isSafeInteger(count) || count < 0 || !Number.isFinite(end) || end <= previous) {
      throw new RangeError("Flood Histogram requires nonnegative integer counts and increasing finite boundaries");
    }
    const bin = { start: previous, end, count };
    previous = end;
    largest = Math.max(largest, count);
    return bin;
  });
  const limit = maxCount ?? (largest || 1);
  if (!Number.isFinite(limit) || limit <= 0 || limit < largest) {
    throw new RangeError("Flood Histogram maxCount must be finite, positive and at least the largest count");
  }

  const last = bins.length - 1;
  const active = Math.min(last, hovered ?? tapped ?? cursor);
  const selected = bins[active];
  const inspecting = hovered !== undefined || tapped !== undefined || focused;
  const interval = selected && `${formatBoundary(selected.start)}–${formatBoundary(selected.end)}`;
  const value = selected && formatCount(selected.count);
  const valueText = selected && `${xLabel}: ${interval}, ${countLabel}: ${value}`;
  const middle = bins[Math.floor(bins.length / 2)];

  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    let next: number;
    switch (event.key) {
      case "ArrowLeft": case "ArrowDown": next = active - 1; break;
      case "ArrowRight": case "ArrowUp": next = active + 1; break;
      case "Home": next = 0; break;
      case "End": next = last; break;
      case "Escape":
        if (inspecting) event.preventDefault();
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

  return <div {...props} ref={ref} className={["flood-histogram", className].filter(Boolean).join(" ")} role="group" aria-label={label}>
    {selected ? <>
      {last > 0 && <VisuallyHidden id={instructions}>{navigationLabel}</VisuallyHidden>}
      <div className="flood-histogram__plot" dir="ltr" role={last > 0 ? "slider" : "img"} tabIndex={last > 0 ? 0 : undefined}
        aria-label={last > 0 ? label : valueText} aria-describedby={last > 0 ? instructions : undefined}
        aria-valuemin={last > 0 ? 1 : undefined} aria-valuemax={last > 0 ? bins.length : undefined}
        aria-valuenow={last > 0 ? active + 1 : undefined} aria-valuetext={last > 0 ? valueText : undefined}
        onFocus={event => setFocused(event.currentTarget.matches(":focus-visible"))}
        onBlur={() => setFocused(false)} onKeyDown={navigate} onPointerLeave={() => setHovered(undefined)}>
        <div className="flood-histogram__columns" aria-hidden="true">
          {bins.map((bin, i) => <div key={i} className="flood-histogram__bin"
            data-active={inspecting && i === active || undefined}
            onPointerEnter={event => { if (event.pointerType !== "touch") setHovered(i); }}
            onPointerUp={event => { if (event.pointerType === "touch") setTapped(current => current === i ? undefined : i); }}>
            <span className="flood-histogram__bar" data-zero={bin.count === 0 || undefined}
              style={{"--flood-histogram-bin-height": `${bin.count / limit * 100}%`} as CSSProperties} />
          </div>)}
        </div>
        {inspecting && <Surface className="flood-chart__tooltip flood-histogram__tooltip" padding="2" elevation="raised"
          aria-hidden="true" style={{
            "--flood-histogram-active": `${(active + .5) / bins.length * 100}%`,
            "--flood-histogram-half-bin": `${50 / bins.length}%`,
            "--flood-histogram-tip-side": active >= bins.length / 2 ? -1 : 0,
          } as CSSProperties}>
          <Text size="helper">{interval}</Text>
          <Inline gap="2" align="baseline" className="flood-histogram__tooltip-count">
            <Text size="helper" tone="subtle">{countLabel}</Text><Text size="helper">{value}</Text>
          </Inline>
        </Surface>}
      </div>
      <div className="flood-histogram__axis" dir="ltr" aria-hidden="true">
        <Text size="helper" tone="subtle">{formatBoundary(start)}</Text>
        {last > 0 && <Text className="flood-histogram__mid-label" size="helper" tone="subtle"
          style={{left: `${Math.floor(bins.length / 2) / bins.length * 100}%`}}>{formatBoundary(middle.start)}</Text>}
        <Text size="helper" tone="subtle">{formatBoundary(previous)}</Text>
      </div>
      {showXAxisLabel && <Text className="flood-histogram__axis-label" size="helper" tone="subtle" dir="auto" aria-hidden="true">{xLabel}</Text>}
    </> : <Text className="flood-histogram__empty" size="compact" tone="subtle">{emptyLabel}</Text>}
  </div>;
});
