# Charts

[Try the three latency charts](https://flood.md/docs/charts#latency-example)
with one shared service filter, or pick a chart below and copy its React example.
For setup in React or Next.js, see [Installation](installation.md).

## Trends and comparisons

- [LineChart](https://flood.md/components/line-chart) shows how measures change over time. Its area layouts can fill several series or show a cumulative total.
- [ComboChart](https://flood.md/components/combo-chart) compares bars and lines in the same categories, such as subscriptions and churn by month.
- [Sparkline](https://flood.md/components/sparkline) shows a small trend beside a value in a table or summary.
- [BarChart](https://flood.md/components/bar-chart) compares categories. Group series to compare actual and planned values, or use percent stacks to compare their shares.
- [BarList](https://flood.md/components/bar-list) ranks named values, such as traffic sources, where the labels and counts matter as much as the bars.
- [BulletChart](https://flood.md/components/bullet-chart) compares a single value with a target and optional reference bands.

## Distributions and relationships

- [Histogram](https://flood.md/components/histogram) shows how often values fall into intervals. Use it to see whether requests cluster near 100 ms or have a long tail.
- [BoxPlot](https://flood.md/components/box-plot) compares the median, quartiles and endpoints across groups, such as latency by service.
- [ScatterChart](https://flood.md/components/scatter-chart) shows the relationship between two measurements, such as throughput and response time.
- [Heatmap](https://flood.md/components/heatmap) shows patterns across two dimensions, such as activity by day and hour.
- [RadarChart](https://flood.md/components/radar-chart) compares profiles on three or more dimensions that share a scale.
- [RangeChart](https://flood.md/components/range-chart) shows an interval for each item, such as a forecast range.

## Parts of a whole and change

- [DonutChart](https://flood.md/components/donut-chart) shows a few shares of one whole, such as spending by category.
- [CompositionBar](https://flood.md/components/composition-bar) shows the same kind of breakdown in a single horizontal track. The category readouts stay visible in compact cards and panels.
- [WaterfallChart](https://flood.md/components/waterfall-chart) explains how individual increases and decreases add up to a final value.
- [FunnelChart](https://flood.md/components/funnel-chart) shows how much of one cohort reaches each successive stage.
- [SankeyChart](https://flood.md/components/sankey-chart) shows how amounts branch and merge as they move from source to destination.
- [DumbbellChart](https://flood.md/components/dumbbell-chart) compares two values for each category, such as before and after a rollout.

Use DonutChart for a single total with a few categories, especially when the
total is useful in the center. Use CompositionBar when the values should be
readable without inspecting the marks. To compare how those shares change across periods
or groups, use BarChart with `layout="percent"` and keep the series order
consistent. For close comparisons such as 48% versus 44%, provide exact
values in the chart readout or a table.
Flood's default share formatter distinguishes a small positive share that
would round to zero and a partial share that would round to 100%.

## Inspecting values

Give each chart a name that includes its measure. Keep units consistent across
axis labels and value formatting. Hover or focus interactive plots to inspect
values, then use the arrow keys to move through the data. Where readers need to
scan or copy many exact values, provide the data in a table alongside the chart.
In LineChart, BarChart, DonutChart and Histogram, Escape dismisses the active
readout and keeps keyboard focus on the plot. An arrow key resumes inspection.
DonutChart shows the total again when inspection ends. A zero remains an
observation. Use an empty state when the dataset has no observations.
Keyboard focus on an interactive plot uses a compact marker. Heatmap marks the
focused cell. Pointer inspection uses the chart's data highlight.
BoxPlot keeps its exact-value readout available on keyboard focus when a filter
leaves one group. Escape closes the readout and leaves focus on that plot.

ComboChart, FunnelChart, RadarChart and SankeyChart support exploration by
keyboard, pointer and touch. When there are multiple readings, Tab reaches the
whole chart as one target. Arrow keys move through categories, stages, axes or
flows. Home and End jump to the first and last reading. Escape dismisses the
readout and keeps focus.

Use `onInspect` to drive an adjacent metric from the currently inspected value.
LineChart, BarChart, Heatmap, ScatterChart and the four comparison charts pass an entry with
its ID, label, raw observations and formatted readings. A missing observation
has a null value. Dismissal returns null so the metric can show its period total
again. Keep the same data and scale while changing the metric.

## Scatter groups and bubble size

ScatterChart keeps one X and Y scale across groups. Define up to four named
series and assign each observation a `seriesId`. Group membership appears in
the chart key and in inspection. Add a finite nonnegative `size` to encode a
third measure using circle area. Zero uses a hollow mark. Omit size when the
third measure is unavailable. Set the same `sizeMax` on multiple charts when
you want to compare bubble areas across their plots.

```tsx
import { ScatterChart } from "@flood-md/react";

<ScatterChart
  label="Latency by traffic"
  xLabel="Requests per second"
  yLabel="Latency in ms"
  sizeLabel="Sample size"
  series={[{ id: "preview", label: "Preview" }, { id: "production", label: "Production" }]}
  points={[
    { id: "run-a", label: "Run A", seriesId: "preview", x: 35, y: 190, size: 10 },
    { id: "run-b", label: "Run B", seriesId: "production", x: 62, y: 232, size: 40 },
  ]}
  sizeMax={40}
/>;
```

## Multi-series area

LineChart retains its leading-series fill by default. Set `areaLayout="overlay"`
to fill each independent series against the same scale. Set `"stacked"` for
additive series, where positive and negative observations accumulate separately
around zero. Explicit domains must include the cumulative extents and zero.
Use `"percent"` for nonnegative series that contribute to a whole. It fixes the
scale at 0–100% and retains the original values in inspection. Stacked bands use
linear interpolation to keep adjacent boundaries aligned.

```tsx
import { LineChart } from "@flood-md/react";

<LineChart
  label="Traffic by source"
  categories={["Jan", "Feb", "Mar"]}
  series={[
    { id: "direct", label: "Direct", values: [320, 387, 462] },
    { id: "referrals", label: "Referrals", values: [180, 142, 217] },
  ]}
  areaLayout="stacked"
  showYAxis
  showLegend
/>;
```

## Combo, funnel, radar and flow

ComboChart takes up to four series on a shared category axis. Use one Y scale
for comparable units. Assign a series to the right axis only when its units
differ, then label both scales and format their values. A bar axis includes zero.
Use null to leave a gap in a line or omit a bar.

```tsx
import { ComboChart } from "@flood-md/react";

<ComboChart
  label="Subscriptions and churn"
  categories={["Jan", "Feb", "Mar"]}
  series={[
    { id: "subscriptions", label: "Subscriptions", kind: "bar", values: [80, 104, 118] },
    { id: "churn", label: "Churn", kind: "line", axis: "right", values: [6, 4, 3] },
  ]}
  leftAxis={{ label: "Accounts" }}
  rightAxis={{ label: "Churn rate", domain: [0, 10], formatValue: value => value + "%" }}
/>;
```

FunnelChart needs nonnegative values in nonincreasing stage order. Each stage
shows its count and supports inspection of its share of the first stage. A
first stage of zero leaves the shares undefined. Use BarList to compare steps
drawn from independent cohorts.

```tsx
import { FunnelChart } from "@flood-md/react";

<FunnelChart
  label="Trial conversion"
  stages={[
    { id: "visit", label: "Visited", value: 1350 },
    { id: "trial", label: "Started trial", value: 710 },
    { id: "paid", label: "Subscribed", value: 160 },
  ]}
/>;
```

RadarChart needs at least three named axes and supports up to four series.
Use the same unit or a common normalized scale for all axes. Missing values
leave a gap in the profile. Keep the axes in the same order when comparing periods.

```tsx
import { RadarChart } from "@flood-md/react";

<RadarChart
  label="Service health score"
  axes={[
    { id: "uptime", label: "Uptime" },
    { id: "speed", label: "Speed" },
    { id: "support", label: "Support" },
  ]}
  series={[{ id: "this-month", label: "This month", values: [98, 79, 84] }]}
  domain={[0, 100]}
/>;
```

SankeyChart takes uniquely named nodes and directed links with positive finite
amounts in a common unit. Nodes with no links stay out of the plot. Use an
acyclic graph and supply each flow with a stable ID so that inspection survives
reordering. Keep the graph small enough to read at the available width.

```tsx
import { SankeyChart } from "@flood-md/react";

<SankeyChart
  label="Cash flow"
  nodes={[
    { id: "income", label: "Income" },
    { id: "operations", label: "Operations" },
    { id: "reserve", label: "Reserve" },
  ]}
  links={[
    { id: "operations-share", source: "income", target: "operations", value: 75 },
    { id: "reserve-share", source: "income", target: "reserve", value: 25 },
  ]}
/>;
```
