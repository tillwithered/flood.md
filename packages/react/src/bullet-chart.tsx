import { forwardRef, type CSSProperties } from "react";
import { Inline, Meter, Stack, Text, type BulletChartProps } from "./index.js";

const defaultNumber = new Intl.NumberFormat("en", { maximumSignificantDigits: 21 });

export const BulletPlot = /* @__PURE__ */ forwardRef<HTMLDivElement, BulletChartProps>(function BulletPlot(
  {
    label, items, max, formatValue = defaultNumber.format, valueLabel = "Actual",
    targetLabel = "Target", emptyLabel = "No data", className, ...props
  }, ref,
) {
  const ids = new Set<string>();
  let largest = 0;
  for (const { id, label: itemLabel, value, target } of items) {
    if (!id.trim() || ids.has(id) || !itemLabel.trim()) {
      throw new Error("Flood BulletChart needs unique IDs and nonempty row labels");
    }
    if (!Number.isFinite(value) || value < 0 || !Number.isFinite(target) || target < 0) {
      throw new RangeError("Flood BulletChart actual and target values must be finite and nonnegative");
    }
    ids.add(id);
    largest = Math.max(largest, value, target);
  }
  const limit = max ?? (largest || 1);
  if (!Number.isFinite(limit) || limit <= 0 || limit < largest) {
    throw new RangeError("Flood BulletChart max must be finite, positive and at least the largest actual or target");
  }

  return <div {...props} ref={ref} className={["flood-bullet-chart", className].filter(Boolean).join(" ")} role="group" aria-label={label}>
    {items.length ? <ul className="flood-bullet-chart__items" role="list">
      {items.map(item => {
        const actual = formatValue(item.value);
        const target = formatValue(item.target);
        return <li key={item.id}>
          <Stack gap="2">
            <Inline gap="2" align="baseline" className="flood-bullet-chart__caption" aria-hidden="true">
              <Text size="compact">{item.label}</Text>
              <Inline gap="2" align="baseline" className="flood-bullet-chart__numbers">
                <Text size="compact" className="flood-bullet-chart__actual">{actual}</Text>
                <Text size="helper" tone="subtle">{targetLabel} {target}</Text>
              </Inline>
            </Inline>
            <div className="flood-bullet-chart__plot" data-zero={item.value === 0 || undefined}>
              <Meter label={item.label} value={item.value} max={limit} tone="accent" hideLabel
                valueText={`${valueLabel}: ${actual}, ${targetLabel}: ${target}`} />
              <span aria-hidden="true" className="flood-bullet-chart__target"
                style={{ "--flood-bullet-target": `${item.target / limit * 100}%` } as CSSProperties} />
            </div>
          </Stack>
        </li>;
      })}
    </ul> : <Text size="compact" tone="subtle">{emptyLabel}</Text>}
  </div>;
});
