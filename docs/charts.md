# Charts

[Try the three latency charts](https://flood.md/docs/charts#latency-example)
with one shared service filter, or pick a chart below and copy its React example.
For setup in React or Next.js, see [Installation](installation.md).

## Trends and comparisons

- [LineChart](https://flood.md/components/line-chart) shows how a measure changes over time. Compare this week with last week on the same scale.
- [Sparkline](https://flood.md/components/sparkline) shows a small trend beside a value in a table or summary.
- [BarChart](https://flood.md/components/bar-chart) compares categories. Group series to compare actual and planned values, or use percent stacks to compare their shares.
- [BarList](https://flood.md/components/bar-list) ranks named values, such as traffic sources, where the labels and counts matter as much as the bars.
- [BulletChart](https://flood.md/components/bullet-chart) compares a single value with a target and optional reference bands.

## Distributions and relationships

- [Histogram](https://flood.md/components/histogram) shows how often values fall into intervals. Use it to see whether requests cluster near 100 ms or have a long tail.
- [BoxPlot](https://flood.md/components/box-plot) compares the median, quartiles and endpoints across groups, such as latency by service.
- [ScatterChart](https://flood.md/components/scatter-chart) shows the relationship between two measurements, such as throughput and response time.
- [Heatmap](https://flood.md/components/heatmap) shows patterns across two dimensions, such as activity by day and hour.
- [RangeChart](https://flood.md/components/range-chart) shows an interval for each item, such as a forecast range.

## Parts of a whole and change

- [DonutChart](https://flood.md/components/donut-chart) shows a few shares of one whole, such as spending by category.
- [WaterfallChart](https://flood.md/components/waterfall-chart) explains how individual increases and decreases add up to a final value.
- [DumbbellChart](https://flood.md/components/dumbbell-chart) compares two values for each category, such as before and after a rollout.

## Inspecting values

Give each chart a name that includes its measure. Keep units consistent across
axis labels and value formatting. Hover or focus interactive plots to inspect
values, then use the arrow keys to move through the data. Where readers need to
scan or copy many exact values, provide the data in a table alongside the chart.
