# Sparkline

A compact line or area chart for showing the shape of a short numeric series in a
table cell, list or metric. Values appear in the order supplied.

```tsx
<Sparkline
  label="Revenue rose from $8,000 to $12,000 over six weeks"
  values={[8000, 8200, null, 9500, 11000, 12000]}
  domain={[0, 15000]}
/>
```

Import Sparkline from `@flood-md/react` and render inside FloodRoot with the
shared stylesheet. Provide a meaningful `label` that names the metric and
communicates what the shape means. Set `showLabel` when that explanation
should also be visible. `null` and nonfinite values create gaps in the line.

The default scale is local to the series. Pass the same `domain` to charts
in a column when readers need to compare magnitudes. The caller owns the
units, time span, values and interpretation.

## Chart appearance

`variant="area"` is the default. The stroke carries the data and a gradient
of the same color fades beneath it. Each continuous segment owns its fill,
so gaps in the series remain visible. Use `variant="line"` where the stroke
alone reads more clearly, and `tone="neutral"` for a quieter chart.

The default `tone="accent"` identifies a series. Use success, warning and
error tones for a known business meaning. An upward line can be good for
revenue and bad for error rates. Keep useful values and units readable as
text beside the graph. For a table column, keep the color and interval
consistent across rows showing the same metric.

A slightly larger marker identifies the latest available sample. Hover
strengthens its halo and the fill. With reduced motion, the highlight
changes immediately.
