import { useState, type CSSProperties } from "react";
import { BoxPlot, Grid, Heading, Histogram, Inline, LineChart, SegmentedControl, Stack, Surface } from "@flood-md/react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const services = [
  { id: "api", label: "API", baseline: 110, spread: 2 },
  { id: "search", label: "Search", baseline: 178, spread: 4 },
  { id: "billing", label: "Billing", baseline: 138, spread: 3 },
] as const;
const options = [{ value: "all", label: "All services" }, ...services.map(({ id, label }) => ({ value: id, label }))];
const dailyOffset = [8, 14, -4, 32, 18, -12, -6];
const sampleOffsets = [-18, -12, -8, -4, -2, 0, 2, 4, 8, 12, 18, 27];
const requests = services.flatMap((service, serviceIndex) => days.flatMap((_, day) =>
  sampleOffsets.map((offset, sample) => ({
    service: service.id,
    day,
    latency: service.baseline + dailyOffset[(day + serviceIndex) % days.length] +
      offset * service.spread + (sample * 7 + day * 3) % 9,
  }))));
const milliseconds = (value: number) => `${value} ms`;
const latencyDomain = [0, 350] as const;
const binWidth = 35;
const countBins = (samples: typeof requests) => Array.from({ length: latencyDomain[1] / binWidth }, (_, index) =>
  samples.filter(sample => Math.floor(sample.latency / binWidth) === index).length);
const maxCount = Math.max(...countBins(requests));

function quantile(sorted: readonly number[], fraction: number) {
  const index = (sorted.length - 1) * fraction;
  const lower = Math.floor(index);
  return Math.round(sorted[lower] + (sorted[Math.ceil(index)] - sorted[lower]) * (index - lower));
}

export default function ChartsPlayground({ headingLevel = 1 }: { headingLevel?: 1 | 2 }) {
  const [service, setService] = useState("all");
  const chartHeadingLevel = headingLevel === 1 ? 2 : 3;
  const visibleServices = services.filter(item => service === "all" || item.id === service);
  const samples = requests.filter(sample => service === "all" || sample.service === service);
  const counts = countBins(samples);
  const distributions = visibleServices.map(({ id, label }) => {
    const sorted = samples.filter(sample => sample.service === id).map(sample => sample.latency).sort((a, b) => a - b);
    return { id, label, summary: {
      low: sorted[0], q1: quantile(sorted, .25), median: quantile(sorted, .5),
      q3: quantile(sorted, .75), high: sorted[sorted.length - 1],
    } };
  });
  const medians = days.map((_, day) =>
    quantile(samples.filter(sample => sample.day === day).map(sample => sample.latency).sort((a, b) => a - b), .5));

  return <Stack gap="4">
    <Inline align="center" gap="3" style={{ justifyContent: "space-between" }}>
      <Heading level={headingLevel} size={headingLevel === 1 ? "page" : "section"}>Request latency (ms)</Heading>
      <SegmentedControl name="latency-service" label="Service" hideLabel controlSize="sm"
        value={service} onValueChange={setService} options={options} />
    </Inline>
    <Surface padding="4">
      <Stack gap="3">
        <Heading level={chartHeadingLevel} size="group">Daily median</Heading>
        <LineChart label="Daily median latency" categories={days} domain={latencyDomain} formatValue={milliseconds}
          series={[{ id: "median", label: "Median", values: medians }]} />
      </Stack>
    </Surface>
    <Grid minItemWidth="24rem" gap="4" className="chart-example-distributions" style={{ "--flood-chart-plot-height": "13rem" } as CSSProperties}>
      <Surface padding="4">
        <Stack gap="3">
          <Heading level={chartHeadingLevel} size="group">Request distribution</Heading>
          <Histogram label="Request latency distribution" xLabel="Latency (ms)" showXAxisLabel={false} countLabel="Requests"
            start={latencyDomain[0]} binWidth={binWidth} counts={counts} maxCount={maxCount} />
        </Stack>
      </Surface>
      <Surface padding="4">
        <Stack gap="3">
          <Heading level={chartHeadingLevel} size="group">Spread by service</Heading>
          <BoxPlot label="Latency spread by service" items={distributions} domain={latencyDomain} formatValue={milliseconds} formatAxisValue={String}
            statisticLabels={{ whiskers: "Min–max", low: "Minimum", high: "Maximum" }} />
        </Stack>
      </Surface>
    </Grid>
  </Stack>;
}
